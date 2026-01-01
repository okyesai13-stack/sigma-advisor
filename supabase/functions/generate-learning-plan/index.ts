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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Generating learning plan for user:", user.id);

    // Get skill gaps
    const { data: skillGaps, error: skillError } = await supabaseClient
      .from("user_skill_validation")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "gap");

    if (skillError) {
      console.error("Error fetching skill gaps:", skillError);
      throw new Error("Failed to fetch skill gaps");
    }

    if (!skillGaps || skillGaps.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No skill gaps found. You're ready for projects!",
        learningPlan: [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete existing learning plan
    await supabaseClient
      .from("learning_plan")
      .delete()
      .eq("user_id", user.id);

    // Create learning plan entries with priority based on required level
    const priorityMap: { [key: string]: number } = {
      expert: 1,
      advanced: 2,
      intermediate: 3,
      beginner: 4,
    };

    const learningPlanEntries = skillGaps.map((skill, index) => ({
      user_id: user.id,
      skill_name: skill.skill_name,
      priority: priorityMap[skill.required_level] || index + 1,
      status: "pending",
    }));

    const { data: insertedPlan, error: insertError } = await supabaseClient
      .from("learning_plan")
      .insert(learningPlanEntries)
      .select();

    if (insertError) {
      console.error("Error inserting learning plan:", insertError);
      throw new Error("Failed to create learning plan");
    }

    // Store advisor conversation
    await supabaseClient.from("advisor_conversations").insert([
      {
        user_id: user.id,
        role: "advisor",
        message: `I've created a personalized learning plan with ${insertedPlan.length} skills to develop. The skills are prioritized based on their importance for your career. Start with the highest priority skills and work your way through.`,
        context: { action: "learning_plan_generated", planCount: insertedPlan.length },
      },
    ]);

    console.log("Successfully generated learning plan with", insertedPlan.length, "skills");

    return new Response(JSON.stringify({ learningPlan: insertedPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-learning-plan:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
