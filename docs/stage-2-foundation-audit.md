# Stage 2 foundation audit

## Evidence inspected

- Actual `planz-ai` entry point, shared contract, registry, advisor adapter and context loader.
- Actual conversation UI, execution context, deterministic planning helpers and report export utilities.
- Live database policies, request-lock definition, credit-cost function and aggregate record counts. No private record content retrieved.
- Stage 1 integration report and retained database acceptance tests.
- Stage 1 integration tests rerun: 12 passed, 20 assertions, no failures.

## Reusable foundation

One Planz AI interface and route-addressed private conversations exist. The orchestrator authenticates callers, verifies scope, retrieves authoritative history, routes structured intent, invokes existing capabilities and saves streamed responses. Business ownership and execution workspace membership are separate. The existing registry integrates six specialists, Lean Canvas, stress test, startup roadmap and saved-result editing.

Execution projects/tasks, milestones and required task links, Finish-to-Start dependencies, membership roles, task version checks, collaboration activity, notification scheduling and reports already exist. Planning helpers calculate completed-task progress and blockers. Reporting utilities escape HTML and spreadsheet formulas; PDF generation remains local. Database credit costs remain 10/2/5/1/1/3 for the existing actions.

Live access policies allow owners/admins/members to create and edit projects/tasks/milestones; viewers read only. Project reads are workspace-wide, not restricted to project_members. This existing permission model must be preserved.

## Gaps confirmed in source

1. No registered advanced execution-project intelligence or action executor exists. PROJECT_ANALYSIS currently routes to general advice.
2. Context omits task assignees/completion history/dependencies/milestone links/team information; milestone reads stop at 100. Large context is serialized then truncated, which cannot support authoritative complete metrics.
3. Approval is a boolean and intent is classified again after confirmation. Cost, parameters and affected records are not bound to a persisted immutable proposal.
4. Request locks prevent duplicate active runs but have no crash reconciliation; process termination can strand a conversation. Recovery must not blindly repeat billed work.
5. Legacy standalone specialist debit remains browser-controlled. The central adapter charges its own calls, but this does not close direct endpoint bypass. Shared charging changes require removing duplicate browser/adapter charges together.
6. Legacy failures can hide provider status; partial multi-agent saves have no complete per-capability receipts. Existing result Undo is not revision-safe.
7. No relational subtask relationship, recorded capacity, skills, historical scope baseline, project-health snapshots or durable AI action proposal/log tables were found. Do not infer these facts from names or task counts.
8. Conversation create policy contains `p.workspace_id = p.workspace_id`, rather than an explicitly qualified outer workspace comparison. Composite project/workspace foreign keys and edge scope checks provide additional protection; qualify the policy and regression-test mismatched scopes during hardening.

## Verification limits

Live aggregate data exists, but the new request table currently has zero requests: saved conversation history alone is not proof of orchestrator acceptance. Prior Stage 1 rollback authorization checks are documented, not rerun as part of this read-only audit. No authenticated browser session can be minted for this external Supabase connection. Signed-in end-to-end acceptance remains unavailable; source inspection and unit tests are not substitutes.

## Safe implementation order

First harden binding/recovery/charging, then add read-only evidence engines, then reviewed planning/resources, then monitoring/reports, and finally approved transactional execution. Keep one orchestrator, registry, history and model service. Do not advertise Stage 2 as complete before capability-specific acceptance checks pass.