import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Code2, 
  Sparkles,
  FileCode,
  Rocket,
  FolderTree,
  Layers,
  Copy,
  Check,
  Loader2,
  Lightbulb,
  Target,
  BookOpen,
  Download,
  RefreshCw,
  Wrench,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

interface ProjectBlueprint {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  skills: string[];
  overview: string;
  tech_stack: {
    category: string;
    items: { name: string; purpose: string }[];
  }[];
  file_structure: string;
  setup_steps: string[];
  core_features: {
    name: string;
    description: string;
    code_snippet: string;
  }[];
  learning_resources: {
    title: string;
    url: string;
    type: string;
  }[];
  next_steps: string[];
}

const difficultyConfig: Record<string, { color: string; bg: string; label: string }> = {
  beginner: { color: 'text-emerald-600', bg: 'bg-emerald-500/10', label: 'Beginner Friendly' },
  intermediate: { color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Intermediate' },
  expert: { color: 'text-rose-600', bg: 'bg-rose-500/10', label: 'Advanced' },
};

const ProjectBuilderNoAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { resumeId, isReady } = useResume();

  const projectId = searchParams.get('projectId');

  const [isLoading, setIsLoading] = useState(true);
  const [blueprint, setBlueprint] = useState<ProjectBlueprint | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!isReady) return;
    
    if (!resumeId) {
      navigate('/setup');
      return;
    }
    
    if (!projectId) {
      navigate('/dashboard');
      return;
    }

    generateBlueprint();
  }, [resumeId, projectId, isReady]);

  const generateBlueprint = async () => {
    if (!resumeId || !projectId) return;
    setIsLoading(true);

    try {
      // First get project details
      const { data: projectData, error: projectError } = await supabase
        .from('project_ideas_result')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Generate blueprint via edge function
      const response = await supabase.functions.invoke('project-builder', {
        body: {
          action: 'generate_blueprint',
          resume_id: resumeId,
          project_id: projectId,
          project_data: projectData,
        }
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data.success && data.blueprint) {
        setBlueprint({
          id: projectId,
          title: projectData.title,
          description: projectData.description || '',
          difficulty: projectData.complexity || 'intermediate',
          estimated_time: projectData.estimated_time || '2-3 weeks',
          skills: projectData.skills_demonstrated || [],
          ...data.blueprint
        });
      } else {
        throw new Error(data.error || 'Failed to generate blueprint');
      }
    } catch (error) {
      console.error('Error generating blueprint:', error);
      toast({
        title: "Error",
        description: "Failed to generate project blueprint",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateBlueprint = async () => {
    setIsRegenerating(true);
    await generateBlueprint();
    setIsRegenerating(false);
    toast({
      title: "Blueprint Regenerated",
      description: "Your project blueprint has been updated with fresh ideas!"
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "Copied!", description: "Code copied to clipboard" });
  };

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-medium">Generating your project blueprint...</p>
          <p className="text-muted-foreground text-sm mt-1">AI is crafting the perfect guide for you</p>
        </motion.div>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <FileCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Blueprint Not Found</h2>
            <p className="text-muted-foreground mb-4">Unable to generate project blueprint.</p>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const difficulty = difficultyConfig[blueprint.difficulty] || difficultyConfig.intermediate;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg leading-tight">{blueprint.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={`${difficulty.bg} ${difficulty.color} border-0 text-xs`}>
                  {difficulty.label}
                </Badge>
                <span className="text-xs text-muted-foreground">• {blueprint.estimated_time}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={regenerateBlueprint}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Regenerate
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 max-w-5xl">
        {/* Skills Applied */}
        <div className="flex flex-wrap gap-2 mb-6">
          {blueprint.skills.map((skill, i) => (
            <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
              {skill}
            </Badge>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="setup" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              <span className="hidden sm:inline">Setup</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span className="hidden sm:inline">Code</span>
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Learn</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-primary" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{blueprint.overview}</p>
              </CardContent>
            </Card>

            {/* Tech Stack */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Technology Stack
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {blueprint.tech_stack.map((category, idx) => (
                    <div key={idx} className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-semibold text-sm mb-3 text-primary">{category.category}</h4>
                      <div className="space-y-2">
                        {category.items.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium text-sm">{item.name}</span>
                              <p className="text-xs text-muted-foreground">{item.purpose}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5 text-primary" />
                  After Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {blueprint.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-sm text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            {/* File Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="w-5 h-5 text-primary" />
                  Project Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <pre className="whitespace-pre text-muted-foreground">{blueprint.file_structure}</pre>
                </div>
              </CardContent>
            </Card>

            {/* Setup Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" />
                  Getting Started
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {blueprint.setup_steps.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 pt-1 prose prose-sm dark:prose-invert max-w-none [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono">
                        <ReactMarkdown>{step}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="space-y-6">
            {blueprint.core_features.map((feature, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-primary" />
                      {feature.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(feature.code_snippet, idx)}
                    >
                      {copiedIndex === idx ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] w-full rounded-lg border bg-muted/30">
                    <pre className="p-4 text-sm font-mono whitespace-pre overflow-x-auto">
                      <code>{feature.code_snippet}</code>
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Learning Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {blueprint.learning_resources.map((resource, idx) => (
                    <a
                      key={idx}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {resource.type === 'video' ? (
                          <span className="text-lg">🎬</span>
                        ) : resource.type === 'docs' ? (
                          <span className="text-lg">📚</span>
                        ) : resource.type === 'tutorial' ? (
                          <span className="text-lg">📝</span>
                        ) : (
                          <span className="text-lg">🔗</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                          {resource.title}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Pro Tips</h4>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Start with the file structure and create all folders first</li>
                      <li>• Build one feature at a time, testing as you go</li>
                      <li>• Commit your code regularly with meaningful messages</li>
                      <li>• Use the AI Advisor for help when you get stuck</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/advisor')}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Ask AI Advisor for Help
          </Button>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            Back to Dashboard
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProjectBuilderNoAuth;
