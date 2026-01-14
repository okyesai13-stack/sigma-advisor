import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Edit3, Plus } from "lucide-react";

interface PortfolioSectionProps {
  title: string;
  icon: ReactNode;
  isEditing: boolean;
  onAdd?: () => void;
  children: ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export default function PortfolioSection({
  title,
  icon,
  isEditing,
  onAdd,
  children,
  isEmpty,
  emptyMessage = "No items added yet",
}: PortfolioSectionProps) {
  return (
    <div className="bg-card border border-border rounded-xl sm:rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{title}</h2>
        </div>
        {isEditing && onAdd && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        )}
      </div>
      <div className="p-3 sm:p-4">
        {isEmpty ? (
          <p className="text-muted-foreground text-xs sm:text-sm text-center py-4 sm:py-6">
            {emptyMessage}
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
