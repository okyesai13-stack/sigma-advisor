import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Brain, Star } from 'lucide-react';

interface CareerAnalysisOutputProps {
  data: {
    career_advice: {
      roles?: Array<{
        role: string;
        domain?: string;
        match_score?: number;
        rationale?: string;
      }>;
    };
  };
}

const CareerAnalysisOutput: React.FC<CareerAnalysisOutputProps> = ({ data }) => {
  const roles = data.career_advice?.roles || [];

  if (roles.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-foreground">Career Paths</h4>
        <Badge variant="secondary" className="text-xs">{roles.length} roles</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Based on your resume and profile, these career roles align with your experience:
      </p>
      <div className="space-y-2">
        {roles.slice(0, 3).map((role, index) => (
          <div 
            key={index}
            className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-1">
              <h5 className="font-medium text-foreground text-sm">{role.role}</h5>
              {role.match_score && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {role.match_score}%
                </Badge>
              )}
            </div>
            {role.rationale && (
              <p className="text-xs text-muted-foreground line-clamp-2">{role.rationale}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerAnalysisOutput;
