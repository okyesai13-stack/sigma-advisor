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

    // Check if interview prep already exists
    const { data: existingPrep } = await supabase
      .from('interview_preparation_result')
      .select('*')
      .eq('resume_id', resume_id)
      .eq('job_id', job_id)
      .maybeSingle();

    if (existingPrep) {
      return new Response(
        JSON.stringify({ success: true, data: existingPrep }),
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
    const requiredSkills = job.required_skills || [];
    const matchedSkills = skillData?.matched_skills || { strong: [], partial: [] };

    const prompt = `Generate comprehensive interview preparation content for:

Job Title: ${job.job_title}
Company: ${job.company_name}
Location: ${job.location}
Required Skills: ${requiredSkills.join(', ')}
Job Description: ${job.job_description}

Candidate's Skills: ${userSkills.slice(0, 15).join(', ')}
Strong Skills: ${matchedSkills.strong?.slice(0, 5).join(', ')}
Partial Skills: ${matchedSkills.partial?.slice(0, 5).join(', ')}

Return JSON:
{
  "technical_questions": [
    {"question": "Technical question?", "hint": "Key points to cover", "difficulty": "easy/medium/hard"}
  ],
  "behavioral_questions": [
    {"question": "Behavioral question?", "hint": "STAR method points", "example_answer_structure": "Brief structure"}
  ],
  "company_specific_questions": [
    {"question": "Company culture/values question?", "research_tip": "What to research"}
  ],
  "preparation_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "key_talking_points": ["Point 1", "Point 2", "Point 3"]
}

Generate 5 technical questions, 4 behavioral questions, 3 company-specific questions, 5 preparation tips, and 5 key talking points.`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'system', content: 'You are an expert interview coach. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error('AI interview prep generation failed');
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '{}';
    
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const prepData = JSON.parse(content.trim());

    // Save to database
    const { data: inserted, error } = await supabase
      .from('interview_preparation_result')
      .insert({
        resume_id: resume_id,
        job_id: job_id,
        job_title: job.job_title,
        company_name: job.company_name,
        technical_questions: prepData.technical_questions || [],
        behavioral_questions: prepData.behavioral_questions || [],
        company_specific_questions: prepData.company_specific_questions || [],
        preparation_tips: prepData.preparation_tips || [],
        key_talking_points: prepData.key_talking_points || [],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('Interview prep generated for job:', job.job_title);

    return new Response(
      JSON.stringify({ success: true, data: inserted }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in interview-prep:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
