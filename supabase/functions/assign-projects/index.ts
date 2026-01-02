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

    // User client for user-specific operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Service role client for admin operations (inserting into projects table)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Assigning projects for user:", user.id);

    // Get selected career
    const { data: selectedCareer, error: careerError } = await supabaseClient
      .from("selected_career")
      .select("career_title")
      .eq("user_id", user.id)
      .maybeSingle();

    if (careerError) {
      console.error("Error fetching career:", careerError);
      throw new Error("Failed to fetch selected career");
    }
    
    if (!selectedCareer) {
      throw new Error("No career selected. Please select a career first.");
    }

    // Check if user already has projects
    const { data: existingProjects } = await supabaseClient
      .from("user_projects")
      .select("*, projects(*)")
      .eq("user_id", user.id);

    if (existingProjects && existingProjects.length > 0) {
      console.log("User already has projects assigned");
      return new Response(JSON.stringify({ 
        message: "Projects already assigned",
        userProjects: existingProjects 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's skill gaps to personalize projects
    const { data: skillGaps } = await supabaseClient
      .from("user_skill_validation")
      .select("skill_name, status")
      .eq("user_id", user.id);

    const skillsToFocus = skillGaps?.filter(s => s.status === "gap").map(s => s.skill_name) || [];

    // Get available projects for this career using admin client
    const { data: availableProjects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("career_title", selectedCareer.career_title);

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
    }

    let projectsToAssign = availableProjects;
    
    // If no projects exist, generate AI-powered personalized projects
    if (!projectsToAssign || projectsToAssign.length === 0) {
      console.log("No specific projects found, generating AI-powered projects for:", selectedCareer.career_title);
      
      const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
      
      let generatedProjects = null;
      
      if (GEMINI_API_KEY) {
        const prompt = `You are a career project advisor. Generate 3 portfolio projects for a candidate targeting a specific career.

Return a JSON array with exactly 3 projects:
[
  {
    "project_title": "string",
    "description": "string (2-3 sentences describing what they'll build)",
    "difficulty": "beginner" | "intermediate" | "advanced",
    "skills_covered": ["array", "of", "skills"]
  }
]

Projects should:
- Progress from beginner to advanced
- Be practical and impressive to employers
- Cover key skills for the target career
- Be achievable in 1-4 weeks each

Target Career: ${selectedCareer.career_title}
Skills to Focus On: ${skillsToFocus.length > 0 ? skillsToFocus.join(", ") : "General skills for this career"}

Generate 3 portfolio projects as a JSON array only.`;

        try {
          const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
              },
            }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              generatedProjects = parsed.map((p: any) => ({
                career_title: selectedCareer.career_title,
                project_title: p.project_title,
                description: p.description,
                difficulty: p.difficulty,
                skills_covered: p.skills_covered,
              }));
            }
          }
        } catch (e) {
          console.error("AI project generation failed:", e);
        }
      }

      // Fallback to default projects if AI fails
      if (!generatedProjects) {
        generatedProjects = [
          {
            career_title: selectedCareer.career_title,
            project_title: "Portfolio Website",
            description: "Build a responsive portfolio to showcase your work and skills",
            difficulty: "beginner",
            skills_covered: ["HTML/CSS", "JavaScript", "Responsive Design"],
          },
          {
            career_title: selectedCareer.career_title,
            project_title: "Task Management App",
            description: "Full-stack CRUD application with user authentication and data persistence",
            difficulty: "intermediate",
            skills_covered: ["React", "Node.js", "Database", "Authentication"],
          },
          {
            career_title: selectedCareer.career_title,
            project_title: "E-commerce Platform",
            description: "Complex application with payment integration and inventory management",
            difficulty: "advanced",
            skills_covered: ["React", "Node.js", "Stripe", "Database", "API Design"],
          },
        ];
      }

      const { data: createdProjects, error: createError } = await supabaseAdmin
        .from("projects")
        .insert(generatedProjects)
        .select();

      if (createError) {
        console.error("Error creating projects:", createError);
        throw new Error("Failed to create projects: " + createError.message);
      }

      console.log("Created", createdProjects?.length, "AI-generated projects");
      projectsToAssign = createdProjects;
    }

    if (!projectsToAssign || projectsToAssign.length === 0) {
      throw new Error("No projects available to assign");
    }

    // Assign projects to user
    const userProjectEntries = projectsToAssign.map((project) => ({
      user_id: user.id,
      project_id: project.id,
      status: "not_started",
    }));

    const { data: assignedProjects, error: assignError } = await supabaseClient
      .from("user_projects")
      .insert(userProjectEntries)
      .select();

    if (assignError) {
      console.error("Error assigning projects:", assignError);
      throw new Error("Failed to assign projects: " + assignError.message);
    }

    // Store advisor conversation
    await supabaseClient.from("advisor_conversations").insert([
      {
        user_id: user.id,
        role: "advisor",
        message: `I've assigned ${assignedProjects.length} personalized portfolio projects for your ${selectedCareer.career_title} journey. These projects are designed by AI to help you build practical skills and create an impressive portfolio. Start with the beginner project and work your way up!`,
        context: { action: "projects_assigned", projectCount: assignedProjects.length },
      },
    ]);

    console.log("Successfully assigned", assignedProjects.length, "projects to user");

    return new Response(JSON.stringify({ userProjects: assignedProjects, projects: projectsToAssign }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in assign-projects:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
