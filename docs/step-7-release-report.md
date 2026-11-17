# Planz — Step 7 Release Readiness Report (2026-11-17)

## Recommendation
**Conditional go.** No critical or high security issues found. Release after the owner completes the signed-in walkthrough below and enables leaked-password protection.

## Evidence-based results
| Area | Result | Evidence |
|---|---|---|
| Production build | Pass | build OK |
| Automated tests | Pass | 78/78, 158 assertions (Deno test wrongly picked up by Bun excluded via bunfig.toml) |
| All 14 edge functions reject signed-out calls | Pass | live POST: 401 / "Not authenticated" |
| RLS enabled on every public table | Pass | 0 tables without RLS |
| Private file bucket | Pass | workspace-files not public |
| Data integrity (orphan tasks, invalid dates, cross-project deps, missing completion times, duplicate notifications, stuck AI locks) | Pass | all counts 0 |
| Protected routes redirect to sign-in | Pass | /dashboard /projects /pricing /ai-assistant → /auth |
| Public pages, desktop 1280 and mobile 390 | Pass | no overflow, no page errors |
| Permissions, approvals, credits, cycles | Pass (earlier phases) | rolled-back DB transaction suites in tests/database |
| Signed-in UI flows (projects, tasks, Kanban, Gantt, files, comments, AI actions) | Not tested | external Supabase: no test session can be created |
| Email notifications | Not applicable yet | RESEND_API_KEY missing; emails stay queued |

## Fixed this step
- 48 missing foreign-key indexes added (performance, additive).
- Unused `workspace_roster` removed from browser access.
- Test runner scoped to app tests.

## Remaining findings
- Medium: leaked-password protection off (Supabase Auth dashboard setting).
- Low: 9 privileged functions callable by signed-in users — reviewed; each checks auth.uid()/role internally and is used by the app (create_workspace, duplicate_project, get_my_credits, manage_workspace_member, redeem_coupon, request_upgrade, save_milestone, spend_credits — spends only the caller's own credits, workspace_role).
- Known partial Stage 2 items remain (see docs/stage-2-integration-report.md).

## Owner signed-in checklist
Sign up → create workspace → project → tasks → drag on Kanban → milestone + dependency → comment with @mention → upload file → invite second account and accept → dashboard numbers match → Planz AI: plan a project, edit, approve, check tasks appear; approve again shows same receipt.

## Backup, migration, rollback
- Enable Supabase daily backups / PITR before launch; take a manual backup before each migration.
- Migrations are additive only; rollback = publish previous version from Lovable history plus a reverse migration reviewed manually.
- Monitoring: Supabase edge function logs and Postgres logs; incidents triaged by owner.
- Production publishing happens only when you choose it.
