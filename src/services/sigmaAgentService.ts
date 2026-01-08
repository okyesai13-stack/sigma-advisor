import { supabase } from '@/integrations/supabase/client';

export interface AgentExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStep?: string;
}

export class SigmaAgentService {
  private userId: string;
  private selectedProjectData?: any;

  constructor(userId: string) {
    this.userId = userId;
  }

  async getAgentState() {
    try {
      const { data: resumeData } = await supabase
        .from('resume_analysis')
        .select('id, parsed_data')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: journeyData } = await supabase
        .rpc('get_sigma_journey_state', { p_user_id: this.userId });

      return {
        resume_uploaded: !!resumeData,
        resume_parsed: !!(resumeData?.parsed_data),
        career_analysis_completed: Boolean((journeyData as any)?.career_analysis_completed),
        skill_validation_completed: Boolean((journeyData as any)?.skill_validation_completed),
        learning_plan_completed: Boolean((journeyData as any)?.learning_plan_completed),
        project_guidance_completed: Boolean((journeyData as any)?.project_guidance_completed),
        project_plan_completed: Boolean((journeyData as any)?.project_plan_completed),
        project_build_completed: Boolean((journeyData as any)?.project_build_completed),
        resume_completed: Boolean((journeyData as any)?.resume_completed),
        job_matching_completed: Boolean((journeyData as any)?.job_matching_completed),
        interview_completed: Boolean((journeyData as any)?.interview_completed),
      };
    } catch (error) {
      console.error('Error getting agent state:', error);
      throw error;
    }
  }

  async executeCareerAnalysis(): Promise<AgentExecutionResult> {
    try {
      const { data: resumeData } = await supabase
        .from('resume_analysis')
        .select('id, parsed_data')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!resumeData?.parsed_data) {
        throw new Error('No resume data found for analysis');
      }

      const { data, error } = await supabase.functions.invoke('resume-career-advice', {
        body: {
          parsedData: resumeData.parsed_data,
          userId: this.userId
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Career analysis failed');

      await supabase
        .from('resume_career_advice')
        .upsert({
          user_id: this.userId,
          career_advice: data.careerAdvice,
          resume_analysis_id: resumeData.id
        }, { onConflict: 'user_id' });

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'career_analysis_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: data.careerAdvice,
        nextStep: 'skill_validation'
      };
    } catch (error) {
      console.error('Career analysis execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeSkillValidation(selectedRole?: any): Promise<AgentExecutionResult> {
    try {
      const role = selectedRole?.role || 'Software Developer';
      const domain = selectedRole?.domain || null;
      const career_id = selectedRole?.id || null;

      const { data, error } = await supabase.functions.invoke('validate-skills', {
        body: { 
          role: role.trim(),
          domain: domain?.trim() || null,
          career_id: career_id || null
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Skill validation failed');

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'skill_validation_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: data.data,
        nextStep: 'learning_plan'
      };
    } catch (error) {
      console.error('Skill validation execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeLearningPlan(selectedSkill?: string): Promise<AgentExecutionResult> {
    try {
      if (!selectedSkill) {
        throw new Error('No skill selected for learning plan');
      }

      const { data: skillValidation } = await supabase
        .from('skill_validations')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data, error } = await supabase.functions.invoke('generate-learning-plan', {
        body: {
          career_title: skillValidation?.role || 'Software Developer',
          skill_name: selectedSkill,
          current_level: 'beginner',
          required_level: 'intermediate'
        }
      });
      
      if (error) throw error;
      if (!data.ok && !data.success) throw new Error(data.error || 'Learning plan generation failed');

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'learning_plan_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: data.data,
        nextStep: 'project_ideas'
      };
    } catch (error) {
      console.error('Learning plan execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeProjectIdeas(): Promise<AgentExecutionResult> {
    try {
      const { data: skillValidation } = await supabase
        .from('skill_validations')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: learningPlan } = await supabase
        .from('user_learning_journey')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const role = skillValidation?.role || 'Software Developer';
      const domain = skillValidation?.domain || 'Technology';
      const selectedSkill = learningPlan?.skill_name || 'Programming';

      const { data, error } = await supabase.functions.invoke('openrouter-ai', {
        body: {
          prompt: `Generate project ideas for a ${role} in ${domain} utilizing ${selectedSkill}`,
          degree: role,
          department: domain,
          interests: selectedSkill
        }
      });
      
      if (error) throw error;
      if (!data.ideas || !Array.isArray(data.ideas)) {
        throw new Error('Invalid response from project idea generator');
      }

      for (const idea of data.ideas) {
        await supabase
          .from('project_ideas')
          .insert({
            title: idea.title,
            description: idea.description,
            problem: idea.problem,
            user_id: this.userId,
            domain: domain
          });
      }

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'project_guidance_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: { projects: data.ideas, role, domain },
        nextStep: 'project_plan'
      };
    } catch (error) {
      console.error('Project ideas execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeProjectPlan(selectedProject?: any): Promise<AgentExecutionResult> {
    try {
      if (!selectedProject?.id) {
        throw new Error('No project selected for planning');
      }

      this.selectedProjectData = selectedProject;

      const { data, error } = await supabase.functions.invoke('generate-project-plan', {
        body: {
          project_id: selectedProject.id,
          title: selectedProject.title,
          problem: selectedProject.problem,
          description: selectedProject.description
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error('Project plan generation failed');

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'project_plan_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: { project: selectedProject, tasks_count: data.tasks_count },
        nextStep: 'project_build'
      };
    } catch (error) {
      console.error('Project plan execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeProjectBuild(): Promise<AgentExecutionResult> {
    try {
      let projectId = this.selectedProjectData?.id;
      
      if (!projectId) {
        const { data: projectDetail } = await supabase
          .from('project_detail')
          .select('project_id')
          .eq('user_id', this.userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        projectId = projectDetail?.project_id;
      }

      if (!projectId) {
        throw new Error('No project selected for build tools');
      }

      const { data, error } = await supabase.functions.invoke('generate-build-tools', {
        body: { projectId }
      });
      
      if (error) throw error;
      if (!data.tools) throw new Error('Build tools generation failed');

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'project_build_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: { tools: data.tools, build_steps: data.build_steps || [] },
        nextStep: 'resume_upgrade'
      };
    } catch (error) {
      console.error('Project build execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeResumeUpgrade(): Promise<AgentExecutionResult> {
    try {
      const { data: resumeAnalysis } = await supabase
        .from('resume_analysis')
        .select('id, parsed_data')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!resumeAnalysis?.parsed_data) {
        throw new Error('No resume data found for upgrade');
      }

      const { data: skillValidation } = await supabase
        .from('skill_validations')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: projects } = await supabase
        .from('project_ideas')
        .select('id, title, description')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(3);

      const targetRole = skillValidation?.role || 'Software Developer';
      const targetDomain = skillValidation?.domain || 'Technology';
      const missingSkills = Array.isArray(skillValidation?.missing_skills) 
        ? skillValidation.missing_skills.slice(0, 10) 
        : [];

      const { data, error } = await supabase.functions.invoke('ai-resume-upgrader', {
        body: {
          base_resume: { parsed_resume_data: resumeAnalysis.parsed_data },
          target_role: targetRole,
          target_domain: targetDomain,
          missing_skills: missingSkills,
          selected_projects: projects || []
        }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Resume upgrade failed');

      await supabase
        .from('resume_versions')
        .insert([{
          user_id: this.userId,
          base_resume_id: resumeAnalysis.id,
          target_role: targetRole,
          target_domain: targetDomain,
          included_skills: missingSkills.map(s => String(s)),
          included_projects: (projects || []).map(p => p.id),
          resume_data: data.resume_data,
          version_name: `AI Optimized Resume - ${targetRole}`,
          is_active: true
        }]);

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'resume_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: { resume_data: data.resume_data, target_role: targetRole },
        nextStep: 'job_matching'
      };
    } catch (error) {
      console.error('Resume upgrade execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeJobMatching(): Promise<AgentExecutionResult> {
    try {
      const { data: skillValidation } = await supabase
        .from('skill_validations')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!skillValidation) {
        throw new Error('No skill validation data found');
      }

      const career_role = skillValidation.role || 'Software Developer';
      const domain = skillValidation.domain || 'Technology';
      const skill_tags = Array.isArray(skillValidation.missing_skills) 
        ? skillValidation.missing_skills.slice(0, 10) 
        : [];

      const { data, error } = await supabase.functions.invoke('generate-job-recommendations', {
        body: { career_role, domain, skill_tags }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Job recommendations failed');

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'job_matching_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: { jobs: data.jobs, career_role, domain },
        nextStep: 'interview_prep'
      };
    } catch (error) {
      console.error('Job matching execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async executeInterviewPrep(selectedJob?: any): Promise<AgentExecutionResult> {
    try {
      if (!selectedJob) {
        throw new Error('No job selected for interview preparation');
      }

      const { data: resumeAnalysis } = await supabase
        .from('resume_analysis')
        .select('parsed_data')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: skillValidation } = await supabase
        .from('skill_validations')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const jobData = {
        id: selectedJob.id,
        title: selectedJob.job_title || selectedJob.title,
        company: selectedJob.company_name || selectedJob.company,
        description: selectedJob.job_description || selectedJob.description,
        skills: selectedJob.required_skills || []
      };

      const matchedSkills = skillValidation?.matched_skills as any;
      const parsedData = resumeAnalysis?.parsed_data as any;
      const resumeData = {
        skills: matchedSkills?.strong || [],
        projects: [],
        experience: parsedData?.experience || []
      };

      const { data, error } = await supabase.functions.invoke('ai-interview-prep-generator', {
        body: { job: jobData, resume: resumeData }
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Interview prep failed');

      await supabase
        .from('interview_preparation')
        .upsert({
          user_id: this.userId,
          job_id: selectedJob.id,
          role: jobData.title,
          company: jobData.company,
          job_analysis: data.interview_prep.job_analysis,
          interview_questions: data.interview_prep.interview_questions,
          resume_alignment: data.interview_prep.resume_alignment,
          preparation_checklist: data.interview_prep.preparation_checklist
        }, { onConflict: 'user_id,job_id' });

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'interview_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: { interview_prep: data.interview_prep, job: jobData },
        nextStep: 'completed'
      };
    } catch (error) {
      console.error('Interview prep execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const createSigmaService = (userId: string) => new SigmaAgentService(userId);
