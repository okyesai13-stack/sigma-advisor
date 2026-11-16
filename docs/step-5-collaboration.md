# Step 5 — Team collaboration

## Delivered pages and controls
- `/team`: roles, invitations/revoke/copy private link, search and role/status filtering, member details/photos/joined date, current projects/tasks and file limit setting.
- `/invite`: explicit acceptance after sign-in/sign-up, preserved return link, confirmed-email validation and workspace selection.
- Task dialogs and `/projects/:projectId/tasks/:taskId`: attachments, paginated activity, comments/edit/delete/replies, member mention picker and structured mention references.
- Project Files/Activity now functional; `/activity` and dashboard activity reuse backend feed.
- `/notifications`: private inbox, unread/all filtering, pagination, read/unread and mark-all; topbar bell with live count.
- `/settings/notifications`: saved channel preferences, timezone and 0–14-day reminder settings. Existing shell, planning, analytics, auth and AI retained.

## Backend and access
Reuses profiles, workspaces/workspace_members, projects/project_members, tasks, milestones and existing logs. Adds workspace_invitations, task_comments, attachments, notification_preferences, notifications, notification_outbox and collaboration_activity with explicit grants, RLS, indexes and relationships. Outbox is server-only. Non-exposed privileged implementations are invoked through authorized public wrappers. Mention validation rejects IDs outside the workspace; viewer writes are rejected; owner/admin restrictions remain. Existing members cannot promote themselves through acceptance.

Invitations expire in seven days, hash a 64-character random token, reject used/expired/wrong-email tokens, and revalidate inviter role at acceptance. Raw token is never readable from invitation rows; only immediate creator response/private email outbox contain it. Existing/new accounts supported after email confirmation.

Private `workspace-files` bucket, 10 MB maximum/configurable lower workspace limit, supported office/PDF/image/text/CSV files, ZIP rejected. Server reserves paths, validates size/type metadata, protects upload/read/delete; signed download links last 60 seconds. No malware scanner/signature validation: MIME checks do not establish file safety. Pending interrupted uploads can be removed/retried manually. Deleting projects/tasks can leave inaccessible stored objects; storage cleanup automation remains outstanding.

Backend triggers generate collaboration activity/assignment/comment/mention/project/milestone/member-role notifications. Comments and notifications published to Realtime, per-user/task subscriptions cleaned up. Unique keys prevent duplicate mention/deadline notifications. Existing historic logs remain separate; new unified feed begins with this release.

Hourly Postgres job `planz-deadline-reminders` active; timezone/preferences respected, completed/archived/deleted items skipped. Up to one-hour delay, 24 runs/day, no browser required. Upcoming and first-overdue-window reminders deduplicated.

## Email status — not complete
`collaboration-email` deployed; rejects unauthenticated callers and requires workspace owner/admin. Supports Resend, escaped HTML/context links, preferences/access rechecks, conditional claims, delivery status, idempotency keys and exponential retry timestamps. Required `RESEND_API_KEY` and verified `COLLABORATION_EMAIL_FROM` are not configured. No email has been claimed delivered. Current processor is manager-triggered; automatic queue wake/retry execution remains pending provider setup. Server-only claim RPC is prepared but not wired to automatic processing. Sender configuration and verified actual delivery are outstanding.

## Verification
- 54 Bun tests passed; four new collaboration tests cover expiry display, file types/size and safe auth return.
- Rollback DB checks passed: workspace/project/task creation, explicit invitation acceptance, wrong identity/reuse rejection, comments/edit/replies, invalid mentions, member invite denial, one mention notification, read status, file reservations/ZIP/oversize rejection, viewer write denial, private notification isolation, admin owner-removal denial, outsider discussion/file denial. All fixtures rolled back.
- Additional rollback checks passed: expired invitation rejection, other-user preference denial, disabled reminder behavior and repeated reminder deduplication.
- Browser: protected inbox redirects to auth; invalid invitation state; isolated preference toggle and team layouts at desktop/mobile with no overflow/errors; deployed email endpoint returns 401 signed-out.
- Build OK. External unmanaged auth prevents populated signed-in end-to-end acceptance, real file upload/download/delete, realtime cross-user acceptance and provider delivery tests. Do not treat these as verified.
- Existing Supabase warnings: ten authenticated-callable security-definer functions and disabled leaked-password protection; no new warnings after remediation.

## Remaining limits
Team invitation KPI counts the loaded invitation page rather than all pending records; member table is not server-paged. Active member means current membership (no presence subsystem). Removal may be blocked when a member owns projects; owner reassignment is required. Replies are displayed as linked comments rather than deeply nested threads. Explicit mention chips must be removed separately if their text is removed. Activity filters use UTC date bounds. Invitation email is mandatory invite delivery and independent of optional notification preferences. No synthetic notifications/data or automated assignment/rescheduling.
