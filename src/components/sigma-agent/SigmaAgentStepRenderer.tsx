import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowRight, Star, CheckCircle2 } from 'lucide-react';
import { AgentStep } from './SigmaAgentController';

interface StepRendererProps {
  step: AgentStep;
  executeStep: (stepId: string, userSelection?: any) => Promise<void>;
  canExecute: (stepId: string) => boolean;
  isExecuting: boolean;
}

const SigmaAgentStepRenderer: React.FC<StepRendererProps> = ({
  step,
  executeStep,
  canExecute,
  isExecuting
}) => {
  // Career Analysis - Show execute button
  if (step.id === 'career_analysis' && step.status === 'pending') {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground mb-4">
          Click Execute to analyze your resume and discover career matches.
        </p>
        <Button 
          onClick={() => executeStep('career_analysis')}
          disabled={isExecuting}
          className="gap-2"
        >
          {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Start Analysis
        </Button>
      </div>
    );
  }

  // Skill Validation - Show career matches to select
  if (step.id === 'skill_validation' && step.data?.careerMatches) {
    const careerMatches = step.data.careerMatches;
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a role to validate your skills
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {careerMatches.slice(0, 4).map((match: any, index: number) => (
            <Card 
              key={index}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => !isExecuting && executeStep('skill_validation', match)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-foreground">{match.role}</h4>
                  <Badge variant="secondary">{match.match_score}%</Badge>
                </div>
                {match.rationale && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{match.rationale}</p>
                )}
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${match.match_score}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Learning Plan - Show skills to select
  if (step.id === 'learning_plan' && step.data?.skillValidation) {
    const skillValidation = step.data.skillValidation;
    const missingSkills = Array.isArray(skillValidation?.missing_skills) 
      ? skillValidation.missing_skills 
      : [];

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a skill to create a learning plan
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {missingSkills.slice(0, 8).map((skill: string, index: number) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => !isExecuting && executeStep('learning_plan', skill)}
              disabled={isExecuting}
              className="gap-2"
            >
              {skill}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Project Plan - Show projects to select
  if (step.id === 'project_plan' && step.data?.projects) {
    const projects = step.data.projects;
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a project to create a detailed plan
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projects.slice(0, 6).map((project: any, index: number) => (
            <Card 
              key={index}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => !isExecuting && executeStep('project_plan', project)}
            >
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-1">{project.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                {project.domain && (
                  <Badge variant="secondary" className="mt-2">{project.domain}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Interview Prep - Show jobs to select
  if (step.id === 'interview_prep' && step.data?.jobs) {
    const jobs = step.data.jobs;
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Select a job to prepare for the interview
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jobs.slice(0, 6).map((job: any, index: number) => (
            <Card 
              key={index}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => !isExecuting && executeStep('interview_prep', job)}
            >
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-1">{job.job_title}</h4>
                <p className="text-sm text-primary font-medium">{job.company_name}</p>
                {job.location && (
                  <p className="text-xs text-muted-foreground mt-1">{job.location}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Project Build - Show selected project and execute button
  if (step.id === 'project_build' && step.status === 'pending') {
    const selectedProject = step.data?.selectedProject;
    
    if (selectedProject) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Generate build tools and setup for your selected project
            </p>
            <Card className="border-primary/20 bg-primary/5 mb-4">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-1">{selectedProject.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">{selectedProject.description}</p>
                {selectedProject.domain && (
                  <Badge variant="secondary" className="mt-2">{selectedProject.domain}</Badge>
                )}
              </CardContent>
            </Card>
            <Button 
              onClick={() => executeStep('project_build', selectedProject)}
              disabled={isExecuting}
              className="gap-2"
            >
              {isExecuting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Generate Build Tools
            </Button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-center py-4 text-orange-600">
          <p className="mb-2">No project selected for build tools.</p>
          <p className="text-sm text-muted-foreground">Please complete the project planning step first.</p>
        </div>
      );
    }
  }

  // Executing state
  if (step.status === 'executing') {
    return (
      <div className="flex items-center justify-center py-8 gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Processing {step.name}...</span>
      </div>
    );
  }

  // Completed state
  if (step.status === 'completed') {
    return (
      <div className="flex items-center justify-center py-4 gap-2 text-green-600">
        <CheckCircle2 className="w-5 h-5" />
        <span>{step.name} completed successfully!</span>
      </div>
    );
  }

  // Default pending state
  return (
    <div className="text-center py-4 text-muted-foreground">
      Waiting for previous steps to complete...
    </div>
  );
};

export default SigmaAgentStepRenderer;
