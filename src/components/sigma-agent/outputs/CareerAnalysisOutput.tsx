import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Star, Clock, Target, TrendingUp, ArrowRight } from 'lucide-react';

interface CareerRole {
  id?: string;
  role: string;
  term?: 'short' | 'mid' | 'long';
  term_label?: string;
  domain?: string;
  match_score?: number;
  rationale?: string;
  required_skills?: string[];
  skills_to_develop?: string[];
  growth_potential?: string;
  alignment_to_goal?: string;
}

interface CareerAnalysisOutputProps {
  data: {
    career_advice: {
      roles?: CareerRole[];
      career_summary?: string;
      total_timeline?: string;
    };
  };
}

const getTermIcon = (term?: string) => {
  switch (term) {
    case 'short':
      return <Clock className="w-4 h-4" />;
    case 'mid':
      return <TrendingUp className="w-4 h-4" />;
    case 'long':
      return <Target className="w-4 h-4" />;
    default:
      return <Star className="w-4 h-4" />;
  }
};

const getTermColor = (term?: string) => {
  switch (term) {
    case 'short':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    case 'mid':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'long':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/30';
    default:
      return 'bg-primary/10 text-primary border-primary/30';
  }
};

const CareerAnalysisOutput: React.FC<CareerAnalysisOutputProps> = ({ data }) => {
  const roles = data.career_advice?.roles || [];
  const careerSummary = data.career_advice?.career_summary;
  const totalTimeline = data.career_advice?.total_timeline;

  if (roles.length === 0) return null;

  // Sort roles by term order: short -> mid -> long
  const sortedRoles = [...roles].sort((a, b) => {
    const order = { short: 0, mid: 1, long: 2 };
    return (order[a.term || 'short'] || 0) - (order[b.term || 'short'] || 0);
  });

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-foreground">Your Career Path</h4>
        {totalTimeline && (
          <Badge variant="secondary" className="text-xs">{totalTimeline}</Badge>
        )}
      </div>
      
      {careerSummary && (
        <p className="text-xs text-muted-foreground mb-4 p-2 bg-muted/30 rounded-md border border-border/50">
          {careerSummary}
        </p>
      )}

      <div className="relative">
        {/* Timeline connector */}
        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-violet-500 opacity-30" />
        
        <div className="space-y-3">
          {sortedRoles.map((role, index) => (
            <div key={role.id || index} className="relative">
              {/* Timeline dot */}
              <div className={`absolute left-3 top-4 w-4 h-4 rounded-full border-2 bg-background z-10 ${
                role.term === 'short' ? 'border-emerald-500' : 
                role.term === 'mid' ? 'border-amber-500' : 
                'border-violet-500'
              }`} />
              
              <div 
                className={`ml-10 p-4 rounded-lg border transition-all hover:shadow-md ${getTermColor(role.term)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getTermIcon(role.term)}
                    <span className="text-xs font-medium opacity-80">
                      {role.term_label || (role.term === 'short' ? 'Short-term' : role.term === 'mid' ? 'Mid-term' : 'Long-term')}
                    </span>
                  </div>
                  {role.match_score && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1 bg-background/50">
                      <Star className="w-3 h-3" />
                      {role.match_score}% match
                    </Badge>
                  )}
                </div>
                
                <h5 className="font-semibold text-foreground text-base mb-1">{role.role}</h5>
                
                {role.domain && (
                  <p className="text-xs opacity-70 mb-2">{role.domain}</p>
                )}
                
                {role.rationale && (
                  <p className="text-sm opacity-90 mb-3">{role.rationale}</p>
                )}

                {role.alignment_to_goal && (
                  <div className="flex items-start gap-2 text-xs opacity-80 mb-3 p-2 bg-background/30 rounded">
                    <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{role.alignment_to_goal}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs">
                  {role.required_skills && role.required_skills.length > 0 && (
                    <div className="flex-1 min-w-[120px]">
                      <span className="font-medium opacity-70">Skills needed:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {role.required_skills.slice(0, 4).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-background/50">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {role.skills_to_develop && role.skills_to_develop.length > 0 && (
                    <div className="flex-1 min-w-[120px]">
                      <span className="font-medium opacity-70">To develop:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {role.skills_to_develop.slice(0, 3).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerAnalysisOutput;
