import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("No authorization header");
        }

        const { goal, interests, education, experience } = await req.json();

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            throw new Error("User not authenticated");
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
            throw new Error("LOVABLE_API_KEY is not configured");
        }

        const prompt = `Analyze this user's profile and output a structured career DNA summary.
      Goal: ${goal}, Interests: ${interests}, 
      Education: ${education}, Experience: ${experience}.`;

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                    { role: "system", content: "You are a career profile analyst. Provide structured career DNA summaries." },
                    { role: "user", content: prompt }
                ],
            }),
        });

        if (!aiResponse.ok) {
            const errorText = await aiResponse.text();
            console.error("Lovable AI error:", aiResponse.status, errorText);
            if (aiResponse.status === 429) {
                return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
                    status: 429,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
            if (aiResponse.status === 402) {
                return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
                    status: 402,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
            throw new Error("AI API error");
        }

        const aiData = await aiResponse.json();
        const summary = aiData.choices?.[0]?.message?.content || "Career DNA summary generated.";

        // Save to Supabase 'user_context' table
        const { error: insertError } = await supabaseClient
            .from("user_context")
            .upsert({
                user_id: user.id,
                summary: summary,
                updated_at: new Date().toISOString()
            });

        if (insertError) {
            console.error("Error inserting context:", insertError);
            // Fallback: If table doesn't exist, maybe just return it
        }

        return new Response(JSON.stringify({ summary }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in seed-user-context:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
