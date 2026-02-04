import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  ArrowLeft, 
  Mic, 
  Send, 
  Clock, 
  Brain,
  CheckCircle2,
  XCircle,
  Loader2,
  Target,
  TrendingUp,
  Trophy,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  AlertCircle,
  Keyboard,
  Volume2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceRecorder from '@/components/interview/VoiceRecorder';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface Question {
  question: string;
  type: 'technical' | 'behavioral';
  difficulty: 'easy' | 'medium' | 'hard';
  key_points: string[];
  ideal_answer_structure: string;
  time_limit_seconds: number;
}

interface Evaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  sample_better_answer: string;
  confidence_level: 'low' | 'medium' | 'high';
}

type InterviewState = 'loading' | 'ready' | 'answering' | 'evaluating' | 'feedback' | 'complete';

const MockInterviewNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeId } = useResume();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [state, setState] = useState<InterviewState>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [overallResults, setOverallResults] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [jobInfo, setJobInfo] = useState<{ title: string; company: string } | null>(null);
  const [allAnswers, setAllAnswers] = useState<{ question: Question; answer: string; evaluation: Evaluation }[]>([]);
  const [answerMode, setAnswerMode] = useState<'text' | 'voice'>('text');
  const [voiceAnalysis, setVoiceAnalysis] = useState<any>(null);

  // Voice recording hook
  const voiceRecording = useVoiceRecording({
    onTranscript: (text) => {
      setAnswer(text);
    },
    onFinalTranscript: (text) => {
      setAnswer(text);
    },
  });

  useEffect(() => {
    if (!resumeId || !jobId) {
      navigate('/dashboard');
      return;
    }
    startInterview();
  }, [resumeId, jobId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  const startInterview = async () => {
    try {
      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/mock-interview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'start',
            resume_id: resumeId,
            job_id: jobId,
            interview_type: 'mixed',
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setSessionId(result.session_id);
      setCurrentQuestion(result.current_question);
      setQuestionNumber(result.question_number);
      setTotalQuestions(result.total_questions);
      setTimeRemaining(result.current_question.time_limit_seconds || 120);
      setState('ready');

      // Get job info
      const { data: job } = await supabase
        .from('job_matching_result')
        .select('job_title, company_name')
        .eq('id', jobId)
        .single();

      if (job) {
        setJobInfo({ title: job.job_title, company: job.company_name });
      }

    } catch (error) {
      console.error('Failed to start interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
      navigate('/dashboard');
    }
  };

  const startAnswering = () => {
    setState('answering');
    setIsTimerActive(true);
    textareaRef.current?.focus();
  };

  const submitAnswer = async () => {
    if (!answer.trim() || !sessionId) return;

    setIsTimerActive(false);
    
    // Stop voice recording if active
    if (voiceRecording.isRecording) {
      voiceRecording.stopRecording();
    }
    
    setState('evaluating');

    try {
      // If using voice mode, also get voice analysis
      let voiceAnalysisResult = null;
      if (answerMode === 'voice' && voiceRecording.transcription) {
        const voiceResponse = await fetch(
          'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/voice-interview',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'analyze_voice',
              session_id: sessionId,
              transcript: answer.trim(),
              question: currentQuestion?.question,
            }),
          }
        );
        const voiceResult = await voiceResponse.json();
        if (voiceResult.success) {
          voiceAnalysisResult = voiceResult.analysis;
          setVoiceAnalysis(voiceAnalysisResult);
        }
      }

      const response = await fetch(
        'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/mock-interview',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'answer',
            session_id: sessionId,
            answer: answer.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setEvaluation(result.evaluation);
      setAllAnswers(prev => [...prev, { 
        question: currentQuestion!, 
        answer: answer.trim(), 
        evaluation: result.evaluation 
      }]);

      if (result.is_complete) {
        setOverallResults({
          score: result.overall_score,
          feedback: result.overall_feedback,
          strengths: result.strengths,
          improvements: result.improvements,
        });
        setState('complete');
      } else {
        setState('feedback');
      }

    } catch (error) {
      console.error('Failed to submit answer:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate answer. Please try again.",
        variant: "destructive",
      });
      setState('answering');
    }
  };

  const nextQuestion = async () => {
    // Fetch next question from last API response (stored in state during submitAnswer)
    const response = await fetch(
      'https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/mock-interview',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          session_id: sessionId,
        }),
      }
    );

    const result = await response.json();
    const session = result.session;
    const questions = session.questions;
    const nextIndex = session.current_question_index;

    if (nextIndex < questions.length) {
      setCurrentQuestion(questions[nextIndex]);
      setQuestionNumber(nextIndex + 1);
      setTimeRemaining(questions[nextIndex].time_limit_seconds || 120);
      setAnswer('');
      setEvaluation(null);
      setVoiceAnalysis(null);
      voiceRecording.setTranscription('');
      setState('ready');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
      case 'hard': return 'bg-rose-500/20 text-rose-500 border-rose-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-rose-500';
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Preparing Your Interview</h2>
          <p className="text-muted-foreground">AI is generating personalized questions...</p>
        </motion.div>
      </div>
    );
  }

  if (state === 'complete' && overallResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Interview Complete</span>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className={`text-7xl font-bold mb-4 ${getScoreColor(overallResults.score)}`}>
              {overallResults.score}%
            </div>
            <p className="text-lg text-muted-foreground">{overallResults.feedback}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {overallResults.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-emerald-500 mt-0.5">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {overallResults.improvements.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-amber-500 mt-0.5">→</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {allAnswers.map((item, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50 border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Q{index + 1}: {item.question.question.slice(0, 60)}...</span>
                    <Badge className={getScoreColor(item.evaluation.score)}>
                      {item.evaluation.score}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.evaluation.feedback}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Mock Interview</span>
            {jobInfo && (
              <Badge variant="outline" className="ml-2">
                {jobInfo.title} @ {jobInfo.company}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              Question {questionNumber}/{totalQuestions}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Progress */}
        <div className="mb-8">
          <Progress value={(questionNumber / totalQuestions) * 100} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          {/* Ready State - Show Question */}
          {state === 'ready' && currentQuestion && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                        {currentQuestion.difficulty}
                      </Badge>
                      <Badge variant="outline">
                        {currentQuestion.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(currentQuestion.time_limit_seconds)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <h2 className="text-2xl font-semibold mb-6">{currentQuestion.question}</h2>
                  
                  <div className="p-4 rounded-lg bg-muted/50 mb-6">
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      Key Points to Cover
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {currentQuestion.key_points.map((point, i) => (
                        <li key={i}>• {point}</li>
                      ))}
                    </ul>
                  </div>

                  <Button size="lg" className="w-full" onClick={startAnswering}>
                    Start Answering
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Answering State */}
          {state === 'answering' && currentQuestion && (
            <motion.div
              key="answering"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold line-clamp-2">{currentQuestion.question}</h2>
                    <div className={`flex items-center gap-2 font-mono ${timeRemaining < 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      <Clock className="w-4 h-4" />
                      <span className="text-xl">{formatTime(timeRemaining)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Answer Mode Toggle */}
                  <Tabs value={answerMode} onValueChange={(v) => setAnswerMode(v as 'text' | 'voice')} className="mb-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="text" className="gap-2">
                        <Keyboard className="w-4 h-4" />
                        Type Answer
                      </TabsTrigger>
                      <TabsTrigger value="voice" className="gap-2" disabled={!voiceRecording.isSupported}>
                        <Mic className="w-4 h-4" />
                        Voice Answer
                        {!voiceRecording.isSupported && <span className="text-xs">(Not supported)</span>}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="text" className="mt-4">
                      <Textarea
                        ref={textareaRef}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer here... Be detailed and specific."
                        className="min-h-[200px] resize-none mb-4"
                      />
                    </TabsContent>
                    
                    <TabsContent value="voice" className="mt-4">
                      <VoiceRecorder
                        isRecording={voiceRecording.isRecording}
                        onStartRecording={voiceRecording.startRecording}
                        onStopRecording={voiceRecording.stopRecording}
                        transcription={voiceRecording.transcription || answer}
                        isTranscribing={voiceRecording.isTranscribing}
                        audioLevel={voiceRecording.audioLevel}
                      />
                      {voiceRecording.error && (
                        <p className="text-destructive text-sm mt-2">{voiceRecording.error}</p>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {answer.length} characters
                      {answerMode === 'voice' && voiceRecording.isRecording && (
                        <span className="ml-2 text-destructive">● Recording...</span>
                      )}
                    </p>
                    <Button onClick={submitAnswer} disabled={!answer.trim() || voiceRecording.isRecording}>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Answer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Evaluating State */}
          {state === 'evaluating' && (
            <motion.div
              key="evaluating"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Analyzing Your Answer</h3>
              <p className="text-muted-foreground">AI is evaluating your response...</p>
            </motion.div>
          )}

          {/* Feedback State */}
          {state === 'feedback' && evaluation && currentQuestion && (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Feedback
                    </CardTitle>
                    <div className={`text-4xl font-bold ${getScoreColor(evaluation.score)}`}>
                      {evaluation.score}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-lg">{evaluation.feedback}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-success">
                        <CheckCircle2 className="w-4 h-4" />
                        Strengths
                      </div>
                      <ul className="space-y-1 text-sm">
                        {evaluation.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-warning">
                        <AlertCircle className="w-4 h-4" />
                        Improvements
                      </div>
                      <ul className="space-y-1 text-sm">
                        {evaluation.improvements.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Voice Analysis Feedback */}
                  {voiceAnalysis && (
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-primary">
                        <Volume2 className="w-4 h-4" />
                        Communication Analysis
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="text-center p-2 rounded bg-background">
                          <div className="text-2xl font-bold text-primary">{voiceAnalysis.clarity_score}/10</div>
                          <div className="text-xs text-muted-foreground">Clarity</div>
                        </div>
                        <div className="text-center p-2 rounded bg-background">
                          <div className="text-2xl font-bold text-primary">{voiceAnalysis.confidence_score}/10</div>
                          <div className="text-xs text-muted-foreground">Confidence</div>
                        </div>
                        <div className="text-center p-2 rounded bg-background">
                          <div className="text-2xl font-bold text-primary">{voiceAnalysis.structure_score}/10</div>
                          <div className="text-xs text-muted-foreground">Structure</div>
                        </div>
                        <div className="text-center p-2 rounded bg-background">
                          <div className="text-2xl font-bold text-primary">{voiceAnalysis.overall_communication_score}</div>
                          <div className="text-xs text-muted-foreground">Overall</div>
                        </div>
                      </div>
                      {voiceAnalysis.quick_tip && (
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">💡 Tip:</span> {voiceAnalysis.quick_tip}
                        </p>
                      )}
                    </div>
                  )}

                  {evaluation.sample_better_answer && (
                    <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="text-sm font-medium mb-2 text-primary">💡 Sample Improved Answer</div>
                      <p className="text-sm text-muted-foreground">{evaluation.sample_better_answer}</p>
                    </div>
                  )}

                  <Button className="w-full" onClick={nextQuestion}>
                    Next Question
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MockInterviewNoAuth;
