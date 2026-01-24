import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Fetch user's goal from users_profile table
    const { data: userProfile } = await supabaseClient
      .from('users_profile')
      .select('goal_type, goal_description, interests, hobbies, activities, user_type, display_name')
      .eq('id', user.id)
      .maybeSingle();

    const userGoal = userProfile?.goal_description || userProfile?.goal_type || "";
    const userType = userProfile?.user_type || "professional";
    const userName = userProfile?.display_name || "User";
    const interests = userProfile?.interests || [];
    const hobbies = userProfile?.hobbies || [];

    console.log("User goal:", userGoal, "User type:", userType);

    // Build the data section based on what's available
    let dataSection = "";
    let currentRole = "";
    let userSkills: string[] = [];
    
    if (parsedData) {
      // Extract skills from parsed resume
      userSkills = parsedData.skills || [];
      
      // Extract current role from experience
      if (parsedData.experience && parsedData.experience.length > 0) {
        currentRole = parsedData.experience[0]?.role || parsedData.experience[0]?.title || "";
      }
      
      dataSection = `Resume Data:
Name: ${parsedData.name || 'Not specified'}
Current/Recent Role: ${currentRole || 'Not specified'}
Skills: ${userSkills.join(', ') || 'Not specified'}
Education: ${parsedData.education?.map((e: any) => `${e.degree} in ${e.field || e.major || ''} from ${e.institution || e.school || ''}`).join('; ') || 'Not specified'}
Experience: ${parsedData.experience?.map((e: any) => `${e.role || e.title} at ${e.company} (${e.duration || e.startDate + ' - ' + (e.endDate || 'Present')})`).join('; ') || 'Not specified'}
Projects: ${parsedData.projects?.map((p: any) => p.name || p.title).join(', ') || 'Not specified'}
Certifications: ${parsedData.certifications?.join(', ') || 'None'}`;
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
        currentRole = experience[0]?.role || "";
        experience.forEach((exp: any, i: number) => {
          profileText += `\n${i + 1}. ${exp.role || 'Role'} at ${exp.company || 'Company'} (${exp.start_year || ''} - ${exp.end_year || 'Present'})`;
          if (exp.skills && exp.skills.length > 0) {
            userSkills = [...userSkills, ...exp.skills];
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
      console.log("Using profile data for analysis");
    }

    const systemPrompt = `You are an expert AI Career Advisor specializing in helping students and professionals create structured career progression paths. Your job is to analyze the user's current position and their ultimate career goal, then create a THREE-STAGE career roadmap:

1. **SHORT-TERM ROLE (0-12 months)**: The immediate next step from their current position. This should be achievable within a year with their current skills.
2. **MID-TERM ROLE (1-3 years)**: An intermediate position that bridges the gap between their current level and ultimate goal.
3. **LONG-TERM ROLE (3-5 years)**: The user's ultimate career goal or the closest achievable version of it.

CRITICAL RULES:
- The three roles MUST form a clear career progression ladder toward the user's stated goal
- Short-term role should be immediately achievable with current skills
- Mid-term role should require skills developed from short-term role
- Long-term role should BE or closely align with the user's stated goal
- Consider realistic timelines based on industry standards`;

    const userPrompt = `Create a structured career progression path for this user:

USER'S ULTIMATE CAREER GOAL: "${userGoal || 'Not specified - infer from their background'}"
CURRENT ROLE: ${currentRole || 'Entry-level or transitioning'}
USER TYPE: ${userType}
NAME: ${userName}
INTERESTS: ${interests.join(', ') || 'Not specified'}
HOBBIES: ${hobbies.join(', ') || 'Not specified'}

${dataSection}

CRITICAL INSTRUCTION: The user's ultimate career goal is "${userGoal}". 

Based on their current experience and skills, create exactly THREE career roles that form a logical progression path to achieve this goal:

1. SHORT-TERM ROLE (0-12 months): What role can they get NOW or within 1 year? This should be at or slightly above their current level.
2. MID-TERM ROLE (1-3 years): What intermediate role will prepare them for their ultimate goal?
3. LONG-TERM ROLE (3-5 years): Their ultimate goal "${userGoal}" or the closest realistic version of it.

Return the response in this EXACT JSON format:
{
  "career_matches": [
    {
      "role": "Short-term Role Title",
      "domain": "Domain/Industry",
      "progression_stage": "short_term",
      "timeline": "0-12 months",
      "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "match_score": 85,
      "why_fit": "Why this role is the right first step toward their goal",
      "salary_range": "Expected salary range",
      "growth_potential": "High",
      "skills_to_develop": ["skill1", "skill2"],
      "key_milestones": ["milestone1", "milestone2"],
      "alignment_to_goal": "How this role connects to achieving ${userGoal}"
    },
    {
      "role": "Mid-term Role Title",
      "domain": "Domain/Industry", 
      "progression_stage": "mid_term",
      "timeline": "1-3 years",
      "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "match_score": 70,
      "why_fit": "Why this role bridges the gap to their goal",
      "salary_range": "Expected salary range",
      "growth_potential": "High",
      "skills_to_develop": ["skill1", "skill2"],
      "key_milestones": ["milestone1", "milestone2"],
      "prerequisites": "What they need from short-term role",
      "alignment_to_goal": "How this role prepares them for ${userGoal}"
    },
    {
      "role": "${userGoal || 'Ultimate Goal Role'}",
      "domain": "Domain/Industry",
      "progression_stage": "long_term", 
      "timeline": "3-5 years",
      "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "match_score": 60,
      "why_fit": "How this achieves their ultimate career goal",
      "salary_range": "Expected salary range",
      "growth_potential": "High",
      "skills_to_develop": ["skill1", "skill2"],
      "key_milestones": ["milestone1", "milestone2"],
      "prerequisites": "What they need from mid-term role",
      "alignment_to_goal": "This IS their ultimate career goal"
    }
  ],
  "skill_analysis": {
    "current_strengths": ["skill1", "skill2"],
    "short_term_gaps": ["skills needed for first role"],
    "mid_term_gaps": ["skills needed for second role"],
    "long_term_gaps": ["skills needed for ultimate goal"]
  },
  "career_roadmap": {
    "short_term": "0-12 months: Specific goals and actions for short-term role",
    "mid_term": "1-3 years: Specific goals and transitions for mid-term role", 
    "long_term": "3-5 years: Achieving ${userGoal}"
  },
  "overall_assessment": "A paragraph summarizing the career path from current position to ultimate goal"
}

IMPORTANT: 
- The THREE roles MUST form a logical progression ladder
- Short-term role should be immediately achievable
- Mid-term role should require skills from short-term role
- Long-term role should be "${userGoal}" or closest realistic version
- Be specific and actionable`;

    console.log('Generating career progression path for user goal:', userGoal);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const responseText = aiResponse.choices?.[0]?.message?.content || '{}';
    
    // Clean markdown if present
    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/```\n?/g, '');
    }
    
    let careerAdvice;
    try {
      careerAdvice = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Provide fallback structure
      careerAdvice = {
        career_matches: [
          {
            role: currentRole ? `Senior ${currentRole}` : "Junior Developer",
            domain: "Technology",
            progression_stage: "short_term",
            timeline: "0-12 months",
            top_skills: userSkills.slice(0, 5),
            match_score: 85,
            why_fit: "This is a natural progression from your current position.",
            salary_range: "Competitive",
            growth_potential: "High",
            skills_to_develop: ["Leadership", "Advanced Technical Skills"],
            key_milestones: ["Complete key projects", "Gain certifications"],
            alignment_to_goal: "First step toward your career goal"
          },
          {
            role: "Mid-level Position",
            domain: "Technology",
            progression_stage: "mid_term",
            timeline: "1-3 years",
            top_skills: userSkills.slice(0, 5),
            match_score: 70,
            why_fit: "Bridges the gap between current position and goal.",
            salary_range: "Competitive",
            growth_potential: "High",
            skills_to_develop: ["Management", "Strategy"],
            key_milestones: ["Lead team projects", "Mentor juniors"],
            prerequisites: "Experience from short-term role",
            alignment_to_goal: "Preparation for senior role"
          },
          {
            role: userGoal || "Senior Manager",
            domain: "Technology",
            progression_stage: "long_term",
            timeline: "3-5 years",
            top_skills: userSkills.slice(0, 5),
            match_score: 60,
            why_fit: "Your ultimate career goal.",
            salary_range: "Competitive",
            growth_potential: "High",
            skills_to_develop: ["Executive Leadership", "Business Strategy"],
            key_milestones: ["Build and lead department", "Drive organizational success"],
            prerequisites: "Experience from mid-term role",
            alignment_to_goal: "This is your ultimate career goal"
          }
        ],
        skill_analysis: {
          current_strengths: userSkills.slice(0, 3),
          short_term_gaps: ["Communication", "Project Management"],
          mid_term_gaps: ["Leadership", "Strategy"],
          long_term_gaps: ["Executive Presence", "Business Acumen"]
        },
        career_roadmap: {
          short_term: "0-12 months: Build foundation and gain experience",
          mid_term: "1-3 years: Develop leadership and advance",
          long_term: `3-5 years: Achieve ${userGoal || 'your ultimate career goal'}`
        },
        overall_assessment: `Based on your profile, you have a clear path to achieve ${userGoal || 'your career goals'} through structured progression.`
      };
    }

    console.log('Successfully generated career progression path');
    console.log('Roles generated:', careerAdvice.career_matches?.map((m: any) => `${m.progression_stage}: ${m.role}`));

    return new Response(
      JSON.stringify({
        success: true,
        careerAdvice
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in resume-career-advice:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
