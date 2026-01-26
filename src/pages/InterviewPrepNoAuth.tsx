import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Sparkles, 
  HelpCircle, 
  Users, 
  Building2, 
  Lightbulb,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InterviewPrep {
  id: string;
  job_title: string;
  company_name: string;
  technical_questions: { question: string; hint: string; difficulty: string }[];
  behavioral_questions: { question: string; hint: string; example_answer_structure: string }[];
  company_specific_questions: { question: string; research_tip: string }[];
  preparation_tips: string[];
  key_talking_points: string[];
}

const InterviewPrepNoAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { toast } = useToast();
  const { resumeId } = useResume();

  const [isLoading, setIsLoading] = useState(true);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);

  useEffect(() => {
    if (!resumeId || !jobId) {
      navigate('/dashboard');
      return;
    }
    loadOrGeneratePrep();
  }, [resumeId, jobId]);

  const loadOrGeneratePrep = async () => {
    setIsLoading(true);
    try {
      // Try to load existing prep
      const { data: existingPrep } = await supabase
        .from('interview_preparation_result')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('job_id', jobId)
        .maybeSingle();

      if (existingPrep) {
        setPrep(existingPrep as unknown as InterviewPrep);
        setIsLoading(false);
        return;
      }

      // Generate new prep
      const { data, error } = await supabase.functions.invoke('interview-prep', {
        body: { resume_id: resumeId, job_id: jobId }
      });

      if (error) throw error;
      if (data?.success) {
        setPrep(data.data as InterviewPrep);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load interview preparation",
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
          <p>Generating interview preparation...</p>
        </div>
      </div>
    );
  }

  if (!prep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p>No interview preparation found</p>
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
              <span className="text-xl font-bold">Interview Prep</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{prep.job_title}</h1>
          <p className="text-muted-foreground">at {prep.company_name}</p>
        </div>

        {/* Key Talking Points */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Key Talking Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {prep.key_talking_points?.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Technical Questions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Technical Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prep.technical_questions?.map((q, i) => (
              <div key={i} className="border-b border-border/50 pb-4 last:border-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium">{q.question}</p>
                  <Badge variant={q.difficulty === 'hard' ? 'destructive' : q.difficulty === 'medium' ? 'secondary' : 'outline'}>
                    {q.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">💡 {q.hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Behavioral Questions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-500" />
              Behavioral Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prep.behavioral_questions?.map((q, i) => (
              <div key={i} className="border-b border-border/50 pb-4 last:border-0">
                <p className="font-medium mb-2">{q.question}</p>
                <p className="text-sm text-muted-foreground">💡 {q.hint}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Company-Specific Questions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-violet-500" />
              Company-Specific Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {prep.company_specific_questions?.map((q, i) => (
              <div key={i} className="border-b border-border/50 pb-4 last:border-0">
                <p className="font-medium mb-2">{q.question}</p>
                <p className="text-sm text-muted-foreground">🔍 {q.research_tip}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preparation Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Preparation Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {prep.preparation_tips?.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">✓</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InterviewPrepNoAuth;
