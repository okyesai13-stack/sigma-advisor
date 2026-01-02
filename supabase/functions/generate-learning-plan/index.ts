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

    // Get selected career for context
    const { data: selectedCareer } = await supabaseClient
      .from("selected_career")
      .select("career_title")
      .eq("user_id", user.id)
      .single();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to generate personalized learning recommendations
    const systemPrompt = `You are an AI career learning advisor. Given a user's skill gaps and target career, create a prioritized learning plan.

Return a JSON array with this structure:
[
  {
    "skill_name": "string",
    "priority": number (1 = highest priority),
    "learning_resources": "Brief description of recommended resources",
    "estimated_hours": number
  }
]

Order by priority (most important first). Consider:
- Which skills are fundamental prerequisites for others
- Which skills have the highest impact for the target career
- Logical learning sequence`;

    const userPrompt = `Target Career: ${selectedCareer?.career_title || "Software Developer"}
Skill Gaps to Address:
${skillGaps.map(s => `- ${s.skill_name} (Current: ${s.current_level}, Required: ${s.required_level})`).join("\n")}

Create a prioritized learning plan as a JSON array.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI gateway error:", aiResponse.status);
      // Fallback to priority-based ordering
    }

    let learningPlanEntries;
    
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const aiPlan = JSON.parse(jsonMatch[0]);
          learningPlanEntries = aiPlan.map((item: any, index: number) => ({
            user_id: user.id,
            skill_name: item.skill_name,
            priority: item.priority || index + 1,
            status: "pending",
          }));
        }
      } catch (e) {
        console.error("Failed to parse AI response:", e);
      }
    }

    // Fallback to basic priority ordering if AI fails
    if (!learningPlanEntries) {
      const priorityMap: { [key: string]: number } = {
        expert: 1,
        advanced: 2,
        intermediate: 3,
        beginner: 4,
      };

      learningPlanEntries = skillGaps.map((skill, index) => ({
        user_id: user.id,
        skill_name: skill.skill_name,
        priority: priorityMap[skill.required_level] || index + 1,
        status: "pending",
      }));
    }

    // Delete existing learning plan
    await supabaseClient
      .from("learning_plan")
      .delete()
      .eq("user_id", user.id);

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
        message: `I've created a personalized learning plan with ${insertedPlan.length} skills to develop based on AI analysis. The skills are prioritized to maximize your learning efficiency - start with the highest priority skills first. Each skill builds on the previous ones to help you reach your goal of becoming a ${selectedCareer?.career_title || "professional"}.`,
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
