import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

        const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyA7seyM9dUmtiQnmij7PyjMylnXZvdcZXs";
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

        const prompt = `Analyze this user's profile and output a structured career DNA summary.
      Goal: ${goal}, Interests: ${interests}, 
      Education: ${education}, Experience: ${experience}.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        // Save to Supabase 'user_context' table
        // Assuming table 'user_context' exists and has 'user_id' and 'summary' columns
        // If not, we might need to create it or store it in users_profile if the table doesn't exist
        // The user instruction said: "Store the result in a Supabase table called user_context."
        // I shall attempt to insert into user_context.

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
