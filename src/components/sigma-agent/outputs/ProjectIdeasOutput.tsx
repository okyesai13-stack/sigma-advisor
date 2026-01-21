import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Code2 } from 'lucide-react';

interface ProjectIdea {
  title: string;
  description?: string;
  domain?: string;
}

interface ProjectIdeasOutputProps {
  data: ProjectIdea[];
}

const ProjectIdeasOutput: React.FC<ProjectIdeasOutputProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-foreground">Project Ideas</h4>
        <Badge variant="secondary" className="text-xs">{data.length} projects</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Build these projects to reinforce your learning and showcase skills:
      </p>
      
      <div className="space-y-2">
        {data.slice(0, 3).map((project, index) => (
          <div 
            key={index}
            className="p-3 rounded-lg bg-muted/50 border border-border/50 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />
                <h5 className="font-medium text-foreground text-sm">{project.title}</h5>
              </div>
              {project.domain && (
                <Badge variant="outline" className="text-xs">
                  {project.domain}
                </Badge>
              )}
            </div>
            {project.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 ml-6">
                {project.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectIdeasOutput;
