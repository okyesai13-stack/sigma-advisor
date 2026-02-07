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

    // Get resume and career data
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
    const missingSkills = (skillData?.missing_skills as any[]) || [];
    const currentSkills = (resumeData?.parsed_data?.skills || []).slice(0, 10);

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `Generate 3 portfolio project ideas for someone targeting: ${targetRole}
Domain: ${domain}
Skills to demonstrate: ${missingSkills.slice(0, 5).join(', ') || 'General skills'}
Current skills: ${currentSkills.join(', ')}

Generate exactly 3 projects - one for each complexity level:
1. BEGINNER level - Simple project for newcomers
2. INTERMEDIATE level - Moderate complexity with real-world application
3. EXPERT level - Advanced project showcasing mastery

Return JSON array:
[
  {
    "title": "Project Name",
    "description": "What the project does and its impact",
    "problem": "What problem it solves",
    "domain": "${domain}",
    "skills_demonstrated": ["skill1", "skill2", "skill3"],
    "complexity": "beginner",
    "estimated_time": "1-2 weeks"
  },
  {
    "title": "Project Name",
    "description": "What the project does and its impact",
    "problem": "What problem it solves",
    "domain": "${domain}",
    "skills_demonstrated": ["skill1", "skill2", "skill3"],
    "complexity": "intermediate",
    "estimated_time": "3-4 weeks"
  },
  {
    "title": "Project Name",
    "description": "What the project does and its impact",
    "problem": "What problem it solves",
    "domain": "${domain}",
    "skills_demonstrated": ["skill1", "skill2", "skill3"],
    "complexity": "expert",
    "estimated_time": "6-8 weeks"
  }
]`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'system', content: 'You are a project advisor. Return only valid JSON array with exactly 3 projects at different complexity levels.' },
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
      throw new Error('AI project generation failed');
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '[]';
    
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    const projects = JSON.parse(content.trim());
    const savedProjects = [];

    for (const project of projects) {
      const { data: inserted, error } = await supabase
        .from('project_ideas_result')
        .insert({
          resume_id: resume_id,
          title: project.title,
          description: project.description,
          problem: project.problem,
          domain: project.domain || domain,
          complexity: project.complexity || 'intermediate',
          skills_demonstrated: project.skills_demonstrated || [],
          estimated_time: project.estimated_time || '2-4 weeks',
          budget: 15000,
        })
        .select()
        .single();

      if (inserted) {
        savedProjects.push(inserted);
      }
    }

    // Update journey state
    await supabase.rpc('update_journey_state_flag', {
      p_resume_id: resume_id,
      p_flag_name: 'project_ideas_completed',
      p_flag_value: true
    });

    console.log('Project ideas generated:', savedProjects.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: savedProjects
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in project-generation:', error);
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
