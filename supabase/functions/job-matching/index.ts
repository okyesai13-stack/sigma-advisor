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

    // Get all relevant data
    const [resumeResult, careerResult, skillResult] = await Promise.all([
      supabase.from('resume_store').select('*').eq('resume_id', resume_id).single(),
      supabase.from('career_analysis_result').select('career_roles').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('skill_validation_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const resumeData = resumeResult.data;
    const careerRoles = careerResult.data?.career_roles as any[] || [];
    const skillData = skillResult.data;

    const shortTermRole = careerRoles.find((r: any) => r.progression_stage === 'short_term');
    const targetRole = shortTermRole?.role || resumeData?.goal || 'Software Developer';
    const domain = shortTermRole?.domain || 'Technology';
    const readinessScore = skillData?.readiness_score || 50;
    const userSkills = resumeData?.parsed_data?.skills || [];

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Generate 5 realistic job recommendations for: ${targetRole}
Domain: ${domain}
User Skills: ${userSkills.slice(0, 10).join(', ')}
Readiness Score: ${readinessScore}%
Location: India

Return JSON array with REAL job posting URLs from LinkedIn, Naukri, Indeed, or company career pages:
[
  {
    "job_title": "Job Title",
    "company_name": "Real Company Name",
    "career_role": "${targetRole}",
    "job_description": "Brief description of the role and responsibilities",
    "location": "City, India",
    "relevance_score": 85,
    "skill_tags": ["skill1", "skill2"],
    "required_skills": ["skill1", "skill2", "skill3"],
    "domain": "${domain}",
    "job_url": "https://www.linkedin.com/jobs/view/... or https://www.naukri.com/job-listings/..."
  }
]

Generate realistic job URLs that follow the pattern of actual job boards. Include companies like TCS, Infosys, Wipro, Google, Microsoft, Amazon, etc.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a job matching expert. Return only valid JSON array with realistic job URLs.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI service rate limited' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        );
      }
      throw new Error('AI job matching failed');
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '[]';
    
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const jobs = JSON.parse(content.trim());
    const savedJobs = [];

    for (const job of jobs) {
      const { data: inserted, error } = await supabase
        .from('job_matching_result')
        .insert({
          resume_id: resume_id,
          job_title: job.job_title,
          company_name: job.company_name,
          career_role: job.career_role || targetRole,
          job_description: job.job_description,
          location: job.location,
          relevance_score: job.relevance_score || 70,
          skill_tags: job.skill_tags || [],
          required_skills: job.required_skills || [],
          domain: job.domain || domain,
          job_url: job.job_url || null,
          is_saved: false,
        })
        .select()
        .single();

      if (inserted) {
        savedJobs.push(inserted);
      }
    }

    // Update journey state
    await supabase.rpc('update_journey_state_flag', {
      p_resume_id: resume_id,
      p_flag_name: 'job_matching_completed',
      p_flag_value: true
    });

    console.log('Job matches generated:', savedJobs.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: savedJobs
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in job-matching:', error);
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
