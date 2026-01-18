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

    // Derive user's first name from email or use friendly default
    const userName = user.email?.split('@')[0]?.split('.')[0] || 'there';
    const capitalizedName = userName.charAt(0).toUpperCase() + userName.slice(1);

    // Calculate progress metrics
    const totalSkills = skillValidations.length;
    const masteredSkills = skillValidations.filter((s: any) => s.status === 'complete' || s.current_level >= s.required_level).length;
    const skillProgress = totalSkills > 0 ? Math.round((masteredSkills / totalSkills) * 100) : 0;
    
    const totalLearning = learningJourney.length;
    const completedLearning = learningJourney.filter((l: any) => l.status === 'completed').length;
    const learningProgress = totalLearning > 0 ? Math.round((completedLearning / totalLearning) * 100) : 0;

    const totalProjects = userProjects.length;
    const completedProjects = userProjects.filter((p: any) => p.status === 'completed').length;

    // Build the comprehensive system prompt - Gemini-style conversational responses
    const systemPrompt = `You are Sigma, ${capitalizedName}'s personal AI career advisor. You're warm, knowledgeable, and conversational - like talking to a brilliant friend who happens to be a career expert.

## About ${capitalizedName}:
- Name: ${capitalizedName}
- Goal: ${profile?.goal_type === 'job' ? 'Landing their dream job' : profile?.goal_type === 'learn' ? 'Mastering new skills' : profile?.goal_type === 'startup' ? 'Building their own venture' : 'Career growth'}
${profile?.goal_description ? `- Vision: "${profile.goal_description}"` : ''}
- Interests: ${profile?.interests?.join(", ") || "Exploring options"}
- Hobbies: ${profile?.hobbies?.join(", ") || "Various"}

## Background:
${education.length > 0 ? education.map(e => `- ${e.degree || 'Studied'} ${e.field || ''} at ${e.institution || 'University'} (${e.graduation_year || ''})`).join("\n") : '- Building their foundation'}

## Experience:
${experience.length > 0 ? experience.map(e => `- ${e.role || 'Professional'} at ${e.company || 'Company'} (${e.start_year || '?'}-${e.end_year || 'Present'})${e.skills?.length ? ` | Skills: ${e.skills.slice(0, 3).join(", ")}` : ''}`).join("\n") : '- Fresh talent ready to grow'}

## Certifications: ${certifications.length > 0 ? certifications.map(c => c.title).join(", ") : 'Building their portfolio'}

## Career Path: ${selectedCareer?.career_title || "Still exploring options"}
${careerRecommendations.length > 0 ? `Top matches: ${careerRecommendations.slice(0, 2).map(r => `${r.career_title} (${r.confidence_score}%)`).join(", ")}` : ''}

## Progress:
- Skills: ${skillProgress}% ready ${masteredSkills > 0 ? `(${masteredSkills} skills mastered)` : ''}
- Learning: ${learningProgress}% complete ${completedLearning > 0 ? `(${completedLearning} courses done)` : ''}
- Projects: ${completedProjects}/${totalProjects} built
- Current focus: ${currentStep.replace('_', ' ')}

${skillValidations.length > 0 ? `## Skill Status:\n${skillValidations.map((s: any) => `- ${s.skill_name}: ${s.current_level}/${s.required_level} ${s.status === 'gap' ? '(needs work)' : '✓'}`).join("\n")}` : ''}

${learningJourney.length > 0 ? `## Learning Journey:\n${learningJourney.slice(0, 3).map((l: any) => `- ${l.skill_name}: ${l.status}`).join("\n")}` : ''}

${userProjects.length > 0 ? `## Projects:\n${userProjects.slice(0, 3).map((p: any) => `- ${p.projects?.project_title || 'Project'}: ${p.status}`).join("\n")}` : ''}

## Response Style (CRITICAL):

Write like Google Gemini - natural, flowing, and conversational. NO heavy formatting, NO decorative lines, NO boxes.

### Format Guidelines:

1. **Start with a warm greeting** using their name naturally
2. **Use simple section headers** with just an emoji and title (e.g., "✨ Your Career Path")
3. **Use bullet points** with ▸ for lists (keep them concise)
4. **Write in short paragraphs** - 2-3 sentences max per paragraph
5. **End with an engaging question** to continue the conversation

### What NOT to do:
- NO line decorations (═══, ───, etc.)
- NO heavy borders or boxes
- NO ALL CAPS headings
- NO excessive emojis
- NO rigid templates
- NO corporate jargon

### Example Response:

Hey ${capitalizedName}! That's a great question, and honestly, it's the perfect one to ask right now. Given your background and passion for ${selectedCareer?.career_title || 'your field'}, we've got a fantastic direction to explore!

✨ Leverage Your Foundation

Your strong ${experience.length > 0 ? experience[0]?.skills?.slice(0, 2).join(' and ') || 'technical' : 'analytical'} experience is a HUGE asset. Here's why:

▸ ${experience.length > 0 ? experience[0]?.skills?.[0] || 'Your core skills' : 'Your skills'} are foundational for data-driven roles
▸ Your ${education.length > 0 ? education[0]?.degree || 'educational background' : 'background'} bridges the technical and strategic gap
▸ You already understand how to translate data into business insights

🎯 Your Next Steps

Let me break down the most impactful things you can focus on right now:

▸ Build a portfolio project showcasing your analytical skills
▸ Get hands-on with ${selectedCareer?.career_title || 'your target role'} tools
▸ Connect with professionals in your target field

What aspect would you like to dive deeper into first?

---

Be helpful, specific, and encouraging. Reference their actual data when giving advice. Make them feel understood and supported.`;

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