import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowLeft,
  Upload,
  FileText,
  Loader2,
  Sparkles,
  Target,
  Rocket,
  Camera,
  Image,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useResume } from "@/contexts/ResumeContext";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Set up PDF.js worker
const pdfjsVersion = pdfjsLib.version || "4.10.38";
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

const SetupNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setResumeId, setGoal, goal, challenge, setChallenge, userType, setUserType } = useResume();

  const [step, setStep] = useState<'goal' | 'resume'>('goal');
  const [goalText, setGoalText] = useState(goal || '');
  const [challengeText, setChallengeText] = useState(challenge || '');
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'file' | 'image'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleGoalSubmit = () => {
    if (!goalText.trim()) {
      toast({
        title: "Goal Required",
        description: "Please enter your career goal to continue",
        variant: "destructive",
      });
      return;
    }
    setGoal(goalText.trim());
    if (challengeText.trim()) {
      setChallenge(challengeText.trim());
    }
    setStep('resume');
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setIsUploading(true);
    setFileName(file.name);

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

      // Remove null bytes
      resumeText = resumeText.replace(/\u0000/g, '').trim();

      if (!resumeText) {
        toast({
          title: "Could not read resume",
          description: "We couldn't extract text from that file. Try a different format.",
          variant: "destructive",
        });
        setIsUploading(false);
        return;
      }

      // Upload to backend
      const response = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/upload-resume`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText: resumeText.slice(0, 20000),
            fileName: file.name,
            goal: goalText,
            challenge: challengeText || null,
            userType: userType,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to process resume');
      }

      // Store resume_id in context
      setResumeId(result.resume_id);

      toast({
        title: "Resume Uploaded!",
        description: "Redirecting to AI career analysis...",
      });

      // Navigate to sigma page
      setTimeout(() => {
        navigate('/sigma');
      }, 500);

    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload resume';
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, or WEBP image",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const imageBase64 = await base64Promise;

      // Call the resume-image-parse edge function
      const response = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/resume-image-parse`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64,
            fileName: file.name,
            goal: goalText,
            challenge: challengeText || null,
            userType: userType,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to parse resume image');
      }

      // Store resume_id in context
      setResumeId(result.resume_id);

      toast({
        title: "Resume Image Parsed!",
        description: "AI successfully extracted your resume data. Redirecting...",
      });

      // Navigate to sigma page
      setTimeout(() => {
        navigate('/sigma');
      }, 500);

    } catch (error: unknown) {
      console.error('Image upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse resume image';
      toast({
        title: "Parsing failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Sigma Advisor
            </span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 max-w-2xl">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className={`flex items-center gap-2 ${step === 'goal' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'goal' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              1
            </div>
            <span className="font-medium">Set Goal</span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className={`flex items-center gap-2 ${step === 'resume' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'resume' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              2
            </div>
            <span className="font-medium">Upload Resume</span>
          </div>
        </div>

        {step === 'goal' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <Target className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-3xl font-bold text-foreground">What's Your Career Goal?</h1>
              <p className="text-muted-foreground">
                Tell us your dream role and we'll create a personalized roadmap
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="goal">🎯 Your Ultimate Career Goal</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Become a Senior Data Scientist at a top tech company, Lead AI/ML engineering team, Start my own SaaS company..."
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  className="min-h-[100px] text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="challenge">⚡ What Challenge Are You Facing? <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="challenge"
                  placeholder="e.g., I'm stuck in my current role with no growth path, I don't know which skills to learn next, I'm struggling to transition from backend to AI/ML, I lack guidance on how to get promoted..."
                  value={challengeText}
                  onChange={(e) => setChallengeText(e.target.value)}
                  className="min-h-[100px] text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>I am a</Label>
                <div className="flex gap-2">
                  {['student', 'professional'].map((type) => (
                    <Button
                      key={type}
                      variant={userType === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setUserType(type)}
                      className="flex-1 capitalize"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleGoalSubmit} 
              className="w-full h-12 text-lg"
              disabled={!goalText.trim()}
            >
              Continue to Resume Upload
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {step === 'resume' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <Rocket className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-3xl font-bold text-foreground">Upload Your Resume</h1>
              <p className="text-muted-foreground">
                We'll analyze your experience and create a personalized career plan
              </p>
            </div>

            <div className="p-1 rounded-lg bg-muted/50">
              <p className="text-sm text-center text-muted-foreground py-2">
              <strong>Your Goal:</strong> {goalText}
              {challengeText && <><br /><strong>Challenge:</strong> {challengeText}</>}
              </p>
            </div>

            {/* Upload Mode Toggle */}
            <Tabs value={uploadMode} onValueChange={(v) => setUploadMode(v as 'file' | 'image')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="image" className="gap-2">
                  <Camera className="w-4 h-4" />
                  Photo/Screenshot
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleResumeUpload}
                  className="hidden"
                />

                <div 
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                    transition-all duration-200
                    ${isUploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-primary/5'}
                  `}
                >
                  {isUploading ? (
                    <div className="space-y-4">
                      <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                      <p className="text-lg font-medium">Processing {fileName}...</p>
                      <p className="text-sm text-muted-foreground">Extracting your information with AI</p>
                    </div>
                  ) : fileName && uploadMode === 'file' ? (
                    <div className="space-y-4">
                      <FileText className="w-12 h-12 text-primary mx-auto" />
                      <p className="text-lg font-medium">{fileName}</p>
                      <p className="text-sm text-muted-foreground">Click to upload a different file</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-lg font-medium">Drop your resume here</p>
                      <p className="text-sm text-muted-foreground">or click to browse (PDF, DOCX, TXT)</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="image" className="mt-4">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <div 
                  onClick={() => !isUploading && imageInputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
                    transition-all duration-200
                    ${isUploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-primary/5'}
                  `}
                >
                  {isUploading ? (
                    <div className="space-y-4">
                      <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                      <p className="text-lg font-medium">Analyzing image with AI Vision...</p>
                      <p className="text-sm text-muted-foreground">Gemini is extracting text from your resume</p>
                    </div>
                  ) : fileName && uploadMode === 'image' ? (
                    <div className="space-y-4">
                      <Image className="w-12 h-12 text-primary mx-auto" />
                      <p className="text-lg font-medium">{fileName}</p>
                      <p className="text-sm text-muted-foreground">Click to upload a different image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
                      <p className="text-lg font-medium">Take a photo or upload an image</p>
                      <p className="text-sm text-muted-foreground">
                        AI Vision will extract text from your resume image
                      </p>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Sparkles className="w-3 h-3" />
                        <span>Powered by Gemini 3 Vision</span>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              variant="outline" 
              onClick={() => setStep('goal')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Goal
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SetupNoAuth;
