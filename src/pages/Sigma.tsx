import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
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
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Sigma AI Agent</h1>
          </div>
          <div className="w-20" />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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
