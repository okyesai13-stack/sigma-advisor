import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Target, 
  Briefcase, 
  GraduationCap,
  Rocket,
  ArrowLeft,
  Flame,
  TrendingUp,
  CheckCircle2,
  BookOpen,
  FolderKanban,
  FileText,
  Users
} from 'lucide-react';
import { RoadmapPhase } from '@/components/goals/RoadmapPhase';
import { ProgressSidebar } from '@/components/goals/ProgressSidebar';

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

interface CareerAdvice {
  roles?: Array<{
    role: string;
    domain: string;
    salary_range?: string;
  }>;
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

interface ProjectDetail {
  project_id: string;
  timeline: any;
  tasks: any;
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
  const [projectDetails, setProjectDetails] = useState<ProjectDetail[]>([]);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [jobs, setJobs] = useState<JobRecommendation[]>([]);
  const [interviewPreps, setInterviewPreps] = useState<InterviewPrep[]>([]);
  const [expandedPhase, setExpandedPhase] = useState<number | null>(null);
  
  const phaseRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Auto-expand and scroll to active phase
  useEffect(() => {
    if (!journeyState) return;
    
    const activePhase = getActivePhase();
    if (activePhase !== null && expandedPhase === null) {
      setExpandedPhase(activePhase);
      // Auto-scroll to active phase after a brief delay
      setTimeout(() => {
        phaseRefs.current[activePhase]?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 300);
    }
  }, [journeyState]);

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
        projectDetailResult,
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
        supabase.from('project_detail').select('*').eq('user_id', user.id),
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
      if (projectDetailResult.data) {
        setProjectDetails(projectDetailResult.data as ProjectDetail[]);
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

  const getActivePhase = (): number | null => {
    if (!journeyState) return null;
    
    if (!journeyState.career_analysis_completed) return 0;
    if (!journeyState.learning_plan_completed || !journeyState.project_guidance_completed) return 1;
    if (!journeyState.resume_completed) return 2;
    if (!journeyState.interview_completed) return 3;
    return 4;
  };

  const calculateOverallProgress = (): number => {
    if (!journeyState) return 0;
    
    const phases = [
      journeyState.career_analysis_completed,
      journeyState.learning_plan_completed && journeyState.project_guidance_completed,
      journeyState.resume_completed,
      journeyState.interview_completed,
      false // Job application is ongoing
    ];
    
    const completed = phases.filter(Boolean).length;
    return Math.round((completed / 5) * 100);
  };

  const getGoalIcon = () => {
    switch (userProfile?.goal_type) {
      case 'job': return <Briefcase className="h-4 w-4" />;
      case 'startup': return <Rocket className="h-4 w-4" />;
      case 'learn': return <GraduationCap className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getTargetRole = (): string => {
    if (careerAdvice?.roles?.[0]?.role) {
      return careerAdvice.roles[0].role;
    }
    return userProfile?.goal_description || 'Your Dream Career';
  };

  // Calculate stats for sidebar
  const skillsRemaining = skillValidation?.missing_skills?.length || 0;
  const skillsTotal = (skillValidation?.matched_skills?.strong?.length || 0) + 
                      (skillValidation?.matched_skills?.partial?.length || 0) + 
                      skillsRemaining;
  const projectsCompleted = projects.filter(p => p.status === 'Completed').length;
  const projectsTotal = projects.length;
  const applicationsCount = jobs.filter(j => j.is_saved).length;

  // Learning streak calculation (mock - would need real tracking)
  const learningStreak = learningJourneys.filter(l => l.status === 'in_progress' || l.status === 'completed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

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
                  A step-by-step plan designed by Esha to help you achieve your goal
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

      {/* Goal & Progress Section */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {getGoalIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="capitalize">
                    {userProfile?.goal_type || 'Career'} Goal
                  </Badge>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  {getTargetRole()}
                </h2>
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
          {/* Roadmap Timeline */}
          <div className="space-y-0">
            {/* Timeline connector line */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
              
              {/* Phase 1: Career Analysis */}
              <div ref={el => phaseRefs.current[0] = el}>
                <RoadmapPhase
                  phaseNumber={1}
                  title="Career Analysis"
                  description="Understand your profile and identify viable career paths"
                  icon={<Target className="h-5 w-5" />}
                  status={journeyState?.career_analysis_completed ? 'completed' : 
                          getActivePhase() === 0 ? 'active' : 'locked'}
                  timeRange="Week 1"
                  isExpanded={expandedPhase === 0}
                  onToggle={() => setExpandedPhase(expandedPhase === 0 ? null : 0)}
                  progress={journeyState?.career_analysis_completed ? 100 : 0}
                >
                  {/* Career Analysis Content */}
                  <div className="space-y-4">
                    {careerAdvice?.roles?.slice(0, 3).map((role, idx) => (
                      <Card key={idx} className="p-4 bg-card/50 border-border/50">
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Briefcase className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{role.role}</h4>
                            <p className="text-sm text-muted-foreground">{role.domain}</p>
                            {role.salary_range && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                {role.salary_range}
                              </Badge>
                            )}
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                        </div>
                      </Card>
                    ))}
                    {skillValidation && (
                      <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">Skill Match</span>
                          <span className="text-sm font-medium text-primary">
                            {skillValidation.readiness_score}% Ready
                          </span>
                        </div>
                        <Progress value={skillValidation.readiness_score} className="h-1.5" />
                      </div>
                    )}
                    {!careerAdvice?.roles?.length && (
                      <div className="text-center py-8">
                        <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Career analysis pending</p>
                        <Button className="mt-4" onClick={() => navigate('/sigma')}>
                          Start Analysis
                        </Button>
                      </div>
                    )}
                  </div>
                </RoadmapPhase>
              </div>

              {/* Phase 2: Learning & Projects */}
              <div ref={el => phaseRefs.current[1] = el}>
                <RoadmapPhase
                  phaseNumber={2}
                  title="Learning & Projects"
                  description="Build skills and create portfolio projects"
                  icon={<BookOpen className="h-5 w-5" />}
                  status={
                    (journeyState?.learning_plan_completed && journeyState?.project_guidance_completed) ? 'completed' :
                    getActivePhase() === 1 ? 'active' : 
                    journeyState?.career_analysis_completed ? 'active' : 'locked'
                  }
                  timeRange="Weeks 2-8"
                  isExpanded={expandedPhase === 1}
                  onToggle={() => setExpandedPhase(expandedPhase === 1 ? null : 1)}
                  progress={calculateLearningProgress()}
                >
                  {/* Learning Tasks */}
                  {learningJourneys.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Learning Plan
                      </h4>
                      <div className="space-y-3">
                        {learningJourneys.map((journey) => (
                          <Card key={journey.id} className="p-4 bg-card/50 border-border/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground">{journey.skill_name}</span>
                              <Badge variant={journey.status === 'completed' ? 'default' : 'secondary'}>
                                {journey.status === 'completed' ? 'Done' : 
                                 journey.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                              </Badge>
                            </div>
                            <Progress 
                              value={calculateJourneyProgress(journey)} 
                              className="h-1.5" 
                            />
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {projects.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <FolderKanban className="h-4 w-4" />
                        Projects
                      </h4>
                      <div className="space-y-3">
                        {projects.map((project) => (
                          <Card key={project.id} className="p-4 bg-card/50 border-border/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-foreground">{project.title}</span>
                                <p className="text-sm text-muted-foreground">{project.domain}</p>
                              </div>
                              <Badge variant={
                                project.status === 'Completed' ? 'default' : 
                                project.status === 'In Progress' ? 'secondary' : 'outline'
                              }>
                                {project.status || 'Not Started'}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {!learningJourneys.length && !projects.length && (
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">Complete career analysis to unlock</p>
                    </div>
                  )}
                </RoadmapPhase>
              </div>

              {/* Phase 3: Portfolio */}
              <div ref={el => phaseRefs.current[2] = el}>
                <RoadmapPhase
                  phaseNumber={3}
                  title="Portfolio"
                  description="Finalize resume and publish your work"
                  icon={<FileText className="h-5 w-5" />}
                  status={
                    journeyState?.resume_completed ? 'completed' :
                    getActivePhase() === 2 ? 'active' : 'locked'
                  }
                  timeRange="Week 9"
                  isExpanded={expandedPhase === 2}
                  onToggle={() => setExpandedPhase(expandedPhase === 2 ? null : 2)}
                  progress={journeyState?.resume_completed ? 100 : 
                            resumeVersions.length > 0 ? 50 : 0}
                >
                  <div className="space-y-4">
                    {resumeVersions.length > 0 ? (
                      resumeVersions.map((resume) => (
                        <Card key={resume.id} className="p-4 bg-card/50 border-border/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-foreground">{resume.version_name}</span>
                              <p className="text-sm text-muted-foreground">
                                Target: {resume.target_role || 'General'}
                              </p>
                            </div>
                            <Badge variant={resume.is_active ? 'default' : 'secondary'}>
                              {resume.is_active ? 'Active' : 'Draft'}
                            </Badge>
                          </div>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Complete learning phase to unlock</p>
                      </div>
                    )}
                    {resumeVersions.length > 0 && (
                      <Button variant="outline" className="w-full" onClick={() => navigate('/resume')}>
                        View Resume
                      </Button>
                    )}
                  </div>
                </RoadmapPhase>
              </div>

              {/* Phase 4: Ready to Market */}
              <div ref={el => phaseRefs.current[3] = el}>
                <RoadmapPhase
                  phaseNumber={4}
                  title="Ready to Market"
                  description="Prepare for interviews and assessments"
                  icon={<Users className="h-5 w-5" />}
                  status={
                    journeyState?.interview_completed ? 'completed' :
                    getActivePhase() === 3 ? 'active' : 'locked'
                  }
                  timeRange="Week 10"
                  isExpanded={expandedPhase === 3}
                  onToggle={() => setExpandedPhase(expandedPhase === 3 ? null : 3)}
                  progress={interviewPreps.length > 0 ? 
                    Math.round(interviewPreps.reduce((acc, p) => acc + p.readiness_score, 0) / interviewPreps.length) : 0}
                >
                  <div className="space-y-4">
                    {interviewPreps.length > 0 ? (
                      interviewPreps.map((prep) => (
                        <Card key={prep.id} className="p-4 bg-card/50 border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium text-foreground">{prep.role}</span>
                              <p className="text-sm text-muted-foreground">{prep.company}</p>
                            </div>
                            <Badge variant={prep.readiness_score >= 70 ? 'default' : 'secondary'}>
                              {prep.readiness_score}% Ready
                            </Badge>
                          </div>
                          <Progress value={prep.readiness_score} className="h-1.5" />
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Complete portfolio to unlock</p>
                      </div>
                    )}
                    {interviewPreps.length > 0 && (
                      <Button variant="outline" className="w-full" onClick={() => navigate('/interview')}>
                        Practice Interview
                      </Button>
                    )}
                  </div>
                </RoadmapPhase>
              </div>

              {/* Phase 5: Job Application */}
              <div ref={el => phaseRefs.current[4] = el}>
                <RoadmapPhase
                  phaseNumber={5}
                  title="Job Application"
                  description="Apply to matched jobs and track progress"
                  icon={<Briefcase className="h-5 w-5" />}
                  status={getActivePhase() === 4 ? 'active' : 'locked'}
                  timeRange="Ongoing"
                  isExpanded={expandedPhase === 4}
                  onToggle={() => setExpandedPhase(expandedPhase === 4 ? null : 4)}
                  progress={jobs.length > 0 ? Math.min(applicationsCount * 20, 100) : 0}
                  isLast
                >
                  <div className="space-y-4">
                    {jobs.length > 0 ? (
                      <>
                        {jobs.slice(0, 5).map((job) => (
                          <Card key={job.id} className="p-4 bg-card/50 border-border/50">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-foreground">{job.job_title}</span>
                                <p className="text-sm text-muted-foreground">{job.company_name}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={job.relevance_score >= 80 ? 'default' : 'secondary'}>
                                  {job.relevance_score >= 80 ? 'Ready' : 'Almost Ready'}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {Math.round(job.relevance_score)}% match
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                        <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard')}>
                          View All Jobs
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">Complete interview prep to unlock</p>
                      </div>
                    )}
                  </div>
                </RoadmapPhase>
              </div>

              {/* You Are Here Indicator */}
              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">You are here</p>
                    <p className="text-sm text-muted-foreground">
                      Phase {(getActivePhase() || 0) + 1}: {getPhaseTitle(getActivePhase() || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Progress Trackers */}
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

  function calculateLearningProgress(): number {
    if (!learningJourneys.length && !projects.length) return 0;
    
    let total = 0;
    let completed = 0;
    
    learningJourneys.forEach(j => {
      total++;
      if (j.status === 'completed') completed++;
      else if (j.status === 'in_progress') completed += 0.5;
    });
    
    projects.forEach(p => {
      total++;
      if (p.status === 'Completed') completed++;
      else if (p.status === 'In Progress') completed += 0.5;
    });
    
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }

  function calculateJourneyProgress(journey: LearningJourney): number {
    if (!journey.steps_completed?.length) return 0;
    const completed = journey.steps_completed.filter(Boolean).length;
    return Math.round((completed / journey.steps_completed.length) * 100);
  }

  function getPhaseTitle(phase: number): string {
    const titles = ['Career Analysis', 'Learning & Projects', 'Portfolio', 'Ready to Market', 'Job Application'];
    return titles[phase] || 'Unknown';
  }
}
