import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  match_score: number;
  growth_potential: string;
  timeline_to_ready: string;
}

interface StepStatus {
  career_analysis: 'pending' | 'running' | 'completed' | 'error';
  ai_role_analysis: 'pending' | 'running' | 'completed' | 'error';
  skill_validation: 'pending' | 'running' | 'completed' | 'error';
  learning_plan: 'pending' | 'running' | 'completed' | 'error';
  project_ideas: 'pending' | 'running' | 'completed' | 'error';
  job_matching: 'pending' | 'running' | 'completed' | 'error';
}

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

  const [aiRoles, setAiRoles] = useState<AIEnhancedRole[]>([]);
  
  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('career_analysis');
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

    // Start the pipeline
    runCareerAnalysis();
  }, [resumeId]);

  const runCareerAnalysis = async () => {
    setCurrentStep('career_analysis');
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
      
      // Continue to AI Role Analysis
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
    setCurrentStep('ai_role_analysis');
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
      setStepStatus(prev => ({ ...prev, ai_role_analysis: 'completed' }));
      
      // Continue to Skill Validation
      runSkillValidation();

    } catch (error) {
      console.error('AI Role analysis error:', error);
      setStepStatus(prev => ({ ...prev, ai_role_analysis: 'error' }));
      toast({
        title: "AI Role Analysis Error",
        description: error instanceof Error ? error.message : 'Failed to analyze AI roles',
        variant: "destructive",
      });
      // Continue pipeline even on error
      runSkillValidation();
    }
  };

  const runSkillValidation = async () => {
    setCurrentStep('skill_validation');
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

      setStepStatus(prev => ({ ...prev, skill_validation: 'completed' }));
      runLearningPlan();

    } catch (error) {
      console.error('Skill validation error:', error);
      setStepStatus(prev => ({ ...prev, skill_validation: 'error' }));
    }
  };

  const runLearningPlan = async () => {
    setCurrentStep('learning_plan');
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

      setStepStatus(prev => ({ ...prev, learning_plan: 'completed' }));
      runProjectGeneration();

    } catch (error) {
      console.error('Learning plan error:', error);
      setStepStatus(prev => ({ ...prev, learning_plan: 'error' }));
    }
  };

  const runProjectGeneration = async () => {
    setCurrentStep('project_ideas');
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

      setStepStatus(prev => ({ ...prev, project_ideas: 'completed' }));
      runJobMatching();

    } catch (error) {
      console.error('Project generation error:', error);
      setStepStatus(prev => ({ ...prev, project_ideas: 'error' }));
    }
  };

  const runJobMatching = async () => {
    setCurrentStep('job_matching');
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

      setStepStatus(prev => ({ ...prev, job_matching: 'completed' }));
      setIsComplete(true);
      setCurrentStep('complete');

      toast({
        title: "Analysis Complete! 🎉",
        description: "Your personalized career roadmap is ready",
      });

    } catch (error) {
      console.error('Job matching error:', error);
      setStepStatus(prev => ({ ...prev, job_matching: 'error' }));
    }
  };

  const steps = [
    { id: 'career_analysis', name: 'Career Analysis', icon: Brain, description: 'Analyzing your career path' },
    { id: 'ai_role_analysis', name: 'AI Role Analysis', icon: Sparkles, description: 'Finding AI-enhanced roles' },
    { id: 'skill_validation', name: 'Skill Validation', icon: Target, description: 'Assessing your skills' },
    { id: 'learning_plan', name: 'Learning Plan', icon: BookOpen, description: 'Creating learning roadmap' },
    { id: 'project_ideas', name: 'Project Ideas', icon: Lightbulb, description: 'Generating portfolio projects' },
    { id: 'job_matching', name: 'Job Matching', icon: Briefcase, description: 'Finding matching jobs' },
  ];

  const getStepIcon = (stepId: string) => {
    const status = stepStatus[stepId as keyof StepStatus];
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === 'running') return <Loader2 className="w-5 h-5 text-primary animate-spin" />;
    if (status === 'error') return <span className="w-5 h-5 text-destructive">✕</span>;
    return <span className="w-5 h-5 text-muted-foreground">○</span>;
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
        <div className="max-w-4xl mx-auto">
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
              <CardContent className="space-y-4">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    {getStepIcon(step.id)}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        stepStatus[step.id as keyof StepStatus] === 'running' ? 'text-primary' :
                        stepStatus[step.id as keyof StepStatus] === 'completed' ? 'text-green-600' :
                        'text-muted-foreground'
                      }`}>
                        {step.name}
                      </p>
                      {stepStatus[step.id as keyof StepStatus] === 'running' && (
                        <p className="text-xs text-muted-foreground">{step.description}...</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-primary" />
                  Career Progression Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                {careerRoles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-lg font-medium">Analyzing Your Resume...</p>
                    <p className="text-sm text-muted-foreground">Gemini 3 is creating your personalized career roadmap</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {careerRoles.map((role, index) => (
                      <div 
                        key={index}
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
                      </div>
                    ))}
                  </div>
                )}

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
