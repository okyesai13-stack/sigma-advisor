import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callLovableAI(prompt: string, maxRetries = 3): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      if (response.status === 402) {
        throw new Error("Payment required - please add credits to your Lovable workspace");
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 2000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error("Failed after max retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { message, interview_type, interview_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Running AI interview for user:", user.id);

    const { data: selectedCareer } = await supabaseClient
      .from("selected_career")
      .select("career_title")
      .eq("user_id", user.id)
      .single();

    const careerTitle = selectedCareer?.career_title || "Full-Stack Developer";

    if (!message) {
      const prompt = `You are an experienced technical interviewer conducting a ${interview_type || "technical"} interview for a ${careerTitle} position.
      
Ask one focused interview question. Keep it realistic and appropriate for entry to mid-level candidates.
Be professional but friendly.

Start the interview with your first question.`;

      const question = await callLovableAI(prompt) || "Tell me about yourself and your experience.";

      return new Response(JSON.stringify({ 
        question,
        type: "question"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an experienced technical interviewer for a ${careerTitle} position.
    
The candidate has answered a question. Evaluate their response and either:
1. Ask a follow-up question (if more probing is needed)
2. Move to the next interview question
3. If this feels like a natural ending point (after 3-5 exchanges), provide final feedback

If providing final feedback, structure it as JSON:
{
  "type": "feedback",
  "overall_score": <number 0-100>,
  "categories": [
    {"name": "Communication", "score": <0-100>, "comment": "<brief feedback>"},
    {"name": "Technical Knowledge", "score": <0-100>, "comment": "<brief feedback>"},
    {"name": "Problem Solving", "score": <0-100>, "comment": "<brief feedback>"},
    {"name": "Enthusiasm", "score": <0-100>, "comment": "<brief feedback>"}
  ],
  "summary": "<2-3 sentence overall feedback>"
}

Otherwise, just respond naturally as an interviewer.

Candidate's response: "${message}"`;

    const content = await callLovableAI(prompt);

    if (content.includes('"type": "feedback"') || content.includes('"overall_score"')) {
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const feedback = JSON.parse(jsonMatch[0]);
          
          const { data: interview, error: interviewError } = await supabaseClient
            .from("ai_interviews")
            .insert({
              user_id: user.id,
              interview_type: interview_type || "technical",
              feedback: feedback.summary,
              score: feedback.overall_score,
            })
            .select()
            .single();

          if (interviewError) {
            console.error("Error saving interview:", interviewError);
          }

          await supabaseClient
            .from("user_journey_state")
            .update({ interview_completed: true, updated_at: new Date().toISOString() })
            .eq("user_id", user.id);

          return new Response(JSON.stringify({ 
            type: "feedback",
            feedback,
            interview
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (e) {
        console.error("Failed to parse feedback JSON:", e);
      }
    }

    return new Response(JSON.stringify({ 
      type: "question",
      question: content
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in run-ai-interview:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
