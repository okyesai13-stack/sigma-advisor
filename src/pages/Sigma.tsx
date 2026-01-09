import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SigmaAgentController, SigmaAgentTimeline } from '@/components/sigma-agent';

const Sigma = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to access Sigma Career Agent.
            </p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/setup')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Setup
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Sigma Career Agent</h1>
          <div className="w-24" /> {/* Spacer */}
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">AI Career Analysis & Planning</h2>
          <p className="text-muted-foreground">
            Sigma will automatically guide you through career analysis, skill validation, 
            learning plans, and interview preparation.
          </p>
        </div>

        <SigmaAgentController>
          {(props) => (
            <SigmaAgentTimeline {...props} />
          )}
        </SigmaAgentController>
      </main>
    </div>
  );
};

export default Sigma;
