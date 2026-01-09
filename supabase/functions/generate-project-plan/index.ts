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

    const { project_id, title, problem, description } = await req.json();
    console.log("Generating project plan for:", title);

    if (!project_id) {
      throw new Error("No project_id provided");
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a project planning expert. Create a detailed project plan.

Project: ${title}
Problem: ${problem || 'Not specified'}
Description: ${description || 'Not specified'}

Generate a comprehensive project plan with:
1. A timeline with milestones
2. A list of tasks organized in a kanban format
3. Required resources (materials, software, equipment)

Return JSON in this format:
{
  "timeline": [
    { "week": 1, "milestone": "Setup & Planning", "tasks": ["Task 1", "Task 2"] },
    { "week": 2, "milestone": "Development Phase 1", "tasks": ["Task 3", "Task 4"] }
  ],
  "kanban_board": {
    "todo": ["Task description 1", "Task description 2"],
    "in_progress": [],
    "done": []
  },
  "tasks": [
    { "title": "Task 1", "description": "Description", "priority": "high|medium|low", "estimated_hours": 4 }
  ],
  "resources": [
    { "type": "software", "name": "VS Code", "description": "Code editor", "resource": "Free IDE", "unit_cost": 0 },
    { "type": "software", "name": "GitHub", "description": "Version control", "resource": "Repository hosting", "unit_cost": 0 }
  ]
}

Include 4-6 timeline entries, 8-12 tasks, and 4-6 resources.
Return ONLY valid JSON.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000,
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

    let planData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      planData = {
        timeline: [
          { week: 1, milestone: "Project Setup", tasks: ["Setup development environment", "Create project structure"] },
          { week: 2, milestone: "Core Development", tasks: ["Implement core features", "Create database schema"] },
          { week: 3, milestone: "UI Development", tasks: ["Build user interface", "Add styling"] },
          { week: 4, milestone: "Testing & Launch", tasks: ["Test all features", "Deploy project"] }
        ],
        kanban_board: {
          todo: ["Setup project", "Design database", "Create API", "Build UI"],
          in_progress: [],
          done: []
        },
        tasks: [
          { title: "Project Setup", description: "Initialize the project", priority: "high", estimated_hours: 2 },
          { title: "Database Design", description: "Design the database schema", priority: "high", estimated_hours: 4 },
          { title: "API Development", description: "Build the backend API", priority: "high", estimated_hours: 8 },
          { title: "Frontend Development", description: "Build the user interface", priority: "medium", estimated_hours: 12 }
        ],
        resources: [
          { type: "software", name: "VS Code", description: "Code editor", resource: "IDE", unit_cost: 0 },
          { type: "software", name: "Git", description: "Version control", resource: "VCS", unit_cost: 0 }
        ]
      };
    }

    // Save project details
    await supabaseClient
      .from('project_detail')
      .upsert({
        project_id: project_id,
        user_id: user.id,
        timeline: planData.timeline,
        kanban_board: planData.kanban_board,
        tasks: planData.tasks
      }, { onConflict: 'project_id' });

    // Save resources
    if (planData.resources && Array.isArray(planData.resources)) {
      for (const resource of planData.resources) {
        await supabaseClient
          .from('project_resources')
          .insert({
            project_id: project_id,
            user_id: user.id,
            type: resource.type || 'software',
            name: resource.name,
            description: resource.description,
            resource: resource.resource || resource.name,
            unit_cost: resource.unit_cost || 0,
            quantity: 1
          });
      }
    }

    console.log("Successfully generated project plan");

    return new Response(JSON.stringify({ 
      success: true,
      tasks_count: planData.tasks?.length || 0,
      plan: planData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-project-plan:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
