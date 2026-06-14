# Plan

## Goal
Make the `/setup` flow reliably save the business brief, stop the endless loading state, and ensure the agent run starts only after the brief is actually stored.

## What I’ll change
1. Harden the `/setup` submit flow
   - Add explicit timeout and error handling around the business brief save.
   - Prevent the button from staying in loading forever if the network/auth session is unhealthy.
   - Surface the real failure state to the user instead of only spinning.

2. Fix Supabase auth-session handling on the client
   - Update the auth bootstrap so stale token refresh failures do not leave the app in a broken session state.
   - Make protected pages recover cleanly by forcing a fresh auth flow when the saved session is invalid.

3. Make agent kickoff use the supported Supabase function client path
   - Replace the raw hardcoded `fetch` calls to edge function URLs with `supabase.functions.invoke(...)` so auth headers, CORS, and errors are handled consistently.
   - Add per-agent failure messaging so it’s obvious which agent failed and why.

4. Validate the backend path end to end
   - Re-check the `business_store` insert path against the current RLS rules.
   - Confirm the agent functions are being called only after a real `business_id` exists.

## Expected result
- Clicking **Convene the agents** either:
  - saves the brief and moves to the strategy session, or
  - shows a clear actionable error immediately.
- No indefinite spinner on `/setup`.
- Agent requests begin only after the brief is stored successfully.

## Technical notes
- Current evidence shows the browser is hitting `Failed to fetch` during Supabase auth token refresh, while no edge-function calls are being made and `business_store` remains empty.
- The likely fix is a combination of client auth recovery plus safer submit/invoke logic, not another database grant change.
- I’ll keep scope limited to the `/setup` save path and the agent-start flow it triggers.