import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Sparkles, 
  ArrowLeft, 
  Bot, 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  Clock, 
  BookOpen,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Loader2,
  Zap,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoleAtRisk {
  role: string;
  risk_level: string;
  timeline: string;
  reason: string;
  mitigation: string;
}

interface AIEnhancedRole {
  role: string;
  description: string;
  match_score: number;
  skills_required: string[];
  current_skills_match: string[];
  missing_skills: string[];
  salary_range: string;
  growth_potential: string;
  timeline_to_ready: string;
}

interface SkillToAcquire {
  skill: string;
  importance: string;
  learning_path: string;
  estimated_time: string;
}

interface PreparationRoadmap {
  short_term: string[];
  mid_term: string[];
  long_term: string[];
}

interface AIRoleAnalysisData {
  roles_at_risk: RoleAtRisk[];
  ai_enhanced_roles: AIEnhancedRole[];
  current_ai_ready_skills: string[];
  skills_to_acquire: SkillToAcquire[];
  preparation_roadmap: PreparationRoadmap;
  overall_ai_readiness_score: number;
  key_insights: string;
}

const AIRolesNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeId } = useResume();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AIRoleAnalysisData | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<number>>(new Set([0]));
  const [expandedRisks, setExpandedRisks] = useState(false);

  useEffect(() => {
    if (!resumeId) {
      navigate('/setup');
      return;
    }
    loadData();
  }, [resumeId]);

  const loadData = async () => {
    try {
      const { data: result, error } = await supabase
        .from('ai_role_analysis_result')
        .select('*')
        .eq('resume_id', resumeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (result) {
        setData({
          roles_at_risk: result.roles_at_risk as unknown as RoleAtRisk[],
          ai_enhanced_roles: result.ai_enhanced_roles as unknown as AIEnhancedRole[],
          current_ai_ready_skills: result.current_ai_ready_skills || [],
          skills_to_acquire: result.skills_to_acquire as unknown as SkillToAcquire[],
          preparation_roadmap: result.preparation_roadmap as unknown as PreparationRoadmap,
          overall_ai_readiness_score: result.overall_ai_readiness_score || 0,
          key_insights: result.key_insights || ''
        });
      } else {
        toast({
          title: "No Analysis Found",
          description: "Please run the Sigma analysis first",
          variant: "destructive",
        });
        navigate('/sigma');
      }
    } catch (error) {
      console.error('Error loading AI roles data:', error);
      toast({
        title: "Error",
        description: "Failed to load AI roles analysis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRole = (index: number) => {
    setExpandedRoles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance.toLowerCase()) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-amber-500';
      case 'low': return 'border-l-emerald-500';
      default: return 'border-l-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading AI Role Analysis...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const readinessScore = data.overall_ai_readiness_score;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">AI Role Analysis</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl">
        {/* AI Readiness Overview */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-500/5">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Score Circle */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-32 h-32 -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="fill-none stroke-muted stroke-[8]"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    className="fill-none stroke-primary stroke-[8]"
                    strokeDasharray={`${(readinessScore / 100) * 351.8} 351.8`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-primary">{readinessScore}%</span>
                  <span className="text-xs text-muted-foreground">AI Ready</span>
                </div>
              </div>
              
              {/* Insights */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold mb-2 flex items-center gap-2 justify-center md:justify-start">
                  <Sparkles className="w-6 h-6 text-primary" />
                  Your AI Career Potential
                </h1>
                <p className="text-muted-foreground">{data.key_insights}</p>
                <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                  <Badge variant="outline" className="bg-primary/10">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {data.ai_enhanced_roles.length} AI Roles Identified
                  </Badge>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {data.current_ai_ready_skills.length} AI-Ready Skills
                  </Badge>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600">
                    <Target className="w-3 h-3 mr-1" />
                    {data.skills_to_acquire.length} Skills to Acquire
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles at Risk - Collapsible */}
        {data.roles_at_risk?.length > 0 && (
          <Collapsible open={expandedRisks} onOpenChange={setExpandedRisks} className="mb-8">
            <Card className="border-amber-500/20">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Roles at Risk from AI ({data.roles_at_risk.length})
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${expandedRisks ? 'rotate-180' : ''}`} />
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {data.roles_at_risk.map((risk, index) => (
                    <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{risk.role}</h4>
                        <Badge variant="outline" className={getRiskColor(risk.risk_level)}>
                          {risk.risk_level} Risk
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        Timeline: {risk.timeline}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{risk.reason}</p>
                      <div className="flex items-start gap-2 p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                        <Zap className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-400">{risk.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* AI-Enhanced Roles - Main Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Top 3 AI-Enhanced Roles for You
          </h2>
          <div className="space-y-4">
            {data.ai_enhanced_roles.map((role, index) => (
              <Card key={index} className="border-l-4 border-l-primary overflow-hidden">
                <Collapsible open={expandedRoles.has(index)} onOpenChange={() => toggleRole(index)}>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                            {index + 1}
                          </span>
                          <div className="text-left">
                            <CardTitle className="text-lg">{role.role}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-primary/10 text-primary text-lg px-3 py-1">
                            {role.match_score}%
                          </Badge>
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedRoles.has(index) ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 border-t">
                      <div className="grid md:grid-cols-2 gap-6 pt-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                          {/* Role Details */}
                          <div className="flex flex-wrap gap-3">
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              {role.growth_potential} Growth
                            </Badge>
                            <Badge variant="outline">
                              <Clock className="w-3 h-3 mr-1" />
                              {role.timeline_to_ready}
                            </Badge>
                            <Badge variant="outline" className="bg-primary/10">
                              {role.salary_range}
                            </Badge>
                          </div>

                          {/* Skills You Have */}
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              Skills You Have
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {role.current_skills_match?.map((skill, i) => (
                                <Badge key={i} variant="outline" className="bg-emerald-500/10 text-emerald-600 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          {/* Missing Skills */}
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-amber-500" />
                              Skills to Acquire
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {role.missing_skills?.map((skill, i) => (
                                <Badge key={i} variant="outline" className="bg-amber-500/10 text-amber-600 text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* All Required Skills */}
                          <div>
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Target className="w-4 h-4 text-primary" />
                              All Required Skills
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {role.skills_required?.map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        </section>

        {/* Skills Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* AI-Ready Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Your AI-Ready Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.current_ai_ready_skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="bg-emerald-500/10 text-emerald-600">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Skills to Acquire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-amber-500" />
                Skills to Acquire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.skills_to_acquire.slice(0, 4).map((skill, i) => (
                <div key={i} className={`p-3 rounded-lg border-l-4 ${getImportanceColor(skill.importance)} bg-muted/50`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <Badge variant="outline" className="text-xs">
                      {skill.estimated_time}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{skill.learning_path}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Preparation Roadmap */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              AI Career Preparation Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Short Term */}
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                <h4 className="font-semibold text-emerald-600 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Short Term (0-6 months)
                </h4>
                <ul className="space-y-2">
                  {data.preparation_roadmap?.short_term?.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Mid Term */}
              <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <h4 className="font-semibold text-amber-600 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Mid Term (6-18 months)
                </h4>
                <ul className="space-y-2">
                  {data.preparation_roadmap?.mid_term?.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Long Term */}
              <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20">
                <h4 className="font-semibold text-violet-600 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Long Term (18+ months)
                </h4>
                <ul className="space-y-2">
                  {data.preparation_roadmap?.long_term?.map((item, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="text-center">
          <Button onClick={() => navigate('/dashboard')} size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
};

export default AIRolesNoAuth;
