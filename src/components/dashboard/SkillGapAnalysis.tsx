import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BarChart3, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';

interface SkillAnalysis {
  current_strengths?: string[];
  short_term_gaps?: string[];
  mid_term_gaps?: string[];
  long_term_gaps?: string[];
}

interface SkillGapAnalysisProps {
  skillAnalysis: SkillAnalysis | null;
}

const SkillGapAnalysis = ({ skillAnalysis }: SkillGapAnalysisProps) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!skillAnalysis || (!skillAnalysis.current_strengths?.length && !skillAnalysis.short_term_gaps?.length && !skillAnalysis.mid_term_gaps?.length && !skillAnalysis.long_term_gaps?.length)) {
    return null;
  }

  return (
    <section className="mb-8">
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="w-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Skill Gap Analysis
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid md:grid-cols-2 gap-4">
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
    </section>
  );
};

export default SkillGapAnalysis;
