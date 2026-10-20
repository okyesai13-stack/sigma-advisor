import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Map, Plus, RefreshCw, Trash2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { cn } from "@/lib/utils";
import { creditAwareError, notifyCreditsChanged } from "@/lib/credits";
import { currentPhaseId, progress, type Phase } from "@/lib/roadmap";

const uid = () => crypto.randomUUID();

const RoadmapPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(12);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const loaded = useRef(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: b }, { data: r }] = await Promise.all([
        supabase.from("business_store").select("business_name").eq("id", id).maybeSingle(),
        (supabase.from as any)("startup_roadmap").select("*").eq("business_id", id).maybeSingle(),
      ]);
      setName(b?.business_name || "");
      if (r) { setPhases(r.phases || []); setGoal(r.goal || ""); }
      setLoading(false);
      setTimeout(() => (loaded.current = true), 0);
    })();
  }, [id]);

  // Autosave edits (ticks, added/removed milestones).
  useEffect(() => {
    if (!loaded.current || !id || !phases.length) return;
    const t = setTimeout(() => {
      (supabase.from as any)("startup_roadmap").upsert({ business_id: id, goal, phases }, { onConflict: "business_id" }).then(({ error }: any) => {
        if (error) toast({ title: "Couldn't save roadmap", description: error.message, variant: "destructive" });
      });
    }, 600);
    return () => clearTimeout(t);
  }, [phases, goal, id, toast]);

  const build = async () => {
    if (!id || building) return;
    if (phases.length && !confirm("Building a new roadmap replaces the current one and its ticks. Continue?")) return;
    setBuilding(true);
    const { data, error } = await supabase.functions.invoke("startup-roadmap", { body: { business_id: id, goal, weeks } });
    setBuilding(false);
    notifyCreditsChanged();
    if (error || data?.error) return toast(creditAwareError(error || { message: data.error }, "Couldn't build roadmap"));
    loaded.current = false;
    setPhases(data.phases || []);
    setTimeout(() => (loaded.current = true), 0);
    toast({ title: "Roadmap ready", description: `${data.phases?.length || 0} phases planned.` });
  };

  const edit = (pid: string, fn: (p: Phase) => Phase) => setPhases((ps) => ps.map((p) => (p.id === pid ? fn(p) : p)));
  const addMilestone = (pid: string) => {
    const text = (drafts[pid] || "").trim();
    if (!text) return;
    edit(pid, (p) => ({ ...p, milestones: [...p.milestones, { id: uid(), text: text.slice(0, 200), done: false }] }));
    setDrafts((d) => ({ ...d, [pid]: "" }));
  };

  const pct = progress(phases);
  const current = currentPhaseId(phases);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-5 md:p-8 animate-fade-in">
      <Seo title={`Roadmap — ${name || "Planz"}`} description="Startup execution roadmap." path={`/roadmap/${id}`} noindex />
      <Button variant="ghost" size="sm" onClick={() => navigate("/workspace")}><ArrowLeft className="h-4 w-4" />Workspace</Button>
      <div>
        <p className="eyebrow">Startup roadmap</p>
        <h1 className="font-display text-3xl font-semibold">{name || "Your startup"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">A week-by-week plan from idea to launch, built from your agent results and stress test.</p>
      </div>

      <div className="panel-surface space-y-3 p-5">
        <label className="text-sm font-medium" htmlFor="goal">What do you want to reach?</label>
        <Input id="goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. 100 paying customers and a seed round" maxLength={300} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Timeline:</span>
          {[8, 12, 24].map((w) => <Button key={w} size="sm" variant={weeks === w ? "default" : "outline"} onClick={() => setWeeks(w)}>{w} weeks</Button>)}
          <Button className="ml-auto" onClick={build} disabled={building || loading}>
            {building ? <Loader2 className="animate-spin" /> : phases.length ? <RefreshCw /> : <Sparkles />}
            {phases.length ? "Rebuild roadmap" : "Build my roadmap"} · 3 credits
          </Button>
        </div>
      </div>

      {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" /> : !phases.length ? (
        <div className="panel-surface flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
          <Map className="h-8 w-8 text-primary" /><p>No roadmap yet. Set your goal and click Build my roadmap.</p>
        </div>
      ) : (<>
        <div className="panel-surface space-y-2 p-5">
          <div className="flex justify-between text-sm"><span>Overall progress</span><span className="font-display text-primary">{pct}%</span></div>
          <Progress value={pct} />
        </div>
        <ol className="relative space-y-4 border-l border-border pl-6">
          {phases.map((p, i) => {
            const done = p.milestones.length > 0 && p.milestones.every((m) => m.done);
            return (
              <li key={p.id} className={cn("panel-surface relative space-y-3 p-5", p.id === current && "border-primary/60 shadow-glow")}>
                <span className={cn("absolute -left-[33px] top-6 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold", done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>{i + 1}</span>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">{p.title}</h2>
                  <span className="text-xs text-muted-foreground">{p.weeks}{p.id === current && <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-primary">Now</span>}</span>
                </div>
                {p.goal && <p className="text-sm text-muted-foreground">{p.goal}</p>}
                <ul className="space-y-2">
                  {p.milestones.map((m) => (
                    <li key={m.id} className="group flex items-start gap-2 text-sm">
                      <Checkbox className="mt-0.5" checked={m.done} aria-label={m.text} onCheckedChange={(v) => edit(p.id, (x) => ({ ...x, milestones: x.milestones.map((y) => (y.id === m.id ? { ...y, done: !!v } : y)) }))} />
                      <span className={cn("flex-1", m.done && "text-muted-foreground line-through")}>{m.text}</span>
                      <button aria-label="Remove milestone" className="opacity-0 transition-opacity group-hover:opacity-100" onClick={() => edit(p.id, (x) => ({ ...x, milestones: x.milestones.filter((y) => y.id !== m.id) }))}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                    </li>
                  ))}
                </ul>
                <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addMilestone(p.id); }}>
                  <Input value={drafts[p.id] || ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))} placeholder="Add a milestone" className="h-8 text-sm" />
                  <Button type="submit" size="sm" variant="outline"><Plus className="h-3.5 w-3.5" /></Button>
                </form>
              </li>
            );
          })}
        </ol>
      </>)}
    </div>
  );
};

export default RoadmapPage;
