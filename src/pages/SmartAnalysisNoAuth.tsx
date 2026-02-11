import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, 
  Sparkles, 
  Building2, 
  Briefcase, 
  User,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Target,
  DollarSign,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActionStep {
  step: string;
  timeframe: string;
  priority: string;
}

interface SmartAnalysis {
  id: string;
  company_analysis: {
    company_overview: string;
    culture_insights: string;
    growth_opportunities: string;
    industry_standing: string;
    interview_culture_tips?: string;
  };
  role_analysis: {
    role_summary: string;
    key_responsibilities: string[];
    growth_path: string;
    challenges: string;
    day_in_the_life?: string;
    required_experience_years?: string;
  };
  resume_fit_analysis: {
    overall_match: string;
    strengths: string[];
    gaps: string[];
    improvement_areas: string[];
  };
  action_plan?: ActionStep[];
  salary_insights?: {
    expected_range: string;
    negotiation_tips: string;
  };
  recommendations: string[];
  overall_score: number;
}

const SmartAnalysisNoAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { toast } = useToast();
  const { resumeId } = useResume();

  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [analysis, setAnalysis] = useState<SmartAnalysis | null>(null);
  const [jobDetails, setJobDetails] = useState<{ job_title: string; company_name: string } | null>(null);

  useEffect(() => {
    if (!resumeId || !jobId) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [resumeId, jobId]);

  const handleApiError = (error: any) => {
    const status = error?.status || error?.context?.status;
    if (status === 429) {
      toast({ title: "Rate Limit", description: "Too many requests. Please wait a moment and try again.", variant: "destructive" });
      return true;
    }
    if (status === 402) {
      toast({ title: "Credits Exhausted", description: "AI credits have been used up. Please try again later.", variant: "destructive" });
      return true;
    }
    return false;
  };

  const loadData = async (forceRegenerate = false) => {
    if (forceRegenerate) {
      setIsRegenerating(true);
    } else {
      setIsLoading(true);
    }
    try {
      // Get job details
      const { data: job } = await supabase
        .from('job_matching_result')
        .select('job_title, company_name')
        .eq('id', jobId)
        .single();
      
      if (job) {
        setJobDetails(job);
      }

      if (!forceRegenerate) {
        const { data: existingAnalysis } = await supabase
          .from('smart_analysis_result')
          .select('*')
          .eq('resume_id', resumeId)
          .eq('job_id', jobId)
          .maybeSingle();

        if (existingAnalysis) {
          setAnalysis(existingAnalysis as unknown as SmartAnalysis);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.functions.invoke('smart-analysis', {
        body: { resume_id: resumeId, job_id: jobId, force_regenerate: forceRegenerate }
      });

      if (error) {
        if (!handleApiError(error)) throw error;
        return;
      }
      if (data?.success) {
        setAnalysis(data.data as SmartAnalysis);
        if (forceRegenerate) {
          toast({ title: "Regenerated", description: "Fresh analysis has been generated." });
        }
      } else if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error:', error);
      if (!handleApiError(error)) {
        toast({ title: "Error", description: "Failed to load smart analysis", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p>Generating smart analysis...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p>No analysis found</p>
          <Button onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Smart Analysis</span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(true)}
            disabled={isRegenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{jobDetails?.job_title}</h1>
          <p className="text-muted-foreground">at {jobDetails?.company_name}</p>
        </div>

        {/* Overall Score */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Overall Fit Score</h3>
              <span className="text-3xl font-bold text-primary">{analysis.overall_score}%</span>
            </div>
            <Progress value={analysis.overall_score} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2">
              {analysis.overall_score >= 80 ? 'Excellent match!' : 
               analysis.overall_score >= 60 ? 'Good potential with some improvements needed' : 
               'Consider upskilling before applying'}
            </p>
          </CardContent>
        </Card>

        {/* Salary Insights */}
        {analysis.salary_insights?.expected_range && (
          <Card className="mb-6 border-primary/20 bg-gradient-to-r from-green-500/5 to-emerald-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                Salary Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Expected Range</p>
                  <p className="text-lg font-semibold">{analysis.salary_insights.expected_range}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Negotiation Tips</p>
                  <p className="text-sm">{analysis.salary_insights.negotiation_tips}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              Company Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Overview</h4>
              <p className="text-sm text-muted-foreground">{analysis.company_analysis?.company_overview}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Culture Insights</h4>
              <p className="text-sm text-muted-foreground">{analysis.company_analysis?.culture_insights}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Growth Opportunities</h4>
              <p className="text-sm text-muted-foreground">{analysis.company_analysis?.growth_opportunities}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Industry Standing</h4>
              <p className="text-sm text-muted-foreground">{analysis.company_analysis?.industry_standing}</p>
            </div>
            {analysis.company_analysis?.interview_culture_tips && (
              <div className="p-3 bg-blue-500/5 rounded-lg">
                <h4 className="font-medium mb-1 text-blue-600">🎯 Interview Culture Tips</h4>
                <p className="text-sm text-muted-foreground">{analysis.company_analysis.interview_culture_tips}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-500" />
              Role Analysis
              {analysis.role_analysis?.required_experience_years && (
                <Badge variant="outline" className="ml-auto text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {analysis.role_analysis.required_experience_years} experience
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Summary</h4>
              <p className="text-sm text-muted-foreground">{analysis.role_analysis?.role_summary}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Key Responsibilities</h4>
              <ul className="space-y-1">
                {analysis.role_analysis?.key_responsibilities?.map((resp, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span> {resp}
                  </li>
                ))}
              </ul>
            </div>
            {analysis.role_analysis?.day_in_the_life && (
              <div className="p-3 bg-amber-500/5 rounded-lg">
                <h4 className="font-medium mb-1 flex items-center gap-1">
                  <CalendarDays className="w-4 h-4 text-amber-500" /> A Day in the Life
                </h4>
                <p className="text-sm text-muted-foreground">{analysis.role_analysis.day_in_the_life}</p>
              </div>
            )}
            <div>
              <h4 className="font-medium mb-1">Growth Path</h4>
              <p className="text-sm text-muted-foreground">{analysis.role_analysis?.growth_path}</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Potential Challenges</h4>
              <p className="text-sm text-muted-foreground">{analysis.role_analysis?.challenges}</p>
            </div>
          </CardContent>
        </Card>

        {/* Resume Fit Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-violet-500" />
              Resume Fit Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Overall Match</h4>
              <p className="text-sm text-muted-foreground">{analysis.resume_fit_analysis?.overall_match}</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="w-4 h-4" /> Strengths
                </h4>
                <ul className="space-y-1">
                  {analysis.resume_fit_analysis?.strengths?.map((s, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-green-500">✓</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1 text-red-600">
                  <AlertCircle className="w-4 h-4" /> Gaps
                </h4>
                <ul className="space-y-1">
                  {analysis.resume_fit_analysis?.gaps?.map((g, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-red-500">•</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Plan */}
        {analysis.action_plan && analysis.action_plan.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.action_plan.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.step}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getPriorityColor(item.priority) as any} className="text-xs">
                          {item.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.timeframe}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations?.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
                  <Badge className="mt-0.5">{i + 1}</Badge>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default SmartAnalysisNoAuth;
