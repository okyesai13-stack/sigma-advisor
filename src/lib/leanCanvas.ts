export const CANVAS_BOXES = [
  { key: "problem", title: "Problem", hint: "Top 1–3 problems", section: "market", area: "md:col-start-1 md:row-start-1 md:row-span-2" },
  { key: "solution", title: "Solution", hint: "Top features", section: "plan", area: "md:col-start-2 md:row-start-1" },
  { key: "key_metrics", title: "Key Metrics", hint: "Numbers that matter", section: "fin", area: "md:col-start-2 md:row-start-2" },
  { key: "uvp", title: "Unique Value Proposition", hint: "Single, clear message", section: "plan", area: "md:col-start-3 md:row-start-1 md:row-span-2" },
  { key: "unfair_advantage", title: "Unfair Advantage", hint: "Can't be copied", section: "comp", area: "md:col-start-4 md:row-start-1" },
  { key: "channels", title: "Channels", hint: "Path to customers", section: "mkt", area: "md:col-start-4 md:row-start-2" },
  { key: "customer_segments", title: "Customer Segments", hint: "Target customers", section: "market", area: "md:col-start-5 md:row-start-1 md:row-span-2" },
  { key: "cost_structure", title: "Cost Structure", hint: "Main costs", section: "fin", area: "md:col-start-1 md:col-span-2 lg:col-span-2 md:row-start-3" },
  { key: "revenue_streams", title: "Revenue Streams", hint: "How you earn", section: "fin", area: "md:col-start-3 md:col-span-3 md:row-start-3" },
] as const;

export type BoxKey = typeof CANVAS_BOXES[number]["key"];
export type Boxes = Partial<Record<BoxKey, string[]>>;

const text = (v: any): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  if (Array.isArray(v)) return v.map(text).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const pref = v.name ?? v.title ?? v.segment ?? v.stream ?? v.item ?? v.category ?? v.channel ?? v.metric ?? v.persona;
    const detail = v.description ?? v.amount ?? v.value ?? v.rationale ?? v.target ?? v.details;
    if (pref) return detail ? `${text(pref)} — ${text(detail)}` : text(pref);
    return Object.values(v).map(text).filter(Boolean).join(" · ");
  }
  return "";
};
const list = (v: any, n = 4): string[] =>
  (Array.isArray(v) ? v.map(text) : v ? [text(v)] : []).map((s) => s.trim()).filter(Boolean).map((s) => s.slice(0, 220)).slice(0, n);

export const autofill = (r: { mr?: any; ca?: any; bp?: any; fm?: any; ms?: any }): Boxes => {
  const ue = r.fm?.unit_economics || {};
  const metrics = Object.entries(ue).slice(0, 4).map(([k, v]) => `${k.replace(/_/g, " ")}: ${text(v)}`);
  return {
    problem: list(r.mr?.opportunities, 3),
    solution: list([r.bp?.business_model?.key_resources, r.bp?.go_to_market?.messaging].filter(Boolean), 3),
    key_metrics: metrics.length ? metrics : list(r.ms?.kpis, 4),
    uvp: list(r.bp?.value_proposition, 1),
    unfair_advantage: list(r.ca?.differentiation, 3),
    channels: list(r.ms?.channels, 4),
    customer_segments: list(r.mr?.target_audience, 3),
    cost_structure: list(r.fm?.cost_structure, 4),
    revenue_streams: list(r.fm?.revenue_streams, 4),
  };
};
