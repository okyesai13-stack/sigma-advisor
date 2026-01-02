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

    console.log("Validating skills for user:", user.id);

    // Get selected career
    const { data: selectedCareer, error: careerError } = await supabaseClient
      .from("selected_career")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (careerError || !selectedCareer) {
      throw new Error("No career selected. Please select a career first.");
    }

    // Get user experience to extract skills
    const { data: experience } = await supabaseClient
      .from("experience_details")
      .select("skills")
      .eq("user_id", user.id);

    const userSkills = experience?.flatMap((e) => e.skills || []) || [];

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a career skills analyst. Given a career title and a user's existing skills, identify the required skills for that career and assess the user's current level.

Return a JSON array of skill assessments with this structure:
[
  {
    "skill_name": "string",
    "required_level": "beginner|intermediate|advanced|expert",
    "current_level": "none|beginner|intermediate|advanced|expert",
    "status": "ready|gap"
  }
]

Include 5-8 key skills for the career. Status is "ready" if current_level >= required_level, otherwise "gap".

Career: ${selectedCareer.career_title}
User's existing skills: ${userSkills.length > 0 ? userSkills.join(", ") : "None specified"}

Analyze and return the skill assessment as a JSON array only.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 1024,
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
      throw new Error("Gemini API error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    console.log("AI skill validation response:", content);

    let skillAssessments;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        skillAssessments = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback skill assessments
      skillAssessments = [
        { skill_name: "JavaScript", required_level: "advanced", current_level: "intermediate", status: "gap" },
        { skill_name: "React", required_level: "advanced", current_level: "beginner", status: "gap" },
        { skill_name: "TypeScript", required_level: "intermediate", current_level: "none", status: "gap" },
        { skill_name: "Node.js", required_level: "intermediate", current_level: "beginner", status: "gap" },
        { skill_name: "Git", required_level: "intermediate", current_level: "intermediate", status: "ready" },
        { skill_name: "HTML/CSS", required_level: "intermediate", current_level: "advanced", status: "ready" },
      ];
    }

    // Delete existing skill validations for this user and career
    await supabaseClient
      .from("user_skill_validation")
      .delete()
      .eq("user_id", user.id)
      .eq("career_title", selectedCareer.career_title);

    // Insert new skill validations
    const { data: insertedSkills, error: insertError } = await supabaseClient
      .from("user_skill_validation")
      .insert(
        skillAssessments.map((skill: any) => ({
          user_id: user.id,
          career_title: selectedCareer.career_title,
          skill_name: skill.skill_name,
          required_level: skill.required_level,
          current_level: skill.current_level,
          status: skill.status,
        }))
      )
      .select();

    if (insertError) {
      console.error("Error inserting skill validations:", insertError);
      throw new Error("Failed to save skill validations");
    }

    // Update journey state
    const { error: stateError } = await supabaseClient
      .from("user_journey_state")
      .update({ skill_validated: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (stateError) {
      console.error("Error updating journey state:", stateError);
    }

    const gapCount = skillAssessments.filter((s: any) => s.status === "gap").length;
    const readyCount = skillAssessments.filter((s: any) => s.status === "ready").length;

    // Store advisor conversation
    await supabaseClient.from("advisor_conversations").insert([
      {
        user_id: user.id,
        role: "advisor",
        message: `I've analyzed your skills against the requirements for ${selectedCareer.career_title}. You have ${readyCount} skills ready and ${gapCount} skill gaps to address. ${gapCount > 0 ? "Let's create a learning plan to close these gaps." : "You're well-prepared! Let's move to building projects."}`,
        context: { action: "skills_validated", skills: insertedSkills, gapCount, readyCount },
      },
    ]);

    console.log("Successfully validated skills");

    return new Response(JSON.stringify({ 
      skills: insertedSkills, 
      hasGaps: gapCount > 0,
      gapCount,
      readyCount 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in validate-skills:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
