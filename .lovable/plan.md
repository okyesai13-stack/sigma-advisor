# Idea Stress Test

## What you get
A new **Stress Test** page for each analysis, opened from a "Stress test" button on the dashboard and on each Workspace card. An AI "tough investor" attacks the idea and shows where it could fail.

### On the page
- **Survival score (0–100)** with a verdict: Fragile, Shaky, Promising or Solid, plus a one-line reason.
- **8 risk areas**, each scored 0–10 with a red, amber or green colour: Customer demand, Problem urgency, Competition, Making money, Reaching customers, Ability to build, Team fit, Timing and rules.
  Each one shows why it got that score, using your own agent results, and the single question an investor would ask.
- **Killer risks:** the top 3 things most likely to kill the idea, each with an early warning sign and a cheap way to check it this week.
- **Blind spots:** places where your agent results disagree with each other (for example, a market size that doesn't match the revenue plan).
- **Fix plan:** for each red or amber area, a concrete next step. Click **Send to board** to add it as a task on your whiteboard.
- **Re-test:** after you update your brief or board, run it again. The page shows how much the score went up or down since last time.

The advisor chat will also see the latest stress test, so you can ask "How do I fix my biggest risk?"

## Technical details
- New table `idea_stress_test` (id, business_id, score, verdict, risks jsonb, killers jsonb, blind_spots jsonb, created_at) with grants for authenticated/service_role and owner RLS through business_store; history is kept so score changes can be shown.
- New edge function `stress-test`: validates JWT and ownership, reads the brief, all six agent results and the board, calls the existing AI setup with JSON output, returns 429/402 clearly, saves the result.
- New route `/stress-test/:id` inside the app layout (noindex), buttons added to dashboard and Workspace cards.
- "Send to board" appends a task to the board's saved tasks.
- `advisor-chat-stream` adds the latest stress test summary to its context.
- Small test for the score-to-verdict rule and score change.
