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
    if (!business_id) return j({ success: false, error: "business_id required" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: biz } = await supabase.from("business_store").select("*").eq("id", business_id).maybeSingle();
    if (!biz) return j({ success: false, error: "Business not found" }, 404);

    const system = `You are a startup CFO building a financial model. Output ONLY valid JSON:
{
  "summary": "string - 2-3 sentence financial story",
  "revenue_streams": [{ "name": "string", "model": "string", "amount": "string e.g. $X/yr" }],
  "cost_structure": [{ "category": "string", "amount": "string", "type": "fixed|variable" }],
  "projections_3yr": [
    { "year": "Year 1", "revenue": "string", "costs": "string", "profit": "string", "customers": "string" },
    { "year": "Year 2", "revenue": "string", "costs": "string", "profit": "string", "customers": "string" },
    { "year": "Year 3", "revenue": "string", "costs": "string", "profit": "string", "customers": "string" }
  ],
  "unit_economics": {
    "cac": "string", "ltv": "string", "ltv_cac_ratio": "string", "payback_period": "string", "gross_margin": "string"
  },
  "funding_needs": {
    "amount": "string", "use_of_funds": "string", "runway": "string", "next_round": "string"
  },
  "key_assumptions": ["string - 4-6 critical assumptions driving the model"]
}
Use realistic numbers grounded in the industry. Currency in the brief's geography (default USD).`;

    const user = `Business: ${biz.business_name}
Pitch: ${biz.pitch}
Stage: ${biz.stage}
Industry: ${biz.industry}
Target market: ${biz.target_market}
Geography: ${biz.geography || "Global"}
Context: ${biz.raw_context || "N/A"}

Build a credible 3-year financial model.`;

    const result = await callAI(system, user);
    await supabase.from("financial_model_result").delete().eq("business_id", business_id);
    const { error } = await supabase.from("financial_model_result").insert({
      business_id,
      summary: result.summary || null,
      revenue_streams: result.revenue_streams || [],
      cost_structure: result.cost_structure || [],
      projections_3yr: result.projections_3yr || [],
      unit_economics: result.unit_economics || {},
      funding_needs: result.funding_needs || {},
      key_assumptions: result.key_assumptions || [],
    });
    if (error) throw error;
    return j({ success: true, data: result });
  } catch (e) {
    console.error("[financial-model]", e);
    return j({ success: false, error: e instanceof Error ? e.message : "Unknown" }, 500);
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
    }),
  });
  if (res.status === 429) throw Object.assign(new Error("Rate limit"), { status: 429 });
  if (res.status === 402) throw Object.assign(new Error("AI credits exhausted"), { status: 402 });
  if (!res.ok) throw new Error(`AI gateway ${res.status}`);
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "";
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in response");
  return JSON.parse(match[0]);
}
function j(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
