export type Verdict = "Fragile" | "Shaky" | "Promising" | "Solid";
export interface StressRisk { area: string; score: number; why: string; question: string; fix: string }
export interface KillerRisk { risk: string; warning_sign: string; test: string }

export const RISK_AREAS = ["Customer demand", "Problem urgency", "Competition", "Making money", "Reaching customers", "Ability to build", "Team fit", "Timing and rules"];

/** 0–39 Fragile, 40–59 Shaky, 60–79 Promising, 80–100 Solid */
export const verdictFor = (score: number): Verdict =>
  score >= 80 ? "Solid" : score >= 60 ? "Promising" : score >= 40 ? "Shaky" : "Fragile";

/** Area score 0–10: 0–4 red, 5–6 amber, 7–10 green */
export const riskLevel = (s: number): "red" | "amber" | "green" => (s <= 4 ? "red" : s <= 6 ? "amber" : "green");

export const scoreChange = (current: number, previous?: number | null): number | null =>
  previous == null ? null : current - previous;
