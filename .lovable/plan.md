# Stage 2 — Advanced Planz AI Project Manager

## Foundation audit

**Reuse:** the single Planz AI conversation, existing orchestrator and capability registry, current Gemini gateway, private history, workspace permissions, projects/tasks/milestones/dependencies, notifications, reports and credits.

**Verified now:** inspected actual code and live database access/credit rules; 12 Stage 1 integration tests passed. Stage 1 is not fully accepted: signed-in AI workflows remain unverified.

**Gaps to address first:** approvals currently reclassify the request; interrupted requests can remain locked; standalone generators still permit bypassing browser credit charges; failures can conceal partial results. Project context also lacks dependencies, assignees, team and complete milestone data.

## Incremental delivery

### 1. Foundation and safety
- Bind approval to a saved, validated proposal with fixed scope, parameters, cost and revision. Cancel or edit produces a new proposal; never reclassify approval into another action.
- Reconcile interrupted requests safely, record per-capability outcomes and surface provider refusals without automatic billed retries.
- Move existing specialist charges to a shared server-authorized invocation path; remove duplicate browser/adapter charges together, preserving existing prices.
- Correct the qualified conversation scope policy and test access, viewer restrictions and duplicate requests.

### 2. Project intelligence
- Register task breakdown, prioritization, estimation, health, risk and delay capabilities in the existing registry.
- Calculate completion, overdue work, dependency blockers, milestone progress and upcoming deadlines from authorized records, not model guesses.
- Show Healthy / At Risk / Delayed / Critical only when evidence supports classification; otherwise show Insufficient data.
- Publish transparent risk rules and tests. AI interprets evidence and suggests actions; estimates and recommendations remain separate from measured data.

### 3. Planning and resources
- Generate bounded project plans with deliverables, tasks, milestones, dependencies, dates, estimates, assumptions and suggested roles.
- Add editable previews inside the existing conversation: edit/remove items, change dates/priorities, approve or cancel.
- Analyze actual assignments and effort; do not label capacity or skills without recorded evidence. Reassignment stays a proposal until approved.
- Add a minimal subtask relationship only if required for saved breakdowns; keep existing task boards and completion rules compatible.

### 4. Monitoring and reporting
- Add current/weekly summaries, completed work, delayed milestones, blockers and attention items using dated records.
- Reuse existing backend scheduling and notifications; no duplicate notification engine or browser-based scheduled monitoring.
- Provide dated, project-scoped report previews and existing safe CSV/PDF exports. Do not invent planned-progress baselines or historical trends.

### 5. Approved actions
- Support existing permitted project updates, task creation/updates/assignment, milestones, dependencies and comments through typed tools.
- Revalidate membership, role, record versions, dates and dependencies at approval time. Resolve identity from authenticated context, never model-supplied IDs.
- Execute appropriate batches transactionally with proposal-based idempotency; record approvals, results and failures, read back saved IDs, and refresh visible project data.
- Display proposed changes separately from saved changes; never report success from a model response alone.

### 6. Integration and acceptance
- Add your six project-focused starter prompts and contextual access from project/task/calendar/team/report screens, retaining business capabilities.
- Test each phase before proceeding: concrete metric rules, all health states, missing data, blockers, proposal edits, rejection without approval, viewer/outsider access, stale versions, duplicate execution, partial failures and exact debits.
- Verify desktop/mobile presentation and public flows; run signed-in persistence/approval/export checks only where authenticated access is available.
- Maintain a delivery report distinguishing implemented, verified, partial and unavailable features. Do not mark Stage 2 complete merely because previews exist.

## Technical details

Extend the existing shared capability contract/registry/context loader and `planz-ai`; do not create another chatbot or replace the backend. Use caller-authorized reads and bounded model context with deterministic aggregate evidence. Reuse `workspace_analytics`, planning helpers, existing milestone transaction and report escaping.

Add only missing durable structures: scoped AI action proposals and execution receipts/logs, plus minimal task-parent linkage if needed. Introduce health snapshots or risks tables only for an actual persistence requirement. Every additive table gets grants, RLS and timestamps; existing activity and notification infrastructure remain authoritative.

## Acceptance limitation

This external Supabase connection does not provide an authenticated test browser session. Populated signed-in acceptance remains unverified; it must not be replaced with mock/demo success claims. This does not prevent incremental implementation and automated rule/security checks, but it prevents claiming full end-to-end acceptance.