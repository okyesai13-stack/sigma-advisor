import { Link } from "react-router-dom";
import { ArrowRight, CheckCheck, Clock3, FolderKanban, ListTodo, Plus, Sparkles, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Button } from "@/components/ui/button";
import { assignedToMe, isOverdue, localDay } from "@/lib/workspace";
import { EmptyState, LoadingState, PageHeader } from "@/components/workspace/WorkspacePrimitives";
import ProjectList from "@/components/workspace/ProjectList";
import TaskList from "@/components/workspace/TaskList";
import Seo from "@/components/Seo";

export default function OverviewPage() {
  const { user } = useAuth();
  const { projects, tasks, loading, error, reload, activity, risks } = useWorkspace();
  const name = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const today = localDay();
  const overdue = tasks.filter((t) => isOverdue(t, today));
  const myTasks = tasks.filter((t) => assignedToMe(t, { id: user?.id || "", email: user?.email, name: user?.user_metadata?.full_name }));
  const upcoming = tasks.filter((t) => t.status !== "done" && t.due >= today).sort((a, b) => a.due.localeCompare(b.due));
  const milestones = projects.flatMap((p) => p.phases.flatMap((phase) => phase.milestones.filter((m) => !m.done).map((m) => ({ ...m, projectId: p.id, projectName: p.business_name, weeks: phase.weeks }))));
  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="Workspace could not load" description={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  const metrics = [
    { title: "Total projects", value: projects.length, icon: FolderKanban },
    { title: "Active projects", value: projects.filter((p) => p.status === "Active").length, icon: Activity },
    { title: "Total tasks", value: tasks.length, icon: ListTodo },
    { title: "Completed tasks", value: tasks.filter((t) => t.status === "done").length, icon: CheckCheck },
    { title: "Overdue tasks", value: overdue.length, icon: Clock3 },
  ];
  return <div className="mx-auto max-w-7xl space-y-7 p-5 md:p-8">
    <Seo title="Overview — Planz" description="Your projects, assigned tasks, milestones and workspace progress." path="/dashboard" noindex />
    <PageHeader title={`Welcome back, ${name}`} description="Personal workspace" actions={<><Button asChild variant="outline"><Link to="/my-tasks?create=1"><Plus />Create task</Link></Button><Button asChild><Link to="/setup"><Plus />Create project</Link></Button></>} />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{metrics.map((m) => <div key={m.title} className="rounded-lg border bg-card p-4 shadow-sm"><div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-muted-foreground">{m.title}</p><m.icon className="h-4 w-4 text-muted-foreground" /></div><p className="mt-4 font-display text-3xl font-semibold tabular-nums">{m.value}</p></div>)}</div>
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm"><div className="flex items-center justify-between px-5 py-4"><h2 className="font-display text-lg font-semibold">Project overview</h2><Button asChild variant="ghost" size="sm"><Link to="/projects">All projects<ArrowRight /></Link></Button></div><ProjectList projects={projects.filter((p) => p.status !== "Completed").slice(0, 5)} /></section>
    <div className="grid items-start gap-6 xl:grid-cols-[1.4fr_1fr]"><section className="overflow-hidden rounded-lg border bg-card shadow-sm"><div className="flex items-center justify-between px-5 py-4"><h2 className="font-display text-lg font-semibold">My tasks</h2><Button asChild variant="ghost" size="sm"><Link to="/my-tasks">View all<ArrowRight /></Link></Button></div><TaskList tasks={myTasks.slice(0, 5)} empty="No tasks assigned to you yet" /></section><section className="rounded-lg border bg-card shadow-sm"><h2 className="px-5 py-4 font-display text-lg font-semibold">Upcoming deadlines</h2>{!upcoming.length && !milestones.length ? <EmptyState title="Nothing coming due" description="Scheduled tasks and saved milestones will appear here." /> : <div className="divide-y">{upcoming.slice(0, 3).map((t) => <Link key={`${t.projectId}-${t.id}`} to={`/workspace/${t.projectId}?tasks=1`} className="flex items-start gap-3 px-5 py-4 hover:bg-muted/40"><Clock3 className="mt-1 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="break-words text-sm font-medium">{t.text}</p><p className="mt-1 text-xs text-muted-foreground">{t.projectName} · {t.due}</p></div></Link>)}{milestones.slice(0, 2).map((m) => <Link key={`${m.projectId}-${m.id}`} to={`/projects/${m.projectId}/milestones`} className="block px-5 py-4 hover:bg-muted/40"><p className="text-sm font-medium">{m.text}</p><p className="mt-1 text-xs text-muted-foreground">{m.projectName} · {m.weeks || "No scheduled date"}</p></Link>)}</div>}</section></div>
    <div className="grid items-start gap-6 lg:grid-cols-2"><section className="rounded-lg border bg-card shadow-sm"><h2 className="px-5 py-4 font-display text-lg font-semibold">Recent activity</h2>{!activity.length ? <EmptyState title="A fresh start" description="Your latest project updates will appear here." /> : <div className="divide-y">{activity.slice(0, 5).map((a) => <Link key={a.id} to={`/projects/${a.projectId}/activity`} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40"><span className="h-2 w-2 shrink-0 rounded-full bg-primary/60" /><div className="min-w-0"><p className="truncate text-sm">{a.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(a.date).toLocaleString()}</p></div></Link>)}</div>}</section><section className="rounded-lg border bg-card shadow-sm"><div className="flex items-center gap-2 px-5 py-4"><Sparkles className="h-4 w-4 text-primary" /><h2 className="font-display text-lg font-semibold">Project insights</h2></div><div className="space-y-4 px-5 pb-5">{overdue.length > 0 && <Link to="/my-tasks" className="block rounded-md bg-destructive/5 p-3 text-sm text-destructive">{overdue.length} overdue {overdue.length === 1 ? "task needs" : "tasks need"} attention.</Link>}{risks.slice(0, 2).map((r) => <Link key={r.id} to={`/stress-test/${r.business_id}`} className="block border-l-2 border-primary pl-3"><p className="text-sm font-medium">{projects.find((p) => p.id === r.business_id)?.business_name} · {r.verdict || "Stress test"}</p><p className="mt-1 text-sm text-muted-foreground">{r.reason || "Open the saved stress test to review risks."}</p></Link>)}{!overdue.length && !risks.length && <p className="text-sm text-muted-foreground">No risk analysis on file yet.</p>}<Button asChild variant="outline" size="sm"><Link to="/ai-assistant"><Sparkles />Ask the AI assistant<ArrowRight /></Link></Button></div></section></div>
  </div>;
}