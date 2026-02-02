import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Brain, 
  Network, 
  GitBranch, 
  Target,
  CheckCircle2,
  Circle,
  Sparkles,
  BookOpen,
  Video,
  GraduationCap,
  ExternalLink,
  Trophy,
  Zap,
  RefreshCw,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import MindMapVisualization from '@/components/learning-hub/MindMapVisualization';
import LearningFlowchart from '@/components/learning-hub/LearningFlowchart';
import InteractiveQuiz from '@/components/learning-hub/InteractiveQuiz';
import AITutorChat from '@/components/learning-hub/AITutorChat';
import { useLearningContent } from '@/hooks/useLearningContent';
import type { MindMapNode, LearningStep, QuizQuestion } from '@/hooks/useLearningContent';

interface LearningPlan {
  id: string;
  skill_name: string;
  career_title: string;
  recommended_courses: {
    name: string;
    platform: string;
    url: string;
    duration: string;
    level?: string;
  }[];
  recommended_videos: {
    title: string;
    channel: string;
    url: string;
    duration: string;
  }[];
  status: string;
}

interface LearningProgress {
  totalTopics: number;
  completedTopics: number;
  quizScore: number;
  timeSpent: number;
}

const AILearningHubNoAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { resumeId, isReady } = useResume();
  
  const skillId = searchParams.get('skillId');
  const skillName = searchParams.get('skill');
  
  const currentSkill = skillName || 'Skill';
  
  // Use the learning content hook to persist data
  const { 
    content: savedContent, 
    isLoading: isContentLoading,
    saveMindMap,
    markMindMapComplete,
    saveFlowchart,
    markFlowchartComplete,
    saveQuiz,
    saveQuizResult
  } = useLearningContent(resumeId, skillId, currentSkill);
  
  const [learningPlan, setLearningPlan] = useState<LearningPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [progress, setProgress] = useState<LearningProgress>({
    totalTopics: 5,
    completedTopics: 0,
    quizScore: 0,
    timeSpent: 0
  });
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());
  
  // Load initial completion state from saved content
  useEffect(() => {
    if (savedContent) {
      const sections = new Set<string>();
      if (savedContent.mind_map_completed) sections.add('mindmap');
      if (savedContent.flowchart_completed) sections.add('flowchart');
      if (savedContent.quiz_completed) sections.add('quiz');
      setCompletedSections(sections);
      
      if (savedContent.quiz_score !== null) {
        setProgress(prev => ({
          ...prev,
          quizScore: savedContent.quiz_score!,
          completedTopics: sections.size
        }));
      }
    }
  }, [savedContent]);
  
  useEffect(() => {
    if (!isReady) return;
    
    if (!resumeId) {
      navigate('/setup');
      return;
    }
    loadLearningData();
  }, [resumeId, skillId, isReady]);

  const loadLearningData = async () => {
    if (!resumeId) return;
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('learning_plan_result')
        .select('*')
        .eq('resume_id', resumeId);
      
      if (skillId) {
        query = query.eq('id', skillId);
      }
      
      const { data, error } = await query.limit(1).maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setLearningPlan(data as unknown as LearningPlan);
      }
    } catch (error) {
      console.error('Error loading learning data:', error);
      toast({
        title: "Error",
        description: "Failed to load learning data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markSectionComplete = async (section: string) => {
    setCompletedSections(prev => {
      const newSet = new Set(prev);
      newSet.add(section);
      return newSet;
    });
    setProgress(prev => ({
      ...prev,
      completedTopics: prev.completedTopics + 1
    }));
    
    // Persist to database
    try {
      if (section === 'mindmap') {
        await markMindMapComplete();
      } else if (section === 'flowchart' || section.startsWith('step-')) {
        // Mark flowchart complete when all steps or explicitly marked
        if (section === 'flowchart') {
          await markFlowchartComplete();
        }
      }
    } catch (error) {
      console.error('Error saving section completion:', error);
    }
    
    toast({
      title: "Progress Saved!",
      description: `Completed: ${section}`,
    });
  };

  const updateQuizScore = async (score: number) => {
    setProgress(prev => ({
      ...prev,
      quizScore: Math.max(prev.quizScore, score)
    }));
    
    // Save quiz result to database
    try {
      await saveQuizResult(score);
    } catch (error) {
      console.error('Error saving quiz score:', error);
    }
  };
  
  // Handlers for saving AI-generated content
  const handleMindMapGenerated = async (data: MindMapNode) => {
    try {
      await saveMindMap(data);
    } catch (error) {
      console.error('Error saving mind map:', error);
    }
  };
  
  const handleFlowchartGenerated = async (data: LearningStep[]) => {
    try {
      await saveFlowchart(data);
    } catch (error) {
      console.error('Error saving flowchart:', error);
    }
  };
  
  const handleQuizGenerated = async (data: QuizQuestion[]) => {
    try {
      await saveQuiz(data);
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  if (!isReady || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p>Loading AI Learning Hub...</p>
        </div>
      </div>
    );
  }

  const displaySkill = skillName || learningPlan?.skill_name || 'Skill';
  const progressPercentage = (progress.completedTopics / progress.totalTopics) * 100;

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
              <Brain className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">AI Learning Hub</span>
            </div>
          </div>
          <Badge variant="outline" className="font-mono">
            {currentSkill}
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-violet-500/10 to-primary/10 border-primary/20">
            <CardContent className="py-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    {progressPercentage === 100 && (
                      <motion.div 
                        className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold mb-1">Learn: {currentSkill}</h1>
                    <p className="text-muted-foreground">
                      {progress.completedTopics} of {progress.totalTopics} topics completed
                    </p>
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span className="font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  {progress.quizScore > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Quiz Best Score: {progress.quizScore}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Learning Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mx-auto">
            <TabsTrigger value="overview" className="gap-2">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="mindmap" className="gap-2">
              <Network className="w-4 h-4" />
              <span className="hidden sm:inline">Mind Map</span>
            </TabsTrigger>
            <TabsTrigger value="flowchart" className="gap-2">
              <GitBranch className="w-4 h-4" />
              <span className="hidden sm:inline">Path</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Quiz</span>
            </TabsTrigger>
            <TabsTrigger value="tutor" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Tutor</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Resources Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary" />
                    Curated Resources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Courses */}
                  {learningPlan?.recommended_courses && learningPlan.recommended_courses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4" /> Courses
                      </h4>
                      <ul className="space-y-3">
                        {learningPlan.recommended_courses.map((course, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex-1">
                              <a 
                                href={course.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline flex items-center gap-1"
                              >
                                {course.name}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <p className="text-sm text-muted-foreground">
                                {course.platform} • {course.duration}
                                {course.level && ` • ${course.level}`}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={completedSections.has(`course-${i}`) ? "default" : "outline"}
                              onClick={() => markSectionComplete(`course-${i}`)}
                            >
                              {completedSections.has(`course-${i}`) ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Videos */}
                  {learningPlan?.recommended_videos && learningPlan.recommended_videos.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Video className="w-4 h-4" /> Videos
                      </h4>
                      <ul className="space-y-3">
                        {learningPlan.recommended_videos.map((video, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex-1">
                              <a 
                                href={video.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="font-medium text-primary hover:underline flex items-center gap-1"
                              >
                                {video.title}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <p className="text-sm text-muted-foreground">
                                {video.channel} • {video.duration}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant={completedSections.has(`video-${i}`) ? "default" : "outline"}
                              onClick={() => markSectionComplete(`video-${i}`)}
                            >
                              {completedSections.has(`video-${i}`) ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    Learning Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-16"
                    onClick={() => setActiveTab('mindmap')}
                  >
                    <Network className="w-6 h-6 text-violet-500" />
                    <div className="text-left">
                      <p className="font-medium">Mind Map</p>
                      <p className="text-sm text-muted-foreground">Visualize concept connections</p>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-16"
                    onClick={() => setActiveTab('flowchart')}
                  >
                    <GitBranch className="w-6 h-6 text-emerald-500" />
                    <div className="text-left">
                      <p className="font-medium">Learning Path</p>
                      <p className="text-sm text-muted-foreground">Step-by-step progression</p>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-16"
                    onClick={() => setActiveTab('quiz')}
                  >
                    <Target className="w-6 h-6 text-amber-500" />
                    <div className="text-left">
                      <p className="font-medium">Take Quiz</p>
                      <p className="text-sm text-muted-foreground">Test your understanding</p>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-16"
                    onClick={() => setActiveTab('tutor')}
                  >
                    <Sparkles className="w-6 h-6 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">AI Tutor</p>
                      <p className="text-sm text-muted-foreground">Get personalized help</p>
                    </div>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Mind Map Tab */}
          <TabsContent value="mindmap">
            <MindMapVisualization 
              skillName={currentSkill} 
              onComplete={() => markSectionComplete('mindmap')}
              isCompleted={completedSections.has('mindmap')}
              savedData={savedContent?.mind_map_data}
              onDataGenerated={handleMindMapGenerated}
            />
          </TabsContent>

          {/* Flowchart Tab */}
          <TabsContent value="flowchart">
            <LearningFlowchart 
              skillName={currentSkill}
              onStepComplete={(step) => markSectionComplete(`step-${step}`)}
              completedSteps={Array.from(completedSections).filter(s => s.startsWith('step-')).map(s => parseInt(s.replace('step-', '')))}
              savedData={savedContent?.flowchart_data}
              onDataGenerated={handleFlowchartGenerated}
            />
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz">
            <InteractiveQuiz 
              skillName={currentSkill}
              onComplete={(score) => {
                updateQuizScore(score);
                markSectionComplete('quiz');
              }}
              savedData={savedContent?.quiz_data}
              savedScore={savedContent?.quiz_score}
              onDataGenerated={handleQuizGenerated}
            />
          </TabsContent>

          {/* AI Tutor Tab */}
          <TabsContent value="tutor">
            <AITutorChat 
              skillName={currentSkill}
              resumeId={resumeId || ''}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AILearningHubNoAuth;
