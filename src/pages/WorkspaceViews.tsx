import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Search, UserRound } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignedToMe, localDay } from "@/lib/workspace";
import ProjectList from "@/components/workspace/ProjectList";
import TaskList from "@/components/workspace/TaskList";
import { EmptyState, LoadingState, PageHeader } from "@/components/workspace/WorkspacePrimitives";
import { Progress } from "@/components/ui/progress";
import Seo from "@/components/Seo";
import { useProjectEngine } from '@/contexts/ProjectEngineContext';

export default function WorkspaceViews() {
  const { pathname, search } = useLocation();
   const engine = useProjectEngine();
   const { loading, error, reload } = engine;
   const projects = engine.projects.map(p => ({ ...p, business_name: p.name, pitch: p.description, phases: [], tasks: [], progress: null, industry: p.category, stage: p.status }));
   const tasks = engine.tasks.map(t => ({ id:t.id, text:t.title, owner:t.assignee_id || '', due:t.due_date || '', status: t.status === 'done' ? 'done' as const : t.status === 'doing' ? 'doing' as const : 'todo' as const, projectId:t.project_id, projectName:engine.projects.find(p=>p.id===t.project_id)?.name || 'Project' }));
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const title = pathname === "/projects" ? "Projects" : pathname === "/my-tasks" ? "My tasks" : pathname === "/calendar" ? "Calendar" : pathname === "/team" ? "Team" : "Reports";
  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="Could not load workspace" description={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  const mine = tasks.filter((t) => assignedToMe(t, { id: user?.id || "", email: user?.email, name: user?.user_metadata?.full_name }));
  const monthString = localDay(month).slice(0, 7);
  const scheduled = tasks.filter((t) => t.due.startsWith(monthString));
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  return <div className="mx-auto max-w-7xl p-5 md:p-8"><Seo title={`${title} — Planz`} description={`${title} in your Planz workspace.`} path={pathname} noindex /><PageHeader title={title} description={engine.workspaces.find(w=>w.id===engine.activeId)?.name} actions={pathname === "/projects" ? <Button asChild><Link to="/setup"><Plus />Create project</Link></Button> : undefined} />
    {pathname === "/calendar" && <><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-semibold">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2><div className="flex gap-1"><Button size="icon" variant="outline" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></Button><Button size="sm" variant="outline" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</Button><Button size="icon" variant="outline" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></Button></div></div><div className="overflow-x-auto rounded-lg border bg-card"><div className="grid min-w-[650px] grid-cols-7">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="border-b bg-muted/30 p-3 text-xs text-muted-foreground">{d}</div>)}{Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, i) => { const day = i - offset + 1; const valid = day > 0 && day <= days; const date = `${monthString}-${String(day).padStart(2, "0")}`; return <div key={i} className="min-h-28 border-b border-r p-2">{valid && <><span className={date === localDay() ? "grid h-6 w-6 place-items-center rounded-full bg-primary text-xs text-primary-foreground" : "text-xs text-muted-foreground"}>{day}</span>{scheduled.filter((t) => t.due === date).map((t) => <Link key={`${t.projectId}-${t.id}`} to={`/projects/${t.projectId}/list`} className="mt-2 block truncate rounded bg-primary/10 px-1.5 py-1 text-xs text-primary">{t.text || "Untitled task"}</Link>)}</>}</div>; })}</div></div>{!scheduled.length && <EmptyState title="No task deadlines this month" description="No scheduled tasks in this workspace." />}</>}
  </div>;
}
