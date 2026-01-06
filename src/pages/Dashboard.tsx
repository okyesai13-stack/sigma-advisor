import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Target,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  FolderKanban,
  Sparkles,
  Loader2,
  ChevronRight,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Circle,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePageGuard } from "@/hooks/useJourneyState";
import { cn } from "@/lib/utils";

interface CareerRecommendation {
  career_title: string;
  confidence_score: number;
  rationale: string;
}

interface SelectedCareer {
  career_title: string;
  industry: string;
}

interface SkillValidation {
  skill_name: string;
  current_level: string;
  required_level: string;
  status: string;
}

interface LearningJourney {
  skill_name: string;
  status: string;
  steps_completed: boolean[];
  learning_steps: any[];
}

interface UserProject {
  id: string;
  status: string;
  project: {
    project_title: string;
    description: string;
    difficulty: string;
    skills_covered: string[];
  };
}

interface UserProfile {
  goal_type: string;
  goal_description: string;
  interests: string[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading: guardLoading } = usePageGuard('profile_completed', '/setup');

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [careerRecommendations, setCareerRecommendations] = useState<CareerRecommendation[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<SelectedCareer | null>(null);
  const [skills, setSkills] = useState<SkillValidation[]>([]);
  const [learningJourneys, setLearningJourneys] = useState<LearningJourney[]>([]);
  const [projects, setProjects] = useState<UserProject[]>([]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load all data in parallel
      const [
        profileRes,
        careerRes,
        selectedCareerRes,
        skillsRes,
        learningRes,
        projectsRes,
      ] = await Promise.all([
        supabase.from('users_profile').select('*').eq('id', user.id).single(),
        supabase.from('career_recommendations').select('*').eq('user_id', user.id).order('confidence_score', { ascending: false }),
        supabase.from('selected_career').select('*').eq('user_id', user.id).single(),
        supabase.from('user_skill_validation').select('*').eq('user_id', user.id),
        supabase.from('user_learning_journey').select('*').eq('user_id', user.id),
        supabase.from('user_projects').select('*, project:projects(*)').eq('user_id', user.id),
      ]);

      if (profileRes.data) {
        setProfile({
          goal_type: profileRes.data.goal_type || '',
          goal_description: profileRes.data.goal_description || '',
          interests: profileRes.data.interests || [],
        });
      }

      if (careerRes.data) {
        setCareerRecommendations(careerRes.data.map(c => ({
          career_title: c.career_title,
          confidence_score: c.confidence_score || 0,
          rationale: c.rationale || '',
        })));
      }

      if (selectedCareerRes.data) {
        setSelectedCareer({
          career_title: selectedCareerRes.data.career_title,
          industry: selectedCareerRes.data.industry || '',
        });
      }

      if (skillsRes.data) {
        setSkills(skillsRes.data.map(s => ({
          skill_name: s.skill_name,
          current_level: s.current_level || 'Beginner',
          required_level: s.required_level || 'Expert',
          status: s.status || 'gap',
        })));
      }

      if (learningRes.data) {
        setLearningJourneys(learningRes.data.map(l => ({
          skill_name: l.skill_name,
          status: l.status || 'not_started',
          steps_completed: l.steps_completed || [],
          learning_steps: Array.isArray(l.learning_steps) ? l.learning_steps : [],
        })));
      }

      if (projectsRes.data) {
        setProjects(projectsRes.data.map((p: any) => ({
          id: p.id,
          status: p.status || 'not_started',
          project: {
            project_title: p.project?.project_title || 'Unknown Project',
            description: p.project?.description || '',
            difficulty: p.project?.difficulty || 'Medium',
            skills_covered: p.project?.skills_covered || [],
          },
        })));
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const askAI = (topic: string, context: string) => {
    // Navigate to advisor with a pre-filled question
    const question = `How can I improve my ${topic}? ${context}`;
    navigate('/advisor', { state: { prefillMessage: question } });
  };

  const getProgressPercentage = () => {
    let completed = 0;
    let total = 5;

    if (profile?.goal_type) completed++;
    if (selectedCareer) completed++;
    if (skills.length > 0) completed++;
    if (learningJourneys.some(l => l.status === 'completed')) completed++;
    if (projects.some(p => p.status === 'completed')) completed++;

    return (completed / total) * 100;
  };

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'expert': return 'text-success';
      case 'advanced': return 'text-primary';
      case 'intermediate': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success border-success/20">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Not Started</Badge>;
    }
  };

  if (guardLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Loading your dashboard...</h3>
              <p className="text-sm text-muted-foreground">Gathering your career insights</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground">Career Dashboard</span>
        </div>
        <Button 
          onClick={() => navigate('/advisor')}
          className="gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Chat with AI
        </Button>
      </header>

      <ScrollArea className="h-[calc(100vh-3.5rem)]">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Overview Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Your Goal</span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {profile?.goal_type ? profile.goal_type.charAt(0).toUpperCase() + profile.goal_type.slice(1) : 'Set your career goal'}
                  </h2>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {profile?.goal_description || 'Complete your profile to set your career objectives'}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="text-3xl font-bold text-primary">{Math.round(getProgressPercentage())}%</span>
                    <span className="text-sm text-muted-foreground ml-1">complete</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="w-48 h-2" />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full bg-primary/10 hover:bg-primary/20 text-primary"
                  onClick={() => askAI('career goals', profile?.goal_description || '')}
                  title="Ask AI for advice"
                >
                  <Sparkles className="w-5 h-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="overview" className="gap-2">
                <Zap className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="skills" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Skills
              </TabsTrigger>
              <TabsTrigger value="learning" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Learning
              </TabsTrigger>
              <TabsTrigger value="projects" className="gap-2">
                <FolderKanban className="w-4 h-4" />
                Projects
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Career Path Card */}
                <Card className="group hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-primary" />
                      Career Path
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary/10 hover:bg-primary/20 text-primary h-8 w-8"
                      onClick={() => askAI('career path', selectedCareer?.career_title || '')}
                      title="Ask AI for advice"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {selectedCareer ? (
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{selectedCareer.career_title}</h3>
                          {selectedCareer.industry && (
                            <p className="text-sm text-muted-foreground">{selectedCareer.industry}</p>
                          )}
                        </div>
                        <Badge className="bg-success/10 text-success border-success/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Career Selected
                        </Badge>
                      </div>
                    ) : careerRecommendations.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Top recommendation:</p>
                        <div className="p-3 rounded-lg bg-muted/50 border border-border">
                          <h4 className="font-medium text-foreground">{careerRecommendations[0].career_title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={careerRecommendations[0].confidence_score} className="h-1.5 flex-1" />
                            <span className="text-xs text-muted-foreground">{careerRecommendations[0].confidence_score}% match</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">No career recommendations yet</p>
                        <Button variant="link" size="sm" onClick={() => navigate('/advisor')} className="mt-2">
                          Get AI Recommendations <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skills Overview Card */}
                <Card className="group hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <Award className="w-5 h-5 text-primary" />
                      Skills Assessment
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary/10 hover:bg-primary/20 text-primary h-8 w-8"
                      onClick={() => askAI('skills', skills.map(s => s.skill_name).join(', '))}
                      title="Ask AI for advice"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {skills.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{skills.filter(s => s.status === 'validated').length} of {skills.length} skills validated</span>
                          <span className="font-medium text-primary">{Math.round((skills.filter(s => s.status === 'validated').length / skills.length) * 100)}%</span>
                        </div>
                        <Progress value={(skills.filter(s => s.status === 'validated').length / skills.length) * 100} className="h-2" />
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {skills.slice(0, 5).map((skill) => (
                            <Badge 
                              key={skill.skill_name} 
                              variant={skill.status === 'validated' ? 'default' : 'secondary'}
                              className={cn(
                                "text-xs",
                                skill.status === 'validated' && "bg-success/10 text-success border-success/20"
                              )}
                            >
                              {skill.skill_name}
                            </Badge>
                          ))}
                          {skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">+{skills.length - 5} more</Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">No skills validated yet</p>
                        <Button variant="link" size="sm" onClick={() => navigate('/advisor')} className="mt-2">
                          Validate Your Skills <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Learning Progress Card */}
                <Card className="group hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      Learning Journey
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary/10 hover:bg-primary/20 text-primary h-8 w-8"
                      onClick={() => askAI('learning path', learningJourneys.map(l => l.skill_name).join(', '))}
                      title="Ask AI for advice"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {learningJourneys.length > 0 ? (
                      <div className="space-y-3">
                        {learningJourneys.slice(0, 3).map((journey) => {
                          const completedSteps = journey.steps_completed?.filter(Boolean).length || 0;
                          const totalSteps = journey.learning_steps?.length || 1;
                          const progress = (completedSteps / totalSteps) * 100;
                          
                          return (
                            <div key={journey.skill_name} className="flex items-center gap-3">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-foreground">{journey.skill_name}</span>
                                  <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                              {getStatusBadge(journey.status)}
                            </div>
                          );
                        })}
                        {learningJourneys.length > 3 && (
                          <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                            View all {learningJourneys.length} courses <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">No learning paths started</p>
                        <Button variant="link" size="sm" onClick={() => navigate('/advisor')} className="mt-2">
                          Start Learning <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Projects Card */}
                <Card className="group hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <FolderKanban className="w-5 h-5 text-primary" />
                      Projects
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary/10 hover:bg-primary/20 text-primary h-8 w-8"
                      onClick={() => askAI('projects', projects.map(p => p.project.project_title).join(', '))}
                      title="Ask AI for advice"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {projects.length > 0 ? (
                      <div className="space-y-3">
                        {projects.slice(0, 2).map((project) => (
                          <div key={project.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground text-sm">{project.project.project_title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{project.project.description}</p>
                              </div>
                              {getStatusBadge(project.status)}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{project.project.difficulty}</Badge>
                            </div>
                          </div>
                        ))}
                        {projects.length > 2 && (
                          <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                            View all {projects.length} projects <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">No projects assigned yet</p>
                        <Button variant="link" size="sm" onClick={() => navigate('/advisor')} className="mt-2">
                          Get Project Ideas <ArrowUpRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Interests Section */}
              {profile?.interests && profile.interests.length > 0 && (
                <Card className="group hover:border-primary/30 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-primary" />
                      Your Interests
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-primary/10 hover:bg-primary/20 text-primary h-8 w-8"
                      onClick={() => askAI('interests and career alignment', profile.interests.join(', '))}
                      title="Ask AI for advice"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="px-3 py-1">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              <Card className="group">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Skills Assessment
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-primary"
                    onClick={() => askAI('all my skills and how to improve them', skills.map(s => `${s.skill_name} (${s.current_level})`).join(', '))}
                  >
                    <Sparkles className="w-4 h-4" />
                    Get AI Advice
                  </Button>
                </CardHeader>
                <CardContent>
                  {skills.length > 0 ? (
                    <div className="space-y-4">
                      {skills.map((skill) => (
                        <div key={skill.skill_name} className="group/item flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-foreground">{skill.skill_name}</h4>
                              {skill.status === 'validated' ? (
                                <CheckCircle2 className="w-4 h-4 text-success" />
                              ) : (
                                <Circle className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-muted-foreground">
                                Current: <span className={cn("font-medium", getLevelColor(skill.current_level))}>{skill.current_level}</span>
                              </span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Required: <span className="font-medium text-primary">{skill.required_level}</span>
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover/item:opacity-100 transition-opacity rounded-full bg-primary/10 hover:bg-primary/20 text-primary h-8 w-8"
                            onClick={() => askAI(skill.skill_name, `Current level: ${skill.current_level}, Required: ${skill.required_level}`)}
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No skills validated yet</p>
                      <Button onClick={() => navigate('/advisor')} className="mt-4">
                        Validate Your Skills
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Learning Tab */}
            <TabsContent value="learning" className="space-y-6">
              <Card className="group">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Learning Progress
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-primary"
                    onClick={() => askAI('learning plan optimization', learningJourneys.map(l => l.skill_name).join(', '))}
                  >
                    <Sparkles className="w-4 h-4" />
                    Get AI Advice
                  </Button>
                </CardHeader>
                <CardContent>
                  {learningJourneys.length > 0 ? (
                    <div className="space-y-4">
                      {learningJourneys.map((journey) => {
                        const completedSteps = journey.steps_completed?.filter(Boolean).length || 0;
                        const totalSteps = journey.learning_steps?.length || 1;
                        const progress = (completedSteps / totalSteps) * 100;

                        return (
                          <div key={journey.skill_name} className="group/item p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center",
                                  journey.status === 'completed' ? "bg-success/10" : "bg-primary/10"
                                )}>
                                  {journey.status === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5 text-success" />
                                  ) : (
                                    <BookOpen className="w-5 h-5 text-primary" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium text-foreground">{journey.skill_name}</h4>
                                  <p className="text-sm text-muted-foreground">{completedSteps} of {totalSteps} steps completed</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(journey.status)}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="opacity-0 group-hover/item:opacity-100 transition-opacity rounded-full bg-primary/10 hover:bg-primary/20 text-primary h-8 w-8"
                                  onClick={() => askAI(`${journey.skill_name} learning`, `Progress: ${Math.round(progress)}%, Status: ${journey.status}`)}
                                >
                                  <Sparkles className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No learning paths started</p>
                      <Button onClick={() => navigate('/advisor')} className="mt-4">
                        Start Learning
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6">
              <Card className="group">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="w-5 h-5 text-primary" />
                    Your Projects
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-primary"
                    onClick={() => askAI('project portfolio', projects.map(p => p.project.project_title).join(', '))}
                  >
                    <Sparkles className="w-4 h-4" />
                    Get AI Advice
                  </Button>
                </CardHeader>
                <CardContent>
                  {projects.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {projects.map((project) => (
                        <div key={project.id} className="group/item p-4 rounded-lg bg-muted/30 border border-border hover:border-primary/30 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{project.project.project_title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.project.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover/item:opacity-100 transition-opacity rounded-full bg-primary/10 hover:bg-primary/20 text-primary h-8 w-8 shrink-0"
                              onClick={() => askAI(`${project.project.project_title} project`, project.project.description)}
                            >
                              <Sparkles className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{project.project.difficulty}</Badge>
                              {project.project.skills_covered?.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                              ))}
                            </div>
                            {getStatusBadge(project.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FolderKanban className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No projects assigned yet</p>
                      <Button onClick={() => navigate('/advisor')} className="mt-4">
                        Get Project Recommendations
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Dashboard;
