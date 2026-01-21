import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AgentState, AgentStep } from './SigmaAgentController';
import CareerAnalysisOutput from './outputs/CareerAnalysisOutput';
import SkillValidationOutput from './outputs/SkillValidationOutput';
import LearningPlanOutput from './outputs/LearningPlanOutput';
import ProjectIdeasOutput from './outputs/ProjectIdeasOutput';
import JobMatchingOutput from './outputs/JobMatchingOutput';

interface SigmaOutputPanelProps {
  agentState: AgentState;
  currentStep: AgentStep | null;
  executeStep: (stepId: string, userSelection?: any) => Promise<void>;
  isExecuting: boolean;
  canExecute: (stepId: string) => boolean;
  allCompleted: boolean;
}

const SigmaOutputPanel: React.FC<SigmaOutputPanelProps> = ({
  agentState,
  currentStep,
  executeStep,
  isExecuting,
  canExecute,
  allCompleted
}) => {
  const { user } = useAuth();
  const [outputData, setOutputData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load output data based on completed steps
  useEffect(() => {
    const loadOutputData = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
        const [careerAdvice, skillValidation, learningJourney, projectIdeas, jobRecs] = await Promise.all([
          supabase.from('resume_career_advice').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('skill_validations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabase.from('user_learning_journey').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('project_ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('ai_job_recommendations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
        ]);

        setOutputData({
          careerAdvice: careerAdvice.data,
          skillValidation: skillValidation.data,
          learningJourney: learningJourney.data || [],
          projectIdeas: projectIdeas.data || [],
          jobRecs: jobRecs.data || [],
        });
      } catch (error) {
        console.error('Error loading output data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOutputData();
  }, [user, agentState]);

  // Entry gate - Resume required
  if (currentStep?.id === 'entry_gate') {
    return (
      <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
          <h3 className="text-xl font-bold text-foreground mb-2">Resume Required</h3>
          <p className="text-muted-foreground max-w-md">
            Please upload your resume in the Setup page to begin your career analysis journey.
          </p>
          <Button 
            variant="default" 
            className="mt-6"
            onClick={() => window.location.href = '/setup'}
          >
            Go to Setup
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Initial state - Start Career Analysis
  if (currentStep?.id === 'career_analysis' && currentStep.status === 'pending') {
    return (
      <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-primary-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Ready to Begin</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Sigma will analyze your resume and profile to identify career paths, validate skills, 
            create a learning plan, suggest projects, and find job matches.
          </p>
          <Button 
            size="lg"
            onClick={() => executeStep('career_analysis')}
            disabled={isExecuting}
            className="gap-2"
          >
            <Play className="w-5 h-5" />
            Start Career Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Executing state
  if (currentStep?.status === 'executing') {
    return (
      <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
          <h3 className="text-xl font-bold text-foreground mb-2">Processing...</h3>
          <p className="text-muted-foreground">
            {currentStep.name} in progress
          </p>
        </CardContent>
      </Card>
    );
  }

  // All completed
  if (allCompleted) {
    return (
      <Card className="h-full border-green-500/30 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
          <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
          <h3 className="text-2xl font-bold text-foreground mb-2">Journey Complete!</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Congratulations! Your career analysis is complete. You're being redirected to the AI Advisor.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              {outputData?.careerAdvice?.career_advice?.roles?.length || 3} Roles Identified
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              Skills Validated
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              {outputData?.learningJourney?.length || 0} Learning Plans
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              {outputData?.projectIdeas?.length || 0} Projects
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
              {outputData?.jobRecs?.length || 0} Job Matches
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show output based on what's completed
  return (
    <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Analysis Results
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-border/50">
            {agentState.career_analysis_completed && outputData?.careerAdvice && (
              <CareerAnalysisOutput data={outputData.careerAdvice} />
            )}
            {agentState.skill_validation_completed && outputData?.skillValidation && (
              <SkillValidationOutput data={outputData.skillValidation} />
            )}
            {agentState.learning_plan_completed && outputData?.learningJourney?.length > 0 && (
              <LearningPlanOutput data={outputData.learningJourney} />
            )}
            {agentState.project_guidance_completed && outputData?.projectIdeas?.length > 0 && (
              <ProjectIdeasOutput data={outputData.projectIdeas} />
            )}
            {agentState.job_matching_completed && outputData?.jobRecs?.length > 0 && (
              <JobMatchingOutput data={outputData.jobRecs} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SigmaOutputPanel;
