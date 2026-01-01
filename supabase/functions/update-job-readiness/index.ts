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

    const { resume_ready, portfolio_ready, confidence_level } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log("Updating job readiness for user:", user.id);

    // Get completed projects count
    const { data: completedProjects } = await supabaseClient
      .from("user_projects")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed");

    // Get completed learning
    const { data: completedLearning } = await supabaseClient
      .from("learning_plan")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed");

    // Calculate readiness
    const projectsComplete = (completedProjects?.length || 0) >= 2;
    const learningComplete = (completedLearning?.length || 0) > 0;
    const calculatedConfidence = Math.min(100, 
      ((completedProjects?.length || 0) * 15) + 
      ((completedLearning?.length || 0) * 10) + 
      (resume_ready ? 20 : 0) + 
      (portfolio_ready ? 20 : 0)
    );

    // Check if job_readiness record exists
    const { data: existingReadiness } = await supabaseClient
      .from("job_readiness")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const readinessData = {
      resume_ready: resume_ready ?? existingReadiness?.resume_ready ?? false,
      portfolio_ready: portfolio_ready ?? existingReadiness?.portfolio_ready ?? false,
      confidence_level: confidence_level ?? calculatedConfidence,
      updated_at: new Date().toISOString(),
    };

    let jobReadiness;
    if (existingReadiness) {
      const { data, error } = await supabaseClient
        .from("job_readiness")
        .update(readinessData)
        .eq("user_id", user.id)
        .select()
        .single();
      
      if (error) throw error;
      jobReadiness = data;
    } else {
      const { data, error } = await supabaseClient
        .from("job_readiness")
        .insert({ user_id: user.id, ...readinessData })
        .select()
        .single();
      
      if (error) throw error;
      jobReadiness = data;
    }

    // Update journey state if job ready
    const isJobReady = readinessData.resume_ready && readinessData.portfolio_ready && projectsComplete;
    if (isJobReady) {
      await supabaseClient
        .from("user_journey_state")
        .update({ job_ready: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }

    console.log("Successfully updated job readiness");

    return new Response(JSON.stringify({ 
      jobReadiness,
      isJobReady,
      completedProjectsCount: completedProjects?.length || 0,
      completedLearningCount: completedLearning?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in update-job-readiness:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
