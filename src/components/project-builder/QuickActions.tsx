import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  GitBranch, 
  Database, 
  TestTube, 
  Loader2, 
  Copy, 
  Check,
  Sparkles,
  X,
  Code2,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuickActionsProps {
  projectTitle: string;
  projectDescription: string;
  techStack: { category: string; items: { name: string; purpose: string }[] }[];
  resumeId: string;
  projectId: string;
}

type ActionType = 'readme' | 'gitignore' | 'database' | 'tests' | 'explain';

interface GeneratedContent {
  type: ActionType;
  content: string;
  title: string;
}

const QuickActions = ({
  projectTitle,
  projectDescription,
  techStack,
  resumeId,
  projectId
}: QuickActionsProps) => {
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [copied, setCopied] = useState(false);

  const techStackSummary = techStack
    .flatMap(cat => cat.items.map(item => item.name))
    .join(', ');

  const generateContent = async (actionType: ActionType) => {
    setLoadingAction(actionType);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/project-builder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: `generate_${actionType}`,
          resume_id: resumeId,
          project_id: projectId,
          project_title: projectTitle,
          project_description: projectDescription,
          tech_stack: techStackSummary,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate content');
      }

      const titles: Record<ActionType, string> = {
        readme: 'README.md',
        gitignore: '.gitignore',
        database: 'Database Schema',
        tests: 'Test Files',
        explain: 'Code Explanation',
      };

      setGeneratedContent({
        type: actionType,
        content: data.data.content,
        title: titles[actionType],
      });
    } catch (error) {
      console.error('Quick action error:', error);
      toast({
        title: "Generation Failed",
        description: "Unable to generate content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const copyToClipboard = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied!",
        description: `${generatedContent.title} copied to clipboard`,
      });
    }
  };

  const actions = [
    {
      id: 'readme' as ActionType,
      icon: FileText,
      label: 'Generate README',
      description: 'Complete project documentation',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'gitignore' as ActionType,
      icon: GitBranch,
      label: 'Create .gitignore',
      description: 'Ignore unnecessary files',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'database' as ActionType,
      icon: Database,
      label: 'Design Schema',
      description: 'Database structure design',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      id: 'tests' as ActionType,
      icon: TestTube,
      label: 'Generate Tests',
      description: 'Unit test templates',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => {
              const Icon = action.icon;
              const isLoading = loadingAction === action.id;
              return (
                <motion.div key={action.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    className="w-full h-auto py-3 px-3 flex flex-col items-center gap-1 hover:border-primary/50"
                    onClick={() => generateContent(action.id)}
                    disabled={loadingAction !== null}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-1`}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground">{action.description}</span>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generated Content Modal */}
      <Dialog open={!!generatedContent} onOpenChange={() => setGeneratedContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-primary" />
                {generatedContent?.title}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 mt-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none [&_pre]:bg-background [&_pre]:p-3 [&_pre]:rounded-lg [&_code]:text-xs">
                <ReactMarkdown>{generatedContent?.content || ''}</ReactMarkdown>
              </div>
            </div>
          </ScrollArea>
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              Copy this content and paste it into your project files.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickActions;
