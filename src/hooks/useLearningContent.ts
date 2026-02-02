import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
  description?: string;
}

interface LearningStep {
  id: number;
  title: string;
  description: string;
  duration: string;
  resources?: string[];
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface LearningContent {
  id: string;
  resume_id: string;
  skill_id: string;
  skill_name: string;
  mind_map_data: MindMapNode | null;
  flowchart_data: LearningStep[] | null;
  quiz_data: QuizQuestion[] | null;
  mind_map_completed: boolean;
  flowchart_completed: boolean;
  quiz_completed: boolean;
  quiz_score: number | null;
}

export const useLearningContent = (resumeId: string | null, skillId: string | null, skillName: string) => {
  const { toast } = useToast();
  const [content, setContent] = useState<LearningContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing content from database
  const loadContent = useCallback(async () => {
    if (!resumeId || !skillId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('learning_content')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('skill_id', skillId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setContent({
          id: data.id,
          resume_id: data.resume_id,
          skill_id: data.skill_id,
          skill_name: data.skill_name,
          mind_map_data: data.mind_map_data as unknown as MindMapNode | null,
          flowchart_data: data.flowchart_data as unknown as LearningStep[] | null,
          quiz_data: data.quiz_data as unknown as QuizQuestion[] | null,
          mind_map_completed: data.mind_map_completed,
          flowchart_completed: data.flowchart_completed,
          quiz_completed: data.quiz_completed,
          quiz_score: data.quiz_score
        });
      }
    } catch (error) {
      console.error('Error loading learning content:', error);
    } finally {
      setIsLoading(false);
    }
  }, [resumeId, skillId]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Save or update content in database
  const saveContent = async (updates: {
    mind_map_data?: Json;
    flowchart_data?: Json;
    quiz_data?: Json;
    mind_map_completed?: boolean;
    flowchart_completed?: boolean;
    quiz_completed?: boolean;
    quiz_score?: number;
  }) => {
    if (!resumeId || !skillId) return;

    setIsSaving(true);
    try {
      // Check if record exists first
      const { data: existing } = await supabase
        .from('learning_content')
        .select('id')
        .eq('resume_id', resumeId)
        .eq('skill_id', skillId)
        .maybeSingle();

      let data;
      let error;

      if (existing) {
        // Update existing record
        const result = await supabase
          .from('learning_content')
          .update(updates)
          .eq('resume_id', resumeId)
          .eq('skill_id', skillId)
          .select()
          .single();
        data = result.data;
        error = result.error;
      } else {
        // Insert new record
        const result = await supabase
          .from('learning_content')
          .insert({
            resume_id: resumeId,
            skill_id: skillId,
            skill_name: skillName,
            ...updates
          })
          .select()
          .single();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;

      if (data) {
        setContent({
          id: data.id,
          resume_id: data.resume_id,
          skill_id: data.skill_id,
          skill_name: data.skill_name,
          mind_map_data: data.mind_map_data as unknown as MindMapNode | null,
          flowchart_data: data.flowchart_data as unknown as LearningStep[] | null,
          quiz_data: data.quiz_data as unknown as QuizQuestion[] | null,
          mind_map_completed: data.mind_map_completed,
          flowchart_completed: data.flowchart_completed,
          quiz_completed: data.quiz_completed,
          quiz_score: data.quiz_score
        });
      }

      return data;
    } catch (error) {
      console.error('Error saving learning content:', error);
      toast({
        title: "Error",
        description: "Failed to save progress",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Helper functions for each content type
  const saveMindMap = async (data: MindMapNode) => {
    return saveContent({ mind_map_data: data as unknown as Json });
  };

  const markMindMapComplete = async () => {
    return saveContent({ mind_map_completed: true });
  };

  const saveFlowchart = async (data: LearningStep[]) => {
    return saveContent({ flowchart_data: data as unknown as Json });
  };

  const markFlowchartComplete = async () => {
    return saveContent({ flowchart_completed: true });
  };

  const saveQuiz = async (data: QuizQuestion[]) => {
    return saveContent({ quiz_data: data as unknown as Json });
  };

  const saveQuizResult = async (score: number) => {
    return saveContent({ 
      quiz_completed: true, 
      quiz_score: score 
    });
  };

  return {
    content,
    isLoading,
    isSaving,
    loadContent,
    saveContent,
    saveMindMap,
    markMindMapComplete,
    saveFlowchart,
    markFlowchartComplete,
    saveQuiz,
    saveQuizResult
  };
};

export type { LearningContent, MindMapNode, LearningStep, QuizQuestion };
