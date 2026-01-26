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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SmartAnalysis {
  id: string;
  company_analysis: {
    company_overview: string;
    culture_insights: string;
    growth_opportunities: string;
    industry_standing: string;
  };
  role_analysis: {
    role_summary: string;
    key_responsibilities: string[];
    growth_path: string;
    challenges: string;
  };
  resume_fit_analysis: {
    overall_match: string;
    strengths: string[];
    gaps: string[];
    improvement_areas: string[];
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
  const [analysis, setAnalysis] = useState<SmartAnalysis | null>(null);
  const [jobDetails, setJobDetails] = useState<{ job_title: string; company_name: string } | null>(null);

  useEffect(() => {
    if (!resumeId || !jobId) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [resumeId, jobId]);

  const loadData = async () => {
    setIsLoading(true);
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

      // Try to load existing analysis
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

      // Generate new analysis
      const { data, error } = await supabase.functions.invoke('smart-analysis', {
        body: { resume_id: resumeId, job_id: jobId }
      });

      if (error) throw error;
      if (data?.success) {
        setAnalysis(data.data as SmartAnalysis);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load smart analysis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          </CardContent>
        </Card>

        {/* Role Analysis */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-500" />
              Role Analysis
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
