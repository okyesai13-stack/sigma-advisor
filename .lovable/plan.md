# Analyses Workspace with Lean Canvas

## What you get
A new **Workspace** page (opened from the top bar) with two views:

1. **All analyses grid** — every brief you've filed shown as a card (name, stage, industry, date, how many of the six agents have finished). Click a card to open its canvas. A "New brief" card links to the setup page.
2. **Lean Canvas board** for one analysis — the standard 9-box Lean Canvas grid:
   Problem, Solution, Key Metrics, Unique Value Proposition, Unfair Advantage, Channels, Customer Segments, Cost Structure, Revenue Streams.

## How the canvas works
- **Auto-fill:** on first open, each box is pre-filled from your existing agent results (e.g. Customer Segments from Market research, Unfair Advantage from Competitor differentiation, Revenue/Cost from the Financial model, Channels from Marketing).
- **Edit freely:** each box holds short notes/bullets you can add, edit, reorder or delete. Changes save automatically.
- **Work with the AI on each box:** every box has an "Ask AI" button with quick actions — *Improve*, *Make sharper*, *Challenge this*, *Suggest 3 ideas*. The AI uses the full analysis as context and proposes text you can accept or discard.
- **Advisor chat aware:** the side advisor chat can see the canvas, so you can ask "Is our UVP strong against competitors?" and it answers using the canvas plus agent results.
- **Jump to source:** each box links to the matching dashboard section.
- **Reset box** to re-pull from agent results; **Export** the canvas as PDF via print.

## Technical details
- New table `lean_canvas` (id, business_id unique, boxes jsonb, updated_at) with GRANTs and owner-scoped RLS via business_store, same pattern as result tables.
- New route `/workspace` (grid) and `/workspace/:id` (canvas) inside AppLayout; header button added. Seo noindex.
- Auto-fill mapping done client-side from the six result tables; saved on first load.
- New edge function `canvas-assist` (Gemini via existing setup, JWT validated in code, ownership check, zod input: business_id, box, action, current text) returning suggestions JSON; 429/402 handling.
- `advisor-chat-stream` context extended to include the canvas boxes.
- Debounced autosave (800ms) via upsert on business_id.
