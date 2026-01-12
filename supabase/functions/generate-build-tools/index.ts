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

    const { projectId } = await req.json();
    console.log("Generating build tools for project:", projectId);

    if (!projectId) {
      throw new Error("No projectId provided");
    }

    // Get project details
    const { data: project } = await supabaseClient
      .from('project_ideas')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `You are a technical project advisor. Generate build tools and steps for this project.

Project: ${project.title}
Description: ${project.description || 'Not specified'}
Domain: ${project.domain || 'Technology'}

Generate:
1. Recommended tools/technologies with links
2. Step-by-step build instructions

Return JSON:
{
  "tools": [
    {
      "tool_name": "Tool Name",
      "category": "frontend|backend|database|devops|design",
      "about": "Brief description of the tool",
      "why": "Why this tool is recommended for this project",
      "how": "How to use it in this project",
      "tool_link": "https://official-website.com"
    }
  ],
  "build_steps": [
    {
      "step_number": 1,
      "title": "Step Title",
      "description": "Detailed description of what to do",
      "deliverables": ["Deliverable 1", "Deliverable 2"],
      "estimated_duration": "2 hours"
    }
  ]
}

Include 5-7 tools and 6-8 build steps.
Return ONLY valid JSON.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a technical project advisor. Return only valid JSON." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI API error");
    }

    let aiData;
    let content = "";
    
    try {
      const responseText = await aiResponse.text();
      if (!responseText || responseText.trim() === "") {
        console.error("AI response body is empty, using fallback");
        throw new Error("Empty AI response");
      }
      aiData = JSON.parse(responseText);
      content = aiData.choices?.[0]?.message?.content || "";
    } catch (jsonParseError) {
      console.error("Failed to parse AI response JSON:", jsonParseError);
      // Use fallback data
      aiData = null;
      content = "";
    }

    let buildData;
    try {
      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          buildData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in content");
        }
      } else {
        throw new Error("No content available");
      }
    } catch (parseError) {
      console.error("Failed to parse AI content, using fallback:", parseError);
      buildData = {
        tools: [
          { tool_name: "VS Code", category: "devops", about: "Code editor", why: "Industry standard", how: "Write and edit code", tool_link: "https://code.visualstudio.com" },
          { tool_name: "React", category: "frontend", about: "UI library", why: "Component-based", how: "Build UI components", tool_link: "https://react.dev" },
          { tool_name: "Tailwind CSS", category: "frontend", about: "CSS framework", why: "Rapid styling", how: "Style components", tool_link: "https://tailwindcss.com" },
          { tool_name: "Supabase", category: "backend", about: "Backend as a service", why: "Easy database", how: "Store and query data", tool_link: "https://supabase.com" },
          { tool_name: "Git", category: "devops", about: "Version control", why: "Track changes", how: "Commit and push code", tool_link: "https://git-scm.com" }
        ],
        build_steps: [
          { step_number: 1, title: "Project Setup", description: "Initialize the project with required dependencies", deliverables: ["Package.json", "Project structure"], estimated_duration: "1 hour" },
          { step_number: 2, title: "Database Design", description: "Design and create database schema", deliverables: ["Schema design", "Migrations"], estimated_duration: "2 hours" },
          { step_number: 3, title: "Core Features", description: "Implement main functionality", deliverables: ["Core components", "API integration"], estimated_duration: "4 hours" },
          { step_number: 4, title: "UI/UX", description: "Build user interface", deliverables: ["UI components", "Styling"], estimated_duration: "4 hours" },
          { step_number: 5, title: "Testing", description: "Test all features", deliverables: ["Test cases", "Bug fixes"], estimated_duration: "2 hours" },
          { step_number: 6, title: "Deployment", description: "Deploy to production", deliverables: ["Live application", "Documentation"], estimated_duration: "1 hour" }
        ]
      };
    }

    // Note: Tools are returned in the response but not saved to a separate table
    // They can be used by the frontend to display recommended tools for the project

    // Save build steps
    if (buildData.build_steps && Array.isArray(buildData.build_steps)) {
      for (const step of buildData.build_steps) {
        await supabaseClient
          .from('project_build_steps')
          .insert({
            project_id: projectId,
            user_id: user.id,
            step_number: step.step_number,
            title: step.title,
            description: step.description,
            deliverables: step.deliverables,
            estimated_duration: step.estimated_duration,
            status: 'pending'
          });
      }
    }

    console.log("Successfully generated build tools and steps");

    return new Response(JSON.stringify({ 
      success: true,
      tools: buildData.tools,
      build_steps: buildData.build_steps
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-build-tools:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
