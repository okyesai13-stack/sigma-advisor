import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { skill_name } = await req.json();

    if (!skill_name) {
      throw new Error('No skill_name provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Create a mind map structure for learning ${skill_name}.

Return ONLY valid JSON in this exact format:
{
  "mindmap": {
    "id": "root",
    "label": "${skill_name}",
    "children": [
      {
        "id": "unique-id",
        "label": "Topic Name",
        "description": "Brief description",
        "children": [
          {
            "id": "subtopic-id",
            "label": "Subtopic",
            "description": "Subtopic description"
          }
        ]
      }
    ]
  }
}

Requirements:
- Root node should be the skill name
- Include 4-5 main branches (topics)
- Each main branch should have 2-3 subtopics
- Include descriptions for all nodes
- Topics should cover: fundamentals, intermediate concepts, advanced topics, practical applications, and tools/resources
- Make it educational and logical for learning progression`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a learning content generator. Return only valid JSON, no markdown or extra text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      console.error('AI API error:', response.status);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let content = aiResponse.choices?.[0]?.message?.content || '{}';
    
    // Clean up response
    if (content.includes('```')) {
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    }
    
    const parsed = JSON.parse(content.trim());

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in learning-mindmap:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
