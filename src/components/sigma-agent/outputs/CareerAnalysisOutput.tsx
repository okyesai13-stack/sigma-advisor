import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Star, Clock, Target, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CareerMatch {
  role: string;
  domain?: string;
  progression_stage: 'short_term' | 'mid_term' | 'long_term';
  timeline?: string;
  top_skills?: string[];
  match_score?: number;
  why_fit?: string;
  salary_range?: string;
  growth_potential?: string;
  skills_to_develop?: string[];
  key_milestones?: string[];
  prerequisites?: string;
  alignment_to_goal?: string;
}

interface CareerAnalysisOutputProps {
  data: {
    career_advice?: {
      roles?: any[];
      career_summary?: string;
      total_timeline?: string;
    };
    careerAdvice?: {
      career_matches?: CareerMatch[];
      skill_analysis?: {
        current_strengths?: string[];
        short_term_gaps?: string[];
        mid_term_gaps?: string[];
        long_term_gaps?: string[];
      };
      career_roadmap?: {
        short_term?: string;
        mid_term?: string;
        long_term?: string;
      };
      overall_assessment?: string;
    };
  };
}

const getStageIcon = (stage: string) => {
  switch (stage) {
    case 'short_term':
      return <Clock className="w-4 h-4" />;
    case 'mid_term':
      return <TrendingUp className="w-4 h-4" />;
    case 'long_term':
      return <Target className="w-4 h-4" />;
    default:
      return <Star className="w-4 h-4" />;
  }
};

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'short_term':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    case 'mid_term':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    case 'long_term':
      return 'bg-violet-500/10 text-violet-600 border-violet-500/30';
    default:
      return 'bg-primary/10 text-primary border-primary/30';
  }
};

const getStageLabel = (stage: string, timeline?: string) => {
  switch (stage) {
    case 'short_term':
      return timeline || 'Short-term (0-12 months)';
    case 'mid_term':
      return timeline || 'Mid-term (1-3 years)';
    case 'long_term':
      return timeline || 'Long-term (3-5 years)';
    default:
      return timeline || 'Career Role';
  }
};

const CareerAnalysisOutput: React.FC<CareerAnalysisOutputProps> = ({ data }) => {
  // Support both old and new data structures
  const careerAdvice = data.careerAdvice || data.career_advice;
  const careerMatches = (careerAdvice as any)?.career_matches || [];
  const oldRoles = (data.career_advice as any)?.roles || [];
  const overallAssessment = (careerAdvice as any)?.overall_assessment || (data.career_advice as any)?.career_summary;

  // Convert old format to new format if needed
  const roles: CareerMatch[] = careerMatches.length > 0 
    ? careerMatches 
    : oldRoles.map((role: any) => ({
        role: role.role,
        domain: role.domain,
        progression_stage: role.term === 'short' ? 'short_term' : role.term === 'mid' ? 'mid_term' : 'long_term',
        timeline: role.term_label,
        top_skills: role.required_skills,
        match_score: role.match_score,
        why_fit: role.rationale,
        skills_to_develop: role.skills_to_develop,
        alignment_to_goal: role.alignment_to_goal
      }));

  if (roles.length === 0) return null;

  // Sort roles by progression stage order: short_term -> mid_term -> long_term
  const sortedRoles = [...roles].sort((a, b) => {
    const order = { short_term: 0, mid_term: 1, long_term: 2 };
    return (order[a.progression_stage] || 0) - (order[b.progression_stage] || 0);
  });

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-foreground">Your Career Progression Path</h4>
      </div>
      
      {overallAssessment && (
        <p className="text-xs text-muted-foreground mb-4 p-2 bg-muted/30 rounded-md border border-border/50">
          {overallAssessment}
        </p>
      )}

      <div className="relative">
        {/* Timeline connector */}
        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b from-emerald-500 via-amber-500 to-violet-500 opacity-30" />
        
        <div className="space-y-3">
          {sortedRoles.map((role, index) => (
            <div key={index} className="relative">
              {/* Timeline dot */}
              <div className={`absolute left-3 top-4 w-4 h-4 rounded-full border-2 bg-background z-10 ${
                role.progression_stage === 'short_term' ? 'border-emerald-500' : 
                role.progression_stage === 'mid_term' ? 'border-amber-500' : 
                'border-violet-500'
              }`} />
              
              <div 
                className={`ml-10 p-4 rounded-lg border transition-all hover:shadow-md ${getStageColor(role.progression_stage)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStageIcon(role.progression_stage)}
                    <span className="text-xs font-medium opacity-80">
                      {getStageLabel(role.progression_stage, role.timeline)}
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
                
                {role.why_fit && (
                  <p className="text-sm opacity-90 mb-3">{role.why_fit}</p>
                )}

                {role.alignment_to_goal && (
                  <div className="flex items-start gap-2 text-xs opacity-80 mb-3 p-2 bg-background/30 rounded">
                    <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{role.alignment_to_goal}</span>
                  </div>
                )}

                {role.key_milestones && role.key_milestones.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs font-medium opacity-70">Key Milestones:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {role.key_milestones.map((milestone, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs opacity-80">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{milestone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 text-xs">
                  {role.top_skills && role.top_skills.length > 0 && (
                    <div className="flex-1 min-w-[120px]">
                      <span className="font-medium opacity-70">Required Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {role.top_skills.slice(0, 4).map((skill, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-background/50">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {role.skills_to_develop && role.skills_to_develop.length > 0 && (
                    <div className="flex-1 min-w-[120px]">
                      <span className="font-medium opacity-70">Skills to Develop:</span>
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

                {role.salary_range && (
                  <div className="mt-2 text-xs opacity-70">
                    <span className="font-medium">Expected Salary:</span> {role.salary_range}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareerAnalysisOutput;
