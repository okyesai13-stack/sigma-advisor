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
        .from('interview_preparation_result')
        .delete()
        .eq('resume_id', resume_id)
        .eq('job_id', job_id);
    } else {
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
    const requiredSkills = job.required_skills || [];
    const matchedSkills = skillData?.matched_skills || { strong: [], partial: [] };
    const userExperience = resume?.parsed_data?.experience || [];
    const userEducation = resume?.parsed_data?.education || [];
    const userGoal = resume?.goal || '';

    const prompt = `Generate comprehensive, personalized interview preparation content for this specific candidate applying to this specific job.

JOB DETAILS:
- Title: ${job.job_title}
- Company: ${job.company_name}
- Location: ${job.location}
- Domain: ${job.domain || 'Not specified'}
- Required Skills: ${requiredSkills.join(', ')}
- Job Description: ${job.job_description}

CANDIDATE PROFILE:
- Career Goal: ${userGoal}
- Skills: ${userSkills.slice(0, 20).join(', ')}
- Strong Matched Skills: ${matchedSkills.strong?.slice(0, 8).join(', ')}
- Partially Matched Skills: ${matchedSkills.partial?.slice(0, 8).join(', ')}
- Readiness Score: ${skillData?.readiness_score || 'Not assessed'}%
- Work Experience: ${JSON.stringify(userExperience).slice(0, 3000)}
- Education: ${JSON.stringify(userEducation).slice(0, 3000)}

IMPORTANT INSTRUCTIONS:
- Personalize questions based on the candidate's ACTUAL skills and experience gaps
- Technical questions should target areas where the candidate is weak relative to the job requirements
- Behavioral questions should help the candidate leverage their real experience
- Provide detailed, actionable answer outlines — not just hints

Return JSON:
{
  "technical_questions": [
    {
      "question": "Specific technical question targeting a gap or required skill",
      "hint": "Key concepts to mention",
      "difficulty": "easy/medium/hard",
      "sample_answer_outline": "A detailed step-by-step outline of how to answer this well, including specific examples the candidate could use from their background"
    }
  ],
  "behavioral_questions": [
    {
      "question": "Behavioral question relevant to the role",
      "hint": "STAR method guidance",
      "example_answer_structure": "Situation: [describe a relevant scenario from their experience]\\nTask: [what was the challenge]\\nAction: [specific steps taken]\\nResult: [measurable outcome]"
    }
  ],
  "company_specific_questions": [
    {
      "question": "Question about company culture/values/mission",
      "research_tip": "What to research and where to find it",
      "why_it_matters": "Why interviewers ask this and what they're evaluating"
    }
  ],
  "preparation_tips": ["Actionable, specific tip 1", "Tip 2", "Tip 3", "Tip 4", "Tip 5"],
  "key_talking_points": ["Specific point referencing candidate's actual strengths 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "dos_and_donts": {
    "dos": ["Specific do for this interview 1", "Do 2", "Do 3", "Do 4", "Do 5"],
    "donts": ["Specific don't for this interview 1", "Don't 2", "Don't 3", "Don't 4", "Don't 5"]
  }
}

Generate 6 technical questions (mix of easy, medium, hard), 5 behavioral questions, 4 company-specific questions, 5 preparation tips, 5 key talking points, and 5 dos + 5 donts.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert interview coach with deep knowledge of hiring practices. Return only valid JSON. Personalize all content to the specific candidate and job.' },
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

    // Return with dos_and_donts included (stored in the response but not in DB column)
    const responseData = { ...inserted, dos_and_donts: prepData.dos_and_donts || { dos: [], donts: [] } };

    console.log('Interview prep generated for job:', job.job_title);

    return new Response(
      JSON.stringify({ success: true, data: responseData }),
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
