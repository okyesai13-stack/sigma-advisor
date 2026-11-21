# Planz four-page UI/UX redesign

## Pages and routes
- `/`: project-management positioning, product illustration, functional calls to action, feature/workflow sections, Planz AI prompts and mobile menu.
- `/auth`: coordinated sign-in/sign-up layout, signup entry links, labelled fields and dedicated password-recovery view within the existing route.
- `/reset-password`: minimal recovery layout; existing valid/invalid-link and update-password behavior retained.
- `/setup`: three guided presentation steps over the existing business brief fields, backward navigation and review before the existing save-and-run action.
- `/sigma`: strategy command centre with execution-derived counts, specialist status cards, retry controls and direct dossier-section links.

## Components and design
Shared Geist typography and semantic charcoal/neutral/violet tokens; WorkspacePreview and SessionView reusable presentation components. Product imagery is a labelled generated illustration with empty workspace states, delivered through the asset service. Dark authentication panel text contrast was checked and corrected.

## Preservation
No database migrations, permission changes, credit changes or edge-function edits. Existing Supabase email/password sign-in, signup, recovery, redirects, brief save contract, paid parallel agent execution and retry behavior retained. App shell search, credits, notifications, profile and unified AI navigation retained. All **six actual specialists** preserved despite the brief's outdated five-agent reference. Findings open existing `/analysis#section-*` destinations; consolidated reporting remains in the existing dossier rather than inventing combined results.

## Verification
- 78 existing tests passed, 158 assertions; preview build OK and no browser runtime errors.
- Browser-tested landing signup CTA, account tabs, recovery email retention/back navigation, expired reset-link state and return to sign-in.
- Protected setup and Sigma routes redirect signed-out visitors to auth.
- Images load; public pages checked at 390×844, 768×1024 and 1203×599, plus 1280×1800 desktop. No horizontal overflow; mobile menu links work.
- Actual setup component tested in an isolated, signed-out presentation harness: required fields gate each step, Back retains entered business/market values, review displays input, mobile layout fits. No save submitted.
- Actual SessionView tested with isolated presentation-only states: all six agents, two-of-six completion, findings/retry/report callbacks, and desktop/mobile/laptop layout. No agents called, credits charged or fixtures persisted.
- Reduced-motion behavior remains governed by the existing global preference rule.

## Acceptance limitations
Authenticated end-to-end tests are unavailable with the externally managed Supabase connection: successful sign-in, signup verification, reset-email delivery, valid password reset, saved brief readback, paid execution and live dossier retrieval remain unverified. Isolated controls are not evidence of those flows passing.

The existing application had **no Google OAuth control or handler**; none was invented during this presentation-only redesign, and provider configuration remains unverified. Contact, about and legal destinations were not supplied or implemented in the existing app, so no placeholder footer buttons or invented legal documents were added. Pricing links use the existing protected pricing route.

No fabricated findings, event timestamps or live project metrics were introduced. No new export system, automatic onboarding saves or AI workflow changes were added. Full acceptance remains pending authenticated workflow verification.