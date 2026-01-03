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

    const { userProjectId, projectTitle, projectDescription, skills } = await req.json();

    if (!userProjectId || !projectTitle) {
      throw new Error("Missing required fields: userProjectId and projectTitle");
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

    console.log("Analyzing project for user:", user.id, "Project:", projectTitle);

    // Check if steps already exist
    const { data: existingSteps } = await supabaseClient
      .from("user_project_steps")
      .select("*")
      .eq("user_project_id", userProjectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingSteps) {
      console.log("Steps already exist for this project");
      return new Response(JSON.stringify({ 
        message: "Steps already generated",
        steps: existingSteps 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let planSteps: string[] = [];
    let buildSteps: string[] = [];
    let aiTools: { name: string; description: string; url?: string }[] = [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      const prompt = `You are a project planning expert. Analyze this project and provide structured guidance.

Project Title: ${projectTitle}
Description: ${projectDescription || "No description provided"}
Skills to Apply: ${skills?.join(", ") || "General skills"}

Return a JSON object with exactly this structure:
{
  "plan_steps": [
    "Step 1: Define project scope and requirements",
    "Step 2: Create wireframes and mockups",
    "Step 3: Set up project architecture"
  ],
  "build_steps": [
    "Step 1: Set up development environment",
    "Step 2: Implement core functionality",
    "Step 3: Add styling and UI components",
    "Step 4: Test and debug",
    "Step 5: Deploy and document"
  ],
  "ai_tools": [
    {
      "name": "Tool Name",
      "description": "How this AI tool can help with the project",
      "url": "https://example.com"
    }
  ]
}

Requirements:
- plan_steps: 3-5 planning steps specific to this project
- build_steps: 4-6 implementation steps with clear actions
- ai_tools: 2-4 relevant AI tools that can assist (e.g., GitHub Copilot, ChatGPT, Midjourney, etc.)

Return ONLY the JSON object, no additional text.`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a project planning expert. Always respond with valid JSON only." },
              { role: "user", content: prompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          console.log("AI response received");

          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            planSteps = parsed.plan_steps || [];
            buildSteps = parsed.build_steps || [];
            aiTools = parsed.ai_tools || [];
          }
        } else {
          const errorText = await aiResponse.text();
          console.error("AI API error:", aiResponse.status, errorText);
        }
      } catch (e) {
        console.error("AI generation failed:", e);
      }
    }

    // Fallback if AI fails
    if (planSteps.length === 0) {
      planSteps = [
        "Define project requirements and user stories",
        "Create wireframes and design mockups",
        "Plan the technical architecture and data flow",
        "Set up project repository and documentation"
      ];
    }

    if (buildSteps.length === 0) {
      buildSteps = [
        "Set up development environment and dependencies",
        "Implement core features and functionality",
        "Build UI components with responsive design",
        "Add data persistence and state management",
        "Test, debug, and optimize performance",
        "Deploy and create documentation"
      ];
    }

    if (aiTools.length === 0) {
      aiTools = [
        { name: "GitHub Copilot", description: "AI-powered code completion and suggestions", url: "https://github.com/features/copilot" },
        { name: "ChatGPT", description: "Help with debugging, code review, and documentation", url: "https://chat.openai.com" },
        { name: "Lovable", description: "Build complete web applications with AI assistance", url: "https://lovable.dev" }
      ];
    }

    // Save to database
    const { data: savedSteps, error: saveError } = await supabaseClient
      .from("user_project_steps")
      .insert({
        user_id: user.id,
        user_project_id: userProjectId,
        plan_steps: planSteps,
        build_steps: buildSteps,
        ai_tools: aiTools,
        plan_completed: new Array(planSteps.length).fill(false),
        build_completed: new Array(buildSteps.length).fill(false),
      })
      .select()
      .single();

    if (saveError) {
      console.error("Error saving steps:", saveError);
      throw new Error("Failed to save project steps");
    }

    console.log("Successfully saved project steps");

    return new Response(JSON.stringify({ steps: savedSteps }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-project:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
