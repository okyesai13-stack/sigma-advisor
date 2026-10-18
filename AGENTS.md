# Project Architecture Rules

- Keep business logic inside existing page/context modules while shared visual language lives in semantic CSS tokens and reusable UI primitives, so redesigns cannot alter the Supabase workflows.
- Store whiteboard section positions, dimensions, removed-section keys and connections alongside notes in lean_canvas boxes.__board; use shared geometry helpers so resizing, movement, membership and mapping stay consistent without changing agent workflows. Section deletion retains notes and analysis results; recreation restores saved section geometry.
- AI credit balances change only through database security-definer functions (spend_credits/refresh_credits); AI edge functions charge via _shared/credits.ts before calling the model, so the browser cannot skip or alter charges.
