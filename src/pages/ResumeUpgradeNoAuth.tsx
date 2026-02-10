import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '@/contexts/ResumeContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ResumeEditorPanel } from '@/components/resume-builder/ResumeEditorPanel';
import { 
  Sparkles, 
  ArrowLeft, 
  Download, 
  RefreshCw,
  Loader2,
  FileText,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  User,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Wrench,
  Plus,
  ClipboardPaste,
  Eye,
  Calendar,
  Trash2,
} from 'lucide-react';

interface ResumeData {
  header: {
    name: string;
    title: string;
    contact: {
      email: string;
      phone: string;
      location: string;
      linkedin?: string;
    };
  };
  summary: string;
  skills: {
    technical: string[];
    tools: string[];
    domain: string[];
  };
  work_experience: Array<{
    title: string;
    company: string;
    duration: string;
    location: string;
    achievements: string[];
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    highlights: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    gpa?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
  }>;
}

interface ResumeListItem {
  id: string;
  target_role: string | null;
  created_at: string;
}

type ViewMode = 'list' | 'generate' | 'editor';

const ResumeUpgradeNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resumeId } = useResume();
  const printRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingJD, setIsGeneratingJD] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [existingResumeId, setExistingResumeId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.75);
  const [sectionVisibility, setSectionVisibility] = useState({
    personalDetails: true,
    summary: true,
    skills: true,
    experience: true,
    projects: true,
    education: true,
    certifications: true,
  });

  // New state for list & JD
  const [resumeList, setResumeList] = useState<ResumeListItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [jdText, setJdText] = useState('');
  const [currentResumeSource, setCurrentResumeSource] = useState<'profile' | 'jd'>('profile');
  const [currentJdText, setCurrentJdText] = useState('');
  const [currentTargetRole, setCurrentTargetRole] = useState('');

  const toggleSectionVisibility = (section: keyof typeof sectionVisibility) => {
    setSectionVisibility(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!resumeId) {
      navigate('/setup');
      return;
    }
    loadResumeList();
  }, [resumeId]);

  const loadResumeList = async () => {
    if (!resumeId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('upgraded_resume_result')
        .select('id, target_role, created_at')
        .eq('resume_id', resumeId)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setResumeList(data);
        if (data.length === 0) {
          setViewMode('generate');
        } else {
          setViewMode('list');
        }
      } else {
        setViewMode('generate');
      }
    } catch (error) {
      console.error('Error loading resume list:', error);
      setViewMode('generate');
    } finally {
      setIsLoading(false);
    }
  };

  const loadResume = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('upgraded_resume_result')
        .select('*')
        .eq('id', id)
        .single();

      if (data && !error) {
        setResumeData(data.resume_data as unknown as ResumeData);
        setExistingResumeId(data.id);
        setViewMode('editor');
      }
    } catch (error) {
      console.error('Error loading resume:', error);
    }
  };

  const handleRateLimitError = (error: any): boolean => {
    const msg = error?.message || '';
    if (msg.includes('Rate limit') || msg.includes('429')) {
      toast({ title: "Rate Limited", description: "Too many requests. Please wait a moment and try again.", variant: "destructive" });
      return true;
    }
    if (msg.includes('credits') || msg.includes('402')) {
      toast({ title: "Credits Exhausted", description: "AI credits are used up. Please try again later.", variant: "destructive" });
      return true;
    }
    return false;
  };

  const generateResume = async () => {
    if (!resumeId) return;
    setIsGenerating(true);

    try {
      toast({ title: "Generating Resume", description: "AI is creating your optimized resume from your profile..." });

      const { data, error } = await supabase.functions.invoke('resume-upgrade', {
        body: { resume_id: resumeId }
      });

      if (error) {
        if (!handleRateLimitError(error)) throw error;
        return;
      }
      if (!data.success) {
        if (!handleRateLimitError(new Error(data.error))) throw new Error(data.error || 'Failed to generate resume');
        return;
      }

      setResumeData(data.data.resume_data);
      setExistingResumeId(data.data.id);
      setCurrentResumeSource('profile');
      setCurrentTargetRole(data.data.target_role || 'Professional');
      setViewMode('editor');
      await loadResumeList();

      toast({ title: "Resume Generated!", description: "Your optimized resume is ready." });
    } catch (error) {
      console.error('Error generating resume:', error);
      if (!handleRateLimitError(error)) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to generate resume", variant: "destructive" });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromJD = async (jd?: string) => {
    const jobDesc = jd || jdText;
    if (!resumeId || !jobDesc.trim()) {
      toast({ title: "Error", description: "Please paste a job description first.", variant: "destructive" });
      return;
    }
    setIsGeneratingJD(true);

    try {
      toast({ title: "Generating JD-Based Resume", description: "AI is tailoring your resume to the job description..." });

      const { data, error } = await supabase.functions.invoke('resume-upgrade-jd', {
        body: { resume_id: resumeId, job_description: jobDesc }
      });

      if (error) {
        if (!handleRateLimitError(error)) throw error;
        return;
      }
      if (!data.success) {
        if (!handleRateLimitError(new Error(data.error))) throw new Error(data.error || 'Failed to generate resume');
        return;
      }

      setResumeData(data.data.resume_data);
      setExistingResumeId(data.data.id);
      setCurrentResumeSource('jd');
      setCurrentJdText(jobDesc);
      setCurrentTargetRole(data.data.target_role || 'Untitled Role');
      if (!jd) setJdText('');
      setViewMode('editor');
      await loadResumeList();

      toast({ title: "Resume Generated!", description: `Resume tailored for "${data.data.target_role}" is ready.` });
    } catch (error) {
      console.error('Error generating JD resume:', error);
      if (!handleRateLimitError(error)) {
        toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to generate resume", variant: "destructive" });
      }
    } finally {
      setIsGeneratingJD(false);
    }
  };

  const handleRegenerate = () => {
    if (currentResumeSource === 'jd' && currentJdText) {
      generateFromJD(currentJdText);
    } else {
      generateResume();
    }
  };

  const deleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await supabase.from('upgraded_resume_result').delete().eq('id', id);
      const newList = resumeList.filter(r => r.id !== id);
      setResumeList(newList);
      if (newList.length === 0) setViewMode('generate');
      toast({ title: "Deleted", description: "Resume removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete resume", variant: "destructive" });
    }
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    try {
      toast({ title: "Preparing PDF", description: "Generating your resume PDF..." });

      // @ts-ignore
      const html2pdf = (await import('html2pdf.js')).default;

      const opt = {
        margin: 0,
        filename: `${(currentTargetRole || 'resume').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-').toLowerCase()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(printRef.current).save();

      toast({ title: "Download Started", description: "Your PDF is being downloaded." });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: "Error", description: "Failed to generate PDF", variant: "destructive" });
    }
  };

  const updateField = (path: string, value: any) => {
    if (!resumeData) return;
    
    const keys = path.split('.');
    const newData = JSON.parse(JSON.stringify(resumeData));
    let obj: any = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key.includes('[')) {
        const [arrKey, indexStr] = key.split('[');
        const index = parseInt(indexStr.replace(']', ''));
        obj = obj[arrKey][index];
      } else {
        obj = obj[key];
      }
    }
    
    const lastKey = keys[keys.length - 1];
    if (lastKey.includes('[')) {
      const [arrKey, indexStr] = lastKey.split('[');
      const index = parseInt(indexStr.replace(']', ''));
      obj[arrKey][index] = value;
    } else {
      obj[lastKey] = value;
    }
    
    setResumeData(newData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
          <p>Loading resume builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => {
              if (viewMode === 'editor') {
                setViewMode('list');
                setResumeData(null);
              } else if (viewMode === 'generate' && resumeList.length > 0) {
                setViewMode('list');
              } else {
                navigate('/dashboard');
              }
            }}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">
                {viewMode === 'list' ? 'My Resumes' : viewMode === 'generate' ? 'Create Resume' : 'Resume Editor'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {viewMode === 'list' && (
              <Button onClick={() => setViewMode('generate')} className="gap-2">
                <Plus className="w-4 h-4" />
                Create New
              </Button>
            )}
            {viewMode === 'editor' && (
              <>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.max(0.4, s - 0.1))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.min(1.2, s + 0.1))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
                <Button onClick={handleDownloadPDF} className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Resume List View */}
        {viewMode === 'list' && (
          <div className="max-w-4xl mx-auto">
            <p className="text-muted-foreground mb-6">Your generated resumes, each tailored for a specific role.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumeList.map((item) => (
                <Card 
                  key={item.id} 
                  className="hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => loadResume(item.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{item.target_role || 'Untitled Resume'}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_at).toLocaleDateString('en-US', { 
                            month: 'short', day: 'numeric', year: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-4 gap-2 opacity-80 group-hover:opacity-100"
                    >
                      <Eye className="w-3 h-3" />
                      View & Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-1 gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => deleteResume(item.id, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Generate View */}
        {viewMode === 'generate' && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Generate from Profile */}
              <Card className="border-2 border-dashed border-primary/30">
                <CardContent className="py-12 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Generate from Profile</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    AI analyzes your career data, skills, and projects to create an optimized resume.
                  </p>
                  <Button 
                    size="lg" 
                    onClick={generateResume} 
                    disabled={isGenerating || isGeneratingJD}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Generate from JD */}
              <Card className="border-2 border-dashed border-primary/30">
                <CardContent className="py-8">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ClipboardPaste className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Generate from Job Description</h3>
                    <p className="text-muted-foreground text-sm">
                      Paste a JD and get a resume tailored for that specific role.
                    </p>
                  </div>
                  <Textarea
                    placeholder="Paste the full job description here..."
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    className="min-h-[120px] mb-4"
                  />
                  <Button 
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => generateFromJD()} 
                    disabled={isGeneratingJD || isGenerating || !jdText.trim()}
                  >
                    {isGeneratingJD ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Tailoring Resume...
                      </>
                    ) : (
                      <>
                        <ClipboardPaste className="w-5 h-5" />
                        Generate from JD
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Editor View */}
        {viewMode === 'editor' && resumeData && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel - Editor */}
            <div className="lg:w-80 shrink-0 space-y-4 max-h-[calc(100vh-120px)] overflow-y-auto">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    onClick={() => {
                      setViewMode('list');
                      setResumeData(null);
                    }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to My Resumes
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    onClick={handleRegenerate}
                    disabled={isGenerating || isGeneratingJD}
                  >
                    {(isGenerating || isGeneratingJD) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Regenerate
                  </Button>
                  <Button className="w-full gap-2" onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                </CardContent>
              </Card>

              <ResumeEditorPanel
                resumeData={resumeData}
                onUpdate={setResumeData}
                visibility={sectionVisibility}
                onVisibilityChange={toggleSectionVisibility}
              />

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Click any text to edit it directly</p>
                  <p>• Use action verbs in achievements</p>
                  <p>• Include quantifiable metrics</p>
                  <p>• Keep it to 1-2 pages</p>
                </CardContent>
              </Card>
            </div>

            {/* Resume Preview */}
            <div className="flex-1 overflow-auto bg-muted/50 rounded-lg p-6">
              <div 
                className="mx-auto transition-transform duration-200"
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: 'top center',
                  width: '210mm',
                }}
              >
                <div 
                  ref={printRef}
                  id="resume-preview-content"
                  className="bg-white shadow-xl rounded-sm p-10 min-h-[297mm]"
                  style={{ fontFamily: 'Georgia, serif', color: '#1a1a1a' }}
                >
                  {/* Header Section */}
                  {sectionVisibility.personalDetails && (
                    <header className="text-center mb-6 pb-4 border-b-2 border-primary">
                      <EditableText 
                        value={resumeData.header.name}
                        onSave={(v) => updateField('header.name', v)}
                        className="text-3xl font-bold tracking-tight"
                      />
                      <EditableText 
                        value={resumeData.header.title}
                        onSave={(v) => updateField('header.title', v)}
                        className="text-lg text-primary font-medium mt-1"
                      />
                      <div className="flex items-center justify-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {resumeData.header.contact.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {resumeData.header.contact.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {resumeData.header.contact.location}
                        </span>
                        {resumeData.header.contact.linkedin && (
                          <span className="flex items-center gap-1">
                            <Linkedin className="w-3 h-3" />
                            {resumeData.header.contact.linkedin}
                          </span>
                        )}
                      </div>
                    </header>
                  )}

                  {/* Summary */}
                  {sectionVisibility.summary && (
                    <section className="mb-6">
                      <SectionTitle icon={User} title="Professional Summary" />
                      <EditableText 
                        value={resumeData.summary}
                        onSave={(v) => updateField('summary', v)}
                        className="text-sm leading-relaxed text-justify"
                        multiline
                      />
                    </section>
                  )}

                  {/* Skills */}
                  {sectionVisibility.skills && (
                    <section className="mb-6">
                      <SectionTitle icon={Wrench} title="Skills" />
                      <div className="space-y-1 text-sm">
                        <div className="flex gap-2">
                          <span className="font-semibold min-w-24">Technical:</span>
                          <span>{resumeData.skills.technical.join(', ')}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-semibold min-w-24">Tools:</span>
                          <span>{resumeData.skills.tools.join(', ')}</span>
                        </div>
                        {resumeData.skills.domain.length > 0 && (
                          <div className="flex gap-2">
                            <span className="font-semibold min-w-24">Domain:</span>
                            <span>{resumeData.skills.domain.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* Work Experience */}
                  {sectionVisibility.experience && resumeData.work_experience.length > 0 && (
                    <section className="mb-6">
                      <SectionTitle icon={Briefcase} title="Experience" />
                      <div className="space-y-4">
                        {resumeData.work_experience.map((exp, i) => (
                          <div key={i}>
                            <div className="flex justify-between items-baseline">
                              <div>
                                <span className="font-semibold">{exp.title}</span>
                                <span className="text-primary ml-2">{exp.company}</span>
                              </div>
                              <div className="text-sm text-muted-foreground text-right">
                                <div>{exp.duration}</div>
                                <div>{exp.location}</div>
                              </div>
                            </div>
                            <ul className="list-disc ml-5 mt-1 space-y-1 text-sm">
                              {exp.achievements.map((ach, j) => (
                                <li key={j}>{ach}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Projects */}
                  {sectionVisibility.projects && resumeData.projects.length > 0 && (
                    <section className="mb-6">
                      <SectionTitle icon={Code} title="Projects" />
                      <div className="space-y-3">
                        {resumeData.projects.map((proj, i) => (
                          <div key={i}>
                            <div className="font-semibold">{proj.title}</div>
                            <p className="text-sm text-muted-foreground">{proj.description}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {proj.technologies.map((tech, j) => (
                                <Badge key={j} variant="outline" className="text-xs">{tech}</Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Education */}
                  {sectionVisibility.education && resumeData.education.length > 0 && (
                    <section className="mb-6">
                      <SectionTitle icon={GraduationCap} title="Education" />
                      <div className="space-y-2">
                        {resumeData.education.map((edu, i) => (
                          <div key={i} className="flex justify-between">
                            <div>
                              <span className="font-semibold">{edu.degree}</span>
                              <span className="text-muted-foreground ml-2">{edu.institution}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{edu.year}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Certifications */}
                  {sectionVisibility.certifications && resumeData.certifications.length > 0 && (
                    <section>
                      <SectionTitle icon={Award} title="Certifications" />
                      <div className="space-y-1">
                        {resumeData.certifications.map((cert, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span>{cert.name} - {cert.issuer}</span>
                            <span className="text-muted-foreground">{cert.year}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Helper Components
const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <h2 className="text-lg font-bold border-b border-border pb-1 mb-3 flex items-center gap-2">
    <Icon className="w-4 h-4 text-primary" />
    {title}
  </h2>
);

const EditableText = ({ 
  value, 
  onSave, 
  className = '', 
  multiline = false 
}: { 
  value: string; 
  onSave: (value: string) => void; 
  className?: string;
  multiline?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative">
        {multiline ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={`${className} min-h-20`}
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={className}
            autoFocus
          />
        )}
        <div className="absolute -top-2 -right-2 flex gap-1">
          <Button size="icon" className="h-6 w-6" onClick={handleSave}>
            <Check className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="outline" className="h-6 w-6" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <span 
      className={`${className} cursor-pointer hover:bg-primary/5 rounded px-1 transition-colors`}
      onClick={() => setIsEditing(true)}
    >
      {value}
    </span>
  );
};

export default ResumeUpgradeNoAuth;
