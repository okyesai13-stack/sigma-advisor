

# Platform Issue Analysis and Fix Plan

## Issues Found

### 1. Database Function `get_journey_state` Missing `goal_score_completed`
The `get_journey_state` RPC function hardcodes which columns it returns. It does NOT include the new `goal_score_completed` column added during the Career Goal Score migration. This means any code relying on this function to check pipeline completion state will never see the goal score flag.

**Fix:** Update the `get_journey_state` database function to include `goal_score_completed` in its returned JSON object and its default state.

### 2. `career_goal_score_result` Table Not in TypeScript Types (Uses `as any` Cast)
In `DashboardNoAuth.tsx` line 146, the query uses `supabase.from('career_goal_score_result' as any)` because the auto-generated types file doesn't include this table. This bypasses type safety and could lead to silent runtime errors.

**Fix:** Regenerate the Supabase types file so `career_goal_score_result` is properly typed, then remove the `as any` cast.

### 3. Duplicate Data on Re-runs (No Idempotency)
Every edge function (career-analysis, skill-validation, learning-plan, project-generation, job-matching, career-goal-score) inserts new rows on every call. If a user retries a step or the pipeline re-runs, duplicate records accumulate. The dashboard fetches with `.limit(1)` for single-result tables but learning plans, project ideas, and job matches fetch ALL rows, causing duplicates to appear.

**Fix:** Add delete-before-insert logic to the 4 multi-row edge functions: `learning-plan`, `project-generation`, `job-matching`, and `career-goal-score`. Before inserting new results, delete existing rows for that `resume_id`.

### 4. `missing_skills` Could Be Objects, Not Strings
The `skill-validation` edge function returns `missing_skills` as an array. The AI may return objects like `{name: "React", priority: "high"}` instead of plain strings. The dashboard casts `missing_skills as string[]` in multiple places (lines 406, 763), which would render `[object Object]` if the AI returns objects.

**Fix:** Normalize `missing_skills` in the `skill-validation` edge function to always be a flat string array before storing.

### 5. Sigma Pipeline Continues After Goal Score Error
In `SigmaNoAuth.tsx` line 216, when `runGoalScore` fails, it calls `runAiRoleAnalysis()` to continue the pipeline. This is correct resilient behavior. However, the error toast doesn't tell users that the pipeline is continuing despite the error, which may cause confusion.

**Fix:** Update the error toast in `runGoalScore` to say "Goal score failed, continuing with remaining steps..."

### 6. `learning-plan` Edge Function Silently Swallows Rate Limit Errors
In the `learning-plan` function (line 94-99), when a per-skill AI call hits a 429/402, it logs the error and returns `null`. The function then continues, and the null results are filtered out. The function reports success even if all skills failed due to rate limiting, returning `{ success: true, data: [] }`.

**Fix:** Track rate limit failures and return an appropriate error response if ALL skill plans failed due to rate limiting.

### 7. `resume_store.select('*').single()` in Multiple Edge Functions
The `project-generation` (line 27) and `job-matching` (line 27) functions use `.single()` instead of `.maybeSingle()` for `resume_store` queries. If the resume doesn't exist, `.single()` throws an error that gets caught as a generic error rather than a clear "Resume not found" message.

**Fix:** Change `.single()` to `.maybeSingle()` and add explicit null checks with clear error messages.

### 8. `career-goal-score` Uses `select('*')` on `career_analysis_result`
The function fetches all columns from `career_analysis_result` but only uses `career_roles`. This is wasteful for large records.

**Fix:** Change to `.select('career_roles')` to fetch only what's needed.

## Technical Changes

### Database Migration
Update the `get_journey_state` function to include `goal_score_completed`:

```sql
CREATE OR REPLACE FUNCTION public.get_journey_state(p_resume_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'career_analysis_completed', COALESCE(career_analysis_completed, false),
    'goal_score_completed', COALESCE(goal_score_completed, false),
    'skill_validation_completed', COALESCE(skill_validation_completed, false),
    'learning_plan_completed', COALESCE(learning_plan_completed, false),
    'project_ideas_completed', COALESCE(project_ideas_completed, false),
    'job_matching_completed', COALESCE(job_matching_completed, false)
  ) INTO result
  FROM public.journey_state
  WHERE resume_id = p_resume_id;

  IF result IS NULL THEN
    INSERT INTO public.journey_state (resume_id)
    VALUES (p_resume_id)
    ON CONFLICT (resume_id) DO NOTHING;

    result := jsonb_build_object(
      'career_analysis_completed', false,
      'goal_score_completed', false,
      'skill_validation_completed', false,
      'learning_plan_completed', false,
      'project_ideas_completed', false,
      'job_matching_completed', false
    );
  END IF;

  RETURN result;
END;
$function$
```

### Edge Function Changes

| File | Change |
|------|--------|
| `supabase/functions/learning-plan/index.ts` | Delete existing plans for resume_id before inserting; track rate limit failures and return error if all failed |
| `supabase/functions/project-generation/index.ts` | Delete existing projects before inserting; change `.single()` to `.maybeSingle()` |
| `supabase/functions/job-matching/index.ts` | Delete existing jobs before inserting; change `.single()` to `.maybeSingle()` |
| `supabase/functions/career-goal-score/index.ts` | Delete existing score before inserting; narrow `career_analysis_result` select to `career_roles` only |
| `supabase/functions/skill-validation/index.ts` | Normalize `missing_skills` to flat string array |

### Frontend Changes

| File | Change |
|------|--------|
| `src/pages/DashboardNoAuth.tsx` | Remove `as any` cast on `career_goal_score_result` query (after types regenerate) |
| `src/pages/SigmaNoAuth.tsx` | Update goal score error toast to indicate pipeline continues |

### Idempotency Pattern (Applied to 4 Functions)
```typescript
// Before inserting new results, clean up old ones
await supabase
  .from('table_name')
  .delete()
  .eq('resume_id', resume_id);
```

### Skill Normalization Pattern
```typescript
// Ensure missing_skills is always string[]
const normalizedMissing = (validation.missing_skills || []).map(
  (s: any) => typeof s === 'string' ? s : (s.name || s.skill || String(s))
);
```

### Files to Modify
- `supabase/functions/learning-plan/index.ts`
- `supabase/functions/project-generation/index.ts`
- `supabase/functions/job-matching/index.ts`
- `supabase/functions/career-goal-score/index.ts`
- `supabase/functions/skill-validation/index.ts`
- `src/pages/SigmaNoAuth.tsx`
- `src/pages/DashboardNoAuth.tsx`

### Deployment
- Database migration for `get_journey_state` function update
- Redeploy 5 edge functions
- Types will auto-regenerate after migration

