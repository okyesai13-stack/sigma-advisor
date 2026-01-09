import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { job, resumeData } = await req.json();
    console.log("Generating interview prep for job:", job?.title);

    if (!job || !job.id) {
      throw new Error("No job data provided");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are an expert interview coach. Generate comprehensive interview preparation materials.

Job Details:
- Title: ${job.title || 'Software Developer'}
- Company: ${job.company || 'Tech Company'}
- Description: ${job.description || 'Not provided'}
- Required Skills: ${JSON.stringify(job.skills || [])}

Candidate Resume Data:
${JSON.stringify(resumeData || {}, null, 2)}

Generate interview preparation including:
1. Job analysis
2. Interview questions with sample answers
3. Resume alignment suggestions
4. Preparation checklist

Return JSON:
{
  "job_analysis": {
    "key_requirements": ["Requirement 1", "Requirement 2"],
    "company_culture_hints": ["Hint 1", "Hint 2"],
    "interview_format_prediction": "Technical + Behavioral",
    "difficulty_level": "medium"
  },
  "interview_questions": {
    "technical": [
      { "question": "Question text", "sample_answer": "Sample answer", "tips": "Tips for answering" }
    ],
    "behavioral": [
      { "question": "Tell me about a time...", "sample_answer": "STAR format answer", "tips": "Use STAR method" }
    ],
    "company_specific": [
      { "question": "Why this company?", "sample_answer": "Research-based answer", "tips": "Show genuine interest" }
    ]
  },
  "resume_alignment": {
    "strengths": ["Strength 1", "Strength 2"],
    "gaps": ["Gap 1", "Gap 2"],
    "talking_points": ["Point 1", "Point 2"]
  },
  "preparation_checklist": [
    { "task": "Research company", "priority": "high", "completed": false },
    { "task": "Practice coding problems", "priority": "high", "completed": false },
    { "task": "Prepare questions for interviewer", "priority": "medium", "completed": false }
  ],
  "readiness_score": 70
}

Include 3-4 questions in each category.
Return ONLY valid JSON.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let prepData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prepData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      prepData = {
        job_analysis: {
          key_requirements: ["Technical skills", "Communication", "Problem-solving"],
          company_culture_hints: ["Innovation-focused", "Collaborative environment"],
          interview_format_prediction: "Technical + Behavioral rounds",
          difficulty_level: "medium"
        },
        interview_questions: {
          technical: [
            { question: "Explain your approach to solving complex problems", sample_answer: "I break down problems into smaller parts...", tips: "Use specific examples" },
            { question: "Describe a challenging project you worked on", sample_answer: "In my previous role, I led a project that...", tips: "Focus on your contributions" }
          ],
          behavioral: [
            { question: "Tell me about a time you faced a conflict at work", sample_answer: "I once had a disagreement with a colleague...", tips: "Use STAR method" },
            { question: "How do you handle tight deadlines?", sample_answer: "I prioritize tasks and communicate...", tips: "Show time management" }
          ],
          company_specific: [
            { question: "Why do you want to work here?", sample_answer: "I admire your company's commitment to...", tips: "Research the company" }
          ]
        },
        resume_alignment: {
          strengths: ["Relevant experience", "Technical skills"],
          gaps: ["Specific technology experience"],
          talking_points: ["Highlight project achievements", "Emphasize learning ability"]
        },
        preparation_checklist: [
          { task: "Research company background", priority: "high", completed: false },
          { task: "Review job description", priority: "high", completed: false },
          { task: "Practice technical questions", priority: "high", completed: false },
          { task: "Prepare questions to ask", priority: "medium", completed: false }
        ],
        readiness_score: 65
      };
    }

    // Save to interview_preparation table
    const { data: savedPrep, error: saveError } = await supabaseClient
      .from('interview_preparation')
      .upsert({
        user_id: user.id,
        job_id: job.id,
        role: job.title,
        company: job.company,
        job_analysis: prepData.job_analysis,
        interview_questions: prepData.interview_questions,
        resume_alignment: prepData.resume_alignment,
        preparation_checklist: prepData.preparation_checklist,
        readiness_score: prepData.readiness_score || 65
      }, { onConflict: 'user_id,job_id' })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving interview prep:", saveError);
    }

    console.log("Successfully generated interview preparation");

    return new Response(JSON.stringify({ 
      success: true,
      preparation: savedPrep || prepData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-interview-prep-generator:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
