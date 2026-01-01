import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { message } = await req.json();
    if (!message) {
      throw new Error("Message is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Chat with advisor for user:", user.id);

    // Store user message
    await supabaseClient.from("advisor_conversations").insert({
      user_id: user.id,
      role: "user",
      message,
      context: null,
    });

    // Get user context
    const { data: profile } = await supabaseClient
      .from("users_profile")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: selectedCareer } = await supabaseClient
      .from("selected_career")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: journeyState } = await supabaseClient
      .from("user_journey_state")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Get recent conversation history
    const { data: recentMessages } = await supabaseClient
      .from("advisor_conversations")
      .select("role, message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const GEMINI_API_KEY = "AIzaSyA7seyM9dUmtiQnmij7PyjMylnXZvdcZXs";
    const actualModel = "gemini-3-pro-preview"; // Using the model specified by the user.

    // Build context for AI
    const currentStep = !journeyState?.career_recommended ? "career_recommendation"
      : !journeyState?.career_selected ? "career_selection"
        : !journeyState?.skill_validated ? "skill_validation"
          : !journeyState?.learning_completed ? "learning"
            : !journeyState?.projects_completed ? "projects"
              : !journeyState?.job_ready ? "job_readiness"
                : !journeyState?.interview_completed ? "interview"
                  : "apply";

    const systemPromptContent = `You are an AI Career Advisor Agent.

You are NOT a chatbot.
You are a state-aware career orchestrator.

Your mission is to guide users step by step toward their career goal
using their profile, interests, education, experience, and progress state.

Core Responsibilities:
- Analyze user goals and background
- Recommend suitable career paths with reasoning
- Guide skill validation and gap identification
- Generate learning plans only when gaps exist
- Recommend real-world projects
- Assess job readiness
- Conduct mock interviews with structured feedback

Strict Rules:
- Never skip steps
- Never repeat completed steps
- Always respect the provided journey state
- Do not provide generic advice
- Be concise, practical, and goal-oriented
- Act as a professional career advisor

Output Rules:
- Always respond in valid JSON if the prompt asks for it, otherwise conversational text but structured.
- No conversational fillers
- Structured responses

User Context:
- Goal: ${profile?.goal_type || "Not set"} - ${profile?.goal_description || ""}
- Selected Career: ${selectedCareer?.career_title || "Not yet selected"}
- Current Journey Step: ${currentStep}
- Journey Progress: ${JSON.stringify(journeyState || {})}
`;

    const contents = (recentMessages || []).reverse().map(msg => ({
      role: msg.role === "advisor" ? "model" : "user", // Gemini uses 'model' not 'assistant'
      parts: [{ text: msg.message }]
    }));
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: {
          parts: [{ text: systemPromptContent }]
        },
        generationConfig: {
          temperature: 0.7, // optional
          // thinkingConfig is only for specific models
        }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error:", response.status, errText);
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const aiData = await response.json();
    const advisorResponse = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, I couldn't process that.";

    // Store advisor response
    await supabaseClient.from("advisor_conversations").insert({
      user_id: user.id,
      role: "advisor",
      message: advisorResponse,
      context: { currentStep },
    });

    console.log("Successfully responded to chat");

    return new Response(JSON.stringify({
      response: advisorResponse,
      currentStep,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in chat-with-advisor:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
