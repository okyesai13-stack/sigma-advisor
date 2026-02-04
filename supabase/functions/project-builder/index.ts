import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ProjectPhase {
  phase_number: number;
  title: string;
  description: string;
  tasks: ProjectTask[];
  is_completed: boolean;
}

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  type: 'setup' | 'code' | 'design' | 'test' | 'deploy';
  estimated_time: string;
  is_completed: boolean;
  code_snippet?: string;
  guidance?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { action, resume_id, project_id, project_data, session_id, task_id, user_input, current_phase } = requestData;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // NEW: Streaming Project Chat Action
    if (action === 'project_chat') {
      const { project_title, tech_stack, current_step, completed_steps, total_steps, messages } = requestData;

      const systemPrompt = `You are an expert AI Project Mentor helping a user build: "${project_title}"

Project Context:
- Tech Stack: ${tech_stack}
- Current Step: ${current_step}
- Progress: ${completed_steps}/${total_steps} steps completed

Your role is to:
1. Provide specific, actionable guidance for this exact project
2. Give code examples when relevant using the project's tech stack
3. Explain concepts clearly with real-world analogies
4. Help debug issues when users describe problems
5. Encourage progress and celebrate milestones

Keep responses focused and practical. Use markdown for formatting. When providing code, use proper syntax highlighting.`;

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
            ...(messages || []).map((m: any) => ({ role: m.role, content: m.content })),
          ],
          stream: true,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('AI chat failed');
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // NEW: Generate README Action
    if (action === 'generate_readme') {
      const { project_title, project_description, tech_stack } = requestData;

      const prompt = `Generate a professional README.md for a project:

Project: ${project_title}
Description: ${project_description}
Tech Stack: ${tech_stack}

Include these sections:
1. Project Title with badges (build status, license, etc.)
2. Description - What the project does
3. Features - Key features list
4. Tech Stack - Technologies used with icons/emojis
5. Prerequisites - What's needed to run
6. Installation - Step-by-step setup
7. Usage - How to use the project
8. API Reference (if applicable)
9. Contributing - How to contribute
10. License - MIT License
11. Acknowledgments

Use proper markdown formatting with emojis for visual appeal.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert at creating professional documentation. Generate clean, well-formatted README files.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('README generation failed');
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || '# README\n\nNo content generated.';

      return new Response(
        JSON.stringify({ success: true, data: { content } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NEW: Generate .gitignore Action
    if (action === 'generate_gitignore') {
      const { tech_stack } = requestData;

      const prompt = `Generate a comprehensive .gitignore file for a project using: ${tech_stack}

Include:
1. OS-specific files (macOS, Windows, Linux)
2. IDE/Editor files (VS Code, JetBrains, etc.)
3. Dependencies (node_modules, vendor, etc.)
4. Build outputs
5. Environment files (.env, .env.local)
6. Logs and temporary files
7. Testing coverage reports
8. Any framework-specific ignores

Add comments explaining each section.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert at creating comprehensive .gitignore files. Output only the gitignore content with comments.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('gitignore generation failed');
      }

      const aiResponse = await response.json();
      let content = aiResponse.choices?.[0]?.message?.content || '# .gitignore\nnode_modules/';
      
      // Clean up markdown code blocks if present
      if (content.includes('```')) {
        content = content.replace(/```gitignore\n?/g, '').replace(/```\n?/g, '');
      }

      return new Response(
        JSON.stringify({ success: true, data: { content } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NEW: Generate Database Schema Action
    if (action === 'generate_database') {
      const { project_title, project_description, tech_stack } = requestData;

      const prompt = `Design a database schema for: "${project_title}"

Description: ${project_description}
Tech Stack: ${tech_stack}

Provide:
1. Entity-Relationship description
2. Table schemas with:
   - Table name
   - Columns (name, type, constraints)
   - Primary keys
   - Foreign keys
   - Indexes
3. Sample SQL CREATE statements
4. Relationships explained
5. Example seed data

Use PostgreSQL syntax. Include RLS (Row Level Security) policies if applicable.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are a database architect expert. Design clean, normalized database schemas with proper security.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('Database schema generation failed');
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || 'No schema generated.';

      return new Response(
        JSON.stringify({ success: true, data: { content } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NEW: Generate Tests Action
    if (action === 'generate_tests') {
      const { project_title, tech_stack } = requestData;

      const prompt = `Generate comprehensive test files for: "${project_title}"

Tech Stack: ${tech_stack}

Provide:
1. Unit test examples using appropriate testing framework (Jest, Vitest, etc.)
2. Integration test examples
3. Test utilities and mocks
4. Coverage configuration
5. Testing best practices for this stack

Include:
- Setup and teardown patterns
- Mocking external dependencies
- Testing async operations
- Edge case handling
- Snapshot testing examples (if applicable)

Use modern testing patterns and clear assertions.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are a testing expert. Generate clean, comprehensive test suites with good coverage.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('Test generation failed');
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || 'No tests generated.';

      return new Response(
        JSON.stringify({ success: true, data: { content } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NEW: Explain Code Action
    if (action === 'explain_code') {
      const { code_snippet, project_title } = requestData;

      const prompt = `Explain this code from the "${project_title}" project line by line:

\`\`\`
${code_snippet}
\`\`\`

Provide:
1. Overall purpose of the code
2. Line-by-line explanation
3. Key concepts used
4. How it fits into the project
5. Potential improvements or alternatives
6. Common pitfalls to avoid`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert code reviewer and teacher. Explain code clearly for developers learning to build projects.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('Code explanation failed');
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content || 'No explanation generated.';

      return new Response(
        JSON.stringify({ success: true, data: { content } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // NEW: Update completed steps
    if (action === 'update_progress') {
      const { completed_steps } = requestData;

      if (!resume_id || !project_id) {
        throw new Error('resume_id and project_id required');
      }

      const { data, error } = await supabase
        .from('project_build_session')
        .update({
          completed_tasks: completed_steps,
          progress_percentage: Math.round((completed_steps.length / requestData.total_steps) * 100),
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', project_id)
        .eq('resume_id', resume_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Generate simple project blueprint
    if (action === 'generate_blueprint') {
      if (!resume_id || !project_id || !project_data) {
        throw new Error('resume_id, project_id, and project_data required');
      }

      const prompt = `Create a comprehensive project blueprint for: "${project_data.title}"

Project Description: ${project_data.description || 'A portfolio project'}
Complexity: ${project_data.complexity || 'intermediate'}
Skills to demonstrate: ${project_data.skills_demonstrated?.join(', ') || 'General development skills'}
Estimated Time: ${project_data.estimated_time || '2-3 weeks'}

Generate a complete project blueprint with the following structure. Return only valid JSON:

{
  "overview": "A 2-3 sentence overview of what the user will build and why it's valuable for their portfolio",
  "tech_stack": [
    {
      "category": "Frontend",
      "items": [
        { "name": "React", "purpose": "UI framework for building components" }
      ]
    },
    {
      "category": "Backend/Tools", 
      "items": [
        { "name": "Tool name", "purpose": "Why this tool is used" }
      ]
    }
  ],
  "file_structure": "project-name/\\n├── src/\\n│   ├── components/\\n│   ├── hooks/\\n│   └── App.tsx\\n├── public/\\n└── package.json",
  "setup_steps": [
    "Run \`npx create-vite@latest my-project --template react-ts\` to scaffold the project",
    "Install dependencies: \`npm install package-name\`",
    "Create the basic folder structure as shown above",
    "Set up any required environment variables"
  ],
  "core_features": [
    {
      "name": "Feature Name",
      "description": "What this feature does",
      "code_snippet": "// Complete working code example\\nconst example = () => {\\n  // implementation\\n}"
    }
  ],
  "learning_resources": [
    {
      "title": "Resource title",
      "url": "https://example.com",
      "type": "video|docs|tutorial|article"
    }
  ],
  "next_steps": [
    "Add this project to your GitHub portfolio",
    "Deploy it on Vercel or Netlify",
    "Write a README explaining the project",
    "Share on LinkedIn with key learnings"
  ]
}

Requirements:
- Provide 2-4 tech stack categories with 2-4 items each
- Include 4-6 setup steps with actual commands
- Include 3-5 core features with complete, working code snippets
- Include 4-6 learning resources with real URLs
- Include 4-6 next steps for portfolio enhancement`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert developer creating project blueprints. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('AI blueprint generation failed');
      }

      const aiResponse = await response.json();
      let content = aiResponse.choices?.[0]?.message?.content || '{}';
      
      if (content.includes('```')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const blueprint = JSON.parse(content.trim());

      return new Response(
        JSON.stringify({ success: true, blueprint }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Initialize project build session (legacy - kept for compatibility)
    if (action === 'initialize') {
      if (!resume_id || !project_id) {
        throw new Error('resume_id and project_id required');
      }

      // Check if session already exists
      const { data: existingSession } = await supabase
        .from('project_build_session')
        .select('*')
        .eq('project_id', project_id)
        .eq('resume_id', resume_id)
        .maybeSingle();

      if (existingSession) {
        return new Response(
          JSON.stringify({ success: true, data: existingSession }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get project details and learning plans
      const [projectRes, learningRes, skillRes] = await Promise.all([
        supabase.from('project_ideas_result').select('*').eq('id', project_id).single(),
        supabase.from('learning_plan_result').select('skill_name').eq('resume_id', resume_id),
        supabase.from('skill_validation_result').select('missing_skills').eq('resume_id', resume_id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      const project = projectRes.data;
      if (!project) throw new Error('Project not found');

      const learningSkills = learningRes.data?.map(l => l.skill_name) || [];
      const missingSkills = (skillRes.data?.missing_skills as string[]) || [];

      // Generate project phases with AI
      const prompt = `Create a detailed project build plan for: "${project.title}"

Project Description: ${project.description}
Complexity: ${project.complexity}
Skills to demonstrate: ${project.skills_demonstrated?.join(', ') || 'General skills'}
Skills user is learning: ${learningSkills.join(', ')}
Skills user needs to practice: ${missingSkills.slice(0, 5).join(', ')}

Generate exactly 5 phases with 3-4 tasks each. Each phase should build on the previous one.

Return JSON:
{
  "phases": [
    {
      "phase_number": 1,
      "title": "Project Setup & Planning",
      "description": "Initialize project structure and plan architecture",
      "tasks": [
        {
          "id": "1-1",
          "title": "Task title",
          "description": "What the user needs to do",
          "type": "setup|code|design|test|deploy",
          "estimated_time": "30 mins",
          "is_completed": false,
          "guidance": "Step-by-step instructions for this task"
        }
      ],
      "is_completed": false
    }
  ]
}

Phase structure:
1. Project Setup & Planning - Initialize, architecture, tools
2. Core Implementation - Main features and logic
3. UI/UX Development - Interface and user experience
4. Testing & Refinement - Debug, test, optimize
5. Deployment & Documentation - Launch and document`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert project mentor. Return only valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('AI phase generation failed');
      }

      const aiResponse = await response.json();
      let content = aiResponse.choices?.[0]?.message?.content || '{}';
      
      if (content.includes('```')) {
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      }

      const planData = JSON.parse(content.trim());
      const phases = planData.phases || [];

      // Create session
      const { data: session, error: sessionError } = await supabase
        .from('project_build_session')
        .insert({
          resume_id,
          project_id,
          project_title: project.title,
          status: 'in_progress',
          current_phase: 1,
          total_phases: phases.length,
          phases: phases,
          skills_applied: project.skills_demonstrated || [],
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      console.log('Project build session created:', session.id);

      return new Response(
        JSON.stringify({ success: true, data: session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Get AI guidance for a specific task
    if (action === 'get_guidance') {
      if (!session_id || !task_id) {
        throw new Error('session_id and task_id required');
      }

      const { data: session } = await supabase
        .from('project_build_session')
        .select('*')
        .eq('id', session_id)
        .single();

      if (!session) throw new Error('Session not found');

      const phases = session.phases as ProjectPhase[];
      let currentTask: ProjectTask | null = null;
      let phaseTitle = '';

      for (const phase of phases) {
        const task = phase.tasks.find(t => t.id === task_id);
        if (task) {
          currentTask = task;
          phaseTitle = phase.title;
          break;
        }
      }

      if (!currentTask) throw new Error('Task not found');

      const prompt = `You are helping a user build: "${session.project_title}"

Current Phase: ${phaseTitle}
Current Task: ${currentTask.title}
Task Description: ${currentTask.description}
Task Type: ${currentTask.type}
${user_input ? `User Question: ${user_input}` : ''}

Provide detailed, actionable guidance including:
1. Step-by-step instructions
2. Code examples if applicable (with comments)
3. Best practices
4. Common pitfalls to avoid
5. Resources for further learning

Be specific and practical. If code is needed, provide complete, working examples.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert coding mentor providing practical project guidance. Use markdown formatting.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('AI guidance failed');
      }

      const aiResponse = await response.json();
      const guidance = aiResponse.choices?.[0]?.message?.content || 'No guidance available';

      // Save to history
      const history = (session.ai_guidance_history as any[]) || [];
      history.push({
        task_id,
        question: user_input || 'Initial guidance',
        response: guidance,
        timestamp: new Date().toISOString(),
      });

      await supabase
        .from('project_build_session')
        .update({ ai_guidance_history: history })
        .eq('id', session_id);

      return new Response(
        JSON.stringify({ success: true, data: { guidance } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Complete a task
    if (action === 'complete_task') {
      if (!session_id || !task_id) {
        throw new Error('session_id and task_id required');
      }

      const { data: session } = await supabase
        .from('project_build_session')
        .select('*')
        .eq('id', session_id)
        .single();

      if (!session) throw new Error('Session not found');

      const phases = session.phases as ProjectPhase[];
      let taskCompleted = false;
      let allTasksInPhaseComplete = true;
      let currentPhaseNum = session.current_phase;

      // Mark task as complete
      for (const phase of phases) {
        for (const task of phase.tasks) {
          if (task.id === task_id) {
            task.is_completed = true;
            taskCompleted = true;
          }
        }
      }

      // Check if current phase is complete
      const currentPhase = phases.find(p => p.phase_number === currentPhaseNum);
      if (currentPhase) {
        allTasksInPhaseComplete = currentPhase.tasks.every(t => t.is_completed);
        if (allTasksInPhaseComplete) {
          currentPhase.is_completed = true;
          // Move to next phase if available
          if (currentPhaseNum < phases.length) {
            currentPhaseNum++;
          }
        }
      }

      // Calculate progress
      const totalTasks = phases.reduce((sum, p) => sum + p.tasks.length, 0);
      const completedTasks = phases.reduce((sum, p) => sum + p.tasks.filter(t => t.is_completed).length, 0);
      const progressPercentage = Math.round((completedTasks / totalTasks) * 100);

      // Check if project is complete
      const isComplete = phases.every(p => p.is_completed);

      const updateData: any = {
        phases,
        current_phase: currentPhaseNum,
        progress_percentage: progressPercentage,
        completed_tasks: phases.flatMap(p => p.tasks.filter(t => t.is_completed).map(t => t.id)),
      };

      if (isComplete) {
        updateData.status = 'completed';
        updateData.completed_at = new Date().toISOString();
      }

      await supabase
        .from('project_build_session')
        .update(updateData)
        .eq('id', session_id);

      const { data: updatedSession } = await supabase
        .from('project_build_session')
        .select('*')
        .eq('id', session_id)
        .single();

      return new Response(
        JSON.stringify({ success: true, data: updatedSession }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Generate code snippet for task
    if (action === 'generate_code') {
      if (!session_id || !task_id) {
        throw new Error('session_id and task_id required');
      }

      const { data: session } = await supabase
        .from('project_build_session')
        .select('*')
        .eq('id', session_id)
        .single();

      if (!session) throw new Error('Session not found');

      const phases = session.phases as ProjectPhase[];
      let currentTask: ProjectTask | null = null;

      for (const phase of phases) {
        const task = phase.tasks.find(t => t.id === task_id);
        if (task) {
          currentTask = task;
          break;
        }
      }

      if (!currentTask) throw new Error('Task not found');

      const prompt = `Generate production-ready code for this task in project "${session.project_title}":

Task: ${currentTask.title}
Description: ${currentTask.description}
${user_input ? `Specific requirement: ${user_input}` : ''}

Provide:
1. Complete, working code with proper error handling
2. Clear comments explaining each section
3. Any necessary imports or dependencies
4. Usage examples if applicable

Use modern best practices and clean code principles.`;

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            { role: 'system', content: 'You are an expert software developer. Provide clean, production-ready code with comments.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 402) {
          return new Response(
            JSON.stringify({ success: false, error: 'AI service rate limited' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: response.status }
          );
        }
        throw new Error('AI code generation failed');
      }

      const aiResponse = await response.json();
      const code = aiResponse.choices?.[0]?.message?.content || 'No code generated';

      // Save code snippet
      const snippets = (session.code_snippets as any[]) || [];
      snippets.push({
        task_id,
        code,
        generated_at: new Date().toISOString(),
      });

      await supabase
        .from('project_build_session')
        .update({ code_snippets: snippets })
        .eq('id', session_id);

      return new Response(
        JSON.stringify({ success: true, data: { code } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in project-builder:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
