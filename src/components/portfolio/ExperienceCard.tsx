import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, Building, Edit3, Trash2, Save, X } from "lucide-react";

interface Experience {
  id: string;
  company: string | null;
  role: string | null;
  skills: string[] | null;
  start_year: number | null;
  end_year: number | null;
}

interface ExperienceCardProps {
  experience: Experience;
  isEditing: boolean;
  onUpdate: (id: string, data: Partial<Experience>) => void;
  onDelete: (id: string) => void;
}

export default function ExperienceCard({
  experience,
  isEditing,
  onUpdate,
  onDelete,
}: ExperienceCardProps) {
  const [isCardEditing, setIsCardEditing] = useState(false);
  const [formData, setFormData] = useState({
    company: experience.company || "",
    role: experience.role || "",
    skills: experience.skills?.join(", ") || "",
    start_year: experience.start_year?.toString() || "",
    end_year: experience.end_year?.toString() || "",
  });

  const handleSave = () => {
    onUpdate(experience.id, {
      company: formData.company || null,
      role: formData.role || null,
      skills: formData.skills
        ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : null,
      start_year: formData.start_year ? parseInt(formData.start_year) : null,
      end_year: formData.end_year ? parseInt(formData.end_year) : null,
    });
    setIsCardEditing(false);
  };

  if (isCardEditing) {
    return (
      <div className="p-3 sm:p-4 border border-primary/20 rounded-xl bg-primary/5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Role/Position"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="Company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Start Year"
            value={formData.start_year}
            onChange={(e) => setFormData({ ...formData, start_year: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="End Year (or leave empty)"
            value={formData.end_year}
            onChange={(e) => setFormData({ ...formData, end_year: e.target.value })}
            className="text-sm"
          />
        </div>
        <Input
          placeholder="Skills (comma-separated)"
          value={formData.skills}
          onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          className="text-sm"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs h-8">
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsCardEditing(false)}
            className="gap-1.5 text-xs h-8"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative p-3 sm:p-4 border border-border rounded-xl hover:border-primary/30 hover:bg-accent/30 transition-all">
      {isEditing && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsCardEditing(true)}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(experience.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
            {experience.role || "Role not specified"}
          </h3>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs sm:text-sm mt-0.5">
            <Building className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{experience.company || "Company not specified"}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>
              {experience.start_year || "?"} - {experience.end_year || "Present"}
            </span>
          </div>
          {experience.skills && experience.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {experience.skills.slice(0, 5).map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                >
                  {skill}
                </Badge>
              ))}
              {experience.skills.length > 5 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                  +{experience.skills.length - 5}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
