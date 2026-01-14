import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Edit3,
  Save,
  X,
  Share2,
  Download,
  Check,
  Loader2,
} from "lucide-react";

interface PortfolioHeaderProps {
  user: any;
  profile: {
    goal_type: string;
    goal_description: string;
  };
  selectedCareer: string | null;
  isEditing: boolean;
  onEditToggle: () => void;
  onShare: () => void;
}

export default function PortfolioHeader({
  user,
  profile,
  selectedCareer,
  isEditing,
  onEditToggle,
  onShare,
}: PortfolioHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShare();
  };

  const displayName = user?.email?.split("@")[0] || "User";

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary/10 via-accent to-primary/5 border border-border">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          {/* Avatar */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shrink-0">
            <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary-foreground" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground capitalize truncate">
                {displayName}
              </h1>
              {selectedCareer && (
                <Badge className="w-fit bg-primary/15 text-primary border-0 text-xs sm:text-sm">
                  {selectedCareer}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground mb-3 sm:mb-4">
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="text-xs sm:text-sm truncate">{user?.email}</span>
            </div>

            {profile.goal_description && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-lg">
                {profile.goal_description}
              </p>
            )}

            {profile.goal_type && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                <Badge variant="outline" className="text-xs bg-background/50">
                  🎯 {profile.goal_type}
                </Badge>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex-1 sm:flex-initial gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </Button>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={onEditToggle}
              className="flex-1 sm:flex-initial gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9"
            >
              <Edit3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isEditing ? "Done" : "Edit"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
