import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { business_id } = await req.json();
    if (!business_id || typeof business_id !== "string") return j({ success: false, error: "business_id required" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: biz } = await supabase.from("business_store").select("*").eq("id", business_id).maybeSingle();
    if (!biz) return j({ success: false, error: "Business not found" }, 404);

    const system = `You are a senior AI transformation consultant. You find the real operational pain points of a business in the current AI era and prescribe concrete, practical AI automations with measurable ROI. Be specific: name real tools and realistic numbers. Output ONLY valid JSON:
{
  "summary": "string - 2-3 sentences on the biggest AI opportunity and threat for this business",
  "readiness": { "score": "number 0-100", "level": "Low|Medium|High", "biggest_pain_point": "string", "explanation": "string" },
  "quick_wins": [{ "title": "string", "pain_point": "string", "solution": "string", "tools": "string", "hours_saved_per_week": "string", "difficulty": "Low|Medium|High", "timeline": "string e.g. Days 1-14" }],
  "systemic_automations": [{ "title": "string", "workflow": "string", "how_it_works": "string", "tools": "string", "impact": "string", "difficulty": "Low|Medium|High", "timeline": "string" }],
  "tool_stack": [{ "category": "string", "tool": "string", "purpose": "string", "est_cost": "string" }],
  "defensibility": { "ai_threat_level": "Low|Medium|High", "threat": "string", "moat_strategy": "string", "data_advantage": "string" },
  "roi": { "weekly_hours_saved": "string", "overhead_reduction": "string", "monthly_tool_cost": "string", "payback_period": "string" }
}
Provide 4 quick wins, 3 systemic automations, 5-7 tools.`;

    const user = `Return the blueprint as JSON.
Business: ${biz.business_name}
Pitch: ${biz.pitch}
Stage: ${biz.stage}
Industry: ${biz.industry}
Target market: ${biz.target_market}
Geography: ${biz.geography || "Global"}
Context: ${biz.raw_context || "N/A"}`;

    const result = await callAI(system, user);
    await supabase.from("ai_operations_result").delete().eq("business_id", business_id);
    const { error } = await supabase.from("ai_operations_result").insert({
      business_id,
      summary: result.summary || null,
      readiness: result.readiness || {},
      quick_wins: result.quick_wins || [],
      systemic_automations: result.systemic_automations || [],
      tool_stack: result.tool_stack || [],
      defensibility: result.defensibility || {},
      roi: result.roi || {},
    });
    if (error) throw error;
    return j({ success: true, data: result });
  } catch (e: any) {
    console.error("[ai-operations]", e);
    return j({ success: false, error: e instanceof Error ? e.message : "Unknown" }, e?.status || 500);
  }
});

async function callAI(system: string, user: string) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      reasoning_effort: "low",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) throw Object.assign(new Error("Rate limit reached, try again shortly"), { status: 429 });
  if (res.status === 402) throw Object.assign(new Error("AI credits exhausted"), { status: 402 });
  if (!res.ok) throw Object.assign(new Error(`AI gateway ${res.status}: ${(await res.text()).slice(0, 200)}`), { status: res.status });
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}
function j(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
