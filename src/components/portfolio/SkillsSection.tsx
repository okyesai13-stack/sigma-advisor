import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Plus, X } from "lucide-react";
import PortfolioSection from "./PortfolioSection";

interface SkillsSectionProps {
  interests: string[];
  hobbies: string[];
  activities: string[];
  isEditing: boolean;
  onUpdate: (data: { interests: string[]; hobbies: string[]; activities: string[] }) => void;
}

export default function SkillsSection({
  interests,
  hobbies,
  activities,
  isEditing,
  onUpdate,
}: SkillsSectionProps) {
  const [newInterest, setNewInterest] = useState("");
  const [newHobby, setNewHobby] = useState("");
  const [newActivity, setNewActivity] = useState("");

  const addItem = (type: "interests" | "hobbies" | "activities", value: string) => {
    if (!value.trim()) return;
    const current = type === "interests" ? interests : type === "hobbies" ? hobbies : activities;
    if (!current.includes(value.trim())) {
      onUpdate({
        interests: type === "interests" ? [...interests, value.trim()] : interests,
        hobbies: type === "hobbies" ? [...hobbies, value.trim()] : hobbies,
        activities: type === "activities" ? [...activities, value.trim()] : activities,
      });
    }
    if (type === "interests") setNewInterest("");
    else if (type === "hobbies") setNewHobby("");
    else setNewActivity("");
  };

  const removeItem = (type: "interests" | "hobbies" | "activities", value: string) => {
    onUpdate({
      interests: type === "interests" ? interests.filter((i) => i !== value) : interests,
      hobbies: type === "hobbies" ? hobbies.filter((h) => h !== value) : hobbies,
      activities: type === "activities" ? activities.filter((a) => a !== value) : activities,
    });
  };

  const allSkills = [...interests, ...hobbies, ...activities];

  return (
    <PortfolioSection
      title="Skills & Interests"
      icon={<Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />}
      isEditing={isEditing}
      isEmpty={allSkills.length === 0 && !isEditing}
      emptyMessage="No skills or interests added yet"
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Interests */}
        <div>
          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">Interests</h4>
          {isEditing && (
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add interest..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("interests", newInterest);
                  }
                }}
                className="text-sm h-8"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addItem("interests", newInterest)}
                className="h-8 w-8 p-0 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {interests.length > 0 ? (
              interests.map((interest) => (
                <Badge
                  key={interest}
                  variant="secondary"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1"
                >
                  {interest}
                  {isEditing && (
                    <button
                      onClick={() => removeItem("interests", interest)}
                      className="ml-1.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">No interests added</span>
            )}
          </div>
        </div>

        {/* Hobbies */}
        <div>
          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">Hobbies</h4>
          {isEditing && (
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add hobby..."
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("hobbies", newHobby);
                  }
                }}
                className="text-sm h-8"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addItem("hobbies", newHobby)}
                className="h-8 w-8 p-0 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {hobbies.length > 0 ? (
              hobbies.map((hobby) => (
                <Badge
                  key={hobby}
                  variant="outline"
                  className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1"
                >
                  {hobby}
                  {isEditing && (
                    <button
                      onClick={() => removeItem("hobbies", hobby)}
                      className="ml-1.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">No hobbies added</span>
            )}
          </div>
        </div>

        {/* Activities */}
        <div>
          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2">Activities</h4>
          {isEditing && (
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add activity..."
                value={newActivity}
                onChange={(e) => setNewActivity(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addItem("activities", newActivity);
                  }
                }}
                className="text-sm h-8"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => addItem("activities", newActivity)}
                className="h-8 w-8 p-0 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <Badge
                  key={activity}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 bg-accent text-accent-foreground border-0"
                >
                  {activity}
                  {isEditing && (
                    <button
                      onClick={() => removeItem("activities", activity)}
                      className="ml-1.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground text-xs">No activities added</span>
            )}
          </div>
        </div>
      </div>
    </PortfolioSection>
  );
}
