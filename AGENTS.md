# Project Architecture Rules

- Keep business logic inside existing page/context modules while shared visual language lives in semantic CSS tokens and reusable UI primitives, so redesigns cannot alter the Supabase workflows.
- Store whiteboard section positions and connections alongside notes in lean_canvas boxes.__board; use shared geometry helpers so movement, membership and mapping stay consistent without changing agent workflows.
