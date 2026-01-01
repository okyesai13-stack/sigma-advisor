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

    const { career_title, industry } = await req.json();
    if (!career_title) {
      throw new Error("career_title is required");
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

    console.log("Selecting career path for user:", user.id, "Career:", career_title);

    // Check if career already selected
    const { data: existingCareer } = await supabaseClient
      .from("selected_career")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingCareer) {
      // Update existing selection
      const { error: updateError } = await supabaseClient
        .from("selected_career")
        .update({
          career_title,
          industry: industry || null,
          selected_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating selected career:", updateError);
        throw new Error("Failed to update career selection");
      }
    } else {
      // Insert new selection
      const { error: insertError } = await supabaseClient
        .from("selected_career")
        .insert({
          user_id: user.id,
          career_title,
          industry: industry || null,
        });

      if (insertError) {
        console.error("Error inserting selected career:", insertError);
        throw new Error("Failed to save career selection");
      }
    }

    // Update journey state
    const { error: stateError } = await supabaseClient
      .from("user_journey_state")
      .update({ career_selected: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (stateError) {
      console.error("Error updating journey state:", stateError);
    }

    // Store advisor conversation
    await supabaseClient.from("advisor_conversations").insert([
      {
        user_id: user.id,
        role: "advisor",
        message: `Excellent choice! You've selected "${career_title}" as your career path. This is now locked in and I'll guide you through the next steps. Let me analyze the skills you'll need.`,
        context: { action: "career_selected", career_title },
      },
    ]);

    console.log("Successfully selected career path");

    return new Response(JSON.stringify({ success: true, career_title }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in select-career-path:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
