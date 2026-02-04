import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Sparkles, Target, TrendingUp, Clock, BookOpen, Lightbulb, Briefcase, CheckCircle2, ArrowRight, RefreshCw, MapPin, ExternalLink, ChevronDown, Bookmark, BookmarkCheck, Video, GraduationCap, FileSearch, Brain, Send, FileUp, Mic, TrendingUp as TrendingUpIcon, MessageCircle, FileText, Share2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CareerAnalysisSection from '@/components/dashboard/CareerAnalysisSection';
import GuidanceSection from '@/components/dashboard/GuidanceSection';
import html2pdf from 'html2pdf.js';
interface CareerRole {
  role: string;
  domain: string;
  progression_stage: string;
  timeline: string;
  match_score: number;
  salary_range: string;
}
interface CareerRoadmap {
  short_term?: string;
  mid_term?: string;
  long_term?: string;
}
interface SkillAnalysisData {
  current_strengths?: string[];
  short_term_gaps?: string[];
  mid_term_gaps?: string[];
  long_term_gaps?: string[];
}
interface SkillValidation {
  target_role: string;
  readiness_score: number;
  matched_skills: {
    strong: string[];
    partial: string[];
  };
  missing_skills: string[];
}
interface LearningPlan {
  id: string;
  skill_name: string;
  career_title: string;
  recommended_courses: {
    name: string;
    platform: string;
    url: string;
    duration: string;
    level?: string;
  }[];
  recommended_videos: {
    title: string;
    channel: string;
    url: string;
    duration: string;
  }[];
  status: string;
}
interface Project {
  id: string;
  title: string;
  description: string;
  domain: string;
  complexity: string;
  skills_demonstrated: string[];
  estimated_time: string;
}
interface Job {
  id: string;
  job_title: string;
  company_name: string;
  location: string;
  relevance_score: number;
  skill_tags: string[];
  job_url: string | null;
  is_saved: boolean;
}
const DashboardNoAuth = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    resumeId,
    goal,
    clearSession
  } = useResume();
  const [isLoading, setIsLoading] = useState(true);
  const [careerRoles, setCareerRoles] = useState<CareerRole[]>([]);
  const [overallAssessment, setOverallAssessment] = useState<string | null>(null);
  const [careerRoadmap, setCareerRoadmap] = useState<CareerRoadmap | null>(null);
  const [skillAnalysisData, setSkillAnalysisData] = useState<SkillAnalysisData | null>(null);
  const [skillValidation, setSkillValidation] = useState<SkillValidation | null>(null);
  const [learningPlans, setLearningPlans] = useState<LearningPlan[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [showSavedJobs, setShowSavedJobs] = useState(false);
  const [interviewPrepJobIds, setInterviewPrepJobIds] = useState<Set<string>>(new Set());
  const [smartAnalysisJobIds, setSmartAnalysisJobIds] = useState<Set<string>>(new Set());
  const [projectBlueprintIds, setProjectBlueprintIds] = useState<Set<string>>(new Set());
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!resumeId) {
      navigate('/setup');
      return;
    }
    loadData();
  }, [resumeId]);
  const loadData = async () => {
    if (!resumeId) return;
    setIsLoading(true);
    try {
      const [careerRes, skillRes, learningRes, projectRes, jobRes, interviewRes, smartRes, projectSessionRes] = await Promise.all([supabase.from('career_analysis_result').select('career_roles, overall_assessment, career_roadmap, skill_analysis').eq('resume_id', resumeId).order('created_at', {
        ascending: false
      }).limit(1).maybeSingle(), supabase.from('skill_validation_result').select('*').eq('resume_id', resumeId).order('created_at', {
        ascending: false
      }).limit(1).maybeSingle(), supabase.from('learning_plan_result').select('*').eq('resume_id', resumeId), supabase.from('project_ideas_result').select('*').eq('resume_id', resumeId), supabase.from('job_matching_result').select('*').eq('resume_id', resumeId).order('relevance_score', {
        ascending: false
      }), supabase.from('interview_preparation_result').select('job_id').eq('resume_id', resumeId), supabase.from('smart_analysis_result').select('job_id').eq('resume_id', resumeId), supabase.from('project_build_session').select('project_id').eq('resume_id', resumeId)]);
      if (careerRes.data) {
        if (careerRes.data.career_roles) {
          setCareerRoles(careerRes.data.career_roles as unknown as CareerRole[]);
        }
        setOverallAssessment(careerRes.data.overall_assessment || null);
        setCareerRoadmap(careerRes.data.career_roadmap as CareerRoadmap | null);
        setSkillAnalysisData(careerRes.data.skill_analysis as SkillAnalysisData | null);
      }
      if (skillRes.data) {
        setSkillValidation(skillRes.data as unknown as SkillValidation);
      }
      if (learningRes.data) {
        setLearningPlans(learningRes.data as unknown as LearningPlan[]);
      }
      if (projectRes.data) {
        setProjects(projectRes.data as unknown as Project[]);
      }
      if (jobRes.data) {
        setJobs(jobRes.data as unknown as Job[]);
      }
      if (interviewRes.data) {
        setInterviewPrepJobIds(new Set(interviewRes.data.map(r => r.job_id)));
      }
      if (smartRes.data) {
        setSmartAnalysisJobIds(new Set(smartRes.data.map(r => r.job_id)));
      }
      if (projectSessionRes.data) {
        setProjectBlueprintIds(new Set(projectSessionRes.data.map(r => r.project_id)));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleStartOver = () => {
    clearSession();
    navigate('/');
  };
  const toggleSaveJob = async (jobId: string, currentSaved: boolean) => {
    try {
      await supabase.from('job_matching_result').update({
        is_saved: !currentSaved
      }).eq('id', jobId);
      setJobs(prev => prev.map(j => j.id === jobId ? {
        ...j,
        is_saved: !currentSaved
      } : j));
      toast({
        title: currentSaved ? "Job unsaved" : "Job saved",
        description: currentSaved ? "Removed from saved jobs" : "Added to saved jobs"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update job",
        variant: "destructive"
      });
    }
  };
  const handleInterviewPrep = (jobId: string) => {
    navigate(`/interview-prep?jobId=${jobId}`);
  };
  const handleSmartAnalysis = (jobId: string) => {
    navigate(`/smart-analysis?jobId=${jobId}`);
  };
  const toggleSkillExpand = (skillId: string) => {
    setExpandedSkills(prev => {
      const newSet = new Set(prev);
      if (newSet.has(skillId)) {
        newSet.delete(skillId);
      } else {
        newSet.add(skillId);
      }
      return newSet;
    });
  };

  const generateAndShareAnalysis = async () => {
    setIsGeneratingPdf(true);
    
    try {
      // Define role variables for PDF
      const shortTermRole = careerRoles.find(r => r.progression_stage === 'short_term');
      const midTermRole = careerRoles.find(r => r.progression_stage === 'mid_term');
      const longTermRole = careerRoles.find(r => r.progression_stage === 'long_term');
      const currentResumeId = resumeId || 'N/A';
      
      // Create PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '30px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.backgroundColor = '#ffffff';
      pdfContent.style.color = '#1a1a1a';
      pdfContent.style.maxWidth = '100%';
      pdfContent.style.boxSizing = 'border-box';
      
      // Header with Resume ID
      pdfContent.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 3px solid #8b5cf6; padding-bottom: 15px;">
          <h1 style="color: #8b5cf6; font-size: 24px; margin: 0;">Career Analysis Report</h1>
          <p style="color: #666; margin-top: 8px; font-size: 13px;">Generated by Sigma AI Advisor</p>
          <p style="color: #888; font-size: 11px; margin-top: 5px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div style="margin-top: 12px; padding: 8px 16px; background: #f3f4f6; border-radius: 6px; display: inline-block;">
            <p style="margin: 0; color: #666; font-size: 11px;">Resume ID</p>
            <p style="margin: 3px 0 0 0; color: #8b5cf6; font-weight: bold; font-size: 12px; font-family: monospace;">${currentResumeId}</p>
          </div>
        </div>

        ${goal ? `
        <div style="margin-bottom: 20px; padding: 12px; background: #f8f5ff; border-radius: 8px; border-left: 4px solid #8b5cf6;">
          <p style="color: #7c3aed; font-size: 12px; font-weight: bold; margin: 0 0 5px 0;">🎯 CAREER GOAL</p>
          <p style="margin: 0; color: #333; font-size: 13px;">${goal}</p>
        </div>
        ` : ''}

        ${overallAssessment ? `
        <div style="margin-bottom: 20px; padding: 12px; background: #fefce8; border-radius: 8px; border-left: 4px solid #eab308;">
          <p style="color: #ca8a04; font-size: 12px; font-weight: bold; margin: 0 0 8px 0;">📋 OVERALL ASSESSMENT</p>
          <p style="line-height: 1.5; color: #444; font-size: 12px; margin: 0;">${overallAssessment}</p>
        </div>
        ` : ''}

        <div style="margin-bottom: 20px;">
          <p style="color: #7c3aed; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">📈 CAREER PROGRESSION PATH</p>
          
          ${shortTermRole ? `
          <div style="padding: 12px; background: #ecfdf5; border-left: 4px solid #10b981; border-radius: 6px; margin-bottom: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <p style="color: #10b981; font-weight: bold; margin: 0; font-size: 10px; text-transform: uppercase;">SHORT TERM (0-12 months)</p>
                  <p style="margin: 5px 0 0 0; font-weight: bold; color: #333; font-size: 13px;">${shortTermRole.role}</p>
                  <p style="margin: 3px 0 0 0; color: #666; font-size: 11px;">${shortTermRole.domain}</p>
                  <p style="margin: 3px 0 0 0; color: #888; font-size: 11px;">${shortTermRole.salary_range}</p>
                </td>
                <td style="text-align: right; vertical-align: top; width: 80px;">
                  <span style="background: #d1fae5; padding: 4px 10px; border-radius: 4px; font-size: 11px; color: #059669; font-weight: bold;">${shortTermRole.match_score}%</span>
                </td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          ${midTermRole ? `
          <div style="padding: 12px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 6px; margin-bottom: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <p style="color: #f59e0b; font-weight: bold; margin: 0; font-size: 10px; text-transform: uppercase;">MID TERM (1-3 years)</p>
                  <p style="margin: 5px 0 0 0; font-weight: bold; color: #333; font-size: 13px;">${midTermRole.role}</p>
                  <p style="margin: 3px 0 0 0; color: #666; font-size: 11px;">${midTermRole.domain}</p>
                  <p style="margin: 3px 0 0 0; color: #888; font-size: 11px;">${midTermRole.salary_range}</p>
                </td>
                <td style="text-align: right; vertical-align: top; width: 80px;">
                  <span style="background: #fef3c7; padding: 4px 10px; border-radius: 4px; font-size: 11px; color: #d97706; font-weight: bold;">${midTermRole.match_score}%</span>
                </td>
              </tr>
            </table>
          </div>
          ` : ''}
          
          ${longTermRole ? `
          <div style="padding: 12px; background: #f5f3ff; border-left: 4px solid #8b5cf6; border-radius: 6px; margin-bottom: 10px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <p style="color: #8b5cf6; font-weight: bold; margin: 0; font-size: 10px; text-transform: uppercase;">LONG TERM (3-5 years)</p>
                  <p style="margin: 5px 0 0 0; font-weight: bold; color: #333; font-size: 13px;">${longTermRole.role}</p>
                  <p style="margin: 3px 0 0 0; color: #666; font-size: 11px;">${longTermRole.domain}</p>
                  <p style="margin: 3px 0 0 0; color: #888; font-size: 11px;">${longTermRole.salary_range}</p>
                </td>
                <td style="text-align: right; vertical-align: top; width: 80px;">
                  <span style="background: #ede9fe; padding: 4px 10px; border-radius: 4px; font-size: 11px; color: #7c3aed; font-weight: bold;">${longTermRole.match_score}%</span>
                </td>
              </tr>
            </table>
          </div>
          ` : ''}
        </div>

        ${skillAnalysisData && (skillAnalysisData.current_strengths?.length || skillAnalysisData.short_term_gaps?.length || skillAnalysisData.mid_term_gaps?.length || skillAnalysisData.long_term_gaps?.length) ? `
        <div style="margin-bottom: 20px; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="color: #7c3aed; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">📊 SKILL GAP ANALYSIS</p>
          
          ${skillAnalysisData.current_strengths?.length ? `
          <div style="margin-bottom: 12px;">
            <p style="color: #10b981; font-weight: bold; font-size: 11px; margin: 0 0 6px 0;">✓ Current Strengths</p>
            <div style="line-height: 1.8;">
              ${skillAnalysisData.current_strengths.map(s => `<span style="display: inline-block; background: #d1fae5; color: #059669; padding: 3px 8px; border-radius: 4px; margin: 2px 4px 2px 0; font-size: 10px;">${s}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          
          ${skillAnalysisData.short_term_gaps?.length ? `
          <div style="margin-bottom: 12px;">
            <p style="color: #059669; font-weight: bold; font-size: 11px; margin: 0 0 6px 0;">→ Short Term Gaps</p>
            <div style="line-height: 1.8;">
              ${skillAnalysisData.short_term_gaps.map(s => `<span style="display: inline-block; background: #ecfdf5; color: #047857; padding: 3px 8px; border-radius: 4px; margin: 2px 4px 2px 0; font-size: 10px; border: 1px solid #a7f3d0;">${s}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          
          ${skillAnalysisData.mid_term_gaps?.length ? `
          <div style="margin-bottom: 12px;">
            <p style="color: #d97706; font-weight: bold; font-size: 11px; margin: 0 0 6px 0;">→ Mid Term Gaps</p>
            <div style="line-height: 1.8;">
              ${skillAnalysisData.mid_term_gaps.map(s => `<span style="display: inline-block; background: #fffbeb; color: #b45309; padding: 3px 8px; border-radius: 4px; margin: 2px 4px 2px 0; font-size: 10px; border: 1px solid #fde68a;">${s}</span>`).join('')}
            </div>
          </div>
          ` : ''}
          
          ${skillAnalysisData.long_term_gaps?.length ? `
          <div>
            <p style="color: #7c3aed; font-weight: bold; font-size: 11px; margin: 0 0 6px 0;">→ Long Term Gaps</p>
            <div style="line-height: 1.8;">
              ${skillAnalysisData.long_term_gaps.map(s => `<span style="display: inline-block; background: #f5f3ff; color: #6d28d9; padding: 3px 8px; border-radius: 4px; margin: 2px 4px 2px 0; font-size: 10px; border: 1px solid #ddd6fe;">${s}</span>`).join('')}
            </div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        ${skillValidation ? `
        <div style="margin-bottom: 20px; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
          <p style="color: #15803d; font-size: 14px; font-weight: bold; margin: 0 0 8px 0;">✅ SKILL READINESS: ${skillValidation.target_role}</p>
          
          <div style="background: #ffffff; padding: 10px; border-radius: 6px; margin-bottom: 12px; text-align: center; border: 1px solid #dcfce7;">
            <p style="font-size: 28px; font-weight: bold; color: #16a34a; margin: 0;">${skillValidation.readiness_score}%</p>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0 0;">Ready for Target Role</p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="vertical-align: top; width: 48%; padding-right: 8px;">
                <p style="color: #10b981; font-weight: bold; font-size: 11px; margin: 0 0 6px 0;">Strong Skills</p>
                <div style="line-height: 1.8;">
                  ${skillValidation.matched_skills.strong.slice(0, 6).map(s => `<span style="display: inline-block; background: #d1fae5; color: #059669; padding: 3px 6px; border-radius: 4px; margin: 2px 3px 2px 0; font-size: 9px;">${s}</span>`).join('')}
                </div>
              </td>
              <td style="vertical-align: top; width: 48%; padding-left: 8px;">
                <p style="color: #dc2626; font-weight: bold; font-size: 11px; margin: 0 0 6px 0;">Skills to Develop</p>
                <div style="line-height: 1.8;">
                  ${(skillValidation.missing_skills as string[]).slice(0, 6).map(s => `<span style="display: inline-block; background: #fee2e2; color: #dc2626; padding: 3px 6px; border-radius: 4px; margin: 2px 3px 2px 0; font-size: 9px;">${s}</span>`).join('')}
                </div>
              </td>
            </tr>
          </table>
        </div>
        ` : ''}

        ${careerRoadmap && (careerRoadmap.short_term || careerRoadmap.mid_term || careerRoadmap.long_term) ? `
        <div style="margin-bottom: 20px; padding: 12px; background: #faf5ff; border-radius: 8px; border: 1px solid #e9d5ff;">
          <p style="color: #7c3aed; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">🗺️ CAREER ROADMAP</p>
          ${careerRoadmap.short_term ? `<p style="margin: 0 0 8px 0; font-size: 11px; line-height: 1.5;"><span style="color: #10b981; font-weight: bold;">Short Term:</span> <span style="color: #444;">${careerRoadmap.short_term}</span></p>` : ''}
          ${careerRoadmap.mid_term ? `<p style="margin: 0 0 8px 0; font-size: 11px; line-height: 1.5;"><span style="color: #f59e0b; font-weight: bold;">Mid Term:</span> <span style="color: #444;">${careerRoadmap.mid_term}</span></p>` : ''}
          ${careerRoadmap.long_term ? `<p style="margin: 0; font-size: 11px; line-height: 1.5;"><span style="color: #8b5cf6; font-weight: bold;">Long Term:</span> <span style="color: #444;">${careerRoadmap.long_term}</span></p>` : ''}
        </div>
        ` : ''}

        ${learningPlans.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="color: #7c3aed; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">📚 LEARNING PLAN (${learningPlans.length} Skills)</p>
          ${learningPlans.slice(0, 4).map(plan => `
            <div style="padding: 10px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #3b82f6;">
              <p style="font-weight: bold; margin: 0; color: #333; font-size: 12px;">${plan.skill_name}</p>
              <p style="color: #666; font-size: 10px; margin: 3px 0 0 0;">For: ${plan.career_title}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${projects.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="color: #7c3aed; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">💡 PORTFOLIO PROJECTS (${projects.length} Ideas)</p>
          ${projects.slice(0, 3).map(project => `
            <div style="padding: 10px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #8b5cf6;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <p style="font-weight: bold; margin: 0; color: #333; font-size: 12px;">${project.title}</p>
                  </td>
                  <td style="text-align: right; width: 80px; vertical-align: top;">
                    <span style="background: ${project.complexity === 'beginner' ? '#d1fae5' : project.complexity === 'intermediate' ? '#fef3c7' : '#fee2e2'}; color: ${project.complexity === 'beginner' ? '#059669' : project.complexity === 'intermediate' ? '#d97706' : '#dc2626'}; padding: 2px 6px; border-radius: 4px; font-size: 9px; text-transform: capitalize;">${project.complexity}</span>
                  </td>
                </tr>
              </table>
              <p style="color: #666; font-size: 10px; margin: 5px 0 0 0; line-height: 1.4;">${project.description?.substring(0, 100)}${project.description && project.description.length > 100 ? '...' : ''}</p>
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${jobs.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="color: #7c3aed; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">💼 TOP JOB MATCHES (${jobs.length} Found)</p>
          ${jobs.slice(0, 3).map(job => `
            <div style="padding: 10px; background: #f8fafc; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid #10b981;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="vertical-align: top;">
                    <p style="font-weight: bold; margin: 0; color: #333; font-size: 12px;">${job.job_title}</p>
                    <p style="color: #666; font-size: 10px; margin: 3px 0 0 0;">${job.company_name} • ${job.location}</p>
                  </td>
                  <td style="text-align: right; width: 60px; vertical-align: top;">
                    <span style="background: #ede9fe; color: #7c3aed; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${job.relevance_score}%</span>
                  </td>
                </tr>
              </table>
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 25px; padding-top: 15px; border-top: 2px solid #e5e7eb;">
          <p style="color: #888; font-size: 10px; margin: 0;">Generated by Sigma AI Career Advisor</p>
          <p style="color: #8b5cf6; font-size: 11px; font-weight: bold; margin: 5px 0 0 0;">sigma-advisor.lovable.app</p>
        </div>
      `;

      // Generate PDF
      const opt = {
        margin: [0.4, 0.4, 0.4, 0.4] as [number, number, number, number],
        filename: `Career_Analysis_${resumeId?.substring(0, 8) || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in' as const, format: 'a4', orientation: 'portrait' as const }
      };

      // Generate and download PDF
      await html2pdf().set(opt).from(pdfContent).save();

      // Prepare WhatsApp message
      const shortTermRoleName = shortTermRole?.role || 'Career Professional';
      const readinessScore = skillValidation?.readiness_score || 0;
      
      const whatsappMessage = encodeURIComponent(
`🎯 *My Career Analysis Report*

📋 *Resume ID:* ${resumeId}

📊 *Goal:* ${goal || 'Career Growth'}

🚀 *Career Path:*
${shortTermRole ? `• Short Term: ${shortTermRole.role}` : ''}
${midTermRole ? `• Mid Term: ${midTermRole.role}` : ''}
${longTermRole ? `• Long Term: ${longTermRole.role}` : ''}

✅ *Skill Readiness:* ${readinessScore}%

📚 *Learning ${learningPlans.length} skills*
💡 *${projects.length} portfolio projects planned*
💼 *${jobs.length} job matches found*

📄 I've attached my full PDF report!

_Generated by Sigma AI Career Advisor_
🔗 sigma-advisor.lovable.app`
      );

      // Open WhatsApp
      const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Report Generated!",
        description: "PDF downloaded and WhatsApp opened. Share your career analysis!",
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const shortTermRole = careerRoles.find(r => r.progression_stage === 'short_term');
  const midTermRole = careerRoles.find(r => r.progression_stage === 'mid_term');
  const longTermRole = careerRoles.find(r => r.progression_stage === 'long_term');
  const savedJobs = jobs.filter(j => j.is_saved);
  const complexityOrder = ['beginner', 'intermediate', 'expert'];
  const sortedProjects = [...projects].sort((a, b) => complexityOrder.indexOf(a.complexity) - complexityOrder.indexOf(b.complexity));
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p>Loading your dashboard...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">Sigma Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="font-mono">
              {resumeId}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              Start Over
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/advisor')}
            size="lg"
            className="flex-1 sm:flex-none gap-3 bg-gradient-to-r from-violet-600 via-primary to-violet-600 hover:from-violet-700 hover:via-primary/90 hover:to-violet-700 shadow-lg shadow-primary/25 text-lg py-6"
          >
            <MessageCircle className="w-5 h-5" />
            Sigma AI Advisor
            <ArrowRight className="w-5 h-5" />
          </Button>
          
          <Button 
            onClick={generateAndShareAnalysis}
            disabled={isGeneratingPdf}
            size="lg"
            variant="outline"
            className="flex-1 sm:flex-none gap-3 border-2 border-emerald-500/50 hover:bg-emerald-500/10 hover:border-emerald-500 text-lg py-6"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Share2 className="w-5 h-5 text-emerald-600" />
                <span>Get Analysis</span>
                <FileText className="w-5 h-5 text-emerald-600" />
              </>
            )}
          </Button>
        </div>

        {/* Goal & Summary */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Your Career Roadmap</h1>
          <p className="text-muted-foreground">Goal: {goal}</p>
        </div>

        {/* Quick Actions / Guidance Section - Now at the top */}
        <GuidanceSection />

        {/* Career Analysis Insights Section */}
        <CareerAnalysisSection overallAssessment={overallAssessment} careerRoadmap={careerRoadmap} skillAnalysis={skillAnalysisData} />

        {/* 5-Year Career Trajectory - Moved above Career Progression */}
        <section className="mb-8">
          <Card className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10 border-emerald-500/20 overflow-hidden">
            <CardContent className="py-6 px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                    <TrendingUpIcon className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                      5-Year Career Trajectory
                      <Badge variant="secondary" className="text-xs">Interactive</Badge>
                    </h2>
                    <p className="text-muted-foreground">Visualize your career growth with salary projections and skill milestones</p>
                  </div>
                </div>
                <Button size="lg" onClick={() => navigate('/career-trajectory')} className="gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                  <TrendingUpIcon className="w-5 h-5" />
                  View Trajectory
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Career Progression */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Career Progression Path
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[{
            role: shortTermRole,
            icon: Clock,
            label: 'Short Term',
            borderColor: 'border-l-emerald-500'
          }, {
            role: midTermRole,
            icon: TrendingUp,
            label: 'Mid Term',
            borderColor: 'border-l-amber-500'
          }, {
            role: longTermRole,
            icon: Target,
            label: 'Long Term',
            borderColor: 'border-l-violet-500'
          }].map(({
            role,
            icon: Icon,
            label,
            borderColor
          }) => <Card key={label} className={`border-l-4 ${borderColor}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Badge variant="outline">{label}</Badge>
                  </div>
                  {role ? <>
                      <h3 className="font-semibold">{role.role}</h3>
                      <p className="text-sm text-muted-foreground">{role.domain}</p>
                      <p className="text-sm mt-2">{role.salary_range}</p>
                      <Badge className="mt-2 bg-primary/10 text-primary">{role.match_score}% Match</Badge>
                    </> : <p className="text-muted-foreground">Not generated</p>}
                </CardContent>
              </Card>)}
          </div>
        </section>

        {/* Skill Validation */}
        {skillValidation && <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Skill Readiness for {skillValidation.target_role}
            </h2>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold">{skillValidation.readiness_score}%</span>
                  <Badge variant={skillValidation.readiness_score >= 70 ? 'default' : 'secondary'}>
                    {skillValidation.readiness_score >= 70 ? 'Ready to Apply' : 'Keep Learning'}
                  </Badge>
                </div>
                <Progress value={skillValidation.readiness_score} className="h-3 mb-4" />
                
                <div className="grid md:grid-cols-3 gap-4 mt-6">
                  <div>
                    <p className="text-sm font-medium text-primary mb-2">Strong Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skillValidation.matched_skills.strong.slice(0, 5).map((skill, i) => <Badge key={i} variant="outline" className="border-primary/30 bg-primary/5">
                          {skill}
                        </Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Partial Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {skillValidation.matched_skills.partial.slice(0, 5).map((skill, i) => <Badge key={i} variant="outline">
                          {skill}
                        </Badge>)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-destructive mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-1">
                      {(skillValidation.missing_skills as string[]).slice(0, 5).map((skill, i) => <Badge key={i} variant="outline" className="border-destructive/30 bg-destructive/5 text-destructive">
                          {skill}
                        </Badge>)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>}

        {/* Learning Plans with Dropdown */}
        {learningPlans.length > 0 && <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Learning Resources
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {learningPlans.map(plan => <Card key={plan.id}>
                  <Collapsible open={expandedSkills.has(plan.id)} onOpenChange={() => toggleSkillExpand(plan.id)}>
                    <CardContent className="pt-4">
                      <CollapsibleTrigger className="w-full text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{plan.skill_name}</h3>
                            <p className="text-sm text-muted-foreground">For: {plan.career_title}</p>
                          </div>
                          <ChevronDown className={`w-5 h-5 transition-transform ${expandedSkills.has(plan.id) ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            {(plan.recommended_courses as any[])?.length || 0} Courses
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Video className="w-3 h-3 mr-1" />
                            {(plan.recommended_videos as any[])?.length || 0} Videos
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-4 space-y-4">
                        {/* Learn with AI Button */}
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/ai-learning?skillId=${plan.id}&skill=${encodeURIComponent(plan.skill_name)}`);
                          }}
                          className="w-full gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
                        >
                          <Brain className="w-4 h-4" />
                          Learn with AI
                        </Button>

                        {/* Courses */}
                        {(plan.recommended_courses as any[])?.length > 0 && <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" /> Courses
                            </p>
                            <ul className="space-y-2">
                              {(plan.recommended_courses as any[]).map((course: any, i: number) => <li key={i}>
                                  <a href={course.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                    {course.name}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <p className="text-xs text-muted-foreground">{course.platform} • {course.duration}</p>
                                </li>)}
                            </ul>
                          </div>}
                        
                        {/* Videos */}
                        {(plan.recommended_videos as any[])?.length > 0 && <div>
                            <p className="text-sm font-medium mb-2 flex items-center gap-1">
                              <Video className="w-4 h-4" /> Videos
                            </p>
                            <ul className="space-y-2">
                              {(plan.recommended_videos as any[]).map((video: any, i: number) => <li key={i}>
                                  <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                                    {video.title}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <p className="text-xs text-muted-foreground">{video.channel} • {video.duration}</p>
                                </li>)}
                            </ul>
                          </div>}
                      </CollapsibleContent>
                    </CardContent>
                  </Collapsible>
                </Card>)}
            </div>
          </section>}

        {/* Project Ideas by Complexity */}
        {projects.length > 0 && <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Portfolio Projects
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {sortedProjects.map(project => <Card key={project.id} className={`
                  ${project.complexity === 'beginner' ? 'border-l-4 border-l-emerald-500' : ''}
                  ${project.complexity === 'intermediate' ? 'border-l-4 border-l-amber-500' : ''}
                  ${project.complexity === 'expert' ? 'border-l-4 border-l-red-500' : ''}
                `}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={project.complexity === 'beginner' ? 'outline' : project.complexity === 'intermediate' ? 'secondary' : 'default'} className={`capitalize ${project.complexity === 'beginner' ? 'border-emerald-500 text-emerald-600' : ''}`}>
                        {project.complexity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{project.estimated_time}</span>
                    </div>
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {project.skills_demonstrated?.slice(0, 3).map((skill, i) => <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>)}
                    </div>
                    {/* Build Button */}
                    <Button 
                      onClick={() => navigate(`/project-builder?projectId=${project.id}`)}
                      className={`w-full mt-4 gap-2 ${projectBlueprintIds.has(project.id) ? '' : 'bg-gradient-to-r from-violet-600 to-primary hover:from-violet-700 hover:to-primary/90'}`}
                      variant={projectBlueprintIds.has(project.id) ? 'outline' : 'default'}
                    >
                      {projectBlueprintIds.has(project.id) ? (
                        <>
                          <FileSearch className="w-4 h-4" />
                          View Project
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Build with AI
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>)}
            </div>
          </section>}

        {/* Job Matches with Actions */}
        {jobs.length > 0 && <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                Job Matches
              </h2>
              <Sheet open={showSavedJobs} onOpenChange={setShowSavedJobs}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BookmarkCheck className="w-4 h-4 mr-2" />
                    View Saved ({savedJobs.length})
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Saved Jobs</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4 space-y-4">
                    {savedJobs.length === 0 ? <p className="text-muted-foreground text-center py-8">No saved jobs yet</p> : savedJobs.map(job => <Card key={job.id}>
                          <CardContent className="pt-4">
                            <h3 className="font-semibold">{job.job_title}</h3>
                            <p className="text-sm text-muted-foreground">{job.company_name}</p>
                            <p className="text-xs text-muted-foreground">{job.location}</p>
                            <div className="flex gap-2 mt-3">
                              <Button size="sm" variant={interviewPrepJobIds.has(job.id) ? "default" : "outline"} onClick={() => handleInterviewPrep(job.id)}>
                                {interviewPrepJobIds.has(job.id) ? 'View' : 'Prep'}
                              </Button>
                              <Button size="sm" variant={smartAnalysisJobIds.has(job.id) ? "default" : "outline"} onClick={() => handleSmartAnalysis(job.id)}>
                                {smartAnalysisJobIds.has(job.id) ? 'View' : 'Analyze'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>)}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {jobs.slice(0, 6).map(job => <Card key={job.id}>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{job.job_title}</h3>
                        <p className="text-sm text-muted-foreground">{job.company_name}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary">{job.relevance_score}%</Badge>
                        <Button variant="ghost" size="icon" onClick={() => toggleSaveJob(job.id, job.is_saved)}>
                          {job.is_saved ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {job.skill_tags?.slice(0, 4).map((tag, i) => <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>)}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/50">
                      <Button size="sm" variant={interviewPrepJobIds.has(job.id) ? "default" : "outline"} onClick={() => handleInterviewPrep(job.id)}>
                        <FileSearch className="w-4 h-4 mr-1" />
                        {interviewPrepJobIds.has(job.id) ? 'View Prep' : 'Interview Prep'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/mock-interview?jobId=${job.id}`)} className="border-primary/50 text-primary hover:bg-primary/10">
                        <Mic className="w-4 h-4 mr-1" />
                        Mock Interview
                      </Button>
                      <Button size="sm" variant={smartAnalysisJobIds.has(job.id) ? "default" : "outline"} onClick={() => handleSmartAnalysis(job.id)}>
                        <Brain className="w-4 h-4 mr-1" />
                        {smartAnalysisJobIds.has(job.id) ? 'View Analysis' : 'Smart Analysis'}
                      </Button>
                      {job.job_url && <Button size="sm" variant="outline" asChild>
                          
                        </Button>}
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </section>}
      </main>
    </div>;
};
export default DashboardNoAuth;