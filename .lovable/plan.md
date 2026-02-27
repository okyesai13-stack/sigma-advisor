

# Remaining Platform Issues Fix Plan

## Issues Found

### 1. `JobFinderNoAuth.tsx` Still Uses `as any` Casts
The `job_finder_result` table is now in the generated types file, but `JobFinderNoAuth.tsx` (lines 63, 79) still uses `supabase.from('job_finder_result' as any)` and `(supabase.from('job_finder_result' as any) as any)`. These should be removed for type safety.

### 2. `career-analysis` Edge Function Uses `.single()` on `resume_store`
`supabase/functions/career-analysis/index.ts` (line 30) uses `.single()` instead of `.maybeSingle()`. If the resume doesn't exist, it throws a generic Supabase error rather than a clear "Resume not found" message.

### 3. `career-goal-score` Edge Function Uses `.single()` on `resume_store`
`supabase/functions/career-goal-score/index.ts` (line 24) uses `.single()` on `resume_store`. Same issue as above.

### 4. `skill-validation` Edge Function Uses `.single()` on `resume_store`
`supabase/functions/skill-validation/index.ts` (line 30) uses `.single()` instead of `.maybeSingle()`.

### 5. `ai-role-analysis` Edge Function Uses `.single()` on `resume_store`
`supabase/functions/ai-role-analysis/index.ts` (line 35) uses `.single()`.

### 6. `advisor-chat` and `advisor-chat-stream` Use `.single()` on `resume_store`
Both `supabase/functions/advisor-chat/index.ts` (line 55) and `supabase/functions/advisor-chat-stream/index.ts` (line 55) use `.single()` on `resume_store`.

### 7. `career-analysis` Lacks Idempotency
The `career-analysis` edge function inserts a new row on every call but never deletes old rows. If the pipeline is retried, duplicates accumulate. The `career_analysis_result` table currently has no DELETE RLS policy, which would need to be added.

### 8. `skill-validation` Lacks Idempotency
Same issue -- inserts a new row each time without deleting old ones. No DELETE policy exists on `skill_validation_result`.

### 9. `ai-role-analysis` Lacks Idempotency
Same pattern -- no cleanup of old rows, no DELETE policy on `ai_role_analysis_result`.

### 10. `SigmaNoAuth.tsx` Retry Creates Cascading Re-runs
When a user clicks "Retry This Step" on an errored step (e.g., career_analysis), it calls `runCareerAnalysis()` which, upon completion, automatically chains to `runGoalScore()` -> `runAiRoleAnalysis()` -> etc., re-running the entire remaining pipeline. A retry should only re-run the single failed step.

### 11. `SigmaNoAuth.tsx` Missing `useEffect` Dependency
The `useEffect` on line 135 has `resumeId` in the dependency array but references `toast` and `navigate` without including them. While functionally this works because React Router's `navigate` is stable, it's technically a lint issue.

## Technical Changes

### Database Migration
Add DELETE policies for 3 tables that currently lack them, plus add idempotency support:

```sql
-- Allow public delete on career_analysis_result
CREATE POLICY "Anyone can delete career analysis"
  ON public.career_analysis_result FOR DELETE USING (true);

-- Allow public delete on skill_validation_result
CREATE POLICY "Anyone can delete skill validation"
  ON public.skill_validation_result FOR DELETE USING (true);

-- Allow public delete on ai_role_analysis_result
CREATE POLICY "Anyone can delete ai_role_analysis"
  ON public.ai_role_analysis_result FOR DELETE USING (true);
```

### Edge Function Changes

| File | Change |
|------|--------|
| `career-analysis/index.ts` | Change `.single()` to `.maybeSingle()`, add explicit null check, add delete-before-insert idempotency |
| `skill-validation/index.ts` | Change `.single()` to `.maybeSingle()`, add explicit null check, add delete-before-insert idempotency |
| `career-goal-score/index.ts` | Change `.single()` to `.maybeSingle()`, add explicit null check |
| `ai-role-analysis/index.ts` | Change `.single()` to `.maybeSingle()`, add explicit null check, add delete-before-insert idempotency |
| `advisor-chat/index.ts` | Change `.single()` to `.maybeSingle()` on `resume_store` |
| `advisor-chat-stream/index.ts` | Change `.single()` to `.maybeSingle()` on `resume_store` |

### Frontend Changes

| File | Change |
|------|--------|
| `src/pages/JobFinderNoAuth.tsx` | Remove `as any` casts on `job_finder_result` queries (lines 63, 79) |
| `src/pages/SigmaNoAuth.tsx` | Fix retry logic so individual step retry does not cascade into re-running all subsequent steps |

### Retry Fix Pattern
Each step function will accept an optional `continueChain` parameter (default `true`). The retry handler will pass `false` to prevent cascading:

```typescript
const runCareerAnalysis = async (continueChain = true) => {
  // ... existing logic ...
  if (continueChain) runGoalScore();
};

const retryStep = (stepId: StepId) => {
  // Pass false to prevent cascading
  stepRunners[stepId]?.(false);
};
```

### Deployment
- Database migration for 3 new DELETE policies
- Redeploy 6 edge functions: `career-analysis`, `skill-validation`, `career-goal-score`, `ai-role-analysis`, `advisor-chat`, `advisor-chat-stream`

