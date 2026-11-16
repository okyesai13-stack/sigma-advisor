# Phase 2 delivery and verification

## Database
- Additive schema migration `20261116042927`: workspaces, workspace_members, projects, project_members, tasks and task_activity_logs.
- Permission correction `20261116043004`: anonymous function execution revoked; task logging is trigger-only.
- Transactional verification `20261116043509`: creates temporary fixtures, exercises authenticated access and rolls back all fixture records. No existing analysis tables or data are removed.
- Composite foreign keys enforce matching task/project/workspace and workspace membership for project owners, task assignees and project members. Unique memberships, date/effort/status constraints and query indexes are included.
- Read access requires workspace membership. Owner/admin/member can edit execution records; viewers cannot. Owner/admin manage workspace details and membership. Members may delete only their own projects; owner/admin can delete workspace projects. Ownership cannot be changed through workspace updates.
- Functions: workspace_role, create_workspace, workspace_roster, manage_workspace_member, duplicate_project; task version and workspace guards; automatic activity history.

## Application
- New: ProjectEngineContext, projectEngine helpers, EngineForms, EngineTasks, WorkspaceManager, EnginePages, EngineOverview, EngineReports, projectEngine tests and database verification SQL.
- Updated: application routes, application layout/provider, sidebar workspace controls, topbar search/create/deadline links, calendar data source, help, architecture rules and roadmap.
- Added dnd-kit for pointer/keyboard Kanban dragging. Status writes are optimistic, version checked and rolled back on failure; task forms also expose status changes without dragging.
- Projects support creation, editing, status/priority search filters, grid/list layouts, duplication with copied tasks reset to To Do, archive/restore and confirmed deletion.
- Tasks support details, creation, edits, assignment, dates, effort, tags, deletion, five persisted statuses, inline status/priority updates, search, filters, sorting and 25-row display pages.
- Project overview, Board, List, Activity and Settings are implemented. Timeline, Milestones and Files remain explicit unavailable views for execution projects.
- Dashboard and reports use actual relational tasks; completion is `floor(done tasks / total tasks * 100)`, or zero with no tasks. Active metrics exclude archived projects. Legacy board task/milestone progress remains separate.
- Team membership adds existing registered accounts, not email invitations. Admins cannot promote/manage other admins; owners cannot be removed.
- Existing /workspace, /analysis, /roadmap, /stress-test, /deck, authentication, billing and AI advisor remain. Existing business-backed project IDs fall back to legacy project views; /legacy-projects/:projectId/:view is also supported.
- Seven legacy AI functions were found to lack caller/ownership verification. Added and deployed authentication and business ownership checks without using them for project operations.

## Verified
- 37 Bun tests passed across 7 files, including six execution rule tests and all legacy regressions.
- Transactional database checks passed: workspace creation, project/task creation, status writes, activity generation, stale update rejection, cross-workspace rejection, invalid assignee rejection and viewer write rejection. Verified zero temporary workspaces/projects/tasks remained.
- Seven deployed AI authorization tests passed: unauthenticated calls return 401 before accessing business data.
- Protected routes redirect to the existing auth screen with no browser runtime errors.
- Isolated signed-out shell checks verified desktop/mobile rendering, AI toggling, navigation, and workspace dialog. These do not verify signed-in creation or Kanban persistence through the UI.
- Preview compiler reports build OK after changes.

## Limits and next phase
- External unmanaged Supabase prevents managed authenticated browser checks. Real UI creation, assignment, refresh persistence, login/logout and advisor answers remain unverified; database tests are not a substitute for those flows.
- Data is fetched in stable 500-row server batches to avoid the default 1000-row truncation. Search/filter operations run over loaded records; very large workspaces need server-filtered list queries and dedicated aggregate endpoints.
- Activity shows the latest 100 workspace events. Historical pagination is not yet exposed.
- Project membership is a roster within a workspace; workspace role controls execution access. There are no additional project-specific private roles.
- Existing password-leak protection is disabled in hosted auth settings. Security-definer callable-function warnings remain for intentional, authenticated, membership-checked RPCs and pre-existing credit functions; anonymous access to newly added operations is revoked.
- Recommended next phase: authenticated acceptance checks, email invitations, scalable server-side filtering/aggregates and planned milestone/file modules. Do not add advanced AI agents before validating the core execution flow.