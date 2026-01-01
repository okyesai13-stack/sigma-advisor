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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    const systemPrompt = `You are an AI Career Advisor helping a user on their career journey.

User Context:
- Goal: ${profile?.goal_type || "Not set"} - ${profile?.goal_description || ""}
- Selected Career: ${selectedCareer?.career_title || "Not yet selected"}
- Current Journey Step: ${currentStep}
- Journey Progress: ${JSON.stringify(journeyState || {})}

Your role is to:
1. Guide the user through their career journey step by step
2. Answer questions about careers, skills, and job preparation
3. Provide encouragement and actionable advice
4. Help them understand what to do next

Keep responses concise, friendly, and actionable. If they need to take a specific action (like selecting a career or starting learning), remind them to use the relevant buttons in the interface.`;

    const conversationHistory = (recentMessages || []).reverse().map(msg => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.message,
    }));

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory.slice(-8), // Last 8 messages for context
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const advisorResponse = aiData.choices?.[0]?.message?.content || "I apologize, I couldn't process that. Could you try rephrasing?";

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
