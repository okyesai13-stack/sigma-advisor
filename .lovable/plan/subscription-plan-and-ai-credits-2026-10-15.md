# Subscription plan and AI credits

## What the user gets
- **Free plan:** 5 AI credits every day. Unused daily credits don't carry over and reset at midnight (UTC).
- **Pro plan, $20/month:** 100 credits each month plus the same 5 credits every day. Monthly credits reset each billing month.
- **Credit packs (one-time top-ups):** shown on the page, but marked "Coming soon" until payments are switched on. Top-up credits never expire.
- Daily credits are always used first, then monthly credits, then top-ups.

## Credit costs (starting values, easy to change)
- Running all 6 agents: 10 credits
- Re-running one agent: 2 credits
- Stress test: 5 credits
- Whiteboard AI action or AI review: 1 credit
- Advisor chat message: 1 credit
- Pitch deck and viewing results: free

## What changes in the app
- **New Pricing page** that compares the Free and Pro plans and shows the credit packs.
- **Credit counter in the top bar** with the number of credits left. Clicking it opens a breakdown: daily, monthly and top-up credits, plus when each resets.
- **Billing section on the Profile page:** your current plan, credit balance and recent credit use.
- **Out of credits:** the AI action stops before it starts and shows a "Not enough credits" message, with links to upgrade or wait for the daily reset.
- **Upgrading for now:** there is no real checkout yet. The Upgrade button saves your interest and says payments are coming soon. Plans can be switched by hand for testing.

## Technical details
- New tables `user_credits` (plan, daily_balance, daily_reset_at, monthly_balance, monthly_reset_at, topup_balance) and `credit_ledger` (user_id, action, amount, created_at). Both get grants and owner-only RLS; users get read access only.
- A security-definer function `spend_credits(action)` handles everything in one step: it runs the lazy daily and monthly resets, checks the balance, takes credits in order (daily, monthly, top-up), writes to the ledger, and returns the new balance or raises `insufficient_credits`.
- Edge functions (the 6 agents, stress-test, canvas-assist, advisor-chat-stream) call `spend_credits` with the user's JWT before calling the AI. They return 402 `{error:"insufficient_credits"}` if there aren't enough credits, so this can't be bypassed from the browser. The batch "Convene the agents" run charges once, through the console.
- A new user signup trigger creates a Free `user_credits` row, and a backfill creates rows for existing users.
- The plan settings and credit costs live in `src/lib/credits.ts`, mirrored server-side, and are covered by tests: 5 daily credits, 100 monthly credits for Pro, the spend order, and blocking when the balance is too low.
- New pieces: a `CreditsContext` (balance plus a refresh after each AI action), `PricingPage` at `/pricing`, the counter in `AppLayout`, and a billing block on `ProfilePage`.
- Real payments (Stripe with your own key) can be added later to set `plan='pro'` and add top-ups.
