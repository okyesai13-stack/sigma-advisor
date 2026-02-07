import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Lightbulb } from 'lucide-react';

interface OverallAssessmentCardProps {
  overallAssessment: string | null;
}

const OverallAssessmentCard = ({ overallAssessment }: OverallAssessmentCardProps) => {
  if (!overallAssessment) return null;

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        Career Analysis Insights
      </h2>
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
    </section>
  );
};

export default OverallAssessmentCard;
