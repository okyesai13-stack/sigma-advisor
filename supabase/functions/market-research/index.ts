import { assertAiAvailable, recordAiBlock } from '../_shared/ai-service-state.ts';
import { claimSpecialist } from '../_shared/specialist-billing.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  let paid: string | null = null; let billing: any;
  try {
    const { business_id, paid_run } = await req.json();
    if (!business_id) return j({ success: false, error: "business_id required" }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) throw new Error("Service configuration missing");
    const supabase = createClient(url, serviceKey); billing=supabase;
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return j({ error: "Not authenticated" }, 401);
    const { data: caller, error: authError } = await supabase.auth.getUser(authorization.slice(7));
    if (authError || !caller.user) return j({ error: "Not authenticated" }, 401);
    const { data: owned } = await supabase.from("business_store").select("id").eq("id", business_id).eq("user_id", caller.user.id).maybeSingle();
    if (!owned) return j({ error: "Business unavailable" }, 403);
    const { data: biz } = await supabase.from("business_store").select("*").eq("id", business_id).maybeSingle();
    if (!biz) return j({ success: false, error: "Business not found" }, 404);

    await assertAiAvailable("google/gemini-3-flash-preview");
    paid=await claimSpecialist(supabase,authorization,caller.user.id,business_id,"market-research",paid_run);

    const system = `You are a senior market research strategist. Output ONLY valid JSON, no prose:
{
  "summary": "string - 2-3 sentence market overview",
  "market_size": { "global": "string", "addressable": "string", "growth_rate": "string" },
  "tam_sam_som": {
    "tam": { "value": "$X B", "note": "string" },
    "sam": { "value": "$X B", "note": "string" },
    "som": { "value": "$X M", "note": "string" }
  },
  "trends": [{ "title": "string", "impact": "high|medium|low" }],
  "target_audience": [{ "segment": "string", "size": "string", "pain": "string" }],
  "opportunities": [{ "title": "string", "rationale": "string" }],
  "risks": [{ "title": "string", "severity": "high|medium|low" }]
}
Provide 4-6 items per array. Be specific to the business and industry.`;

    const user = `Business: ${biz.business_name}
Pitch: ${biz.pitch}
Stage: ${biz.stage}
Industry: ${biz.industry}
Target market: ${biz.target_market}
Geography: ${biz.geography || "Global"}
Context: ${biz.raw_context || "N/A"}

Conduct rigorous market research.`;

    const result = await callAI(system, user);
    await supabase.from("market_research_result").delete().eq("business_id", business_id);
    const { error } = await supabase.from("market_research_result").insert({
      business_id,
      summary: result.summary || null,
      market_size: result.market_size || {},
      tam_sam_som: result.tam_sam_som || {},
      trends: result.trends || [],
      target_audience: result.target_audience || [],
      opportunities: result.opportunities || [],
      risks: result.risks || [],
    });
    if (error) throw error;
    await supabase.rpc("record_ai_specialist",{p_id:paid,p_endpoint:"market-research",p_result:{success:true}});
    return j({ success: true, data: result });
  } catch (e: any) {
    await recordAiBlock("google/gemini-3-flash-preview",e);
    if(paid&&billing)await billing.rpc("record_ai_specialist",{p_id:paid,p_endpoint:"market-research",p_result:{success:false,error:e instanceof Error?e.message:"Failed"}});
    console.error("[market-research]", e);
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
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });
  if (res.status === 429) throw Object.assign(new Error("Rate limit"), { status: 429 });
  if (res.status === 402) throw Object.assign(new Error("AI credits exhausted"), { status: 402 });
  if (!res.ok) throw Object.assign(new Error(`AI gateway ${res.status}: ${(await res.text()).slice(0,200)}`), {status:res.status});
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}

function j(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
