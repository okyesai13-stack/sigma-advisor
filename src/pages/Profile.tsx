import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  FileText,
  Home,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  PortfolioHeader,
  PortfolioSection,
  ExperienceCard,
  EducationCard,
  CertificationCard,
  SkillsSection,
} from "@/components/portfolio";

interface UserProfile {
  goal_type: string;
  goal_description: string;
  interests: string[];
  activities: string[];
  hobbies: string[];
}

interface Education {
  id: string;
  degree: string | null;
  field: string | null;
  institution: string | null;
  graduation_year: number | null;
}

interface Experience {
  id: string;
  company: string | null;
  role: string | null;
  skills: string[] | null;
  start_year: number | null;
  end_year: number | null;
}

interface Certification {
  id: string;
  title: string | null;
  issuer: string | null;
  year: number | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [profile, setProfile] = useState<UserProfile>({
    goal_type: "",
    goal_description: "",
    interests: [],
    activities: [],
    hobbies: [],
  });

  const [educations, setEducations] = useState<Education[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const [profileRes, educationRes, experienceRes, certificationRes, careerRes] =
        await Promise.all([
          supabase.from("users_profile").select("*").eq("id", user.id).single(),
          supabase
            .from("education_details")
            .select("*")
            .eq("user_id", user.id)
            .order("graduation_year", { ascending: false }),
          supabase
            .from("experience_details")
            .select("*")
            .eq("user_id", user.id)
            .order("start_year", { ascending: false }),
          supabase
            .from("certifications")
            .select("*")
            .eq("user_id", user.id)
            .order("year", { ascending: false }),
          supabase.from("selected_career").select("*").eq("user_id", user.id).single(),
        ]);

      if (profileRes.data) {
        setProfile({
          goal_type: profileRes.data.goal_type || "",
          goal_description: profileRes.data.goal_description || "",
          interests: profileRes.data.interests || [],
          activities: profileRes.data.activities || [],
          hobbies: profileRes.data.hobbies || [],
        });
      }

      if (educationRes.data) setEducations(educationRes.data);
      if (experienceRes.data) setExperiences(experienceRes.data);
      if (certificationRes.data) setCertifications(certificationRes.data);
      if (careerRes.data) setSelectedCareer(careerRes.data.career_title);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAllData = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Save profile
      await supabase.from("users_profile").upsert({
        id: user.id,
        goal_type: profile.goal_type,
        goal_description: profile.goal_description,
        interests: profile.interests,
        activities: profile.activities,
        hobbies: profile.hobbies,
        updated_at: new Date().toISOString(),
      });

      toast({
        title: "Saved",
        description: "Your portfolio has been updated.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Education CRUD
  const addEducation = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("education_details")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (data) setEducations([data, ...educations]);
  };

  const updateEducation = async (id: string, data: Partial<Education>) => {
    await supabase.from("education_details").update(data).eq("id", id);
    setEducations(educations.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  const deleteEducation = async (id: string) => {
    await supabase.from("education_details").delete().eq("id", id);
    setEducations(educations.filter((e) => e.id !== id));
  };

  // Experience CRUD
  const addExperience = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("experience_details")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (data) setExperiences([data, ...experiences]);
  };

  const updateExperience = async (id: string, data: Partial<Experience>) => {
    await supabase.from("experience_details").update(data).eq("id", id);
    setExperiences(experiences.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  const deleteExperience = async (id: string) => {
    await supabase.from("experience_details").delete().eq("id", id);
    setExperiences(experiences.filter((e) => e.id !== id));
  };

  // Certification CRUD
  const addCertification = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("certifications")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (data) setCertifications([data, ...certifications]);
  };

  const updateCertification = async (id: string, data: Partial<Certification>) => {
    await supabase.from("certifications").update(data).eq("id", id);
    setCertifications(certifications.map((c) => (c.id === id ? { ...c, ...data } : c)));
  };

  const deleteCertification = async (id: string) => {
    await supabase.from("certifications").delete().eq("id", id);
    setCertifications(certifications.filter((c) => c.id !== id));
  };

  // Skills update
  const updateSkills = async (data: {
    interests: string[];
    hobbies: string[];
    activities: string[];
  }) => {
    setProfile({ ...profile, ...data });
    if (user) {
      await supabase.from("users_profile").upsert({
        id: user.id,
        interests: data.interests,
        hobbies: data.hobbies,
        activities: data.activities,
        updated_at: new Date().toISOString(),
      });
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      saveAllData();
    }
    setIsEditing(!isEditing);
  };

  const handleShare = () => {
    toast({
      title: "Link copied!",
      description: "Share your portfolio with others.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg max-w-sm w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-foreground text-sm sm:text-base">Loading portfolio...</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Retrieving your information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 h-12 sm:h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 pl-12 md:pl-0">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs sm:text-sm">Back</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/resume")}
              className="gap-1.5 text-xs sm:text-sm h-8 px-2 sm:px-3"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Resume</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-1.5 text-xs sm:text-sm h-8 px-2 sm:px-3"
            >
              <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 max-w-4xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Portfolio Header */}
          <PortfolioHeader
            user={user}
            profile={profile}
            selectedCareer={selectedCareer}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onShare={handleShare}
          />

          {/* Two Column Layout on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Experience */}
              <PortfolioSection
                title="Experience"
                icon={<Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />}
                isEditing={isEditing}
                onAdd={addExperience}
                isEmpty={experiences.length === 0}
                emptyMessage="No work experience added yet"
              >
                <div className="space-y-3">
                  {experiences.map((exp) => (
                    <ExperienceCard
                      key={exp.id}
                      experience={exp}
                      isEditing={isEditing}
                      onUpdate={updateExperience}
                      onDelete={deleteExperience}
                    />
                  ))}
                </div>
              </PortfolioSection>

              {/* Certifications */}
              <PortfolioSection
                title="Certifications"
                icon={<Award className="w-4 h-4 sm:w-5 sm:h-5" />}
                isEditing={isEditing}
                onAdd={addCertification}
                isEmpty={certifications.length === 0}
                emptyMessage="No certifications added yet"
              >
                <div className="space-y-3">
                  {certifications.map((cert) => (
                    <CertificationCard
                      key={cert.id}
                      certification={cert}
                      isEditing={isEditing}
                      onUpdate={updateCertification}
                      onDelete={deleteCertification}
                    />
                  ))}
                </div>
              </PortfolioSection>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Education */}
              <PortfolioSection
                title="Education"
                icon={<GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />}
                isEditing={isEditing}
                onAdd={addEducation}
                isEmpty={educations.length === 0}
                emptyMessage="No education added yet"
              >
                <div className="space-y-3">
                  {educations.map((edu) => (
                    <EducationCard
                      key={edu.id}
                      education={edu}
                      isEditing={isEditing}
                      onUpdate={updateEducation}
                      onDelete={deleteEducation}
                    />
                  ))}
                </div>
              </PortfolioSection>

              {/* Skills & Interests */}
              <SkillsSection
                interests={profile.interests}
                hobbies={profile.hobbies}
                activities={profile.activities}
                isEditing={isEditing}
                onUpdate={updateSkills}
              />
            </div>
          </div>

          {/* Saving indicator */}
          {isSaving && (
            <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Saving...</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
