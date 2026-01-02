import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Play,
  ExternalLink,
  Sparkles,
  GraduationCap,
  Youtube,
  Link2,
  Award,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePageGuard, useJourneyState } from "@/hooks/useJourneyState";
import { useToast } from "@/hooks/use-toast";

interface LearningStep {
  step: number;
  title: string;
  description: string;
}

interface Course {
  title: string;
  platform: string;
  link: string;
}

interface Video {
  title: string;
  creator: string;
  link: string;
}

interface LearningJourney {
  id: string;
  skill_name: string;
  career_title: string;
  learning_steps: LearningStep[];
  recommended_courses: Course[];
  recommended_videos: Video[];
  steps_completed: boolean[];
  certification_links: string[];
  status: string;
}

interface SkillToLearn {
  id: string;
  skill_name: string;
  current_level: string;
  required_level: string;
  status: string;
}

const Learn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { loading: guardLoading } = usePageGuard('skill_validated', '/advisor');
  const { updateState } = useJourneyState();

  const [skillsToLearn, setSkillsToLearn] = useState<SkillToLearn[]>([]);
  const [learningJourneys, setLearningJourneys] = useState<LearningJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [generatingSkill, setGeneratingSkill] = useState<string | null>(null);
  const [certInput, setCertInput] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load skill gaps from validation
      const { data: skillGaps, error: skillError } = await supabase
        .from('user_skill_validation')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'gap');

      if (skillError) throw skillError;

      setSkillsToLearn(skillGaps || []);

      // Load existing learning journeys
      const { data: journeys, error: journeyError } = await supabase
        .from('user_learning_journey')
        .select('*')
        .eq('user_id', user.id);

      if (journeyError) throw journeyError;

      // Type assertion for JSONB fields
      const typedJourneys = (journeys || []).map(j => ({
        ...j,
        learning_steps: (j.learning_steps as unknown as LearningStep[]) || [],
        recommended_courses: (j.recommended_courses as unknown as Course[]) || [],
        recommended_videos: (j.recommended_videos as unknown as Video[]) || [],
        steps_completed: (j.steps_completed || []) as boolean[],
        certification_links: (j.certification_links || []) as string[],
      }));

      setLearningJourneys(typedJourneys);
      // Expand first skill if exists
      if (typedJourneys.length > 0) {
        setExpandedSkill(typedJourneys[0].skill_name);
      } else if (skillGaps && skillGaps.length > 0) {
        setExpandedSkill(skillGaps[0].skill_name);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Couldn't load your learning data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startLearning = async (skillName: string) => {
    if (!user) return;

    setGeneratingSkill(skillName);

    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-plan', {
        body: { skill_name: skillName }
      });

      if (error) throw error;

      if (data?.learningJourney) {
        const journey = {
          ...data.learningJourney,
          learning_steps: data.learningJourney.learning_steps || [],
          recommended_courses: data.learningJourney.recommended_courses || [],
          recommended_videos: data.learningJourney.recommended_videos || [],
          steps_completed: data.learningJourney.steps_completed || [],
          certification_links: data.learningJourney.certification_links || [],
        };

        setLearningJourneys(prev => [...prev, journey]);
        setExpandedSkill(skillName);
        toast({
          title: "Learning Plan Created!",
          description: `Your personalized learning journey for ${skillName} is ready.`,
        });
      }
    } catch (error) {
      console.error('Error starting learning:', error);
      toast({
        title: "Error",
        description: "Couldn't generate learning plan.",
        variant: "destructive"
      });
    } finally {
      setGeneratingSkill(null);
    }
  };

  const toggleStepComplete = async (journeyId: string, stepIndex: number) => {
    const journey = learningJourneys.find(j => j.id === journeyId);
    if (!journey || !user) return;

    const newStepsCompleted = [...journey.steps_completed];
    newStepsCompleted[stepIndex] = !newStepsCompleted[stepIndex];

    try {
      const { error } = await supabase
        .from('user_learning_journey')
        .update({ steps_completed: newStepsCompleted })
        .eq('id', journeyId);

      if (error) throw error;

      setLearningJourneys(prev => prev.map(j => 
        j.id === journeyId ? { ...j, steps_completed: newStepsCompleted } : j
      ));
    } catch (error) {
      console.error('Error updating step:', error);
      toast({
        title: "Error",
        description: "Couldn't update step status.",
        variant: "destructive"
      });
    }
  };

  const addCertification = async (journeyId: string) => {
    const journey = learningJourneys.find(j => j.id === journeyId);
    const certUrl = certInput[journeyId];
    if (!journey || !user || !certUrl?.trim()) return;

    const newCertLinks = [...journey.certification_links, certUrl.trim()];

    try {
      // Check if all steps are completed
      const allStepsCompleted = journey.steps_completed.every(s => s === true);
      const newStatus = allStepsCompleted ? 'completed' : journey.status;

      const { error } = await supabase
        .from('user_learning_journey')
        .update({ 
          certification_links: newCertLinks,
          status: newStatus
        })
        .eq('id', journeyId);

      if (error) throw error;

      setLearningJourneys(prev => prev.map(j => 
        j.id === journeyId ? { ...j, certification_links: newCertLinks, status: newStatus } : j
      ));

      setCertInput(prev => ({ ...prev, [journeyId]: '' }));

      toast({
        title: "Certification Added!",
        description: allStepsCompleted ? "Skill marked as completed!" : "Keep going - complete all steps!",
      });

      // Check if all learning is done
      await checkAllLearningComplete();
    } catch (error) {
      console.error('Error adding certification:', error);
      toast({
        title: "Error",
        description: "Couldn't add certification.",
        variant: "destructive"
      });
    }
  };

  const removeCertification = async (journeyId: string, index: number) => {
    const journey = learningJourneys.find(j => j.id === journeyId);
    if (!journey || !user) return;

    const newCertLinks = journey.certification_links.filter((_, i) => i !== index);
    const newStatus = newCertLinks.length === 0 ? 'in_progress' : journey.status;

    try {
      const { error } = await supabase
        .from('user_learning_journey')
        .update({ 
          certification_links: newCertLinks,
          status: newStatus
        })
        .eq('id', journeyId);

      if (error) throw error;

      setLearningJourneys(prev => prev.map(j => 
        j.id === journeyId ? { ...j, certification_links: newCertLinks, status: newStatus } : j
      ));
    } catch (error) {
      console.error('Error removing certification:', error);
    }
  };

  const checkAllLearningComplete = async () => {
    // All skills that need learning
    const skillsNeeded = skillsToLearn.map(s => s.skill_name);
    
    // Check if all skills have completed journeys
    const completedSkills = learningJourneys.filter(j => 
      j.status === 'completed' && 
      j.steps_completed.every(s => s === true) && 
      j.certification_links.length > 0
    ).map(j => j.skill_name);

    const allComplete = skillsNeeded.every(skill => completedSkills.includes(skill));

    if (allComplete && skillsNeeded.length > 0) {
      await updateState({ learning_completed: true });
      toast({
        title: "Congratulations! 🎉",
        description: "You've completed all learning! Ready for projects!",
      });
    }
  };

  const getJourneyForSkill = (skillName: string) => {
    return learningJourneys.find(j => j.skill_name === skillName);
  };

  const getSkillProgress = (journey: LearningJourney | undefined) => {
    if (!journey) return 0;
    const stepsProgress = journey.steps_completed.filter(Boolean).length / 5 * 80;
    const certProgress = journey.certification_links.length > 0 ? 20 : 0;
    return Math.round(stepsProgress + certProgress);
  };

  const isSkillComplete = (journey: LearningJourney | undefined) => {
    if (!journey) return false;
    return journey.steps_completed.every(s => s === true) && journey.certification_links.length > 0;
  };

  const overallProgress = skillsToLearn.length > 0
    ? Math.round(
        skillsToLearn.reduce((acc, skill) => {
          const journey = getJourneyForSkill(skill.skill_name);
          return acc + getSkillProgress(journey);
        }, 0) / skillsToLearn.length
      )
    : 0;

  const completedCount = skillsToLearn.filter(s => isSkillComplete(getJourneyForSkill(s.skill_name))).length;

  if (guardLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/advisor")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Advisor
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Learning Journey</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Progress Overview */}
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Skill Development</h1>
              <p className="text-muted-foreground">
                Complete all steps and submit certifications to become job-ready
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                {completedCount}/{skillsToLearn.length}
              </div>
              <div className="text-sm text-muted-foreground">Skills Complete</div>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">{overallProgress}% overall progress</p>
        </div>

        {/* Skills List */}
        {skillsToLearn.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No skills to learn</h3>
            <p className="text-muted-foreground mb-4">
              You have no skill gaps. You're ready for projects!
            </p>
            <Button variant="hero" onClick={() => navigate('/projects')}>
              Continue to Projects
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {skillsToLearn.map((skill) => {
              const journey = getJourneyForSkill(skill.skill_name);
              const progress = getSkillProgress(journey);
              const isComplete = isSkillComplete(journey);
              const isExpanded = expandedSkill === skill.skill_name;

              return (
                <div
                  key={skill.id}
                  className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Skill Header */}
                  <button
                    onClick={() => setExpandedSkill(isExpanded ? null : skill.skill_name)}
                    className="w-full p-5 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isComplete
                            ? "bg-success"
                            : journey
                            ? "bg-gradient-hero"
                            : "bg-muted"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-6 h-6 text-success-foreground" />
                        ) : (
                          <BookOpen
                            className={`w-6 h-6 ${
                              journey ? "text-primary-foreground" : "text-muted-foreground"
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{skill.skill_name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge 
                            variant="secondary" 
                            className={
                              isComplete
                                ? "bg-success/10 text-success"
                                : journey
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground"
                            }
                          >
                            {isComplete ? "Completed" : journey ? "In Progress" : "Not Started"}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {skill.current_level} → {skill.required_level}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <Progress value={progress} className="h-2" />
                      </div>
                      <span className="text-sm font-medium text-foreground w-10">{progress}%</span>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-border">
                      {!journey ? (
                        // Start Learning Button
                        <div className="py-8 text-center">
                          <p className="text-muted-foreground mb-4">
                            Start your personalized learning journey for this skill
                          </p>
                          <Button
                            variant="hero"
                            onClick={() => startLearning(skill.skill_name)}
                            disabled={generatingSkill === skill.skill_name}
                          >
                            {generatingSkill === skill.skill_name ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Generating Plan...
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 mr-2" />
                                Start Learning
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6 pt-4">
                          {/* Learning Steps */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-primary" />
                              Learning Steps ({journey.steps_completed.filter(Boolean).length}/5)
                            </h4>
                            <div className="space-y-2">
                              {journey.learning_steps.map((step, index) => (
                                <div
                                  key={index}
                                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    journey.steps_completed[index]
                                      ? "bg-success/5 border-success/20"
                                      : "bg-muted/30 border-border hover:bg-muted/50"
                                  }`}
                                  onClick={() => toggleStepComplete(journey.id, index)}
                                >
                                  <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                    journey.steps_completed[index]
                                      ? "bg-success border-success"
                                      : "border-muted-foreground"
                                  }`}>
                                    {journey.steps_completed[index] && (
                                      <CheckCircle2 className="w-4 h-4 text-success-foreground" />
                                    )}
                                  </div>
                                  <div>
                                    <p className={`font-medium ${
                                      journey.steps_completed[index] ? "text-success" : "text-foreground"
                                    }`}>
                                      Step {step.step}: {step.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recommended Courses */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-primary" />
                              Recommended Courses
                            </h4>
                            <div className="space-y-2">
                              {journey.recommended_courses.map((course, index) => (
                                <a
                                  key={index}
                                  href={course.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                                >
                                  <div>
                                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                      {course.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{course.platform}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* Recommended Videos */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Youtube className="w-4 h-4 text-destructive" />
                              Recommended Videos
                            </h4>
                            <div className="space-y-2">
                              {journey.recommended_videos.map((video, index) => (
                                <a
                                  key={index}
                                  href={video.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
                                >
                                  <div>
                                    <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                                      {video.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{video.creator}</p>
                                  </div>
                                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-destructive" />
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* Certification Submission */}
                          <div>
                            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                              <Award className="w-4 h-4 text-warning" />
                              Certification Proof
                              {journey.certification_links.length === 0 && (
                                <Badge variant="outline" className="text-warning border-warning/30">
                                  Required
                                </Badge>
                              )}
                            </h4>
                            
                            {/* Existing Certifications */}
                            {journey.certification_links.length > 0 && (
                              <div className="space-y-2 mb-3">
                                {journey.certification_links.map((link, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 rounded-lg bg-success/10 border border-success/20"
                                  >
                                    <a
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-success hover:underline"
                                    >
                                      <Link2 className="w-4 h-4" />
                                      <span className="text-sm truncate max-w-[300px]">{link}</span>
                                    </a>
                                    <button
                                      onClick={() => removeCertification(journey.id, index)}
                                      className="p-1 hover:bg-destructive/10 rounded"
                                    >
                                      <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Certification Input */}
                            <div className="flex gap-2">
                              <Input
                                type="url"
                                placeholder="Paste your certification URL here..."
                                value={certInput[journey.id] || ''}
                                onChange={(e) => setCertInput(prev => ({ ...prev, [journey.id]: e.target.value }))}
                                className="flex-1"
                              />
                              <Button
                                onClick={() => addCertification(journey.id)}
                                disabled={!certInput[journey.id]?.trim()}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Submit at least one certification link to complete this skill
                            </p>
                          </div>

                          {/* Completion Status */}
                          {isComplete && (
                            <div className="p-4 bg-success/10 border border-success/20 rounded-lg flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-success" />
                              <div>
                                <p className="font-semibold text-success">Skill Completed!</p>
                                <p className="text-sm text-muted-foreground">
                                  All steps completed and certification submitted
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Continue Button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/projects")}
            className="gap-2"
          >
            Continue to Projects
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Learn;
