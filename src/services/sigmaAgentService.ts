import { supabase } from '@/integrations/supabase/client';

export interface AgentExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  nextStep?: string;
}

export class SigmaAgentService {
  private userId: string;

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
        job_matching_completed: Boolean((journeyData as any)?.job_matching_completed),
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
        .maybeSingle();

      let requestBody: any = { userId: this.userId };
      let resumeAnalysisId: string | null = null;

      if (resumeData?.parsed_data) {
        requestBody.parsedData = resumeData.parsed_data;
        resumeAnalysisId = resumeData.id;
        console.log('Using resume data for career analysis');
      } else {
        console.log('No resume data found, fetching profile data from tables');

        const [profileResult, educationResult, experienceResult, certificationResult] = await Promise.all([
          supabase.from('users_profile').select('*').eq('id', this.userId).maybeSingle(),
          supabase.from('education_details').select('*').eq('user_id', this.userId),
          supabase.from('experience_details').select('*').eq('user_id', this.userId),
          supabase.from('certifications').select('*').eq('user_id', this.userId)
        ]);

        const profile = profileResult.data;
        const education = educationResult.data || [];
        const experience = experienceResult.data || [];
        const certifications = certificationResult.data || [];

        if (!profile && education.length === 0 && experience.length === 0 && certifications.length === 0) {
          throw new Error('No profile data found. Please complete your profile or upload a resume first.');
        }

        requestBody.profileData = {
          profile: profile || {},
          education: education.map(edu => ({
            degree: edu.degree,
            field: edu.field,
            institution: edu.institution,
            graduation_year: edu.graduation_year
          })),
          experience: experience.map(exp => ({
            company: exp.company,
            role: exp.role,
            skills: exp.skills || [],
            start_year: exp.start_year,
            end_year: exp.end_year
          })),
          certifications: certifications.map(cert => ({
            title: cert.title,
            issuer: cert.issuer,
            year: cert.year
          }))
        };
      }

      const { data, error } = await supabase.functions.invoke('resume-career-advice', {
        body: requestBody
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Career analysis failed');

      const careerAdvice = data.careerAdvice;
      console.log('Career advice received:', careerAdvice);

      if (careerAdvice) {
        await supabase
          .from('resume_career_advice')
          .delete()
          .eq('user_id', this.userId);

        const { error: insertError } = await supabase
          .from('resume_career_advice')
          .insert({
            user_id: this.userId,
            resume_analysis_id: resumeAnalysisId,
            career_advice: careerAdvice,
            selected_role: null
          });

        if (insertError) {
          console.error('Failed to save career advice:', insertError);
          throw new Error('Failed to save career advice to database');
        }
      }

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'career_analysis_completed',
        p_flag_value: true
      });

      const roles = careerAdvice?.roles || [];
      
      return {
        success: true,
        data: roles,
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

  // Goal-based skill validation - automatically uses career goal, no role selection needed
  async executeSkillValidationGoalBased(): Promise<AgentExecutionResult> {
    try {
      // Get the career advice to find the top recommended role
      const { data: careerAdvice } = await supabase
        .from('resume_career_advice')
        .select('career_advice')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const roles = (careerAdvice?.career_advice as any)?.roles || [];
      const topRole = roles[0];

      const role = topRole?.role || 'Software Developer';
      const domain = topRole?.domain || null;

      console.log('Goal-based skill validation for:', role, domain);

      const { data, error } = await supabase.functions.invoke('validate-skills', {
        body: { 
          role: role.trim(),
          domain: domain?.trim() || null,
          career_id: null
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

  // Auto learning plan - generates learning plan for all missing skills
  async executeLearningPlanAuto(): Promise<AgentExecutionResult> {
    try {
      const { data: skillValidation } = await supabase
        .from('skill_validations')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!skillValidation) {
        throw new Error('No skill validation found');
      }

      const missingSkills = Array.isArray(skillValidation.missing_skills) 
        ? skillValidation.missing_skills.slice(0, 5) 
        : [];

      if (missingSkills.length === 0) {
        // No missing skills, mark as complete
        await supabase.rpc('update_sigma_state_flag', {
          p_user_id: this.userId,
          p_flag_name: 'learning_plan_completed',
          p_flag_value: true
        });
        return { success: true, data: [], nextStep: 'project_ideas' };
      }

      // Generate learning plans for top 3 missing skills
      const learningPlans = [];
      for (const skill of missingSkills.slice(0, 3)) {
        try {
          const { data, error } = await supabase.functions.invoke('generate-learning-plan', {
            body: {
              career_title: skillValidation.role || 'Software Developer',
              skill_name: skill,
              current_level: 'beginner',
              required_level: 'intermediate'
            }
          });
          
          if (!error && data) {
            learningPlans.push(data.data || data.learningJourney);
          }
        } catch (e) {
          console.error(`Failed to generate learning plan for ${skill}:`, e);
        }
      }

      await supabase.rpc('update_sigma_state_flag', {
        p_user_id: this.userId,
        p_flag_name: 'learning_plan_completed',
        p_flag_value: true
      });

      return {
        success: true,
        data: learningPlans,
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
        nextStep: 'job_matching'
      };
    } catch (error) {
      console.error('Project ideas execution failed:', error);
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
        nextStep: 'completed'
      };
    } catch (error) {
      console.error('Job matching execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const createSigmaService = (userId: string) => new SigmaAgentService(userId);
