# Phase 3 planning delivery

## Database
- Additive migration `20261116050548`: milestones, milestone_tasks, task_dependencies, project_schedule_activity, indexes, grants, relationship constraints, triggers and transactional save_milestone.
- Migration `20261116050612`: revoke public access to internal trigger functions.
- Migration `20261116050915`: rollback-only database verification; creates no lasting test records.
- RLS: members read within their workspace; owner/admin/member roles edit; viewers cannot write. Parent-project relationships prevent cross-workspace and cross-project links. The existing Phase 2 access model allows workspace members to access all workspace projects; project_members is not a private-project access boundary.

## Screens and routes
- `/projects/:projectId/milestones`: creation, editing, deletion, owner/dates/status, required task links, computed progress, explicit authorized completion overrides.
- `/projects/:projectId/timeline`: actual task start/due spans, status/priority/assignee/duration, milestone markers, connectors, today indicator, day/week/month zoom, scrolling/date navigation, drag dates and resize duration.
- `/projects/:projectId/calendar` and `/calendar`: month/week/day/agenda, project/status/assignee filters, task start/due events, milestone events, project deadlines, detail dialogs and date rescheduling.
- Existing task details: predecessor/successor lists, add/remove dependencies and incomplete prerequisite warning.
- Project overview/dashboard: schedule warnings, upcoming and overdue milestones, blocked tasks and project deadlines. Project activity includes scheduling history.
- New modules: `src/components/planning/*`, `src/lib/planning.ts`; extended ProjectEngineContext and existing execution pages/forms. Legacy analysis, canvas, roadmap, authentication and Advisor remain unchanged.

## Scheduling rules
- All task links are required; a task can belong to multiple milestones in the same project. Duplicate links are rejected.
- Milestone progress = completed linked tasks / linked tasks; no-linked-task milestones show an empty state instead of a fabricated percentage.
- Project progress remains completed tasks / total tasks. Deleted tasks are absent; no archived/cancelled task states exist. Archived projects are excluded from dashboard execution summaries.
- Completing incomplete milestones requires workspace owner/admin authorization and an explicit reason saved in activity. Linked tasks remain unchanged.
- Finish-to-Start is implemented; other dependency types are represented but disabled. Self-links, cross-project links, duplicate relationships and cycles are rejected server-side.
- Date-only arithmetic uses the user's local calendar. Invalid reversed ranges are rejected; dependency and project-range exceptions require confirmation in task date-edit flows. Dependent tasks never move automatically.
- Task and milestone writes use version checks; milestone form/link replacement is transactional. Timeline renders 100-task pages; execution reads use 500-row batches.

## Verification
- 43 automated tests passed across 8 files, including progress, blocked tasks, date conflicts, overdue milestones, date arithmetic and calendar events.
- Rollback-only database checks passed: create milestones, link tasks, update tasks, reject incomplete completion without override, reject cycles/cross-project links, record date changes/authorized overrides, reject unauthorized reads and viewer milestone writes.
- New tables all have RLS enabled: 4 milestone policies, 3 link policies, 3 dependency policies, 1 history read policy.
- Preview build/type checking passed.
- Isolated signed-out calendar controls exercised in all four views; desktop/mobile screenshots inspected, no page overflow or browser errors. Empty timeline navigation verified.

## Limitations and next phase
- Real signed-in UI creation, populated Gantt connectors, dragging/resizing and browser-refresh persistence remain unverified: this externally managed Supabase connection cannot mint an automated browser session. Database persistence and authorization were checked separately, not claimed as authenticated end-to-end UI verification.
- Project deadlines are edited through project details rather than dragged. Calendar drag support is pointer-based; date inputs remain an accessible alternative. Agenda drag targets exist for dates containing events only; use other calendar views to move to empty dates.
- Activity feeds display the latest 100 entries per source; older activity is preserved in the database but not paginated in the UI.
- No AI scheduling, automatic successor rescheduling, private-project permission changes or file storage were introduced.
- Existing security warnings remain: leaked-password protection disabled and callable signed-in security-definer functions. The authorized milestone-save RPC intentionally remains callable by authenticated users and validates membership internally.
- Recommended next phase: resource/workload planning, project-specific access controls, calendar keyboard rescheduling and activity pagination after real signed-in acceptance testing.