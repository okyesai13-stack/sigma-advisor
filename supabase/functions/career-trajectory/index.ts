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
      throw new Error('resume_id is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for existing trajectory
    const { data: existing } = await supabase
      .from('career_trajectory_result')
      .select('*')
      .eq('resume_id', resume_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, data: existing }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get all user data
    const [resumeResult, careerResult, skillResult] = await Promise.all([
      supabase.from('resume_store').select('*').eq('resume_id', resume_id).single(),
      supabase.from('career_analysis_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('skill_validation_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const resume = resumeResult.data;
    const career = careerResult.data;
    const skills = skillResult.data;

    if (!resume) {
      throw new Error('Resume not found');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const careerRoles = career?.career_roles || [];
    const userGoal = resume.goal || 'Software Developer';
    const userSkills = resume.parsed_data?.skills || [];
    const experience = resume.parsed_data?.experience || [];
    const readinessScore = skills?.readiness_score || 50;

    // Calculate years of experience
    let totalYearsExp = 0;
    experience.forEach((exp: any) => {
      if (exp.start_year && exp.end_year) {
        totalYearsExp += (exp.end_year - exp.start_year);
      } else if (exp.start_year) {
        totalYearsExp += (2025 - exp.start_year);
      }
    });

    const prompt = `Generate a comprehensive 5-year career trajectory visualization for:

CURRENT PROFILE:
- Goal: ${userGoal}
- Years of Experience: ${totalYearsExp}
- Current Skills: ${userSkills.slice(0, 15).join(', ')}
- Readiness Score: ${readinessScore}%
- Career Roles: ${careerRoles.map((r: any) => r.role).join(' → ')}

Generate detailed data for an interactive career visualization. All salaries in Indian Rupees (₹ LPA).

Return JSON:
{
  "trajectory_data": {
    "current_position": {
      "title": "Current/Entry role",
      "salary_lpa": 6,
      "year": 0,
      "skills_required": ["skill1", "skill2"],
      "description": "Brief description"
    },
    "milestones": [
      {
        "year": 1,
        "title": "Role after 1 year",
        "salary_lpa": 8,
        "skills_gained": ["New skill 1", "New skill 2"],
        "key_achievement": "What to accomplish",
        "promotion_likelihood": 75
      },
      {
        "year": 2,
        "title": "Role after 2 years",
        "salary_lpa": 12,
        "skills_gained": ["skill1", "skill2"],
        "key_achievement": "What to accomplish",
        "promotion_likelihood": 65
      },
      {
        "year": 3,
        "title": "Role after 3 years",
        "salary_lpa": 18,
        "skills_gained": ["skill1", "skill2"],
        "key_achievement": "What to accomplish",
        "promotion_likelihood": 55
      },
      {
        "year": 4,
        "title": "Role after 4 years",
        "salary_lpa": 25,
        "skills_gained": ["skill1", "skill2"],
        "key_achievement": "What to accomplish",
        "promotion_likelihood": 50
      },
      {
        "year": 5,
        "title": "${userGoal}",
        "salary_lpa": 35,
        "skills_gained": ["skill1", "skill2"],
        "key_achievement": "Ultimate career goal achieved",
        "promotion_likelihood": 45
      }
    ]
  },
  "salary_projections": [
    { "year": 0, "min": 5, "avg": 6, "max": 8 },
    { "year": 1, "min": 7, "avg": 9, "max": 12 },
    { "year": 2, "min": 10, "avg": 14, "max": 18 },
    { "year": 3, "min": 15, "avg": 20, "max": 28 },
    { "year": 4, "min": 20, "avg": 28, "max": 38 },
    { "year": 5, "min": 28, "avg": 38, "max": 55 }
  ],
  "skill_milestones": [
    {
      "year": 1,
      "skills_to_learn": ["Skill 1", "Skill 2", "Skill 3"],
      "certifications": ["Relevant certification"],
      "priority": "high"
    },
    {
      "year": 2,
      "skills_to_learn": ["Skill 4", "Skill 5"],
      "certifications": ["Advanced certification"],
      "priority": "medium"
    },
    {
      "year": 3,
      "skills_to_learn": ["Leadership skill 1", "Domain expertise"],
      "certifications": ["Specialist certification"],
      "priority": "medium"
    }
  ],
  "industry_insights": {
    "market_demand": "High/Medium/Low",
    "growth_rate_percent": 15,
    "top_hiring_companies": ["Company 1", "Company 2", "Company 3", "Company 4", "Company 5"],
    "remote_opportunities_percent": 60,
    "job_security_rating": 8,
    "industry_trends": ["Trend 1", "Trend 2", "Trend 3"]
  }
}

Make the progression realistic and achievable. Base salaries on Indian market rates.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a career trajectory analyst with deep knowledge of the Indian job market. Generate realistic career progressions. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI service rate limited' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        );
      }
      throw new Error('Failed to generate trajectory');
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '{}';
    
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const trajectoryData = JSON.parse(content.trim());

    // Store result
    const { data: inserted, error } = await supabase
      .from('career_trajectory_result')
      .insert({
        resume_id,
        trajectory_data: trajectoryData.trajectory_data || {},
        salary_projections: trajectoryData.salary_projections || [],
        skill_milestones: trajectoryData.skill_milestones || [],
        industry_insights: trajectoryData.industry_insights || {},
      })
      .select()
      .single();

    if (error) throw error;

    console.log('Career trajectory generated for:', resume_id);

    return new Response(
      JSON.stringify({ success: true, data: inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in career-trajectory:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
