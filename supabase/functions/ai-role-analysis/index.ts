import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resume_id } = await req.json();
    
    if (!resume_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'resume_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI Role Analysis] Starting for resume: ${resume_id}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch resume data
    const { data: resumeData, error: resumeError } = await supabase
      .from('resume_store')
      .select('parsed_data, resume_text, goal')
      .eq('resume_id', resume_id)
      .single();

    if (resumeError || !resumeData) {
      console.error('[AI Role Analysis] Resume fetch error:', resumeError);
      return new Response(
        JSON.stringify({ success: false, error: 'Resume not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch career analysis for context
    const { data: careerData } = await supabase
      .from('career_analysis_result')
      .select('career_roles, skill_analysis')
      .eq('resume_id', resume_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const parsedData = resumeData.parsed_data || {};
    const skills = parsedData.skills || [];
    const experience = parsedData.experience || [];
    const education = parsedData.education || [];
    const resumeText = resumeData.resume_text || '';
    const careerGoal = resumeData.goal || '';
    const careerRoles = careerData?.career_roles || [];

    const systemPrompt = `You are an AI Career Futurist expert analyzing how AI technology will impact careers. Your task is to:
1. Identify roles in the user's current career path that are at risk of AI automation
2. Suggest exactly 3 NEW AI-enhanced job roles that will emerge and match the user's skills
3. Analyze skill gaps for transitioning to AI-powered careers
4. Create a preparation roadmap

You MUST return a valid JSON object with this exact structure:
{
  "roles_at_risk": [
    {
      "role": "string - current or related role at risk",
      "risk_level": "high" | "medium" | "low",
      "timeline": "string - when AI will impact this role",
      "reason": "string - why this role is at risk",
      "mitigation": "string - how to transition away"
    }
  ],
  "ai_enhanced_roles": [
    {
      "role": "string - new AI-driven job title",
      "description": "string - what this role does",
      "match_score": number between 50-95,
      "skills_required": ["array of required skills"],
      "current_skills_match": ["skills user already has"],
      "missing_skills": ["skills user needs to acquire"],
      "salary_range": "string - salary range in LPA",
      "growth_potential": "Very High" | "High" | "Medium",
      "timeline_to_ready": "string - time needed to be job-ready"
    }
  ],
  "current_ai_ready_skills": ["array of user's skills that apply to AI roles"],
  "skills_to_acquire": [
    {
      "skill": "string - skill name",
      "importance": "high" | "medium" | "low",
      "learning_path": "string - how to learn this",
      "estimated_time": "string - time to learn"
    }
  ],
  "preparation_roadmap": {
    "short_term": ["array of actions for 0-6 months"],
    "mid_term": ["array of actions for 6-18 months"],
    "long_term": ["array of actions for 18+ months"]
  },
  "overall_ai_readiness_score": number between 0-100,
  "key_insights": "string - 2-3 sentence summary of AI career potential"
}

CRITICAL REQUIREMENTS:
- Return EXACTLY 3 ai_enhanced_roles, sorted by match_score (highest first)
- Match scores must be realistic (50-95% range)
- Roles must be achievable based on user's current experience
- Include specific AI/ML-related roles that are emerging in the job market
- Focus on roles like: AI Product Manager, MLOps Engineer, AI Ethics Officer, Prompt Engineer, AI Solutions Architect, Data Science Manager, AI Trainer, Conversational AI Designer, etc.
- Consider the user's domain expertise when suggesting roles`;

    const userPrompt = `Analyze this candidate's profile for AI career opportunities:

SKILLS: ${JSON.stringify(skills)}

EXPERIENCE: ${JSON.stringify(experience)}

EDUCATION: ${JSON.stringify(education)}

CAREER GOAL: ${careerGoal}

CURRENT CAREER ROLES IDENTIFIED: ${JSON.stringify(careerRoles)}

RESUME TEXT (for additional context): ${resumeText.substring(0, 2000)}

Provide a comprehensive AI career analysis with exactly 3 AI-enhanced roles that match their background.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[AI Role Analysis] Calling Gemini 3...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[AI Role Analysis] AI gateway error:', errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content || '';
    
    console.log('[AI Role Analysis] Raw AI response received, parsing...');

    // Parse JSON from response
    let analysisData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[AI Role Analysis] Parse error:', parseError);
      // Return a default structure if parsing fails
      analysisData = {
        roles_at_risk: [],
        ai_enhanced_roles: [
          {
            role: "AI-Assisted Professional",
            description: "Leverage AI tools to enhance productivity in your current domain",
            match_score: 70,
            skills_required: ["AI Tool Proficiency", "Domain Expertise", "Prompt Engineering"],
            current_skills_match: skills.slice(0, 3),
            missing_skills: ["AI Tool Proficiency", "Prompt Engineering"],
            salary_range: "15-30 LPA",
            growth_potential: "High",
            timeline_to_ready: "3-6 months"
          },
          {
            role: "AI Product Specialist",
            description: "Bridge the gap between AI capabilities and business needs",
            match_score: 65,
            skills_required: ["Product Thinking", "AI/ML Basics", "Communication"],
            current_skills_match: skills.slice(0, 2),
            missing_skills: ["AI/ML Basics"],
            salary_range: "18-35 LPA",
            growth_potential: "Very High",
            timeline_to_ready: "6-12 months"
          },
          {
            role: "AI Implementation Consultant",
            description: "Help organizations adopt and integrate AI solutions",
            match_score: 60,
            skills_required: ["Consulting", "AI Understanding", "Change Management"],
            current_skills_match: skills.slice(0, 2),
            missing_skills: ["AI Understanding", "Change Management"],
            salary_range: "20-40 LPA",
            growth_potential: "High",
            timeline_to_ready: "8-14 months"
          }
        ],
        current_ai_ready_skills: skills.slice(0, 5),
        skills_to_acquire: [
          { skill: "Prompt Engineering", importance: "high", learning_path: "Online courses + practice", estimated_time: "1-2 months" },
          { skill: "AI/ML Fundamentals", importance: "high", learning_path: "Coursera/Udemy courses", estimated_time: "3-4 months" },
          { skill: "AI Ethics", importance: "medium", learning_path: "Certifications", estimated_time: "1-2 months" }
        ],
        preparation_roadmap: {
          short_term: ["Learn AI tools in your domain", "Complete prompt engineering course", "Build 1 AI-powered project"],
          mid_term: ["Get certified in AI tools", "Apply for hybrid AI roles", "Network with AI professionals"],
          long_term: ["Lead AI initiatives", "Become domain AI expert", "Build AI portfolio"]
        },
        overall_ai_readiness_score: 45,
        key_insights: "Your current skills provide a foundation for AI-enhanced roles. Focus on learning AI fundamentals and prompt engineering to unlock high-growth opportunities in the AI economy."
      };
    }

    // Ensure exactly 3 AI enhanced roles
    if (analysisData.ai_enhanced_roles && analysisData.ai_enhanced_roles.length > 3) {
      analysisData.ai_enhanced_roles = analysisData.ai_enhanced_roles.slice(0, 3);
    }

    // Sort by match_score
    if (analysisData.ai_enhanced_roles) {
      analysisData.ai_enhanced_roles.sort((a: any, b: any) => (b.match_score || 0) - (a.match_score || 0));
    }

    console.log('[AI Role Analysis] Storing results in database...');

    // Store in database
    const { error: insertError } = await supabase
      .from('ai_role_analysis_result')
      .insert({
        resume_id,
        roles_at_risk: analysisData.roles_at_risk || [],
        ai_enhanced_roles: analysisData.ai_enhanced_roles || [],
        current_ai_ready_skills: analysisData.current_ai_ready_skills || [],
        skills_to_acquire: analysisData.skills_to_acquire || [],
        preparation_roadmap: analysisData.preparation_roadmap || {},
        overall_ai_readiness_score: analysisData.overall_ai_readiness_score || 0,
        key_insights: analysisData.key_insights || ''
      });

    if (insertError) {
      console.error('[AI Role Analysis] Insert error:', insertError);
      throw insertError;
    }

    // Update journey state
    await supabase.rpc('update_journey_state_flag', {
      p_resume_id: resume_id,
      p_flag_name: 'ai_role_analysis_completed',
      p_flag_value: true
    });

    console.log('[AI Role Analysis] Completed successfully');

    return new Response(
      JSON.stringify({ success: true, data: analysisData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI Role Analysis] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
