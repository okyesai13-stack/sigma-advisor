
# Add Career Challenge Field to Setup and Analysis Pipeline

## Overview
Add a separate "Career Challenge" input field on the setup page alongside the existing goal field, store it in the database, feed it into the AI career analysis, and display challenge-specific insights in the dashboard's Overall Assessment.

## Changes

### 1. Database Migration
Add a `challenge` column to the `resume_store` table:
```sql
ALTER TABLE resume_store ADD COLUMN challenge text DEFAULT NULL;
```

### 2. Setup Page (`src/pages/SetupNoAuth.tsx`)
Split the current single textarea into two distinct sections:
- **Section 1 - Career Goal**: "Your Ultimate Career Goal" (e.g., become a Senior Data Scientist)
- **Section 2 - Career Challenge**: "What challenge are you facing?" (e.g., stuck in current role, skill gaps, no guidance)
- Add a new `challengeText` state variable
- Pass `challenge` to the upload-resume API call

### 3. ResumeContext (`src/contexts/ResumeContext.tsx`)
- Add `challenge` and `setChallenge` to the context
- Add sessionStorage persistence with key `sigma_challenge`
- Include in `clearSession()`

### 4. Upload Resume Edge Function (`supabase/functions/upload-resume/index.ts`)
- Accept `challenge` from the request body
- Store it in the `resume_store` insert as `challenge`

### 5. Resume Image Parse Edge Function (`supabase/functions/resume-image-parse/index.ts`)
- Accept `challenge` from the request body and pass it through to `resume_store`

### 6. Career Analysis Edge Function (`supabase/functions/career-analysis/index.ts`)
- Read `resumeData.challenge` from the database
- Add `CAREER CHALLENGE: ${challenge}` to the AI prompt
- Update the system prompt to instruct the AI to address the user's specific challenge in the `overall_assessment` field with actionable solutions

### 7. Dashboard - Overall Assessment Card (`src/components/dashboard/OverallAssessmentCard.tsx`)
- No structural changes needed -- the `overall_assessment` text from the AI will now naturally include challenge analysis and solutions since the prompt is updated

### 8. Dashboard Page (`src/pages/DashboardNoAuth.tsx`)
- Fetch and display the challenge text alongside the goal in the summary section (if present)

## Technical Details

### Data Flow
```
Setup Page (goal + challenge)
  --> upload-resume edge function
    --> resume_store table (goal + challenge columns)
      --> career-analysis edge function reads both
        --> AI prompt includes challenge context
          --> overall_assessment contains challenge solutions
            --> Dashboard displays in OverallAssessmentCard
```

### Files Modified
| File | Change |
|------|--------|
| `resume_store` table | Add `challenge` column |
| `src/contexts/ResumeContext.tsx` | Add challenge state + persistence |
| `src/pages/SetupNoAuth.tsx` | Split into two input sections |
| `supabase/functions/upload-resume/index.ts` | Accept and store challenge |
| `supabase/functions/resume-image-parse/index.ts` | Accept and store challenge |
| `supabase/functions/career-analysis/index.ts` | Include challenge in AI prompt |
| `src/pages/DashboardNoAuth.tsx` | Show challenge in summary area |
