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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch all user data in parallel
    const [resumeRes, careerRes, skillRes, learningRes, projectRes, jobRes] = await Promise.all([
      supabase.from('resume_store').select('*').eq('resume_id', resume_id).maybeSingle(),
      supabase.from('career_analysis_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('skill_validation_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('learning_plan_result').select('*').eq('resume_id', resume_id),
      supabase.from('project_ideas_result').select('*').eq('resume_id', resume_id),
      supabase.from('job_matching_result').select('*').eq('resume_id', resume_id).order('relevance_score', { ascending: false }).limit(3),
    ]);

    if (!resumeRes.data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Resume not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resumeData = resumeRes.data;
    const careerData = careerRes.data;
    const skillData = skillRes.data;
    const learningData = learningRes.data || [];
    const projectData = projectRes.data || [];
    const jobData = jobRes.data || [];

    // Build context for AI
    const targetRole = careerData?.career_roles?.[0]?.role || skillData?.target_role || resumeData.goal || 'Professional';
    const matchedSkills = skillData?.matched_skills?.strong || [];
    const missingSkills = skillData?.missing_skills || [];
    const completedLearning = learningData.map((l: any) => l.skill_name);
    const projectTitles = projectData.map((p: any) => ({ title: p.title, skills: p.skills_demonstrated }));

    const prompt = `You are an expert resume writer. Generate an optimized, ATS-friendly resume in JSON format based on the user's profile.

USER PROFILE:
- Original Resume Text: ${resumeData.resume_text?.slice(0, 2000) || 'Not available'}
- Career Goal: ${resumeData.goal || 'Not specified'}
- User Type: ${resumeData.user_type || 'professional'}
- Target Role: ${targetRole}
- Strong Skills: ${matchedSkills.join(', ') || 'Various'}
- Skills Being Developed: ${missingSkills.slice(0, 5).join(', ') || 'None specified'}
- Learning Completed: ${completedLearning.join(', ') || 'None'}
- Portfolio Projects: ${JSON.stringify(projectTitles.slice(0, 3))}
- Top Job Matches: ${jobData.map((j: any) => j.job_title + ' at ' + j.company_name).join(', ') || 'Various roles'}

Generate a complete, professional resume with these sections. Use the context to enhance and optimize each section. Return ONLY valid JSON in this exact structure:

{
  "header": {
    "name": "Full Name from resume or generate professional name",
    "title": "Professional title aligned with target role: ${targetRole}",
    "contact": {
      "email": "email@example.com",
      "phone": "+91 XXXXX XXXXX",
      "location": "City, Country",
      "linkedin": "linkedin.com/in/username"
    }
  },
  "summary": "3-4 sentence professional summary highlighting experience, key skills, and career objective. Tailor it for ${targetRole}. Include quantifiable achievements where possible.",
  "skills": {
    "technical": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "tools": ["tool1", "tool2", "tool3"],
    "domain": ["domain1", "domain2"]
  },
  "work_experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Month Year - Present",
      "location": "City, Country",
      "achievements": [
        "Achievement 1 with quantifiable impact",
        "Achievement 2 demonstrating relevant skills",
        "Achievement 3 showing leadership or growth"
      ]
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Brief description of the project",
      "technologies": ["tech1", "tech2"],
      "highlights": ["Key outcome or impact"]
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

Important:
- Extract real information from the original resume text where available
- Optimize bullet points to be action-oriented with metrics
- Align skills and experience with the target role
- Include any learning completed and portfolio projects
- Make it ATS-friendly with relevant keywords`;

    console.log('Calling AI to generate upgraded resume for:', resume_id);

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'system', content: 'You are an expert resume writer. Return only valid JSON without markdown formatting.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '{}';

    // Clean up response
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    let generatedResume;
    try {
      generatedResume = JSON.parse(content.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse generated resume');
    }

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

    console.log('Successfully generated and saved upgraded resume:', savedResume.id);

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
    console.error('Resume upgrade error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
