import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resume_id, message } = await req.json();

    if (!resume_id) {
      throw new Error('No resume_id provided');
    }

    if (!message) {
      throw new Error('No message provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save user message to chat history
    await supabase.from('chat_history').insert({
      resume_id,
      role: 'user',
      content: message
    });

    // Fetch conversation history from database
    const { data: historyData } = await supabase
      .from('chat_history')
      .select('role, content')
      .eq('resume_id', resume_id)
      .order('created_at', { ascending: true })
      .limit(20);

    const conversationHistory = historyData || [];

    // Fetch all context data in parallel
    const [
      resumeResult,
      careerResult,
      skillResult,
      learningResult,
      projectResult,
      jobResult
    ] = await Promise.all([
      supabase.from('resume_store').select('*').eq('resume_id', resume_id).single(),
      supabase.from('career_analysis_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('skill_validation_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('learning_plan_result').select('*').eq('resume_id', resume_id),
      supabase.from('project_ideas_result').select('*').eq('resume_id', resume_id),
      supabase.from('job_matching_result').select('*').eq('resume_id', resume_id)
    ]);

    const resume = resumeResult.data;
    const career = careerResult.data;
    const skills = skillResult.data;
    const learningPlans = learningResult.data || [];
    const projects = projectResult.data || [];
    const jobs = jobResult.data || [];

    if (!resume) {
      throw new Error('Resume not found');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Extract user info
    const parsedData = resume.parsed_data || {};
    const userName = parsedData.name?.split(' ')[0] || 'there';
    const userGoal = resume.goal || 'career growth';
    const userType = resume.user_type || 'professional';

    // Build context from career analysis
    const careerRoles = (career?.career_roles as any[]) || [];
    const shortTermRole = careerRoles.find(r => r.progression_stage === 'short_term');
    const targetRole = shortTermRole?.role || 'your target role';

    // Build skill context
    const matchedSkills = (skills?.matched_skills as any)?.strong || [];
    const missingSkills = (skills?.missing_skills as any[]) || [];
    const readinessScore = skills?.readiness_score || 0;

    // Build learning context
    const learningSkills = learningPlans.map(l => l.skill_name).join(', ') || 'Not started';

    // Build project context
    const projectTitles = projects.map(p => p.title).slice(0, 3).join(', ') || 'None yet';

    // Build job context
    const topJobs = jobs.slice(0, 3).map(j => `${j.job_title} at ${j.company_name}`).join(', ') || 'None matched yet';

    const systemPrompt = `You are Sigma, a warm and knowledgeable AI career advisor. You're conversational - like talking to a brilliant friend who happens to be a career expert.

## About the User:
- Name: ${userName}
- Goal: ${userGoal}
- Type: ${userType}
- Target Role: ${targetRole}

## Their Background:
- Skills: ${parsedData.skills?.join(', ') || 'Not specified'}
- Education: ${parsedData.education?.map((e: any) => `${e.degree} from ${e.institution}`).join('; ') || 'Not specified'}
- Experience: ${parsedData.experience?.map((e: any) => `${e.role} at ${e.company}`).join('; ') || 'Fresh talent'}

## Career Analysis:
- Short-term goal: ${shortTermRole?.role || 'Being determined'}
- Readiness Score: ${readinessScore}%
- Strong Skills: ${matchedSkills.join(', ') || 'Being assessed'}
- Skills to Develop: ${missingSkills.slice(0, 5).join(', ') || 'None identified'}

## Progress:
- Learning: ${learningSkills}
- Projects: ${projectTitles}
- Job Matches: ${topJobs}

## Response Style:
Be natural, warm, and conversational. Write in plain paragraphs.

RULES:
1. Use simple bullet points (•) when listing things
2. Keep paragraphs short - 2-3 sentences max
3. End with a friendly follow-up question
4. Reference their actual data when relevant

NEVER USE:
- Markdown headers (# ## ###)
- Bold text with **asterisks**
- Horizontal lines or dividers
- Code blocks
- Excessive formatting

Be genuinely helpful and specific to their situation.`;

    // Build messages array from conversation history (exclude the just-added user message since it's in historyData)
    const historyMessages = conversationHistory.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content,
    }));

    console.log('Streaming advisor chat for resume:', resume_id);

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
          ...historyMessages,
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service credits depleted.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      throw new Error('AI Gateway error');
    }

    // Stream the response directly
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        controller.enqueue(chunk);
      }
    });

    // Create a passthrough for the stream and collect the full response
    const reader = response.body!.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    let fullResponse = '';
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value, { stream: true });
            controller.enqueue(value);
            
            // Parse SSE to collect full response
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const json = JSON.parse(line.slice(6));
                  const content = json.choices?.[0]?.delta?.content;
                  if (content) {
                    fullResponse += content;
                  }
                } catch (e) {
                  // Ignore parse errors for partial chunks
                }
              }
            }
          }
          
          // Save the complete response to chat history
          if (fullResponse) {
            // Clean markdown from response
            const cleanedResponse = fullResponse
              .replace(/#{1,6}\s*/g, '')
              .replace(/\*\*([^*]+)\*\*/g, '$1')
              .replace(/\*([^*]+)\*/g, '$1')
              .replace(/^[-*]\s+/gm, '• ')
              .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
              .replace(/`([^`]+)`/g, '$1')
              .replace(/```[\s\S]*?```/g, '')
              .replace(/^\s*>\s*/gm, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
              
            await supabase.from('chat_history').insert({
              resume_id,
              role: 'assistant',
              content: cleanedResponse
            });
          }
          
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in advisor-chat-stream:', error);
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
