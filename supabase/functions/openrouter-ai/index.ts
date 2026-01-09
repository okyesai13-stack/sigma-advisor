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

    const { prompt, degree, department, interests } = await req.json();
    console.log("Generating project ideas for user:", user.id);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const aiPrompt = `You are an expert project advisor for career development.

Context:
- Role/Degree: ${degree || 'Software Developer'}
- Domain/Department: ${department || 'Technology'}
- Skills/Interests: ${interests || 'Programming'}

Generate exactly 5 unique, practical project ideas that would help build a strong portfolio for this career path.

For each project, provide:
{
  "ideas": [
    {
      "title": "Project Name",
      "description": "2-3 sentence description of what the project does",
      "problem": "The real-world problem this project solves",
      "tech_stack": ["Technology 1", "Technology 2"],
      "difficulty": "beginner|intermediate|advanced",
      "estimated_duration": "2 weeks|1 month|2 months"
    }
  ]
}

Make projects:
1. Relevant to the career path
2. Practical and achievable
3. Portfolio-worthy
4. Varied in complexity

Return ONLY valid JSON, no markdown.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
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
    console.log("AI project ideas response received");

    let projectData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        projectData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      projectData = {
        ideas: [
          { title: "Portfolio Website", description: "A personal portfolio to showcase your work and skills.", problem: "Need a professional online presence", tech_stack: ["React", "Tailwind CSS"], difficulty: "beginner", estimated_duration: "2 weeks" },
          { title: "Task Management App", description: "A full-stack application to manage tasks and projects.", problem: "Organizing daily tasks efficiently", tech_stack: ["React", "Node.js", "PostgreSQL"], difficulty: "intermediate", estimated_duration: "1 month" },
          { title: "E-commerce Platform", description: "A complete online store with cart and payment integration.", problem: "Small businesses need online presence", tech_stack: ["React", "Stripe", "Supabase"], difficulty: "advanced", estimated_duration: "2 months" },
          { title: "Weather Dashboard", description: "Real-time weather tracking with beautiful visualizations.", problem: "Quick access to weather forecasts", tech_stack: ["React", "Chart.js", "Weather API"], difficulty: "beginner", estimated_duration: "1 week" },
          { title: "Blog Platform", description: "A content management system with markdown support.", problem: "Easy content publishing", tech_stack: ["Next.js", "MDX", "Tailwind"], difficulty: "intermediate", estimated_duration: "3 weeks" }
        ]
      };
    }

    console.log("Successfully generated project ideas");

    return new Response(JSON.stringify(projectData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in openrouter-ai:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
