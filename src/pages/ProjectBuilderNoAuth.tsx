import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Hammer, 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  Code2, 
  MessageSquare, 
  Sparkles,
  RefreshCw,
  Play,
  FileCode,
  TestTube,
  Rocket,
  Palette,
  Settings,
  Copy,
  Check,
  Send,
  Loader2,
  Trophy,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  type: 'setup' | 'code' | 'design' | 'test' | 'deploy';
  estimated_time: string;
  is_completed: boolean;
  code_snippet?: string;
  guidance?: string;
}

interface ProjectPhase {
  phase_number: number;
  title: string;
  description: string;
  tasks: ProjectTask[];
  is_completed: boolean;
}

interface BuildSession {
  id: string;
  project_title: string;
  status: string;
  current_phase: number;
  total_phases: number;
  phases: ProjectPhase[];
  progress_percentage: number;
  skills_applied: string[];
}

const taskTypeIcons: Record<string, React.ReactNode> = {
  setup: <Settings className="w-4 h-4" />,
  code: <FileCode className="w-4 h-4" />,
  design: <Palette className="w-4 h-4" />,
  test: <TestTube className="w-4 h-4" />,
  deploy: <Rocket className="w-4 h-4" />,
};

const taskTypeColors: Record<string, string> = {
  setup: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  code: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  design: 'bg-pink-500/10 text-pink-500 border-pink-500/30',
  test: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  deploy: 'bg-violet-500/10 text-violet-500 border-violet-500/30',
};

const ProjectBuilderNoAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { resumeId, isReady } = useResume();

  const projectId = searchParams.get('projectId');

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<BuildSession | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([1]));
  const [guidance, setGuidance] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [userQuestion, setUserQuestion] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'guidance' | 'code'>('guidance');

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

    initializeSession();
  }, [resumeId, projectId, isReady]);

  const initializeSession = async () => {
    if (!resumeId || !projectId) return;
    setIsLoading(true);

    try {
      const response = await supabase.functions.invoke('project-builder', {
        body: {
          action: 'initialize',
          resume_id: resumeId,
          project_id: projectId,
        }
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data.success && data.data) {
        setSession(data.data);
        // Auto-expand current phase
        setExpandedPhases(new Set([data.data.current_phase]));
        // Auto-select first incomplete task
        const phases = data.data.phases as ProjectPhase[];
        for (const phase of phases) {
          const incompleteTask = phase.tasks.find(t => !t.is_completed);
          if (incompleteTask) {
            setSelectedTask(incompleteTask);
            break;
          }
        }
      } else {
        throw new Error(data.error || 'Failed to initialize session');
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      toast({
        title: "Error",
        description: "Failed to initialize project builder",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhase = (phaseNum: number) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseNum)) {
        newSet.delete(phaseNum);
      } else {
        newSet.add(phaseNum);
      }
      return newSet;
    });
  };

  const selectTask = (task: ProjectTask) => {
    setSelectedTask(task);
    setGuidance('');
    setGeneratedCode('');
    setActiveTab('guidance');
  };

  const getGuidance = async (question?: string) => {
    if (!session || !selectedTask) return;
    setIsGenerating(true);

    try {
      const response = await supabase.functions.invoke('project-builder', {
        body: {
          action: 'get_guidance',
          session_id: session.id,
          task_id: selectedTask.id,
          user_input: question,
        }
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data.success && data.data) {
        setGuidance(data.data.guidance);
        setActiveTab('guidance');
      } else {
        throw new Error(data.error || 'Failed to get guidance');
      }
    } catch (error) {
      console.error('Error getting guidance:', error);
      toast({
        title: "Error",
        description: "Failed to get AI guidance",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setUserQuestion('');
    }
  };

  const generateCode = async () => {
    if (!session || !selectedTask) return;
    setIsGenerating(true);

    try {
      const response = await supabase.functions.invoke('project-builder', {
        body: {
          action: 'generate_code',
          session_id: session.id,
          task_id: selectedTask.id,
          user_input: userQuestion,
        }
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data.success && data.data) {
        setGeneratedCode(data.data.code);
        setActiveTab('code');
      } else {
        throw new Error(data.error || 'Failed to generate code');
      }
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: "Error",
        description: "Failed to generate code",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const completeTask = async () => {
    if (!session || !selectedTask) return;

    try {
      const response = await supabase.functions.invoke('project-builder', {
        body: {
          action: 'complete_task',
          session_id: session.id,
          task_id: selectedTask.id,
        }
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data.success && data.data) {
        setSession(data.data);
        
        // Find next incomplete task
        const phases = data.data.phases as ProjectPhase[];
        let nextTask: ProjectTask | null = null;
        for (const phase of phases) {
          const incompleteTask = phase.tasks.find(t => !t.is_completed);
          if (incompleteTask) {
            nextTask = incompleteTask;
            setExpandedPhases(prev => new Set([...prev, phase.phase_number]));
            break;
          }
        }
        
        if (nextTask) {
          setSelectedTask(nextTask);
          setGuidance('');
          setGeneratedCode('');
        } else {
          // Project complete!
          toast({
            title: "🎉 Project Complete!",
            description: "Congratulations! You've built your project!",
          });
        }
        
        toast({
          title: "Task Completed",
          description: "Great progress! Keep going!",
        });
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p>Initializing Project Builder...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Hammer className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Project Not Found</h2>
            <p className="text-muted-foreground mb-4">Unable to load project builder session.</p>
            <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isProjectComplete = session.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Hammer className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Project Builder</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium">{session.progress_percentage}% Complete</p>
              <p className="text-xs text-muted-foreground">Phase {session.current_phase} of {session.total_phases}</p>
            </div>
            <Progress value={session.progress_percentage} className="w-32 h-2" />
          </div>
        </div>
      </header>

      {/* Project Title Bar */}
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/10 to-violet-500/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{session.project_title}</h1>
              <div className="flex flex-wrap gap-2 mt-2">
                {session.skills_applied?.slice(0, 5).map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>
            {isProjectComplete && (
              <Badge className="gap-1 bg-emerald-500 text-white">
                <Trophy className="w-4 h-4" />
                Completed!
              </Badge>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Phases & Tasks */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Project Phases
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div className="p-4 pt-0 space-y-2">
                    {(session.phases as ProjectPhase[]).map((phase) => (
                      <Collapsible 
                        key={phase.phase_number}
                        open={expandedPhases.has(phase.phase_number)}
                        onOpenChange={() => togglePhase(phase.phase_number)}
                      >
                        <CollapsibleTrigger className="w-full">
                          <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            phase.is_completed 
                              ? 'bg-emerald-500/10 border border-emerald-500/30' 
                              : session.current_phase === phase.phase_number
                                ? 'bg-primary/10 border border-primary/30'
                                : 'bg-muted/50 hover:bg-muted'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                phase.is_completed 
                                  ? 'bg-emerald-500 text-white' 
                                  : session.current_phase === phase.phase_number
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted-foreground/20 text-muted-foreground'
                              }`}>
                                {phase.is_completed ? <Check className="w-4 h-4" /> : phase.phase_number}
                              </div>
                              <div className="text-left">
                                <p className="font-medium text-sm">{phase.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {phase.tasks.filter(t => t.is_completed).length}/{phase.tasks.length} tasks
                                </p>
                              </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 transition-transform ${
                              expandedPhases.has(phase.phase_number) ? 'rotate-180' : ''
                            }`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="mt-2 ml-4 space-y-1">
                            {phase.tasks.map((task) => (
                              <button
                                key={task.id}
                                onClick={() => selectTask(task)}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                                  selectedTask?.id === task.id
                                    ? 'bg-primary/20 border border-primary/50'
                                    : 'hover:bg-muted/50'
                                }`}
                              >
                                {task.is_completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm truncate ${task.is_completed ? 'text-muted-foreground line-through' : ''}`}>
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-xs py-0 ${taskTypeColors[task.type]}`}>
                                      {taskTypeIcons[task.type]}
                                      <span className="ml-1 capitalize">{task.type}</span>
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">{task.estimated_time}</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right Content - Task Details & AI */}
          <div className="lg:col-span-8">
            {selectedTask ? (
              <div className="space-y-4">
                {/* Task Header */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className={taskTypeColors[selectedTask.type]}>
                            {taskTypeIcons[selectedTask.type]}
                            <span className="ml-1 capitalize">{selectedTask.type}</span>
                          </Badge>
                          <Badge variant="outline">{selectedTask.estimated_time}</Badge>
                          {selectedTask.is_completed && (
                            <Badge className="bg-emerald-500 text-white">Completed</Badge>
                          )}
                        </div>
                        <h2 className="text-xl font-bold">{selectedTask.title}</h2>
                        <p className="text-muted-foreground mt-2">{selectedTask.description}</p>
                      </div>
                      {!selectedTask.is_completed && (
                        <Button onClick={completeTask} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Assistance Tabs */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        AI Assistant
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant={activeTab === 'guidance' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveTab('guidance')}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Guidance
                        </Button>
                        <Button
                          variant={activeTab === 'code' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setActiveTab('code')}
                        >
                          <Code2 className="w-4 h-4 mr-1" />
                          Code
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button 
                        onClick={() => getGuidance()} 
                        disabled={isGenerating}
                        className="gap-2"
                      >
                        {isGenerating && activeTab === 'guidance' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        Get Step-by-Step Guide
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={generateCode}
                        disabled={isGenerating}
                        className="gap-2"
                      >
                        {isGenerating && activeTab === 'code' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Code2 className="w-4 h-4" />
                        )}
                        Generate Code
                      </Button>
                    </div>

                    {/* Ask Question */}
                    <div className="flex gap-2 mb-4">
                      <Textarea
                        placeholder="Ask a specific question about this task..."
                        value={userQuestion}
                        onChange={(e) => setUserQuestion(e.target.value)}
                        className="min-h-[60px]"
                      />
                      <Button 
                        onClick={() => getGuidance(userQuestion)} 
                        disabled={isGenerating || !userQuestion.trim()}
                        size="icon"
                        className="self-end"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Content Display */}
                    <ScrollArea className="h-[400px] rounded-lg border bg-muted/30 p-4">
                      {isGenerating ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                            <p className="text-muted-foreground">AI is thinking...</p>
                          </div>
                        </div>
                      ) : activeTab === 'guidance' && guidance ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{guidance}</ReactMarkdown>
                        </div>
                      ) : activeTab === 'code' && generatedCode ? (
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={copyCode}
                          >
                            {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>{generatedCode}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Click a button above to get AI assistance</p>
                            <p className="text-sm mt-1">or ask a specific question</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Hammer className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Select a Task</h2>
                  <p className="text-muted-foreground">Choose a task from the left panel to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectBuilderNoAuth;
