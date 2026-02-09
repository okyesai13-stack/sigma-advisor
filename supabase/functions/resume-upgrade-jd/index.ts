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
    const { resume_id, job_description } = await req.json();

    if (!resume_id || !job_description) {
      return new Response(
        JSON.stringify({ success: false, error: 'resume_id and job_description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch user profile
    const { data: resumeStore, error: resumeError } = await supabase
      .from('resume_store')
      .select('*')
      .eq('resume_id', resume_id)
      .maybeSingle();

    if (!resumeStore || resumeError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Resume not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are an expert resume writer and ATS optimization specialist. You have two inputs:

1. THE USER'S PROFILE (their existing resume/background):
- Resume Text: ${resumeStore.resume_text?.slice(0, 3000) || 'Not available'}
- Career Goal: ${resumeStore.goal || 'Not specified'}
- Parsed Data: ${JSON.stringify(resumeStore.parsed_data || {})}

2. THE TARGET JOB DESCRIPTION:
${job_description.slice(0, 4000)}

YOUR TASKS:
A) Extract the exact job title from the JD. This will be used as "target_role".
B) Generate a complete, professional resume tailored specifically for this JD. Align the user's real experience and skills to match the JD requirements. Use keywords from the JD for ATS optimization. Highlight relevant experience and downplay irrelevant parts.

Return ONLY valid JSON (no markdown) with this structure:

{
  "target_role": "Exact Job Title from JD",
  "resume": {
    "header": {
      "name": "Full Name from user profile",
      "title": "Professional title aligned with the JD role",
      "contact": {
        "email": "email@example.com",
        "phone": "+91 XXXXX XXXXX",
        "location": "City, Country",
        "linkedin": "linkedin.com/in/username"
      }
    },
    "summary": "3-4 sentence professional summary tailored to the JD. Include JD keywords and highlight relevant qualifications.",
    "skills": {
      "technical": ["skill1", "skill2"],
      "tools": ["tool1", "tool2"],
      "domain": ["domain1", "domain2"]
    },
    "work_experience": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "duration": "Month Year - Present",
        "location": "City, Country",
        "achievements": [
          "Achievement aligned with JD requirements with metrics",
          "Achievement demonstrating relevant skills from JD"
        ]
      }
    ],
    "projects": [
      {
        "title": "Project Name",
        "description": "Description highlighting relevance to JD",
        "technologies": ["tech1", "tech2"],
        "highlights": ["Key outcome relevant to JD"]
      }
    ],
    "education": [
      {
        "degree": "Degree Name",
        "institution": "University Name",
        "year": "Year",
        "gpa": "GPA if notable"
      }
    ],
    "certifications": [
      {
        "name": "Certification Name",
        "issuer": "Issuing Organization",
        "year": "Year"
      }
    ]
  }
}

Important:
- Extract real info from the user's profile where available
- Optimize bullet points with action verbs and metrics aligned to JD
- Use JD keywords naturally throughout the resume
- Make it ATS-friendly`;

    console.log('Calling AI to generate JD-based resume for:', resume_id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an expert resume writer. Return only valid JSON without markdown formatting.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '{}';

    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse generated resume');
    }

    const targetRole = parsed.target_role || 'Untitled Role';
    const generatedResume = parsed.resume || parsed;

    // Save to database
    const { data: savedResume, error: saveError } = await supabase
      .from('upgraded_resume_result')
      .insert({
        resume_id,
        resume_data: generatedResume,
        target_role: targetRole,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving resume:', saveError);
      throw new Error('Failed to save upgraded resume');
    }

    console.log('Successfully generated JD-based resume:', savedResume.id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: savedResume.id,
          resume_data: generatedResume,
          target_role: targetRole,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Resume upgrade JD error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
