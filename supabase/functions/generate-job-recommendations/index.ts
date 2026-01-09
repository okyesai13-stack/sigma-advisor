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

    const { career_role, domain, skill_tags } = await req.json();
    console.log("Generating job recommendations for:", career_role);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a job market expert. Generate realistic job recommendations.

Target Role: ${career_role || 'Software Developer'}
Domain: ${domain || 'Technology'}
User Skills: ${JSON.stringify(skill_tags || [])}

Generate 5 realistic job opportunities that match this profile.

Return JSON:
{
  "jobs": [
    {
      "job_title": "Job Title",
      "company_name": "Company Name",
      "location": "City, Country or Remote",
      "job_description": "2-3 sentence job description",
      "required_skills": ["Skill 1", "Skill 2", "Skill 3"],
      "skill_tags": ["tag1", "tag2"],
      "relevance_score": 85,
      "job_link": "https://example.com/job"
    }
  ]
}

Make jobs:
1. Realistic company names (can be well-known or plausible startups)
2. Varied locations including remote options
3. Relevance scores between 65-95
4. Required skills that align with the target role

Return ONLY valid JSON.`;

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2500,
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Gemini API error:", aiResponse.status, errorText);
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let jobData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jobData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      jobData = {
        jobs: [
          { job_title: career_role || "Software Developer", company_name: "TechCorp Inc.", location: "Remote", job_description: "Join our team to build amazing products.", required_skills: ["JavaScript", "React", "Node.js"], skill_tags: ["frontend", "fullstack"], relevance_score: 90, job_link: "https://example.com" },
          { job_title: "Junior " + (career_role || "Developer"), company_name: "StartupXYZ", location: "San Francisco, CA", job_description: "Great opportunity for growth.", required_skills: ["Python", "SQL", "Git"], skill_tags: ["backend", "data"], relevance_score: 82, job_link: "https://example.com" },
          { job_title: "Senior " + (career_role || "Developer"), company_name: "Enterprise Solutions", location: "New York, NY", job_description: "Lead technical initiatives.", required_skills: ["TypeScript", "AWS", "Docker"], skill_tags: ["cloud", "devops"], relevance_score: 75, job_link: "https://example.com" },
          { job_title: career_role || "Developer", company_name: "InnovateTech", location: "London, UK", job_description: "Work on cutting-edge technology.", required_skills: ["React", "GraphQL", "PostgreSQL"], skill_tags: ["fullstack"], relevance_score: 88, job_link: "https://example.com" },
          { job_title: career_role || "Developer", company_name: "GlobalTech", location: "Remote", job_description: "Flexible remote position.", required_skills: ["Vue.js", "Python", "MongoDB"], skill_tags: ["remote", "fullstack"], relevance_score: 79, job_link: "https://example.com" }
        ]
      };
    }

    // Save jobs to database
    const savedJobs = [];
    for (const job of jobData.jobs) {
      const { data: insertedJob, error: insertError } = await supabaseClient
        .from('ai_job_recommendations')
        .insert({
          user_id: user.id,
          career_role: career_role || 'Software Developer',
          job_title: job.job_title,
          company_name: job.company_name,
          location: job.location,
          job_description: job.job_description,
          required_skills: job.required_skills,
          skill_tags: job.skill_tags,
          relevance_score: job.relevance_score,
          job_link: job.job_link,
          domain: domain,
          is_saved: false
        })
        .select()
        .single();

      if (!insertError && insertedJob) {
        savedJobs.push(insertedJob);
      }
    }

    console.log("Successfully generated job recommendations");

    return new Response(JSON.stringify({ 
      success: true,
      jobs: savedJobs
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-job-recommendations:", error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
