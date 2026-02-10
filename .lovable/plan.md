

# Fix Resume Upgrade Page: Logic, Edge Functions, and UX

## Overview
Fix all issues in the `/resume-upgrade` page flow: deploy the missing edge function, add proper error handling, fix the regenerate logic, and improve the resume list management.

## Issues Found

1. **Edge function `resume-upgrade-jd` was never deployed** -- it exists in code but has no deployment logs
2. **Missing rate limit (429/402) error handling** in the JD edge function
3. **Frontend doesn't handle rate limit errors** with user-friendly messages
4. **Regenerate button always calls profile-based generation** even when viewing a JD-tailored resume
5. **No way to delete resumes** from the list
6. **PDF filename is generic** instead of using the role name

## Changes

### 1. Deploy Edge Function
Deploy `resume-upgrade-jd` so it actually runs when called.

### 2. Fix `resume-upgrade-jd` Edge Function Error Handling
Add proper 429 and 402 error responses (matching the pattern in `resume-upgrade`):

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('AI API error:', response.status, errorText);
  if (response.status === 429) {
    return new Response(
      JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  if (response.status === 402) {
    return new Response(
      JSON.stringify({ success: false, error: 'AI credits exhausted. Please try again later.' }),
      { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  throw new Error(`AI API error: ${response.status}`);
}
```

### 3. Fix Frontend Error Handling (`ResumeUpgradeNoAuth.tsx`)
Update both `generateResume` and `generateFromJD` to detect 429/402 errors and show specific toast messages to the user (e.g., "Rate limit reached, please wait a moment").

### 4. Fix Regenerate Logic
Track the source of the currently viewed resume. When the user clicks "Regenerate" on a JD-based resume, re-call `resume-upgrade-jd` with the original JD (not the profile-based function). Add state to track `currentResumeSource: 'profile' | 'jd'`.

### 5. Add Delete Resume from List
Add a delete button (trash icon) on each resume card in the list view. On click, delete the record from `upgraded_resume_result` and refresh the list.

### 6. Fix PDF Filename
Use the `target_role` (sanitized) as the PDF filename instead of the generic `resume-${resumeId}.pdf`.

## Technical Details

### State Changes in `ResumeUpgradeNoAuth.tsx`
New/modified state variables:
- `currentTargetRole: string` -- tracks the role name of the currently viewed resume (for PDF naming)

### Delete Resume Function
```typescript
const deleteResume = async (id: string) => {
  await supabase.from('upgraded_resume_result').delete().eq('id', id);
  setResumeList(prev => prev.filter(r => r.id !== id));
  // If list becomes empty, switch to generate view
};
```

### Files Modified
| File | Change |
|------|--------|
| `supabase/functions/resume-upgrade-jd/index.ts` | Add 429/402 error handling |
| `src/pages/ResumeUpgradeNoAuth.tsx` | Add delete, fix regenerate, fix PDF name, add error handling |

### Deployment
- Deploy `resume-upgrade-jd` edge function after fixes
