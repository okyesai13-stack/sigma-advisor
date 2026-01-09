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

    const { base_resume, target_role, target_domain, missing_skills, selected_projects } = await req.json();
    console.log("Upgrading resume for role:", target_role);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are an expert resume writer and career coach. Optimize this resume for the target role.

Original Resume Data:
${JSON.stringify(base_resume, null, 2)}

Target Role: ${target_role || 'Software Developer'}
Target Domain: ${target_domain || 'Technology'}
Skills to Highlight: ${JSON.stringify(missing_skills || [])}
Projects to Include: ${JSON.stringify(selected_projects || [])}

Create an optimized resume with:
1. A compelling professional summary tailored to the target role
2. Rewritten experience bullets using action verbs and quantifiable achievements
3. Skills section organized by relevance to target role
4. Project descriptions highlighting relevant technologies

Return JSON:
{
  "professional_summary": "2-3 sentence compelling summary",
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "duration": "Date Range",
      "bullets": ["Achievement 1 with metrics", "Achievement 2 with impact"]
    }
  ],
  "skills": {
    "technical": ["Skill 1", "Skill 2"],
    "soft": ["Skill 1", "Skill 2"]
  },
  "projects": [
    {
      "title": "Project Name",
      "description": "Brief description",
      "technologies": ["Tech 1", "Tech 2"],
      "impact": "Quantifiable impact"
    }
  ],
  "education": [
    {
      "institution": "School Name",
      "degree": "Degree",
      "year": "Year"
    }
  ],
  "certifications": ["Certification 1", "Certification 2"],
  "ats_score": 85,
  "improvement_tips": ["Tip 1", "Tip 2"]
}

Return ONLY valid JSON.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
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

    let resumeData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        resumeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      resumeData = {
        professional_summary: `Results-driven ${target_role} with expertise in ${target_domain}. Passionate about delivering high-quality solutions and continuous learning.`,
        experience: base_resume?.parsed_resume_data?.experience || [],
        skills: {
          technical: missing_skills || ["JavaScript", "React", "TypeScript"],
          soft: ["Communication", "Problem Solving", "Team Collaboration"]
        },
        projects: selected_projects || [],
        education: base_resume?.parsed_resume_data?.education || [],
        certifications: [],
        ats_score: 75,
        improvement_tips: ["Add more quantifiable achievements", "Include relevant keywords for ATS"]
      };
    }

    console.log("Successfully upgraded resume");

    return new Response(JSON.stringify({ 
      success: true,
      resume_data: resumeData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-resume-upgrader:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
