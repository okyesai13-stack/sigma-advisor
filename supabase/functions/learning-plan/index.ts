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

    // Get skill validation results to find missing skills
    const { data: skillData } = await supabase
      .from('skill_validation_result')
      .select('*')
      .eq('resume_id', resume_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get career analysis for context
    const { data: careerData } = await supabase
      .from('career_analysis_result')
      .select('career_roles')
      .eq('resume_id', resume_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const missingSkills = (skillData?.missing_skills as any[]) || [];
    const targetRole = skillData?.target_role || 'Professional';
    
    if (missingSkills.length === 0) {
      // No missing skills, mark as complete
      await supabase.rpc('update_journey_state_flag', {
        p_resume_id: resume_id,
        p_flag_name: 'learning_plan_completed',
        p_flag_value: true
      });

      return new Response(
        JSON.stringify({ success: true, data: [], message: 'No skill gaps to address' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Generate learning plans for top 3 missing skills
    const skillsToLearn = missingSkills.slice(0, 3);
    const learningPlans = [];

    for (const skill of skillsToLearn) {
      const skillName = typeof skill === 'string' ? skill : skill.name || skill;

      const prompt = `Create a learning plan for: ${skillName}
Target Role: ${targetRole}

Return JSON:
{
  "skill_name": "${skillName}",
  "learning_steps": [
    {"step": 1, "title": "Step title", "description": "What to do", "duration": "1-2 weeks"}
  ],
  "recommended_courses": [
    {"name": "Course name", "platform": "Coursera/Udemy/etc", "url": "https://...", "duration": "X hours"}
  ],
  "recommended_videos": [
    {"title": "Video title", "channel": "Channel name", "url": "https://youtube.com/..."}
  ]
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are a learning advisor. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
        }),
      });

      if (response.ok) {
        const aiResponse = await response.json();
        let content = aiResponse.choices?.[0]?.message?.content || '{}';
        
        if (content.includes('```')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        try {
          const plan = JSON.parse(content.trim());
          
          // Store in database
          const { data: inserted } = await supabase
            .from('learning_plan_result')
            .insert({
              resume_id: resume_id,
              skill_name: skillName,
              career_title: targetRole,
              learning_steps: plan.learning_steps || [],
              recommended_courses: plan.recommended_courses || [],
              recommended_videos: plan.recommended_videos || [],
              status: 'not_started',
            })
            .select()
            .single();

          if (inserted) {
            learningPlans.push(inserted);
          }
        } catch (parseError) {
          console.error('Failed to parse learning plan for:', skillName);
        }
      }
    }

    // Update journey state
    await supabase.rpc('update_journey_state_flag', {
      p_resume_id: resume_id,
      p_flag_name: 'learning_plan_completed',
      p_flag_value: true
    });

    console.log('Learning plans created:', learningPlans.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: learningPlans
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in learning-plan:', error);
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
