import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Get skill validations if available
    const { data: skillValidations } = await supabaseClient
      .from("user_skill_validation")
      .select("*")
      .eq("user_id", user.id);

    // Get learning plan if available
    const { data: learningPlan } = await supabaseClient
      .from("learning_plan")
      .select("*")
      .eq("user_id", user.id);

    // Get recent conversation history (last 10 messages)
    const { data: recentMessages } = await supabaseClient
      .from("advisor_conversations")
      .select("role, message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build context for AI
    const currentStep = !journeyState?.career_recommended ? "career_recommendation"
      : !journeyState?.career_selected ? "career_selection"
        : !journeyState?.skill_validated ? "skill_validation"
          : !journeyState?.learning_completed ? "learning"
            : !journeyState?.projects_completed ? "projects"
              : !journeyState?.job_ready ? "job_readiness"
                : !journeyState?.interview_completed ? "interview"
                  : "apply";

    const skillsContext = skillValidations && skillValidations.length > 0 
      ? `\nSkill Validations: ${skillValidations.map(s => `${s.skill_name}: ${s.status} (${s.current_level}/${s.required_level})`).join(", ")}`
      : "";

    const learningContext = learningPlan && learningPlan.length > 0
      ? `\nLearning Plan: ${learningPlan.map(l => `${l.skill_name}: ${l.status}`).join(", ")}`
      : "";

    const systemPrompt = `You are an AI Career Advisor Agent powered by Gemini.
You are NOT a chatbot. You are a state-aware career orchestrator.

Your mission is to guide users step by step toward their career goal using their profile, interests, education, experience, and progress state.

Core Responsibilities:
- Analyze user goals and background
- Recommend suitable career paths with reasoning
- Guide skill validation and gap identification
- Generate personalized learning plans
- Recommend real-world projects
- Assess job readiness
- Conduct mock interviews with structured feedback
- Help with job applications

Strict Rules:
- Never skip steps
- Never repeat steps
- Always respect the provided journey state
- Do not provide generic advice - be specific and actionable
- Be concise, practical, and goal-oriented
- Act as a professional career advisor
- Use the user's actual data to personalize responses

User Context:
- Goal: ${profile?.goal_type || "Not set"} - ${profile?.goal_description || ""}
- Interests: ${profile?.interests?.join(", ") || "Not specified"}
- Hobbies: ${profile?.hobbies?.join(", ") || "Not specified"}
- Selected Career: ${selectedCareer?.career_title || "Not yet selected"}
- Current Journey Step: ${currentStep}
- Journey Progress: ${JSON.stringify(journeyState || {})}${skillsContext}${learningContext}

Based on the current step "${currentStep}", focus your response accordingly:
- If career_recommendation: Help user understand their options or refine recommendations
- If career_selection: Guide them in choosing and confirming their career path
- If skill_validation: Explain their skill gaps and how to address them
- If learning: Motivate and guide their learning journey
- If projects: Help them plan and complete portfolio projects
- If job_readiness: Review their preparation for job applications
- If interview: Prepare them for interviews with tips and practice
- If apply: Help with job search strategies and applications`;

    // Build conversation history for context
    const conversationHistory = (recentMessages || []).reverse().map((msg: any) => ({
      role: msg.role === "advisor" ? "model" : "user",
      parts: [{ text: msg.message }],
    }));

    // Make API call to Google Gemini API directly
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "I understand. I am now your AI Career Advisor and will guide you through your career journey step by step." }] },
          ...conversationHistory,
          { role: "user", parts: [{ text: message }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Gemini API error: " + errorText);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble responding right now. Please try again.";

    // Store advisor response
    await supabaseClient.from("advisor_conversations").insert({
      user_id: user.id,
      role: "advisor",
      message: responseText,
      context: { currentStep },
    });

    console.log("Successfully responded to chat");

    return new Response(JSON.stringify({
      response: responseText,
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
