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

    console.log("Generating career recommendations for user:", user.id);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("users_profile")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    // Fetch education
    const { data: education } = await supabaseClient
      .from("education_details")
      .select("*")
      .eq("user_id", user.id);

    // Fetch experience
    const { data: experience } = await supabaseClient
      .from("experience_details")
      .select("*")
      .eq("user_id", user.id);

    // Fetch certifications
    const { data: certifications } = await supabaseClient
      .from("certifications")
      .select("*")
      .eq("user_id", user.id);

    // Build context for AI
    const userContext = {
      goal: profile?.goal_type,
      goalDescription: profile?.goal_description,
      interests: profile?.interests || [],
      hobbies: profile?.hobbies || [],
      activities: profile?.activities || [],
      education: education || [],
      experience: experience || [],
      certifications: certifications || [],
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert career advisor AI. Based on the user's profile, generate exactly 3 career recommendations.
    
For each career, provide:
1. career_title: A specific job title
2. rationale: A brief explanation (2-3 sentences) of why this career suits them
3. confidence_score: A number between 0.70 and 0.99 representing how well this career matches their profile

Return ONLY a JSON array with these 3 careers, no additional text.`;

    const userPrompt = `User Profile:
- Goal: ${userContext.goal} - ${userContext.goalDescription}
- Interests: ${userContext.interests.join(", ")}
- Hobbies: ${userContext.hobbies.join(", ")}
- Activities: ${userContext.activities.join(", ")}
- Education: ${userContext.education.map(e => `${e.degree} in ${e.field}`).join(", ")}
- Experience: ${userContext.experience.map(e => `${e.role} at ${e.company}`).join(", ")}
- Certifications: ${userContext.certifications.map(c => c.title).join(", ")}

Generate 3 career recommendations as a JSON array.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response content:", content);

    // Parse the JSON from AI response
    let recommendations;
    try {
      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback recommendations
      recommendations = [
        { career_title: "Full-Stack Developer", rationale: "Based on your technical interests and goals.", confidence_score: 0.85 },
        { career_title: "Product Manager", rationale: "Your diverse skills suggest strong product thinking.", confidence_score: 0.78 },
        { career_title: "UX Designer", rationale: "Creative interests align with user experience design.", confidence_score: 0.72 },
      ];
    }

    // Delete existing recommendations for this user
    await supabaseClient
      .from("career_recommendations")
      .delete()
      .eq("user_id", user.id);

    // Insert new recommendations
    const { data: insertedRecs, error: insertError } = await supabaseClient
      .from("career_recommendations")
      .insert(
        recommendations.map((rec: any) => ({
          user_id: user.id,
          career_title: rec.career_title,
          rationale: rec.rationale,
          confidence_score: rec.confidence_score,
        }))
      )
      .select();

    if (insertError) {
      console.error("Error inserting recommendations:", insertError);
      throw new Error("Failed to save recommendations");
    }

    // Update journey state
    const { error: stateError } = await supabaseClient
      .from("user_journey_state")
      .update({ career_recommended: true, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (stateError) {
      console.error("Error updating journey state:", stateError);
    }

    // Store advisor conversation
    await supabaseClient.from("advisor_conversations").insert([
      {
        user_id: user.id,
        role: "advisor",
        message: `Based on your profile, I've identified ${recommendations.length} career paths that align with your goals and interests. Review them and select the one that resonates most with you.`,
        context: { action: "career_recommendation", recommendations: insertedRecs },
      },
    ]);

    console.log("Successfully generated career recommendations");

    return new Response(JSON.stringify({ recommendations: insertedRecs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-career-recommendation:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
