
# Pivot to Planz — AI Multi-Agent Business Platform

Full rebuild from Sigma career advisor → **Planz**: AI agents for market research, competitor analysis, business planning, and financial modeling. Visual direction: **Paper & Ink** (editorial, McKinsey-style — off-white background, rich black ink, refined serif/sans pairing).

## New Concept

```text
User idea/business → 4 AI Agents (parallel) → Unified Strategy Dashboard
                ├─ Market Research Agent
                ├─ Competitor Analysis Agent
                ├─ Business Plan Agent
                └─ Financial Model Agent
```

## Pages

| Route | Purpose |
|---|---|
| `/` | Landing — editorial hero, "Turn your idea into a viable business", agent showcase, how-it-works |
| `/auth` | Login/signup (kept, rebranded Planz) |
| `/reset-password` | Kept |
| `/setup` | Capture business idea: name, one-line pitch, stage (idea/early/established), industry, target market, optional uploaded doc |
| `/sigma` → `/analysis` | Pipeline runner — runs 4 agents, shows live progress |
| `/dashboard` | Unified strategy dashboard: Executive Summary, Market, Competitors, Business Plan, Financials |

## Backend — New Tables

Drop old: `career_analysis_result`, `skill_validation_result`, `learning_plan_result`, `project_ideas_result`, `job_matching_result`, `career_goal_score_result`, `ai_role_analysis_result`, `journey_state`, `sigma_journey_state`, `resume_store`.

Create new:
- `business_store` — id, user_id, business_name, pitch, stage, industry, target_market, raw_context
- `market_research_result` — business_id, market_size, trends, target_audience, opportunities, tam_sam_som
- `competitor_analysis_result` — business_id, competitors[], swot, positioning, differentiation
- `business_plan_result` — business_id, executive_summary, value_prop, business_model, go_to_market, milestones, risks
- `financial_model_result` — business_id, revenue_streams, cost_structure, projections_3yr, unit_economics, funding_needs
- `advisor_messages` — business_id, role, content (chat history)

All scoped to `auth.uid()` via `user_id` on `business_store`, joined on `business_id`.

## Backend — Edge Functions

Drop old: `upload-resume`, `resume-image-parse`, `ai-role-analysis`, `career-goal-score`, `skill-validation`, `learning-plan`, `project-generation`, `job-matching`.

Create new:
- `market-research` — Gemini 3, structured output for market size/trends/audience
- `competitor-analysis` — Identifies 5-8 competitors, SWOT, positioning map
- `business-plan` — Generates exec summary, BMC, GTM, milestones
- `financial-model` — Revenue model, cost structure, 3-yr projections, unit economics
- `advisor-chat` / `advisor-chat-stream` — kept, repurposed as business strategy advisor

## Frontend Components

New under `src/components/dashboard/`:
- `ExecutiveSummaryCard`
- `MarketResearchSection` (TAM/SAM/SOM, trends, audience)
- `CompetitorMatrix` (table + SWOT)
- `BusinessPlanSection` (BMC-style grid)
- `FinancialProjections` (charts via recharts, already in deps)

Rebrand `AdvisorChatPanel` → Business Strategy Advisor persona.

## Design Tokens (Paper & Ink)

```css
--background: 40 33% 96%;        /* #f5f3ee */
--card: 40 25% 92%;              /* #e8e4dd */
--foreground: 0 0% 8%;           /* #0d0d0d */
--muted-foreground: 0 0% 18%;    /* #2d2d2d */
--primary: 0 0% 8%;              /* ink black */
--accent: 0 0% 18%;
```

Typography: **Instrument Serif** (display headings) + **Inter** (body). Editorial spacing, hairline dividers, no gradients, no rounded-2xl — restrained `rounded-md`.

## Implementation Order

1. Migration: drop old tables, create new business tables + RLS + GRANTs
2. New edge functions (4 agents + rebranded advisor)
3. Update `index.css` + `tailwind.config.ts` with Paper & Ink tokens + serif font
4. New `LandingNoAuth.tsx` — Planz editorial design
5. New `SetupNoAuth.tsx` — business idea capture
6. Rename `SigmaNoAuth` → `AnalysisRunner` — runs 4 agents in parallel
7. New `DashboardNoAuth.tsx` — strategy dashboard
8. Update `ResumeContext` → `BusinessContext`
9. Rebrand `AppLayout`, `index.html`, auth pages
10. Delete obsolete components (AIRolesSection, SkillGapAnalysis, CareerGoalScoreCard, CareerRoadmapTimeline, OverallAssessmentCard)

## What Stays
- Auth flow, ProtectedRoute, two-panel layout shell
- Advisor chat infrastructure (rebranded persona)
- shadcn/ui, recharts, supabase client

This is a large rebuild. After approval I'll execute in batches and confirm at major checkpoints.
