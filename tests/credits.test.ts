import { describe, it, expect } from "vitest";
import { applySpend, DAILY_CREDITS, PLANS, CREDIT_COSTS } from "../src/lib/credits";

describe("credits", () => {
  it("gives 5 daily credits", () => expect(DAILY_CREDITS).toBe(5));
  it("Pro costs $20 with 100 monthly credits", () => {
    expect(PLANS.pro.price).toBe(20);
    expect(PLANS.pro.monthlyCredits).toBe(100);
  });
  it("spends daily first, then monthly, then top-up", () => {
    expect(applySpend({ daily: 5, monthly: 3, topup: 10 }, CREDIT_COSTS.convene)).toEqual({ daily: 0, monthly: 0, topup: 8 });
  });
  it("blocks when balance is too low", () => {
    expect(applySpend({ daily: 4, monthly: 0, topup: 0 }, CREDIT_COSTS.stress_test)).toBeNull();
  });
});
