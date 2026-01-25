import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, 
  Target,
  TrendingUp,
  Clock,
  BookOpen,
  Lightbulb,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CareerRole {
  role: string;
  domain: string;
  progression_stage: string;
  timeline: string;
  match_score: number;
  salary_range: string;
}

interface SkillValidation {
  target_role: string;
  readiness_score: number;
  matched_skills: { strong: string[]; partial: string[] };
  missing_skills: string[];
}

interface LearningPlan {
  id: string;
  skill_name: string;
  career_title: string;
  learning_steps: any[];
  status: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
}

interface Job {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  relevance_score: number;
  skill_tags: string[];
}

const DashboardNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeId, goal, clearSession } = useResume();

  const [isLoading, setIsLoading] = useState(true);
  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);
  const [skillValidation, setSkillValidation] = useState<SkillValidation | null>(null);
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (!resumeId) {
      navigate('/setup');
      return;
    }
    loadData();
  }, [resumeId]);

  const loadData = async () => {
    if (!resumeId) return;
    setIsLoading(true);

    try {
      const [careerRes, skillRes, learningRes, projectRes, jobRes] = await Promise.all([
        supabase.from('career_analysis_result').select('career_roles').eq('resume_id', resumeId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('skill_validation_result').select('*').eq('resume_id', resumeId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('learning_plan_result').select('*').eq('resume_id', resumeId),
        supabase.from('project_ideas_result').select('*').eq('resume_id', resumeId),
        supabase.from('job_matching_result').select('*').eq('resume_id', resumeId).order('relevance_score', { ascending: false }),
      ]);

      if (careerRes.data?.career_roles) {
        setCareerRoles(careerRes.data.career_roles as unknown as CareerRole[]);
      }
      if (skillRes.data) {
        setSkillValidation(skillRes.data as unknown as SkillValidation);
      }
      if (learningRes.data) {
        setLearningPlans(learningRes.data as unknown as LearningPlan[]);
      }
      if (projectRes.data) {
        setProjects(projectRes.data as unknown as Project[]);
      }
      if (jobRes.data) {
        setJobs(jobRes.data as unknown as Job[]);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    clearSession();
    navigate('/');
  };

  const shortTermRole = careerRoles.find(r => r.progression_stage === 'short_term');
  const midTermRole = careerRoles.find(r => r.progression_stage === 'mid_term');
  const longTermRole = careerRoles.find(r => r.progression_stage === 'long_term');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Sigma Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-mono">
              {resumeId}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              Start Over
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Goal & Summary */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Your Career Roadmap</h1>
          <p className="text-muted-foreground">Goal: {goal}</p>
        </div>

        {/* Career Progression */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Career Progression Path
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { role: shortTermRole, icon: Clock, color: 'emerald', label: 'Short Term' },
              { role: midTermRole, icon: TrendingUp, color: 'amber', label: 'Mid Term' },
              { role: longTermRole, icon: Target, color: 'violet', label: 'Long Term' },
            ].map(({ role, icon: Icon, color, label }) => (
              <Card key={label} className={`border-l-4 border-l-${color}-500`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 text-${color}-500`} />
                    <Badge variant="outline">{label}</Badge>
                  </div>
                  {role ? (
                    <>
                      <h3 className="font-semibold">{role.role}</h3>
                      <p className="text-sm text-muted-foreground">{role.domain}</p>
                      <p className="text-sm mt-2">{role.salary_range}</p>
                      <Badge className="mt-2 bg-primary/10 text-primary">{role.match_score}% Match</Badge>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Not generated</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Skill Validation */}
        {skillValidation && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Skill Readiness for {skillValidation.target_role}
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold">{skillValidation.readiness_score}%</span>
                  <Badge variant={skillValidation.readiness_score >= 70 ? 'default' : 'secondary'}>
                    {skillValidation.readiness_score >= 70 ? 'Ready to Apply' : 'Keep Learning'}
                  </Badge>
                </div>
                <Progress value={skillValidation.readiness_score} className="h-3 mb-4" />
                
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-2">Strong Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skillValidation.matched_skills.strong.slice(0, 5).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-green-600 border-green-200 bg-green-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-2">Partial Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skillValidation.matched_skills.partial.slice(0, 5).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {(skillValidation.missing_skills as string[]).slice(0, 5).map((skill, i) => (
                        <Badge key={i} variant="outline" className="text-red-600 border-red-200 bg-red-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Learning Plans */}
        {learningPlans.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Learning Plans
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {learningPlans.map((plan) => (
                <Card key={plan.id}>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">{plan.skill_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">For: {plan.career_title}</p>
                    <Badge variant={plan.status === 'completed' ? 'default' : 'secondary'}>
                      {plan.status}
                    </Badge>
                    {plan.learning_steps && (
                      <p className="text-sm mt-2">{(plan.learning_steps as any[]).length} steps</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Project Ideas */}
        {projects.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Portfolio Projects
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                    <Badge variant="outline" className="mt-2">{project.domain}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Job Matches */}
        {jobs.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Job Matches
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {jobs.slice(0, 6).map((job) => (
                <Card key={job.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{job.job_title}</h3>
                        <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </div>
                      </div>
                      <Badge className="bg-primary/10 text-primary">{job.relevance_score}%</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.skill_tags?.slice(0, 4).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Chat with Advisor CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="py-8 text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Need More Guidance?</h2>
            <p className="text-muted-foreground mb-4">Chat with our AI Career Advisor for personalized advice</p>
            <Button onClick={() => navigate('/advisor')}>
              Chat with Advisor
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardNoAuth;
