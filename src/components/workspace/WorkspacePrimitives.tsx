import type { ReactNode } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-3xl font-semibold">{title}</h1>{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}</div>{actions && <div className="flex flex-wrap gap-2">{actions}</div>}</div>;
}
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="flex min-h-44 flex-col items-center justify-center gap-3 px-6 py-8 text-center"><Inbox className="h-7 w-7 text-muted-foreground" /><p className="font-medium">{title}</p>{description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}{action}</div>;
}
export function LoadingState() { return <div className="grid min-h-64 place-items-center" role="status"><Loader2 className="h-6 w-6 animate-spin text-primary" /><span className="sr-only">Loading workspace</span></div>; }
export function StatusBadge({ status }: { status: string }) {
  return <Badge variant="secondary" className={cn("rounded-md font-normal", (status === "Completed" || status === "done") && "bg-success/10 text-success", (status === "Active" || status === "doing") && "bg-primary/10 text-primary")}>{status === "todo" ? "To do" : status === "doing" ? "In progress" : status === "done" ? "Done" : status}</Badge>;
}