import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { resumeText, fileName, goal, userType, parsedData } = await req.json();

    if (!resumeText) {
      throw new Error('No resume text provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If parsedData is not provided, call the AI to parse it
    let finalParsedData = parsedData;
    
    if (!finalParsedData) {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY not configured');
      }

      const systemPrompt = `You are a resume parser. Extract structured information from resumes.
Return ONLY valid JSON with this exact structure:
{
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "summary": "string or null",
  "skills": ["array of skill strings"],
  "education": [{"degree": "string", "field": "string", "institution": "string", "graduation_year": number or null}],
  "experience": [{"company": "string", "role": "string", "start_year": number or null, "end_year": number or null, "skills": ["array"]}],
  "certifications": [{"title": "string", "issuer": "string", "year": number or null}],
  "projects": [{"name": "string", "description": "string"}]
}`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Parse this resume:\n\n${resumeText.slice(0, 15000)}` }
          ],
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const aiResponse = await response.json();
        let content = aiResponse.choices?.[0]?.message?.content || '{}';
        
        // Clean markdown formatting
        if (content.includes('```')) {
          content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        
        try {
          finalParsedData = JSON.parse(content.trim());
        } catch {
          console.error('Failed to parse AI response');
          finalParsedData = { skills: [], education: [], experience: [], certifications: [], projects: [] };
        }
      }
    }

    // Insert into resume_store - the resume_id is auto-generated
    const { data: resumeData, error: insertError } = await supabase
      .from('resume_store')
      .insert({
        resume_text: resumeText.slice(0, 50000), // Limit text size
        parsed_data: finalParsedData,
        goal: goal || null,
        user_type: userType || 'student',
        file_name: fileName || 'resume.pdf',
      })
      .select('resume_id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to store resume: ' + insertError.message);
    }

    const resumeId = resumeData.resume_id;
    console.log('Resume stored with ID:', resumeId);

    // Create initial journey state
    await supabase
      .from('journey_state')
      .insert({ resume_id: resumeId })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        resume_id: resumeId,
        parsed_data: finalParsedData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in upload-resume:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
