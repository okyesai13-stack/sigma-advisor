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
    const { imageBase64, fileName, goal, challenge, userType } = await req.json();

    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use Gemini's vision capability to parse the resume image
    const systemPrompt = `You are an expert resume parser with OCR capabilities. Extract all text and structured information from this resume image.

Return ONLY valid JSON with this exact structure:
{
  "raw_text": "The full extracted text from the resume",
  "name": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "summary": "string or null - professional summary or objective",
  "skills": ["array of skill strings"],
  "education": [{"degree": "string", "field": "string", "institution": "string", "graduation_year": number or null}],
  "experience": [{"company": "string", "role": "string", "start_year": number or null, "end_year": number or null, "description": "string", "skills": ["array"]}],
  "certifications": [{"title": "string", "issuer": "string", "year": number or null}],
  "projects": [{"name": "string", "description": "string"}],
  "languages": ["array of languages"],
  "links": ["array of URLs like LinkedIn, GitHub, portfolio"]
}

Be thorough - extract ALL visible information. If you can't read something clearly, make your best guess. 
Handle handwritten notes or annotations if present.
If the image quality is poor, still extract whatever you can read.`;

    console.log('Parsing resume image with Gemini Vision...');

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
          { 
            role: 'user', 
            content: [
              {
                type: 'text',
                text: 'Parse this resume image and extract all information:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again in a moment.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'AI service credits depleted.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }
      const errorText = await response.text();
      console.error('Gemini Vision error:', errorText);
      throw new Error('Failed to parse resume image');
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '{}';
    
    // Clean markdown formatting
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    let parsedData;
    try {
      parsedData = JSON.parse(content.trim());
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      parsedData = { 
        raw_text: content,
        skills: [], 
        education: [], 
        experience: [], 
        certifications: [], 
        projects: [] 
      };
    }

    const resumeText = parsedData.raw_text || content;
    delete parsedData.raw_text; // Remove raw_text from parsed_data

    // Insert into resume_store
    const { data: resumeData, error: insertError } = await supabase
      .from('resume_store')
      .insert({
        resume_text: resumeText.slice(0, 50000),
        parsed_data: parsedData,
        goal: goal || null,
        challenge: challenge || null,
        user_type: userType || 'student',
        file_name: fileName || 'resume_image.jpg',
      })
      .select('resume_id')
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to store resume: ' + insertError.message);
    }

    const resumeId = resumeData.resume_id;
    console.log('Resume image parsed and stored with ID:', resumeId);

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
        parsed_data: parsedData,
        extracted_text_preview: resumeText.slice(0, 500) + '...',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in resume-image-parse:', error);
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
