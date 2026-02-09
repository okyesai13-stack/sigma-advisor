

# JD-Based Resume Generation with Resume List

## Overview
Add a Job Description (JD) upload feature to the `/resume-upgrade` page. Users paste a JD, and the AI generates a tailored resume optimized for that specific role. All generated resumes are listed by their target role name, allowing users to switch between them.

## Changes

### 1. New Edge Function: `resume-upgrade-jd`
Create `supabase/functions/resume-upgrade-jd/index.ts` that:
- Accepts `resume_id` and `job_description` (the pasted JD text)
- Fetches the user's profile from `resume_store` (resume text, parsed data, goal)
- Extracts the role title from the JD using AI
- Generates a tailored resume JSON optimized for the JD requirements
- Saves to `upgraded_resume_result` with `target_role` set to the extracted role title
- Returns the generated resume data

Add to `supabase/config.toml`:
```toml
[functions.resume-upgrade-jd]
verify_jwt = false
```

### 2. Resume Upgrade Page (`src/pages/ResumeUpgradeNoAuth.tsx`)
Major restructure of the page flow:

**A. Resume List View (new default when resumes exist)**
- On load, fetch ALL resumes from `upgraded_resume_result` for this `resume_id`
- Display as a card grid, each card showing:
  - Target role name (from `target_role` column) as the resume title
  - Creation date
  - "View" button to open the resume editor
- Clicking a card loads that resume into the editor/preview

**B. Generation Options (shown when no resumes exist, or via "Create New" button)**
Two options side by side:
1. **Generate from Profile** -- existing button that calls `resume-upgrade`
2. **Generate from Job Description** -- new card with a Textarea to paste a JD, then calls `resume-upgrade-jd`

**C. Resume Editor (existing, shown when a resume is selected)**
- Same as current editor/preview with the left panel and A4 preview
- Add a "Back to My Resumes" button in the header to return to the list view

### 3. State Management Updates
New state variables in the page:
- `resumeList`: array of all saved resumes (id, target_role, created_at)
- `selectedResumeId`: which resume is currently being viewed
- `viewMode`: `'list' | 'generate' | 'editor'`
- `jdText`: the pasted job description text
- `isGeneratingJD`: loading state for JD-based generation

### 4. Data Flow

```
User pastes JD
  --> calls resume-upgrade-jd edge function
    --> AI extracts role + tailors resume to JD
      --> saved to upgraded_resume_result (target_role = extracted role)
        --> resume list refreshes, new resume appears
          --> user clicks to view/edit/download
```

## Technical Details

### Edge Function: `resume-upgrade-jd`
- Prompt includes the full JD text along with user profile data
- AI instructed to: extract the exact job title for `target_role`, align skills/experience/summary to JD requirements, use JD keywords for ATS optimization
- Same JSON output structure as existing `resume-upgrade`

### Resume List Query
```typescript
const { data } = await supabase
  .from('upgraded_resume_result')
  .select('id, target_role, created_at')
  .eq('resume_id', resumeId)
  .order('created_at', { ascending: false });
```

### No Database Schema Changes Needed
The existing `upgraded_resume_result` table already has all required columns (`resume_id`, `resume_data`, `target_role`, `created_at`).

### Files to Create/Modify

| File | Change |
|------|--------|
| `supabase/functions/resume-upgrade-jd/index.ts` | New edge function for JD-based resume generation |
| `supabase/config.toml` | Add `resume-upgrade-jd` function config |
| `src/pages/ResumeUpgradeNoAuth.tsx` | Add resume list view, JD input, view mode switching |

