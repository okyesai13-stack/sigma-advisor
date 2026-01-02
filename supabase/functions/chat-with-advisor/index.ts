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

    const { message, thoughtSignature } = await req.json();
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
      context: null, // User message doesn't need context usually, or maybe previous thought signature if relevant
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
      .select("role, message, context")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyA7seyM9dUmtiQnmij7PyjMylnXZvdcZXs";
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
    });

    const thinkingConfig = {
      thinkingConfig: {
        includeThoughts: true,
        thinkingLevel: "high",
      },
      temperature: 1.0,
    };

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
- Never repeat steps
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

    // Construct history for SDK
    const history = (recentMessages || []).reverse().map((msg: any) => {
      const parts = [{ text: msg.message }];
      // If it's a model message and has a thought signature stored in context, attach it
      if (msg.role === "advisor" && msg.context?.thoughtSignature) {
        // Note: The SDK expects thoughtSignature in the part for 'model' role
        // However, standard history usually just takes text. 
        // For Gemini 3, if we want to pass back the signature, we might need to conform to specific SDK structure.
        // Assuming the user's snippet where params imply passing it back.
        // For now, we will try to attach it if the SDK allows, or relying on the fact that startChat maintains state if we were in a continuous session.
        // But here we are stateless between requests. 
        // We will attempt to pass it in parts if the SDK supports it (custom property), or as a separate part type if applicable.
        // Based on user snippet: parts: { text?: string; thoughtSignature?: string }[]
        (parts[0] as any).thoughtSignature = msg.context.thoughtSignature;
      }
      return {
        role: msg.role === "advisor" ? "model" : "user",
        parts: parts,
      };
    });

    // Start chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: "System Context: " + systemPromptContent }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am ready to act as the AI Career Advisor." }],
        },
        ...history
      ],
      // @ts-ignore - thinkingConfig types might not be fully updated in the SDK version on esm.sh yet
      generationConfig: thinkingConfig,
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // Extract thought signature
    // The user's snippet: const thoughtSig = modelPart?.thoughtSignature;
    const modelPart = response.candidates?.[0].content.parts[0];
    const thoughtSig = (modelPart as any)?.thoughtSignature;

    // Store advisor response with thought signature
    await supabaseClient.from("advisor_conversations").insert({
      user_id: user.id,
      role: "advisor",
      message: text,
      context: {
        currentStep,
        thoughtSignature: thoughtSig
      },
    });

    console.log("Successfully responded to chat");

    return new Response(JSON.stringify({
      response: text,
      currentStep,
      thoughtSignature: thoughtSig,
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
