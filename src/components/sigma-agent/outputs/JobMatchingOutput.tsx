import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, CheckCircle2, Clock } from 'lucide-react';

interface JobRec {
  job_title: string;
  company_name: string;
  location?: string;
  relevance_score?: number;
  career_role?: string;
}

interface JobMatchingOutputProps {
  data: JobRec[];
}

const JobMatchingOutput: React.FC<JobMatchingOutputProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const getReadinessLabel = (score?: number) => {
    if (!score) return { label: 'Unknown', variant: 'secondary' as const };
    if (score >= 75) return { label: 'Ready', icon: CheckCircle2 };
    return { label: 'Almost Ready', icon: Clock };
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Briefcase className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-foreground">Job Matches</h4>
        <Badge variant="secondary" className="text-xs">{data.length} jobs</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Realistic job opportunities aligned with your profile:
      </p>
      
      <div className="space-y-2">
        {data.slice(0, 4).map((job, index) => {
          const readiness = getReadinessLabel(job.relevance_score);
          const ReadinessIcon = readiness.icon || CheckCircle2;
          
          return (
            <div 
              key={index}
              className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-1">
                <h5 className="font-medium text-foreground text-sm">{job.job_title}</h5>
                <Badge 
                  variant="outline" 
                  className={`text-xs flex items-center gap-1 ${
                    readiness.label === 'Ready' 
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400' 
                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400'
                  }`}
                >
                  <ReadinessIcon className="w-3 h-3" />
                  {readiness.label}
                </Badge>
              </div>
              <p className="text-xs text-primary font-medium">{job.company_name}</p>
              {job.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  {job.location}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default JobMatchingOutput;
