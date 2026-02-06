

# AI Role Analysis Feature - Implementation Plan (Updated)

## Overview
Add a new step "AI Role" to the Sigma pipeline that analyzes how AI technology will impact the user's career path, identifies 3 future AI-driven job roles matching their skills, and provides a roadmap to prepare for AI-enhanced careers.

---

## Feature Components

### 1. New Database Table: `ai_role_analysis_result`
Store AI role analysis results with the following structure:

```text
+----------------------------------+
|    ai_role_analysis_result       |
+----------------------------------+
| id (UUID, PK)                    |
| resume_id (TEXT, FK)             |
| roles_at_risk (JSONB)            |
| ai_enhanced_roles (JSONB) - 3    |
| current_ai_ready_skills (TEXT[]) |
| skills_to_acquire (JSONB)        |
| preparation_roadmap (JSONB)      |
| overall_ai_readiness_score (INT) |
| key_insights (TEXT)              |
| created_at (TIMESTAMP)           |
+----------------------------------+
```

### 2. New Edge Function: `ai-role-analysis`
Located at: `supabase/functions/ai-role-analysis/index.ts`

**Logic:**
1. Fetch user's resume data (skills, experience, education)
2. Query career analysis results for context
3. Call Gemini 3 with specialized prompt to:
   - Identify roles at risk of AI automation
   - Suggest exactly 3 new AI-driven roles matching their skills
   - Analyze skill gaps for AI careers
   - Generate preparation roadmap
4. Store results in `ai_role_analysis_result`
5. Update journey state flag

### 3. Update `/sigma` Page Pipeline
Add "AI Role" as Step 2 (after Career Analysis):

**Updated Step Order:**
1. Career Analysis (existing)
2. **AI Role Analysis** (NEW)
3. Skill Validation
4. Learning Plan
5. Project Ideas
6. Job Matching

### 4. Dashboard Integration
Add new "AI Roles" section with:
- AI Readiness Score (circular progress)
- 3 AI-enhanced roles as compact cards
- "Full View" button navigating to `/ai-roles`

### 5. New Full View Page: `AIRolesNoAuth.tsx`
Complete AI role analysis details with all sections.

---

## API Response Structure (3 AI-Enhanced Roles)

```json
{
  "success": true,
  "data": {
    "roles_at_risk": [
      {
        "role": "Data Entry Specialist",
        "risk_level": "high",
        "timeline": "1-2 years",
        "reason": "Automated by AI data processing",
        "mitigation": "Transition to data analysis with AI tools"
      }
    ],
    "ai_enhanced_roles": [
      {
        "role": "AI Product Manager",
        "description": "Lead AI product strategy and development",
        "match_score": 85,
        "skills_required": ["Product Management", "ML Fundamentals", "AI Ethics"],
        "current_skills_match": ["Product Management"],
        "missing_skills": ["ML Fundamentals", "AI Ethics"],
        "salary_range": "25-45 LPA",
        "growth_potential": "Very High",
        "timeline_to_ready": "6-12 months"
      },
      {
        "role": "ML Operations Engineer",
        "description": "Deploy and maintain machine learning systems in production",
        "match_score": 72,
        "skills_required": ["DevOps", "Python", "MLOps", "Cloud Platforms"],
        "current_skills_match": ["Python", "DevOps"],
        "missing_skills": ["MLOps", "Cloud Platforms"],
        "salary_range": "20-35 LPA",
        "growth_potential": "High",
        "timeline_to_ready": "8-14 months"
      },
      {
        "role": "AI Solutions Architect",
        "description": "Design end-to-end AI solutions for enterprise clients",
        "match_score": 65,
        "skills_required": ["System Design", "AI/ML", "Cloud Architecture", "Client Communication"],
        "current_skills_match": ["System Design", "Client Communication"],
        "missing_skills": ["AI/ML", "Cloud Architecture"],
        "salary_range": "30-50 LPA",
        "growth_potential": "Very High",
        "timeline_to_ready": "12-18 months"
      }
    ],
    "current_ai_ready_skills": ["Python", "Data Analysis", "Problem Solving"],
    "skills_to_acquire": [
      {
        "skill": "Machine Learning Fundamentals",
        "importance": "high",
        "learning_path": "Online courses + hands-on projects",
        "estimated_time": "3-4 months"
      },
      {
        "skill": "AI Ethics & Governance",
        "importance": "medium",
        "learning_path": "Certifications + case studies",
        "estimated_time": "1-2 months"
      },
      {
        "skill": "Prompt Engineering",
        "importance": "high",
        "learning_path": "Practice with LLMs + documentation",
        "estimated_time": "1-2 months"
      }
    ],
    "preparation_roadmap": {
      "short_term": [
        "Complete ML fundamentals course",
        "Build 1 AI-powered project",
        "Learn prompt engineering basics"
      ],
      "mid_term": [
        "Get certified in AI tools (AWS ML, Google Cloud AI)",
        "Apply for hybrid AI roles",
        "Contribute to open-source AI projects"
      ],
      "long_term": [
        "Lead AI initiatives in organization",
        "Become domain expert in AI applications",
        "Build personal AI portfolio"
      ]
    },
    "overall_ai_readiness_score": 45,
    "key_insights": "Strong technical foundation with Python and data skills. Focus on ML fundamentals and AI ethics to unlock high-paying AI-enhanced roles within 6-12 months."
  }
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/ai-role-analysis/index.ts` | Edge function for AI role analysis |
| `src/pages/AIRolesNoAuth.tsx` | Full view page for AI role details |
| `src/components/dashboard/AIRolesSection.tsx` | Dashboard section component |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/SigmaNoAuth.tsx` | Add Step 2 AI Role to pipeline |
| `src/pages/DashboardNoAuth.tsx` | Add AI Roles section with Full View button |
| `src/App.tsx` | Add route for `/ai-roles` |
| `supabase/config.toml` | Add ai-role-analysis function config |

## Database Changes

| Change | Description |
|--------|-------------|
| Create `ai_role_analysis_result` table | Store AI role analysis with 3 roles |
| Update `journey_state` table | Add `ai_role_analysis_completed` flag |

---

## UI Design

### Dashboard AI Roles Section
```text
+--------------------------------------------------+
| AI Future Roles                           [Bot]  |
+--------------------------------------------------+
| AI Readiness: 45%    [========------]            |
|                                                  |
| Top 3 AI Roles for You:                          |
| 1. AI Product Manager        (85% match)         |
| 2. ML Operations Engineer    (72% match)         |
| 3. AI Solutions Architect    (65% match)         |
|                                                  |
|                              [Full View ->]      |
+--------------------------------------------------+
```

### Sigma Page Step Display
```text
1. Career Analysis     [completed]
2. AI Role Analysis    [running] <- NEW STEP
3. Skill Validation    [pending]
4. Learning Plan       [pending]
5. Project Ideas       [pending]
6. Job Matching        [pending]
```

---

## Gemini 3 Prompt Key Points

The edge function will instruct Gemini 3 to:
- Return exactly 3 AI-enhanced roles sorted by match_score (highest first)
- Each role must include all fields: description, match_score, skills_required, current_skills_match, missing_skills, salary_range, growth_potential, timeline_to_ready
- Match scores must be realistic (50-95% range)
- Roles should be achievable based on user's current experience level

