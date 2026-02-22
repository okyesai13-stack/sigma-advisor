

# Add Career Goal Score with 90-Day Plan to Dashboard

## Overview
Create a new "Career Goal Score" feature that runs as a new step in the Sigma agent pipeline (Step 2, right after Career Analysis). It generates a personalized goal readiness score, actionable recommendations to improve the score, and a structured 90-day plan to achieve the short-term career goal. The score is displayed prominently at the top of the Dashboard with a modern, visually engaging UI.

## What Gets Built

1. **New Edge Function**: `career-goal-score` -- Takes the career analysis results and resume data, generates a goal score (0-100), score-boosting recommendations, and a 90-day week-by-week action plan.
2. **New Database Table**: `career_goal_score_result` -- Stores the score, recommendations, and 90-day plan per resume.
3. **New Dashboard Component**: `CareerGoalScoreCard` -- A hero-style card at the very top of the dashboard showing a circular score gauge, recommendations list, and collapsible 90-day plan timeline.
4. **New Sigma Pipeline Step**: Inserted as Step 2 (after Career Analysis, before AI Role Analysis) with its own runner function and result preview.

## Architecture

### New Edge Function: `supabase/functions/career-goal-score/index.ts`

- Receives `resume_id` as input
- Fetches career analysis result and resume data from the database
- Sends the short-term role, user's skills, education, experience, and goal to the AI
- Generates structured JSON with:
  - `goal_score` (0-100): How ready the user is to achieve their short-term goal
  - `score_breakdown`: Categories like Skills Match, Experience Level, Education Fit, Portfolio Strength, Market Readiness (each with sub-score)
  - `recommendations`: 5-7 prioritized actions to boost the score (each with title, description, impact level, estimated time)
  - `ninety_day_plan`: 12 weeks grouped into 3 phases (Weeks 1-4, 5-8, 9-12), each week has 2-3 specific tasks
- Stores results in `career_goal_score_result` table
- Updates `journey_state` with `goal_score_completed` flag
- Standard CORS headers and 429/402 error handling

### New Database Table: `career_goal_score_result`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| resume_id | text | NOT NULL |
| goal_score | integer | 0-100 |
| score_breakdown | jsonb | Category sub-scores |
| recommendations | jsonb | Array of recommendation objects |
| ninety_day_plan | jsonb | 3 phases, 12 weeks of tasks |
| target_role | text | The short-term role being scored against |
| created_at | timestamptz | default now() |

RLS: Public insert and select (matching existing pattern).

### Database Migration: Add `goal_score_completed` to `journey_state`

```sql
ALTER TABLE journey_state ADD COLUMN IF NOT EXISTS goal_score_completed boolean DEFAULT false;
```

### Sigma Pipeline Changes (`SigmaNoAuth.tsx`)

- Add `goal_score` to `StepStatus` interface and `StepId` type
- Add `runGoalScore()` function that calls the new edge function
- Insert it as Step 2 in the pipeline: Career Analysis -> **Goal Score** -> AI Role Analysis -> ...
- After career analysis completes, it triggers `runGoalScore()` instead of `runAiRoleAnalysis()`
- After goal score completes, it triggers `runAiRoleAnalysis()`
- Add result state and preview rendering for the goal score step

### Dashboard Component: `CareerGoalScoreCard`

Placed at the very top of the dashboard (before Overall Assessment), this is a visually prominent section with:

**Score Hero Area:**
- Large circular progress ring showing the score (color-coded: red < 40, amber 40-69, green >= 70)
- Target role name and "Goal Readiness Score" label
- Score breakdown as small progress bars (Skills Match, Experience, Education, Portfolio, Market)

**Recommendations Section:**
- Cards with priority badges (High/Medium/Low impact)
- Each recommendation shows: title, description, estimated time, and impact level

**90-Day Plan Section (Collapsible):**
- 3-phase timeline: Foundation (Weeks 1-4), Acceleration (Weeks 5-8), Achievement (Weeks 9-12)
- Each week shows 2-3 tasks with checkboxes (visual only, not persisted)
- Color-coded phases matching the career roadmap colors (emerald, amber, violet)

### Dashboard Data Loading

Update `loadData()` in `DashboardNoAuth.tsx` to also fetch from `career_goal_score_result` and pass the data to `CareerGoalScoreCard`.

## Technical Details

### AI Prompt Output Structure

```json
{
  "goal_score": 62,
  "score_breakdown": {
    "skills_match": { "score": 70, "label": "Skills Match" },
    "experience_level": { "score": 45, "label": "Experience Level" },
    "education_fit": { "score": 80, "label": "Education Fit" },
    "portfolio_strength": { "score": 40, "label": "Portfolio Strength" },
    "market_readiness": { "score": 55, "label": "Market Readiness" }
  },
  "recommendations": [
    {
      "title": "Build a REST API project",
      "description": "Create a full-stack project using Node.js and Express to demonstrate backend skills",
      "impact": "high",
      "estimated_time": "2 weeks",
      "category": "portfolio"
    }
  ],
  "ninety_day_plan": {
    "phase_1": {
      "name": "Foundation",
      "weeks": {
        "week_1": { "focus": "Skill Assessment", "tasks": ["Complete React fundamentals course", "Set up GitHub portfolio"] },
        "week_2": { "focus": "Core Skills", "tasks": ["Build first component library", "Practice coding challenges"] },
        "week_3": { "focus": "...", "tasks": ["..."] },
        "week_4": { "focus": "...", "tasks": ["..."] }
      }
    },
    "phase_2": {
      "name": "Acceleration",
      "weeks": { "week_5": {}, "week_6": {}, "week_7": {}, "week_8": {} }
    },
    "phase_3": {
      "name": "Achievement",
      "weeks": { "week_9": {}, "week_10": {}, "week_11": {}, "week_12": {} }
    }
  },
  "target_role": "Junior Frontend Developer"
}
```

### Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/career-goal-score/index.ts` | Edge function |
| `src/components/dashboard/CareerGoalScoreCard.tsx` | Dashboard component |

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/SigmaNoAuth.tsx` | Add goal_score step to pipeline (Step 2) |
| `src/pages/DashboardNoAuth.tsx` | Load and display goal score data at top |
| `supabase/config.toml` | Add `[functions.career-goal-score]` entry |

### Database Migration

- Add `career_goal_score_result` table
- Add `goal_score_completed` column to `journey_state`
- RLS policies for public insert/select

### Deployment

- Deploy `career-goal-score` edge function
- Run database migration

