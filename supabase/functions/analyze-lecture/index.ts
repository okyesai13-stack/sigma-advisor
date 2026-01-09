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
        const { videoUri, studentQuestion } = await req.json();

        if (!videoUri || !studentQuestion) {
            throw new Error("Missing videoUri or studentQuestion");
        }

        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
            throw new Error("LOVABLE_API_KEY is not configured");
        }

        // Note: For video analysis with timestamps, we'll provide text-based answers.
        // For actual video analysis, consider using a dedicated video analysis service.
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
                        content: "You are an educational assistant. Answer student questions about lecture content. Use [MM:SS] format for any timestamp references." 
                    },
                    { 
                        role: "user", 
                        content: `Student question about a lecture video: ${studentQuestion}` 
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
        const text = aiData.choices?.[0]?.message?.content || "I'm unable to analyze the video at this time.";

        return new Response(JSON.stringify({ text }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error in analyze-lecture:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
