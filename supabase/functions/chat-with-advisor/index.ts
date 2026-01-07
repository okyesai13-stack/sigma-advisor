import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { message, sessionId } = await req.json();
    if (!message) {
      throw new Error("Message is required");
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

    console.log("Chat with advisor for user:", user.id, "session:", sessionId);

    // Store user message with session_id
    await supabaseClient.from("advisor_conversations").insert({
      user_id: user.id,
      role: "user",
      message,
      context: null,
      session_id: sessionId || null,
    });

    // Fetch ALL user context from multiple tables in parallel
    const [
      profileResult,
      selectedCareerResult,
      journeyStateResult,
      skillValidationsResult,
      learningPlanResult,
      learningJourneyResult,
      educationResult,
      experienceResult,
      certificationsResult,
      careerRecommendationsResult,
      userProjectsResult,
      jobReadinessResult,
      interviewsResult,
      recentMessagesResult
    ] = await Promise.all([
      supabaseClient.from("users_profile").select("*").eq("id", user.id).single(),
      supabaseClient.from("selected_career").select("*").eq("user_id", user.id).single(),
      supabaseClient.from("user_journey_state").select("*").eq("user_id", user.id).single(),
      supabaseClient.from("user_skill_validation").select("*").eq("user_id", user.id),
      supabaseClient.from("learning_plan").select("*").eq("user_id", user.id),
      supabaseClient.from("user_learning_journey").select("*").eq("user_id", user.id),
      supabaseClient.from("education_details").select("*").eq("user_id", user.id),
      supabaseClient.from("experience_details").select("*").eq("user_id", user.id),
      supabaseClient.from("certifications").select("*").eq("user_id", user.id),
      supabaseClient.from("career_recommendations").select("*").eq("user_id", user.id).order("confidence_score", { ascending: false }),
      supabaseClient.from("user_projects").select("*, projects(*)").eq("user_id", user.id),
      supabaseClient.from("job_readiness").select("*").eq("user_id", user.id).single(),
      supabaseClient.from("ai_interviews").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
      sessionId 
        ? supabaseClient.from("advisor_conversations").select("role, message").eq("user_id", user.id).eq("session_id", sessionId).order("created_at", { ascending: false }).limit(15)
        : supabaseClient.from("advisor_conversations").select("role, message").eq("user_id", user.id).order("created_at", { ascending: false }).limit(15)
    ]);

    const profile = profileResult.data;
    const selectedCareer = selectedCareerResult.data;
    const journeyState = journeyStateResult.data;
    const skillValidations = skillValidationsResult.data || [];
    const learningPlan = learningPlanResult.data || [];
    const learningJourney = learningJourneyResult.data || [];
    const education = educationResult.data || [];
    const experience = experienceResult.data || [];
    const certifications = certificationsResult.data || [];
    const careerRecommendations = careerRecommendationsResult.data || [];
    const userProjects = userProjectsResult.data || [];
    const jobReadiness = jobReadinessResult.data;
    const interviews = interviewsResult.data || [];
    const recentMessages = recentMessagesResult.data || [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Determine current journey step
    const currentStep = !journeyState?.career_recommended ? "career_recommendation"
      : !journeyState?.career_selected ? "career_selection"
        : !journeyState?.skill_validated ? "skill_validation"
          : !journeyState?.learning_completed ? "learning"
            : !journeyState?.projects_completed ? "projects"
              : !journeyState?.job_ready ? "job_readiness"
                : !journeyState?.interview_completed ? "interview"
                  : "apply";

    // Build comprehensive context strings
    const educationContext = education.length > 0
      ? `\n\n📚 EDUCATION:\n${education.map(e => `- ${e.degree || 'Degree'} in ${e.field || 'Field'} from ${e.institution || 'Institution'} (${e.graduation_year || 'Year N/A'})`).join("\n")}`
      : "\n\n📚 EDUCATION: Not provided";

    const experienceContext = experience.length > 0
      ? `\n\n💼 WORK EXPERIENCE:\n${experience.map(e => `- ${e.role || 'Role'} at ${e.company || 'Company'} (${e.start_year || '?'} - ${e.end_year || 'Present'})${e.skills?.length ? ` | Skills: ${e.skills.join(", ")}` : ''}`).join("\n")}`
      : "\n\n💼 WORK EXPERIENCE: No prior experience";

    const certificationsContext = certifications.length > 0
      ? `\n\n🏆 CERTIFICATIONS:\n${certifications.map(c => `- ${c.title} from ${c.issuer} (${c.year})`).join("\n")}`
      : "";

    const skillsContext = skillValidations.length > 0
      ? `\n\n⚡ SKILL ASSESSMENT:\n${skillValidations.map(s => `- ${s.skill_name}: Current Level ${s.current_level}/5, Required ${s.required_level}/5 (${s.status})`).join("\n")}`
      : "";

    const learningContext = learningPlan.length > 0
      ? `\n\n📖 LEARNING PLAN:\n${learningPlan.map(l => `- ${l.skill_name}: ${l.status} (Priority: ${l.priority})`).join("\n")}`
      : "";

    const learningJourneyContext = learningJourney.length > 0
      ? `\n\n🎯 LEARNING PROGRESS:\n${learningJourney.map(l => `- ${l.skill_name}: ${l.status}`).join("\n")}`
      : "";

    const projectsContext = userProjects.length > 0
      ? `\n\n🔨 PROJECTS:\n${userProjects.map((p: any) => `- ${p.projects?.project_title || 'Project'}: ${p.status}`).join("\n")}`
      : "";

    const careerRecsContext = careerRecommendations.length > 0
      ? `\n\n🎯 CAREER RECOMMENDATIONS:\n${careerRecommendations.map(r => `- ${r.career_title}: ${r.confidence_score}% match - ${r.rationale}`).join("\n")}`
      : "";

    const jobReadinessContext = jobReadiness
      ? `\n\n✅ JOB READINESS:\n- Resume Ready: ${jobReadiness.resume_ready ? 'Yes' : 'No'}\n- Portfolio Ready: ${jobReadiness.portfolio_ready ? 'Yes' : 'No'}\n- Confidence Level: ${jobReadiness.confidence_level || 0}%`
      : "";

    const interviewContext = interviews.length > 0
      ? `\n\n🎤 INTERVIEW HISTORY:\n${interviews.map(i => `- ${i.interview_type}: Score ${i.score}/100`).join("\n")}`
      : "";

    // Build the comprehensive system prompt
    const systemPrompt = `You are an elite AI Career Advisor - a personalized career strategist powered by advanced AI. You are NOT a generic chatbot. You are a state-aware career orchestrator with complete knowledge of this user's journey.

🎯 YOUR MISSION:
Guide this specific user step-by-step toward their career goal using their ACTUAL profile, education, experience, skills, and progress state. Every response must be personalized and actionable.

👤 USER PROFILE:
- Name/ID: ${user.id}
- Career Goal: ${profile?.goal_type || "Not specified"} - ${profile?.goal_description || ""}
- Interests: ${profile?.interests?.join(", ") || "Not specified"}
- Hobbies: ${profile?.hobbies?.join(", ") || "Not specified"}
- Activities: ${profile?.activities?.join(", ") || "Not specified"}${educationContext}${experienceContext}${certificationsContext}

🎯 SELECTED CAREER PATH: ${selectedCareer?.career_title || "Not yet selected"}
${selectedCareer ? `Industry: ${selectedCareer.industry || "Tech"}` : ""}${careerRecsContext}${skillsContext}${learningContext}${learningJourneyContext}${projectsContext}${jobReadinessContext}${interviewContext}

📍 CURRENT JOURNEY STEP: ${currentStep.toUpperCase()}
📊 JOURNEY STATE: ${JSON.stringify(journeyState || { profile_completed: true })}

🚦 STEP-SPECIFIC GUIDANCE:
Based on current step "${currentStep}", respond accordingly:

1. CAREER_RECOMMENDATION: Help user understand career options based on their profile. Suggest 2-3 specific careers with reasoning tied to their interests, education, and experience.

2. CAREER_SELECTION: Guide them in evaluating and confirming their career choice. Discuss growth potential, required skills, and industry outlook.

3. SKILL_VALIDATION: Explain their current skill gaps. Reference their actual skill levels. Provide specific recommendations for improvement.

4. LEARNING: Motivate their learning journey. Reference their actual learning plan and progress. Suggest resources, study strategies, time management.

5. PROJECTS: Help them plan portfolio projects. Reference their assigned projects. Discuss practical implementation and how to showcase work.

6. JOB_READINESS: Review their preparation. Help with resume tips, portfolio presentation, professional branding. Reference their actual readiness status.

7. INTERVIEW: Prepare them with specific tips based on their target career. Provide practice questions relevant to ${selectedCareer?.career_title || "their field"}.

8. APPLY: Strategic job search guidance. Help with applications, networking, company research specific to their career path.

📝 RESPONSE FORMAT (STRICT):
You MUST format ALL responses with clear structure using PLAIN TEXT ONLY. 

CRITICAL: DO NOT use any markdown symbols like #, ##, ###, **, *, -, [ ], etc.
Write in plain readable text with clear visual structure using line breaks and spacing.

**REQUIRED FORMAT (PLAIN TEXT ONLY):**

🎯 MAIN TOPIC

Key Points
• Point 1 with specific detail
• Point 2 with specific detail
• Point 3 with specific detail

Recommendations
1. First action - specific guidance
2. Second action - specific guidance
3. Third action - specific guidance

Next Steps
→ Immediate action item
→ Follow-up action item

**FORMATTING RULES:**
• Use emojis for section headers (🎯 ✅ 💡 ⚡ 📌)
• Use • (bullet) for list items NOT markdown dashes
• Use → (arrow) for action items NOT markdown checkboxes
• Use numbers (1. 2. 3.) for sequential steps
• Use ALL CAPS for emphasis instead of bold/asterisks
• NEVER use # or ## or ### symbols
• NEVER use ** or * for bold/italic
• NEVER use - for bullet points
• NEVER use [ ] for checkboxes
• Keep each point to 1-2 lines max
• Use blank lines between sections for clarity

**OTHER RULES:**
• BE SPECIFIC: Reference actual data from their profile
• BE CONCISE: Max 15-20 points total
• BE PROFESSIONAL: Senior career advisor tone
• NEVER SKIP STEPS: Respect the journey state

Remember: You have COMPLETE knowledge of this user. Use it for hyper-personalized advice.`;

    // Build conversation history
    const conversationHistory = (recentMessages || []).reverse().map((msg: any) => ({
      role: msg.role === "advisor" ? "assistant" : "user",
      content: msg.message,
    }));

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...conversationHistory,
          { role: "user", content: message },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI service credits depleted. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI Gateway error: " + errorText);
    }

    const aiData = await aiResponse.json();
    let responseText = aiData.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again.";

    // Clean markdown symbols from response
    responseText = responseText
      .replace(/#{1,6}\s*/g, '')           // Remove # headers
      .replace(/\*\*([^*]+)\*\*/g, '$1')   // Remove **bold**
      .replace(/\*([^*]+)\*/g, '$1')       // Remove *italic*
      .replace(/^[-*]\s+/gm, '• ')         // Replace - or * bullets with •
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Remove [text](link) → text
      .replace(/`([^`]+)`/g, '$1')         // Remove inline code backticks
      .replace(/```[\s\S]*?```/g, '')      // Remove code blocks
      .replace(/^\s*>\s*/gm, '')           // Remove blockquotes
      .replace(/\[\s*\]/g, '')             // Remove empty []
      .replace(/\[\s*x\s*\]/gi, '✓')       // Replace [x] with ✓
      .replace(/\n{3,}/g, '\n\n')          // Limit consecutive newlines
      .trim();

    // Store advisor response with session_id
    await supabaseClient.from("advisor_conversations").insert({
      user_id: user.id,
      role: "advisor",
      message: responseText,
      context: { currentStep, selectedCareer: selectedCareer?.career_title },
      session_id: sessionId || null,
    });

    console.log("Successfully responded to career advisor chat");

    return new Response(JSON.stringify({
      response: responseText,
      currentStep,
      userContext: {
        selectedCareer: selectedCareer?.career_title,
        journeyState: currentStep,
        skillGaps: skillValidations.filter(s => s.status === 'gap').length,
        projectsCompleted: userProjects.filter((p: any) => p.status === 'completed').length,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in chat-with-advisor:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});