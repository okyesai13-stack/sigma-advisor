import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, 
  Sparkles, 
  HelpCircle, 
  Users, 
  Building2, 
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InterviewPrep {
  id: string;
  job_title: string;
  company_name: string;
  technical_questions: { question: string; hint: string; difficulty: string; sample_answer_outline?: string }[];
  behavioral_questions: { question: string; hint: string; example_answer_structure?: string }[];
  company_specific_questions: { question: string; research_tip: string; why_it_matters?: string }[];
  preparation_tips: string[];
  key_talking_points: string[];
  dos_and_donts?: { dos: string[]; donts: string[] };
}

const InterviewPrepNoAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const { toast } = useToast();
  const { resumeId } = useResume();

  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);

  useEffect(() => {
    if (!resumeId || !jobId) {
      navigate('/dashboard');
      return;
    }
    loadOrGeneratePrep();
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

  const loadOrGeneratePrep = async (forceRegenerate = false) => {
    if (forceRegenerate) {
      setIsRegenerating(true);
    } else {
      setIsLoading(true);
    }
    try {
      if (!forceRegenerate) {
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
      }

      const { data, error } = await supabase.functions.invoke('interview-prep', {
        body: { resume_id: resumeId, job_id: jobId, force_regenerate: forceRegenerate }
      });

      if (error) {
        if (!handleApiError(error)) throw error;
        return;
      }
      if (data?.success) {
        setPrep(data.data as InterviewPrep);
        if (forceRegenerate) {
          toast({ title: "Regenerated", description: "Fresh interview prep has been generated." });
        }
      } else if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      console.error('Error:', error);
      if (!handleApiError(error)) {
        toast({ title: "Error", description: "Failed to load interview preparation", variant: "destructive" });
      }
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadOrGeneratePrep(true)}
            disabled={isRegenerating}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </Button>
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

        {/* Do's and Don'ts */}
        {prep.dos_and_donts && (prep.dos_and_donts.dos?.length > 0 || prep.dos_and_donts.donts?.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="w-5 h-5 text-primary" />
                Do's and Don'ts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-green-600">
                    <ThumbsUp className="w-4 h-4" /> Do's
                  </h4>
                  <ul className="space-y-2">
                    {prep.dos_and_donts.dos?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2 text-red-600">
                    <ThumbsDown className="w-4 h-4" /> Don'ts
                  </h4>
                  <ul className="space-y-2">
                    {prep.dos_and_donts.donts?.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-red-500 mt-0.5">✗</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <p className="text-sm text-muted-foreground mb-2">💡 {q.hint}</p>
                {q.sample_answer_outline && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto">
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show Answer Guide
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-primary/5 rounded-lg text-sm whitespace-pre-line">
                        {q.sample_answer_outline}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
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
                <p className="text-sm text-muted-foreground mb-2">💡 {q.hint}</p>
                {q.example_answer_structure && (
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs text-primary p-0 h-auto">
                        <ChevronDown className="w-3 h-3 mr-1" />
                        Show STAR Example
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 p-3 bg-amber-500/5 rounded-lg text-sm whitespace-pre-line">
                        {q.example_answer_structure}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
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
                {q.why_it_matters && (
                  <p className="text-xs text-muted-foreground/70 mt-1 italic">💬 Why they ask: {q.why_it_matters}</p>
                )}
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
