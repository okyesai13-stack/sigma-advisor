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

    const { skill_name } = await req.json();

    console.log("Generating learning journey for user:", user.id, "skill:", skill_name);

    // Check if learning journey already exists for this skill
    const { data: existingJourney } = await supabaseClient
      .from("user_learning_journey")
      .select("*")
      .eq("user_id", user.id)
      .eq("skill_name", skill_name)
      .maybeSingle();

    if (existingJourney) {
      console.log("Learning journey already exists, returning existing");
      return new Response(JSON.stringify({ learningJourney: existingJourney }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get selected career for context
    const { data: selectedCareer } = await supabaseClient
      .from("selected_career")
      .select("career_title")
      .eq("user_id", user.id)
      .maybeSingle();

    // Get skill validation for levels
    const { data: skillValidation } = await supabaseClient
      .from("user_skill_validation")
      .select("current_level, required_level")
      .eq("user_id", user.id)
      .eq("skill_name", skill_name)
      .maybeSingle();

    const careerTitle = selectedCareer?.career_title || "Software Developer";
    const currentLevel = skillValidation?.current_level || "beginner";
    const requiredLevel = skillValidation?.required_level || "intermediate";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to generate personalized learning content
    const userPrompt = `You are acting as a professional AI Career Advisor.

Task: Generate a structured learning plan.

Context:
- Career: ${careerTitle}
- Skill to learn: ${skill_name}
- User level: ${currentLevel}
- Target level: ${requiredLevel}

Instructions:
1. Generate exactly 5 learning steps in logical order.
2. Recommend exactly 3 high-quality online courses.
   - Use real platforms (Coursera, Udemy, edX, etc.)
   - Include valid course links.
3. Recommend exactly 3 YouTube videos.
   - Include real creators and direct links.
4. Ensure content is beginner-to-intermediate friendly.
5. Output must be valid JSON only.

Output format:
{
  "learning_steps": [
    { "step": 1, "title": "", "description": "" },
    { "step": 2, "title": "", "description": "" },
    { "step": 3, "title": "", "description": "" },
    { "step": 4, "title": "", "description": "" },
    { "step": 5, "title": "", "description": "" }
  ],
  "recommended_courses": [
    { "title": "", "platform": "", "link": "" },
    { "title": "", "platform": "", "link": "" },
    { "title": "", "platform": "", "link": "" }
  ],
  "recommended_videos": [
    { "title": "", "creator": "", "link": "" },
    { "title": "", "creator": "", "link": "" },
    { "title": "", "creator": "", "link": "" }
  ]
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { 
            role: "system", 
            content: "You are an expert AI Career Advisor. Return only valid JSON, no markdown or extra text." 
          },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("Failed to generate learning content");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content);

    let learningContent;
    try {
      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        learningContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      // Fallback content
      learningContent = {
        learning_steps: [
          { step: 1, title: "Understand the fundamentals", description: `Learn the core concepts of ${skill_name}` },
          { step: 2, title: "Practice basics", description: "Complete beginner exercises and tutorials" },
          { step: 3, title: "Build small projects", description: "Apply your knowledge to mini-projects" },
          { step: 4, title: "Study advanced topics", description: "Dive deeper into complex concepts" },
          { step: 5, title: "Create a portfolio piece", description: "Build a substantial project to showcase" }
        ],
        recommended_courses: [
          { title: `${skill_name} Fundamentals`, platform: "Coursera", link: "https://www.coursera.org" },
          { title: `Complete ${skill_name} Course`, platform: "Udemy", link: "https://www.udemy.com" },
          { title: `${skill_name} Professional`, platform: "edX", link: "https://www.edx.org" }
        ],
        recommended_videos: [
          { title: `${skill_name} Tutorial for Beginners`, creator: "freeCodeCamp", link: "https://www.youtube.com/freecodecamp" },
          { title: `Learn ${skill_name} in 1 Hour`, creator: "Traversy Media", link: "https://www.youtube.com/traversymedia" },
          { title: `${skill_name} Crash Course`, creator: "The Net Ninja", link: "https://www.youtube.com/thenetninja" }
        ]
      };
    }

    // Initialize steps_completed array
    const stepsCompleted = new Array(5).fill(false);

    // Insert the learning journey
    const { data: insertedJourney, error: insertError } = await supabaseClient
      .from("user_learning_journey")
      .insert({
        user_id: user.id,
        career_title: careerTitle,
        skill_name: skill_name,
        learning_steps: learningContent.learning_steps,
        recommended_courses: learningContent.recommended_courses,
        recommended_videos: learningContent.recommended_videos,
        steps_completed: stepsCompleted,
        certification_links: [],
        status: "in_progress"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting learning journey:", insertError);
      throw new Error("Failed to create learning journey");
    }

    // Store advisor conversation
    await supabaseClient.from("advisor_conversations").insert([
      {
        user_id: user.id,
        role: "advisor",
        message: `I've created a personalized learning journey for "${skill_name}"! You'll find 5 structured learning steps, 3 recommended courses, and 3 helpful YouTube videos. Complete all steps and submit at least one certification to mark this skill as complete.`,
        context: { action: "learning_journey_generated", skill: skill_name },
      },
    ]);

    console.log("Successfully generated learning journey for", skill_name);

    return new Response(JSON.stringify({ learningJourney: insertedJourney }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-learning-plan:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
