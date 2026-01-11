import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  FileText,
  Download,
  Save,
  Edit3,
  Plus,
  X,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  GraduationCap,
  Award,
  Briefcase,
  Target,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ParsedResumeData {
  personal_info?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  summary?: string;
  experience?: Array<{
    title?: string;
    company?: string;
    duration?: string;
    location?: string;
    description?: string;
    responsibilities?: string[];
  }>;
  education?: Array<{
    degree?: string;
    institution?: string;
    year?: string;
    location?: string;
    gpa?: string;
  }>;
  skills?: {
    technical?: string[];
    tools?: string[];
    domain?: string[];
  };
  projects?: Array<{
    title?: string;
    description?: string;
    technologies?: string[];
    duration?: string;
  }>;
  certifications?: Array<{
    name?: string;
    issuer?: string;
    date?: string;
  }>;
}

interface ResumeAnalysis {
  id: string;
  file_name: string | null;
  parsed_data: any; // Using any to handle Json type from database
  resume_text: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface ResumeVersion {
  id: string;
  base_resume_id: string;
  user_id: string;
  version_name: string | null;
  target_role: string | null;
  target_domain: string | null;
  resume_data: any;
  included_skills: string[] | null;
  included_projects: string[] | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

const Resume = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeAnalysis | null>(null);
  const [resumeVersions, setResumeVersions] = useState<ResumeVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<ResumeVersion | null>(null);
  const [editableData, setEditableData] = useState<ParsedResumeData>({});
  const [editableVersionData, setEditableVersionData] = useState<ParsedResumeData>({});
  const [editMode, setEditMode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadResumeData();
    }
  }, [user]);

  const loadResumeData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load base resume analysis
      const { data: resumeAnalysis, error } = await supabase
        .from('resume_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading resume:', error);
        toast({
          title: "Error",
          description: "Failed to load resume data",
          variant: "destructive"
        });
        return;
      }

      if (resumeAnalysis) {
        setResumeData(resumeAnalysis);
        
        // Parse the JSON data safely
        let parsedData: ParsedResumeData = {};
        if (resumeAnalysis.parsed_data) {
          try {
            parsedData = typeof resumeAnalysis.parsed_data === 'object' 
              ? resumeAnalysis.parsed_data as ParsedResumeData
              : JSON.parse(resumeAnalysis.parsed_data as string);
          } catch (e) {
            console.error('Error parsing resume data:', e);
          }
        }
        
        setEditableData(parsedData);

        // Load resume versions
        const { data: versions, error: versionsError } = await supabase
          .from('resume_versions')
          .select('*')
          .eq('user_id', user.id)
          .eq('base_resume_id', resumeAnalysis.id)
          .order('created_at', { ascending: false });

        if (versionsError) {
          console.error('Error loading resume versions:', versionsError);
        } else if (versions && versions.length > 0) {
          setResumeVersions(versions);
          
          // Set the active version or the first one as selected
          const activeVersion = versions.find(v => v.is_active) || versions[0];
          setSelectedVersion(activeVersion);
          
          // Parse version data
          let versionData: ParsedResumeData = {};
          if (activeVersion.resume_data) {
            try {
              versionData = typeof activeVersion.resume_data === 'object' 
                ? activeVersion.resume_data as ParsedResumeData
                : JSON.parse(activeVersion.resume_data as string);
            } catch (e) {
              console.error('Error parsing version data:', e);
            }
          }
          
          setEditableVersionData(versionData);
        }
      }

    } catch (error) {
      console.error('Error loading resume data:', error);
      toast({
        title: "Error",
        description: "Failed to load resume data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveResumeData = async () => {
    if (!user || !resumeData) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('resume_analysis')
        .update({
          parsed_data: editableData as any, // Cast to any for Json compatibility
          updated_at: new Date().toISOString()
        })
        .eq('id', resumeData.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Resume updated successfully",
      });

      setEditMode(null);
      loadResumeData(); // Refresh data

    } catch (error) {
      console.error('Error saving resume:', error);
      toast({
        title: "Error",
        description: "Failed to save resume changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const saveResumeVersionData = async () => {
    if (!user || !selectedVersion) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('resume_versions')
        .update({
          resume_data: editableVersionData as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedVersion.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Resume version updated successfully",
      });

      setEditMode(null);
      loadResumeData(); // Refresh data

    } catch (error) {
      console.error('Error saving resume version:', error);
      toast({
        title: "Error",
        description: "Failed to save resume version changes",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateVersionPersonalInfo = (field: string, value: string) => {
    setEditableVersionData(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  const updateVersionExperience = (index: number, field: string, value: string | string[]) => {
    setEditableVersionData(prev => ({
      ...prev,
      experience: prev.experience?.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      ) || []
    }));
  };

  const addVersionExperience = () => {
    setEditableVersionData(prev => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          title: '',
          company: '',
          duration: '',
          location: '',
          description: '',
          responsibilities: []
        }
      ]
    }));
  };

  const removeVersionExperience = (index: number) => {
    setEditableVersionData(prev => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== index) || []
    }));
  };

  const updateVersionSkills = (category: string, skills: string[]) => {
    setEditableVersionData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: skills
      }
    }));
  };

  const selectVersion = (version: ResumeVersion) => {
    setSelectedVersion(version);
    
    // Parse version data
    let versionData: ParsedResumeData = {};
    if (version.resume_data) {
      try {
        versionData = typeof version.resume_data === 'object' 
          ? version.resume_data as ParsedResumeData
          : JSON.parse(version.resume_data as string);
      } catch (e) {
        console.error('Error parsing version data:', e);
      }
    }
    
    setEditableVersionData(versionData);
    setEditMode(null); // Reset edit mode when switching versions
  };

  const updatePersonalInfo = (field: string, value: string) => {
    setEditableData(prev => ({
      ...prev,
      personal_info: {
        ...prev.personal_info,
        [field]: value
      }
    }));
  };

  const updateExperience = (index: number, field: string, value: string | string[]) => {
    setEditableData(prev => ({
      ...prev,
      experience: prev.experience?.map((exp, i) => 
        i === index ? { ...exp, [field]: value } : exp
      ) || []
    }));
  };

  const addExperience = () => {
    setEditableData(prev => ({
      ...prev,
      experience: [
        ...(prev.experience || []),
        {
          title: '',
          company: '',
          duration: '',
          location: '',
          description: '',
          responsibilities: []
        }
      ]
    }));
  };

  const removeExperience = (index: number) => {
    setEditableData(prev => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== index) || []
    }));
  };

  const updateSkills = (category: string, skills: string[]) => {
    setEditableData(prev => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: skills
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Loading resume...</h3>
              <p className="text-sm text-muted-foreground">Fetching your resume data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Resume Builder</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button className="gap-2">
              <Save className="w-4 h-4" />
              Save Resume
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-6 max-w-7xl">
        {!resumeData ? (
          /* No Resume Data */
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Resume Found</h3>
              <p className="text-muted-foreground mb-6">
                Upload your resume to get started with AI-powered resume optimization.
              </p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Upload Resume
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Resume Content */
          <Tabs defaultValue="current" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Your Resume
              </TabsTrigger>
              <TabsTrigger value="upgraded" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Upgraded Resume
              </TabsTrigger>
            </TabsList>

            {/* Current Resume Tab */}
            <TabsContent value="current">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Resume Sections (Left) */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resume Sections</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        View and manage your resume content
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Header Section */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Header
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="font-medium">{editableData.personal_info?.name || 'Name not provided'}</div>
                          <div className="text-muted-foreground">{editableData.personal_info?.email || 'Email not provided'}</div>
                          <div className="text-muted-foreground">{editableData.personal_info?.phone || 'Phone not provided'}</div>
                          <div className="text-muted-foreground">{editableData.personal_info?.location || 'Location not provided'}</div>
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Summary
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {editableData.summary || 'No summary provided'}
                        </p>
                      </div>

                      {/* Skills Section */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Skills
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {editableData.skills?.technical && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Technical Skills</div>
                              <div className="flex flex-wrap gap-1">
                                {editableData.skills.technical.map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          {editableData.skills?.tools && (
                            <div>
                              <div className="text-xs font-medium text-muted-foreground mb-1">Tools & Technologies</div>
                              <div className="flex flex-wrap gap-1">
                                {editableData.skills.tools.map((tool, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tool}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Experience Section */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            Work Experience
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-muted-foreground">
                              {editableData.experience?.length || 0} items
                            </span>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {editableData.experience?.map((exp, index) => (
                            <div key={index} className="border-l-2 border-primary/20 pl-3">
                              <div className="font-medium text-sm">{exp.title}</div>
                              <div className="text-xs text-muted-foreground">{exp.company} • {exp.duration}</div>
                            </div>
                          )) || <div className="text-sm text-muted-foreground">No experience added</div>}
                        </div>
                      </div>

                      {/* Education Section */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            Education
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-muted-foreground">
                              {editableData.education?.length || 0} items
                            </span>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {editableData.education?.map((edu, index) => (
                            <div key={index}>
                              <div className="font-medium text-sm">{edu.degree}</div>
                              <div className="text-xs text-muted-foreground">{edu.institution} • {edu.year}</div>
                            </div>
                          )) || <div className="text-sm text-muted-foreground">No education added</div>}
                        </div>
                      </div>

                      {/* Projects Section */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Projects
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-muted-foreground">
                              {editableData.projects?.length || 0} items
                            </span>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {editableData.projects?.map((project, index) => (
                            <div key={index}>
                              <div className="font-medium text-sm">{project.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">{project.description}</div>
                            </div>
                          )) || <div className="text-sm text-muted-foreground">No projects added</div>}
                        </div>
                      </div>

                      {/* Certifications Section */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Certifications
                          </h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-xs text-muted-foreground">
                              {editableData.certifications?.length || 0} items
                            </span>
                            <Button variant="ghost" size="sm">
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {editableData.certifications?.map((cert, index) => (
                            <div key={index}>
                              <div className="font-medium text-sm">{cert.name}</div>
                              <div className="text-xs text-muted-foreground">{cert.issuer} • {cert.date}</div>
                            </div>
                          )) || <div className="text-sm text-muted-foreground">No certifications added</div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Resume Preview (Right) */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-primary" />
                          Resume Preview
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ATS-friendly format • Real-time updates
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[800px] w-full border rounded-lg p-6 bg-white">
                        {/* Resume Content */}
                        <div className="space-y-6 text-black">
                          {/* Header */}
                          <div className="text-center border-b pb-4">
                            <h1 className="text-2xl font-bold mb-2">
                              {editableData.personal_info?.name || 'Your Name'}
                            </h1>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>{editableData.personal_info?.email}</div>
                              <div>{editableData.personal_info?.phone}</div>
                              <div>{editableData.personal_info?.location}</div>
                            </div>
                          </div>

                          {/* Summary */}
                          {editableData.summary && (
                            <div>
                              <h2 className="text-lg font-semibold mb-2 text-gray-800">PROFESSIONAL SUMMARY</h2>
                              <p className="text-sm leading-relaxed text-gray-700">
                                {editableData.summary}
                              </p>
                            </div>
                          )}

                          {/* Skills */}
                          {(editableData.skills?.technical || editableData.skills?.tools) && (
                            <div>
                              <h2 className="text-lg font-semibold mb-2 text-gray-800">CORE COMPETENCIES</h2>
                              <div className="space-y-2">
                                {editableData.skills?.technical && (
                                  <div>
                                    <span className="font-medium text-sm">Technical Skills: </span>
                                    <span className="text-sm text-gray-700">
                                      {editableData.skills.technical.join(' • ')}
                                    </span>
                                  </div>
                                )}
                                {editableData.skills?.tools && (
                                  <div>
                                    <span className="font-medium text-sm">Tools & Technologies: </span>
                                    <span className="text-sm text-gray-700">
                                      {editableData.skills.tools.join(' • ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Experience */}
                          {editableData.experience && editableData.experience.length > 0 && (
                            <div>
                              <h2 className="text-lg font-semibold mb-3 text-gray-800">PROFESSIONAL EXPERIENCE</h2>
                              <div className="space-y-4">
                                {editableData.experience.map((exp, index) => (
                                  <div key={index}>
                                    <div className="flex justify-between items-start mb-1">
                                      <h3 className="font-semibold text-sm">{exp.title}</h3>
                                      <span className="text-xs text-gray-600">{exp.duration}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                      {exp.company} • {exp.location}
                                    </div>
                                    {exp.description && (
                                      <p className="text-sm text-gray-700 leading-relaxed">
                                        {exp.description}
                                      </p>
                                    )}
                                    {exp.responsibilities && exp.responsibilities.length > 0 && (
                                      <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                                        {exp.responsibilities.map((resp, idx) => (
                                          <li key={idx}>{resp}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Education */}
                          {editableData.education && editableData.education.length > 0 && (
                            <div>
                              <h2 className="text-lg font-semibold mb-3 text-gray-800">EDUCATION</h2>
                              <div className="space-y-2">
                                {editableData.education.map((edu, index) => (
                                  <div key={index}>
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <h3 className="font-semibold text-sm">{edu.degree}</h3>
                                        <div className="text-sm text-gray-600">{edu.institution}</div>
                                      </div>
                                      <span className="text-xs text-gray-600">{edu.year}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Projects */}
                          {editableData.projects && editableData.projects.length > 0 && (
                            <div>
                              <h2 className="text-lg font-semibold mb-3 text-gray-800">PROJECTS</h2>
                              <div className="space-y-3">
                                {editableData.projects.map((project, index) => (
                                  <div key={index}>
                                    <h3 className="font-semibold text-sm">{project.title}</h3>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {project.description}
                                    </p>
                                    {project.technologies && (
                                      <div className="text-xs text-gray-600 mt-1">
                                        Technologies: {project.technologies.join(', ')}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Certifications */}
                          {editableData.certifications && editableData.certifications.length > 0 && (
                            <div>
                              <h2 className="text-lg font-semibold mb-3 text-gray-800">CERTIFICATIONS & AWARDS</h2>
                              <div className="space-y-2">
                                {editableData.certifications.map((cert, index) => (
                                  <div key={index} className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-semibold text-sm">{cert.name}</h3>
                                      <div className="text-sm text-gray-600">{cert.issuer}</div>
                                    </div>
                                    <span className="text-xs text-gray-600">{cert.date}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Upgraded Resume Tab */}
            <TabsContent value="upgraded">
              {resumeVersions.length > 0 ? (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Version Selection and Editing (Left) */}
                  <div className="space-y-6">
                    {/* Version Selector */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Resume Versions</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Select and edit your AI-optimized resume versions
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {resumeVersions.map((version) => (
                          <div
                            key={version.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                              selectedVersion?.id === version.id 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => selectVersion(version)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">
                                {version.version_name || `Version ${version.id.slice(0, 8)}`}
                              </h4>
                              <div className="flex items-center gap-2">
                                {version.is_active && (
                                  <Badge variant="default" className="text-xs">Active</Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {version.target_role || 'General'}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>Target: {version.target_role || 'General Role'}</div>
                              <div>Domain: {version.target_domain || 'All Domains'}</div>
                              <div>Updated: {new Date(version.updated_at || version.created_at || '').toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Editable Sections */}
                    {selectedVersion && (
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Edit Resume Content</CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Customize your resume for specific roles
                            </p>
                          </div>
                          <Button
                            onClick={saveResumeVersionData}
                            disabled={isSaving}
                            className="gap-2"
                          >
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                          </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Personal Info Editing */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Personal Information
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditMode(editMode === 'personal' ? null : 'personal')}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                            {editMode === 'personal' ? (
                              <div className="space-y-3">
                                <div>
                                  <Label htmlFor="name">Full Name</Label>
                                  <Input
                                    id="name"
                                    value={editableVersionData.personal_info?.name || ''}
                                    onChange={(e) => updateVersionPersonalInfo('name', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                    id="email"
                                    value={editableVersionData.personal_info?.email || ''}
                                    onChange={(e) => updateVersionPersonalInfo('email', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="phone">Phone</Label>
                                  <Input
                                    id="phone"
                                    value={editableVersionData.personal_info?.phone || ''}
                                    onChange={(e) => updateVersionPersonalInfo('phone', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="location">Location</Label>
                                  <Input
                                    id="location"
                                    value={editableVersionData.personal_info?.location || ''}
                                    onChange={(e) => updateVersionPersonalInfo('location', e.target.value)}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2 text-sm">
                                <div className="font-medium">{editableVersionData.personal_info?.name || 'Name not provided'}</div>
                                <div className="text-muted-foreground">{editableVersionData.personal_info?.email || 'Email not provided'}</div>
                                <div className="text-muted-foreground">{editableVersionData.personal_info?.phone || 'Phone not provided'}</div>
                                <div className="text-muted-foreground">{editableVersionData.personal_info?.location || 'Location not provided'}</div>
                              </div>
                            )}
                          </div>

                          {/* Summary Editing */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <Target className="w-4 h-4" />
                                Professional Summary
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditMode(editMode === 'summary' ? null : 'summary')}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                            {editMode === 'summary' ? (
                              <div>
                                <Textarea
                                  value={editableVersionData.summary || ''}
                                  onChange={(e) => setEditableVersionData(prev => ({ ...prev, summary: e.target.value }))}
                                  placeholder="Write a compelling professional summary..."
                                  rows={4}
                                />
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {editableVersionData.summary || 'No summary provided'}
                              </p>
                            )}
                          </div>

                          {/* Skills Editing */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <Star className="w-4 h-4" />
                                Skills
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditMode(editMode === 'skills' ? null : 'skills')}
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                            {editMode === 'skills' ? (
                              <div className="space-y-3">
                                <div>
                                  <Label>Technical Skills (comma-separated)</Label>
                                  <Input
                                    value={editableVersionData.skills?.technical?.join(', ') || ''}
                                    onChange={(e) => updateVersionSkills('technical', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="Python, JavaScript, React..."
                                  />
                                </div>
                                <div>
                                  <Label>Tools & Technologies (comma-separated)</Label>
                                  <Input
                                    value={editableVersionData.skills?.tools?.join(', ') || ''}
                                    onChange={(e) => updateVersionSkills('tools', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                    placeholder="Git, Docker, AWS..."
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {editableVersionData.skills?.technical && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Technical Skills</div>
                                    <div className="flex flex-wrap gap-1">
                                      {editableVersionData.skills.technical.map((skill, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {skill}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {editableVersionData.skills?.tools && (
                                  <div>
                                    <div className="text-xs font-medium text-muted-foreground mb-1">Tools & Technologies</div>
                                    <div className="flex flex-wrap gap-1">
                                      {editableVersionData.skills.tools.map((tool, index) => (
                                        <Badge key={index} variant="outline" className="text-xs">
                                          {tool}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Experience Editing */}
                          <div className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Work Experience
                              </h4>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={addVersionExperience}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditMode(editMode === 'experience' ? null : 'experience')}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {editMode === 'experience' ? (
                              <div className="space-y-4">
                                {editableVersionData.experience?.map((exp, index) => (
                                  <div key={index} className="border rounded-lg p-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h5 className="font-medium">Experience {index + 1}</h5>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeVersionExperience(index)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <Label>Job Title</Label>
                                        <Input
                                          value={exp.title || ''}
                                          onChange={(e) => updateVersionExperience(index, 'title', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <Label>Company</Label>
                                        <Input
                                          value={exp.company || ''}
                                          onChange={(e) => updateVersionExperience(index, 'company', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <Label>Duration</Label>
                                        <Input
                                          value={exp.duration || ''}
                                          onChange={(e) => updateVersionExperience(index, 'duration', e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <Label>Location</Label>
                                        <Input
                                          value={exp.location || ''}
                                          onChange={(e) => updateVersionExperience(index, 'location', e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <Label>Description</Label>
                                      <Textarea
                                        value={exp.description || ''}
                                        onChange={(e) => updateVersionExperience(index, 'description', e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                )) || <div className="text-sm text-muted-foreground">No experience added</div>}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {editableVersionData.experience?.map((exp, index) => (
                                  <div key={index} className="border-l-2 border-primary/20 pl-3">
                                    <div className="font-medium text-sm">{exp.title}</div>
                                    <div className="text-xs text-muted-foreground">{exp.company} • {exp.duration}</div>
                                  </div>
                                )) || <div className="text-sm text-muted-foreground">No experience added</div>}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Resume Preview (Right) */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-primary" />
                          Upgraded Resume Preview
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          AI-optimized • Role-specific • ATS-friendly
                        </p>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[800px] w-full border rounded-lg p-6 bg-white">
                          {selectedVersion && (
                            <div className="space-y-6 text-black">
                              {/* Header */}
                              <div className="text-center border-b pb-4">
                                <h1 className="text-2xl font-bold mb-2">
                                  {editableVersionData.personal_info?.name || 'Your Name'}
                                </h1>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <div>{editableVersionData.personal_info?.email}</div>
                                  <div>{editableVersionData.personal_info?.phone}</div>
                                  <div>{editableVersionData.personal_info?.location}</div>
                                </div>
                              </div>

                              {/* Summary */}
                              {editableVersionData.summary && (
                                <div>
                                  <h2 className="text-lg font-semibold mb-2 text-gray-800">PROFESSIONAL SUMMARY</h2>
                                  <p className="text-sm leading-relaxed text-gray-700">
                                    {editableVersionData.summary}
                                  </p>
                                </div>
                              )}

                              {/* Skills */}
                              {(editableVersionData.skills?.technical || editableVersionData.skills?.tools) && (
                                <div>
                                  <h2 className="text-lg font-semibold mb-2 text-gray-800">CORE COMPETENCIES</h2>
                                  <div className="space-y-2">
                                    {editableVersionData.skills?.technical && (
                                      <div>
                                        <span className="font-medium text-sm">Technical Skills: </span>
                                        <span className="text-sm text-gray-700">
                                          {editableVersionData.skills.technical.join(' • ')}
                                        </span>
                                      </div>
                                    )}
                                    {editableVersionData.skills?.tools && (
                                      <div>
                                        <span className="font-medium text-sm">Tools & Technologies: </span>
                                        <span className="text-sm text-gray-700">
                                          {editableVersionData.skills.tools.join(' • ')}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Experience */}
                              {editableVersionData.experience && editableVersionData.experience.length > 0 && (
                                <div>
                                  <h2 className="text-lg font-semibold mb-3 text-gray-800">PROFESSIONAL EXPERIENCE</h2>
                                  <div className="space-y-4">
                                    {editableVersionData.experience.map((exp, index) => (
                                      <div key={index}>
                                        <div className="flex justify-between items-start mb-1">
                                          <h3 className="font-semibold text-sm">{exp.title}</h3>
                                          <span className="text-xs text-gray-600">{exp.duration}</span>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-2">
                                          {exp.company} • {exp.location}
                                        </div>
                                        {exp.description && (
                                          <p className="text-sm text-gray-700 leading-relaxed">
                                            {exp.description}
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Education */}
                              {editableVersionData.education && editableVersionData.education.length > 0 && (
                                <div>
                                  <h2 className="text-lg font-semibold mb-3 text-gray-800">EDUCATION</h2>
                                  <div className="space-y-2">
                                    {editableVersionData.education.map((edu, index) => (
                                      <div key={index}>
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h3 className="font-semibold text-sm">{edu.degree}</h3>
                                            <div className="text-sm text-gray-600">{edu.institution}</div>
                                          </div>
                                          <span className="text-xs text-gray-600">{edu.year}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Projects */}
                              {editableVersionData.projects && editableVersionData.projects.length > 0 && (
                                <div>
                                  <h2 className="text-lg font-semibold mb-3 text-gray-800">PROJECTS</h2>
                                  <div className="space-y-3">
                                    {editableVersionData.projects.map((project, index) => (
                                      <div key={index}>
                                        <h3 className="font-semibold text-sm">{project.title}</h3>
                                        <p className="text-sm text-gray-700 leading-relaxed">
                                          {project.description}
                                        </p>
                                        {project.technologies && (
                                          <div className="text-xs text-gray-600 mt-1">
                                            Technologies: {project.technologies.join(', ')}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Certifications */}
                              {editableVersionData.certifications && editableVersionData.certifications.length > 0 && (
                                <div>
                                  <h2 className="text-lg font-semibold mb-3 text-gray-800">CERTIFICATIONS & AWARDS</h2>
                                  <div className="space-y-2">
                                    {editableVersionData.certifications.map((cert, index) => (
                                      <div key={index} className="flex justify-between items-start">
                                        <div>
                                          <h3 className="font-semibold text-sm">{cert.name}</h3>
                                          <div className="text-sm text-gray-600">{cert.issuer}</div>
                                        </div>
                                        <span className="text-xs text-gray-600">{cert.date}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      Upgraded Resume
                    </CardTitle>
                    <p className="text-muted-foreground">
                      AI-optimized resume versions for specific roles and domains
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Star className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Resume Versions Available</h3>
                      <p className="text-muted-foreground mb-6">
                        Create AI-optimized resume versions tailored for specific roles and industries.
                      </p>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create First Version
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Resume;