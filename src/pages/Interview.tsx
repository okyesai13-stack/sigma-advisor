import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Circle,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  Loader2,
  AlertCircle,
  ChevronDown,
  Star,
  Building2,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: string;
  sample_answer?: string;
  tips?: string[];
}

interface JobAnalysis {
  key_requirements: string[];
  company_culture: string;
  growth_opportunities: string;
  challenges: string[];
}

interface ResumeAlignment {
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

interface PreparationItem {
  task: string;
  completed: boolean;
  priority: string;
  description?: string;
}

interface InterviewPreparation {
  id: string;
  job_id: string;
  company: string;
  role: string;
  readiness_score: number;
  interview_questions: InterviewQuestion[];
  job_analysis: JobAnalysis;
  resume_alignment: ResumeAlignment;
  preparation_checklist: PreparationItem[];
  created_at: string;
}

interface JobRecommendation {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  relevance_score: number;
  required_skills: string[];
}

const Interview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('id');

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [job, setJob] = useState<JobRecommendation | null>(null);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPreparation | null>(null);

  useEffect(() => {
    if (user && jobId) {
      loadInterviewData();
    } else if (!jobId) {
      toast({
        title: "Error",
        description: "No job ID provided",
        variant: "destructive"
      });
      navigate('/dashboard');
    }
  }, [user, jobId]);

  const loadInterviewData = async () => {
    if (!user || !jobId) return;

    try {
      setIsLoading(true);

      // Load job details
      const { data: jobData, error: jobError } = await supabase
        .from('ai_job_recommendations')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();

      if (jobError) {
        console.error('Error loading job:', jobError);
        toast({
          title: "Error",
          description: "Failed to load job details",
          variant: "destructive"
        });
        navigate('/dashboard');
        return;
      }

      setJob(jobData);

      // Load interview preparation
      const { data: prepData, error: prepError } = await supabase
        .from('interview_preparation')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .single();

      // Also try to get all interview preparations for debugging
      const { data: allPrepData } = await supabase
        .from('interview_preparation')
        .select('id, job_id, interview_questions')
        .eq('user_id', user.id);
      
      console.log('All interview preparations for user:', allPrepData);

      if (prepError) {
        console.error('Error loading interview preparation:', prepError);
        if (prepError.code !== 'PGRST116') { // Not found error
          toast({
            title: "Error",
            description: "Failed to load interview preparation",
            variant: "destructive"
          });
        }
      } else {
        console.log('Raw interview preparation data from database:', prepData);
        console.log('interview_questions field:', prepData.interview_questions);
        console.log('interview_questions stringified:', JSON.stringify(prepData.interview_questions, null, 2));
        console.log('Type of interview_questions:', typeof prepData.interview_questions);

        setIsLoadingQuestions(true);
        // Parse JSON fields safely
        const parseJsonField = (field: any, fallback: any) => {
          if (typeof field === 'object' && field !== null) {
            return field;
          }
          try {
            return JSON.parse(field);
          } catch {
            return fallback;
          }
        };

        // Enhanced parsing for interview questions
        const parseInterviewQuestions = (questionsData: any): InterviewQuestion[] => {
          console.log('Raw interview questions data:', questionsData);
          console.log('Questions data stringified:', JSON.stringify(questionsData, null, 2));
          
          if (!questionsData) {
            console.log('No questions data found');
            return [];
          }

          let parsedQuestions = parseJsonField(questionsData, questionsData);
          console.log('Parsed questions:', parsedQuestions);
          console.log('Parsed questions stringified:', JSON.stringify(parsedQuestions, null, 2));

          // Helper function to process a single question object
          const processQuestion = (q: any, index: number): InterviewQuestion => {
            return {
              question: q.question || q.text || q.prompt || q.query || q.title || `Question ${index + 1}`,
              category: q.category || q.type || q.section || q.topic || 'General',
              difficulty: q.difficulty || q.level || q.complexity || 'Medium',
              sample_answer: q.sample_answer || q.answer || q.sample_response || q.suggested_answer || q.response || q.example_answer,
              tips: Array.isArray(q.tips) ? q.tips : 
                    Array.isArray(q.advice) ? q.advice :
                    Array.isArray(q.hints) ? q.hints :
                    Array.isArray(q.suggestions) ? q.suggestions :
                    q.tips ? [q.tips] : 
                    q.advice ? [q.advice] : 
                    q.hints ? [q.hints] : 
                    q.suggestions ? [q.suggestions] : []
            };
          };

          // Handle direct array of questions
          if (Array.isArray(parsedQuestions)) {
            console.log('Found array of questions, processing...', parsedQuestions.length, 'questions');
            return parsedQuestions.map((q: any, index: number) => {
              const processed = processQuestion(q, index);
              console.log(`Processed question ${index + 1}:`, processed);
              return processed;
            });
          }

          // If it's an object, check for various possible nested structures
          if (typeof parsedQuestions === 'object' && parsedQuestions !== null) {
            console.log('Found object, checking for nested structures...');
            
            // Check for common nested properties that might contain arrays
            const possibleArrays = [
              parsedQuestions.questions,
              parsedQuestions.interview_questions,
              parsedQuestions.items,
              parsedQuestions.data,
              parsedQuestions.list,
              parsedQuestions.content,
              parsedQuestions.results,
              parsedQuestions.entries
            ];

            for (const arr of possibleArrays) {
              if (Array.isArray(arr) && arr.length > 0) {
                console.log('Found questions in nested structure:', arr.length, 'questions');
                return arr.map((q: any, index: number) => {
                  const processed = processQuestion(q, index);
                  console.log(`Processed nested question ${index + 1}:`, processed);
                  return processed;
                });
              }
            }

            // Check if the object itself has question properties (single question)
            if (parsedQuestions.question || parsedQuestions.text || parsedQuestions.prompt) {
              console.log('Found single question object');
              return [processQuestion(parsedQuestions, 0)];
            }

            // Check if it's a flat object with numbered keys (like {0: {question: ...}, 1: {question: ...}})
            const keys = Object.keys(parsedQuestions);
            const numericKeys = keys.filter(key => !isNaN(Number(key))).sort((a, b) => Number(a) - Number(b));
            if (numericKeys.length > 0) {
              console.log('Found object with numeric keys, converting to array:', numericKeys.length, 'questions');
              const questionsArray = numericKeys.map(key => parsedQuestions[key]);
              return questionsArray.map((q: any, index: number) => {
                const processed = processQuestion(q, index);
                console.log(`Processed numeric key question ${index + 1}:`, processed);
                return processed;
              });
            }

            // Check if it's an object where each property is a question
            const questionKeys = keys.filter(key => {
              const item = parsedQuestions[key];
              return item && typeof item === 'object' && (item.question || item.text || item.prompt);
            });
            
            if (questionKeys.length > 0) {
              console.log('Found object with question properties:', questionKeys.length, 'questions');
              return questionKeys.map((key, index) => {
                const processed = processQuestion(parsedQuestions[key], index);
                console.log(`Processed property question ${index + 1}:`, processed);
                return processed;
              });
            }

            // Check if it's an object with category-based arrays (like technical, behavioral, company_specific)
            const categoryKeys = keys.filter(key => {
              const item = parsedQuestions[key];
              return Array.isArray(item) && item.length > 0;
            });
            
            if (categoryKeys.length > 0) {
              console.log('Found object with category arrays:', categoryKeys, 'total categories');
              const allQuestions: InterviewQuestion[] = [];
              
              categoryKeys.forEach(category => {
                const categoryQuestions = parsedQuestions[category];
                console.log(`Processing ${category} category with ${categoryQuestions.length} questions`);
                
                categoryQuestions.forEach((q: any, index: number) => {
                  const processed = processQuestion({
                    ...q,
                    category: q.category || category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) // Format category name
                  }, allQuestions.length);
                  console.log(`Processed ${category} question ${index + 1}:`, processed);
                  allQuestions.push(processed);
                });
              });
              
              console.log('Total questions processed from categories:', allQuestions.length);
              return allQuestions;
            }

            // Log all properties to help debug
            console.log('Object properties:', Object.keys(parsedQuestions));
            console.log('Sample property values:', Object.keys(parsedQuestions).slice(0, 3).map(key => ({
              key,
              value: parsedQuestions[key],
              type: typeof parsedQuestions[key]
            })));
          }

          console.log('No valid questions structure found, returning empty array');
          return [];
        };

        const formattedPrep: InterviewPreparation = {
          id: prepData.id,
          job_id: prepData.job_id || '',
          company: prepData.company || jobData.company_name || '',
          role: prepData.role || jobData.job_title || '',
          readiness_score: prepData.readiness_score || 0,
          interview_questions: parseInterviewQuestions(prepData.interview_questions),
          job_analysis: parseJsonField(prepData.job_analysis, {
            key_requirements: [],
            company_culture: '',
            growth_opportunities: '',
            challenges: []
          }),
          resume_alignment: parseJsonField(prepData.resume_alignment, {
            strengths: [],
            gaps: [],
            recommendations: []
          }),
          preparation_checklist: parseJsonField(prepData.preparation_checklist, []),
          created_at: prepData.created_at || ''
        };

        console.log('Final formatted prep data:', formattedPrep);
        console.log('Number of questions found:', formattedPrep.interview_questions.length);

        setInterviewPrep(formattedPrep);
        setIsLoadingQuestions(false);
      }

    } catch (error) {
      console.error('Error loading interview data:', error);
      toast({
        title: "Error",
        description: "Failed to load interview data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDifficultyColor = (difficulty: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Loading interview preparation...</h3>
              <p className="text-sm text-muted-foreground">Gathering your interview data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Job Not Found</h3>
          <p className="text-sm text-muted-foreground mb-4">The requested job could not be found.</p>
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
              <Briefcase className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Interview Preparation</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
        {/* Job Header */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{job.job_title}</CardTitle>
                  <div className="flex items-center gap-4 text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {job.company_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">
                      {job.relevance_score}% Match
                    </Badge>
                    {interviewPrep && (
                      <Badge className={`${getReadinessColor(interviewPrep.readiness_score)} bg-opacity-10`}>
                        {interviewPrep.readiness_score}% Ready
                      </Badge>
                    )}
                  </div>
                </div>
                {interviewPrep && (
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-2">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${interviewPrep.readiness_score}, 100`}
                          className={getReadinessColor(interviewPrep.readiness_score)}
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
                        <span className={`text-lg font-bold ${getReadinessColor(interviewPrep.readiness_score)}`}>
                          {interviewPrep.readiness_score}%
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">Readiness Score</p>
                  </div>
                )}
              </div>
            </CardHeader>
          </Card>
        </div>

        {interviewPrep ? (
          /* Interview Preparation Content */
          <Tabs defaultValue="questions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="questions" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Questions ({interviewPrep.interview_questions.length})
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Job Analysis
              </TabsTrigger>
              <TabsTrigger value="alignment" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Resume Fit
              </TabsTrigger>
              <TabsTrigger value="checklist" className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Checklist ({interviewPrep.preparation_checklist.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-4">
              {(() => {
                console.log('Rendering questions tab');
                console.log('interviewPrep:', interviewPrep);
                console.log('interview_questions:', interviewPrep?.interview_questions);
                console.log('questions length:', interviewPrep?.interview_questions?.length);
                return null;
              })()}
              {isLoadingQuestions ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Loading Questions...</h3>
                    <p className="text-muted-foreground">Parsing interview questions data</p>
                  </CardContent>
                </Card>
              ) : interviewPrep && interviewPrep.interview_questions && interviewPrep.interview_questions.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Interview Questions ({interviewPrep.interview_questions.length})
                    </h3>
                    <Badge variant="outline">
                      {interviewPrep.interview_questions.length} Questions Available
                    </Badge>
                  </div>
                  {interviewPrep.interview_questions.map((question, index) => (
                    <Card key={index} className="group hover:border-primary/30 transition-colors">
                      <Collapsible>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="secondary" className="text-xs">
                                    Q{index + 1}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {question.category || 'General'}
                                  </Badge>
                                  <Badge className={`${getDifficultyColor(question.difficulty)} text-xs`}>
                                    {question.difficulty || 'Medium'}
                                  </Badge>
                                </div>
                                <CardTitle className="text-base">{question.question}</CardTitle>
                              </div>
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {question.sample_answer && (
                              <div className="mb-4">
                                <h5 className="font-medium text-foreground mb-2">Sample Answer:</h5>
                                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                  {question.sample_answer}
                                </p>
                              </div>
                            )}
                            {question.tips && question.tips.length > 0 && (
                              <div>
                                <h5 className="font-medium text-foreground mb-2">Tips:</h5>
                                <ul className="space-y-1">
                                  {question.tips.map((tip, tipIndex) => (
                                    <li key={tipIndex} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <Star className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                      {tip}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Interview Questions Available</h3>
                    <p className="text-muted-foreground mb-4">
                      {interviewPrep ? 
                        "Interview questions data exists but couldn't be parsed properly. Please check the console for debugging information." :
                        "Interview preparation for this job hasn't been generated yet."
                      }
                    </p>
                    {!interviewPrep && (
                      <Button className="gap-2">
                        <Target className="w-4 h-4" />
                        Generate Interview Preparation
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Key Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interviewPrep.job_analysis.key_requirements?.length > 0 ? (
                      <div className="space-y-2">
                        {interviewPrep.job_analysis.key_requirements.map((req, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm">{req}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No key requirements available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Company Culture
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {interviewPrep.job_analysis.company_culture || 'No company culture information available'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Growth Opportunities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {interviewPrep.job_analysis.growth_opportunities || 'No growth opportunities information available'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      Challenges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interviewPrep.job_analysis.challenges?.length > 0 ? (
                      <div className="space-y-2">
                        {interviewPrep.job_analysis.challenges.map((challenge, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <span className="text-sm text-orange-700">{challenge}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No challenges identified</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alignment" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interviewPrep.resume_alignment.strengths?.length > 0 ? (
                      <div className="space-y-2">
                        {interviewPrep.resume_alignment.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 border border-green-200">
                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-green-700">{strength}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No strengths identified</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                      <AlertCircle className="w-5 h-5" />
                      Gaps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interviewPrep.resume_alignment.gaps?.length > 0 ? (
                      <div className="space-y-2">
                        {interviewPrep.resume_alignment.gaps.map((gap, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                            <span className="text-sm text-orange-700">{gap}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No gaps identified</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Target className="w-5 h-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {interviewPrep.resume_alignment.recommendations?.length > 0 ? (
                      <div className="space-y-2">
                        {interviewPrep.resume_alignment.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 border border-blue-200">
                            <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span className="text-sm text-blue-700">{rec}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recommendations available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              {interviewPrep.preparation_checklist.length > 0 ? (
                <div className="space-y-4">
                  {interviewPrep.preparation_checklist.map((item, index) => (
                    <Card key={index} className={`group hover:border-primary/30 transition-colors ${item.completed ? 'bg-green-50 border-green-200' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {item.completed ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className={`font-medium ${item.completed ? 'text-green-800 line-through' : 'text-foreground'}`}>
                                {item.task}
                              </h4>
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority || 'Medium'} Priority
                              </Badge>
                            </div>
                            {item.description && (
                              <p className={`text-sm ${item.completed ? 'text-green-700 line-through' : 'text-muted-foreground'}`}>
                                {item.description}
                              </p>
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
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Preparation Checklist</h3>
                    <p className="text-muted-foreground">Preparation checklist will appear here once generated.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          /* No Interview Preparation Available */
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Interview Preparation Available</h3>
              <p className="text-muted-foreground mb-6">
                Interview preparation for this job hasn't been generated yet. 
                Start the preparation process to get personalized questions and guidance.
              </p>
              <Button className="gap-2">
                <Target className="w-4 h-4" />
                Start Interview Preparation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Interview;