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
    const { action, resume_id, job_id, session_id, answer, interview_type } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Action: Start new interview session
    if (action === 'start') {
      if (!resume_id || !job_id) {
        throw new Error('resume_id and job_id are required');
      }

      // Get job and resume data
      const [jobResult, resumeResult, skillResult] = await Promise.all([
        supabase.from('job_matching_result').select('*').eq('id', job_id).single(),
        supabase.from('resume_store').select('*').eq('resume_id', resume_id).single(),
        supabase.from('skill_validation_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      const job = jobResult.data;
      const resume = resumeResult.data;
      const skills = skillResult.data;

      if (!job) throw new Error('Job not found');

      const userSkills = resume?.parsed_data?.skills || [];
      const requiredSkills = job.required_skills || [];
      const type = interview_type || 'mixed';

      // Generate interview questions
      const prompt = `Generate 5 interview questions for a ${job.job_title} position at ${job.company_name}.

Interview Type: ${type} (technical, behavioral, or mixed)
Required Skills: ${requiredSkills.join(', ')}
Candidate Skills: ${userSkills.slice(0, 10).join(', ')}
Job Description: ${job.job_description}

Return JSON array with exactly 5 questions:
[
  {
    "question": "The interview question",
    "type": "technical" or "behavioral",
    "difficulty": "easy", "medium", or "hard",
    "key_points": ["Point 1", "Point 2", "Point 3"],
    "ideal_answer_structure": "Brief description of what a good answer includes",
    "time_limit_seconds": 120
  }
]

For technical: Focus on coding concepts, system design, problem-solving related to ${requiredSkills.slice(0, 3).join(', ')}.
For behavioral: Use STAR method questions about teamwork, challenges, achievements.
Mix difficulties: 1 easy, 3 medium, 1 hard.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert interviewer. Generate realistic, challenging interview questions. Return only valid JSON array.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('Failed to generate questions');
      }

      const aiResponse = await response.json();
      let content = aiResponse.choices?.[0]?.message?.content || '[]';
      
      if (content.includes('```')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const questions = JSON.parse(content.trim());

      // Create session
      const { data: session, error } = await supabase
        .from('mock_interview_session')
        .insert({
          resume_id,
          job_id,
          job_title: job.job_title,
          company_name: job.company_name,
          interview_type: type,
          total_questions: questions.length,
          questions,
          status: 'in_progress',
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Mock interview started:', session.id);

      return new Response(
        JSON.stringify({
          success: true,
          session_id: session.id,
          current_question: questions[0],
          question_number: 1,
          total_questions: questions.length,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Action: Submit answer and get feedback
    if (action === 'answer') {
      if (!session_id || !answer) {
        throw new Error('session_id and answer are required');
      }

      // Get session
      const { data: session, error: sessionError } = await supabase
        .from('mock_interview_session')
        .select('*')
        .eq('id', session_id)
        .single();

      if (sessionError || !session) throw new Error('Session not found');

      const questions = session.questions as any[];
      const currentIndex = session.current_question_index;
      const currentQuestion = questions[currentIndex];

      // Get resume for context
      const { data: resume } = await supabase
        .from('resume_store')
        .select('parsed_data')
        .eq('resume_id', session.resume_id)
        .single();

      const userSkills = resume?.parsed_data?.skills || [];

      // Evaluate answer
      const evalPrompt = `Evaluate this interview answer:

QUESTION: ${currentQuestion.question}
QUESTION TYPE: ${currentQuestion.type}
DIFFICULTY: ${currentQuestion.difficulty}
KEY POINTS TO COVER: ${currentQuestion.key_points.join(', ')}
IDEAL ANSWER STRUCTURE: ${currentQuestion.ideal_answer_structure}

CANDIDATE'S ANSWER:
"${answer}"

CANDIDATE'S SKILLS: ${userSkills.slice(0, 10).join(', ')}

Return JSON evaluation:
{
  "score": 0-100,
  "feedback": "Detailed constructive feedback (2-3 sentences)",
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "sample_better_answer": "A brief example of how the answer could be improved",
  "confidence_level": "low", "medium", or "high" based on answer clarity
}

Be encouraging but honest. Focus on actionable improvements.`;

      const evalResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert interview coach providing constructive feedback. Return only valid JSON.' },
            { role: 'user', content: evalPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!evalResponse.ok) {
        throw new Error('Failed to evaluate answer');
      }

      const evalAiResponse = await evalResponse.json();
      let evalContent = evalAiResponse.choices?.[0]?.message?.content || '{}';
      
      if (evalContent.includes('```')) {
        evalContent = evalContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const evaluation = JSON.parse(evalContent.trim());

      // Store answer with evaluation
      const answers = [...(session.answers as any[]), {
        question_index: currentIndex,
        answer,
        evaluation,
        submitted_at: new Date().toISOString(),
      }];

      const nextIndex = currentIndex + 1;
      const isComplete = nextIndex >= questions.length;

      // Update session
      const updateData: any = {
        answers,
        current_question_index: nextIndex,
      };

      if (isComplete) {
        // Calculate overall score and generate final feedback
        const allEvaluations = answers.map((a: any) => a.evaluation);
        const avgScore = Math.round(allEvaluations.reduce((sum: number, e: any) => sum + (e.score || 0), 0) / allEvaluations.length);
        
        const allStrengths = [...new Set(allEvaluations.flatMap((e: any) => e.strengths || []))].slice(0, 5);
        const allImprovements = [...new Set(allEvaluations.flatMap((e: any) => e.improvements || []))].slice(0, 5);

        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
        updateData.overall_score = avgScore;
        updateData.strengths = allStrengths;
        updateData.improvements = allImprovements;
        updateData.overall_feedback = `You completed the mock interview with a score of ${avgScore}%. ${avgScore >= 70 ? 'Great job! You demonstrated solid interview skills.' : 'Keep practicing to improve your responses.'}`;
      }

      await supabase
        .from('mock_interview_session')
        .update(updateData)
        .eq('id', session_id);

      const responseData: any = {
        success: true,
        evaluation,
        is_complete: isComplete,
      };

      if (!isComplete) {
        responseData.next_question = questions[nextIndex];
        responseData.question_number = nextIndex + 1;
        responseData.total_questions = questions.length;
      } else {
        responseData.overall_score = updateData.overall_score;
        responseData.overall_feedback = updateData.overall_feedback;
        responseData.strengths = updateData.strengths;
        responseData.improvements = updateData.improvements;
      }

      return new Response(
        JSON.stringify(responseData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Action: Get session status
    if (action === 'status') {
      if (!session_id) {
        throw new Error('session_id is required');
      }

      const { data: session, error } = await supabase
        .from('mock_interview_session')
        .select('*')
        .eq('id', session_id)
        .single();

      if (error || !session) throw new Error('Session not found');

      return new Response(
        JSON.stringify({ success: true, session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in mock-interview:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
