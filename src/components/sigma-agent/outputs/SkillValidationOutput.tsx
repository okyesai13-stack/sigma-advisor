import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SkillValidationOutputProps {
  data: {
    role: string;
    readiness_score: number;
    matched_skills?: {
      strong?: string[];
      partial?: string[];
    };
    missing_skills?: string[];
  };
}

const SkillValidationOutput: React.FC<SkillValidationOutputProps> = ({ data }) => {
  const strongSkills = data.matched_skills?.strong || [];
  const partialSkills = data.matched_skills?.partial || [];
  const missingSkills = data.missing_skills || [];

  const allSkills = [
    ...strongSkills.map(s => ({ skill: s, status: 'have' as const })),
    ...partialSkills.map(s => ({ skill: s, status: 'partial' as const })),
    ...missingSkills.map(s => ({ skill: s, status: 'missing' as const })),
  ];

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-foreground">Skill Validation</h4>
        <Badge variant="secondary" className="text-xs">
          {data.readiness_score}% ready
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Your skills compared to <span className="font-medium text-foreground">{data.role}</span> requirements:
      </p>
      
      {allSkills.length > 0 ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Skill</TableHead>
                <TableHead className="text-xs font-semibold text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allSkills.slice(0, 8).map((item, index) => (
                <TableRow key={index} className="text-xs">
                  <TableCell className="py-2">{item.skill}</TableCell>
                  <TableCell className="py-2 text-right">
                    {item.status === 'have' && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Have
                      </Badge>
                    )}
                    {item.status === 'partial' && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
                        <AlertCircle className="w-3 h-3 mr-1" /> Partial
                      </Badge>
                    )}
                    {item.status === 'missing' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800">
                        <XCircle className="w-3 h-3 mr-1" /> Missing
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No skill data available.</p>
      )}
    </div>
  );
};

export default SkillValidationOutput;
