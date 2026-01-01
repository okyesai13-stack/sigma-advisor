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

    console.log("Assigning projects for user:", user.id);

    // Get selected career
    const { data: selectedCareer, error: careerError } = await supabaseClient
      .from("selected_career")
      .select("career_title")
      .eq("user_id", user.id)
      .single();

    if (careerError || !selectedCareer) {
      throw new Error("No career selected");
    }

    // Check if user already has projects
    const { data: existingProjects } = await supabaseClient
      .from("user_projects")
      .select("*")
      .eq("user_id", user.id);

    if (existingProjects && existingProjects.length > 0) {
      return new Response(JSON.stringify({ 
        message: "Projects already assigned",
        userProjects: existingProjects 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get available projects for this career
    const { data: availableProjects, error: projectsError } = await supabaseClient
      .from("projects")
      .select("*")
      .eq("career_title", selectedCareer.career_title);

    // If no projects for this career, get general projects
    let projectsToAssign = availableProjects;
    if (!projectsToAssign || projectsToAssign.length === 0) {
      const { data: generalProjects } = await supabaseClient
        .from("projects")
        .select("*")
        .limit(3);
      projectsToAssign = generalProjects;
    }

    if (!projectsToAssign || projectsToAssign.length === 0) {
      console.log("No projects found, creating default projects");
      // Create default projects for the career
      const defaultProjects = [
        {
          career_title: selectedCareer.career_title,
          project_title: "Portfolio Website",
          description: "Build a responsive portfolio to showcase your work",
          difficulty: "beginner",
          skills_covered: ["HTML/CSS", "JavaScript"],
        },
        {
          career_title: selectedCareer.career_title,
          project_title: "Task Management App",
          description: "Full-stack CRUD application with authentication",
          difficulty: "intermediate",
          skills_covered: ["React", "Node.js", "Database"],
        },
        {
          career_title: selectedCareer.career_title,
          project_title: "E-commerce Platform",
          description: "Complex app with payment integration",
          difficulty: "advanced",
          skills_covered: ["React", "Node.js", "Stripe", "Database"],
        },
      ];

      const { data: createdProjects, error: createError } = await supabaseClient
        .from("projects")
        .insert(defaultProjects)
        .select();

      if (createError) {
        console.error("Error creating default projects:", createError);
        throw new Error("Failed to create projects");
      }

      projectsToAssign = createdProjects;
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
      throw new Error("Failed to assign projects");
    }

    // Store advisor conversation
    await supabaseClient.from("advisor_conversations").insert([
      {
        user_id: user.id,
        role: "advisor",
        message: `I've assigned ${assignedProjects.length} portfolio projects for you. These will help you demonstrate your skills to employers. Start with the beginner project and work your way up.`,
        context: { action: "projects_assigned", projectCount: assignedProjects.length },
      },
    ]);

    console.log("Successfully assigned", assignedProjects.length, "projects");

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
