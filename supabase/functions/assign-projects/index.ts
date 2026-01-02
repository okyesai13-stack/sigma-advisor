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

    // Get available projects for this career using admin client
    const { data: availableProjects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("career_title", selectedCareer.career_title);

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
    }

    // If no projects for this career, get general projects
    let projectsToAssign = availableProjects;
    if (!projectsToAssign || projectsToAssign.length === 0) {
      console.log("No specific projects found, checking for any projects");
      const { data: generalProjects } = await supabaseAdmin
        .from("projects")
        .select("*")
        .limit(3);
      projectsToAssign = generalProjects;
    }

    if (!projectsToAssign || projectsToAssign.length === 0) {
      console.log("No projects found, creating default projects for career:", selectedCareer.career_title);
      // Create default projects for the career using admin client (bypasses RLS)
      const defaultProjects = [
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

      const { data: createdProjects, error: createError } = await supabaseAdmin
        .from("projects")
        .insert(defaultProjects)
        .select();

      if (createError) {
        console.error("Error creating default projects:", createError);
        throw new Error("Failed to create projects: " + createError.message);
      }

      console.log("Created", createdProjects?.length, "default projects");
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
        role: "assistant",
        message: `I've assigned ${assignedProjects.length} portfolio projects for you. These will help you demonstrate your skills to employers. Start with the beginner project and work your way up.`,
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
