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

    const system = `You are a strategy consultant drafting a business plan. Output ONLY valid JSON:
{
  "executive_summary": "string - 3-4 sentence sharp summary suitable for an investor one-pager",
  "value_proposition": "string - crisp value prop statement",
  "business_model": {
    "customer_segments": "string",
    "channels": "string",
    "revenue_model": "string",
    "key_resources": "string",
    "key_partners": "string"
  },
  "go_to_market": {
    "beachhead": "string - first customer segment",
    "channels": "string",
    "messaging": "string",
    "first_90_days": "string"
  },
  "milestones": [{ "title": "string", "timeline": "string", "description": "string" }],
  "risks": [{ "title": "string", "mitigation": "string" }],
  "team_needs": [{ "role": "string", "when": "string" }]
}
Provide 4-6 milestones, 4-5 risks, 3-5 team needs.`;

    const user = `Business: ${biz.business_name}
Pitch: ${biz.pitch}
Stage: ${biz.stage}
Industry: ${biz.industry}
Target market: ${biz.target_market}
Geography: ${biz.geography || "Global"}
Context: ${biz.raw_context || "N/A"}

Draft an investor-ready business plan.`;

    const result = await callAI(system, user);
    await supabase.from("business_plan_result").delete().eq("business_id", business_id);
    const { error } = await supabase.from("business_plan_result").insert({
      business_id,
      executive_summary: result.executive_summary || null,
      value_proposition: result.value_proposition || null,
      business_model: result.business_model || {},
      go_to_market: result.go_to_market || {},
      milestones: result.milestones || [],
      risks: result.risks || [],
      team_needs: result.team_needs || [],
    });
    if (error) throw error;
    return j({ success: true, data: result });
  } catch (e) {
    console.error("[business-plan]", e);
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
