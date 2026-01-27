import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Brain,
  Map,
  BarChart3,
  ChevronDown,
  Lightbulb,
  Target,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

interface CareerRoadmap {
  short_term?: string;
  mid_term?: string;
  long_term?: string;
}

interface SkillAnalysis {
  current_strengths?: string[];
  short_term_gaps?: string[];
  mid_term_gaps?: string[];
  long_term_gaps?: string[];
}

interface CareerAnalysisSectionProps {
  overallAssessment: string | null;
  careerRoadmap: CareerRoadmap | null;
  skillAnalysis: SkillAnalysis | null;
}

const CareerAnalysisSection = ({ 
  overallAssessment, 
  careerRoadmap, 
  skillAnalysis 
}: CareerAnalysisSectionProps) => {
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(true);
  const [isSkillsOpen, setIsSkillsOpen] = useState(true);

  const hasData = overallAssessment || careerRoadmap || skillAnalysis;

  if (!hasData) {
    return null;
  }

  return (
    <section className="mb-8 space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Brain className="w-5 h-5 text-primary" />
        Career Analysis Insights
      </h2>

      {/* Overall Assessment */}
      {overallAssessment && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Overall Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/90 leading-relaxed">
              {overallAssessment}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Career Roadmap */}
      {careerRoadmap && (careerRoadmap.short_term || careerRoadmap.mid_term || careerRoadmap.long_term) && (
        <Card>
          <Collapsible open={isRoadmapOpen} onOpenChange={setIsRoadmapOpen}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-primary" />
                    Career Roadmap Timeline
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isRoadmapOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="relative pl-6 space-y-6">
                  {/* Timeline line */}
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-violet-500" />
                  
                  {/* Short Term */}
                  {careerRoadmap.short_term && (
                    <div className="relative">
                      <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background" />
                      <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <Badge variant="outline" className="border-emerald-500 text-emerald-600 text-xs">
                            Short Term (0-12 months)
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/80">
                          {careerRoadmap.short_term}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mid Term */}
                  {careerRoadmap.mid_term && (
                    <div className="relative">
                      <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-background" />
                      <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-amber-600" />
                          <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                            Mid Term (1-3 years)
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/80">
                          {careerRoadmap.mid_term}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Long Term */}
                  {careerRoadmap.long_term && (
                    <div className="relative">
                      <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-violet-500 border-2 border-background" />
                      <div className="bg-violet-500/10 rounded-lg p-4 border border-violet-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-violet-600" />
                          <Badge variant="outline" className="border-violet-500 text-violet-600 text-xs">
                            Long Term (3-5 years)
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground/80">
                          {careerRoadmap.long_term}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Skill Analysis */}
      {skillAnalysis && (skillAnalysis.current_strengths?.length || skillAnalysis.short_term_gaps?.length || skillAnalysis.mid_term_gaps?.length || skillAnalysis.long_term_gaps?.length) && (
        <Card>
          <Collapsible open={isSkillsOpen} onOpenChange={setIsSkillsOpen}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Skill Gap Analysis
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isSkillsOpen ? 'rotate-180' : ''}`} />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Current Strengths */}
                  {skillAnalysis.current_strengths && skillAnalysis.current_strengths.length > 0 && (
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Current Strengths</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skillAnalysis.current_strengths.map((skill, i) => (
                          <Badge key={i} variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short Term Gaps */}
                  {skillAnalysis.short_term_gaps && skillAnalysis.short_term_gaps.length > 0 && (
                    <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Short Term Gaps</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skillAnalysis.short_term_gaps.map((skill, i) => (
                          <Badge key={i} variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mid Term Gaps */}
                  {skillAnalysis.mid_term_gaps && skillAnalysis.mid_term_gaps.length > 0 && (
                    <div className="bg-amber-500/5 rounded-lg p-4 border border-amber-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700">Mid Term Gaps</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skillAnalysis.mid_term_gaps.map((skill, i) => (
                          <Badge key={i} variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Long Term Gaps */}
                  {skillAnalysis.long_term_gaps && skillAnalysis.long_term_gaps.length > 0 && (
                    <div className="bg-violet-500/5 rounded-lg p-4 border border-violet-500/10">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-violet-600" />
                        <span className="text-sm font-medium text-violet-700">Long Term Gaps</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skillAnalysis.long_term_gaps.map((skill, i) => (
                          <Badge key={i} variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-700 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </section>
  );
};

export default CareerAnalysisSection;
