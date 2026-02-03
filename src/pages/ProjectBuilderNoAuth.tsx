import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Hammer, 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
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
  Zap,
  BookOpen,
  Lightbulb,
  ChevronRight,
  Clock,
  Target,
  ArrowRight,
  Bot,
  User,
  Star,
  Flame,
  Gift
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

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

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const taskTypeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  setup: { icon: <Settings className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  code: { icon: <FileCode className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  design: { icon: <Palette className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-500/20' },
  test: { icon: <TestTube className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  deploy: { icon: <Rocket className="w-4 h-4" />, color: 'text-violet-400', bg: 'bg-violet-500/20' },
};

const phaseEmojis = ['🚀', '⚙️', '🎨', '🧪', '🌐'];

const ProjectBuilderNoAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { resumeId, isReady } = useResume();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const projectId = searchParams.get('projectId');

  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<BuildSession | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<ProjectPhase | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [completedTaskId, setCompletedTaskId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'tasks' | 'chat' | 'code'>('tasks');

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
        const phases = data.data.phases as ProjectPhase[];
        const currentPhase = phases.find(p => p.phase_number === data.data.current_phase);
        if (currentPhase) {
          setSelectedPhase(currentPhase);
          const incompleteTask = currentPhase.tasks.find(t => !t.is_completed);
          if (incompleteTask) {
            setSelectedTask(incompleteTask);
          }
        }
        
        // Add welcome message
        setChatMessages([{
          id: '1',
          role: 'assistant',
          content: `Welcome to your project builder! 🎉\n\nI'm here to help you build **${data.data.project_title}**. You're currently on Phase ${data.data.current_phase}.\n\nSelect a task to get started, or ask me anything about your project!`,
          timestamp: new Date()
        }]);
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

  const selectTask = (task: ProjectTask, phase: ProjectPhase) => {
    setSelectedTask(task);
    setSelectedPhase(phase);
    setActiveView('tasks');
  };

  const sendMessage = async (message?: string) => {
    const inputText = message || userInput;
    if (!inputText.trim() || !session) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsGenerating(true);

    try {
      const response = await supabase.functions.invoke('project-builder', {
        body: {
          action: 'get_guidance',
          session_id: session.id,
          task_id: selectedTask?.id,
          user_input: inputText,
        }
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data.success && data.data) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.data.guidance,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error getting guidance:', error);
      setChatMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I couldn't process that request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const getQuickHelp = async (type: 'guide' | 'code' | 'hint') => {
    if (!session || !selectedTask) return;
    
    const prompts = {
      guide: `Give me a detailed step-by-step guide for: ${selectedTask.title}`,
      code: `Generate the complete code for: ${selectedTask.title}`,
      hint: `Give me a quick hint or tip for: ${selectedTask.title}`
    };

    await sendMessage(prompts[type]);
  };

  const completeTask = async () => {
    if (!session || !selectedTask) return;

    setCompletedTaskId(selectedTask.id);

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
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
        
        const phases = data.data.phases as ProjectPhase[];
        let nextTask: ProjectTask | null = null;
        let nextPhase: ProjectPhase | null = null;
        
        for (const phase of phases) {
          const incompleteTask = phase.tasks.find(t => !t.is_completed);
          if (incompleteTask) {
            nextTask = incompleteTask;
            nextPhase = phase;
            break;
          }
        }
        
        if (nextTask && nextPhase) {
          setSelectedTask(nextTask);
          setSelectedPhase(nextPhase);
          
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🎉 Great job completing **${selectedTask.title}**!\n\nNext up: **${nextTask.title}**\n\n${nextTask.description}`,
            timestamp: new Date()
          }]);
        } else {
          toast({
            title: "🎉 Project Complete!",
            description: "Congratulations! You've built your entire project!",
          });
          
          setChatMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `🏆 **CONGRATULATIONS!** 🏆\n\nYou've completed your entire project! This is a huge accomplishment. Your **${session.project_title}** is now ready!\n\nWhat you've achieved:\n- Built a complete project from scratch\n- Applied ${session.skills_applied?.length || 0} skills\n- Completed ${phases.reduce((acc, p) => acc + p.tasks.length, 0)} tasks\n\nTime to add this to your portfolio! 🚀`,
            timestamp: new Date()
          }]);
        }
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    } finally {
      setCompletedTaskId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
              <Hammer className="w-10 h-10 text-primary animate-bounce" />
            </div>
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-primary/50"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-lg font-medium">Setting up your workspace...</p>
          <p className="text-muted-foreground text-sm mt-1">Preparing AI-powered guidance</p>
        </motion.div>
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

  const phases = session.phases as ProjectPhase[];
  const totalTasks = phases.reduce((acc, p) => acc + p.tasks.length, 0);
  const completedTasks = phases.reduce((acc, p) => acc + p.tasks.filter(t => t.is_completed).length, 0);
  const isProjectComplete = session.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              exit={{ scale: 0 }}
              className="bg-emerald-500 text-white p-8 rounded-full shadow-2xl"
            >
              <Trophy className="w-16 h-16" />
            </motion.div>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: 0,
                  scale: 1,
                  x: Math.cos(i * 30 * Math.PI / 180) * 200,
                  y: Math.sin(i * 30 * Math.PI / 180) * 200,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute"
              >
                <Star className="w-6 h-6 text-yellow-400" />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center">
                <Hammer className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-sm leading-tight">{session.project_title}</h1>
                <p className="text-xs text-muted-foreground">Phase {session.current_phase} of {session.total_phases}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-muted/50 rounded-full px-4 py-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-medium">{completedTasks}/{totalTasks} tasks</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={session.progress_percentage} className="w-24 h-2" />
              <span className="text-sm font-bold text-primary">{session.progress_percentage}%</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6">
        {/* Phase Progress Cards */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {phases.map((phase, idx) => (
              <motion.button
                key={phase.phase_number}
                onClick={() => {
                  setSelectedPhase(phase);
                  const firstTask = phase.tasks[0];
                  if (firstTask) setSelectedTask(firstTask);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-shrink-0 p-4 rounded-xl border transition-all min-w-[200px] text-left ${
                  selectedPhase?.phase_number === phase.phase_number
                    ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10'
                    : phase.is_completed
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-card/50 border-border/50 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{phaseEmojis[idx]}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{phase.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {phase.tasks.filter(t => t.is_completed).length}/{phase.tasks.length} complete
                    </p>
                  </div>
                  {phase.is_completed && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <Progress 
                  value={(phase.tasks.filter(t => t.is_completed).length / phase.tasks.length) * 100} 
                  className="h-1.5"
                />
              </motion.button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Panel - Task List */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-violet-500/5">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {selectedPhase?.title || 'Tasks'}
                </CardTitle>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="p-4 space-y-2">
                  {selectedPhase?.tasks.map((task, idx) => (
                    <motion.button
                      key={task.id}
                      onClick={() => selectTask(task, selectedPhase)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ x: 4 }}
                      className={`w-full group relative p-4 rounded-xl text-left transition-all ${
                        selectedTask?.id === task.id
                          ? 'bg-primary/15 border-2 border-primary shadow-lg shadow-primary/10'
                          : task.is_completed
                            ? 'bg-emerald-500/10 border border-emerald-500/30'
                            : 'bg-muted/30 border border-transparent hover:border-primary/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${task.is_completed ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          {completedTaskId === task.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : task.is_completed ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${taskTypeConfig[task.type].bg} ${taskTypeConfig[task.type].color}`}>
                              {taskTypeConfig[task.type].icon}
                              {task.type}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {task.estimated_time}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${
                          selectedTask?.id === task.id ? 'rotate-90' : 'group-hover:translate-x-1'
                        }`} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Right Panel - Interactive Area */}
          <div className="lg:col-span-8 space-y-4">
            {selectedTask ? (
              <>
                {/* Task Header Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="overflow-hidden">
                    <div className={`h-2 ${taskTypeConfig[selectedTask.type].bg}`} />
                    <CardContent className="pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${taskTypeConfig[selectedTask.type].bg} ${taskTypeConfig[selectedTask.type].color}`}>
                              {taskTypeConfig[selectedTask.type].icon}
                              {selectedTask.type}
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm bg-muted text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {selectedTask.estimated_time}
                            </span>
                            {selectedTask.is_completed && (
                              <Badge className="bg-emerald-500 text-white gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <h2 className="text-xl font-bold mb-2">{selectedTask.title}</h2>
                          <p className="text-muted-foreground">{selectedTask.description}</p>
                        </div>
                        {!selectedTask.is_completed && (
                          <Button 
                            onClick={completeTask} 
                            disabled={completedTaskId === selectedTask.id}
                            className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/20"
                          >
                            {completedTaskId === selectedTask.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            Complete Task
                          </Button>
                        )}
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-border/50">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => getQuickHelp('guide')}
                          disabled={isGenerating}
                          className="gap-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          Step-by-Step Guide
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => getQuickHelp('code')}
                          disabled={isGenerating}
                          className="gap-2"
                        >
                          <Code2 className="w-4 h-4" />
                          Generate Code
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => getQuickHelp('hint')}
                          disabled={isGenerating}
                          className="gap-2"
                        >
                          <Lightbulb className="w-4 h-4" />
                          Quick Hint
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* AI Chat Interface */}
                <Card className="overflow-hidden">
                  <CardHeader className="pb-3 bg-gradient-to-r from-violet-500/5 to-primary/5">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      AI Project Assistant
                      {isGenerating && (
                        <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Thinking...
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {/* Chat Messages */}
                    <ScrollArea className="h-[350px] p-4">
                      <div className="space-y-4">
                        {chatMessages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              msg.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-gradient-to-br from-violet-500 to-primary text-white'
                            }`}>
                              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                              <div className={`inline-block max-w-[90%] p-4 rounded-2xl ${
                                msg.role === 'user' 
                                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                  : 'bg-muted/50 rounded-tl-sm'
                              }`}>
                                <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'}`}>
                                  <ReactMarkdown
                                    components={{
                                      code: ({ className, children, ...props }) => {
                                        const isInline = !className;
                                        if (isInline) {
                                          return <code className="bg-background/50 px-1.5 py-0.5 rounded text-xs" {...props}>{children}</code>;
                                        }
                                        return (
                                          <div className="relative group my-3">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                              onClick={() => copyToClipboard(String(children))}
                                            >
                                              {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </Button>
                                            <pre className="bg-background/80 p-4 rounded-lg overflow-x-auto text-xs">
                                              <code {...props}>{children}</code>
                                            </pre>
                                          </div>
                                        );
                                      }
                                    }}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        {isGenerating && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-primary flex items-center justify-center">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-sm">
                              <div className="flex gap-1">
                                <motion.div 
                                  className="w-2 h-2 bg-primary rounded-full"
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div 
                                  className="w-2 h-2 bg-primary rounded-full"
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                />
                                <motion.div 
                                  className="w-2 h-2 bg-primary rounded-full"
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Input Area */}
                    <div className="p-4 border-t border-border/50 bg-muted/30">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ask anything about this task..."
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                          disabled={isGenerating}
                          className="bg-background"
                        />
                        <Button 
                          onClick={() => sendMessage()} 
                          disabled={isGenerating || !userInput.trim()}
                          size="icon"
                          className="flex-shrink-0"
                        >
                          {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-[500px] flex items-center justify-center">
                <CardContent className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mx-auto mb-4">
                      <Target className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Select a Task</h2>
                    <p className="text-muted-foreground max-w-sm">
                      Choose a task from the left panel to get started with AI-powered guidance
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Project Complete Banner */}
        {isProjectComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <Card className="bg-gradient-to-r from-emerald-500/10 via-primary/10 to-violet-500/10 border-emerald-500/30">
              <CardContent className="py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">🎉 Project Complete!</h2>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Congratulations! You've successfully built {session.project_title}. 
                  This project is now ready to add to your portfolio.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-6">
                  {session.skills_applied?.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <Button onClick={() => navigate('/dashboard')} className="gap-2">
                  Back to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ProjectBuilderNoAuth;
