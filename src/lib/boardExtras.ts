export type TaskStatus = "todo" | "doing" | "done";
export interface BoardTask { id: string; text: string; owner: string; due: string; status: TaskStatus }

export const nextStatus = (s: TaskStatus): TaskStatus => (s === "todo" ? "doing" : s === "doing" ? "done" : "todo");

export interface History<T> { past: T[]; future: T[] }
export const HISTORY_LIMIT = 50;

/** Record a new snapshot: previous state goes on the undo stack, redo stack is cleared. */
export function record<T>(h: History<T>, prev: T): History<T> {
  return { past: [...h.past, prev].slice(-HISTORY_LIMIT), future: [] };
}
export function undo<T>(h: History<T>, current: T): { h: History<T>; state: T } | null {
  if (!h.past.length) return null;
  return { h: { past: h.past.slice(0, -1), future: [current, ...h.future] }, state: h.past[h.past.length - 1] };
}
export function redo<T>(h: History<T>, current: T): { h: History<T>; state: T } | null {
  if (!h.future.length) return null;
  return { h: { past: [...h.past, current], future: h.future.slice(1) }, state: h.future[0] };
}

export const TEMPLATES: { id: string; label: string; notes: string[] }[] = [
  { id: "swot", label: "SWOT", notes: ["STRENGTHS: what we do better than anyone", "WEAKNESSES: where we fall short today", "OPPORTUNITIES: openings in the market", "THREATS: what could hurt us"] },
  { id: "journey", label: "Customer journey", notes: ["1. Awareness: how they first hear of us", "2. Consideration: what they compare", "3. Purchase: what makes them buy", "4. Onboarding: first value moment", "5. Retention: why they stay", "6. Referral: why they tell others"] },
  { id: "gtm", label: "Go-to-market plan", notes: ["Target segment: who we sell to first", "Offer & pricing: what they get and pay", "Channels: where we reach them", "Sales motion: self-serve, sales or partners", "Launch milestones: next 30 / 60 / 90 days", "Success metric: the number we watch"] },
];
