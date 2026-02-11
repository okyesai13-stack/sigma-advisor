

# Improve Interview Preparation & Smart Analysis Edge Functions

## Overview
Both edge functions produce generic, shallow outputs. This plan enhances the AI prompts to generate richer, more actionable data, adds proper error handling (429/402), includes candidate experience context, and improves the frontend to display the enhanced content.

## Issues Found

1. **Interview Prep prompt is shallow** -- no candidate experience/education context is sent, so questions are generic to the job posting rather than personalized to the candidate's gaps
2. **Smart Analysis prompt truncates experience** to 500 chars and education to 300 chars -- critical context is lost
3. **Both functions lack 429/402 error handling** -- they throw generic errors instead of returning proper status codes
4. **Interview Prep has no "Regenerate" button** -- users are stuck with cached results forever
5. **Smart Analysis has no "Regenerate" button** either
6. **Technical questions lack sample answer outlines** -- just a short hint, not actionable enough
7. **Behavioral questions don't show the example_answer_structure** field on the frontend even though the edge function generates it
8. **CORS headers are incomplete** -- missing platform headers that other functions include

## Changes

### 1. Edge Function: `interview-prep/index.ts`

**A. Enhanced CORS headers** (match the pattern from `resume-upgrade`):
```typescript
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
```

**B. Include candidate experience and education in the prompt** -- fetch from `resume_store.parsed_data` and include work history and education so the AI can personalize questions around actual gaps.

**C. Richer prompt requesting:**
- Technical questions with a `sample_answer_outline` field (not just a hint)
- Behavioral questions with a full STAR-method example skeleton
- Company-specific questions with `why_it_matters` context
- A new `do_dont` section: common mistakes to avoid in the interview
- Increase to 6 technical, 5 behavioral, 4 company-specific questions

**D. Add 429/402 error handling:**
```typescript
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
```

**E. Add `force_regenerate` parameter** -- when true, delete existing record and regenerate fresh content.

### 2. Edge Function: `smart-analysis/index.ts`

**A. Enhanced CORS headers** (same fix).

**B. Send full experience and education** without truncation (up to 3000 chars each) so the AI has real context.

**C. Richer prompt requesting:**
- Company analysis with `interview_culture_tips` (what to wear, communication style)
- Role analysis with `day_in_the_life` description and `required_experience_years`
- Resume fit analysis with `match_percentage` per strength/gap (not just lists)
- A new `action_plan` section: ordered list of concrete steps with timeframes
- A new `salary_insights` field: expected range and negotiation tips

**D. Add 429/402 error handling** (same pattern).

**E. Add `force_regenerate` parameter**.

### 3. Frontend: `InterviewPrepNoAuth.tsx`

- Add a "Regenerate" button in the header that calls the edge function with `force_regenerate: true`
- Display the `example_answer_structure` for behavioral questions (currently ignored)
- Display `sample_answer_outline` for technical questions (new field)
- Add a collapsible "Show Answer Guide" toggle for each question so users can study
- Add a new "Do's and Don'ts" card section
- Handle 429/402 errors with specific toast messages

### 4. Frontend: `SmartAnalysisNoAuth.tsx`

- Add a "Regenerate" button in the header
- Display the new `action_plan` as a numbered timeline
- Display `salary_insights` in a highlighted card
- Display `interview_culture_tips` under company analysis
- Handle 429/402 errors with specific toast messages

## Technical Details

### Updated Interview Prep JSON Structure
```json
{
  "technical_questions": [
    {
      "question": "...",
      "hint": "...",
      "difficulty": "easy/medium/hard",
      "sample_answer_outline": "Step-by-step outline of a strong answer"
    }
  ],
  "behavioral_questions": [
    {
      "question": "...",
      "hint": "...",
      "example_answer_structure": "Situation: ... Task: ... Action: ... Result: ..."
    }
  ],
  "company_specific_questions": [
    {
      "question": "...",
      "research_tip": "...",
      "why_it_matters": "Why interviewers ask this"
    }
  ],
  "preparation_tips": ["..."],
  "key_talking_points": ["..."],
  "dos_and_donts": {
    "dos": ["Do 1", "Do 2", "Do 3"],
    "donts": ["Don't 1", "Don't 2", "Don't 3"]
  }
}
```

### Updated Smart Analysis JSON Structure
```json
{
  "company_analysis": {
    "company_overview": "...",
    "culture_insights": "...",
    "growth_opportunities": "...",
    "industry_standing": "...",
    "interview_culture_tips": "Dress code, communication style, what they value in candidates"
  },
  "role_analysis": {
    "role_summary": "...",
    "key_responsibilities": ["..."],
    "growth_path": "...",
    "challenges": "...",
    "day_in_the_life": "What a typical day looks like in this role",
    "required_experience_years": "2-4 years"
  },
  "resume_fit_analysis": {
    "overall_match": "...",
    "strengths": ["..."],
    "gaps": ["..."],
    "improvement_areas": ["..."]
  },
  "action_plan": [
    { "step": "Complete React certification", "timeframe": "2 weeks", "priority": "high" },
    { "step": "Build a portfolio project using their tech stack", "timeframe": "1 month", "priority": "medium" }
  ],
  "salary_insights": {
    "expected_range": "8-12 LPA",
    "negotiation_tips": "Highlight your project experience and certifications"
  },
  "recommendations": ["..."],
  "overall_score": 75
}
```

### No Database Schema Changes Needed
Both tables store these fields as `jsonb`, so the richer JSON structures are automatically supported without any migration.

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/interview-prep/index.ts` | Enhanced prompt, CORS, 429/402 handling, force_regenerate |
| `supabase/functions/smart-analysis/index.ts` | Enhanced prompt, CORS, 429/402 handling, force_regenerate |
| `src/pages/InterviewPrepNoAuth.tsx` | Regenerate button, answer guides, do's/don'ts section, error handling |
| `src/pages/SmartAnalysisNoAuth.tsx` | Regenerate button, action plan, salary insights, error handling |

