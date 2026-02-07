import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Map, ChevronDown, Clock, TrendingUp, Target } from 'lucide-react';

interface CareerRoadmap {
  short_term?: string;
  mid_term?: string;
  long_term?: string;
}

interface CareerRoadmapTimelineProps {
  careerRoadmap: CareerRoadmap | null;
}

const CareerRoadmapTimeline = ({ careerRoadmap }: CareerRoadmapTimelineProps) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!careerRoadmap || (!careerRoadmap.short_term && !careerRoadmap.mid_term && !careerRoadmap.long_term)) {
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
                  <Map className="w-4 h-4 text-primary" />
                  Career Roadmap Timeline
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-violet-500" />

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
                      <p className="text-sm text-foreground/80">{careerRoadmap.short_term}</p>
                    </div>
                  </div>
                )}

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
                      <p className="text-sm text-foreground/80">{careerRoadmap.mid_term}</p>
                    </div>
                  </div>
                )}

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
                      <p className="text-sm text-foreground/80">{careerRoadmap.long_term}</p>
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

export default CareerRoadmapTimeline;
