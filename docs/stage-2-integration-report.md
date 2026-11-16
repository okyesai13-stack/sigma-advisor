# Stage 2 incremental delivery report

## Implemented

- Same Planz AI conversation, orchestrator, registry, model service and history; twelve project capability identifiers added with handler/permission/usage metadata.
- Complete paged project tasks, milestones, links and dependency reads. Team identity/roles are retrieved separately; private business context stays separate. Model interpretation uses bounded evidence/sample context, not an entire workspace.
- Deterministic four-state health with Insufficient data, completed-task progress, overdue/blocked/unassigned counts, milestone link progress, seven-day deadlines, weekly known completion records, transparent risk scores and recorded assignment/effort totals.
- Project planning and task breakdown/action requests produce validated, bounded unsaved plans. Editable titles/dates/priorities/removal, revision creates a fresh immutable approval; approval/cancel and saved-result links stay inside the single conversation.
- Transactional approved project creation/updates, task creation/updates/assignment, milestone creation/required links, FS dependencies and comments. Task versions and project updated timestamps prevent stale writes. Authenticated identity and scoped project/workspace are never model-controlled. Execution results and failure logs persist; duplicate completed approval returns the same receipt.
- Dated project evidence previews with local CSV/PDF exports, safe HTML/formula escaping and recorded workload. AI interpretation/recommendations/estimation use the existing one-credit advisor action; approval execution itself has no new price.
- Legacy generation confirmation now binds saved decision/parameters/cost instead of repeating classification. Six specialist tools claim paid runs once: full batch10/single2, with private partial receipts and no duplicate browser/adapter debit. Self-charging canvas/stress/roadmap/advisor flows remain unchanged.
- Request heartbeat and conservative reconciliation unlock only requests already marked finished, not uncertain billed work. Terminal service error states persist server-side. Task-page contextual entry passes the authorized task reference as a draft prompt.
- Additive tables: ai_action_proposals, ai_action_execution_logs, ai_specialist_runs, ai_service_blocks; grants/RLS/timestamps. Existing application tables and notifications preserved.

## Verified

- 78 tests across12files,158assertions;12 new metric-rule tests cover all four health states/missing data/exact completion/known timestamps/date windows/workload/risk scores.
- Live rollback acceptance passed: no changes before approval, approved task/milestone persisted, repeated approval did not duplicate, stale task version rolled back the whole batch, other user denied private proposal/approval, full run costs10once, single costs2, consumed claims cannot replay or cross accounts. Fixtures rolled back; retained tests/database/stage-2.sql.
- Deployed eight endpoints; each actually returned401 for unauthenticated calls.
- Actual Gemini structured call generated two task proposals; follow-up advice call returned text. The first schema test failed because the compatible provider needed structuredOutputs; repaired and retested successfully without a model change.
- Preview build OK; focused lint zero errors (warnings remain).
- Public AI route redirects to auth. Isolated real chat controls at1280×1800/390×844 had no overflow/browser errors; editable proposal controls exercised; real CSV/PDF downloads produced in isolated report rendering. These fixtures are not saved application data or signed-in acceptance.

## Partial / not implemented

- **Stage2 not fully accepted:** externally managed Supabase provides no automated signed-in session. Actual natural-language planning→revision→approval→UI readback, every capability against real authenticated workspaces, history reload and exact model+ledger outcomes remain unverified end-to-end.
- TASK_BREAKDOWN creates ordinary related-description tasks, not a new relational subtask model. No capacity/skill records or productivity claims. RESOURCE_OPTIMIZATION is read-only advice from measured workload; reassignment uses explicit action proposals.
- Project-health dashboard remains conversation evidence, not a new dashboard card or continuous saved health snapshot. Existing hourly deadline notifications remain; no extra scheduled AI monitoring or weekly email report job.
- Risk rules currently cover overdue work, FS blockers, delayed milestones and unassigned tasks. Long-running/repeated delay and scope-change historical interpretation are not implemented. Planned-vs-actual baseline and statistical likelihood/impact prediction remain unknown.
- Reports currently export evidence/risk summaries, not all eight bespoke report templates or every task/milestone/workload row. Large history/content search and caching are not added.
- Updating existing milestone details through AI is not exposed; existing dedicated milestone editor remains available. Date exceptions/dependency schedule conflicts are covered by the visible proposal but do not yet show a dedicated conflict-confirmation panel. No auto-rescheduling.
- Interrupted requests with uncertain outcomes remain conservatively blocked rather than replayed. Recovery of uncertain crashed work and active legacy proposal uncertainty needs explicit reconciliation; no automatic provider probe/unblock UI. Service blocks require actual access restoration and server-side clearing before fresh requests.
- Partial specialist receipt rows persist, but full per-capability receipt rendering/recovery is not added. Original delete-before-insert specialist replacement and old revision-unsafe Undo remain unchanged.
- Eleven pre-existing Supabase warnings remain: ten authenticated security-definer warnings and disabled leaked-password protection; no new migration warnings.

## Architecture

```text
Planz AI conversation
  -> authenticated orchestrator + authoritative history
  -> registry + authorized context
  -> measured evidence / validated proposed plan / existing business adapter
  -> conversation evidence and report export
  -> immutable approval -> scoped transactional actions -> saved receipt
```

The AI SDK gateway structured-output and streaming guidance shaped the implementation. No new chatbot, provider, pricing system or notification engine was introduced.