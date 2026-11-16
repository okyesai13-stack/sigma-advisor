# Stage 1 — Existing AI inventory and integration strategy

Audit completed before changing existing AI implementations. Source audit and model catalog checked on 2026-11-16.

## Inventory

All business capabilities authenticate a bearer token and authorize `business_store.user_id`; service-role reads happen only after that check. None currently accepts an execution project as a business. Models below are the actual source configuration, not the outdated direct-Gemini memory entry.

| Capability | Frontend | Edge function | Input → output | Storage | Model / provider | Reuse |
|---|---|---|---|---|---|---|
| Market research | Sigma, whiteboard, dossier | market-research | business_id → success/data: summary, sizing, audience, opportunities, risks | market_research_result | Gemini 3 Flash Preview / Lovable Chat Completions | adapter |
| Competitor positioning | Sigma, whiteboard, dossier | competitor-analysis | business_id → success/data: competitors, SWOT, positioning, differentiation | competitor_analysis_result | same | adapter |
| Business planning | Sigma, whiteboard, dossier | business-plan | business_id → success/data: executive summary, model, GTM, milestones, team | business_plan_result | same | adapter |
| Finance | Sigma, whiteboard, dossier | financial-model | business_id → success/data: revenue/costs, projections, unit economics, assumptions | financial_model_result | same | adapter |
| Marketing | Sigma, whiteboard, dossier | marketing-strategy | business_id → success/data: personas, channels, campaigns, budget, KPIs | marketing_strategy_result | same | adapter |
| AI operations | Sigma, whiteboard, dossier | ai-operations | business_id → success/data: readiness, automations, tools, ROI | ai_operations_result | same | adapter |
| Advisor and saved-result editing | shared AdvisorChatPanel, AI page and panel | advisor-chat-stream | business_id/message → SSE deltas, result_updated; undo → JSON | advisor_messages and six result tables | Gemini / Chat Completions advice; Astra / Responses edit detection | SSE adapter, preserve edits and Undo |
| Legacy advisor | no active frontend caller found | advisor-chat | business_id/message → response | advisor_messages | Gemini / Chat Completions | retain deployed implementation, not a second chat UI |
| Lean Canvas suggestions | whiteboard | canvas-assist | business_id/box/action/notes → suggestions | reads lean_canvas; caller saves suggestions | Gemini / Chat Completions | adapter; suggestions are not autonomous board writes |
| Investor stress test | stress test, whiteboard | stress-test | business_id → saved score/verdict, eight risk areas, killers, blind spots | idea_stress_test (historical inserts) | Gemini / Chat Completions | adapter |
| Startup roadmap | roadmap, whiteboard | startup-roadmap | business_id/goal/weeks(8/12/24) → saved phases and milestones | startup_roadmap (one per business) | Gemini / Chat Completions | adapter; preserve manual ticks/rebuild warning |

There is no existing autonomous relational project-analysis/planning agent. Project questions must use read-only current project context and the existing general advice model, clearly labelled as advice. No Stage 2 engine will be invented. Collaboration-email is not an AI capability.

## Context and persistence findings

- Business briefs, six result tables, lean_canvas, idea_stress_test and startup_roadmap are owner-scoped. Workspace membership never grants access to another member's private business.
- Execution projects/tasks/milestones are separate relational workspace records with membership RLS. Do not infer a business/project relationship from a shared UUID or a previous selection.
- Legacy advisor history is one stream per business, in advisor_messages. Earlier source reads the oldest 20 messages, not recent messages. Keep historical rows; import them into a private legacy conversation without deleting the originals.
- Advisor edits are constrained to allowlisted dossier fields. Undo currently accepts a previous value and targets the latest row; retain it as a legacy action, document the lack of revision protection.
- Model prompts and credentials are server-only. Business generation is model inference, not verified live web research; do not represent generated market estimates as sourced facts.

## Billing audit

Existing pricing: full six-agent convene 10, single rerun 2, canvas/advice 1, stress test 5, roadmap 3. spend_credits/refresh_credits own balances and ledger, spending daily → monthly → top-up. Six legacy generators are charged by their browser callers, not their endpoints; direct calls can bypass that browser debit. Central orchestration must debit these adapters server-side once (10 full / 2 specialist) while leaving existing standalone costs unchanged. Canvas/stress/roadmap/advisor already debit server-side: never debit them twice. No new credit balance or billing table.

## Safest integration strategy

Add one server orchestrator, registry and typed adapters, preserving every existing function and its prompts/models. First prove the advisor adapter and contract before adding other registrations. Conversations are private to the user, optionally tied to an authorized workspace and project, with a separate explicit owner-authorized business reference. Use a per-conversation server request lock and request identifiers, never replay a failed generation automatically. Validate adapter output, preserve safe error status, and persist result references in the same conversation. Replace duplicate chat mounts with contextual navigation to one `/ai-assistant/:conversationId` screen; standalone whiteboard/dossier/stress/roadmap workflows remain.

## Architecture

```text
BEFORE
AI page / right panel → Advisor → private business results + advisor_messages
Sigma / whiteboard → six independent dossier functions
Whiteboard / stress / roadmap → separate existing product functions

AFTER
Contextual links → Planz AI conversation → authenticated orchestrator
  → scope authorization → structured intent → current context
  → registry → existing capability adapters → validated result
  → consolidated streamed response → private conversation messages
Standalone product workflows and original storage remain available
```

## Known pre-existing risks

Generator delete/insert writes are not atomic; failures may lose previous results. Some legacy endpoints wrap upstream denials in 500, and legacy advisor intent failures may fall through into another call. Existing generation charges occur before provider success, with no refunds. This integration must not disguise these as tested-safe or silently change prices. Hardening the entire standalone billing/deletion/Undo system is outside the integration's preservation scope.