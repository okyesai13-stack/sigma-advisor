# Planz UI/UX Redesign Plan

## Goal
Rebuild the complete Planz interface around the selected **Editorial Tech Noir** direction: a dark product-led strategy command center inspired by myjobb.ai’s polish and motion, without copying its brand, content, or proprietary assets.

## Locked visual direction
- **Palette:** Signal Orange — graphite `#101110`, raised surface `#232522`, action orange `#FF6B35`, warm foreground `#F7F5EF`.
- **Typography:** Space Grotesk for headings and key metrics; DM Sans for body and controls.
- **Structure:** Product dashboard language with compact navigation, modular work surfaces, clear progress, and strong action hierarchy.
- **Motion:** Fast staged reveals, subtle depth, tactile hover/press feedback, animated agent activity, and smooth drawer/panel transitions. All motion will respect reduced-motion settings.
- **Shape:** Tight radii, thin low-contrast borders, restrained shadows, and selective translucent layers. No decorative gradients, copied logos, or borrowed brand content.

## Implementation

### 1. Shared visual system
- Replace the current paper-and-ink tokens with the locked dark palette, accessible semantic states, shadows, surfaces, and typography.
- Load Space Grotesk and DM Sans correctly from the document head rather than CSS imports.
- Standardize buttons, inputs, tabs, labels, status markers, cards, focus states, and motion utilities.
- Create a small set of reusable presentation pieces for page labels, section headings, status indicators, and metric panels.

### 2. Public experience
- Recompose the landing page as an immersive dark product experience with Planz as the first visual signal.
- Show the actual four-agent workflow in the first viewport through an animated strategy-engine preview.
- Restyle the agent roster, method, audience, proof points, calls to action, navigation, and footer in the selected system.
- Redesign sign-in, account creation, forgot-password, reset-password, and not-found states to match the same product language.

### 3. Authenticated product shell
- Turn the existing two-panel layout into a cohesive strategy workspace with stronger navigation, business context, user controls, and clear panel hierarchy.
- Preserve the resizable advisor/content split on desktop and the advisor drawer on mobile.
- Improve the mobile top bar and floating advisor action without changing authentication or routing behavior.

### 4. Business brief and agent console
- Present the setup form as a focused guided brief with improved grouping, stage selection, validation visibility, and submit feedback.
- Transform the strategy console into an active orchestration view with four distinct agent rows, animated progress, completed/error states, retry controls, and a clear handoff to the dossier.
- Keep all existing database writes, timeouts, edge-function calls, and retry behavior unchanged.

### 5. Strategy dashboard and advisor
- Reorganize the dossier into a scannable dashboard with a compact overview, section navigation, key market metrics, competitor analysis, plan milestones, SWOT, and financial tables.
- Preserve all optional-data handling and empty/loading states.
- Restyle the advisor as an integrated AI workspace with refined suggestions, streaming response feedback, readable conversation rhythm, and a stronger composer.
- Keep chat history, streaming, auto-scroll, and message persistence unchanged.

### 6. Responsive and accessibility pass
- Validate landing, auth, setup, console, dashboard, and advisor layouts at desktop and mobile sizes.
- Check long text, tables, controls, drawer behavior, loading/error states, focus visibility, contrast, keyboard access, and reduced motion.
- Verify route-specific metadata remains intact and confirm the preview builds without errors.

## Technical boundaries
- Frontend presentation only: React page/layout components, shared UI primitives, global tokens, typography, and animations.
- No changes to Supabase tables, policies, authentication logic, edge functions, agent prompts, routing, or business-analysis behavior.
- Existing Planz branding and feature copy remain; the reference site guides visual quality and interaction pacing only.
