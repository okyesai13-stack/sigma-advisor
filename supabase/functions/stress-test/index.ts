import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};
const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const AREAS = ["Customer demand", "Problem urgency", "Competition", "Making money", "Reaching customers", "Ability to build", "Team fit", "Timing and rules"];
const TABLES = ["market_research_result", "competitor_analysis_result", "business_plan_result", "financial_model_result", "marketing_strategy_result", "ai_operations_result"];
const verdictFor = (s: number) => (s >= 80 ? "Solid" : s >= 60 ? "Promising" : s >= 40 ? "Shaky" : "Fragile");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const business_id = body?.business_id;
    if (typeof business_id !== "string" || !/^[0-9a-f-]{36}$/i.test(business_id)) return j({ error: "Invalid business_id" }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: biz } = await db.from("business_store").select("*").eq("id", business_id).eq("user_id", u.user.id).maybeSingle();
    if (!biz) return j({ error: "Not found" }, 404);

    const results = await Promise.all(TABLES.map(async (t) => {
      const { data } = await db.from(t).select("*").eq("business_id", business_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!data) return `${t}: not generated`;
      const { id: _i, business_id: _b, created_at: _c, ...rest } = data;
      return `${t}: ${JSON.stringify(rest).slice(0, 3000)}`;
    }));
    const { data: canvas } = await db.from("lean_canvas").select("boxes").eq("business_id", business_id).maybeSingle();
    const boxes = Object.fromEntries(Object.entries(canvas?.boxes || {}).filter(([k]) => !k.startsWith("__")));

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return j({ error: "AI not configured" }, 500);

    const system = `You are a ruthless but fair top-tier VC partner stress-testing a startup idea. Find where it will fail. Use the founder's own data; quote numbers and names. Output ONLY JSON:
{"score": 0-100 overall survival score, "reason": "one sentence",
"risks": [exactly 8 items, one per area in this order: ${AREAS.join(", ")}; each {"area": string, "score": 0-10 (10 = very safe), "why": "max 30 words citing their data", "question": "the one hard investor question", "fix": "concrete next step doable this month"}],
"killers": [exactly 3 {"risk": string, "warning_sign": string, "test": "cheap way to check it this week"}],
"blind_spots": [2-5 strings: contradictions between agent results or between results and the board, e.g. market size vs revenue plan]}
Be honest; do not inflate scores.`;
    const user = `Business: ${biz.business_name} (${biz.stage}) — ${biz.pitch}
Industry: ${biz.industry} | Market: ${biz.target_market} | Geo: ${biz.geography || "Global"}
Context: ${(biz.raw_context || "").slice(0, 1500)}
AGENT RESULTS:
${results.join("\n")}
FOUNDER BOARD: ${JSON.stringify(boxes).slice(0, 3000)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) return j({ error: "Too many requests, try again shortly." }, 429);
    if (res.status === 402) return j({ error: "AI credits exhausted." }, 402);
    if (!res.ok) return j({ error: `AI error ${res.status}` }, 500);
    const data = await res.json();
    const m = (data.choices?.[0]?.message?.content || "").match(/\{[\s\S]*\}/);
    if (!m) return j({ error: "AI returned no result" }, 500);
    const p = JSON.parse(m[0]);

    const clamp = (n: unknown, max: number) => Math.max(0, Math.min(max, Math.round(Number(n) || 0)));
    const risks = (Array.isArray(p.risks) ? p.risks : []).slice(0, 8).map((r: any, i: number) => ({
      area: String(r.area || AREAS[i]), score: clamp(r.score, 10), why: String(r.why || ""), question: String(r.question || ""), fix: String(r.fix || ""),
    }));
    const score = clamp(p.score, 100);
    const row = {
      business_id, score, verdict: verdictFor(score), reason: String(p.reason || ""), risks,
      killers: (Array.isArray(p.killers) ? p.killers : []).slice(0, 3).map((k: any) => ({ risk: String(k.risk || ""), warning_sign: String(k.warning_sign || ""), test: String(k.test || "") })),
      blind_spots: (Array.isArray(p.blind_spots) ? p.blind_spots : []).slice(0, 5).map(String),
    };
    const { data: saved, error } = await db.from("idea_stress_test").insert(row).select().single();
    if (error) throw error;
    return j(saved);
  } catch (e) {
    console.error("[stress-test]", e);
    return j({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
