import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, Calendar, Edit3, Trash2, Save, X } from "lucide-react";

interface Certification {
  id: string;
  title: string | null;
  issuer: string | null;
  year: number | null;
}

interface CertificationCardProps {
  certification: Certification;
  isEditing: boolean;
  onUpdate: (id: string, data: Partial<Certification>) => void;
  onDelete: (id: string) => void;
}

export default function CertificationCard({
  certification,
  isEditing,
  onUpdate,
  onDelete,
}: CertificationCardProps) {
  const [isCardEditing, setIsCardEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: certification.title || "",
    issuer: certification.issuer || "",
    year: certification.year?.toString() || "",
  });

  const handleSave = () => {
    onUpdate(certification.id, {
      title: formData.title || null,
      issuer: formData.issuer || null,
      year: formData.year ? parseInt(formData.year) : null,
    });
    setIsCardEditing(false);
  };

  if (isCardEditing) {
    return (
      <div className="p-3 sm:p-4 border border-primary/20 rounded-xl bg-primary/5 space-y-3">
        <Input
          placeholder="Certification Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="text-sm"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            placeholder="Issuing Organization"
            value={formData.issuer}
            onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
            className="text-sm"
          />
          <Input
            placeholder="Year"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
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
            onClick={() => onDelete(certification.id)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
            {certification.title || "Certificate not specified"}
          </h3>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 truncate">
            {certification.issuer || "Issuer not specified"}
          </p>
          {certification.year && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-1">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>{certification.year}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
