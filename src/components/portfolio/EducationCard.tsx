import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, Calendar, Edit3, Trash2, Save, X } from "lucide-react";

interface Education {
  id: string;
  degree: string | null;
  field: string | null;
  institution: string | null;
  graduation_year: number | null;
}

interface EducationCardProps {
  education: Education;
  isEditing: boolean;
  onUpdate: (id: string, data: Partial<Education>) => void;
  onDelete: (id: string) => void;
}

export default function EducationCard({
  education,
  isEditing,
  onUpdate,
  onDelete,
}: EducationCardProps) {
  const [isCardEditing, setIsCardEditing] = useState(false);
  const [formData, setFormData] = useState({
    degree: education.degree || "",
    field: education.field || "",
    institution: education.institution || "",
    graduation_year: education.graduation_year?.toString() || "",
  });

  const handleSave = () => {
    onUpdate(education.id, {
      degree: formData.degree || null,
      field: formData.field || null,
      institution: formData.institution || null,
      graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
    });
    setIsCardEditing(false);
  };

  if (isCardEditing) {
    return (
      <div className="p-3 sm:p-4 border border-primary/20 rounded-xl bg-primary/5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Degree (e.g., Bachelor's)"
            value={formData.degree}
            onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="Field of Study"
            value={formData.field}
            onChange={(e) => setFormData({ ...formData, field: e.target.value })}
            className="text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Institution"
            value={formData.institution}
            onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="Graduation Year"
            value={formData.graduation_year}
            onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
            className="text-sm"
          />
        </div>
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
            onClick={() => onDelete(education.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
            {education.degree || "Degree not specified"}
            {education.field && ` in ${education.field}`}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 truncate">
            {education.institution || "Institution not specified"}
          </p>
          {education.graduation_year && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Class of {education.graduation_year}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
