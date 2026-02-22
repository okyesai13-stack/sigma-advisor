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
    if (!resume_id) throw new Error('No resume_id provided');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch resume + career analysis in parallel
    const [resumeRes, careerRes] = await Promise.all([
      supabase.from('resume_store').select('*').eq('resume_id', resume_id).single(),
      supabase.from('career_analysis_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (resumeRes.error || !resumeRes.data) throw new Error('Resume not found');

    const parsedData = resumeRes.data.parsed_data || {};
    const skills = parsedData.skills?.join(', ') || 'Not specified';
    const education = parsedData.education?.map((e: any) => `${e.degree} in ${e.field || 'N/A'} from ${e.institution}`).join('; ') || 'Not specified';
    const experience = parsedData.experience?.map((e: any) => `${e.role} at ${e.company} (${e.start_year || ''} - ${e.end_year || 'Present'})`).join('; ') || 'Not specified';
    const projects = parsedData.projects?.map((p: any) => p.name).join(', ') || 'Not specified';
    const userGoal = resumeRes.data.goal || 'Not specified';

    const careerRoles = careerRes.data?.career_roles || [];
    const shortTermRole = Array.isArray(careerRoles) ? careerRoles.find((r: any) => r.progression_stage === 'short_term') : null;
    const targetRole = shortTermRole?.role || userGoal;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are an expert career readiness scorer. You analyze a candidate's profile against their short-term career goal and produce a structured readiness assessment with a score, breakdown, recommendations, and a 90-day action plan.`;

    const userPrompt = `Analyze this candidate's readiness to achieve their short-term career goal.

TARGET ROLE: ${targetRole}
CAREER GOAL: ${userGoal}
SKILLS: ${skills}
EDUCATION: ${education}
EXPERIENCE: ${experience}
PROJECTS: ${projects}

Return ONLY valid JSON (no markdown) in this exact format:
{
  "goal_score": 62,
  "score_breakdown": {
    "skills_match": { "score": 70, "label": "Skills Match" },
    "experience_level": { "score": 45, "label": "Experience Level" },
    "education_fit": { "score": 80, "label": "Education Fit" },
    "portfolio_strength": { "score": 40, "label": "Portfolio Strength" },
    "market_readiness": { "score": 55, "label": "Market Readiness" }
  },
  "recommendations": [
    {
      "title": "Action title",
      "description": "Detailed actionable description",
      "impact": "high",
      "estimated_time": "2 weeks",
      "category": "portfolio"
    }
  ],
  "ninety_day_plan": {
    "phase_1": {
      "name": "Foundation",
      "weeks": {
        "week_1": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_2": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_3": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_4": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] }
      }
    },
    "phase_2": {
      "name": "Acceleration",
      "weeks": {
        "week_5": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_6": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_7": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_8": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] }
      }
    },
    "phase_3": {
      "name": "Achievement",
      "weeks": {
        "week_9": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_10": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_11": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] },
        "week_12": { "focus": "Focus area", "tasks": ["Task 1", "Task 2"] }
      }
    }
  },
  "target_role": "${targetRole}"
}

Generate 5-7 recommendations with mix of high/medium/low impact. Make the 90-day plan specific and actionable for the candidate's actual skills and gaps.`;

    console.log('Generating career goal score for resume:', resume_id);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 5000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ success: false, error: 'AI credits exhausted. Please try again later.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const responseText = aiResponse.choices?.[0]?.message?.content || '{}';

    let cleanJson = responseText.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/```\n?/g, '');

    const data = JSON.parse(cleanJson);

    // Store results
    const { error: insertError } = await supabase.from('career_goal_score_result').insert({
      resume_id,
      goal_score: data.goal_score || 0,
      score_breakdown: data.score_breakdown || {},
      recommendations: data.recommendations || [],
      ninety_day_plan: data.ninety_day_plan || {},
      target_role: data.target_role || targetRole,
    });

    if (insertError) console.error('Error storing goal score:', insertError);

    // Update journey state
    await supabase.rpc('update_journey_state_flag', {
      p_resume_id: resume_id,
      p_flag_name: 'goal_score_completed',
      p_flag_value: true,
    });

    console.log('Career goal score completed for:', resume_id);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in career-goal-score:', error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
