import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create client with user's token to get user info
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unable to get user", details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log(`Deleting account for user: ${userId}`);

    // Delete all user data from all tables (order matters due to foreign keys)
    const tablesToDelete = [
      // Tables with foreign key dependencies first
      { table: "advisor_conversations", column: "user_id" },
      { table: "advisor_chat_sessions", column: "user_id" },
      { table: "interview_preparation", column: "user_id" },
      { table: "project_build_steps", column: "user_id" },
      { table: "project_detail", column: "user_id" },
      { table: "project_resources", column: "user_id" },
      { table: "project_ideas", column: "user_id" },
      { table: "resume_versions", column: "user_id" },
      { table: "resume_career_advice", column: "user_id" },
      { table: "resume_analysis", column: "user_id" },
      { table: "ai_job_recommendations", column: "user_id" },
      { table: "user_learning_journey", column: "user_id" },
      { table: "skill_validations", column: "user_id" },
      { table: "selected_career", column: "user_id" },
      { table: "career_recommendations", column: "user_id" },
      { table: "certifications", column: "user_id" },
      { table: "experience_details", column: "user_id" },
      { table: "education_details", column: "user_id" },
      { table: "sigma_journey_state", column: "user_id" },
      { table: "users_profile", column: "id" }, // users_profile uses 'id' instead of 'user_id'
    ];

    // Delete data from each table
    for (const { table, column } of tablesToDelete) {
      const { error: deleteError } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(column, userId);

      if (deleteError) {
        console.error(`Error deleting from ${table}:`, deleteError);
        // Continue with other tables even if one fails
      } else {
        console.log(`Deleted data from ${table}`);
      }
    }

    // Delete the user from auth.users using admin API
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete user account", 
          details: deleteUserError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted user account: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
