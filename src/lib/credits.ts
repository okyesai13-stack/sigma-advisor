import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Mirrors public.credit_cost / refresh_credits in the database.
export const DAILY_CREDITS = 5;
export const PLANS = {
  free: { name: "Free", price: 0, monthlyCredits: 0 },
  pro: { name: "Pro", price: 20, monthlyCredits: 100 },
} as const;
export type PlanId = keyof typeof PLANS;

export const CREDIT_COSTS = {
  convene: 10,
  agent_rerun: 2,
  stress_test: 5,
  canvas_ai: 1,
  advisor_chat: 1,
} as const;
export type CreditAction = keyof typeof CREDIT_COSTS;

export const CREDIT_PACKS = [
  { credits: 50, price: 5 },
  { credits: 150, price: 12 },
  { credits: 400, price: 29 },
];

export const ACTION_LABELS: Record<string, string> = {
  convene: "Ran all agents",
  agent_rerun: "Re-ran an agent",
  stress_test: "Stress test",
  canvas_ai: "Whiteboard AI",
  advisor_chat: "Advisor chat",
};

export interface Balances { daily: number; monthly: number; topup: number }

// Daily credits go first, then monthly, then top-ups. Returns null when the balance is too low.
export function applySpend(b: Balances, cost: number): Balances | null {
  if (b.daily + b.monthly + b.topup < cost) return null;
  let left = cost;
  const d = Math.min(left, b.daily); left -= d;
  const m = Math.min(left, b.monthly); left -= m;
  return { daily: b.daily - d, monthly: b.monthly - m, topup: b.topup - left };
}

export interface CreditRow {
  plan: PlanId; daily_balance: number; daily_reset_at: string; monthly_balance: number;
  monthly_reset_at: string; topup_balance: number; upgrade_requested_at: string | null;
}

const EVT = "credits:changed";
export const notifyCreditsChanged = () => window.dispatchEvent(new Event(EVT));

export function useCredits() {
  const [credits, setCredits] = useState<CreditRow | null>(null);
  const load = useCallback(async () => {
    const { data } = await (supabase.rpc as any)("get_my_credits");
    if (data) setCredits(data as CreditRow);
  }, []);
  useEffect(() => {
    load();
    window.addEventListener(EVT, load);
    return () => window.removeEventListener(EVT, load);
  }, [load]);
  const total = credits ? credits.daily_balance + credits.monthly_balance + credits.topup_balance : 0;
  return { credits, total, reload: load };
}

// Charges for an action from the browser (used for agent runs). Returns true on success.
export async function spendCredits(action: CreditAction): Promise<"ok" | "insufficient" | "error"> {
  const { error } = await (supabase.rpc as any)("spend_credits", { p_action: action });
  notifyCreditsChanged();
  if (!error) return "ok";
  return error.message?.includes("insufficient_credits") ? "insufficient" : "error";
}

export const isOutOfCredits = (msg?: string) => !!msg && msg.includes("insufficient_credits");
export const OUT_OF_CREDITS = {
  title: "Not enough credits",
  description: "You get 5 free credits every day at midnight (UTC). Upgrade to Pro on the Pricing page for 100 more each month.",
};

// Turns an edge-function failure into a toast, showing the out-of-credits message on 402.
export function creditAwareError(error: any, fallbackTitle: string) {
  notifyCreditsChanged();
  if (error?.context?.status === 402) return { ...OUT_OF_CREDITS, variant: "destructive" as const };
  return { title: fallbackTitle, description: error?.message, variant: "destructive" as const };
}
