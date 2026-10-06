# Let the advisor edit agent results from chat

## What you'll get
- In the advisor chat, ask things like "Change the executive summary to focus on B2B" or "Lower Year 3 revenue to $2M".
- The advisor finds the right section (Market Research, Competitors, Business Plan, Financial Model, Marketing, AI Operations), rewrites only that part, and saves it.
- A small "Updated: Business Plan → Executive summary" card shows in the chat, with an **Undo** button.
- The dashboard refreshes on its own, so the new text shows right away.

## How it works
1. You ask for a change in chat.
2. The advisor decides which section and field to change and writes the new content.
3. The change is saved to that analysis (only for analyses you own).
4. The chat shows a confirmation card; the dashboard reloads that section.

## Technical details
- `advisor-chat-stream`: add an `update_agent_result` tool (args: agent, field, new_value, reason). Allowed agents/fields are a fixed list per result table, to prevent writing to other columns. Verify the caller owns `business_id` with their own token before writing. Store the previous value so the change can be undone.
- Stream a custom event `{type:"result_updated", agent, field, previous}` alongside the text stream.
- Give the model the current field values for context (it already gets the dossier summary; extend with the editable fields).
- `AdvisorChatPanel`: render the update card + Undo (Undo writes `previous` back through the same function with an `undo` flag).
- `ResumeContext`: add a simple `resultsVersion` counter that bumps on update; `DashboardNoAuth` refetches results when it changes.
- No database changes needed.
