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

    const { skill_name, career_title, current_level, required_level } = await req.json();

    const skillName = skill_name || "Programming";
    const targetCareer = career_title || "Software Developer";
    const userLevel = current_level || "beginner";
    const targetLevel = required_level || "intermediate";

    console.log("Generating learning journey for user:", user.id, "skill:", skillName);

    // Check if learning journey already exists for this skill
    const { data: existingJourney } = await supabaseClient
      .from("user_learning_journey")
      .select("*")
      .eq("user_id", user.id)
      .eq("skill_name", skillName)
      .maybeSingle();

    if (existingJourney) {
      console.log("Learning journey already exists, returning existing");
      return new Response(JSON.stringify({ success: true, ok: true, data: existingJourney }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to generate personalized learning content
    const prompt = `You are acting as a professional AI Career Advisor.

Task: Generate a structured learning plan.

Context:
- Career: ${targetCareer}
- Skill to learn: ${skillName}
- User level: ${userLevel}
- Target level: ${targetLevel}

Instructions:
1. Generate exactly 5 learning steps in logical order.
2. Recommend exactly 3 high-quality online courses.
   - Use real platforms (Coursera, Udemy, edX, etc.)
   - Include valid course links.
3. Recommend exactly 3 YouTube videos.
   - Include real creators and direct links.
4. Ensure content is beginner-to-intermediate friendly.
5. Output must be valid JSON only, no markdown.

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

    let learningContent = null;
    
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a professional AI Career Advisor. Return only valid JSON." },
            { role: "user", content: prompt }
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        console.log("AI response received");

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          learningContent = JSON.parse(jsonMatch[0]);
        }
      } else {
        const errorText = await aiResponse.text();
        console.error("Lovable AI error:", aiResponse.status, errorText);
        // Will use fallback content below
      }
    } catch (e) {
      console.error("AI call failed, using fallback:", e);
    }

    // Use fallback content if AI failed
    if (!learningContent) {
      console.log("Using fallback learning content for:", skill_name);
      // Fallback content
      learningContent = {
        learning_steps: [
          { step: 1, title: "Understand the fundamentals", description: `Learn the core concepts of ${skillName}` },
          { step: 2, title: "Practice basics", description: "Complete beginner exercises and tutorials" },
          { step: 3, title: "Build small projects", description: "Apply your knowledge to mini-projects" },
          { step: 4, title: "Study advanced topics", description: "Dive deeper into complex concepts" },
          { step: 5, title: "Create a portfolio piece", description: "Build a substantial project to showcase" }
        ],
        recommended_courses: [
          { title: `${skillName} Fundamentals`, platform: "Coursera", link: "https://www.coursera.org" },
          { title: `Complete ${skillName} Course`, platform: "Udemy", link: "https://www.udemy.com" },
          { title: `${skillName} Professional`, platform: "edX", link: "https://www.edx.org" }
        ],
        recommended_videos: [
          { title: `${skillName} Tutorial for Beginners`, creator: "freeCodeCamp", link: "https://www.youtube.com/freecodecamp" },
          { title: `Learn ${skillName} in 1 Hour`, creator: "Traversy Media", link: "https://www.youtube.com/traversymedia" },
          { title: `${skillName} Crash Course`, creator: "The Net Ninja", link: "https://www.youtube.com/thenetninja" }
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
        career_title: targetCareer,
        skill_name: skillName,
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
        message: `I've created a personalized learning journey for "${skillName}"! You'll find 5 structured learning steps, 3 recommended courses, and 3 helpful YouTube videos. Complete all steps and submit at least one certification to mark this skill as complete.`,
        context: { action: "learning_journey_generated", skill: skillName },
      },
    ]);

    console.log("Successfully generated learning journey for", skillName);

    return new Response(JSON.stringify({ success: true, ok: true, data: insertedJourney }), {
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
