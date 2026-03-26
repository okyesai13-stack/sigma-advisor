

# Pivot Platform to AI-Roles-First Concept

## Current Flow
```text
Career Analysis → Goal Score → AI Roles → Skill Validation → Learning → Projects → Jobs
       ↓                           ↓              ↓
  (general roles)          (AI future roles)  (validates against
                                               career analysis
                                               short-term role)
```

Skill validation, learning plan, project generation, and job matching all currently pull from `career_analysis_result` (general career roles). AI Role Analysis is just step 3 -- an add-on.

## New Flow: AI Roles as the Core
```text
AI Role Analysis → Skill Validation → Learning Plan → Projects → Jobs
       ↓                  ↓                ↓              ↓          ↓
  (3 AI future      (validates against  (courses for    (projects   (jobs for
   roles become      AI role skills)     AI role gaps)   for AI      AI roles)
   the foundation)                                      roles)
```

Remove Career Analysis and Goal Score as separate pipeline steps. AI Role Analysis becomes Step 1, and all downstream steps use the AI roles as their source of truth.

## Changes Required

### 1. Reorder Sigma Pipeline (SigmaNoAuth.tsx)
- Remove `career_analysis` and `goal_score` steps from the pipeline
- New 5-step pipeline: AI Role Analysis → Skill Validation → Learning Plan → Project Ideas → Job Matching
- AI Role Analysis becomes the first step, runs on resume upload
- Update step definitions, chain logic, and UI

### 2. Update AI Role Analysis Edge Function
- Currently depends on `career_analysis_result` for context -- make it standalone
- It already reads resume data directly, just remove the career_analysis dependency
- This function already produces the 3 AI-enhanced roles with skills_required, missing_skills, etc.

### 3. Update Skill Validation Edge Function
- Currently fetches target role from `career_analysis_result.career_roles` (short_term)
- Change to fetch from `ai_role_analysis_result.ai_enhanced_roles` instead
- Validate skills against the top AI role (highest match_score)

### 4. Update Learning Plan Edge Function
- Currently reads `skill_validation_result.missing_skills` -- this stays the same
- But since skill validation now validates against AI roles, the missing skills will automatically be AI-role-focused
- Update the `target_role` context to reference the AI role

### 5. Update Job Matching Edge Function
- Currently uses `career_analysis_result` short-term role as target
- Change to use `ai_role_analysis_result` top AI role instead
- Update prompt to focus on AI-related positions

### 6. Update Dashboard (DashboardNoAuth.tsx)
- Remove or repurpose Career Analysis sections that show general career roles
- Make AI Roles section more prominent (move to top)
- Skill gap analysis should reference AI roles
- Career roadmap should show AI role progression

### 7. Update Setup Page Messaging
- Update labels/copy to reflect AI career focus (e.g., "Your AI Career Goal")

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/SigmaNoAuth.tsx` | Remove career_analysis & goal_score steps, reorder pipeline |
| `supabase/functions/ai-role-analysis/index.ts` | Remove dependency on career_analysis_result |
| `supabase/functions/skill-validation/index.ts` | Fetch target role from ai_role_analysis_result instead of career_analysis_result |
| `supabase/functions/job-matching/index.ts` | Use AI roles as target instead of career roles |
| `supabase/functions/learning-plan/index.ts` | Already uses skill_validation missing_skills -- no major change needed |
| `src/pages/DashboardNoAuth.tsx` | Promote AI Roles section, remove/reduce general career analysis display |
| `src/components/dashboard/AIRolesSection.tsx` | Make this the hero section |

## What Stays the Same
- Resume upload flow
- Learning Hub (AI Tutor, Mind Maps, Quizzes)
- Interview Prep, Mock Interview, Smart Analysis
- Job Finder Agent (already independent)
- Project Builder
- Resume Upgrade

