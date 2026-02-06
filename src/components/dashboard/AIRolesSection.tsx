import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, ArrowRight, Sparkles, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface AIRoleAnalysisData {
  ai_enhanced_roles: AIEnhancedRole[];
  overall_ai_readiness_score: number;
  key_insights: string;
}

interface AIRolesSectionProps {
  resumeId: string;
}

const AIRolesSection = ({ resumeId }: AIRolesSectionProps) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AIRoleAnalysisData | null>(null);

  useEffect(() => {
    loadData();
  }, [resumeId]);

  const loadData = async () => {
    try {
      const { data: result, error } = await supabase
        .from('ai_role_analysis_result')
        .select('ai_enhanced_roles, overall_ai_readiness_score, key_insights')
        .eq('resume_id', resumeId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (result) {
        setData({
          ai_enhanced_roles: result.ai_enhanced_roles as unknown as AIEnhancedRole[],
          overall_ai_readiness_score: result.overall_ai_readiness_score || 0,
          key_insights: result.key_insights || ''
        });
      }
    } catch (error) {
      console.error('Error loading AI roles data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.ai_enhanced_roles?.length) {
    return null;
  }

  const readinessScore = data.overall_ai_readiness_score;
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  return (
    <section className="mb-8">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-violet-500/5 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <span>AI Future Roles</span>
            </div>
            <Badge variant="outline" className="bg-primary/10 border-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by Gemini 3
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Readiness Score */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-card/50 border border-border/50">
            <div className="flex-shrink-0">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="fill-none stroke-muted stroke-[4]"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    className="fill-none stroke-primary stroke-[4]"
                    strokeDasharray={`${(readinessScore / 100) * 175.9} 175.9`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-lg font-bold ${getScoreColor(readinessScore)}`}>
                    {readinessScore}%
                  </span>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">AI Readiness Score</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data.key_insights || 'Your potential to transition into AI-enhanced roles'}
              </p>
            </div>
          </div>

          {/* Top 3 AI Roles */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Top 3 AI Roles for You:</p>
            {data.ai_enhanced_roles.slice(0, 3).map((role, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{role.role}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs py-0">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {role.growth_potential}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{role.timeline_to_ready}</span>
                    </div>
                  </div>
                </div>
                <Badge 
                  className={`
                    ${role.match_score >= 80 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : ''}
                    ${role.match_score >= 60 && role.match_score < 80 ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : ''}
                    ${role.match_score < 60 ? 'bg-primary/10 text-primary border-primary/30' : ''}
                  `}
                  variant="outline"
                >
                  {role.match_score}% match
                </Badge>
              </div>
            ))}
          </div>

          {/* Full View Button */}
          <Button 
            onClick={() => navigate('/ai-roles')}
            className="w-full gap-2"
            variant="outline"
          >
            Full View
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default AIRolesSection;
