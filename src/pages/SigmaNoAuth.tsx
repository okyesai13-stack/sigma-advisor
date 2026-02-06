import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2, 
  Target,
  TrendingUp,
  Clock,
  Brain,
  BookOpen,
  Lightbulb,
  Briefcase,
  ArrowRight,
  AlertTriangle,
  Zap,
  GraduationCap,
  Code2,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface CareerRole {
  role: string;
  domain: string;
  progression_stage: string;
  timeline: string;
  match_score: number;
  why_fit: string;
  salary_range: string;
  top_skills: string[];
  skills_to_develop: string[];
}

interface AIEnhancedRole {
  role: string;
  description?: string;
  match_score: number;
  growth_potential: string;
  timeline_to_ready: string;
  skills_required?: string[];
  missing_skills?: string[];
  salary_range?: string;
}

interface SkillValidationData {
  target_role: string;
  readiness_score: number;
  matched_skills: { skill: string; proficiency: string }[];
  missing_skills: { skill: string; importance: string }[];
  recommended_next_step: string;
}

interface LearningPlanData {
  skill_name: string;
  career_title: string;
  learning_steps: { step: string; duration: string }[];
  recommended_courses: { name: string; platform: string; url: string; duration: string; level: string }[];
  recommended_videos: { title: string; channel: string; url: string; duration: string }[];
  status: string;
}

interface ProjectIdeaData {
  title: string;
  description: string;
  complexity: string;
  estimated_time: string;
  skills_demonstrated: string[];
}

interface JobMatchData {
  job_title: string;
  company_name: string;
  location: string;
  relevance_score: number;
  skill_tags: string[];
}

interface StepStatus {
  career_analysis: 'pending' | 'running' | 'completed' | 'error';
  ai_role_analysis: 'pending' | 'running' | 'completed' | 'error';
  skill_validation: 'pending' | 'running' | 'completed' | 'error';
  learning_plan: 'pending' | 'running' | 'completed' | 'error';
  project_ideas: 'pending' | 'running' | 'completed' | 'error';
  job_matching: 'pending' | 'running' | 'completed' | 'error';
}

type StepId = keyof StepStatus;

const SigmaNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeId, goal } = useResume();
  
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    career_analysis: 'pending',
    ai_role_analysis: 'pending',
    skill_validation: 'pending',
    learning_plan: 'pending',
    project_ideas: 'pending',
    job_matching: 'pending',
  });

  // Store results for each step
  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);
  const [aiRoles, setAiRoles] = useState<AIEnhancedRole[]>([]);
  const [aiReadinessScore, setAiReadinessScore] = useState<number>(0);
  const [skillValidation, setSkillValidation] = useState<SkillValidationData | null>(null);
  const [learningPlans, setLearningPlans] = useState<LearningPlanData[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdeaData[]>([]);
  const [jobMatches, setJobMatches] = useState<JobMatchData[]>([]);

  const [selectedStep, setSelectedStep] = useState<StepId>('career_analysis');
  const [currentRunningStep, setCurrentRunningStep] = useState<string>('career_analysis');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!resumeId) {
      toast({
        title: "No Resume Found",
        description: "Please upload your resume first",
        variant: "destructive",
      });
      navigate('/setup');
      return;
    }

    runCareerAnalysis();
  }, [resumeId]);

  const runCareerAnalysis = async () => {
    setCurrentRunningStep('career_analysis');
    setStepStatus(prev => ({ ...prev, career_analysis: 'running' }));

    try {
      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/career-analysis',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_id: resumeId }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Career analysis failed');
      }

      setCareerRoles(result.data?.career_roles || []);
      setStepStatus(prev => ({ ...prev, career_analysis: 'completed' }));
      setSelectedStep('career_analysis');
      
      runAiRoleAnalysis();

    } catch (error) {
      console.error('Career analysis error:', error);
      setStepStatus(prev => ({ ...prev, career_analysis: 'error' }));
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : 'Failed to analyze career',
        variant: "destructive",
      });
    }
  };

  const runAiRoleAnalysis = async () => {
    setCurrentRunningStep('ai_role_analysis');
    setStepStatus(prev => ({ ...prev, ai_role_analysis: 'running' }));

    try {
      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/ai-role-analysis',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_id: resumeId }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'AI Role analysis failed');
      }

      setAiRoles(result.data?.ai_enhanced_roles || []);
      setAiReadinessScore(result.data?.overall_ai_readiness_score || 0);
      setStepStatus(prev => ({ ...prev, ai_role_analysis: 'completed' }));
      setSelectedStep('ai_role_analysis');
      
      runSkillValidation();

    } catch (error) {
      console.error('AI Role analysis error:', error);
      setStepStatus(prev => ({ ...prev, ai_role_analysis: 'error' }));
      toast({
        title: "AI Role Analysis Error",
        description: error instanceof Error ? error.message : 'Failed to analyze AI roles',
        variant: "destructive",
      });
      runSkillValidation();
    }
  };

  const runSkillValidation = async () => {
    setCurrentRunningStep('skill_validation');
    setStepStatus(prev => ({ ...prev, skill_validation: 'running' }));

    try {
      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/skill-validation',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_id: resumeId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setSkillValidation(result.data || null);
      setStepStatus(prev => ({ ...prev, skill_validation: 'completed' }));
      setSelectedStep('skill_validation');
      runLearningPlan();

    } catch (error) {
      console.error('Skill validation error:', error);
      setStepStatus(prev => ({ ...prev, skill_validation: 'error' }));
      runLearningPlan();
    }
  };

  const runLearningPlan = async () => {
    setCurrentRunningStep('learning_plan');
    setStepStatus(prev => ({ ...prev, learning_plan: 'running' }));

    try {
      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/learning-plan',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_id: resumeId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setLearningPlans(result.data || []);
      setStepStatus(prev => ({ ...prev, learning_plan: 'completed' }));
      setSelectedStep('learning_plan');
      runProjectGeneration();

    } catch (error) {
      console.error('Learning plan error:', error);
      setStepStatus(prev => ({ ...prev, learning_plan: 'error' }));
      runProjectGeneration();
    }
  };

  const runProjectGeneration = async () => {
    setCurrentRunningStep('project_ideas');
    setStepStatus(prev => ({ ...prev, project_ideas: 'running' }));

    try {
      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/project-generation',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_id: resumeId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setProjectIdeas(result.data || []);
      setStepStatus(prev => ({ ...prev, project_ideas: 'completed' }));
      setSelectedStep('project_ideas');
      runJobMatching();

    } catch (error) {
      console.error('Project generation error:', error);
      setStepStatus(prev => ({ ...prev, project_ideas: 'error' }));
      runJobMatching();
    }
  };

  const runJobMatching = async () => {
    setCurrentRunningStep('job_matching');
    setStepStatus(prev => ({ ...prev, job_matching: 'running' }));

    try {
      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/job-matching',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume_id: resumeId }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setJobMatches(result.data || []);
      setStepStatus(prev => ({ ...prev, job_matching: 'completed' }));
      setSelectedStep('job_matching');
      setIsComplete(true);
      setCurrentRunningStep('complete');

      toast({
        title: "Analysis Complete! 🎉",
        description: "Your personalized career roadmap is ready",
      });

    } catch (error) {
      console.error('Job matching error:', error);
      setStepStatus(prev => ({ ...prev, job_matching: 'error' }));
      setIsComplete(true);
    }
  };

  const steps = [
    { id: 'career_analysis' as StepId, name: 'Career Analysis', icon: Brain, description: 'Analyzing your career path' },
    { id: 'ai_role_analysis' as StepId, name: 'AI Role Analysis', icon: Sparkles, description: 'Finding AI-enhanced roles' },
    { id: 'skill_validation' as StepId, name: 'Skill Validation', icon: Target, description: 'Assessing your skills' },
    { id: 'learning_plan' as StepId, name: 'Learning Plan', icon: BookOpen, description: 'Creating learning roadmap' },
    { id: 'project_ideas' as StepId, name: 'Project Ideas', icon: Lightbulb, description: 'Generating portfolio projects' },
    { id: 'job_matching' as StepId, name: 'Job Matching', icon: Briefcase, description: 'Finding matching jobs' },
  ];

  const getStepIcon = (stepId: StepId) => {
    const status = stepStatus[stepId];
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'running') return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    if (status === 'error') return <AlertTriangle className="w-5 h-5 text-destructive" />;
    return <span className="w-5 h-5 text-muted-foreground">○</span>;
  };

  const handleStepClick = (stepId: StepId) => {
    if (stepStatus[stepId] === 'completed' || stepStatus[stepId] === 'error') {
      setSelectedStep(stepId);
    }
  };

  const renderStepContent = () => {
    const status = stepStatus[selectedStep];
    
    if (status === 'pending') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Clock className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Waiting to start...</p>
        </div>
      );
    }

    if (status === 'running') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <p className="text-lg font-medium">Processing...</p>
          <p className="text-sm text-muted-foreground">Gemini 3 is analyzing your data</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-lg font-medium text-destructive">Analysis Failed</p>
          <p className="text-sm text-muted-foreground">This step encountered an error</p>
        </div>
      );
    }

    // Render completed step results
    switch (selectedStep) {
      case 'career_analysis':
        return renderCareerAnalysis();
      case 'ai_role_analysis':
        return renderAiRoleAnalysis();
      case 'skill_validation':
        return renderSkillValidation();
      case 'learning_plan':
        return renderLearningPlan();
      case 'project_ideas':
        return renderProjectIdeas();
      case 'job_matching':
        return renderJobMatching();
      default:
        return null;
    }
  };

  const renderCareerAnalysis = () => (
    <div className="space-y-4">
      {careerRoles.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No career roles found</p>
      ) : (
        careerRoles.map((role, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border-l-4 ${
              role.progression_stage === 'short_term' ? 'border-l-emerald-500 bg-emerald-500/5' :
              role.progression_stage === 'mid_term' ? 'border-l-amber-500 bg-amber-500/5' :
              'border-l-violet-500 bg-violet-500/5'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {role.progression_stage === 'short_term' && <Clock className="w-4 h-4 text-emerald-500" />}
                  {role.progression_stage === 'mid_term' && <TrendingUp className="w-4 h-4 text-amber-500" />}
                  {role.progression_stage === 'long_term' && <Target className="w-4 h-4 text-violet-500" />}
                  <Badge variant="outline" className="capitalize">
                    {role.progression_stage.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{role.timeline}</span>
                </div>
                <h3 className="font-semibold text-lg">{role.role}</h3>
                <p className="text-sm text-muted-foreground">{role.domain}</p>
              </div>
              <Badge className="bg-primary/10 text-primary">
                {role.match_score}% Match
              </Badge>
            </div>
            <p className="text-sm mt-2">{role.why_fit}</p>
            <p className="text-sm text-muted-foreground mt-1">{role.salary_range}</p>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderAiRoleAnalysis = () => (
    <div className="space-y-4">
      {/* AI Readiness Score */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">AI Readiness Score</span>
          <span className="text-2xl font-bold text-primary">{aiReadinessScore}%</span>
        </div>
        <div className="w-full bg-primary/20 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-500"
            style={{ width: `${aiReadinessScore}%` }}
          />
        </div>
      </div>

      {/* AI Enhanced Roles */}
      {aiRoles.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No AI roles found</p>
      ) : (
        aiRoles.map((role, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{role.role}</h3>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600">
                {role.match_score}% Match
              </Badge>
            </div>
            {role.description && (
              <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
            )}
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-muted rounded">
                Growth: {role.growth_potential}
              </span>
              <span className="px-2 py-1 bg-muted rounded">
                Ready in: {role.timeline_to_ready}
              </span>
              {role.salary_range && (
                <span className="px-2 py-1 bg-muted rounded">
                  {role.salary_range}
                </span>
              )}
            </div>
            {role.missing_skills && role.missing_skills.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-muted-foreground mb-1">Skills to develop:</p>
                <div className="flex flex-wrap gap-1">
                  {role.missing_skills.slice(0, 4).map((skill, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  const renderSkillValidation = () => (
    <div className="space-y-4">
      {!skillValidation ? (
        <p className="text-muted-foreground text-center py-8">No skill data available</p>
      ) : (
        <>
          {/* Target Role & Score */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20">
            <p className="text-sm text-muted-foreground mb-1">Target Role</p>
            <h3 className="font-semibold text-lg mb-2">{skillValidation.target_role}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm">Readiness:</span>
              <span className="text-xl font-bold text-emerald-600">{skillValidation.readiness_score}%</span>
            </div>
          </div>

          {/* Matched Skills */}
          {skillValidation.matched_skills?.length > 0 && (
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Matched Skills ({skillValidation.matched_skills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {skillValidation.matched_skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-600">
                    {skill.skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Missing Skills */}
          {skillValidation.missing_skills?.length > 0 && (
            <div className="p-4 rounded-lg border bg-card">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Skills to Develop ({skillValidation.missing_skills.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {skillValidation.missing_skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="border-amber-500/50 text-amber-600">
                    {skill.skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Next Step */}
          {skillValidation.recommended_next_step && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm"><strong>Next Step:</strong> {skillValidation.recommended_next_step}</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderLearningPlan = () => (
    <div className="space-y-4">
      {learningPlans.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No learning plans generated</p>
      ) : (
        learningPlans.map((plan, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{plan.skill_name}</h3>
              <Badge variant="outline" className="ml-auto capitalize">
                {plan.status || 'not_started'}
              </Badge>
            </div>
            {plan.career_title && (
              <p className="text-sm text-muted-foreground mb-3">For: {plan.career_title}</p>
            )}
            {/* Recommended Courses */}
            {plan.recommended_courses?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">📚 Courses</p>
                <div className="space-y-2">
                  {plan.recommended_courses.slice(0, 3).map((course, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{course.name}</p>
                        <p className="text-xs text-muted-foreground">{course.platform} · {course.duration} · {course.level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Recommended Videos */}
            {plan.recommended_videos?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">🎥 Videos</p>
                <div className="space-y-2">
                  {plan.recommended_videos.slice(0, 3).map((video, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/50">
                      <span className="flex-1 min-w-0">
                        <p className="truncate font-medium">{video.title}</p>
                        <p className="text-xs text-muted-foreground">{video.channel} · {video.duration}</p>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Fallback: learning_steps if present */}
            {plan.learning_steps?.length > 0 && !plan.recommended_courses?.length && (
              <div className="space-y-2">
                {plan.learning_steps.slice(0, 3).map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">
                      {i + 1}
                    </span>
                    <span className="flex-1">{step.step}</span>
                    {step.duration && (
                      <span className="text-xs text-muted-foreground">{step.duration}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  const renderProjectIdeas = () => (
    <div className="space-y-4">
      {projectIdeas.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No projects generated</p>
      ) : (
        projectIdeas.map((project, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border bg-card"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">{project.title}</h3>
              </div>
              <Badge variant="outline" className="capitalize">
                {project.complexity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                <Clock className="w-3 h-3 inline mr-1" />
                {project.estimated_time}
              </span>
            </div>
            {project.skills_demonstrated?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t">
                {project.skills_demonstrated.slice(0, 4).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  const renderJobMatching = () => (
    <div className="space-y-4">
      {jobMatches.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No jobs matched</p>
      ) : (
        jobMatches.map((job, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{job.job_title}</h3>
                <p className="text-sm text-muted-foreground">{job.company_name}</p>
              </div>
              <Badge className="bg-primary/10 text-primary">
                {job.relevance_score}% Match
              </Badge>
            </div>
            {job.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" />
                {job.location}
              </p>
            )}
            {job.skill_tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {job.skill_tags.slice(0, 4).map((skill, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  const getSelectedStepInfo = () => {
    return steps.find(s => s.id === selectedStep);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Sigma AI Agent</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/setup')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Goal Display */}
          <div className="mb-8 text-center">
            <p className="text-muted-foreground">Your Goal</p>
            <h1 className="text-2xl font-bold text-foreground">{goal || 'Career Analysis'}</h1>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Progress Panel */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Analysis Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {steps.map((step) => {
                  const status = stepStatus[step.id];
                  const isClickable = status === 'completed' || status === 'error';
                  const isSelected = selectedStep === step.id;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(step.id)}
                      disabled={!isClickable}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                        isSelected 
                          ? 'bg-primary/10 border border-primary/30' 
                          : isClickable 
                            ? 'hover:bg-muted cursor-pointer' 
                            : 'opacity-60 cursor-not-allowed'
                      }`}
                    >
                      {getStepIcon(step.id)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          status === 'running' ? 'text-primary' :
                          status === 'completed' ? 'text-green-600' :
                          status === 'error' ? 'text-destructive' :
                          'text-muted-foreground'
                        }`}>
                          {step.name}
                        </p>
                        {status === 'running' && (
                          <p className="text-xs text-muted-foreground truncate">{step.description}...</p>
                        )}
                      </div>
                      {isSelected && status === 'completed' && (
                        <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {(() => {
                    const stepInfo = getSelectedStepInfo();
                    if (stepInfo?.icon) {
                      const IconComponent = stepInfo.icon;
                      return <IconComponent className="w-5 h-5 text-primary" />;
                    }
                    return null;
                  })()}
                  {getSelectedStepInfo()?.name || 'Results'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {renderStepContent()}
                    </motion.div>
                  </AnimatePresence>
                </ScrollArea>

                {isComplete && (
                  <div className="mt-6 pt-6 border-t">
                    <Button 
                      onClick={() => navigate('/dashboard')} 
                      className="w-full h-12 text-lg"
                    >
                      View Full Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SigmaNoAuth;
