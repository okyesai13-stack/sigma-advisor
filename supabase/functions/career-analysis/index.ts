import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resume_id } = await req.json();

    if (!resume_id) {
      throw new Error('No resume_id provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch resume data
    const { data: resumeData, error: fetchError } = await supabase
      .from('resume_store')
      .select('*')
      .eq('resume_id', resume_id)
      .single();

    if (fetchError || !resumeData) {
      throw new Error('Resume not found: ' + (fetchError?.message || 'Unknown error'));
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build context from parsed resume
    const parsedData = resumeData.parsed_data || {};
    const skills = parsedData.skills?.join(', ') || 'Not specified';
    const education = parsedData.education?.map((e: any) => 
      `${e.degree} in ${e.field || 'N/A'} from ${e.institution}`
    ).join('; ') || 'Not specified';
    const experience = parsedData.experience?.map((e: any) => 
      `${e.role} at ${e.company} (${e.start_year || ''} - ${e.end_year || 'Present'})`
    ).join('; ') || 'Not specified';
    const projects = parsedData.projects?.map((p: any) => p.name).join(', ') || 'Not specified';
    const userGoal = resumeData.goal || 'Not specified';
    const userChallenge = resumeData.challenge || '';

    const systemPrompt = `You are an expert AI Career Advisor specializing in helping students and professionals in India create structured career progression paths. Your job is to analyze the user's current position and their ultimate career goal, then create a THREE-STAGE career roadmap:

1. **SHORT-TERM ROLE (0-12 months)**: The immediate next step from their current position.
2. **MID-TERM ROLE (1-3 years)**: An intermediate position that bridges the gap.
3. **LONG-TERM ROLE (3-5 years)**: The user's ultimate career goal.

Each role must logically progress from the previous one with India-specific salary expectations in INR.

${userChallenge ? `IMPORTANT: The user has described a specific career challenge they are facing. In the "overall_assessment" field, you MUST directly address this challenge with concrete, actionable solutions and strategies. Start the assessment by acknowledging their challenge and providing a clear path to overcome it.` : ''}`;

    const userPrompt = `Create a structured career progression path:

CAREER GOAL: ${userGoal}
${userChallenge ? `\nCAREER CHALLENGE: ${userChallenge}` : ''}

EDUCATION: ${education}
EXPERIENCE: ${experience}
PROJECTS: ${projects}
SKILLS: ${skills}

Return this EXACT JSON format:
{
  "career_roles": [
    {
      "role": "Role Title",
      "domain": "Domain/Industry",
      "progression_stage": "short_term",
      "timeline": "0-12 months",
      "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "match_score": 85,
      "why_fit": "Why this role is the right first step",
      "salary_range": "₹X - ₹Y LPA",
      "growth_potential": "High/Medium/Low",
      "skills_to_develop": ["skill1", "skill2"],
      "key_milestones": ["milestone1", "milestone2"]
    },
    {
      "role": "Role Title",
      "domain": "Domain/Industry", 
      "progression_stage": "mid_term",
      "timeline": "1-3 years",
      "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "match_score": 70,
      "why_fit": "Why this role bridges the gap",
      "salary_range": "₹X - ₹Y LPA",
      "growth_potential": "High/Medium/Low",
      "skills_to_develop": ["skill1", "skill2"],
      "key_milestones": ["milestone1", "milestone2"],
      "prerequisites": "What they need from short-term role"
    },
    {
      "role": "Role Title (Ultimate Goal)",
      "domain": "Domain/Industry",
      "progression_stage": "long_term", 
      "timeline": "3-5 years",
      "top_skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "match_score": 60,
      "why_fit": "How this achieves their ultimate career goal",
      "salary_range": "₹X - ₹Y LPA",
      "growth_potential": "High",
      "skills_to_develop": ["skill1", "skill2"],
      "key_milestones": ["milestone1", "milestone2"],
      "prerequisites": "What they need from mid-term role"
    }
  ],
  "skill_analysis": {
    "current_strengths": ["skill1", "skill2"],
    "short_term_gaps": ["skills needed for first role"],
    "mid_term_gaps": ["skills needed for second role"],
    "long_term_gaps": ["skills needed for ultimate goal"]
  },
  "career_roadmap": {
    "short_term": "0-12 months: Specific goals",
    "mid_term": "1-3 years: Specific goals", 
    "long_term": "3-5 years: Achieving ${userGoal}"
  },
  "overall_assessment": "Summary of the career path"
}`;

    console.log('Generating career analysis for resume:', resume_id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI service rate limited. Please try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        );
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
    
    const careerAdvice = JSON.parse(cleanJson);

    // Store results
    const { error: insertError } = await supabase
      .from('career_analysis_result')
      .insert({
        resume_id: resume_id,
        career_roles: careerAdvice.career_roles || [],
        skill_analysis: careerAdvice.skill_analysis || {},
        career_roadmap: careerAdvice.career_roadmap || {},
        overall_assessment: careerAdvice.overall_assessment || '',
      });

    if (insertError) {
      console.error('Error storing career analysis:', insertError);
    }

    // Update journey state
    await supabase.rpc('update_journey_state_flag', {
      p_resume_id: resume_id,
      p_flag_name: 'career_analysis_completed',
      p_flag_value: true
    });

    console.log('Career analysis completed for:', resume_id);

    return new Response(
      JSON.stringify({
        success: true,
        data: careerAdvice
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in career-analysis:', error);
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
