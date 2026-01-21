import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

interface LearningStep {
  skill_name: string;
  career_title: string;
  status?: string;
  learning_steps?: Array<{ title: string; description?: string }>;
}

interface LearningPlanOutputProps {
  data: LearningStep[];
}

const LearningPlanOutput: React.FC<LearningPlanOutputProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-foreground">Learning Plan</h4>
        <Badge variant="secondary" className="text-xs">{data.length} skills</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Personalized learning paths for missing skills:
      </p>
      
      <div className="space-y-2">
        {data.slice(0, 5).map((item, index) => (
          <div 
            key={index}
            className="p-3 rounded-lg bg-muted/50 border border-border/50"
          >
            <div className="flex items-center justify-between mb-1">
              <h5 className="font-medium text-foreground text-sm">{item.skill_name}</h5>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  index === 0 ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400' :
                  index === 1 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400' :
                  'bg-muted'
                }`}
              >
                {index === 0 ? 'High Priority' : index === 1 ? 'Medium' : 'Normal'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>Est. {index === 0 ? '2-3 weeks' : index === 1 ? '3-4 weeks' : '4+ weeks'}</span>
              <ArrowRight className="w-3 h-3" />
              <span>{item.career_title}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LearningPlanOutput;
