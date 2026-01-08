import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import {
  Target,
  BookOpen,
  Rocket,
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  GraduationCap,
  Briefcase,
  Award,
  LogOut,
  Loader2,
  Upload,
  FileText,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import * as pdfjsLib from "pdfjs-dist/build/pdf.mjs";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = pdfWorkerSrc;


const Setup = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [goal, setGoal] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [activities, setActivities] = useState("");
  const [education, setEducation] = useState({
    degree: "",
    field: "",
    year: "",
    institution: "",
  });
  const [experiences, setExperiences] = useState<{
    id?: string;
    company: string;
    role: string;
    skills: string;
    startYear: string;
    endYear: string;
  }[]>([]);
  const [certifications, setCertifications] = useState<{
    id?: string;
    title: string;
    issuer: string;
    year: string;
  }[]>([]);
  
  // Resume upload state
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeParsed, setResumeParsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing data when component mounts
  useEffect(() => {
    if (user) {
      loadExistingData();
    }
  }, [user]);

  const loadExistingData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Load profile data
      const { data: profile } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setGoal(profile.goal_type || "");
        setGoalDescription(profile.goal_description || "");
        setInterests(profile.interests || []);
        setActivities((profile.activities || []).join(", "));
        setHobbies((profile.hobbies || []).join(", "));
      }

      // Load education data
      const { data: educationData } = await supabase
        .from('education_details')
        .select('*')
        .eq('user_id', user.id)
        .order('graduation_year', { ascending: false })
        .limit(1);

      if (educationData && educationData.length > 0) {
        const edu = educationData[0];
        setEducation({
          degree: edu.degree || "",
          field: edu.field || "",
          year: edu.graduation_year?.toString() || "",
          institution: edu.institution || "",
        });
      }

      // Load experience data
      const { data: experienceData } = await supabase
        .from('experience_details')
        .select('*')
        .eq('user_id', user.id)
        .order('start_year', { ascending: false });

      if (experienceData && experienceData.length > 0) {
        setExperiences(experienceData.map(exp => ({
          id: exp.id,
          company: exp.company || "",
          role: exp.role || "",
          skills: (exp.skills || []).join(", "),
          startYear: exp.start_year?.toString() || "",
          endYear: exp.end_year?.toString() || "",
        })));
      }

      // Load certifications data
      const { data: certificationData } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false });

      if (certificationData && certificationData.length > 0) {
        setCertifications(certificationData.map(cert => ({
          id: cert.id,
          title: cert.title || "",
          issuer: cert.issuer || "",
          year: cert.year?.toString() || "",
        })));
      }

    } catch (error) {
      console.error('Error loading existing data:', error);
      toast({
        title: "Info",
        description: "Starting with a fresh setup. You can enter your information below.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goals = [
    { id: "learn", label: "Learn", icon: BookOpen, description: "Acquire new skills and knowledge" },
    { id: "job", label: "Job", icon: Target, description: "Find your dream career opportunity" },
    { id: "startup", label: "Startup", icon: Rocket, description: "Build and launch your own venture" },
  ];

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const addExperience = () => {
    setExperiences([...experiences, { company: "", role: "", skills: "", startYear: "", endYear: "" }]);
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const removeExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    setCertifications([...certifications, { title: "", issuer: "", year: "" }]);
  };

  const updateCertification = (index: number, field: string, value: string) => {
    const updated = [...certifications];
    updated[index] = { ...updated[index], [field]: value };
    setCertifications(updated);
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['txt', 'pdf', 'docx'];

    if (!ext || !allowedExts.includes(ext)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingResume(true);
    setResumeFileName(file.name);

    try {
      let resumeText = '';

      if (ext === 'txt') {
        resumeText = await file.text();
      }

      if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        resumeText = value || '';
      }

      if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = (pdfjsLib as any).getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;

        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = (content.items || [])
            .map((item: any) => (typeof item.str === 'string' ? item.str : ''))
            .join(' ');
          fullText += pageText + "\n";
        }

        resumeText = fullText;
      }

      // Remove null bytes and trim for safety (prevents DB errors on \u0000)
      resumeText = resumeText.replace(/\u0000/g, '').trim();

      if (!resumeText) {
        toast({
          title: "Could not read resume",
          description: "We couldn't extract text from that file. Try a different PDF/DOCX or upload a TXT resume.",
          variant: "destructive",
        });
        return;
      }

      // Keep prompts bounded
      const resumeTextForAi = resumeText.slice(0, 20000);

      // Call the edge function to parse the resume
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('You must be logged in to upload a resume');

      const response = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/resume-parser`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            resumeText: resumeTextForAi,
            fileName: file.name,
          }),
        }
      );


      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse resume');
      }

      // Auto-fill form fields from parsed data
      const parsedData = result.data?.parsed_data;
      if (parsedData) {
        // Fill education
        if (parsedData.education && parsedData.education.length > 0) {
          const latestEdu = parsedData.education[0];
          setEducation({
            degree: latestEdu.degree || '',
            field: latestEdu.field || '',
            year: latestEdu.graduation_year?.toString() || '',
            institution: latestEdu.institution || '',
          });
        }

        // Fill experiences
        if (parsedData.experience && parsedData.experience.length > 0) {
          setExperiences(parsedData.experience.map((exp: { 
            company?: string; 
            role?: string; 
            skills?: string[];
            start_year?: number;
            end_year?: number;
          }) => ({
            company: exp.company || '',
            role: exp.role || '',
            skills: (exp.skills || []).join(', '),
            startYear: exp.start_year?.toString() || '',
            endYear: exp.end_year?.toString() || '',
          })));
        }

        // Fill certifications
        if (parsedData.certifications && parsedData.certifications.length > 0) {
          setCertifications(parsedData.certifications.map((cert: {
            title?: string;
            issuer?: string;
            year?: number;
          }) => ({
            title: cert.title || '',
            issuer: cert.issuer || '',
            year: cert.year?.toString() || '',
          })));
        }

        // Fill interests from resume
        if (parsedData.interests && parsedData.interests.length > 0) {
          setInterests(prev => [...new Set([...prev, ...parsedData.interests])]);
        }

        // Fill hobbies if any
        if (parsedData.skills && parsedData.skills.length > 0) {
          // Add skills as activities if not already present
          const skillsText = parsedData.skills.slice(0, 10).join(', ');
          setActivities(prev => prev ? `${prev}, ${skillsText}` : skillsText);
        }
      }

      setResumeParsed(true);
      toast({
        title: "Resume uploaded successfully!",
        description: "Your information has been extracted and filled in automatically.",
      });

    } catch (error: unknown) {
      console.error('Error uploading resume:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload resume';
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploadingResume(false);
    }
  };

  const saveProfileToSupabase = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in",
        variant: "destructive"
      });
      return false;
    }

    setIsSubmitting(true);

    try {
      // Parse hobbies and activities into arrays
      const hobbiesArray = hobbies.split(',').map(h => h.trim()).filter(Boolean);
      const activitiesArray = activities.split(',').map(a => a.trim()).filter(Boolean);

      // 1. Upsert users_profile
      const { error: profileError } = await supabase
        .from('users_profile')
        .upsert({
          id: user.id,
          goal_type: goal,
          goal_description: goalDescription,
          interests: interests,
          hobbies: hobbiesArray,
          activities: activitiesArray,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // 2. Handle education_details - delete existing and insert new if provided
      if (education.degree || education.field || education.institution) {
        // Delete existing education records
        await supabase
          .from('education_details')
          .delete()
          .eq('user_id', user.id);

        // Insert new education record
        const { error: eduError } = await supabase
          .from('education_details')
          .insert({
            user_id: user.id,
            degree: education.degree || null,
            field: education.field || null,
            institution: education.institution || null,
            graduation_year: education.year ? parseInt(education.year) : null,
          });

        if (eduError) throw eduError;
      }

      // 3. Handle experience_details - delete existing and insert new
      // Delete existing experience records
      await supabase
        .from('experience_details')
        .delete()
        .eq('user_id', user.id);

      // Insert new experience records
      for (const exp of experiences) {
        if (exp.company || exp.role) {
          const skillsArray = exp.skills.split(',').map(s => s.trim()).filter(Boolean);
          const { error: expError } = await supabase
            .from('experience_details')
            .insert({
              user_id: user.id,
              company: exp.company || null,
              role: exp.role || null,
              skills: skillsArray.length > 0 ? skillsArray : null,
              start_year: exp.startYear ? parseInt(exp.startYear) : null,
              end_year: exp.endYear ? parseInt(exp.endYear) : null,
            });

          if (expError) throw expError;
        }
      }

      // 4. Handle certifications - delete existing and insert new
      // Delete existing certification records
      await supabase
        .from('certifications')
        .delete()
        .eq('user_id', user.id);

      // Insert new certification records
      for (const cert of certifications) {
        if (cert.title) {
          const { error: certError } = await supabase
            .from('certifications')
            .insert({
              user_id: user.id,
              title: cert.title || null,
              issuer: cert.issuer || null,
              year: cert.year ? parseInt(cert.year) : null,
            });

          if (certError) throw certError;
        }
      }

      // 5. Update user_journey_state.profile_completed = true
      const { error: journeyError } = await supabase
        .from('user_journey_state')
        .upsert({
          user_id: user.id,
          profile_completed: true,
          updated_at: new Date().toISOString(),
        });

      if (journeyError) throw journeyError;

      return true;
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (step === 1 && !goal) {
      toast({
        title: "Error",
        description: "Please select a goal",
        variant: "destructive"
      });
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      const success = await saveProfileToSupabase();
      if (success) {
        toast({
          title: "Success",
          description: "Profile setup complete!",
        });
        navigate("/dashboard");
      }
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div>
                <h3 className="font-semibold text-foreground">Loading your profile...</h3>
                <p className="text-sm text-muted-foreground">Retrieving your existing information</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Target className="w-5 h-5 text-primary" />
            Complete Your Profile
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              Step {step} of 3
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Stepper */}
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  s < step
                    ? "bg-success text-success-foreground"
                    : s === step
                    ? "bg-gradient-hero text-primary-foreground shadow-glow"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-24 md:w-32 h-1 mx-2 rounded-full transition-all duration-300 ${
                    s < step ? "bg-success" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-8 animate-scale-in">
          {step === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">What is your goal?</h2>
                <p className="text-muted-foreground">
                  Choose what you want to achieve with AI Career Advisor
                  {(goal || goalDescription || interests.length > 0) && (
                    <span className="block mt-2 text-sm text-primary">
                      ✓ We've loaded your existing information
                    </span>
                  )}
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`p-6 rounded-xl border-2 transition-all duration-200 text-left group ${
                      goal === g.id
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/50 hover:bg-accent/50"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                        goal === g.id ? "bg-gradient-hero" : "bg-muted group-hover:bg-primary/10"
                      }`}
                    >
                      <g.icon
                        className={`w-6 h-6 ${
                          goal === g.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{g.label}</h3>
                    <p className="text-sm text-muted-foreground">{g.description}</p>
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="goalDescription" className="text-foreground">Describe your goal in your own words</Label>
                <Textarea
                  id="goalDescription"
                  placeholder="Tell us more about what you want to achieve..."
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">What are you interested in?</h2>
                <p className="text-muted-foreground">
                  Help us understand your passions and interests
                  {(interests.length > 0 || hobbies || activities) && (
                    <span className="block mt-2 text-sm text-primary">
                      ✓ We've loaded your existing information
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-foreground">Interests</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                  />
                  <Button type="button" onClick={addInterest} variant="outline">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="px-3 py-1.5 text-sm">
                      {interest}
                      <button onClick={() => removeInterest(interest)} className="ml-2">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hobbies" className="text-foreground">Hobbies</Label>
                <Input
                  id="hobbies"
                  placeholder="What do you do in your free time?"
                  value={hobbies}
                  onChange={(e) => setHobbies(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="activities" className="text-foreground">Activities you enjoy</Label>
                <Textarea
                  id="activities"
                  placeholder="Describe activities that make you feel engaged and fulfilled..."
                  value={activities}
                  onChange={(e) => setActivities(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">Your Background</h2>
                <p className="text-muted-foreground">
                  Tell us about your education and experience
                  {(education.degree || education.field || education.institution || experiences.length > 0 || certifications.length > 0) && (
                    <span className="block mt-2 text-sm text-primary">
                      ✓ We've loaded your existing information
                    </span>
                  )}
                </p>
              </div>

              {/* Resume Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload Resume
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/30 border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleResumeUpload}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                  />
                  
                  {!resumeFileName && !isUploadingResume && (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Upload your resume</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We'll automatically extract your education, experience, and skills
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        Choose File
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3">
                        Supports PDF, DOC, DOCX, and TXT files
                      </p>
                    </div>
                  )}

                  {isUploadingResume && (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Parsing your resume...</h3>
                      <p className="text-sm text-muted-foreground">
                        {resumeFileName}
                      </p>
                    </div>
                  )}

                  {resumeFileName && !isUploadingResume && resumeParsed && (
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">Resume uploaded successfully!</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {resumeFileName}
                      </p>
                      <div className="flex flex-col gap-3 items-center">
                        <Button
                          type="button"
                          variant="hero"
                          onClick={() => navigate('/sigma')}
                          className="gap-2"
                        >
                          <Rocket className="w-4 h-4" />
                          Start Career Analysis
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setResumeFileName(null);
                            setResumeParsed(false);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Upload a different resume
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Education */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Education
                </div>
                <div className="grid md:grid-cols-2 gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="space-y-2">
                    <Label className="text-foreground">Degree</Label>
                    <Input
                      placeholder="e.g., Bachelor's, Master's"
                      value={education.degree}
                      onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Field of Study</Label>
                    <Input
                      placeholder="e.g., Computer Science"
                      value={education.field}
                      onChange={(e) => setEducation({ ...education, field: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Year</Label>
                    <Input
                      placeholder="e.g., 2023"
                      value={education.year}
                      onChange={(e) => setEducation({ ...education, year: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Institution</Label>
                    <Input
                      placeholder="e.g., MIT"
                      value={education.institution}
                      onChange={(e) => setEducation({ ...education, institution: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Briefcase className="w-5 h-5 text-primary" />
                    Experience
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {experiences.map((exp, index) => (
                  <div key={index} className="p-4 rounded-xl bg-muted/50 border border-border space-y-4 relative">
                    <button
                      onClick={() => removeExperience(index)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Company</Label>
                        <Input
                          placeholder="Company name"
                          value={exp.company}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Role</Label>
                        <Input
                          placeholder="Your role"
                          value={exp.role}
                          onChange={(e) => updateExperience(index, "role", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-foreground">Skills (comma separated)</Label>
                        <Input
                          placeholder="e.g., JavaScript, React, Node.js"
                          value={exp.skills}
                          onChange={(e) => updateExperience(index, "skills", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Start Year</Label>
                        <Input
                          placeholder="e.g., 2020"
                          value={exp.startYear}
                          onChange={(e) => updateExperience(index, "startYear", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">End Year</Label>
                        <Input
                          placeholder="e.g., 2023 or Present"
                          value={exp.endYear}
                          onChange={(e) => updateExperience(index, "endYear", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {experiences.length === 0 && (
                  <div className="p-6 rounded-xl border-2 border-dashed border-border text-center text-muted-foreground">
                    No experience added yet. Click "Add" to include your work history.
                  </div>
                )}
              </div>

              {/* Certifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Award className="w-5 h-5 text-primary" />
                    Certifications & Awards
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addCertification}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                {certifications.map((cert, index) => (
                  <div key={index} className="p-4 rounded-xl bg-muted/50 border border-border relative">
                    <button
                      onClick={() => removeCertification(index)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Title</Label>
                        <Input
                          placeholder="Certificate name"
                          value={cert.title}
                          onChange={(e) => updateCertification(index, "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Issuer</Label>
                        <Input
                          placeholder="Issuing organization"
                          value={cert.issuer}
                          onChange={(e) => updateCertification(index, "issuer", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Year</Label>
                        <Input
                          placeholder="e.g., 2023"
                          value={cert.year}
                          onChange={(e) => updateCertification(index, "year", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {certifications.length === 0 && (
                  <div className="p-6 rounded-xl border-2 border-dashed border-border text-center text-muted-foreground">
                    No certifications added yet. Click "Add" to include your achievements.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button variant="hero" onClick={handleContinue} className="gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {step === 3 ? "Continue to AI Advisor" : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;
