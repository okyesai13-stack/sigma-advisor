import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { business_id, message } = await req.json();
    if (!business_id || !message) return new Response(JSON.stringify({ error: "business_id and message required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [biz, mr, ca, bp, fm, hist] = await Promise.all([
      supabase.from("business_store").select("*").eq("id", business_id).maybeSingle(),
      supabase.from("market_research_result").select("*").eq("business_id", business_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("competitor_analysis_result").select("*").eq("business_id", business_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("business_plan_result").select("*").eq("business_id", business_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("financial_model_result").select("*").eq("business_id", business_id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("advisor_messages").select("role, content").eq("business_id", business_id).order("created_at", { ascending: true }).limit(20),
    ]);

    if (!biz.data) return new Response(JSON.stringify({ error: "Business not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    await supabase.from("advisor_messages").insert({ business_id, role: "user", content: message });

    const system = `You are the Resident Strategy Advisor at Planz — sharp, candid, and grounded in the dossier below. Conversational, no markdown headers or bold. Use • for bullets. Reference the dossier by name. End with a pointed follow-up question.

DOSSIER:
Business: ${biz.data.business_name} (${biz.data.stage})
Pitch: ${biz.data.pitch}
Industry: ${biz.data.industry} | Market: ${biz.data.target_market} | Geo: ${biz.data.geography || "Global"}

Market: ${mr.data?.summary || "—"}
Competitors: ${(ca.data?.competitors || []).slice(0, 5).map((c: any) => c.name).join(", ") || "—"}
Differentiation: ${(ca.data?.differentiation || []).slice(0, 3).map((d: any) => d.angle || d).join("; ") || "—"}
Exec summary: ${bp.data?.executive_summary || "—"}
GTM beachhead: ${bp.data?.go_to_market?.beachhead || "—"}
Y3 revenue: ${fm.data?.projections_3yr?.[2]?.revenue || "—"} | Funding: ${fm.data?.funding_needs?.amount || "—"}`;

    const history = (hist.data || []).map((m: any) => ({ role: m.role, content: m.content }));
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: message }],
        temperature: 0.7,
        stream: true,
      }),
    });
    if (upstream.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (upstream.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!upstream.ok || !upstream.body) throw new Error(`AI gateway ${upstream.status}`);

    let assembled = "";
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.body!.getReader();
        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buf = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n");
            buf = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const json = line.slice(6).trim();
                if (json === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(json);
                  const delta = parsed.choices?.[0]?.delta?.content;
                  if (delta) assembled += delta;
                } catch { /* ignore */ }
              }
              controller.enqueue(encoder.encode(line + "\n"));
            }
          }
          if (buf) controller.enqueue(encoder.encode(buf));
          if (assembled) {
            await supabase.from("advisor_messages").insert({ business_id, role: "assistant", content: assembled });
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  } catch (e) {
    console.error("[advisor-chat-stream]", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
