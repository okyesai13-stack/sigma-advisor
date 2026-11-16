# Planz AI Stage 1 — Integration report

## Delivered

- Inventory and before/after architecture: `stage-1-ai-inventory.md`.
- Server entry point: `supabase/functions/planz-ai/index.ts`. Authentication, RLS-scoped workspace/project/business checks, structured intent routing, recent authoritative history, request locking, capability validation, streamed UI messages and server persistence.
- Common contract and registry: `_shared/planz-contract.ts`, `planz-registry.ts`; first advisor adapter `planz-advisor.ts`, shared current-data retrieval `planz-context.ts`.
- Existing six dossier generators, canvas suggestions, stress test, roadmap and saved-result edits registered without changing their models, prompts or output storage. Advice uses the audited Gemini gateway configuration. Relational project analysis is read-only advice, not a new Stage 2 agent.
- One mounted conversational interface at `/ai-assistant` and `/ai-assistant/:conversationId`; contextual topbar links from authorized project/business pages. New/rename/delete/search, workspace selector, separate project and business selectors, mobile history dialog, streamed messages, Stop, result links and Undo.
- New private `ai_conversations`, `ai_messages`, `ai_requests`; immediate grants and RLS, immutable workspace/project ownership, service-only request lock/message writes. Existing advisor messages copied into legacy private conversations without deleting originals.
- User confirmation before credit-bearing generation and roadmap replacement. Registry debits legacy specialists once (10 full / 2 single); self-charging canvas/stress/roadmap/edit endpoints retain original billing. Full canvas uses nine existing one-credit box calls, disclosed as nine credits before confirmation, then explicit Add to whiteboard; section geometry, connections and tasks preserved.
- Existing standalone dossier/whiteboard/stress/roadmap workflows, authentication, execution tasks, milestones, dependencies, collaboration and credit functions retained.

## Verified

- 66 tests pass, 145 assertions, including intent mapping, no invented project engine, advisor SSE/update normalization, terminal adapter refusal, billing ownership, context isolation, malformed output and movable whiteboard note preservation.
- Rollback database acceptance checks passed: owner create/rename, private history, outsider conversation/message denial, unauthorized workspace creation blocked, browser assistant-message forgery blocked, only one running request per conversation and cascading conversation deletion. Retained in `tests/database/planz-ai.sql`.
- Gateway catalog confirms the actual Gemini and Astra configurations. One real streamed structured routing request returned `LEAN_CANVAS` using the configured Gemini model. No substitute model or provider.
- Deployed `planz-ai`; unauthenticated actual request returned 401. Existing endpoints preserved.
- Preview compilation OK. Actual public AI route redirects to sign-in. Isolated real empty interface/composer checked at desktop 1280×1800 and mobile 390×844: no horizontal overflow or browser errors; composer 80px tall and controls usable. These checks do not simulate signed-in persistence or AI success.

## Acceptance status: not complete

Externally managed Supabase authentication prevents automated populated signed-in checks. All twelve user acceptance scenarios, two-thread send/reload, current project context, follow-up generation, exact ledger debits, full six-agent run, actual whiteboard save, saved-result editing/Undo and model failure recovery remain unverified end to end. Do not describe Stage 1 as accepted.

### Remaining risks / limitations

- Existing standalone specialist endpoints still rely on browser charging; authenticated direct calls can bypass those charges. This additive orchestrator charges its own specialist calls server-side but does not repair the original standalone bypass.
- Legacy provider failures may be wrapped as 500 and the old advisor may fall through after failed edit detection. Adapter stops on surfaced failures without retries, but cannot infer a masked upstream refusal. Persistent provider denial gating across process restarts is not implemented yet.
- Unexpected process termination can leave a conversation request lock in place. No automatic replay or timeout unlock is added because underlying billed work may still run. Recovery needs server reconciliation before another generation, not blind retry.
- Sequential full business/canvas runs can partially save results before a later failure. Current UI shows failure; complete per-capability receipts/recovery and transaction-safe replacement remain pending. Existing generators delete before insert and old Undo targets latest rows without version checks.
- Confirmation re-runs intent detection. A signed/recorded exact execution plan is still needed for strict cost/parameter binding, rather than relying on repeated classification.
- Recent conversation list shows 25 matching titles; latest 500 messages loaded, older records remain saved. Content search and older-history pagination not yet implemented. Workspace switch resets conversation scope; project/business scope changes start a new conversation rather than modifying history.
- General responses use existing advice with current authorized context, bounded to 60,000 characters. Not every large-project record reaches the model. Milestone context currently limited to 100 rows.
- Existing application lint command reports five pre-existing errors and numerous warnings. New integration has warnings, no lint errors. Database linter has eleven pre-existing warnings: ten authenticated security-definer functions and disabled leaked-password protection; no new warnings from these migrations.
- No Stage 2 autonomous execution, predictive analytics, optimization, or new planning engine was added.

The AI Elements chat UI composition skill shaped the single visible conversation interface. AI Gateway SDK and streaming wiring references shaped the server/client transport.