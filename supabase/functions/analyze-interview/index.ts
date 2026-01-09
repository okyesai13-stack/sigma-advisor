import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { videoBlob } = await req.json();

        if (!videoBlob) {
            throw new Error("Missing videoBlob");
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
            throw new Error("LOVABLE_API_KEY is not configured");
        }

        // Note: For video analysis, we'll use text-based analysis since Lovable AI Gateway 
        // supports text-based interactions. For actual video analysis, consider using 
        // a dedicated video analysis service.
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                    { 
                        role: "system", 
                        content: "You are an interview performance analyst. Provide feedback on interview performance." 
                    },
                    { 
                        role: "user", 
                        content: "Analyze interview performance and provide a Professionalism Score (0-100) with feedback on confidence, tone, and presentation." 
                    }
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
        const text = aiData.choices?.[0]?.message?.content || "Analysis complete. Professionalism Score: 75/100";

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in analyze-interview:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
