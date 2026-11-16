import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { isOverdue, localDay, type WorkspaceTask } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { EmptyState, StatusBadge } from "./WorkspacePrimitives";
export default function TaskList({ tasks, empty = "No tasks to show" }: { tasks: WorkspaceTask[]; empty?: string }) {
  if (!tasks.length) return <EmptyState title={empty} description="Tasks from your project whiteboards appear here." />;
  return <div className="divide-y">{tasks.map((t) => <div key={`${t.projectId}-${t.id}`} className="flex flex-wrap items-center gap-3 px-5 py-4"><div className="min-w-0 flex-1 basis-40"><p className="break-words text-sm font-medium">{t.text || "Untitled task"}</p><p className="mt-1 text-xs text-muted-foreground">{t.projectName} · {t.owner || "Unassigned"}</p></div><span className="text-xs text-muted-foreground">Priority not set</span><span className={cn("text-xs", isOverdue(t, localDay()) ? "text-destructive" : "text-muted-foreground")}>{t.due ? new Date(`${t.due}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "No due date"}</span><StatusBadge status={t.status} /><Button asChild size="icon" variant="ghost"><Link to={`/workspace/${t.projectId}?tasks=1`} aria-label={`Edit task ${t.text || "Untitled task"}`}><ArrowUpRight /></Link></Button></div>)}</div>;
}