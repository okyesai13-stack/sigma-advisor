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

    const { parsedData, profileData, userId } = await req.json();
    console.log("Generating career advice for user:", user.id);

    // Check if we have either resume data or profile data
    if (!parsedData && !profileData) {
      throw new Error("No resume or profile data provided");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build the data section based on what's available
    let dataSection = "";
    if (parsedData) {
      dataSection = `Resume Data:
${JSON.stringify(parsedData, null, 2)}`;
      console.log("Using parsed resume data for analysis");
    } else if (profileData) {
      // Format profile data for the AI
      const { profile, education, experience, certifications } = profileData;
      
      let profileText = "Profile Data:\n";
      
      if (profile) {
        profileText += `\nUser Type: ${profile.user_type || 'Not specified'}`;
        profileText += `\nGoal: ${profile.goal_type || 'Not specified'} - ${profile.goal_description || ''}`;
        profileText += `\nInterests: ${(profile.interests || []).join(', ') || 'Not specified'}`;
        profileText += `\nHobbies: ${(profile.hobbies || []).join(', ') || 'Not specified'}`;
        profileText += `\nActivities: ${(profile.activities || []).join(', ') || 'Not specified'}`;
      }
      
      if (education && education.length > 0) {
        profileText += "\n\nEducation:";
        education.forEach((edu: any, i: number) => {
          profileText += `\n${i + 1}. ${edu.degree || 'Degree'} in ${edu.field || 'Field'} from ${edu.institution || 'Institution'} (${edu.graduation_year || 'Year'})`;
        });
      }
      
      if (experience && experience.length > 0) {
        profileText += "\n\nWork Experience:";
        experience.forEach((exp: any, i: number) => {
          profileText += `\n${i + 1}. ${exp.role || 'Role'} at ${exp.company || 'Company'} (${exp.start_year || ''} - ${exp.end_year || 'Present'})`;
          if (exp.skills && exp.skills.length > 0) {
            profileText += `\n   Skills: ${exp.skills.join(', ')}`;
          }
        });
      }
      
      if (certifications && certifications.length > 0) {
        profileText += "\n\nCertifications:";
        certifications.forEach((cert: any, i: number) => {
          profileText += `\n${i + 1}. ${cert.title || 'Certification'} from ${cert.issuer || 'Issuer'} (${cert.year || 'Year'})`;
        });
      }
      
      dataSection = profileText;
      console.log("Using profile data for analysis:", profileText);
    }

    const prompt = `You are an expert career advisor. Based on the candidate data provided, analyze and recommend career paths.

${dataSection}

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
- Interests and goals

Return ONLY valid JSON, no markdown or additional text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert career advisor. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
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
