import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  description?: string;
}

interface MindMapVisualizationProps {
  skillName: string;
  onComplete: () => void;
  isCompleted: boolean;
}

const MindMapVisualization = ({ skillName, onComplete, isCompleted }: MindMapVisualizationProps) => {
  const { toast } = useToast();
  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);

  useEffect(() => {
    generateMindMap();
  }, [skillName]);

  const generateMindMap = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('learning-mindmap', {
        body: { skill_name: skillName }
      });

      if (error) throw error;

      if (data?.mindmap) {
        setMindMapData(data.mindmap);
      } else {
        // Fallback structure
        setMindMapData({
          id: 'root',
          label: skillName,
          children: [
            {
              id: 'fundamentals',
              label: 'Fundamentals',
              description: 'Core concepts and basics',
              children: [
                { id: 'basics', label: 'Basic Concepts', description: 'Start with the fundamentals' },
                { id: 'terminology', label: 'Key Terminology', description: 'Important terms to know' }
              ]
            },
            {
              id: 'intermediate',
              label: 'Intermediate',
              description: 'Building on the basics',
              children: [
                { id: 'patterns', label: 'Common Patterns', description: 'Frequently used approaches' },
                { id: 'best-practices', label: 'Best Practices', description: 'Industry standards' }
              ]
            },
            {
              id: 'advanced',
              label: 'Advanced',
              description: 'Expert-level topics',
              children: [
                { id: 'optimization', label: 'Optimization', description: 'Performance improvements' },
                { id: 'architecture', label: 'Architecture', description: 'System design patterns' }
              ]
            },
            {
              id: 'practical',
              label: 'Practical Application',
              description: 'Hands-on experience',
              children: [
                { id: 'projects', label: 'Projects', description: 'Build real things' },
                { id: 'case-studies', label: 'Case Studies', description: 'Learn from examples' }
              ]
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error generating mind map:', error);
      toast({
        title: "Using default structure",
        description: "AI-generated mind map unavailable",
      });
      // Set fallback
      setMindMapData({
        id: 'root',
        label: skillName,
        children: [
          { id: 'core', label: 'Core Concepts' },
          { id: 'tools', label: 'Tools & Frameworks' },
          { id: 'practice', label: 'Practice Projects' },
          { id: 'advanced', label: 'Advanced Topics' }
        ]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const renderNode = (node: MindMapNode, level: number = 0, index: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;
    
    const colors = [
      'bg-primary/20 border-primary/50 text-primary',
      'bg-violet-500/20 border-violet-500/50 text-violet-600',
      'bg-emerald-500/20 border-emerald-500/50 text-emerald-600',
      'bg-amber-500/20 border-amber-500/50 text-amber-600',
      'bg-rose-500/20 border-rose-500/50 text-rose-600',
    ];
    const colorClass = colors[level % colors.length];

    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`${level > 0 ? 'ml-8 mt-2' : ''}`}
      >
        <div className="flex items-start gap-2">
          {level > 0 && (
            <div className="w-6 h-6 flex items-center justify-center">
              <div className="w-4 h-0.5 bg-border" />
            </div>
          )}
          <motion.button
            onClick={() => {
              toggleNode(node.id);
              setSelectedNode(node);
            }}
            className={`
              px-4 py-2 rounded-lg border-2 transition-all cursor-pointer
              ${colorClass}
              ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
              hover:scale-105
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="flex items-center gap-2">
              {hasChildren && (
                <motion.span
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  className="text-xs"
                >
                  ▶
                </motion.span>
              )}
              <span className="font-medium">{node.label}</span>
            </div>
          </motion.button>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l-2 border-border/50 ml-3 pl-2">
            {node.children!.map((child, i) => renderNode(child, level + 1, i))}
          </div>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Generating mind map for {skillName}...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Mind Map */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-primary" />
            Concept Mind Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={generateMindMap}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            {!isCompleted && (
              <Button size="sm" onClick={onComplete}>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
            {isCompleted && (
              <Badge className="bg-green-500/20 text-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-6 bg-muted/30 rounded-xl min-h-[400px] overflow-auto">
            {mindMapData && renderNode(mindMapData)}
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Topic Details</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div>
                <Badge variant="outline" className="mb-2">Selected Topic</Badge>
                <h3 className="text-xl font-bold">{selectedNode.label}</h3>
              </div>
              {selectedNode.description && (
                <p className="text-muted-foreground">{selectedNode.description}</p>
              )}
              {selectedNode.children && selectedNode.children.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Subtopics:</p>
                  <ul className="space-y-1">
                    {selectedNode.children.map(child => (
                      <li key={child.id} className="text-sm text-muted-foreground flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {child.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Click on a node to see details</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MindMapVisualization;
