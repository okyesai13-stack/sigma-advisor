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

    const missingSkills = (skillData?.missing_skills as any[]) || [];
    const targetRole = skillData?.target_role || 'Professional';
    
    if (missingSkills.length === 0) {
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

    // Generate learning recommendations for top 3 missing skills in PARALLEL
    const skillsToLearn = missingSkills.slice(0, 3);
    
    const generatePlanForSkill = async (skill: any) => {
      const skillName = typeof skill === 'string' ? skill : skill.name || skill;

      const prompt = `Create learning resource recommendations for: ${skillName}
Target Role: ${targetRole}

Return JSON with ONLY courses and videos (no learning steps):
{
  "skill_name": "${skillName}",
  "recommended_courses": [
    {"name": "Course name", "platform": "Coursera/Udemy/YouTube/etc", "url": "https://actual-course-url", "duration": "X hours", "level": "beginner/intermediate/advanced"}
  ],
  "recommended_videos": [
    {"title": "Video title", "channel": "Channel name", "url": "https://youtube.com/watch?v=...", "duration": "X minutes"}
  ]
}

Include 2-3 real courses and 2-3 real YouTube videos with actual working URLs.`;

      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-flash-preview',
            messages: [
              { role: 'system', content: 'You are a learning advisor. Return only valid JSON with real course and video URLs. Be concise.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.5,
          }),
        });

        if (!response.ok) {
          console.error('AI request failed for skill:', skillName, response.status);
          if (response.status === 429 || response.status === 402) {
            console.error('Rate limited for skill:', skillName);
          }
          return null;
        }

        const aiResponse = await response.json();
        let content = aiResponse.choices?.[0]?.message?.content || '{}';
        
        if (content.includes('```')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }

        const plan = JSON.parse(content.trim());
        
        // Store in database
        const { data: inserted } = await supabase
          .from('learning_plan_result')
          .insert({
            resume_id: resume_id,
            skill_name: skillName,
            career_title: targetRole,
            learning_steps: [],
            recommended_courses: plan.recommended_courses || [],
            recommended_videos: plan.recommended_videos || [],
            status: 'not_started',
          })
          .select()
          .single();

        return inserted;
      } catch (error) {
        console.error('Failed to generate learning plan for:', skillName, error);
        return null;
      }
    };

    // Run all AI calls in parallel
    const results = await Promise.all(skillsToLearn.map(generatePlanForSkill));
    const learningPlans = results.filter(Boolean);

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
