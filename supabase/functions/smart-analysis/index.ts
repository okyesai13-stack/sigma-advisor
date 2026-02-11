import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resume_id, job_id, force_regenerate } = await req.json();

    if (!resume_id || !job_id) {
      throw new Error('resume_id and job_id are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If force_regenerate, delete existing record
    if (force_regenerate) {
      await supabase
        .from('smart_analysis_result')
        .delete()
        .eq('resume_id', resume_id)
        .eq('job_id', job_id);
    } else {
      // Check if analysis already exists
      const { data: existingAnalysis } = await supabase
        .from('smart_analysis_result')
        .select('*')
        .eq('resume_id', resume_id)
        .eq('job_id', job_id)
        .maybeSingle();

      if (existingAnalysis) {
        return new Response(
          JSON.stringify({ success: true, data: existingAnalysis }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Get job and resume data
    const [jobResult, resumeResult, skillResult] = await Promise.all([
      supabase.from('job_matching_result').select('*').eq('id', job_id).single(),
      supabase.from('resume_store').select('*').eq('resume_id', resume_id).single(),
      supabase.from('skill_validation_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const job = jobResult.data;
    const resume = resumeResult.data;
    const skillData = skillResult.data;

    if (!job) {
      throw new Error('Job not found');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const userSkills = resume?.parsed_data?.skills || [];
    const userExperience = resume?.parsed_data?.experience || [];
    const userEducation = resume?.parsed_data?.education || [];
    const userGoal = resume?.goal || '';

    const prompt = `Perform a comprehensive, honest smart analysis for this job application. Be specific and actionable — avoid generic advice.

JOB DETAILS:
- Title: ${job.job_title}
- Company: ${job.company_name}
- Location: ${job.location}
- Domain: ${job.domain || 'Not specified'}
- Required Skills: ${(job.required_skills || []).join(', ')}
- Description: ${job.job_description}

CANDIDATE PROFILE:
- Goal: ${userGoal}
- Skills: ${userSkills.slice(0, 20).join(', ')}
- Readiness Score: ${skillData?.readiness_score || 50}%
- Work Experience: ${JSON.stringify(userExperience).slice(0, 3000)}
- Education: ${JSON.stringify(userEducation).slice(0, 3000)}

Return comprehensive JSON analysis:
{
  "company_analysis": {
    "company_overview": "2-3 sentence overview of the company, its products, and market position",
    "culture_insights": "Specific insights about work culture, values, and team dynamics",
    "growth_opportunities": "Concrete career growth potential within this company",
    "industry_standing": "Market position, competitors, and industry reputation",
    "interview_culture_tips": "Specific advice on dress code, communication style, what they value in candidates, and interview format expectations"
  },
  "role_analysis": {
    "role_summary": "Clear description of what this role entails day-to-day",
    "key_responsibilities": ["Specific responsibility 1", "Responsibility 2", "Responsibility 3", "Responsibility 4", "Responsibility 5"],
    "growth_path": "Concrete career progression from this role (e.g., Junior → Mid → Senior → Lead)",
    "challenges": "Honest assessment of potential challenges and how to prepare",
    "day_in_the_life": "Detailed description of what a typical workday looks like in this role",
    "required_experience_years": "Estimated years of experience typically required"
  },
  "resume_fit_analysis": {
    "overall_match": "Honest assessment of how well the candidate fits",
    "strengths": ["Specific strength from candidate's background 1", "Strength 2", "Strength 3"],
    "gaps": ["Specific gap relative to job requirements 1", "Gap 2", "Gap 3"],
    "improvement_areas": ["Actionable improvement area 1", "Area 2", "Area 3"]
  },
  "action_plan": [
    { "step": "Concrete action step", "timeframe": "1 week", "priority": "high" },
    { "step": "Another action step", "timeframe": "2 weeks", "priority": "high" },
    { "step": "Medium priority step", "timeframe": "1 month", "priority": "medium" },
    { "step": "Lower priority step", "timeframe": "2 months", "priority": "low" }
  ],
  "salary_insights": {
    "expected_range": "Salary range in appropriate currency based on location and role",
    "negotiation_tips": "Specific negotiation advice based on candidate's strengths"
  },
  "recommendations": ["Specific, actionable recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4", "Recommendation 5"],
  "overall_score": 75
}

Provide honest, personalized analysis. The overall_score should be 0-100 based on actual fit. Include 4-6 action plan steps ordered by priority.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a career analyst providing honest, actionable job fit analysis. Return only valid JSON. Be specific to the candidate and job — never generic.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (response.status === 429) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (response.status === 402) {
      return new Response(
        JSON.stringify({ success: false, error: 'AI credits exhausted. Please try again later.' }),
        { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error('AI smart analysis failed');
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '{}';
    
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const analysisData = JSON.parse(content.trim());

    // Save to database
    const { data: inserted, error } = await supabase
      .from('smart_analysis_result')
      .insert({
        resume_id: resume_id,
        job_id: job_id,
        company_analysis: analysisData.company_analysis || {},
        role_analysis: analysisData.role_analysis || {},
        resume_fit_analysis: analysisData.resume_fit_analysis || {},
        recommendations: analysisData.recommendations || [],
        overall_score: analysisData.overall_score || 50,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Include extra fields not stored in dedicated DB columns
    const responseData = {
      ...inserted,
      action_plan: analysisData.action_plan || [],
      salary_insights: analysisData.salary_insights || {},
    };

    console.log('Smart analysis generated for job:', job.job_title);

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in smart-analysis:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
