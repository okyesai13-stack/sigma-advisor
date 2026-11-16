import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowUpRight, FolderOpen, Map, Sparkles } from "lucide-react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { PageHeader, LoadingState, EmptyState, StatusBadge } from "@/components/workspace/WorkspacePrimitives";
import TaskList from "@/components/workspace/TaskList";
import Seo from "@/components/Seo";
const tabs = ["overview", "board", "list", "timeline", "milestones", "files", "activity", "settings"];
export default function ProjectPage() {
  const { projectId, view = "overview" } = useParams();
  const { projects, loading, error, reload, activity } = useWorkspace();
  const { setBusiness } = useResume();
  const p = projects.find((project) => project.id === projectId);
  useEffect(() => { if (p) setBusiness(p); }, [p, setBusiness]);
  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="Project could not load" description={error} action={<Button onClick={() => void reload()}>Try again</Button>} />;
  if (!p) return <EmptyState title="Project unavailable" description="This project is unavailable or you do not have access." action={<Button asChild><Link to="/projects">Back to projects</Link></Button>} />;
  if (!tabs.includes(view)) return <EmptyState title="View not found" action={<Button asChild><Link to={`/projects/${p.id}/overview`}>Project overview</Link></Button>} />;
  return <div className="mx-auto max-w-7xl p-5 md:p-8"><Seo title={`${p.business_name} · ${view} — Planz`} description="Project execution workspace." path={`/projects/${p.id}/${view}`} noindex /><PageHeader title={p.business_name} description={p.pitch} actions={<StatusBadge status={p.status} />} /><nav className="mb-7 flex gap-1 overflow-x-auto border-b" aria-label="Project views">{tabs.map((tab) => <Button key={tab} asChild variant="ghost" className={view === tab ? "rounded-none border-b-2 border-primary text-primary" : "rounded-none text-muted-foreground"}><Link aria-current={view === tab ? "page" : undefined} to={`/projects/${p.id}/${tab}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Link></Button>)}</nav>
    {view === "overview" && <><div className="mb-7 grid gap-4 sm:grid-cols-3">{[{ label: "Tasks", value: p.tasks.length }, { label: "Milestones", value: p.phases.flatMap((phase) => phase.milestones).length }, { label: "Progress", value: p.progress === null ? "Not tracked" : `${p.progress}%` }].map((metric) => <div key={metric.label} className="rounded-lg border bg-card p-5"><p className="text-xs text-muted-foreground">{metric.label}</p><p className="mt-3 font-display text-2xl font-semibold">{metric.value}</p></div>)}</div><div className="mb-7 flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/analysis"><Sparkles />Strategy dossier<ArrowUpRight /></Link></Button><Button asChild variant="outline"><Link to={`/workspace/${p.id}`}><FolderOpen />Whiteboard</Link></Button><Button asChild variant="outline"><Link to={`/roadmap/${p.id}`}><Map />Startup roadmap</Link></Button><Button asChild variant="outline"><Link to={`/stress-test/${p.id}`}>Stress test</Link></Button></div><h2 className="mb-3 font-display text-lg font-semibold">Project tasks</h2><div className="rounded-lg border bg-card"><TaskList tasks={p.tasks} /></div></>}
    {view === "list" && <div className="rounded-lg border bg-card"><TaskList tasks={p.tasks} /></div>}
    {view === "board" && <EmptyState title="Startup whiteboard" description={`${p.tasks.length} saved tasks · your existing notes, sections and connections`} action={<Button asChild><Link to={`/workspace/${p.id}`}>Open whiteboard<ArrowUpRight /></Link></Button>} />}
    {(view === "timeline" || view === "milestones") && <><Button asChild variant="outline" className="mb-5"><Link to={`/roadmap/${p.id}`}>Edit startup roadmap<ArrowUpRight /></Link></Button>{!p.phases.length ? <EmptyState title="No roadmap on file" action={<Button asChild><Link to={`/roadmap/${p.id}`}>Plan your milestones</Link></Button>} /> : <div className="space-y-5">{p.phases.map((phase) => <section key={phase.id} className="border-l-2 border-primary pl-5"><p className="text-xs text-muted-foreground">{phase.weeks || "Unscheduled"}</p><h2 className="mt-1 font-display text-lg font-semibold">{phase.title}</h2><p className="mt-1 text-sm text-muted-foreground">{phase.goal}</p><ul className="mt-3 space-y-2">{phase.milestones.map((m) => <li key={m.id} className="flex items-center justify-between gap-4 border-b py-2 text-sm"><span>{m.text}</span><StatusBadge status={m.done ? "done" : "todo"} /></li>)}</ul></section>)}</div>}</>}
    {view === "files" && <EmptyState title="No project file library yet" description="Existing pitch decks are still available from the strategy dossier." action={<Button asChild variant="outline"><Link to="/analysis">Open strategy dossier</Link></Button>} />}
    {view === "activity" && <div className="divide-y rounded-lg border bg-card">{activity.filter((a) => a.projectId === p.id).map((a) => <div key={a.id} className="p-5"><p className="text-sm font-medium">{a.title}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(a.date).toLocaleString()}</p></div>)}</div>}
    {view === "settings" && <div className="space-y-4"><h2 className="font-display text-lg font-semibold">Project brief</h2><p className="text-sm text-muted-foreground">{p.industry || "No industry"} · {p.stage} · {p.geography || "No geography"}</p><Button asChild variant="outline"><Link to={`/setup?edit=${p.id}`}>Update brief & re-run analysis</Link></Button></div>}
  </div>;
}