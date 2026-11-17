# Step 7 — System testing, hardening and release readiness

Audit, test, fix and optimise the existing Planz app. No redesign, no new features, no destructive database changes, no production deployment or production data edits without your explicit approval.

## Starting signals (already checked)
- App builds cleanly; 78 of 78 app tests pass. One "failure" is a Deno-only edge test picked up by the wrong runner (not a product bug).
- Security scan: no critical/high findings. Open warnings: leaked-password protection off; 10 privileged database functions callable by signed-in users (each needs a review, most are intentional and self-check permissions).
- 49 database relationships without an index (performance only).
- Signed-in browser testing is not available on this externally connected backend, so end-to-end UI checks run signed-out or on isolated screens; database permission tests run inside rolled-back transactions using real roles.

## Phase 1 — Audit (report only)
Route, edge function, table, AI capability inventories; security, performance and broken-feature findings ranked Critical/High/Medium/Low. Saved as a release report document.

## Phase 2 — Fix critical and high issues
- Review each of the 10 privileged functions; revoke public access where the app does not call it directly (e.g. `workspace_role` internal helper kept, `spend_credits` limited to server use if browser calls are gone).
- Verify every edge function rejects unauthenticated calls (401) and checks workspace/project/business ownership.
- Storage: confirm private files bucket blocks cross-workspace access.
- Fix the test runner so Deno tests are excluded from the app test run.

## Phase 3 — Functional and permission tests (rolled back, no real data changed)
Projects, tasks, milestones, dependencies (cycle prevention), comments/mentions, invitations, role changes, notifications, analytics counts vs. raw records, AI proposals (approve/reject/duplicate/unauthorised/failure rollback), credit charges. Each result marked Pass / Fail / Not tested.

## Phase 4 — Performance
- Add indexes for the unindexed relationships on hot tables (tasks, comments, activity, notifications, milestones, AI tables) — additive only.
- Confirm large pages load lazily; check bundle size and split oversized routes.

## Phase 5 — Reliability and UX sweep
Error/empty/loading states, no fake success messages, dead links and placeholder buttons, responsive checks at desktop/tablet/mobile with screenshots.

## Phase 6 — Production configuration and release report
Secrets server-side check, auth redirect URLs, domain/HTTPS, backup/migration/rollback strategy, final readiness checklist and recommendation.

## Items needing you
- Turn on leaked-password protection in Supabase Auth settings (dashboard setting).
- Email provider key (Resend) is still missing, so invitation/notification emails stay queued.
- Final signed-in walkthrough must be done by you in the preview; I will provide a short checklist.
