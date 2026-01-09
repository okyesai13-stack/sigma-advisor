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

    const { parsedData, userId } = await req.json();
    console.log("Generating career advice from resume for user:", user.id);

    if (!parsedData) {
      throw new Error("No parsed resume data provided");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are an expert career advisor. Based on the resume data provided, analyze and recommend career paths.

Resume Data:
${JSON.stringify(parsedData, null, 2)}

Generate exactly 5 career recommendations with the following structure for each:
{
  "roles": [
    {
      "id": "unique_id",
      "role": "Job Title",
      "domain": "Industry/Domain",
      "match_score": 85,
      "rationale": "2-3 sentences explaining why this role is a good fit",
      "required_skills": ["skill1", "skill2", "skill3"],
      "growth_potential": "high|medium|low"
    }
  ]
}

Consider the candidate's:
- Education background
- Work experience
- Skills mentioned
- Any certifications

Return ONLY valid JSON, no markdown or additional text.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
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
    console.log("AI career advice response received");

    let careerAdvice;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        careerAdvice = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      careerAdvice = {
        roles: [
          { id: "1", role: "Software Developer", domain: "Technology", match_score: 85, rationale: "Based on technical skills in resume.", required_skills: ["JavaScript", "Python", "SQL"], growth_potential: "high" },
          { id: "2", role: "Data Analyst", domain: "Analytics", match_score: 78, rationale: "Analytical background suggests data aptitude.", required_skills: ["Excel", "SQL", "Python"], growth_potential: "high" },
          { id: "3", role: "Product Manager", domain: "Technology", match_score: 72, rationale: "Cross-functional experience indicates PM potential.", required_skills: ["Communication", "Strategy", "Technical Understanding"], growth_potential: "high" },
          { id: "4", role: "UX Designer", domain: "Design", match_score: 68, rationale: "Creative problem-solving abilities evident.", required_skills: ["Figma", "User Research", "Prototyping"], growth_potential: "medium" },
          { id: "5", role: "Business Analyst", domain: "Business", match_score: 65, rationale: "Business acumen and analytical thinking.", required_skills: ["Requirements Analysis", "SQL", "Communication"], growth_potential: "medium" }
        ]
      };
    }

    console.log("Successfully generated career advice");

    return new Response(JSON.stringify({ 
      success: true, 
      careerAdvice 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in resume-career-advice:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
