import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resume_id, preferences } = await req.json();

    if (!resume_id) {
      throw new Error('No resume_id provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load all user data in parallel
    const [resumeResult, careerResult, skillResult] = await Promise.all([
      supabase.from('resume_store').select('*').eq('resume_id', resume_id).maybeSingle(),
      supabase.from('career_analysis_result').select('career_roles, overall_assessment').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('skill_validation_result').select('*').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    const resumeData = resumeResult.data;
    if (!resumeData) throw new Error('Resume not found');

    const careerRoles = careerResult.data?.career_roles as any[] || [];
    const skillData = skillResult.data;
    const userSkills = resumeData?.parsed_data?.skills || [];
    const shortTermRole = careerRoles.find((r: any) => r.progression_stage === 'short_term');
    const targetRole = preferences?.target_role || shortTermRole?.role || resumeData?.goal || 'Software Developer';
    const readinessScore = skillData?.readiness_score || 50;
    const matchedSkills = skillData?.matched_skills || { strong: [], partial: [] };
    const missingSkills = skillData?.missing_skills || [];

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Build comprehensive agent prompt
    const prefs = preferences || {};
    const sessionId = crypto.randomUUID();

    const agentPrompt = `You are an elite AI Job Finder Agent. Your mission: find the BEST real-time job matches based on the candidate's profile and preferences.

## CANDIDATE PROFILE
- Target Role: ${targetRole}
- Skills: ${userSkills.slice(0, 15).join(', ')}
- Strong Skills: ${(matchedSkills.strong || []).slice(0, 10).join(', ')}
- Skills to Develop: ${(Array.isArray(missingSkills) ? missingSkills : []).slice(0, 8).map((s: any) => typeof s === 'string' ? s : s.name || String(s)).join(', ')}
- Readiness Score: ${readinessScore}%
- Career Goal: ${resumeData?.goal || 'Not specified'}

## USER PREFERENCES
- Company Type: ${prefs.company_type || 'Any (Startup, MNC, Product, Service)'}
- Salary Range: ${prefs.salary_min ? `₹${prefs.salary_min} - ₹${prefs.salary_max} LPA` : 'Market competitive'}
- Domain: ${prefs.domain || 'Any'}
- Sector: ${prefs.sector || 'Any'}
- Location: ${prefs.location || 'India (Any city)'}
- Work Mode: ${prefs.work_mode || 'Any (Remote/Hybrid/Onsite)'}
- Experience Level: ${prefs.experience_level || 'Any'}

## INSTRUCTIONS
Generate exactly 10 highly targeted, realistic job recommendations. For each job:
1. Use REAL company names (TCS, Infosys, Wipro, Google, Microsoft, Amazon, Flipkart, Razorpay, CRED, Zerodha, PhonePe, Swiggy, Zomato, Freshworks, Zoho, etc.)
2. Generate realistic job URLs from LinkedIn, Naukri, Indeed, or company career pages
3. Calculate a precise match score (0-100) based on skill overlap, experience fit, and preference alignment
4. Identify which user skills match and what gaps exist
5. Provide a compelling "why apply" reason
6. Extract ATS keywords from the job description

## SCORING WEIGHTS
- Skill match: 35%
- Experience level fit: 20%
- Domain/sector alignment: 15%
- Location/work mode match: 15%
- Salary range fit: 10%
- Company type preference: 5%

Return a JSON array of exactly 10 jobs:
[
  {
    "job_title": "Senior Software Engineer",
    "company_name": "Google",
    "company_type": "MNC Product",
    "domain": "Cloud Computing",
    "sector": "Technology",
    "location": "Bangalore, India",
    "work_mode": "hybrid",
    "salary_range": "25-40 LPA",
    "experience_level": "3-5 years",
    "job_description": "Detailed 2-3 sentence description of the role, responsibilities, and team",
    "job_url": "https://www.linkedin.com/jobs/view/...",
    "source": "linkedin",
    "match_score": 87,
    "match_reasoning": "Strong Python and ML skills align perfectly with requirements. Cloud experience matches GCP focus.",
    "matched_skills": ["Python", "Machine Learning", "SQL"],
    "skill_gaps": ["Kubernetes", "Go"],
    "why_apply": "Google's AI-first approach aligns with your ML skills. Team works on cutting-edge LLM products.",
    "ats_keywords": ["Python", "ML", "GCP", "Distributed Systems"]
  }
]

IMPORTANT: Make URLs realistic following actual job board URL patterns. Vary companies across startups, MNCs, and product companies based on preferences.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are an elite job matching AI agent. Return only valid JSON array. No markdown, no explanations.' },
          { role: 'user', content: agentPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: response.status === 429 ? 'AI service rate limited. Please try again in a moment.' : 'AI credits exhausted. Please add credits.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '[]';

    // Clean markdown
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }

    let jobs: any[] = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jobs = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content.substring(0, 500));
      jobs = [];
    }

    if (!Array.isArray(jobs)) jobs = [];

    // Idempotency: delete existing results for this resume
    await supabase.from('job_finder_result').delete().eq('resume_id', resume_id);

    const savedJobs = [];

    for (const job of jobs) {
      const { data: inserted, error } = await supabase
        .from('job_finder_result')
        .insert({
          resume_id,
          user_id: resumeResult.data?.user_id || null,
          session_id: sessionId,
          preferences: prefs,
          job_title: job.job_title || 'Unknown Role',
          company_name: job.company_name || 'Unknown Company',
          company_type: job.company_type || null,
          domain: job.domain || prefs.domain || null,
          sector: job.sector || prefs.sector || null,
          location: job.location || prefs.location || null,
          work_mode: job.work_mode || null,
          salary_range: job.salary_range || null,
          experience_level: job.experience_level || null,
          job_description: job.job_description || null,
          job_url: job.job_url || null,
          source: job.source || 'ai-generated',
          match_score: Math.min(100, Math.max(0, job.match_score || 50)),
          match_reasoning: job.match_reasoning || null,
          skill_gaps: job.skill_gaps || [],
          matched_skills: job.matched_skills || [],
          why_apply: job.why_apply || null,
          ats_keywords: job.ats_keywords || [],
          is_saved: false,
        })
        .select()
        .single();

      if (inserted) savedJobs.push(inserted);
    }

    console.log(`Job Finder Agent: ${savedJobs.length} jobs found for resume ${resume_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        session_id: sessionId,
        data: savedJobs,
        total: savedJobs.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Job Finder Agent error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
