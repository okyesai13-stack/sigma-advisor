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

    const { role, domain, career_id } = await req.json();
    console.log("Validating skills for user:", user.id, "role:", role);

    const targetRole = role || 'Software Developer';
    const targetDomain = domain || 'Technology';

    // Get user resume data for skills
    const { data: resumeData } = await supabaseClient
      .from("resume_analysis")
      .select("parsed_data")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const parsedData = resumeData?.parsed_data as any;
    const userSkills = parsedData?.skills || [];

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a career skills analyst. Given a target role and user's existing skills, assess their readiness.

Target Role: ${targetRole}
Domain: ${targetDomain}
User's Existing Skills: ${userSkills.length > 0 ? JSON.stringify(userSkills) : "None specified"}

Analyze and return JSON:
{
  "readiness_score": 65,
  "level": "intermediate",
  "matched_skills": {
    "strong": ["Skill user is proficient in"],
    "partial": ["Skill user has some experience with"]
  },
  "missing_skills": ["Critical skill 1", "Critical skill 2", "Skill 3"],
  "recommended_next_step": "learn"
}

Rules:
- readiness_score: 0-100 based on skill match
- level: beginner|intermediate|advanced|expert
- matched_skills.strong: skills user clearly has
- matched_skills.partial: skills user has partially
- missing_skills: 3-6 important skills they need
- recommended_next_step: "learn" (needs learning), "learn_foundation" (needs basics), "project" (ready for projects), "job" (ready to apply)

Return ONLY valid JSON.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("AI skill validation response received");

    let validationResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      validationResult = {
        readiness_score: 50,
        level: "intermediate",
        matched_skills: { strong: [], partial: userSkills.slice(0, 3) },
        missing_skills: ["JavaScript", "React", "TypeScript", "Node.js"],
        recommended_next_step: "learn"
      };
    }

    // Save to skill_validations table
    const { data: savedValidation, error: insertError } = await supabaseClient
      .from("skill_validations")
      .insert({
        user_id: user.id,
        career_id: career_id || null,
        role: targetRole,
        domain: targetDomain,
        readiness_score: validationResult.readiness_score || 50,
        level: validationResult.level || "intermediate",
        matched_skills: validationResult.matched_skills || { strong: [], partial: [] },
        missing_skills: validationResult.missing_skills || [],
        recommended_next_step: validationResult.recommended_next_step || "learn"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting skill validation:", insertError);
      throw new Error("Failed to save skill validation");
    }

    console.log("Successfully validated skills");

    return new Response(JSON.stringify({ 
      success: true,
      data: savedValidation
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in validate-skills:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
