# Step 4 — Dashboard, analytics and reporting

## Delivered
- `/dashboard`: eight real KPI values, welcome/workspace/range controls, create actions, timestamp, project progress and explainable health, task charts/trends, team workload, milestones, deadlines and actionable risk rows.
- `/reports`: project, task, team, milestone/schedule and workspace report views with CSV and PDF generation. Uses existing sidebar/topbar and preserves all legacy features.
- Shared `AnalyticsWorkspace`, `useAnalytics`, date/trend/export helpers. Existing Recharts and html2pdf used; no dependencies added.

## Database
Reuses projects, tasks, milestones, milestone_tasks, task_dependencies, workspace_members, profiles and task_activity_logs. Adds `tasks.completed_at`, a trigger preventing client timestamp manipulation, completion-history backfill and three indexes. Adds security-invoker `workspace_analytics` RPC with explicit authenticated execution, membership validation, existing RLS, server-side aggregation and stable task/milestone/risk paging. No access policies widened, duplicate business tables, service keys or external report service.

## Calculation rules
- UTC creation cohort for project/task/milestone counts; real completion dates for trends/average duration. Deadline comparisons use local date-only today. Archived projects excluded. Project progress/health always reflect all tasks, not a date-truncated task sample.
- Completion floor(done/total*100), zero without tasks. Deleted records absent. Completed project health follows explicit existing project status; health does not update it.
- Delayed: past project deadline or critical overdue task/milestone. At Risk: approaching project/high-priority deadlines, blocked prerequisites or conflicting dependency dates. Not Started: no doing/review/done tasks. Otherwise On Track. Reason displayed.
- Team workload: active positive estimated hours (or one base point) multiplied by priority weights Urgent 2, High 1.5, Medium 1, Low .75. Not a precise productivity measure.
- Upcoming deadline KPI counts unfinished task/milestone/project deadlines today through seven days. This-week milestone count ends on local Sunday. Overdue excludes completed records and today.
- Comparisons only task creation and known current completion events; no invented historical snapshot changes. Old completed tasks without trustworthy events omitted from trends and averages.

## Performance and exports
Dashboard/report routes skip full task preloading. Aggregation runs in Postgres; task/milestone/risk details page 25, exports fetch 500 per page. Mutations in this session invalidate via context reload. Scoped realtime listeners plus 60-second foreground polling cover other sessions/dependencies/member edits; refresh action available. Realtime is not assumed enabled on every table.
CSV escapes formulas and quotes; PDF escapes HTML and renders local tables with title/date/summary/empty state. Export applies server filters and project table filters. Reports are current live reads, not transactionally frozen snapshots across multiple export pages.

## Verification
- 50 Bun tests passed across nine files, including seven new date/trend/completion/export tests.
- Rollback-only DB acceptance: Product Development workspace, Website Development/Mobile App Development projects, mixed tasks, milestone/dependency. Verified project/task counts, overdue/blocked, 7 workload points, health/progress, trends, filters, paging, changed task refresh, timestamp forgery prevention/reopen, outsider denial and viewer access. All temporary records rolled back.
- Browser: real reports route redirects signed-out to auth; isolated actual empty screens verified at 1280×1800 and 390×844, report/custom-date controls, disabled no-workspace exports, no document overflow or page errors.
- CSV and PDF download mechanisms tested in browser with empty nonprivate report; generated PDF header/file checked. Not a signed-in populated export-button test.

## Limitations / outstanding acceptance
Externally managed authentication prevents automated signed-in UI acceptance here. Populated chart rendering, editing from reports, refresh after real UI changes and filtered multi-page button exports remain unverified end-to-end. This is not a claim of full production acceptance.
Project/team aggregate arrays are currently returned together, not server-paged; very large workspaces should move those tables to separate paginated queries. Context still preloads milestones/project metadata for existing navigation/create workflows. Pagination uses a shared detail-page index. Date range applies creation cohorts rather than historical state reconstruction; reopened/deleted tasks no longer count as current completed trend events. Historical project-health/KPI snapshot comparisons are unavailable.
Milestone/deadline risk links navigate to existing project detail views when their record is not loaded; no milestones are edited with incomplete link data. No automatic rescheduling, assignment changes, AI scheduling, historical analytics snapshots or private-project permission change.
Eleven existing Supabase warnings predate this change: ten authenticated-callable security-definer functions and disabled leaked-password protection; no new findings.
