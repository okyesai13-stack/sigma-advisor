import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const { resumeText, fileName } = await req.json();

    if (!resumeText) {
      return new Response(
        JSON.stringify({ error: 'Resume text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Gemini API to parse the resume
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a resume parser. Extract structured information from the following resume text and return it as a JSON object with the following structure:
{
  "personal_info": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string or null",
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "graduation_year": "number or null"
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "start_year": "number or null",
      "end_year": "number or null (null if current)",
      "description": "string or null",
      "skills": ["array of skills used in this role"]
    }
  ],
  "skills": ["array of all skills mentioned"],
  "certifications": [
    {
      "title": "string",
      "issuer": "string or null",
      "year": "number or null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string or null",
      "technologies": ["array of technologies used"]
    }
  ],
  "languages": ["array of languages spoken"],
  "interests": ["array of interests/hobbies"]
}

Resume Text:
${resumeText}

Return ONLY the JSON object, no additional text or markdown formatting.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to parse resume with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    let parsedContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Clean up the response - remove markdown code blocks if present
    parsedContent = parsedContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsedData;
    try {
      parsedData = JSON.parse(parsedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parsedContent);
      parsedData = { raw_text: resumeText, parse_error: 'Failed to structure data' };
    }

    // Check if resume analysis already exists for this user
    const { data: existingAnalysis } = await supabase
      .from('resume_analysis')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;
    if (existingAnalysis) {
      // Update existing record
      const { data, error } = await supabase
        .from('resume_analysis')
        .update({
          resume_text: resumeText,
          file_name: fileName || null,
          parsed_data: parsedData,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from('resume_analysis')
        .insert({
          user_id: user.id,
          resume_text: resumeText,
          file_name: fileName || null,
          parsed_data: parsedData,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in resume-parser:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
