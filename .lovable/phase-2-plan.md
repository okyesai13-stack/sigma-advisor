# Phase 2 implementation

- Add separate workspace, membership, project, project membership, task and activity tables without modifying legacy business or whiteboard records.
- Enforce workspace membership, read-only viewers, owner/admin membership management, valid project/assignee relationships, and task version checks on the server.
- Add personal/team workspace creation, switching and editing; project creation/editing, duplication, archive/restore and confirmed deletion.
- Implement persisted task details, searchable/filterable/sortable lists and a drag-and-drop Kanban with optimistic updates and rollback.
- Calculate execution progress strictly from completed relational tasks; connect dashboard, reports and activity to real records.
- Keep analyses, AI, whiteboards and roadmaps separate and available through their existing routes.
- Verify calculation rules, database protections and public route health; disclose unavailable authenticated checks for this external Supabase connection.