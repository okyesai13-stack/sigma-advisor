import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { 
  MessageSquare, 
  Target, 
  Briefcase, 
  GraduationCap,
  Rocket,
  ArrowLeft,
  BookOpen,
  FolderKanban,
  FileText,
  Users,
  CheckCircle2,
  Brain,
  Lightbulb,
  Search,
  Clock,
  TrendingUp
} from 'lucide-react';
import { TermSection } from '@/components/goals/TermSection';
import { PhaseStep } from '@/components/goals/PhaseStep';
import { ProgressSidebar } from '@/components/goals/ProgressSidebar';

// Interfaces
interface JourneyState {
  career_analysis_completed: boolean;
  skill_validation_completed: boolean;
  learning_plan_completed: boolean;
  project_guidance_completed: boolean;
  project_plan_completed: boolean;
  project_build_completed: boolean;
  resume_completed: boolean;
  job_matching_completed: boolean;
  interview_completed: boolean;
}

interface CareerRole {
  id?: string;
  role: string;
  term?: 'short' | 'mid' | 'long';
  term_label?: string;
  domain?: string;
  match_score?: number;
  rationale?: string;
  required_skills?: string[];
  skills_to_develop?: string[];
  alignment_to_goal?: string;
}

interface CareerAdvice {
  roles?: CareerRole[];
  career_summary?: string;
  total_timeline?: string;
}

interface UserProfile {
  goal_type: string | null;
  goal_description: string | null;
}

interface SkillValidation {
  role: string;
  domain: string | null;
  matched_skills: { strong: string[]; partial: string[] } | null;
  missing_skills: string[] | null;
  readiness_score: number;
}

interface LearningJourney {
  id: string;
  skill_name: string;
  status: string;
  learning_steps: any[];
  steps_completed: boolean[];
}

interface ProjectIdea {
  id: string;
  title: string;
  status: string;
  domain: string;
}

interface ResumeVersion {
  id: string;
  version_name: string;
  target_role: string;
  is_active: boolean;
}

interface JobRecommendation {
  id: string;
  job_title: string;
  company_name: string;
  relevance_score: number;
  is_saved: boolean;
}

interface InterviewPrep {
  id: string;
  role: string;
  company: string;
  readiness_score: number;
}

// Term state tracking - stored in DB
interface TermState {
  short_term_job_achieved: boolean;
  mid_term_job_achieved: boolean;
}

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [journeyState, setJourneyState] = useState<JourneyState | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [careerAdvice, setCareerAdvice] = useState<CareerAdvice | null>(null);
  const [skillValidation, setSkillValidation] = useState<SkillValidation | null>(null);
  const [learningJourneys, setLearningJourneys] = useState<LearningJourney[]>([]);
  const [projects, setProjects] = useState<ProjectIdea[]>([]);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [interviewPreps, setInterviewPreps] = useState<InterviewPrep[]>([]);
  const [expandedTerm, setExpandedTerm] = useState<'short' | 'mid' | 'long' | null>('short');
  const [expandedSteps, setExpandedSteps] = useState<Record<string, number | null>>({
    short: null,
    mid: null,
    long: null,
  });
  
  // Term state - which terms have been achieved (job obtained)
  const [termState, setTermState] = useState<TermState>({
    short_term_job_achieved: false,
    mid_term_job_achieved: false,
  });

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [
        journeyResult,
        profileResult,
        careerResult,
        skillResult,
        learningResult,
        projectResult,
        resumeResult,
        jobResult,
        interviewResult
      ] = await Promise.all([
        supabase.rpc('get_sigma_journey_state', { p_user_id: user.id }),
        supabase.from('users_profile').select('goal_type, goal_description').eq('id', user.id).maybeSingle(),
        supabase.from('resume_career_advice').select('career_advice').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('skill_validations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('user_learning_journey').select('*').eq('user_id', user.id),
        supabase.from('project_ideas').select('*').eq('user_id', user.id),
        supabase.from('resume_versions').select('*').eq('user_id', user.id),
        supabase.from('ai_job_recommendations').select('*').eq('user_id', user.id),
        supabase.from('interview_preparation').select('*').eq('user_id', user.id)
      ]);

      if (journeyResult.data) {
        setJourneyState(journeyResult.data as unknown as JourneyState);
      }
      if (profileResult.data) {
        setUserProfile(profileResult.data);
      }
      if (careerResult.data?.career_advice) {
        setCareerAdvice(careerResult.data.career_advice as CareerAdvice);
      }
      if (skillResult.data) {
        const rawSkill = skillResult.data as any;
        setSkillValidation({
          role: rawSkill.role,
          domain: rawSkill.domain,
          matched_skills: typeof rawSkill.matched_skills === 'object' ? rawSkill.matched_skills : { strong: [], partial: [] },
          missing_skills: Array.isArray(rawSkill.missing_skills) ? rawSkill.missing_skills : [],
          readiness_score: rawSkill.readiness_score || 0
        });
      }
      if (learningResult.data) {
        setLearningJourneys(learningResult.data as LearningJourney[]);
      }
      if (projectResult.data) {
        setProjects(projectResult.data as ProjectIdea[]);
      }
      if (resumeResult.data) {
        setResumeVersions(resumeResult.data as ResumeVersion[]);
      }
      if (jobResult.data) {
        setJobs(jobResult.data as JobRecommendation[]);
      }
      if (interviewResult.data) {
        setInterviewPreps(interviewResult.data as InterviewPrep[]);
      }
    } catch (error) {
      console.error('Error loading goals data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get roles by term
  const getRoleByTerm = (term: 'short' | 'mid' | 'long'): CareerRole | null => {
    if (!careerAdvice?.roles) return null;
    return careerAdvice.roles.find(r => r.term === term) || null;
  };

  // Calculate term status
  const getTermStatus = (term: 'short' | 'mid' | 'long'): 'locked' | 'active' | 'completed' => {
    if (term === 'short') {
      if (termState.short_term_job_achieved) return 'completed';
      return 'active';
    }
    if (term === 'mid') {
      if (!termState.short_term_job_achieved) return 'locked';
      if (termState.mid_term_job_achieved) return 'completed';
      return 'active';
    }
    if (term === 'long') {
      if (!termState.mid_term_job_achieved) return 'locked';
      return 'active';
    }
    return 'locked';
  };

  // Calculate progress for each term
  const calculateTermProgress = (term: 'short' | 'mid' | 'long'): number => {
    if (getTermStatus(term) === 'locked') return 0;
    if (getTermStatus(term) === 'completed') return 100;
    
    // Short term has 7 steps, mid & long have 6 steps
    const totalSteps = term === 'short' ? 7 : 6;
    let completedSteps = 0;
    
    if (term === 'short') {
      // 7 steps: Career Analysis, Skill Validation, Learning, Projects, Portfolio, Interview, Job
      if (journeyState?.career_analysis_completed) completedSteps++;
      if (journeyState?.skill_validation_completed) completedSteps++;
      if (journeyState?.learning_plan_completed) completedSteps++;
      if (journeyState?.project_guidance_completed) completedSteps++;
      if (journeyState?.resume_completed) completedSteps++;
      if (journeyState?.interview_completed) completedSteps++;
      if (termState.short_term_job_achieved) completedSteps++;
    } else {
      // 6 steps: Skill Validation, Learning, Projects, Portfolio, Interview, Job
      // For mid and long term, we'd need separate tracking
      // For now, return 0 until we have that data
    }
    
    return Math.round((completedSteps / totalSteps) * 100);
  };

  // Get step status within a term
  const getStepStatus = (term: 'short' | 'mid' | 'long', stepIndex: number): 'locked' | 'active' | 'completed' | 'pending' => {
    if (getTermStatus(term) === 'locked') return 'locked';
    
    // Step completion logic based on term
    if (term === 'short') {
      const stepStates = [
        journeyState?.career_analysis_completed,
        journeyState?.skill_validation_completed,
        journeyState?.learning_plan_completed,
        journeyState?.project_guidance_completed,
        journeyState?.resume_completed,
        journeyState?.interview_completed,
        termState.short_term_job_achieved,
      ];
      
      if (stepStates[stepIndex]) return 'completed';
      
      // Find the first incomplete step
      const firstIncompleteIndex = stepStates.findIndex(s => !s);
      if (stepIndex === firstIncompleteIndex) return 'active';
      if (stepIndex > firstIncompleteIndex) return 'pending';
    }
    
    // Mid and long term - all pending until short term complete
    return 'pending';
  };

  // Calculate stats for sidebar
  const skillsRemaining = skillValidation?.missing_skills?.length || 0;
  const skillsTotal = (skillValidation?.matched_skills?.strong?.length || 0) + 
                      (skillValidation?.matched_skills?.partial?.length || 0) + 
                      skillsRemaining;
  const projectsCompleted = projects.filter(p => p.status === 'Completed').length;
  const projectsTotal = projects.length;
  const applicationsCount = jobs.filter(j => j.is_saved).length;
  const learningStreak = learningJourneys.filter(l => l.status === 'in_progress' || l.status === 'completed').length;

  const calculateJourneyProgress = (journey: LearningJourney): number => {
    if (!journey.steps_completed?.length) return 0;
    const completed = journey.steps_completed.filter(Boolean).length;
    return Math.round((completed / journey.steps_completed.length) * 100);
  };

  const getGoalIcon = () => {
    switch (userProfile?.goal_type) {
      case 'job': return <Briefcase className="h-5 w-5" />;
      case 'startup': return <Rocket className="h-5 w-5" />;
      case 'learn': return <GraduationCap className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const getLongTermGoal = (): string => {
    const longRole = getRoleByTerm('long');
    if (longRole?.role) return longRole.role;
    return userProfile?.goal_description || 'Your Dream Career';
  };

  const calculateOverallProgress = (): number => {
    let progress = 0;
    const shortProgress = calculateTermProgress('short');
    const midProgress = calculateTermProgress('mid');
    const longProgress = calculateTermProgress('long');
    
    // Weight: Short 30%, Mid 30%, Long 40%
    progress = (shortProgress * 0.3) + (midProgress * 0.3) + (longProgress * 0.4);
    return Math.round(progress);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-48 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Short term steps (7 steps)
  const shortTermSteps = [
    { title: 'Career Analysis', description: 'Identify viable career paths', icon: <Brain className="h-4 w-4" />, timeRange: 'Week 1' },
    { title: 'Skill Validation', description: 'Assess current skills vs requirements', icon: <CheckCircle2 className="h-4 w-4" />, timeRange: 'Week 1' },
    { title: 'Learning Plan', description: 'Build missing skills', icon: <BookOpen className="h-4 w-4" />, timeRange: 'Weeks 2-6' },
    { title: 'Project Building', description: 'Create portfolio projects', icon: <FolderKanban className="h-4 w-4" />, timeRange: 'Weeks 4-8' },
    { title: 'Portfolio & Resume', description: 'Finalize your professional presence', icon: <FileText className="h-4 w-4" />, timeRange: 'Week 9' },
    { title: 'Interview Prep', description: 'Practice and get ready', icon: <Users className="h-4 w-4" />, timeRange: 'Week 10' },
    { title: 'Job Application', description: 'Apply and land your role', icon: <Briefcase className="h-4 w-4" />, timeRange: 'Week 11+' },
  ];

  // Mid and Long term steps (6 steps - starts from skill validation)
  const termSteps = [
    { title: 'Skill Validation', description: 'Assess skills for this role', icon: <CheckCircle2 className="h-4 w-4" />, timeRange: 'Week 1' },
    { title: 'Learning Plan', description: 'Develop advanced skills', icon: <BookOpen className="h-4 w-4" />, timeRange: 'Weeks 2-8' },
    { title: 'Project Building', description: 'Create advanced projects', icon: <FolderKanban className="h-4 w-4" />, timeRange: 'Weeks 6-12' },
    { title: 'Portfolio & Resume', description: 'Update professional presence', icon: <FileText className="h-4 w-4" />, timeRange: 'Week 13' },
    { title: 'Interview Prep', description: 'Advanced interview practice', icon: <Users className="h-4 w-4" />, timeRange: 'Week 14' },
    { title: 'Job Application', description: 'Apply for target role', icon: <Briefcase className="h-4 w-4" />, timeRange: 'Week 15+' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/dashboard')}
                className="shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Your Career Roadmap</h1>
                <p className="text-sm text-muted-foreground">
                  A step-by-step plan to achieve your ultimate goal
                </p>
              </div>
            </div>
            <Button asChild className="hidden sm:flex">
              <Link to="/advisor">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat with Esha
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Ultimate Goal Section */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                {getGoalIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="capitalize">
                    Ultimate Goal
                  </Badge>
                  {careerAdvice?.total_timeline && (
                    <Badge variant="outline" className="text-xs">
                      {careerAdvice.total_timeline}
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {getLongTermGoal()}
                </h2>
                {careerAdvice?.career_summary && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {careerAdvice.career_summary}
                  </p>
                )}
              </div>
            </div>
            <div className="w-full sm:w-64">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold text-primary">{calculateOverallProgress()}%</span>
              </div>
              <Progress value={calculateOverallProgress()} className="h-2" />
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* Career Path Timeline */}
          <div className="space-y-6">
            {/* You Are Here Indicator */}
            <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">You are here</p>
                <p className="text-xs text-muted-foreground">
                  {getTermStatus('short') === 'completed' 
                    ? (getTermStatus('mid') === 'completed' ? 'Long-term Goal Phase' : 'Mid-term Goal Phase')
                    : 'Short-term Goal Phase'}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {getTermStatus('short') === 'completed' 
                  ? (getTermStatus('mid') === 'completed' ? '3-5 Years' : '1-3 Years')
                  : '0-1 Year'}
              </Badge>
            </div>

            {/* Short-term Section */}
            <TermSection
              term="short"
              role={getRoleByTerm('short')}
              status={getTermStatus('short')}
              isExpanded={expandedTerm === 'short'}
              onToggle={() => setExpandedTerm(expandedTerm === 'short' ? null : 'short')}
              progress={calculateTermProgress('short')}
            >
              <div className="space-y-0">
                {shortTermSteps.map((step, index) => (
                  <PhaseStep
                    key={index}
                    stepNumber={index + 1}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                    status={getStepStatus('short', index)}
                    timeRange={step.timeRange}
                    isExpanded={expandedSteps.short === index}
                    onToggle={() => setExpandedSteps(prev => ({
                      ...prev,
                      short: prev.short === index ? null : index
                    }))}
                    progress={getStepStatus('short', index) === 'completed' ? 100 : 0}
                    isLast={index === shortTermSteps.length - 1}
                  >
                    {/* Step content based on index */}
                    {index === 0 && (
                      <div className="space-y-2">
                        {careerAdvice?.roles?.length ? (
                          <p className="text-sm text-muted-foreground">
                            ✓ Career paths identified based on your profile
                          </p>
                        ) : (
                          <Button size="sm" onClick={() => navigate('/sigma')}>
                            Start Analysis
                          </Button>
                        )}
                      </div>
                    )}
                    {index === 1 && skillValidation && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Readiness</span>
                          <span className="font-medium">{skillValidation.readiness_score}%</span>
                        </div>
                        <Progress value={skillValidation.readiness_score} className="h-1.5" />
                      </div>
                    )}
                    {index === 2 && learningJourneys.length > 0 && (
                      <div className="space-y-2">
                        {learningJourneys.slice(0, 3).map((journey) => (
                          <div key={journey.id} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{journey.skill_name}</span>
                            <Badge variant={journey.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                              {journey.status === 'completed' ? 'Done' : journey.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {index === 3 && projects.length > 0 && (
                      <div className="space-y-2">
                        {projects.slice(0, 2).map((project) => (
                          <div key={project.id} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{project.title}</span>
                            <Badge variant={project.status === 'Completed' ? 'default' : 'secondary'} className="text-xs">
                              {project.status || 'Not Started'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {index === 4 && resumeVersions.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => navigate('/resume')}>
                        View Resume
                      </Button>
                    )}
                    {index === 5 && interviewPreps.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => navigate('/interview')}>
                        Practice Interview
                      </Button>
                    )}
                    {index === 6 && jobs.length > 0 && (
                      <div className="space-y-2">
                        {jobs.slice(0, 2).map((job) => (
                          <div key={job.id} className="flex items-center justify-between text-sm">
                            <span className="text-foreground">{job.job_title}</span>
                            <Badge variant={job.relevance_score >= 80 ? 'default' : 'secondary'} className="text-xs">
                              {job.relevance_score}% match
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </PhaseStep>
                ))}
              </div>
            </TermSection>

            {/* Mid-term Section */}
            <TermSection
              term="mid"
              role={getRoleByTerm('mid')}
              status={getTermStatus('mid')}
              isExpanded={expandedTerm === 'mid'}
              onToggle={() => setExpandedTerm(expandedTerm === 'mid' ? null : 'mid')}
              progress={calculateTermProgress('mid')}
              unlockMessage="Complete short-term goal and get placed to unlock"
            >
              <div className="space-y-0">
                {termSteps.map((step, index) => (
                  <PhaseStep
                    key={index}
                    stepNumber={index + 1}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                    status={getStepStatus('mid', index)}
                    timeRange={step.timeRange}
                    isExpanded={expandedSteps.mid === index}
                    onToggle={() => setExpandedSteps(prev => ({
                      ...prev,
                      mid: prev.mid === index ? null : index
                    }))}
                    progress={0}
                    isLast={index === termSteps.length - 1}
                  >
                    <p className="text-sm text-muted-foreground">
                      {getTermStatus('mid') === 'locked' 
                        ? 'Complete short-term goal to unlock this step'
                        : 'Start this step to see details'}
                    </p>
                  </PhaseStep>
                ))}
              </div>
            </TermSection>

            {/* Long-term Section */}
            <TermSection
              term="long"
              role={getRoleByTerm('long')}
              status={getTermStatus('long')}
              isExpanded={expandedTerm === 'long'}
              onToggle={() => setExpandedTerm(expandedTerm === 'long' ? null : 'long')}
              progress={calculateTermProgress('long')}
              unlockMessage="Complete mid-term goal and get placed to unlock"
            >
              <div className="space-y-0">
                {termSteps.map((step, index) => (
                  <PhaseStep
                    key={index}
                    stepNumber={index + 1}
                    title={step.title}
                    description={step.description}
                    icon={step.icon}
                    status={getStepStatus('long', index)}
                    timeRange={step.timeRange}
                    isExpanded={expandedSteps.long === index}
                    onToggle={() => setExpandedSteps(prev => ({
                      ...prev,
                      long: prev.long === index ? null : index
                    }))}
                    progress={0}
                    isLast={index === termSteps.length - 1}
                  >
                    <p className="text-sm text-muted-foreground">
                      {getTermStatus('long') === 'locked' 
                        ? 'Complete mid-term goal to unlock this step'
                        : 'Start this step to see details'}
                    </p>
                  </PhaseStep>
                ))}
              </div>
            </TermSection>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <ProgressSidebar
                skillsRemaining={skillsRemaining}
                skillsTotal={skillsTotal}
                projectsCompleted={projectsCompleted}
                projectsTotal={projectsTotal}
                applicationsCount={applicationsCount}
                learningStreak={learningStreak}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Chat FAB */}
      <Button 
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden"
        onClick={() => navigate('/advisor')}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
}
