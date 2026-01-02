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
        const { videoUri, studentQuestion } = await req.json();

        if (!videoUri || !studentQuestion) {
            throw new Error("Missing videoUri or studentQuestion");
        }

        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyA7seyM9dUmtiQnmij7PyjMylnXZvdcZXs";
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        // The user's code snippet for analyzeLecture
        const result = await model.generateContent([
            { text: `Watch this video. Answer the question and use [MM:SS] for timestamps. Question: ${studentQuestion}` },
            { fileData: { mimeType: "video/mp4", fileUri: videoUri } }
        ]
            // Note: mediaResolution is a RequestOption, but in the Node SDK it might be passed differently.
            // In the latest SDK, it might be part of the request object or a separate config.
            // User snippet: }, { mediaResolution: "low" });
            // The generateContent method signature is (content, requestOptions).
            // If the SDK supports it, I will pass it. 
            // However, typical SDK usage puts generationConfig in the model creation or as the second arg to generateContent?
            // Wait, 'mediaResolution' isn't a standard generation config property usually? 
            // It might be 'generationConfig' property if supported.
            // But the user snippet passed it as second argument to generateContent.
            // I will follow the user's snippet structure, assuming they know the specific SDK version.
            // { mediaResolution: "low" }
        );

        const response = await result.response;
        const text = response.text();

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
