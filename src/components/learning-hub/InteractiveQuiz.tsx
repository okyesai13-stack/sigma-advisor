import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trophy,
  Loader2,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface InteractiveQuizProps {
  skillName: string;
  onComplete: (score: number) => void;
}

const InteractiveQuiz = ({ skillName, onComplete }: InteractiveQuizProps) => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    generateQuiz();
  }, [skillName]);

  const generateQuiz = async () => {
    setIsLoading(true);
    setQuizCompleted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setAnswers([]);

    try {
      const { data, error } = await supabase.functions.invoke('learning-quiz', {
        body: { skill_name: skillName }
      });

      if (error) throw error;

      if (data?.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(null));
      } else {
        // Fallback questions
        const fallbackQuestions = [
          {
            id: 0,
            question: `What is a key benefit of learning ${skillName}?`,
            options: [
              'Career advancement opportunities',
              'No practical applications',
              'It\'s outdated technology',
              'Only useful for beginners'
            ],
            correctAnswer: 0,
            explanation: `Learning ${skillName} opens up many career opportunities and is highly valued in the industry.`
          },
          {
            id: 1,
            question: `Which approach is best for mastering ${skillName}?`,
            options: [
              'Just reading documentation',
              'Combination of theory and practice',
              'Watching videos only',
              'Memorizing everything'
            ],
            correctAnswer: 1,
            explanation: 'A balanced approach combining theory with hands-on practice is most effective for deep learning.'
          },
          {
            id: 2,
            question: `What should you focus on when starting with ${skillName}?`,
            options: [
              'Advanced concepts first',
              'Fundamentals and core concepts',
              'Edge cases only',
              'Skip basics entirely'
            ],
            correctAnswer: 1,
            explanation: 'Building a strong foundation with fundamentals is essential before moving to advanced topics.'
          },
          {
            id: 3,
            question: `How can you best retain knowledge of ${skillName}?`,
            options: [
              'Cram before tests',
              'Learn once and forget',
              'Regular practice and spaced repetition',
              'Never review material'
            ],
            correctAnswer: 2,
            explanation: 'Spaced repetition and regular practice help solidify knowledge in long-term memory.'
          },
          {
            id: 4,
            question: `What indicates mastery of ${skillName}?`,
            options: [
              'Ability to teach others',
              'Memorizing all syntax',
              'Completing one tutorial',
              'Reading one book'
            ],
            correctAnswer: 0,
            explanation: 'Being able to teach others demonstrates deep understanding and true mastery of a subject.'
          }
        ];
        setQuestions(fallbackQuestions);
        setAnswers(new Array(fallbackQuestions.length).fill(null));
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Using sample questions",
        description: "AI-generated quiz unavailable",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      const correctCount = answers.filter((a, i) => a === questions[i]?.correctAnswer).length;
      const finalCorrectCount = selectedAnswer === questions[currentQuestionIndex]?.correctAnswer 
        ? correctCount + 1 
        : correctCount;
      const score = Math.round((finalCorrectCount / questions.length) * 100);
      onComplete(score);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correctAnswer;
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Calculate final score
  const calculateScore = () => {
    const correctCount = answers.filter((a, i) => a === questions[i]?.correctAnswer).length;
    return Math.round((correctCount / questions.length) * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Generating quiz for {skillName}...</p>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    const finalScore = calculateScore();
    return (
      <Card className="overflow-hidden">
        <div className={`h-2 ${finalScore >= 70 ? 'bg-green-500' : finalScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} />
        <CardContent className="py-12 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${
              finalScore >= 70 ? 'text-yellow-500' : 'text-muted-foreground'
            }`} />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
          <p className="text-4xl font-bold mb-4">
            <span className={finalScore >= 70 ? 'text-green-600' : finalScore >= 50 ? 'text-amber-600' : 'text-red-600'}>
              {finalScore}%
            </span>
          </p>
          <p className="text-muted-foreground mb-6">
            You got {answers.filter((a, i) => a === questions[i]?.correctAnswer).length} out of {questions.length} questions correct
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={generateQuiz}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            {finalScore < 100 && (
              <Button onClick={generateQuiz}>
                New Questions
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Knowledge Check
          </CardTitle>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
        </div>
        <Progress value={progressPercentage} className="h-2 mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-4 bg-muted/50 rounded-xl">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <h3 className="text-lg font-medium">{currentQuestion?.question}</h3>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion?.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrectAnswer = index === currentQuestion.correctAnswer;
                
                let optionClass = 'border-border hover:border-primary/50 hover:bg-primary/5';
                
                if (showResult) {
                  if (isCorrectAnswer) {
                    optionClass = 'border-green-500 bg-green-500/10';
                  } else if (isSelected && !isCorrectAnswer) {
                    optionClass = 'border-red-500 bg-red-500/10';
                  }
                } else if (isSelected) {
                  optionClass = 'border-primary bg-primary/10';
                }

                return (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`
                      w-full p-4 rounded-xl border-2 text-left transition-all
                      ${optionClass}
                      ${showResult ? 'cursor-default' : 'cursor-pointer'}
                    `}
                    whileHover={!showResult ? { scale: 1.01 } : {}}
                    whileTap={!showResult ? { scale: 0.99 } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                        ${isSelected && !showResult ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                        ${showResult && isCorrectAnswer ? 'bg-green-500 text-white' : ''}
                        ${showResult && isSelected && !isCorrectAnswer ? 'bg-red-500 text-white' : ''}
                      `}>
                        {showResult && isCorrectAnswer ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : showResult && isSelected && !isCorrectAnswer ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          String.fromCharCode(65 + index)
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl ${isCorrect ? 'bg-green-500/10 border border-green-500/30' : 'bg-amber-500/10 border border-amber-500/30'}`}
              >
                <p className="font-medium mb-1">
                  {isCorrect ? '✓ Correct!' : '✗ Not quite right'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentQuestion?.explanation}
                </p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4">
              {!showResult ? (
                <Button 
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                >
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleNextQuestion}>
                  {currentQuestionIndex < questions.length - 1 ? (
                    <>
                      Next Question
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      See Results
                      <Trophy className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default InteractiveQuiz;
