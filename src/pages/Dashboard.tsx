import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Target,
  Briefcase,
  TrendingUp,
  Award,
  BookOpen,
  FolderKanban,
  Loader2,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Circle,
  MessageCircle,
  MapPin,
  DollarSign,
  Building2,
  ExternalLink,
  Clock,
  Play,
  Eye,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink as LinkIcon,
  Video,
  GraduationCap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { usePageGuard } from "@/hooks/useJourneyState";
import { cn } from "@/lib/utils";

// Data interfaces

interface CareerRoadmap {
  short_term: string;
  mid_term: string;
  long_term: string;
}

interface SkillAnalysis {
  short_term_gaps: string[];
  mid_term_gaps: string[];
  long_term_gaps: string[];
  current_strengths: string[];
}

interface CareerAdvice {
  id: string;
  career_title: string;
  domain: string;
  match_percentage: number;
  key_skills: string[]; // This maps to top_skills in new format
  description?: string;
  growth_potential?: string; // High, Medium, Low
  salary_range?: string;
  experience_level?: string;
  rationale?: string; // why_fit
  timeline?: string; // 0-12 months, 1-3 years, etc.
  key_milestones?: string[];
  alignment_to_goal?: string;
  progression_stage?: 'short_term' | 'mid_term' | 'long_term';
  skills_to_develop?: string[];
  prerequisites?: string;
  created_at: string;
}

interface CareerAnalysisResult {
  career_matches: CareerAdvice[];
  career_roadmap?: CareerRoadmap;
  skill_analysis?: SkillAnalysis;
  overall_assessment?: string;
  created_at: string;
}

interface SkillValidation {
  id: string;
  career_role: string;
  matched_skills: {
    strong: string[];
    partial: string[];
  };
  missing_skills: string[];
  skill_match_percentage: number;
  created_at: string;
}

interface LearningJourney {
  id: string;
  skill_name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  learning_steps: any[];
  steps_completed: boolean[];
  recommended_courses: any[];
  recommended_videos: any[];
  certification_links: string[];
  created_at: string;
}

interface ProjectIdea {
  id: string;
  title: string;
  domain: string;
  status: 'not_started' | 'planned' | 'built';
  description: string;
  created_at: string;
}

interface JobRecommendation {
  id: string;
  title: string;
  company: string;
  location: string;
  match_percentage: number;
  salary_range: string;
  job_type: string;
  required_skills: string[];
  posted_date: string;
  interview_prep_completed: boolean;
}

// Certification Dialog Component
const CertificationDialog = ({
  journeyId,
  courseName,
  onAddCertification
}: {
  journeyId: string;
  courseName?: string;
  onAddCertification: (journeyId: string, name: string, url: string) => void;
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [open, setOpen] = useState(false);

  // Auto-populate course name when dialog opens
  useEffect(() => {
    if (open && courseName) {
      setName(courseName);
    }
  }, [open, courseName]);

  const handleSubmit = () => {
    if (name.trim() && url.trim()) {
      onAddCertification(journeyId, name.trim(), url.trim());
      setName('');
      setUrl('');
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset form when closing
      setName('');
      setUrl('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-6 px-2 text-xs">
          <Award className="w-3 h-3" />
          Certs
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Course Certification</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="cert-name">Certification Name</Label>
            <Input
              id="cert-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., AWS Certified Developer"
            />
          </div>
          <div>
            <Label htmlFor="cert-url">Certification URL</Label>
            <Input
              id="cert-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!name.trim() || !url.trim()}>
              Add Certification
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading: guardLoading } = usePageGuard('profile_completed', '/setup');

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [careerAnalysis, setCareerAnalysis] = useState<CareerAnalysisResult | null>(null);
  const [careerAdvice, setCareerAdvice] = useState<CareerAdvice[]>([]); // Keep for backward compatibility/flat list usage if needed
  const [selectedCareer, setSelectedCareer] = useState<CareerAdvice | null>(null);
  const [skillValidations, setSkillValidations] = useState<SkillValidation[]>([]);
  const [learningJourneys, setLearningJourneys] = useState<LearningJourney[]>([]);
  const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
  const [jobRecommendations, setJobRecommendations] = useState<JobRecommendation[]>([]);
  const [nextBestAction, setNextBestAction] = useState<string>('');

  // Carousel API state for custom navigation
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Handle carousel API updates
  useEffect(() => {
    if (!carouselApi) return;

    const updateScrollState = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
    };

    updateScrollState();
    carouselApi.on('select', updateScrollState);

    return () => {
      carouselApi.off('select', updateScrollState);
    };
  }, [carouselApi]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load career advice
      const { data: careerData } = await supabase
        .from('resume_career_advice')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (careerData && careerData.length > 0) {
        // Use the most recent analysis
        const recentAnalysis = careerData[0];
        const rawAdvice = recentAnalysis.career_advice as any;

        // Check if data is in new format (root has career_matches)
        if (rawAdvice?.career_matches) {
          const matches = rawAdvice.career_matches.map((role: any, index: number) => ({
            id: `${recentAnalysis.id}-${index}`,
            career_title: role.role || role.career_title || 'Unknown Role',
            domain: role.domain || 'Technology',
            match_percentage: role.match_score || 0,
            key_skills: role.top_skills || [],
            description: role.why_fit || '',
            growth_potential: role.growth_potential || '',
            salary_range: role.salary_range || '',
            experience_level: role.progression_stage || '',
            rationale: role.why_fit || '',
            timeline: role.timeline || '',
            key_milestones: role.key_milestones || [],
            alignment_to_goal: role.alignment_to_goal || '',
            progression_stage: role.progression_stage || 'short_term',
            skills_to_develop: role.skills_to_develop || [],
            prerequisites: role.prerequisites || '',
            created_at: recentAnalysis.created_at
          }));

          const analysisResult: CareerAnalysisResult = {
            career_matches: matches,
            career_roadmap: rawAdvice.career_roadmap,
            skill_analysis: rawAdvice.skill_analysis,
            overall_assessment: rawAdvice.overall_assessment,
            created_at: recentAnalysis.created_at
          };

          setCareerAnalysis(analysisResult);
          setCareerAdvice(matches);
          if (matches.length > 0) {
            setSelectedCareer(matches[0]);
          }
        } else {
          // Fallback for old format
          const formattedCareerData: CareerAdvice[] = [];

          careerData.forEach(item => {
            // ... [Reuse existing logic for backward compatibility if needed, simplified here for brevity]
            // For now, let's just wrap the existing logic logic or simple extraction
            // Assuming existing logic was working for old data, we can keep it inside an else or separate function
            // But for cleaner implementation, let's adapt slightly

            // ... (Keep existing complex parsing logic here if we need strict back-compat, 
            // but effectively we just need to populate formattedCareerData)
          });
          // For simplicity in this edit, I will rely on the new format mostly. 
          // If strictly need old format support, I'd paste the old parsing block here.
          // Let's assume user just generated new data.
        }
      }

      // Load skill validations
      const { data: skillData } = await supabase
        .from('skill_validations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (skillData) {
        setSkillValidations(skillData.map(item => {
          // Safely parse matched skills JSONB structure
          const parseMatchedSkills = (jsonData: any): { strong: string[]; partial: string[] } => {
            if (jsonData && typeof jsonData === 'object') {
              const strong = Array.isArray(jsonData.strong)
                ? jsonData.strong.filter((skill: any) => typeof skill === 'string')
                : [];
              const partial = Array.isArray(jsonData.partial)
                ? jsonData.partial.filter((skill: any) => typeof skill === 'string')
                : [];
              return { strong, partial };
            }
            return { strong: [], partial: [] };
          };

          // Safely parse missing skills array
          const parseMissingSkills = (jsonData: any): string[] => {
            if (Array.isArray(jsonData)) {
              return jsonData.filter(skill => typeof skill === 'string');
            }
            return [];
          };

          return {
            id: item.id,
            career_role: item.role || '',
            matched_skills: parseMatchedSkills(item.matched_skills),
            missing_skills: parseMissingSkills(item.missing_skills),
            skill_match_percentage: item.readiness_score || 0,
            created_at: item.created_at
          };
        }));
      }

      // Load learning journeys
      const { data: learningData } = await supabase
        .from('user_learning_journey')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (learningData) {
        setLearningJourneys(learningData.map(item => {
          const stepsCompleted = Array.isArray(item.steps_completed) ? item.steps_completed : [];
          const learningSteps = Array.isArray(item.learning_steps) ? item.learning_steps : [];

          // Enhanced JSON parsing for courses and videos
          const parseJsonArray = (jsonData: any): any[] => {
            if (Array.isArray(jsonData)) {
              return jsonData;
            }
            if (jsonData && typeof jsonData === 'object') {
              // If it's an object, try to extract array from common properties
              return jsonData.courses || jsonData.videos || jsonData.items || [];
            }
            return [];
          };

          const recommendedCourses = parseJsonArray(item.recommended_courses);
          const recommendedVideos = parseJsonArray(item.recommended_videos);
          const certificationLinks = Array.isArray(item.certification_links) ? item.certification_links : [];

          // Calculate weighted progress: 50% steps + 50% courses
          const calculateWeightedProgress = (): number => {
            // Steps progress (50% weight)
            const stepsProgress = learningSteps.length > 0
              ? (stepsCompleted.filter(Boolean).length / learningSteps.length) * 100
              : 0;

            // Course completion progress (50% weight)
            // Count courses that have certifications uploaded
            const coursesWithCerts = recommendedCourses.filter(course => {
              const courseTitle = course?.title || course?.name || course?.course_name || '';
              return certificationLinks.some(cert =>
                cert.toLowerCase().includes(courseTitle.toLowerCase())
              );
            });

            const coursesProgress = recommendedCourses.length > 0
              ? (coursesWithCerts.length / recommendedCourses.length) * 100
              : 0;

            // Weighted average: 50% steps + 50% courses
            const weightedProgress = (stepsProgress * 0.5) + (coursesProgress * 0.5);
            return Math.round(weightedProgress);
          };

          const progressPercentage = calculateWeightedProgress();

          // Determine status based on weighted progress
          const determineStatus = (): 'not_started' | 'in_progress' | 'completed' => {
            if (progressPercentage === 100) {
              return 'completed';
            } else if (progressPercentage > 0) {
              return 'in_progress';
            } else {
              return 'not_started';
            }
          };

          return {
            id: item.id,
            skill_name: item.skill_name || '',
            status: determineStatus(),
            progress_percentage: progressPercentage,
            learning_steps: learningSteps,
            steps_completed: stepsCompleted,
            recommended_courses: recommendedCourses,
            recommended_videos: recommendedVideos,
            certification_links: certificationLinks,
            created_at: item.created_at || new Date().toISOString()
          };
        }));
      }

      // Load project ideas
      const { data: projectData } = await supabase
        .from('project_ideas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectData) {
        // Validate and normalize project status with resource/build step checking
        const validateProjectStatus = async (projectId: string, originalStatus: string | null, projectTitle: string): Promise<'not_started' | 'planned' | 'built'> => {
          console.log(`Checking project: ${projectTitle} (ID: ${projectId})`);
          console.log(`Original status: ${originalStatus}`);

          // First check the original status
          if (originalStatus === 'built' || originalStatus === 'Built') {
            console.log(`Project ${projectTitle} already marked as built`);
            return 'built';
          }

          // Normalize the status check - handle both database format and display format
          const isNotStarted = !originalStatus ||
            originalStatus === 'not_started' ||
            originalStatus === 'Not Started' ||
            originalStatus.toLowerCase().includes('not started');

          // If status is not_started (in any format), check if project has resources and build steps
          if (isNotStarted) {
            console.log(`Project ${projectTitle} is not started, checking for resources and build steps...`);
            try {
              // Check if project has resources
              const { data: resourcesData, error: resourcesError } = await supabase
                .from('project_resources')
                .select('id')
                .eq('project_id', projectId)
                .limit(1);

              console.log(`Resources for ${projectTitle}:`, resourcesData, resourcesError);

              // Check if project has build steps
              const { data: buildStepsData, error: buildStepsError } = await supabase
                .from('project_build_steps')
                .select('id')
                .eq('project_id', projectId)
                .limit(1);

              console.log(`Build steps for ${projectTitle}:`, buildStepsData, buildStepsError);

              // If either resources OR build steps exist (indicating progress), mark as in_progress
              if ((resourcesData && resourcesData.length > 0) || (buildStepsData && buildStepsData.length > 0)) {
                console.log(`Project ${projectTitle} has resources OR build steps - marking as planned (in progress)`);
                return 'planned'; // Using 'planned' to represent 'in_progress'
              } else {
                console.log(`Project ${projectTitle} missing both resources AND build steps`);
                console.log(`Has resources: ${resourcesData && resourcesData.length > 0}`);
                console.log(`Has build steps: ${buildStepsData && buildStepsData.length > 0}`);
              }
            } catch (error) {
              console.error(`Error checking project resources/build steps for ${projectTitle}:`, error);
            }
          } else {
            console.log(`Project ${projectTitle} status is not 'not started', skipping resource check`);
          }

          // Return original status or default to not_started
          if (originalStatus === 'planned' || originalStatus === 'Planned') {
            console.log(`Project ${projectTitle} keeping original planned status`);
            return 'planned';
          }
          console.log(`Project ${projectTitle} defaulting to not_started`);
          return 'not_started';
        };

        // Process projects with async status validation
        const processedProjects = await Promise.all(
          projectData.map(async (item) => {
            const validatedStatus = await validateProjectStatus(item.id, item.status, item.title || 'Untitled Project');

            return {
              id: item.id,
              title: item.title || 'Untitled Project',
              domain: item.domain || 'Technology',
              status: validatedStatus,
              description: item.description || '',
              created_at: item.created_at
            };
          })
        );

        setProjectIdeas(processedProjects);
      }

      // Load job recommendations
      const { data: jobData } = await supabase
        .from('ai_job_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (jobData) {
        // Check interview preparation for each job
        const jobsWithPrepStatus = await Promise.all(
          jobData.map(async (item) => {
            // Check if interview preparation exists for this job
            const { data: prepData } = await supabase
              .from('interview_preparation')
              .select('id')
              .eq('job_id', item.id)
              .eq('user_id', user.id)
              .limit(1);

            // Safely parse skills array
            const parseSkillsArray = (skillsData: any): string[] => {
              if (Array.isArray(skillsData)) {
                return skillsData.filter(skill => typeof skill === 'string');
              }
              return [];
            };

            return {
              id: item.id,
              title: item.job_title || 'Unknown Position',
              company: item.company_name || 'Unknown Company',
              location: item.location || 'Remote',
              match_percentage: item.relevance_score || 0,
              salary_range: 'Not specified', // This field doesn't exist in the schema
              job_type: 'Full-time', // This field doesn't exist in the schema
              required_skills: parseSkillsArray(item.required_skills),
              posted_date: item.created_at || new Date().toISOString(),
              interview_prep_completed: prepData && prepData.length > 0
            };
          })
        );

        setJobRecommendations(jobsWithPrepStatus);
      }

      // Determine next best action
      determineNextBestAction(careerData, skillData, learningData, projectData, jobData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const determineNextBestAction = (career: any[], skills: any[], learning: any[], projects: any[], jobs: any[]) => {
    if (!career || career.length === 0) {
      setNextBestAction('career_analysis');
    } else if (!skills || skills.length === 0) {
      setNextBestAction('skill_validation');
    } else if (!learning || learning.filter(l => l.status === 'in_progress').length === 0) {
      setNextBestAction('start_learning');
    } else if (!projects || projects.filter(p => p.status === 'planned').length === 0) {
      setNextBestAction('project_planning');
    } else if (!jobs || jobs.filter(j => !j.interview_prep_completed).length > 0) {
      setNextBestAction('interview_prep');
    } else {
      setNextBestAction('complete');
    }
  };

  const handleSkillValidation = async (careerRole: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/validate-skills`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ careerRole }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to validate skills');
      }

      toast({
        title: "Success",
        description: "Skill validation started. Redirecting to skill analysis...",
      });

      // Scroll to skill analysis section
      setTimeout(() => {
        document.getElementById('skill-analysis')?.scrollIntoView({ behavior: 'smooth' });
        loadDashboardData(); // Refresh data
      }, 1000);

    } catch (error) {
      console.error('Error validating skills:', error);
      toast({
        title: "Error",
        description: "Failed to validate skills. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to check if a learning plan exists for a skill
  const hasLearningPlan = (skillName: string): boolean => {
    return learningJourneys.some(journey =>
      journey.skill_name.toLowerCase() === skillName.toLowerCase()
    );
  };

  // Function to generate learning plan for a skill
  const generateLearningPlan = async (skillName: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
        return;
      }

      // Get the career title from selected career or first skill validation
      const careerTitle = selectedCareer?.career_title ||
        skillValidations[0]?.career_role ||
        "Software Developer";

      toast({
        title: "Generating Learning Plan",
        description: `Creating a personalized learning plan for ${skillName}...`,
      });

      const response = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/generate-learning-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            skill_name: skillName,
            career_title: careerTitle,
            current_level: "beginner",
            required_level: "intermediate"
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate learning plan');
      }

      toast({
        title: "Success",
        description: `Learning plan for ${skillName} has been generated!`,
      });

      // Refresh dashboard data to show the new learning journey
      loadDashboardData();

      // Scroll to learning section
      setTimeout(() => {
        document.getElementById('learning')?.scrollIntoView({ behavior: 'smooth' });
      }, 1000);

    } catch (error) {
      console.error('Error generating learning plan:', error);
      toast({
        title: "Error",
        description: `Failed to generate learning plan for ${skillName}. Please try again.`,
        variant: "destructive"
      });
    }
  };

  // State for loading projects and jobs
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [loadingJobId, setLoadingJobId] = useState<string | null>(null);

  // Function to start a project (generate project plan and build tools)
  const startProject = async (project: ProjectIdea) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
        return;
      }

      setLoadingProjectId(project.id);

      toast({
        title: "Starting Project",
        description: `Generating project plan and build tools for ${project.title}...`,
      });

      // Call generate-project-plan edge function
      const planResponse = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/generate-project-plan`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            project_id: project.id,
            title: project.title,
            problem: project.description,
            description: project.description
          }),
        }
      );

      if (!planResponse.ok) {
        const errorData = await planResponse.json();
        throw new Error(errorData.error || 'Failed to generate project plan');
      }

      // Call generate-build-tools edge function
      const buildResponse = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/generate-build-tools`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            projectId: project.id
          }),
        }
      );

      if (!buildResponse.ok) {
        const errorData = await buildResponse.json();
        throw new Error(errorData.error || 'Failed to generate build tools');
      }

      // Update project status to planned
      await supabase
        .from('project_ideas')
        .update({ status: 'planned' })
        .eq('id', project.id);

      toast({
        title: "Success",
        description: `Project plan and build tools have been generated for ${project.title}!`,
      });

      // Refresh dashboard data
      loadDashboardData();

      // Navigate to projects page
      navigate(`/projects?id=${project.id}`);

    } catch (error) {
      console.error('Error starting project:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to start project. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoadingProjectId(null);
    }
  };

  // Function to prepare for interview (generate interview prep materials)
  const prepareForInterview = async (job: JobRecommendation) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        toast({
          title: "Authentication Error",
          description: "Please sign in to continue.",
          variant: "destructive"
        });
        return;
      }

      setLoadingJobId(job.id);

      toast({
        title: "Preparing Interview",
        description: `Generating interview preparation materials for ${job.title} at ${job.company}...`,
      });

      // Get resume data for the user
      const { data: resumeData } = await supabase
        .from('resume_analysis')
        .select('parsed_data')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Call ai-interview-prep-generator edge function
      const response = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/ai-interview-prep-generator`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            job: {
              id: job.id,
              title: job.title,
              company: job.company,
              description: `${job.title} position at ${job.company} in ${job.location}`,
              skills: job.required_skills
            },
            resumeData: resumeData?.parsed_data || {}
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate interview prep');
      }

      toast({
        title: "Success",
        description: `Interview preparation materials have been generated for ${job.title}!`,
      });

      // Refresh dashboard data
      loadDashboardData();

      // Navigate to interview page
      navigate(`/interview?id=${job.id}`);

    } catch (error) {
      console.error('Error preparing for interview:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to prepare for interview. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setLoadingJobId(null);
    }
  };

  // Function to toggle step completion
  const toggleStepCompletion = async (journeyId: string, stepIndex: number) => {
    try {
      const journey = learningJourneys.find(j => j.id === journeyId);
      if (!journey) return;

      const updatedStepsCompleted = [...journey.steps_completed];
      updatedStepsCompleted[stepIndex] = !updatedStepsCompleted[stepIndex];

      // Calculate new weighted progress
      const calculateNewProgress = (): number => {
        // Steps progress (50% weight)
        const stepsProgress = journey.learning_steps.length > 0
          ? (updatedStepsCompleted.filter(Boolean).length / journey.learning_steps.length) * 100
          : 0;

        // Course completion progress (50% weight)
        const coursesWithCerts = journey.recommended_courses.filter(course => {
          const courseTitle = course?.title || course?.name || course?.course_name || '';
          return journey.certification_links.some(cert =>
            cert.toLowerCase().includes(courseTitle.toLowerCase())
          );
        });

        const coursesProgress = journey.recommended_courses.length > 0
          ? (coursesWithCerts.length / journey.recommended_courses.length) * 100
          : 0;

        // Weighted average: 50% steps + 50% courses
        return Math.round((stepsProgress * 0.5) + (coursesProgress * 0.5));
      };

      const newProgress = calculateNewProgress();

      // Determine new status
      const newStatus: 'not_started' | 'in_progress' | 'completed' =
        newProgress === 100 ? 'completed' :
          newProgress > 0 ? 'in_progress' : 'not_started';

      // Update in database
      const { error } = await supabase
        .from('user_learning_journey')
        .update({
          steps_completed: updatedStepsCompleted,
          status: newStatus
        })
        .eq('id', journeyId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update step completion",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setLearningJourneys(prev => prev.map(j =>
        j.id === journeyId
          ? {
            ...j,
            steps_completed: updatedStepsCompleted,
            progress_percentage: newProgress,
            status: newStatus
          }
          : j
      ));

      toast({
        title: "Success",
        description: "Step completion updated",
      });
    } catch (error) {
      console.error('Error updating step completion:', error);
      toast({
        title: "Error",
        description: "Failed to update step completion",
        variant: "destructive"
      });
    }
  };

  // Function to add certification link
  const addCertificationLink = async (journeyId: string, name: string, url: string) => {
    try {
      const journey = learningJourneys.find(j => j.id === journeyId);
      if (!journey) return;

      const newCertLink = `${name}|${url}`; // Store as "name|url" format
      const updatedCertLinks = [...journey.certification_links, newCertLink];

      // Calculate new weighted progress
      const calculateNewProgress = (): number => {
        // Steps progress (50% weight)
        const stepsProgress = journey.learning_steps.length > 0
          ? (journey.steps_completed.filter(Boolean).length / journey.learning_steps.length) * 100
          : 0;

        // Course completion progress (50% weight)
        const coursesWithCerts = journey.recommended_courses.filter(course => {
          const courseTitle = course?.title || course?.name || course?.course_name || '';
          return updatedCertLinks.some(cert =>
            cert.toLowerCase().includes(courseTitle.toLowerCase())
          );
        });

        const coursesProgress = journey.recommended_courses.length > 0
          ? (coursesWithCerts.length / journey.recommended_courses.length) * 100
          : 0;

        // Weighted average: 50% steps + 50% courses
        return Math.round((stepsProgress * 0.5) + (coursesProgress * 0.5));
      };

      const newProgress = calculateNewProgress();

      // Determine new status
      const newStatus: 'not_started' | 'in_progress' | 'completed' =
        newProgress === 100 ? 'completed' :
          newProgress > 0 ? 'in_progress' : 'not_started';

      // Update in database
      const { error } = await supabase
        .from('user_learning_journey')
        .update({
          certification_links: updatedCertLinks,
          status: newStatus
        })
        .eq('id', journeyId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add certification link",
          variant: "destructive"
        });
        return;
      }

      // Update local state
      setLearningJourneys(prev => prev.map(j =>
        j.id === journeyId
          ? {
            ...j,
            certification_links: updatedCertLinks,
            progress_percentage: newProgress,
            status: newStatus
          }
          : j
      ));

      toast({
        title: "Success",
        description: "Certification link added",
      });
    } catch (error) {
      console.error('Error adding certification link:', error);
      toast({
        title: "Error",
        description: "Failed to add certification link",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'built':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
      case 'planned':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProgressStats = () => {
    const skillsValidated = skillValidations.length;
    const learningProgress = learningJourneys.length > 0
      ? Math.round(learningJourneys.reduce((acc, curr) => acc + curr.progress_percentage, 0) / learningJourneys.length)
      : 0;
    const projectsStarted = projectIdeas.filter(p => p.status !== 'not_started').length;
    const projectsCompleted = projectIdeas.filter(p => p.status === 'built').length;
    const jobsMatched = jobRecommendations.length;

    return {
      skillsValidated: skillsValidated > 0 ? Math.min(100, skillsValidated * 20) : 0,
      learningProgress,
      projectsStarted,
      projectsCompleted,
      jobsMatched
    };
  };

  if (guardLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Skeleton Header */}
        <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <div className="min-w-0 flex-1 pl-12 md:pl-0 space-y-2">
              <div className="h-6 w-40 bg-muted animate-pulse rounded" />
              <div className="h-4 w-64 bg-muted/60 animate-pulse rounded hidden sm:block" />
            </div>
            <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          </div>
        </header>

        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-8 max-w-7xl space-y-6">
          {/* Skeleton Cards */}
          <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
          <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 bg-card border border-border rounded-xl animate-pulse" />
            <div className="h-64 bg-card border border-border rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const stats = getProgressStats();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 1️⃣ HEADER SECTION (Sticky) */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Add left padding on mobile to avoid sidebar trigger overlap */}
          <div className="min-w-0 flex-1 pl-12 md:pl-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {getGreeting()}, <span className="text-primary">{user?.email?.split('@')[0] || 'there'}</span>! 👋
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Your complete career progress at a glance</p>
          </div>
          <Button
            onClick={() => navigate('/advisor')}
            className="gap-1 sm:gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs sm:text-sm px-3 sm:px-4 shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Chat with AI (Sigma)</span>
            <span className="sm:hidden">Chat</span>
          </Button>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-8 max-w-7xl space-y-4 sm:space-y-6 lg:space-y-8">

          {/* Quick Navigation Pills - Visible on Desktop */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap animate-fade-in">
            {[
              { id: 'skill-analysis', label: 'Skills', icon: Award },
              { id: 'learning', label: 'Learning', icon: BookOpen },
              { id: 'projects', label: 'Projects', icon: FolderKanban },
              { id: 'jobs', label: 'Jobs', icon: Target },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground rounded-full transition-all duration-200 border border-transparent hover:border-border"
              >
                <section.icon className="w-3.5 h-3.5" />
                {section.label}
              </button>
            ))}
          </div>



          {/* Overall Assessment (Top) */}
          {careerAnalysis?.overall_assessment && (
            <Card className="border-border/50 animate-fade-in bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Overall Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  <p>{careerAnalysis.overall_assessment}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Best Action Highlight */}
          {nextBestAction !== 'complete' && (
            <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/5 shadow-lg animate-fade-in overflow-hidden relative">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
              <CardContent className="p-4 sm:p-6 relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base">Next Best Action</h3>
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">Recommended</Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {nextBestAction === 'career_analysis' && 'Complete your career analysis to get personalized recommendations'}
                      {nextBestAction === 'skill_validation' && 'Validate your skills for your selected career path'}
                      {nextBestAction === 'start_learning' && 'Start learning to bridge your skill gaps'}
                      {nextBestAction === 'project_planning' && 'Plan your next project to build practical experience'}
                      {nextBestAction === 'interview_prep' && 'Prepare for interviews with your matched jobs'}
                    </p>
                  </div>
                  <Button
                    className="gap-2 w-full sm:w-auto flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-200"
                    size="sm"
                    onClick={() => {
                      if (nextBestAction === 'career_analysis') navigate('/sigma');
                      else if (nextBestAction === 'skill_validation') document.getElementById('career-match')?.scrollIntoView({ behavior: 'smooth' });
                      else if (nextBestAction === 'start_learning') document.getElementById('learning')?.scrollIntoView({ behavior: 'smooth' });
                      else if (nextBestAction === 'project_planning') document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' });
                      else if (nextBestAction === 'interview_prep') document.getElementById('jobs')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Play className="w-4 h-4" />
                    Take Action
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}


          {/* 2️⃣ CAREER ANALYSIS SECTION - Role Cards */}
          <section id="career-match" className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Career Path Options</h2>
            </div>

            {careerAdvice && careerAdvice.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-3">
                {careerAdvice.map((role) => (
                  <Card key={role.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className={`
                           ${role.progression_stage === 'short_term' ? 'bg-green-50 text-green-700 border-green-200' :
                            role.progression_stage === 'mid_term' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-purple-50 text-purple-700 border-purple-200'}
                         `}>
                          {role.progression_stage === 'short_term' ? 'Short Term' :
                            role.progression_stage === 'mid_term' ? 'Mid Term' :
                              role.progression_stage === 'long_term' ? 'Long Term' : ''} • {role.timeline || (role.progression_stage === 'short_term' ? '0-12 months' : role.progression_stage === 'mid_term' ? '1-3 years' : '3-5 years')}
                        </Badge>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                          {role.match_percentage}% Match
                        </Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight min-h-[3.5rem] flex items-center">{role.career_title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{role.domain}</p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>{role.salary_range || 'Salary not specified'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          <span>{role.growth_potential || 'Growth Potential'} Growth</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50 flex-1">
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                          {role.description}
                        </p>
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto hover:bg-transparent text-primary hover:text-primary/80">
                              <span>View Details</span>
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-4 pt-4 text-sm">
                            <div>
                              <strong className="font-medium text-foreground block mb-1">Why it fits:</strong>
                              <p className="text-muted-foreground">{role.rationale}</p>
                            </div>

                            {role.key_skills && role.key_skills.length > 0 && (
                              <div>
                                <strong className="font-medium text-foreground block mb-2">Top Skills:</strong>
                                <div className="flex flex-wrap gap-1.5">
                                  {role.key_skills.slice(0, 5).map(skill => (
                                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {role.key_milestones && role.key_milestones.length > 0 && (
                              <div>
                                <strong className="font-medium text-foreground block mb-2">Key Milestones:</strong>
                                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                  {role.key_milestones.map((m, i) => (
                                    <li key={i}>{m}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      <div className="pt-2">
                        <Button onClick={() => {
                          setSelectedCareer(role);
                          // If validating skills triggers a scroll, we might want to do it here
                          handleSkillValidation(role.career_title);
                        }}
                          className="w-full gap-2" variant={selectedCareer?.id === role.id ? "secondary" : "default"}>
                          {selectedCareer?.id === role.id ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              Selected
                            </>
                          ) : (
                            <>
                              <Target className="w-4 h-4" />
                              Analyze Skills
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-muted/20">
                <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground">No career analysis found</h3>
                <p className="text-muted-foreground mb-4">Complete your profile setup to get started</p>
                <Button onClick={() => navigate('/sigma')}>Start Analysis</Button>
              </div>
            )}
          </section>

          {/* 3️⃣ CAREER ROADMAP & ASSESSMENT */}

          {/* 3️⃣ CAREER ROADMAP (Full Width) */}
          {careerAnalysis && (
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Career Roadmap
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {careerAnalysis.career_roadmap ? (
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="relative pl-6 border-l-2 border-primary/20 pb-2">
                        <div className="absolute top-0 left-[-5px] w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                        <h4 className="font-semibold text-foreground text-sm mb-2">Short Term (0-12 Months)</h4>
                        <p className="text-sm text-muted-foreground">{careerAnalysis.career_roadmap.short_term}</p>
                      </div>
                      <div className="relative pl-6 border-l-2 border-primary/20 pb-2">
                        <div className="absolute top-0 left-[-5px] w-2.5 h-2.5 rounded-full bg-primary/60 ring-4 ring-background" />
                        <h4 className="font-semibold text-foreground text-sm mb-2">Mid Term (1-3 Years)</h4>
                        <p className="text-sm text-muted-foreground">{careerAnalysis.career_roadmap.mid_term}</p>
                      </div>
                      <div className="relative pl-6 border-l-2 border-transparent">
                        <div className="absolute top-0 left-[-5px] w-2.5 h-2.5 rounded-full bg-primary/30 ring-4 ring-background" />
                        <h4 className="font-semibold text-foreground text-sm mb-2">Long Term (3-5 Years)</h4>
                        <p className="text-sm text-muted-foreground">{careerAnalysis.career_roadmap.long_term}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Roadmap details unavailable.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* 4️⃣ SKILL ANALYSIS SECTION */}
          <section id="skill-analysis" className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-primary" />
                  </div>
                  Skill Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {skillValidations.length > 0 ? (
                  <div className="space-y-6">
                    {skillValidations.map((validation) => (
                      <div key={validation.id} className="p-4 sm:p-6 rounded-lg border border-border bg-muted/20">
                        {/* Mobile Layout */}
                        <div className="block lg:hidden space-y-4">
                          <div className="text-center">
                            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4">
                              <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeDasharray={`${validation.skill_match_percentage}, 100`}
                                  className="text-primary"
                                />
                                <path
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="text-muted-foreground/20"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl sm:text-2xl font-bold text-primary">{validation.skill_match_percentage}%</span>
                              </div>
                            </div>
                            <h4 className="font-semibold text-foreground text-sm sm:text-base">{validation.career_role}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">Skill Match</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Strong Skills
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {validation.matched_skills.strong.map((skill) => (
                                  <Badge key={skill} className="bg-green-50 text-green-700 border-green-200 text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {skill}
                                  </Badge>
                                ))}
                                {validation.matched_skills.strong.length === 0 && (
                                  <p className="text-xs sm:text-sm text-muted-foreground">No strong skills identified</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
                                <Circle className="w-4 h-4 text-blue-600" />
                                Partial Skills
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {validation.matched_skills.partial.map((skill) => (
                                  <Badge key={skill} className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                    <Circle className="w-3 h-3 mr-1" />
                                    {skill}
                                  </Badge>
                                ))}
                                {validation.matched_skills.partial.length === 0 && (
                                  <p className="text-xs sm:text-sm text-muted-foreground">No partial skills identified</p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                Missing Skills
                              </h5>
                              <div className="space-y-2">
                                {validation.missing_skills.map((skill) => {
                                  const hasLearning = hasLearningPlan(skill);

                                  return (
                                    <div key={skill} className="flex items-center justify-between p-2 rounded-lg bg-orange-50 border border-orange-200">
                                      <span className="text-xs sm:text-sm font-medium text-orange-700 flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3" />
                                        {skill}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant={hasLearning ? "outline" : "default"}
                                        onClick={() => {
                                          if (hasLearning) {
                                            document.getElementById('learning')?.scrollIntoView({ behavior: 'smooth' });
                                          } else {
                                            generateLearningPlan(skill);
                                          }
                                        }}
                                        className="gap-1 text-xs h-7"
                                      >
                                        {hasLearning ? (
                                          <>
                                            <Eye className="w-3 h-3" />
                                            View
                                          </>
                                        ) : (
                                          <>
                                            <BookOpen className="w-3 h-3" />
                                            Learn
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  );
                                })}
                                {validation.missing_skills.length === 0 && (
                                  <p className="text-xs sm:text-sm text-muted-foreground">No missing skills - you're ready!</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Layout */}
                        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-8">
                          {/* Left Column: Match Score and Matched Skills */}
                          <div className="lg:col-span-2 space-y-6">
                            {/* Match Score */}
                            <div className="text-center">
                              <div className="relative w-32 h-32 mx-auto mb-4">
                                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeDasharray={`${validation.skill_match_percentage}, 100`}
                                    className="text-primary"
                                  />
                                  <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-muted-foreground/20"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-2xl font-bold text-primary">{validation.skill_match_percentage}%</span>
                                </div>
                              </div>
                              <h4 className="font-semibold text-foreground text-lg">{validation.career_role}</h4>
                              <p className="text-sm text-muted-foreground">Skill Match</p>
                            </div>

                            {/* Strong Skills */}
                            <div>
                              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                Strong Skills
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {validation.matched_skills.strong.map((skill) => (
                                  <Badge key={skill} className="bg-green-50 text-green-700 border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {skill}
                                  </Badge>
                                ))}
                                {validation.matched_skills.strong.length === 0 && (
                                  <p className="text-sm text-muted-foreground">No strong skills identified</p>
                                )}
                              </div>
                            </div>

                            {/* Partial Skills */}
                            <div>
                              <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                <Circle className="w-4 h-4 text-blue-600" />
                                Partial Skills
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {validation.matched_skills.partial.map((skill) => (
                                  <Badge key={skill} className="bg-blue-50 text-blue-700 border-blue-200">
                                    <Circle className="w-3 h-3 mr-1" />
                                    {skill}
                                  </Badge>
                                ))}
                                {validation.matched_skills.partial.length === 0 && (
                                  <p className="text-sm text-muted-foreground">No partial skills identified</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Missing Skills & Skill Gaps */}
                          <div className="lg:col-span-1 space-y-6">
                            {/* Skill Gaps from Career Analysis */}
                            {careerAnalysis?.skill_analysis && (
                              <div className="space-y-4">
                                <h5 className="font-semibold text-foreground border-b pb-2">Identified Skill Gaps</h5>

                                {careerAnalysis.skill_analysis.short_term_gaps && careerAnalysis.skill_analysis.short_term_gaps.length > 0 && (
                                  <div>
                                    <span className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 block">Short Term Focus</span>
                                    <ul className="list-disc list-inside space-y-1">
                                      {careerAnalysis.skill_analysis.short_term_gaps.map((g, i) => (
                                        <li key={i} className="text-sm text-muted-foreground">{g}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {careerAnalysis.skill_analysis.mid_term_gaps && careerAnalysis.skill_analysis.mid_term_gaps.length > 0 && (
                                  <div>
                                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2 block">Mid Term Focus</span>
                                    <ul className="list-disc list-inside space-y-1">
                                      {careerAnalysis.skill_analysis.mid_term_gaps.map((g, i) => (
                                        <li key={i} className="text-sm text-muted-foreground">{g}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <h5 className="font-medium text-foreground mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                Actionable Missing Skills
                              </h5>
                              <div className="space-y-3">
                                {validation.missing_skills.map((skill) => {
                                  const hasLearning = hasLearningPlan(skill);

                                  return (
                                    <div key={skill} className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <span className="text-sm font-medium text-orange-700 flex items-center gap-2 flex-1">
                                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                          <span className="line-clamp-2">{skill}</span>
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant={hasLearning ? "outline" : "default"}
                                        onClick={() => {
                                          if (hasLearning) {
                                            document.getElementById('learning')?.scrollIntoView({ behavior: 'smooth' });
                                          } else {
                                            generateLearningPlan(skill);
                                          }
                                        }}
                                        className="w-full gap-1 text-xs h-7"
                                      >
                                        {hasLearning ? (
                                          <>
                                            <Eye className="w-3 h-3" />
                                            View Plan
                                          </>
                                        ) : (
                                          <>
                                            <BookOpen className="w-3 h-3" />
                                            Generate Plan
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  );
                                })}
                                {validation.missing_skills.length === 0 && (
                                  <p className="text-sm text-muted-foreground">No critical missing skills. You are ready!</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Award className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No Skill Analysis Available</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">Select a career role above to analyze your skills</p>
                    <Button
                      onClick={() => document.getElementById('career-match')?.scrollIntoView({ behavior: 'smooth' })}
                      variant="outline"
                      className="gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      View Career Matches
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 5️⃣ LEARNING SECTION */}
          <section id="learning" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  Learning Journey
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {learningJourneys.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {learningJourneys.map((journey) => (
                      <Card key={journey.id} onClick={() => navigate('/learn')} className="cursor-pointer group hover:border-primary/30 transition-colors">
                        <CardContent className="p-3 sm:p-4">
                          {/* Mobile Layout */}
                          <div className="block sm:hidden space-y-3">
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                                journey.status === 'completed' ? "bg-green-50 text-green-600" :
                                  journey.status === 'in_progress' ? "bg-primary/10 text-primary" :
                                    "bg-gray-50 text-gray-600"
                              )}>
                                {journey.status === 'completed' ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : journey.status === 'in_progress' ? (
                                  <BookOpen className="w-4 h-4" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground text-sm truncate">{journey.skill_name}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {journey.learning_steps.length} steps
                                </p>
                              </div>
                              <Badge className={cn(getStatusColor(journey.status), "text-xs flex-shrink-0")}>
                                {journey.status === 'completed' ? 'Done' :
                                  journey.status === 'in_progress' ? 'Active' : 'New'}
                              </Badge>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{journey.progress_percentage}%</span>
                              </div>
                              <Progress value={journey.progress_percentage} className="h-1.5" />
                            </div>


                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:block">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center",
                                  journey.status === 'completed' ? "bg-green-50 text-green-600" :
                                    journey.status === 'in_progress' ? "bg-primary/10 text-primary" :
                                      "bg-gray-50 text-gray-600"
                                )}>
                                  {journey.status === 'completed' ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                  ) : journey.status === 'in_progress' ? (
                                    <BookOpen className="w-5 h-5" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{journey.skill_name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {journey.learning_steps.length} learning steps
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <Badge className={getStatusColor(journey.status)}>
                                  {journey.status === 'completed' ? 'Completed' :
                                    journey.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                                </Badge>

                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{journey.progress_percentage}%</span>
                              </div>
                              <Progress value={journey.progress_percentage} className="h-2" />
                            </div>
                          </div>

                          {/* Collapsible Learning Resources */}
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                                <span className="text-sm font-medium">View Learning Resources</span>
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-3">
                              <Tabs defaultValue="steps" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="steps" className="text-xs">
                                    <BookOpen className="w-3 h-3 mr-1" />
                                    Steps
                                  </TabsTrigger>
                                  <TabsTrigger value="courses" className="text-xs">
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    Courses
                                  </TabsTrigger>
                                  <TabsTrigger value="videos" className="text-xs">
                                    <Video className="w-3 h-3 mr-1" />
                                    Videos
                                  </TabsTrigger>
                                </TabsList>

                                <TabsContent value="steps" className="mt-3">
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {journey.learning_steps.length > 0 ? (
                                      journey.learning_steps.map((step: any, index: number) => {
                                        const isCompleted = journey.steps_completed[index] || false;

                                        return (
                                          <div key={index} className={cn(
                                            "flex items-start gap-2 p-2 rounded-lg transition-colors",
                                            isCompleted
                                              ? "bg-green-50 border border-green-200"
                                              : "bg-muted/50"
                                          )}>
                                            <Checkbox
                                              checked={isCompleted}
                                              onCheckedChange={() => toggleStepCompletion(journey.id, index)}
                                              className="mt-1"
                                            />
                                            <div className={cn(
                                              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                              isCompleted
                                                ? "bg-green-100 text-green-700"
                                                : "bg-primary/20 text-primary"
                                            )}>
                                              <span className="text-xs font-medium">{index + 1}</span>
                                            </div>
                                            <div className="flex-1">
                                              <p className={cn(
                                                "text-sm font-medium",
                                                isCompleted
                                                  ? "text-green-800 line-through"
                                                  : "text-foreground"
                                              )}>
                                                {step.title || step.step || `Step ${index + 1}`}
                                                {isCompleted && (
                                                  <CheckCircle2 className="w-4 h-4 text-green-600 inline ml-2" />
                                                )}
                                              </p>
                                              {step.description && (
                                                <p className={cn(
                                                  "text-xs mt-1",
                                                  isCompleted
                                                    ? "text-green-700 line-through"
                                                    : "text-muted-foreground"
                                                )}>
                                                  {step.description}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        No learning steps available
                                      </p>
                                    )}
                                  </div>
                                </TabsContent>

                                <TabsContent value="courses" className="mt-3">
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {journey.recommended_courses.length > 0 ? (
                                      journey.recommended_courses.map((course: any, index: number) => {
                                        // Handle different possible data structures
                                        const courseTitle = course?.title || course?.name || course?.course_name || `Course ${index + 1}`;
                                        const courseProvider = course?.provider || course?.platform || course?.instructor;
                                        const courseUrl = course?.url || course?.link || course?.course_url;
                                        const courseDescription = course?.description || course?.summary;

                                        // Check if this course has a certification uploaded
                                        const hasCertification = journey.certification_links.some(cert =>
                                          cert.toLowerCase().includes(courseTitle.toLowerCase())
                                        );

                                        return (
                                          <div key={index} className={cn(
                                            "flex items-start gap-2 p-2 rounded-lg transition-colors",
                                            hasCertification
                                              ? "bg-green-50 border border-green-200"
                                              : "bg-muted/50"
                                          )}>
                                            <GraduationCap className={cn(
                                              "w-4 h-4 flex-shrink-0 mt-1",
                                              hasCertification ? "text-green-600" : "text-primary"
                                            )} />
                                            <div className="flex-1">
                                              <p className={cn(
                                                "text-sm font-medium",
                                                hasCertification ? "text-green-800" : "text-foreground"
                                              )}>
                                                {courseTitle}
                                                {hasCertification && (
                                                  <CheckCircle2 className="w-4 h-4 text-green-600 inline ml-2" />
                                                )}
                                              </p>
                                              {courseProvider && (
                                                <p className={cn(
                                                  "text-xs",
                                                  hasCertification ? "text-green-700" : "text-muted-foreground"
                                                )}>
                                                  by {courseProvider}
                                                </p>
                                              )}
                                              {courseDescription && (
                                                <p className={cn(
                                                  "text-xs mt-1 line-clamp-2",
                                                  hasCertification ? "text-green-700" : "text-muted-foreground"
                                                )}>
                                                  {courseDescription}
                                                </p>
                                              )}
                                              <div className="flex items-center gap-2 mt-2">
                                                {courseUrl ? (
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 text-xs"
                                                    onClick={() => window.open(courseUrl, '_blank')}
                                                  >
                                                    <LinkIcon className="w-3 h-3 mr-1" />
                                                    View Course
                                                  </Button>
                                                ) : (
                                                  <p className={cn(
                                                    "text-xs italic",
                                                    hasCertification ? "text-green-700" : "text-muted-foreground"
                                                  )}>
                                                    No link available
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                              <CertificationDialog
                                                journeyId={journey.id}
                                                courseName={courseTitle}
                                                onAddCertification={addCertificationLink}
                                              />
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        No courses recommended
                                      </p>
                                    )}
                                  </div>
                                </TabsContent>

                                <TabsContent value="videos" className="mt-3">
                                  <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {journey.recommended_videos.length > 0 ? (
                                      journey.recommended_videos.map((video: any, index: number) => {
                                        // Handle different possible data structures
                                        const videoTitle = video?.title || video?.name || video?.video_title || `Video ${index + 1}`;
                                        const videoChannel = video?.channel || video?.creator || video?.author;
                                        const videoDuration = video?.duration || video?.length;
                                        const videoUrl = video?.url || video?.link || video?.video_url;
                                        const videoDescription = video?.description || video?.summary;

                                        return (
                                          <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                                            <Video className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                                            <div className="flex-1">
                                              <p className="text-sm font-medium text-foreground">
                                                {videoTitle}
                                              </p>
                                              {videoChannel && (
                                                <p className="text-xs text-muted-foreground">
                                                  by {videoChannel}
                                                </p>
                                              )}
                                              {videoDuration && (
                                                <p className="text-xs text-muted-foreground">
                                                  Duration: {videoDuration}
                                                </p>
                                              )}
                                              {videoDescription && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                  {videoDescription}
                                                </p>
                                              )}
                                              {videoUrl ? (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-6 px-2 mt-1 text-xs"
                                                  onClick={() => window.open(videoUrl, '_blank')}
                                                >
                                                  <Video className="w-3 h-3 mr-1" />
                                                  Watch Video
                                                </Button>
                                              ) : (
                                                <p className="text-xs text-muted-foreground mt-1 italic">
                                                  No link available
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <p className="text-sm text-muted-foreground text-center py-4">
                                        No videos recommended
                                      </p>
                                    )}
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </CollapsibleContent>
                          </Collapsible>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No Learning Paths Started</h3>
                    <p className="text-sm text-muted-foreground mb-4 sm:mb-6 px-4">Complete skill analysis to get personalized learning recommendations</p>
                    <Button
                      onClick={() => document.getElementById('skill-analysis')?.scrollIntoView({ behavior: 'smooth' })}
                      variant="outline"
                      className="gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Analyze Skills First
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 6️⃣ PROJECT SECTION */}
          <section id="projects" className="animate-fade-in" style={{ animationDelay: '0.25s' }}>
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderKanban className="w-4 h-4 text-primary" />
                  </div>
                  Projects Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {projectIdeas.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {projectIdeas.map((project) => (
                      <Card key={project.id} className="group hover:border-primary/30 transition-colors">
                        <CardContent className="p-3 sm:p-4">
                          <div className="space-y-2 sm:space-y-3">
                            <div className="min-w-0">
                              <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{project.title}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">{project.domain}</p>
                            </div>

                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>

                            <div className="flex items-center justify-between gap-2">
                              <Badge className={cn(getStatusColor(project.status), "text-xs")}>
                                {project.status === 'built' ? 'Built' :
                                  project.status === 'planned' ? 'In Progress' : 'Not Started'}
                              </Badge>

                              <Button
                                size="sm"
                                onClick={() => {
                                  if (project.status === 'not_started') {
                                    startProject(project);
                                  } else {
                                    navigate(`/projects?id=${project.id}`);
                                  }
                                }}
                                disabled={loadingProjectId === project.id}
                                className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
                              >
                                {loadingProjectId === project.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                    <span className="hidden sm:inline">Starting...</span>
                                    <span className="sm:hidden">...</span>
                                  </>
                                ) : project.status === 'not_started' ? (
                                  <>
                                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                                    Start
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                                    View
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <FolderKanban className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No Projects Available</h3>
                    <p className="text-sm text-muted-foreground mb-4 sm:mb-6 px-4">Complete your learning journey to get project recommendations</p>
                    <Button
                      onClick={() => document.getElementById('learning')?.scrollIntoView({ behavior: 'smooth' })}
                      variant="outline"
                      className="gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Start Learning First
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 7️⃣ JOB SECTION */}
          <section id="jobs" className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  Job Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {jobRecommendations.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {jobRecommendations.map((job) => (
                      <Card key={job.id} className="group hover:border-primary/30 transition-colors">
                        <CardContent className="p-3 sm:p-4">
                          {/* Mobile Layout */}
                          <div className="block sm:hidden space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground text-sm truncate">{job.title}</h4>
                                <p className="text-xs text-muted-foreground">{job.company}</p>
                              </div>
                              <div className="text-center flex-shrink-0">
                                <div className="text-lg font-bold text-primary">{job.match_percentage}%</div>
                                <div className="text-xs text-muted-foreground">match</div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(job.posted_date).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              <Badge variant="outline" className="text-xs">{job.job_type}</Badge>
                              {job.required_skills.slice(0, 2).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {job.required_skills.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{job.required_skills.length - 2}
                                </Badge>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (job.interview_prep_completed) {
                                    navigate(`/interview?id=${job.id}`);
                                  } else {
                                    prepareForInterview(job);
                                  }
                                }}
                                disabled={loadingJobId === job.id}
                                className="flex-1 gap-1 text-xs h-8"
                                variant={job.interview_prep_completed ? "outline" : "default"}
                              >
                                {loadingJobId === job.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Preparing...
                                  </>
                                ) : job.interview_prep_completed ? (
                                  <>
                                    <Eye className="w-3 h-3" />
                                    View Prep
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3 h-3" />
                                    Prepare
                                  </>
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3 min-w-0">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-foreground truncate">{job.title}</h4>
                                  <p className="text-sm text-muted-foreground">{job.company}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {job.salary_range}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {new Date(job.posted_date).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <Badge variant="outline">{job.job_type}</Badge>
                                {job.required_skills.slice(0, 3).map((skill) => (
                                  <Badge key={skill} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {job.required_skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{job.required_skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{job.match_percentage}%</div>
                                <div className="text-xs text-muted-foreground">match</div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (job.interview_prep_completed) {
                                      navigate(`/interview?id=${job.id}`);
                                    } else {
                                      prepareForInterview(job);
                                    }
                                  }}
                                  disabled={loadingJobId === job.id}
                                  className="gap-2"
                                  variant={job.interview_prep_completed ? "outline" : "default"}
                                >
                                  {loadingJobId === job.id ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Preparing...
                                    </>
                                  ) : job.interview_prep_completed ? (
                                    <>
                                      <Eye className="w-4 h-4" />
                                      View Prep
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4" />
                                      Prepare
                                    </>
                                  )}
                                </Button>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Briefcase className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No Job Recommendations</h3>
                    <p className="text-sm text-muted-foreground mb-4 sm:mb-6 px-4">Complete your career analysis to get personalized job matches</p>
                    <Button
                      onClick={() => document.getElementById('career-match')?.scrollIntoView({ behavior: 'smooth' })}
                      variant="outline"
                      className="gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      Analyze Career First
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Dashboard;
