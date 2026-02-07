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
    const { resume_id, target_role } = await req.json();

    if (!resume_id) {
      throw new Error('No resume_id provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch resume data
    const { data: resumeData, error: fetchError } = await supabase
      .from('resume_store')
      .select('*')
      .eq('resume_id', resume_id)
      .single();

    if (fetchError || !resumeData) {
      throw new Error('Resume not found');
    }

    // Get the target role - either passed in or from career analysis
    let roleToValidate = target_role;
    
    if (!roleToValidate) {
      // Fetch from career analysis - use short term role
      const { data: careerData } = await supabase
        .from('career_analysis_result')
        .select('career_roles')
        .eq('resume_id', resume_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (careerData?.career_roles) {
        const roles = careerData.career_roles as any[];
        const shortTermRole = roles.find((r: any) => r.progression_stage === 'short_term');
        roleToValidate = shortTermRole?.role || roles[0]?.role;
      }
    }

    if (!roleToValidate) {
      throw new Error('No target role found for validation');
    }

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const parsedData = resumeData.parsed_data || {};
    const userSkills = parsedData.skills || [];

    const systemPrompt = `You are a skill assessment expert. Analyze how well a candidate's skills match a target role.
Return ONLY valid JSON with this structure:
{
  "matched_skills": {
    "strong": ["skills with solid match"],
    "partial": ["skills with partial match"]
  },
  "missing_skills": ["critical skills the candidate lacks"],
  "readiness_score": <number 0-100>,
  "recommended_next_step": "learn" | "project" | "apply",
  "assessment_summary": "Brief assessment text"
}`;

    const userPrompt = `Assess this candidate's readiness for: ${roleToValidate}

Current Skills: ${userSkills.join(', ') || 'None specified'}

Education: ${JSON.stringify(parsedData.education || [])}
Experience: ${JSON.stringify(parsedData.experience || [])}

Provide a realistic readiness score and identify skill gaps.`;

    console.log('Validating skills for role:', roleToValidate);

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.0-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI service rate limited' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        );
      }
      throw new Error('AI validation failed');
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '{}';
    
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const validation = JSON.parse(content.trim());

    // Store results
    const { error: insertError } = await supabase
      .from('skill_validation_result')
      .insert({
        resume_id: resume_id,
        target_role: roleToValidate,
        matched_skills: validation.matched_skills || { strong: [], partial: [] },
        missing_skills: validation.missing_skills || [],
        readiness_score: validation.readiness_score || 0,
        recommended_next_step: validation.recommended_next_step || 'learn',
      });

    if (insertError) {
      console.error('Error storing skill validation:', insertError);
    }

    // Update journey state
    await supabase.rpc('update_journey_state_flag', {
      p_resume_id: resume_id,
      p_flag_name: 'skill_validation_completed',
      p_flag_value: true
    });

    console.log('Skill validation completed for:', resume_id);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          target_role: roleToValidate,
          ...validation
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in skill-validation:', error);
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
