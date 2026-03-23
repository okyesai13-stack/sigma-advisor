import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Sparkles, ArrowLeft, Search, MapPin, Building2, ExternalLink, Bookmark,
  BookmarkCheck, Briefcase, Target, TrendingUp, Globe, DollarSign, Brain,
  FileSearch, Mic, Loader2, RefreshCw, Layers, Zap, BarChart3
} from 'lucide-react';
import JobFinderDialog from '@/components/job-finder/JobFinderDialog';

interface JobFinderResult {
  id: string;
  job_title: string;
  company_name: string;
  company_type: string | null;
  domain: string | null;
  sector: string | null;
  location: string | null;
  work_mode: string | null;
  salary_range: string | null;
  experience_level: string | null;
  job_description: string | null;
  job_url: string | null;
  source: string | null;
  match_score: number;
  match_reasoning: string | null;
  skill_gaps: any;
  matched_skills: any;
  why_apply: string | null;
  ats_keywords: string[];
  is_saved: boolean;
  created_at: string;
}

const JobFinderNoAuth = () => {
  const navigate = useNavigate();
  const { resumeId } = useResume();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobFinderResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [interviewPrepJobIds, setInterviewPrepJobIds] = useState<Set<string>>(new Set());
  const [smartAnalysisJobIds, setSmartAnalysisJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!resumeId) {
      navigate('/setup');
      return;
    }
    loadJobs();
  }, [resumeId]);

  const loadJobs = async () => {
    if (!resumeId) return;
    setIsLoading(true);
    try {
      const [jobsRes, interviewRes, smartRes] = await Promise.all([
        supabase
          .from('job_finder_result')
          .select('*')
          .eq('resume_id', resumeId)
          .order('match_score', { ascending: false }),
        supabase
          .from('interview_preparation_result')
          .select('job_id')
          .eq('resume_id', resumeId),
        supabase
          .from('smart_analysis_result')
          .select('job_id')
          .eq('resume_id', resumeId),
      ]);

      if (jobsRes.error) throw jobsRes.error;
      setJobs((jobsRes.data as JobFinderResult[]) || []);
      if (interviewRes.data) {
        setInterviewPrepJobIds(new Set(interviewRes.data.map(r => r.job_id)));
      }
      if (smartRes.data) {
        setSmartAnalysisJobIds(new Set(smartRes.data.map(r => r.job_id)));
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = async (jobId: string, currentSaved: boolean) => {
    try {
      await supabase.from('job_finder_result')
        .update({ is_saved: !currentSaved })
        .eq('id', jobId);
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_saved: !currentSaved } : j));
      toast({
        title: currentSaved ? 'Job unsaved' : 'Job saved',
        description: currentSaved ? 'Removed from saved' : 'Added to saved jobs',
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-primary bg-primary/10 border-primary/30';
    if (score >= 40) return 'text-amber-600 bg-amber-500/10 border-amber-500/30';
    return 'text-muted-foreground bg-muted border-border';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Strong Match';
    if (score >= 50) return 'Good Match';
    return 'Fair Match';
  };

  const getSourceIcon = (source: string | null) => {
    switch (source) {
      case 'linkedin': return '🔗';
      case 'naukri': return '📋';
      case 'indeed': return '🔍';
      default: return '🌐';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p>Loading job results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-bold">AI Job Finder</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono text-xs">
              {jobs.length} jobs found
            </Badge>
            <Button onClick={() => setShowDialog(true)} className="gap-2">
              <Search className="w-4 h-4" />
              New Search
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {jobs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No Jobs Found Yet</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Let our AI agent find the perfect jobs for you based on your skills, experience, and preferences.
            </p>
            <Button size="lg" onClick={() => setShowDialog(true)} className="gap-3 text-lg py-6 px-8">
              <Search className="w-5 h-5" />
              Start Job Search
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Jobs', value: jobs.length, icon: Briefcase, color: 'text-primary' },
                { label: 'Excellent Match', value: jobs.filter(j => j.match_score >= 80).length, icon: Target, color: 'text-emerald-600' },
                { label: 'Avg Score', value: `${Math.round(jobs.reduce((a, b) => a + b.match_score, 0) / jobs.length)}%`, icon: TrendingUp, color: 'text-amber-600' },
                { label: 'Saved', value: jobs.filter(j => j.is_saved).length, icon: BookmarkCheck, color: 'text-violet-600' },
              ].map(stat => (
                <Card key={stat.label}>
                  <CardContent className="py-4 px-5 flex items-center gap-3">
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Job Cards */}
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <Card
                  key={job.id}
                  className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                    expandedJob === job.id ? 'ring-2 ring-primary/30' : ''
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Score Bar */}
                    <div className="h-1 bg-muted">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-violet-500 transition-all"
                        style={{ width: `${job.match_score}%` }}
                      />
                    </div>

                    <div className="p-5">
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-muted-foreground">#{index + 1}</span>
                            <Badge variant="outline" className="text-xs">
                              {getSourceIcon(job.source)} {job.source}
                            </Badge>
                            {job.work_mode && (
                              <Badge variant="secondary" className="text-xs capitalize">
                                <Globe className="w-3 h-3 mr-1" />
                                {job.work_mode}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-lg font-bold">{job.job_title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Building2 className="w-4 h-4" />
                              {job.company_name}
                            </span>
                            {job.location && (
                              <span className="flex items-center gap-1 text-muted-foreground text-sm">
                                <MapPin className="w-3 h-3" />
                                {job.location}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`px-4 py-2 rounded-xl border ${getScoreColor(job.match_score)} text-center`}>
                            <p className="text-2xl font-bold">{job.match_score}%</p>
                            <p className="text-[10px] font-medium uppercase tracking-wider">{getScoreLabel(job.match_score)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleSave(job.id, job.is_saved)}
                          >
                            {job.is_saved
                              ? <BookmarkCheck className="w-5 h-5 text-primary" />
                              : <Bookmark className="w-5 h-5" />
                            }
                          </Button>
                        </div>
                      </div>

                      {/* Meta Row */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {job.salary_range && (
                          <Badge variant="outline" className="text-xs">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {job.salary_range}
                          </Badge>
                        )}
                        {job.company_type && (
                          <Badge variant="outline" className="text-xs capitalize">
                            <Building2 className="w-3 h-3 mr-1" />
                            {job.company_type}
                          </Badge>
                        )}
                        {job.experience_level && (
                          <Badge variant="outline" className="text-xs">
                            {job.experience_level}
                          </Badge>
                        )}
                        {job.domain && (
                          <Badge variant="secondary" className="text-xs">
                            <Layers className="w-3 h-3 mr-1" />
                            {job.domain}
                          </Badge>
                        )}
                      </div>

                      {/* Matched Skills */}
                      {Array.isArray(job.matched_skills) && job.matched_skills.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1.5">Skills Matched</p>
                          <div className="flex flex-wrap gap-1">
                            {(job.matched_skills as string[]).slice(0, 6).map((skill, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-emerald-500/30 bg-emerald-500/5 text-emerald-700">
                                ✓ {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Expandable Details */}
                      {expandedJob === job.id && (
                        <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-fade-in">
                          {job.job_description && (
                            <div>
                              <p className="text-sm font-medium mb-1">Job Description</p>
                              <p className="text-sm text-muted-foreground">{job.job_description}</p>
                            </div>
                          )}

                          {job.match_reasoning && (
                            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                              <p className="text-sm font-medium text-primary mb-1">🧠 AI Match Analysis</p>
                              <p className="text-sm text-muted-foreground">{job.match_reasoning}</p>
                            </div>
                          )}

                          {job.why_apply && (
                            <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                              <p className="text-sm font-medium text-emerald-700 mb-1">🎯 Why You Should Apply</p>
                              <p className="text-sm text-muted-foreground">{job.why_apply}</p>
                            </div>
                          )}

                          {Array.isArray(job.skill_gaps) && job.skill_gaps.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-destructive mb-1">Skill Gaps</p>
                              <div className="flex flex-wrap gap-1">
                                {(job.skill_gaps as string[]).map((gap, i) => (
                                  <Badge key={i} variant="outline" className="text-xs border-destructive/30 bg-destructive/5 text-destructive">
                                    {gap}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {job.ats_keywords?.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-1">ATS Keywords</p>
                              <div className="flex flex-wrap gap-1">
                                {job.ats_keywords.slice(0, 8).map((kw, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border/50">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        >
                          <Brain className="w-4 h-4 mr-1" />
                          {expandedJob === job.id ? 'Less Details' : 'View Details'}
                        </Button>

                        {job.job_url && (
                          <Button size="sm" asChild className="gap-1">
                            <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                              Apply Now
                            </a>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/resume-upgrade`)}
                        >
                          <FileSearch className="w-4 h-4 mr-1" />
                          Optimize Resume
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <JobFinderDialog open={showDialog} onOpenChange={setShowDialog} />
    </div>
  );
};

export default JobFinderNoAuth;
