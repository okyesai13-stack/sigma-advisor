import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  ArrowLeft,
  Save,
  Plus,
  X,
  Edit3,
  GraduationCap,
  Briefcase,
  Award,
  Target,
  Heart,
  Loader2,
  Calendar,
  Building,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  goal_type: string;
  goal_description: string;
  interests: string[];
  activities: string[];
  hobbies: string[];
}

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);

  const [profile, setProfile] = useState<UserProfile>({
    goal_type: "",
    goal_description: "",
    interests: [],
    activities: [],
    hobbies: [],
  });

  const [educations, setEducations] = useState<any[]>([]);
  const [experiences, setExperiences] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      const { data: profileData } = await supabase
        .from('users_profile')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        setProfile({
          goal_type: profileData.goal_type || "",
          goal_description: profileData.goal_description || "",
          interests: profileData.interests || [],
          activities: profileData.activities || [],
          hobbies: profileData.hobbies || [],
        });
      }

      const { data: educationData } = await supabase
        .from('education_details')
        .select('*')
        .eq('user_id', user.id)
        .order('graduation_year', { ascending: false });

      if (educationData) {
        setEducations(educationData);
      }

      const { data: experienceData } = await supabase
        .from('experience_details')
        .select('*')
        .eq('user_id', user.id)
        .order('start_year', { ascending: false });

      if (experienceData) {
        setExperiences(experienceData);
      }

      const { data: certificationData } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('year', { ascending: false });

      if (certificationData) {
        setCertifications(certificationData);
      }

    } catch (error) {
      console.error('Error loading profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('users_profile')
        .upsert({
          id: user.id,
          goal_type: profile.goal_type,
          goal_description: profile.goal_description,
          interests: profile.interests,
          activities: profile.activities,
          hobbies: profile.hobbies,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setEditMode(null);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addInterest = () => {
    if (newInterest.trim() && !profile.interests.includes(newInterest.trim())) {
      setProfile({
        ...profile,
        interests: [...profile.interests, newInterest.trim()]
      });
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setProfile({
      ...profile,
      interests: profile.interests.filter(i => i !== interest)
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Loading your profile...</h3>
              <p className="text-sm text-muted-foreground">Retrieving your information</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate("/advisor")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Advisor
          </button>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Profile</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-card border border-border rounded-2xl p-8 mb-8 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center">
              <User className="w-10 h-10 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {user?.email?.split('@')[0] || 'User'}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{user?.email}</span>
              </div>
              {profile.goal_type && (
                <div className="flex items-center gap-2 mt-2">
                  <Target className="w-4 h-4 text-primary" />
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {profile.goal_type}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="background">Background</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Goals & Objectives
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(editMode === 'goals' ? null : 'goals')}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode === 'goals' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Goal Type</Label>
                      <Input
                        value={profile.goal_type}
                        onChange={(e) => setProfile({ ...profile, goal_type: e.target.value })}
                        placeholder="e.g., Find a Job, Learn Skills, Start Business"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Goal Description</Label>
                      <Textarea
                        value={profile.goal_description}
                        onChange={(e) => setProfile({ ...profile, goal_description: e.target.value })}
                        placeholder="Describe your career goals and aspirations..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveProfile} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Current Goal</h4>
                      <p className="text-muted-foreground">
                        {profile.goal_type || "No goal set"}
                      </p>
                    </div>
                    {profile.goal_description && (
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Description</h4>
                        <p className="text-muted-foreground">
                          {profile.goal_description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Interests
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditMode(editMode === 'interests' ? null : 'interests')}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                {editMode === 'interests' ? (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add an interest..."
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addInterest();
                          }
                        }}
                      />
                      <Button type="button" onClick={addInterest}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary" className="px-3 py-1.5">
                          {interest}
                          <button onClick={() => removeInterest(interest)} className="ml-2">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveProfile} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditMode(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.length > 0 ? (
                      profile.interests.map((interest) => (
                        <Badge key={interest} variant="secondary">
                          {interest}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No interests added yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="background" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  Education & Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-4">Education</h4>
                  {educations.length > 0 ? (
                    <div className="space-y-3">
                      {educations.map((education) => (
                        <div key={education.id} className="p-4 border border-border rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <GraduationCap className="w-4 h-4 text-primary" />
                            <h5 className="font-semibold text-foreground">{education.degree}</h5>
                          </div>
                          <p className="text-muted-foreground mb-1">{education.institution}</p>
                          {education.field && (
                            <p className="text-sm text-muted-foreground mb-2">{education.field}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{education.graduation_year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No education records found</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-4">Work Experience</h4>
                  {experiences.length > 0 ? (
                    <div className="space-y-3">
                      {experiences.map((experience) => (
                        <div key={experience.id} className="p-4 border border-border rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Briefcase className="w-4 h-4 text-primary" />
                            <h5 className="font-semibold text-foreground">{experience.role}</h5>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Building className="w-4 h-4 text-muted-foreground" />
                            <p className="text-muted-foreground">{experience.company}</p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {experience.start_year} - {experience.end_year || 'Present'}
                            </span>
                          </div>
                          {experience.skills && experience.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {experience.skills.map((skill: string) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No work experience found</p>
                  )}
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-4">Certifications</h4>
                  {certifications.length > 0 ? (
                    <div className="space-y-3">
                      {certifications.map((certification) => (
                        <div key={certification.id} className="p-4 border border-border rounded-xl bg-muted/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-primary" />
                            <h5 className="font-semibold text-foreground">{certification.title}</h5>
                          </div>
                          <p className="text-muted-foreground mb-2">{certification.issuer}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{certification.year}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No certifications found</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;