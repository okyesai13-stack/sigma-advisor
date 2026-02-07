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
    const { action, session_id, transcript, question } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Action: Analyze voice delivery/communication style
    if (action === 'analyze_voice') {
      if (!session_id || !transcript || !question) {
        throw new Error('session_id, transcript, and question are required');
      }

      // Analyze the transcript for communication qualities
      const analysisPrompt = `Analyze this interview answer for communication skills and delivery:

QUESTION: ${question}

CANDIDATE'S SPOKEN ANSWER (transcribed):
"${transcript}"

Analyze the following aspects of their communication:

1. **Clarity**: How clear and understandable is their response?
2. **Structure**: Does the answer have a logical flow? (intro, main points, conclusion)
3. **Confidence**: Based on word choice and sentence structure, how confident do they seem?
4. **Specificity**: Do they give specific examples or stay too general?
5. **Filler Words**: Note any excessive use of "um", "uh", "like", "you know"
6. **Pacing Indicator**: Based on sentence length and complexity, estimate if they spoke too fast, too slow, or well-paced
7. **STAR Method**: For behavioral questions, did they use Situation, Task, Action, Result format?

Return JSON:
{
  "clarity_score": 1-10,
  "structure_score": 1-10,
  "confidence_score": 1-10,
  "specificity_score": 1-10,
  "filler_word_count": number,
  "pacing_assessment": "too_fast" | "too_slow" | "good",
  "used_star_method": boolean,
  "overall_communication_score": 1-100,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "quick_tip": "One actionable tip for improvement",
  "confidence_level": "low" | "medium" | "high"
}`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          messages: [
            { role: 'system', content: 'You are an expert communication coach analyzing interview responses. Return only valid JSON.' },
            { role: 'user', content: analysisPrompt }
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
        throw new Error('Failed to analyze voice response');
      }

      const aiResponse = await response.json();
      let content = aiResponse.choices?.[0]?.message?.content || '{}';
      
      if (content.includes('```')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const analysis = JSON.parse(content.trim());

      console.log('Voice analysis complete for session:', session_id);

      return new Response(
        JSON.stringify({
          success: true,
          analysis,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Action: Get real-time coaching feedback
    if (action === 'get_coaching') {
      if (!transcript || !question) {
        throw new Error('transcript and question are required');
      }

      const coachingPrompt = `As an interview coach, provide immediate feedback on this partial answer:

QUESTION: ${question}

ANSWER SO FAR:
"${transcript}"

Provide brief, encouraging real-time coaching (1-2 sentences max). Focus on:
- If they're on the right track
- A quick suggestion if they seem to be going off-topic
- Encouragement if they're doing well

Keep it very concise - this is for real-time guidance.

Return JSON:
{
  "on_track": boolean,
  "coaching_tip": "Brief tip or encouragement"
}`;

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GEMINI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gemini-2.0-flash',
          messages: [
            { role: 'system', content: 'You are a supportive interview coach giving real-time guidance. Be brief and encouraging. Return only valid JSON.' },
            { role: 'user', content: coachingPrompt }
          ],
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get coaching');
      }

      const aiResponse = await response.json();
      let content = aiResponse.choices?.[0]?.message?.content || '{}';
      
      if (content.includes('```')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const coaching = JSON.parse(content.trim());

      return new Response(
        JSON.stringify({
          success: true,
          coaching,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in voice-interview:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
