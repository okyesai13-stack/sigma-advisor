import { createClient } from "npm:@supabase/supabase-js@2";
import { spendCredits } from "../_shared/credits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};
const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
const latest = (db: any, t: string, id: string) => db.from(t).select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const businessId = body.business_id;
    const goal = typeof body.goal === "string" ? body.goal.slice(0, 300) : "";
    const weeks = [8, 12, 24].includes(body.weeks) ? body.weeks : 12;
    if (typeof businessId !== "string") return j({ error: "Invalid input" }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: biz } = await db.from("business_store").select("*").eq("id", businessId).eq("user_id", u.user.id).maybeSingle();
    if (!biz) return j({ error: "Not found" }, 404);
    const spent = await spendCredits(auth, "roadmap");
    if (spent) return j({ error: spent }, spent === "insufficient_credits" ? 402 : 500);

    const [mr, bp, fm, ms, st] = await Promise.all(["market_research_result", "business_plan_result", "financial_model_result", "marketing_strategy_result", "idea_stress_test"].map((t) => latest(db, t, businessId)));
    const ctx = JSON.stringify({
      market: mr.data?.summary, plan: bp.data && { summary: bp.data.executive_summary, milestones: bp.data.milestones, gtm: bp.data.go_to_market, team: bp.data.team_needs },
      finance: fm.data && { summary: fm.data.summary, funding: fm.data.funding_needs }, marketing: ms.data && { summary: ms.data.summary, roadmap: ms.data.roadmap_90_days },
      stress: st.data && { score: st.data.score, killers: st.data.killers },
    }).slice(0, 7000);

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return j({ error: "AI not configured" }, 500);
    const system = `You are a startup operator building an execution roadmap. Output ONLY JSON:
{"phases":[{"title":"string","weeks":"e.g. Weeks 1-2","goal":"one sentence outcome","milestones":["concrete deliverable, max 20 words", ...]}]}
Give 4-6 phases that together cover ${weeks} weeks in order (validate -> build MVP -> launch -> grow -> raise/scale as fits the stage). Each phase has 3-5 milestones that are specific, measurable and doable by a small team. Address the stress-test killer risks early.`;
    const user = `Business: ${biz.business_name} (${biz.stage}) — ${biz.pitch}
Industry: ${biz.industry} | Market: ${biz.target_market} | Geo: ${biz.geography || "Global"}
Founder goal: ${goal || "Reach product-market fit and first paying customers"}
Agent results: ${ctx}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "system", content: system }, { role: "user", content: user }], response_format: { type: "json_object" } }),
    });
    if (res.status === 429) return j({ error: "Too many requests, try again shortly." }, 429);
    if (res.status === 402) return j({ error: "AI credits exhausted." }, 402);
    if (!res.ok) return j({ error: `AI error ${res.status}` }, 500);
    const data = await res.json();
    const m = (data.choices?.[0]?.message?.content || "").match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : { phases: [] };
    const phases = (Array.isArray(parsed.phases) ? parsed.phases : []).slice(0, 6).map((p: any) => ({
      id: crypto.randomUUID(), title: String(p.title || "Phase"), weeks: String(p.weeks || ""), goal: String(p.goal || ""),
      milestones: (Array.isArray(p.milestones) ? p.milestones : []).slice(0, 6).map((t: unknown) => ({ id: crypto.randomUUID(), text: String(t).slice(0, 200), done: false })),
    }));
    if (!phases.length) return j({ error: "AI returned no roadmap, try again." }, 500);

    const { data: saved, error } = await db.from("startup_roadmap").upsert({ business_id: businessId, goal, phases }, { onConflict: "business_id" }).select().single();
    if (error) throw error;
    return j(saved);
  } catch (e) {
    console.error("[startup-roadmap]", e);
    return j({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
