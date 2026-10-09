import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const BOXES = ["problem", "solution", "key_metrics", "uvp", "unfair_advantage", "channels", "customer_segments", "cost_structure", "revenue_streams"];
const ACTIONS: Record<string, string> = {
  improve: "Rewrite the notes to be clearer and stronger, keeping their intent.",
  sharpen: "Make the notes punchier, more specific and quantified where possible.",
  challenge: "Return critical questions / weaknesses an investor would raise about these notes.",
  ideas: "Suggest exactly 3 new, specific notes that are not already present.",
};

const j = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const userClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { business_id, box, action } = body;
    const notes: string[] = Array.isArray(body.notes) ? body.notes.map((n: unknown) => String(n).slice(0, 500)).slice(0, 20) : [];
    if (typeof business_id !== "string" || !BOXES.includes(box) || !ACTIONS[action]) return j({ error: "Invalid input" }, 400);

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: biz } = await db.from("business_store").select("*").eq("id", business_id).eq("user_id", u.user.id).maybeSingle();
    if (!biz) return j({ error: "Not found" }, 404);
    const { data: canvas } = await db.from("lean_canvas").select("boxes").eq("business_id", business_id).maybeSingle();

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return j({ error: "AI not configured" }, 500);
    const system = `You are a startup strategist helping fill a Lean Canvas. Output ONLY JSON: {"suggestions": ["string", ...]} with 2-5 short items (max ~25 words each). ${ACTIONS[action]}`;
    const user = `Business: ${biz.business_name} (${biz.stage}) — ${biz.pitch}
Industry: ${biz.industry} | Market: ${biz.target_market} | Geo: ${biz.geography || "Global"}
Full canvas: ${JSON.stringify(canvas?.boxes || {}).slice(0, 5000)}
Box to work on: ${box.replace(/_/g, " ")}
Current notes: ${JSON.stringify(notes)}`;

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
    const parsed = m ? JSON.parse(m[0]) : { suggestions: [] };
    return j({ suggestions: (parsed.suggestions || []).map(String).slice(0, 5) });
  } catch (e) {
    console.error("[canvas-assist]", e);
    return j({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});
