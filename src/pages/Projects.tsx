import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  FolderKanban,
  CheckCircle2,
  Clock,
  FileText,
  Link,
  ExternalLink,
  Loader2,
  AlertCircle,
  Target,
  Lightbulb,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ProjectBuildStep {
  id: string;
  step_number: number;
  title: string;
  description: string;
  estimated_duration: string;
  estimated_time?: string; // Mapped field
  difficulty_level?: string;
  dependencies?: string[];
  deliverables: string[];
  status: string;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectResource {
  id: string;
  type: string;
  name: string;
  description: string;
  resource: string;
  metadata: any;
  quantity: number;
  unit_cost: number;
  project_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // Mapped fields for display
  resource_type?: string;
  title?: string;
  url?: string;
  category?: string;
}

interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  domain: string;
  status: string;
}

const Projects = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<ProjectIdea | null>(null);
  const [buildSteps, setBuildSteps] = useState<ProjectBuildStep[]>([]);
  const [resources, setResources] = useState<ProjectResource[]>([]);

  useEffect(() => {
    if (user && projectId) {
      loadProjectData();
    } else if (!projectId) {
      toast({
        title: "Error",
        description: "No project ID provided",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [user, projectId]);

  const loadProjectData = async () => {
    if (!user || !projectId) return;

    try {
      setIsLoading(true);

      // Load project details
      const { data: projectData, error: projectError } = await supabase
        .from('project_ideas')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();

      if (projectError) {
        console.error('Error loading project:', projectError);
        toast({
          title: "Error",
          description: "Failed to load project details",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setProject(projectData);

      // Load build steps
      const { data: stepsData, error: stepsError } = await supabase
        .from('project_build_steps')
        .select('*')
        .eq('project_id', projectId)
        .order('step_number', { ascending: true });

      if (stepsError) {
        console.error('Error loading build steps:', stepsError);
      } else {
        // Map database fields to interface
        const mappedSteps: ProjectBuildStep[] = (stepsData || []).map(step => ({
          ...step,
          estimated_time: step.estimated_duration || '',
          difficulty_level: (step as any).difficulty_level || 'Medium',
          dependencies: (step as any).dependencies || []
        }));
        setBuildSteps(mappedSteps);
      }

      // Load resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from('project_resources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (resourcesError) {
        console.error('Error loading resources:', resourcesError);
      } else {
        // Map database fields to interface for display
        const mappedResources: ProjectResource[] = (resourcesData || []).map(resource => {
          let category = 'General';
          if (resource.metadata && typeof resource.metadata === 'object' && !Array.isArray(resource.metadata)) {
            category = (resource.metadata as any).category || 'General';
          }
          
          return {
            ...resource,
            resource_type: resource.type || 'Resource',
            title: resource.name || 'Untitled Resource',
            url: resource.resource || '',
            category
          };
        });
        setResources(mappedResources);
      }

    } catch (error) {
      console.error('Error loading project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'hard':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'documentation':
        return FileText;
      case 'tool':
        return Target;
      case 'tutorial':
        return Lightbulb;
      case 'reference':
        return Link;
      default:
        return FileText;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Loading project...</h3>
              <p className="text-sm text-muted-foreground">Fetching project details and resources</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Project Not Found</h3>
          <p className="text-sm text-muted-foreground mb-4">The requested project could not be found.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Project Details</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
        {/* Project Header */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{project.title}</CardTitle>
                  <p className="text-muted-foreground mb-4">{project.description}</p>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{project.domain}</Badge>
                    <Badge className="text-orange-600 bg-orange-50 border-orange-200">
                      In Progress
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Project Content */}
        <Tabs defaultValue="build-steps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="build-steps" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Build Steps ({buildSteps.length})
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resources ({resources.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="build-steps" className="space-y-4">
            {buildSteps.length > 0 ? (
              <div className="space-y-4">
                {buildSteps.map((step) => (
                  <Card key={step.id} className="group hover:border-primary/30 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                            {step.step_number}
                          </div>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-foreground">{step.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge className={getDifficultyColor(step.difficulty_level)}>
                                {step.difficulty_level || 'Medium'}
                              </Badge>
                              {step.estimated_time && (
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="w-3 h-3" />
                                  {step.estimated_time}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground">{step.description}</p>
                          
                          {step.dependencies && step.dependencies.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Dependencies:</h4>
                              <div className="flex flex-wrap gap-2">
                                {step.dependencies.map((dep, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {dep}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {step.deliverables && step.deliverables.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-foreground mb-2">Deliverables:</h4>
                              <div className="flex flex-wrap gap-2">
                                {step.deliverables.map((deliverable, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {deliverable}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Build Steps Available</h3>
                  <p className="text-muted-foreground">Build steps will appear here once the project plan is generated.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            {resources.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {resources.map((resource) => {
                  const IconComponent = getResourceTypeIcon(resource.resource_type);
                  
                  return (
                    <Card key={resource.id} className="group hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                              <IconComponent className="w-5 h-5" />
                            </div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <h3 className="font-semibold text-foreground">{resource.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                {resource.resource_type || 'Resource'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {resource.description}
                            </p>
                            
                            {resource.category && (
                              <Badge variant="secondary" className="text-xs">
                                {resource.category}
                              </Badge>
                            )}
                            
                            {resource.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 h-8 px-2"
                                onClick={() => window.open(resource.url, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open Resource
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Resources Available</h3>
                  <p className="text-muted-foreground">Project resources will appear here once they are generated.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Projects;