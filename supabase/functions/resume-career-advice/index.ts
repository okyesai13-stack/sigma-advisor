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

    // Extract user's goal from profile data
    let userGoal = "";
    let currentRole = "";
    if (profileData?.profile) {
      userGoal = profileData.profile.goal_description || profileData.profile.goal_type || "";
    }
    if (parsedData?.experience && parsedData.experience.length > 0) {
      currentRole = parsedData.experience[0]?.role || parsedData.experience[0]?.title || "";
    } else if (profileData?.experience && profileData.experience.length > 0) {
      currentRole = profileData.experience[0]?.role || "";
    }

    console.log("User goal:", userGoal, "Current role:", currentRole);

    const prompt = `You are an expert career advisor and career path strategist. Based on the candidate data provided, create a strategic 3-step career progression plan to help them achieve their ultimate career goal.

${dataSection}

USER'S CAREER GOAL: ${userGoal || "Not specified - infer from their background"}
CURRENT ROLE: ${currentRole || "Entry-level or transitioning"}

YOUR TASK:
Create exactly 3 career roles that form a logical progression path from the user's current position to their ultimate goal. These roles should be:

1. SHORT-TERM ROLE (0-1 year): The immediate next step from their current position. This should be achievable with their current skills and experience, possibly requiring minimal upskilling.

2. MID-TERM ROLE (1-3 years): An intermediate position that bridges the gap between entry-level and their goal. This role should build upon the short-term role and develop skills needed for the long-term goal.

3. LONG-TERM ROLE (3-5 years): Their ultimate career goal or the closest realistic version of it based on their trajectory.

IMPORTANT RULES:
- Each role must logically lead to the next
- Consider the user's current skills, education, and experience
- The long-term role should align with or BE their stated goal
- If no goal is stated, infer the most ambitious but realistic goal based on their profile
- Include specific job titles, not generic ones
- Each role should show clear progression (e.g., Junior → Senior → Lead/Manager)

Return the response in this exact JSON structure:
{
  "roles": [
    {
      "id": "short_term",
      "role": "Specific Job Title",
      "term": "short",
      "term_label": "Short-term (0-1 year)",
      "domain": "Industry/Domain",
      "match_score": 90,
      "rationale": "2-3 sentences explaining why this is the right immediate next step and how it builds toward the goal",
      "required_skills": ["skill1", "skill2", "skill3"],
      "skills_to_develop": ["new_skill1", "new_skill2"],
      "growth_potential": "high",
      "alignment_to_goal": "How this role connects to achieving the ultimate goal"
    },
    {
      "id": "mid_term",
      "role": "Specific Job Title",
      "term": "mid",
      "term_label": "Mid-term (1-3 years)",
      "domain": "Industry/Domain",
      "match_score": 75,
      "rationale": "2-3 sentences explaining why this is the right intermediate step",
      "required_skills": ["skill1", "skill2", "skill3"],
      "skills_to_develop": ["new_skill1", "new_skill2"],
      "growth_potential": "high",
      "alignment_to_goal": "How this role connects to achieving the ultimate goal"
    },
    {
      "id": "long_term",
      "role": "Specific Job Title (THE GOAL)",
      "term": "long",
      "term_label": "Long-term (3-5 years)",
      "domain": "Industry/Domain",
      "match_score": 60,
      "rationale": "2-3 sentences explaining why this is the achievable version of their goal",
      "required_skills": ["skill1", "skill2", "skill3"],
      "skills_to_develop": ["new_skill1", "new_skill2"],
      "growth_potential": "high",
      "alignment_to_goal": "This IS the ultimate career goal"
    }
  ],
  "career_summary": "A brief 2-3 sentence summary of the overall career path strategy",
  "total_timeline": "Estimated 3-5 years to reach ultimate goal"
}

EXAMPLE:
If current role is "Junior Data Analyst" and goal is "Senior Data Scientist Manager":
- Short-term: "Senior Data Analyst" or "Data Analyst II"
- Mid-term: "Data Scientist" or "Senior Data Scientist"
- Long-term: "Senior Data Scientist Manager" or "Lead Data Scientist"

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
          { id: "short_term", role: "Senior Data Analyst", term: "short", term_label: "Short-term (0-1 year)", domain: "Analytics", match_score: 90, rationale: "This is the natural next step from your current position, leveraging your existing analytical skills.", required_skills: ["Excel", "SQL", "Data Visualization"], skills_to_develop: ["Advanced SQL", "Python basics"], growth_potential: "high", alignment_to_goal: "Builds foundation for data science transition" },
          { id: "mid_term", role: "Data Scientist", term: "mid", term_label: "Mid-term (1-3 years)", domain: "Data Science", match_score: 75, rationale: "After building stronger technical skills, you can transition into a data science role.", required_skills: ["Python", "Machine Learning", "Statistics"], skills_to_develop: ["Deep Learning", "ML Ops"], growth_potential: "high", alignment_to_goal: "Core data science experience needed for senior roles" },
          { id: "long_term", role: "Senior Data Scientist Manager", term: "long", term_label: "Long-term (3-5 years)", domain: "Data Science Leadership", match_score: 65, rationale: "With technical expertise and experience, you can move into leadership.", required_skills: ["Team Leadership", "Strategic Thinking", "Advanced ML"], skills_to_develop: ["People Management", "Business Strategy"], growth_potential: "high", alignment_to_goal: "This is your ultimate career goal" }
        ],
        career_summary: "A strategic 3-5 year path from analyst to senior data science leadership.",
        total_timeline: "3-5 years"
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
