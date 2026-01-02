import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

declare const Deno: any;

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

        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyA7seyM9dUmtiQnmij7PyjMylnXZvdcZXs";
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        // The user's code snippet for analyzeInterviewPerformance
        // "videoBlob" here is likely a base64 string because we are sending it via JSON.
        // If it's pure binary, we'd need to handle body reader. Assuming JSON {"videoBlob": "base64..."}

        const result = await model.generateContent([
            { text: "Analyze the user's confidence and tone. Provide a 'Professionalism Score' (0-100)." },
            { inlineData: { data: videoBlob, mimeType: "video/mp4" } }
        ]
            // User snippet: }, { mediaResolution: "high" });
        );

        const response = await result.response;
        const text = response.text();

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
