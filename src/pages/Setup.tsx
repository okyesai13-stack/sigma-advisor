import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { 
  Target, BookOpen, Rocket, Check, ArrowRight, ArrowLeft, 
  Plus, X, GraduationCap, Briefcase, Award, LogOut 
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";

const Setup = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [step, setStep] = useState(1);
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
    company: string;
    role: string;
    skills: string;
    duration: string;
  }[]>([]);
  const [certifications, setCertifications] = useState<{
    title: string;
    issuer: string;
    year: string;
  }[]>([]);

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
    setExperiences([...experiences, { company: "", role: "", skills: "", duration: "" }]);
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

  const handleContinue = () => {
    if (step === 1 && !goal) {
      toast.error("Please select a goal");
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      toast.success("Profile setup complete!");
      navigate("/advisor");
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
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
                <p className="text-muted-foreground">Choose what you want to achieve with AI Career Advisor</p>
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
                <p className="text-muted-foreground">Help us understand your passions and interests</p>
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
                <p className="text-muted-foreground">Tell us about your education and experience</p>
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
                      <div className="space-y-2">
                        <Label className="text-foreground">Skills</Label>
                        <Input
                          placeholder="Skills used"
                          value={exp.skills}
                          onChange={(e) => updateExperience(index, "skills", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Duration</Label>
                        <Input
                          placeholder="e.g., 2 years"
                          value={exp.duration}
                          onChange={(e) => updateExperience(index, "duration", e.target.value)}
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
            <Button variant="hero" onClick={handleContinue} className="gap-2">
              {step === 3 ? "Continue to AI Advisor" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setup;
