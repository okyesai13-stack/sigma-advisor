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
    const { resume_id, job_id } = await req.json();

    if (!resume_id || !job_id) {
      throw new Error('resume_id and job_id are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const userSkills = resume?.parsed_data?.skills || [];
    const userExperience = resume?.parsed_data?.experience || [];
    const userEducation = resume?.parsed_data?.education || [];
    const userGoal = resume?.goal || '';

    const prompt = `Perform a comprehensive smart analysis for job application:

JOB DETAILS:
- Title: ${job.job_title}
- Company: ${job.company_name}
- Location: ${job.location}
- Domain: ${job.domain}
- Required Skills: ${(job.required_skills || []).join(', ')}
- Description: ${job.job_description}

CANDIDATE PROFILE:
- Goal: ${userGoal}
- Skills: ${userSkills.slice(0, 15).join(', ')}
- Readiness Score: ${skillData?.readiness_score || 50}%
- Experience: ${JSON.stringify(userExperience).slice(0, 500)}
- Education: ${JSON.stringify(userEducation).slice(0, 300)}

Return comprehensive JSON analysis:
{
  "company_analysis": {
    "company_overview": "Brief about the company",
    "culture_insights": "Company culture and values",
    "growth_opportunities": "Career growth potential",
    "industry_standing": "Market position and reputation"
  },
  "role_analysis": {
    "role_summary": "What the role entails",
    "key_responsibilities": ["Responsibility 1", "Responsibility 2"],
    "growth_path": "Career progression from this role",
    "challenges": "Potential challenges in this role"
  },
  "resume_fit_analysis": {
    "overall_match": "How well the candidate fits",
    "strengths": ["Strength 1", "Strength 2"],
    "gaps": ["Gap 1", "Gap 2"],
    "improvement_areas": ["Area 1", "Area 2"]
  },
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "overall_score": 75
}

Provide honest, actionable analysis with an overall_score from 0-100.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'system', content: 'You are a career analyst providing honest, actionable job fit analysis. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
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

    console.log('Smart analysis generated for job:', job.job_title);

    return new Response(
      JSON.stringify({ success: true, data: inserted }),
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
