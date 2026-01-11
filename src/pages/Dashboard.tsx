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
interface CareerAdvice {
  id: string;
  career_title: string;
  domain: string;
  match_percentage: number;
  key_skills: string[];
  description?: string;
  growth_potential?: string;
  salary_range?: string;
  experience_level?: string;
  rationale?: string;
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
  const [careerAdvice, setCareerAdvice] = useState<CareerAdvice[]>([]);
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

      if (careerData) {
        const formattedCareerData: CareerAdvice[] = [];
        
        careerData.forEach(item => {
          // Parse the career_advice JSON field
          const careerAdvice = item.career_advice as any;
          
          // Safely parse skills array
          const parseSkillsArray = (skillsData: any): string[] => {
            if (Array.isArray(skillsData)) {
              return skillsData.filter(skill => typeof skill === 'string');
            }
            return [];
          };
          
          // Helper function to create a career object
          const createCareerObject = (roleData: any, baseId: string, index: number = 0): CareerAdvice => {
            // Enhanced match percentage parsing
            const parseMatchPercentage = (data: any): number => {
              // Try different possible field names and formats
              const possibleFields = [
                data?.match_percentage,
                data?.confidence_score,
                data?.score,
                data?.match_score,
                data?.percentage,
                data?.confidence,
                data?.rating
              ];
              
              for (const field of possibleFields) {
                if (field !== undefined && field !== null) {
                  // Handle string percentages like "85%" or "85"
                  if (typeof field === 'string') {
                    const numericValue = parseFloat(field.replace('%', ''));
                    if (!isNaN(numericValue)) {
                      return Math.round(numericValue);
                    }
                  }
                  // Handle numeric values
                  if (typeof field === 'number') {
                    // If the number is between 0 and 1, assume it's a decimal (0.85 = 85%)
                    if (field > 0 && field <= 1) {
                      return Math.round(field * 100);
                    }
                    // If it's already a percentage (0-100)
                    if (field >= 0 && field <= 100) {
                      return Math.round(field);
                    }
                  }
                }
              }
              
              // Fallback: try to extract from the entire roleData object
              if (typeof roleData === 'object') {
                const allValues = Object.values(roleData);
                for (const value of allValues) {
                  if (typeof value === 'number' && value >= 0 && value <= 100) {
                    return Math.round(value);
                  }
                }
              }
              
              return 0; // Default fallback
            };

            return {
              id: `${baseId}-${index}`,
              career_title: roleData?.career_title || roleData?.title || roleData?.role || 'Unknown Role',
              domain: roleData?.domain || roleData?.industry || roleData?.field || 'Technology',
              match_percentage: parseMatchPercentage(roleData),
              key_skills: parseSkillsArray(roleData?.key_skills || roleData?.skills || roleData?.required_skills),
              description: roleData?.description || roleData?.summary || roleData?.overview || '',
              growth_potential: roleData?.growth_potential || roleData?.career_growth || roleData?.growth || '',
              salary_range: roleData?.salary_range || roleData?.expected_salary || roleData?.salary || '',
              experience_level: roleData?.experience_level || roleData?.level || roleData?.seniority || '',
              rationale: roleData?.rationale || roleData?.reasoning || roleData?.why_suitable || '',
              created_at: item.created_at
            };
          };
          
          // Check if career_advice contains multiple roles
          if (Array.isArray(careerAdvice)) {
            // Handle array of roles
            careerAdvice.forEach((role, index) => {
              formattedCareerData.push(createCareerObject(role, item.id, index));
            });
          } else if (careerAdvice?.roles && Array.isArray(careerAdvice.roles)) {
            // Handle roles nested in a 'roles' property
            careerAdvice.roles.forEach((role: any, index: number) => {
              formattedCareerData.push(createCareerObject(role, item.id, index));
            });
          } else if (careerAdvice?.recommendations && Array.isArray(careerAdvice.recommendations)) {
            // Handle roles nested in a 'recommendations' property
            careerAdvice.recommendations.forEach((role: any, index: number) => {
              formattedCareerData.push(createCareerObject(role, item.id, index));
            });
          } else {
            // Handle single role object
            formattedCareerData.push(createCareerObject(careerAdvice, item.id, 0));
          }
        });
        
        setCareerAdvice(formattedCareerData);
        if (formattedCareerData.length > 0) {
          setSelectedCareer(formattedCareerData[0]);
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
          body: JSON.stringify({ skillName }),
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Loading your career dashboard...</h3>
              <p className="text-sm text-muted-foreground">Gathering your progress data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getProgressStats();

  return (
    <div className="min-h-screen bg-background">
      {/* 1️⃣ HEADER SECTION (Sticky) */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Career Dashboard</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Your complete career progress at a glance</p>
          </div>
          <Button 
            onClick={() => navigate('/advisor')}
            className="gap-1 sm:gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-xs sm:text-sm px-3 sm:px-4"
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
          
          {/* 1️⃣ CAREER MATCH SECTION - Moved to top */}
          <section id="career-match">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    Career Match Analysis
                    {careerAdvice.length > 0 && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {careerAdvice.length} {careerAdvice.length === 1 ? 'Role' : 'Roles'}
                      </Badge>
                    )}
                  </CardTitle>
                  
                  {/* Carousel Navigation - Desktop Only */}
                  {careerAdvice.length > 0 && (
                    <div className="hidden lg:flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => carouselApi?.scrollPrev()}
                        disabled={!canScrollPrev}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => carouselApi?.scrollNext()}
                        disabled={!canScrollNext}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="px-3 sm:px-6">
                {careerAdvice.length > 0 ? (
                  <div className="w-full">
                    {/* Mobile: Stack cards vertically with improved spacing */}
                    <div className="block lg:hidden space-y-3">
                      {careerAdvice.map((career) => {
                        const hasValidation = skillValidations.some(sv => sv.career_role === career.career_title);
                        
                        return (
                          <Card key={career.id} className="group hover:border-primary/30 transition-all duration-200 hover:shadow-md border-border/50">
                            <CardContent className="p-3 sm:p-4">
                              <div className="space-y-3">
                                {/* Header - Improved mobile layout */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm sm:text-base font-bold text-foreground leading-tight">{career.career_title}</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-0.5">{career.domain}</p>
                                    {career.experience_level && (
                                      <Badge variant="outline" className="mt-1.5 text-xs px-2 py-0.5">
                                        {career.experience_level}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-center flex-shrink-0">
                                    <div className="text-lg sm:text-xl font-bold text-primary">{career.match_percentage}%</div>
                                    <div className="text-xs text-muted-foreground">match</div>
                                  </div>
                                </div>
                                
                                {/* Progress Bar */}
                                <Progress value={career.match_percentage} className="h-2" />
                                
                                {/* Description - Show on mobile if available */}
                                {career.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                    {career.description}
                                  </p>
                                )}
                                
                                {/* Key Skills - Better mobile layout */}
                                <div>
                                  <h5 className="text-xs sm:text-sm font-medium text-foreground mb-1.5">Key Skills:</h5>
                                  <div className="flex flex-wrap gap-1">
                                    {career.key_skills.slice(0, 4).map((skill) => (
                                      <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5">
                                        {skill}
                                      </Badge>
                                    ))}
                                    {career.key_skills.length > 4 && (
                                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                                        +{career.key_skills.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Action Button */}
                                <Button
                                  onClick={() => {
                                    if (hasValidation) {
                                      toast({
                                        title: "Career Selected",
                                        description: `${career.career_title} has been selected as your focus career.`,
                                      });
                                    } else {
                                      navigate('/sigma');
                                    }
                                  }}
                                  className="w-full gap-2 h-9 sm:h-10"
                                  variant={hasValidation ? "outline" : "default"}
                                >
                                  {hasValidation ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      Select
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4" />
                                      Start
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Desktop: Horizontal carousel with improved responsiveness */}
                    <div className="hidden lg:block">
                      <Carousel 
                        className="w-full" 
                        opts={{ align: "start", loop: false }}
                        setApi={setCarouselApi}
                      >
                        <CarouselContent className="-ml-2">
                          {careerAdvice.map((career) => {
                            const hasValidation = skillValidations.some(sv => sv.career_role === career.career_title);
                            
                            return (
                              <CarouselItem key={career.id} className="pl-2 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5">
                                <Card className="group hover:border-primary/30 transition-all duration-200 hover:shadow-md h-full border-border/50">
                                  <CardContent className="p-4 h-full">
                                    <div className="flex flex-col h-full space-y-3">
                                      {/* Header */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="text-sm font-bold text-foreground truncate" title={career.career_title}>
                                            {career.career_title}
                                          </h4>
                                          <p className="text-xs text-muted-foreground font-medium">{career.domain}</p>
                                          {career.experience_level && (
                                            <Badge variant="outline" className="mt-1 text-xs px-2 py-0.5">
                                              {career.experience_level}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-center flex-shrink-0">
                                          <div className="text-lg font-bold text-primary">{career.match_percentage}%</div>
                                          <div className="text-xs text-muted-foreground">match</div>
                                        </div>
                                      </div>
                                      
                                      {/* Progress Bar */}
                                      <Progress value={career.match_percentage} className="h-2" />
                                      
                                      {/* Description */}
                                      {career.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 flex-grow">
                                          {career.description}
                                        </p>
                                      )}
                                      
                                      {/* Key Skills */}
                                      <div className="flex-grow">
                                        <h5 className="text-xs font-medium text-foreground mb-1">Key Skills:</h5>
                                        <div className="flex flex-wrap gap-1">
                                          {career.key_skills.slice(0, 3).map((skill) => (
                                            <Badge key={skill} variant="secondary" className="text-xs px-2 py-0.5">
                                              {skill}
                                            </Badge>
                                          ))}
                                          {career.key_skills.length > 3 && (
                                            <Badge variant="outline" className="text-xs px-2 py-0.5">
                                              +{career.key_skills.length - 3}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      
                                      {/* Action Button - Always at bottom */}
                                      <Button
                                        onClick={() => {
                                          if (hasValidation) {
                                            toast({
                                              title: "Career Selected",
                                              description: `${career.career_title} has been selected as your focus career.`,
                                            });
                                          } else {
                                            navigate('/sigma');
                                          }
                                        }}
                                        className="w-full gap-2 mt-auto"
                                        variant={hasValidation ? "outline" : "default"}
                                      >
                                        {hasValidation ? (
                                          <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Select
                                          </>
                                        ) : (
                                          <>
                                            <Play className="w-4 h-4" />
                                            Start
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </CarouselItem>
                            );
                          })}
                        </CarouselContent>
                      </Carousel>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <Target className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">No Career Roles Found</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-4">Complete your career analysis to discover all suitable roles and get personalized recommendations</p>
                    <Button onClick={() => navigate('/sigma')} className="gap-2">
                      <Play className="w-4 h-4" />
                      Start Career Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Next Best Action Highlight */}
          {nextBestAction !== 'complete' && (
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10 shadow-lg">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse flex-shrink-0">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">Next Best Action</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {nextBestAction === 'career_analysis' && 'Complete your career analysis to get personalized recommendations'}
                      {nextBestAction === 'skill_validation' && 'Validate your skills for your selected career path'}
                      {nextBestAction === 'start_learning' && 'Start learning to bridge your skill gaps'}
                      {nextBestAction === 'project_planning' && 'Plan your next project to build practical experience'}
                      {nextBestAction === 'interview_prep' && 'Prepare for interviews with your matched jobs'}
                    </p>
                  </div>
                  <Button 
                    className="gap-2 w-full sm:w-auto flex-shrink-0"
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

          {/* 2️⃣ OVERVIEW SECTION */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {/* 🧩 Overview Card (Left – Primary) */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Career Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {selectedCareer ? (
                  <>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-foreground">{selectedCareer.career_title}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground">{selectedCareer.domain}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={selectedCareer.match_percentage} className="flex-1 h-2" />
                        <span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap">{selectedCareer.match_percentage}% match</span>
                      </div>
                    </div>
                    
                    {skillValidations.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {[...skillValidations[0].matched_skills.strong, ...skillValidations[0].matched_skills.partial].slice(0, 6).map((skill) => (
                            <Badge key={skill} className="bg-green-50 text-green-700 border-green-200 text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {skillValidations[0].missing_skills.slice(0, 6).map((skill) => (
                            <Badge key={skill} className="bg-orange-50 text-orange-700 border-orange-200 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => document.getElementById('skill-analysis')?.scrollIntoView({ behavior: 'smooth' })}
                          className="gap-2 w-full sm:w-auto"
                        >
                          <Eye className="w-4 h-4" />
                          View Skill Analysis
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4 sm:py-6">
                    <Target className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">No career selected yet</p>
                    <Button onClick={() => navigate('/sigma')} className="gap-2 w-full sm:w-auto">
                      <Play className="w-4 h-4" />
                      Start Career Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 📊 Progress Summary (Right) */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Progress Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Skills Validated</span>
                    <span className="text-xs sm:text-sm font-medium">{stats.skillsValidated}%</span>
                  </div>
                  <Progress value={stats.skillsValidated} className="h-2" />
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Learning Progress</span>
                    <span className="text-xs sm:text-sm font-medium">{stats.learningProgress}%</span>
                  </div>
                  <Progress value={stats.learningProgress} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                    <div className="text-xl sm:text-2xl font-bold text-primary">{stats.projectsStarted}</div>
                    <div className="text-xs text-muted-foreground">Projects Started</div>
                  </div>
                  <div className="text-center p-2 sm:p-3 rounded-lg bg-muted/50">
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.projectsCompleted}</div>
                    <div className="text-xs text-muted-foreground">Projects Built</div>
                  </div>
                </div>
                
                <div className="text-center p-2 sm:p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="text-xl sm:text-2xl font-bold text-primary">{stats.jobsMatched}</div>
                  <div className="text-xs text-muted-foreground">Jobs Matched</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4️⃣ SKILL ANALYSIS SECTION */}
          <section id="skill-analysis">
            <Card>
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
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

                          {/* Right Column: Missing Skills */}
                          <div className="lg:col-span-1">
                            <div>
                              <h5 className="font-medium text-foreground mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-600" />
                                Missing Skills
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
                                        className="gap-1 text-xs h-7 w-full"
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
                                  <p className="text-sm text-muted-foreground text-center py-4">No missing skills - you're ready!</p>
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
          <section id="learning">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Learning Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                {learningJourneys.length > 0 ? (
                  <div className="space-y-4">
                    {learningJourneys.map((journey) => (
                      <Card key={journey.id} className="group hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
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
                              <Button
                                size="sm"
                                onClick={() => navigate('/learn')}
                                className="gap-2"
                              >
                                {journey.status === 'completed' ? (
                                  <>
                                    <Eye className="w-4 h-4" />
                                    Review
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-4 h-4" />
                                    Start Learning
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{journey.progress_percentage}%</span>
                            </div>
                            <Progress value={journey.progress_percentage} className="h-2" />
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
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Learning Paths Started</h3>
                    <p className="text-muted-foreground mb-6">Complete skill analysis to get personalized learning recommendations</p>
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
          <section id="projects">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-primary" />
                  Projects Portfolio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {projectIdeas.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectIdeas.map((project) => (
                      <Card key={project.id} className="group hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold text-foreground">{project.title}</h4>
                              <p className="text-sm text-muted-foreground">{project.domain}</p>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <Badge className={getStatusColor(project.status)}>
                                {project.status === 'built' ? 'Built' :
                                 project.status === 'planned' ? 'In Progress' : 'Not Started'}
                              </Badge>
                              
                              <Button
                                size="sm"
                                onClick={() => navigate(`/projects?id=${project.id}`)}
                                className="gap-2"
                              >
                                {project.status === 'not_started' ? (
                                  <>
                                    <Play className="w-4 h-4" />
                                    Start
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4" />
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
                  <div className="text-center py-12">
                    <FolderKanban className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Available</h3>
                    <p className="text-muted-foreground mb-6">Complete your learning journey to get project recommendations</p>
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
          <section id="jobs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Job Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobRecommendations.length > 0 ? (
                  <div className="space-y-4">
                    {jobRecommendations.map((job) => (
                      <Card key={job.id} className="group hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Building2 className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{job.title}</h4>
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
                            
                            <div className="flex flex-col items-end gap-3">
                              <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{job.match_percentage}%</div>
                                <div className="text-xs text-muted-foreground">match</div>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/interview?id=${job.id}`)}
                                  className="gap-2"
                                  variant={job.interview_prep_completed ? "outline" : "default"}
                                >
                                  {job.interview_prep_completed ? (
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
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Job Recommendations</h3>
                    <p className="text-muted-foreground mb-6">Complete your career analysis to get personalized job matches</p>
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
