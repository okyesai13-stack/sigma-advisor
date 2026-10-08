import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const EDITABLE: Record<string, { table: string; label: string; fields: string[] }> = {
  market_research: { table: "market_research_result", label: "Market Research", fields: ["summary", "market_size", "tam_sam_som", "trends", "target_audience", "opportunities", "risks"] },
  competitor_analysis: { table: "competitor_analysis_result", label: "Competitor Analysis", fields: ["summary", "competitors", "swot", "positioning", "differentiation"] },
  business_plan: { table: "business_plan_result", label: "Business Plan", fields: ["executive_summary", "value_proposition", "business_model", "go_to_market", "milestones", "risks", "team_needs"] },
  financial_model: { table: "financial_model_result", label: "Financial Model", fields: ["summary", "revenue_streams", "cost_structure", "projections_3yr", "unit_economics", "funding_needs", "key_assumptions"] },
  marketing_strategy: { table: "marketing_strategy_result", label: "Marketing Strategy", fields: ["summary", "positioning", "personas", "channels", "content_pillars", "campaigns", "budget", "kpis", "roadmap_90_days"] },
  ai_operations: { table: "ai_operations_result", label: "AI Operations", fields: ["summary", "readiness", "quick_wins", "systemic_automations", "tool_stack", "defensibility", "roi"] },
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const prettyField = (f: string) => f.replace(/_/g, " ");

async function detectEdit(key: string, message: string, current: Record<string, any>) {
  const ctx = JSON.stringify(current).slice(0, 14000);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["is_edit", "agent", "field", "new_value_json", "summary"],
    properties: {
      is_edit: { type: "boolean" },
      agent: { type: "string", enum: ["", ...Object.keys(EDITABLE)] },
      field: { type: "string" },
      new_value_json: { type: "string" },
      summary: { type: "string" },
    },
  };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      instructions: `Decide if the user is asking to CHANGE/EDIT/UPDATE/REWRITE content in one of the saved agent results. Questions or advice requests are NOT edits.
If it is an edit: pick agent and field from the current results, produce the complete new value for that field as a JSON string in new_value_json, preserving the existing shape (string stays string, arrays/objects keep the same keys). Only change what was asked. summary = one short sentence describing what changed.
If not an edit: is_edit=false, agent="", field="", new_value_json="", summary="".`,
      input: [{ role: "user", content: `CURRENT RESULTS (json):\n${ctx}\n\nUSER MESSAGE:\n${message}` }],
      text: { format: { type: "json_schema", name: "edit_intent", strict: true, schema } },
    }),
  });
  if (!res.ok || !res.body) {
    console.error("[advisor] intent", res.status, await res.text().catch(() => ""));
    return null;
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() || "";
    for (const l of lines) {
      if (!l.startsWith("data: ")) continue;
      try {
        const ev = JSON.parse(l.slice(6));
        if (ev.type === "response.output_text.delta") out += ev.delta;
      } catch { /* ignore */ }
    }
  }
  try { return JSON.parse(out); } catch { return null; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { business_id, message } = body;
    if (!business_id) return json({ error: "business_id required" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Ownership check with the caller's own token
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const uid = userData?.user?.id;
    if (!uid) return json({ error: "Unauthorized" }, 401);
    const { data: owned } = await supabase.from("business_store").select("id").eq("id", business_id).eq("user_id", uid).maybeSingle();
    if (!owned) return json({ error: "Business not found" }, 404);

    // Undo a previous edit
    if (body.undo) {
      const { agent, field, previous } = body.undo;
      const cfg = EDITABLE[agent];
      if (!cfg || !cfg.fields.includes(field)) return json({ error: "Invalid field" }, 400);
      const { data: row } = await supabase.from(cfg.table).select("id").eq("business_id", business_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!row) return json({ error: "Result not found" }, 404);
      const { error } = await supabase.from(cfg.table).update({ [field]: previous }).eq("id", row.id);
      if (error) return json({ error: error.message }, 500);
      await supabase.from("advisor_messages").insert({ business_id, role: "assistant", content: `Reverted ${cfg.label} → ${prettyField(field)}.` });
      return json({ success: true });
    }

    if (!message) return json({ error: "message required" }, 400);

    const [biz, mr, ca, bp, fm, ms, aio, hist] = await Promise.all([
      supabase.from("business_store").select("*").eq("id", business_id).maybeSingle(),
      ...Object.values(EDITABLE).map((c) =>
        supabase.from(c.table).select("*").eq("business_id", business_id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      ),
      supabase.from("advisor_messages").select("role, content").eq("business_id", business_id).order("created_at", { ascending: true }).limit(20),
    ]) as any[];

    if (!biz.data) return json({ error: "Business not found" }, 404);
    await supabase.from("advisor_messages").insert({ business_id, role: "user", content: message });

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY not configured");

    // ---- Edit detection ----
    const rows: Record<string, any> = { market_research: mr.data, competitor_analysis: ca.data, business_plan: bp.data, financial_model: fm.data, marketing_strategy: ms.data, ai_operations: aio.data };
    const current: Record<string, any> = {};
    for (const [k, cfg] of Object.entries(EDITABLE)) {
      if (!rows[k]) continue;
      current[k] = Object.fromEntries(cfg.fields.map((f) => [f, rows[k][f]]));
    }
    if (Object.keys(current).length) {
      const intent = await detectEdit(key, message, current);
      if (intent?.field) intent.field = String(intent.field).split(".").pop();
      const cfg = intent?.is_edit ? EDITABLE[intent.agent] : null;
      if (cfg && cfg.fields.includes(intent.field) && rows[intent.agent]) {
        const row = rows[intent.agent];
        const previous = row[intent.field];
        let newValue: any = intent.new_value_json;
        try { newValue = JSON.parse(intent.new_value_json); } catch { /* plain string */ }
        if (typeof previous === "string" && typeof newValue !== "string") newValue = String(intent.new_value_json);
        const { error } = await supabase.from(cfg.table).update({ [intent.field]: newValue }).eq("id", row.id);
        if (!error) {
          const text = `Updated ${cfg.label} → ${prettyField(intent.field)}. ${intent.summary || ""}`.trim();
          await supabase.from("advisor_messages").insert({ business_id, role: "assistant", content: text });
          const enc = new TextEncoder();
          const evt = { type: "result_updated", agent: intent.agent, label: cfg.label, field: intent.field, previous };
          const payload =
            `data: ${JSON.stringify(evt)}\n\n` +
            `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n` +
            `data: [DONE]\n\n`;
          return new Response(enc.encode(payload), { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
        }
        console.error("[advisor] update failed", error);
      }
    }

    const pick = (row: any, fields: string[]) => row ? JSON.stringify(Object.fromEntries(fields.map((f) => [f, row[f]]))) : "not generated yet";
    const brief = (row: any, fields: string[], n = 2500) => pick(row, fields).slice(0, n);

    const system = `You are the Resident Strategy Advisor at Planz — sharp, candid, and grounded in the dossier below. Conversational, no markdown headers or bold. Use • for bullets.
Answer the user's actual question using the specific facts, figures, names and assumptions in the dossier (quote numbers like TAM, competitor names, revenue, CAC/LTV, margins). Compare, explain trade-offs, do quick math and stress-test assumptions when asked. If the dossier doesn't contain the answer, say so plainly and give your best reasoned estimate labelled as an estimate. Never invent dossier data. Keep it under ~250 words. End with a pointed follow-up question.

BUSINESS: ${biz.data.business_name} (${biz.data.stage})
Pitch: ${biz.data.pitch}
Industry: ${biz.data.industry} | Market: ${biz.data.target_market} | Geo: ${biz.data.geography || "Global"}

MARKET (full): ${pick(mr.data, EDITABLE.market_research.fields)}

POSITION / COMPETITORS (full): ${pick(ca.data, EDITABLE.competitor_analysis.fields)}

FINANCE (full): ${pick(fm.data, EDITABLE.financial_model.fields)}

PLAN (brief): ${brief(bp.data, EDITABLE.business_plan.fields)}
MARKETING (brief): ${brief(ms.data, EDITABLE.marketing_strategy.fields)}
AI OPS (brief): ${brief(aio.data, EDITABLE.ai_operations.fields)}`;

    const history = (hist.data || []).map((m: any) => ({ role: m.role, content: m.content }));

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
    if (upstream.status === 429) return json({ error: "Rate limit" }, 429);
    if (upstream.status === 402) return json({ error: "Credits exhausted" }, 402);
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
                const j = line.slice(6).trim();
                if (j !== "[DONE]") {
                  try {
                    const d = JSON.parse(j).choices?.[0]?.delta?.content;
                    if (d) assembled += d;
                  } catch { /* ignore */ }
                }
              }
              controller.enqueue(encoder.encode(line + "\n"));
            }
          }
          if (buf) controller.enqueue(encoder.encode(buf));
          if (assembled) await supabase.from("advisor_messages").insert({ business_id, role: "assistant", content: assembled });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, { headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  } catch (e) {
    console.error("[advisor-chat-stream]", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
