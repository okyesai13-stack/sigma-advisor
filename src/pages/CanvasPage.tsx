import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Plus, Trash2, RotateCcw, Printer, ExternalLink, Loader2, Check, X, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { CANVAS_BOXES, autofill, type Boxes, type BoxKey } from "@/lib/leanCanvas";

const latest = (t: string, id: string) =>
  supabase.from(t as any).select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();

const ACTIONS = [
  { id: "improve", label: "Improve" },
  { id: "sharpen", label: "Make sharper" },
  { id: "challenge", label: "Challenge this" },
  { id: "ideas", label: "Suggest 3 ideas" },
];

const CanvasPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setBusiness, resultsVersion } = useResume();
  const [biz, setBiz] = useState<any>(null);
  const [boxes, setBoxes] = useState<Boxes>({});
  const [source, setSource] = useState<Boxes>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState<{ box: BoxKey; action: string; items: string[] | null } | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: b }, mr, ca, bp, fm, ms, { data: c }] = await Promise.all([
        supabase.from("business_store").select("id, business_name, pitch, stage, industry, target_market, geography").eq("id", id).maybeSingle(),
        latest("market_research_result", id), latest("competitor_analysis_result", id), latest("business_plan_result", id),
        latest("financial_model_result", id), latest("marketing_strategy_result", id),
        supabase.from("lean_canvas").select("boxes").eq("business_id", id).maybeSingle(),
      ]);
      if (!b) { setLoading(false); return; }
      setBiz(b);
      const filled = autofill({ mr: mr.data, ca: ca.data, bp: bp.data, fm: fm.data, ms: ms.data });
      setSource(filled);
      if (c?.boxes && Object.keys(c.boxes as object).length) setBoxes(c.boxes as Boxes);
      else { setBoxes(filled); await supabase.from("lean_canvas").upsert({ business_id: id, boxes: filled as any }, { onConflict: "business_id" }); }
      setLoading(false);
      setTimeout(() => { ready.current = true; }, 0);
    })();
  }, [id, resultsVersion]);

  useEffect(() => {
    if (!ready.current) return;
    setSaving(true);
    const t = setTimeout(async () => {
      const { error } = await supabase.from("lean_canvas").upsert({ business_id: id, boxes: boxes as any }, { onConflict: "business_id" });
      setSaving(false);
      if (error) toast({ title: "Couldn't save canvas", variant: "destructive" });
    }, 800);
    return () => clearTimeout(t);
  }, [boxes]);

  const update = (k: BoxKey, fn: (l: string[]) => string[]) => setBoxes((p) => ({ ...p, [k]: fn(p[k] || []) }));

  const ask = async (box: BoxKey, action: string) => {
    setAi({ box, action, items: null });
    const { data, error } = await supabase.functions.invoke("canvas-assist", { body: { business_id: id, box, action, notes: boxes[box] || [] } });
    if (error || data?.error) { toast({ title: "AI couldn't help right now", description: data?.error || error?.message, variant: "destructive" }); setAi(null); return; }
    setAi({ box, action, items: data.suggestions || [] });
  };

  const accept = (replace: boolean) => {
    if (!ai?.items) return;
    update(ai.box, (l) => (replace ? ai.items! : [...l, ...ai.items!]));
    setAi(null);
  };

  const jump = (section: string) => {
    if (biz) setBusiness(biz);
    navigate(`/dashboard#section-${section}`);
  };

  if (loading) return <div className="grid h-full place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!biz) return <div className="p-10 text-center text-sm text-muted-foreground">Analysis not found. <Button variant="link" onClick={() => navigate("/workspace")}>Back to workspace</Button></div>;

  return (
    <div className="px-4 py-6 md:px-6 animate-fade-in print:p-0">
      <Seo title={`${biz.business_name} Canvas — Planz`} description="Lean Canvas workspace" path={`/workspace/${id}`} noindex />
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <button onClick={() => navigate("/workspace")} className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />All analyses</button>
          <p className="eyebrow">Lean Canvas</p>
          <h1 className="font-display text-2xl font-semibold">{biz.business_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{saving ? "Saving…" : "Saved"}</span>
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Export PDF</Button>
        </div>
      </div>
      <h1 className="hidden font-display text-2xl print:block">{biz.business_name} — Lean Canvas</h1>

      <div className="grid gap-3 md:grid-cols-5 md:grid-rows-[minmax(220px,auto)_minmax(220px,auto)_minmax(180px,auto)]">
        {CANVAS_BOXES.map((b) => {
          const items = boxes[b.key] || [];
          const busy = ai?.box === b.key;
          return (
            <div key={b.key} className={`flex flex-col rounded-md border border-border bg-card p-3 ${b.area} ${busy ? "border-primary/60" : ""}`}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-sm font-semibold">{b.title}</p>
                  <p className="text-[11px] text-muted-foreground">{b.hint}</p>
                </div>
                <div className="flex shrink-0 items-center print:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 text-primary" title="Ask AI"><Sparkles className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {ACTIONS.map((a) => <DropdownMenuItem key={a.id} onClick={() => ask(b.key, a.id)}>{a.label}</DropdownMenuItem>)}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Reset from agent results" onClick={() => update(b.key, () => source[b.key] || [])}><RotateCcw className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" title="Open source section" onClick={() => jump(b.section)}><ExternalLink className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              <div className="flex-1 space-y-1.5">
                {items.map((note, i) => (
                  <div key={i} className="group flex items-start gap-1">
                    <textarea
                      value={note}
                      onChange={(e) => update(b.key, (l) => l.map((x, j) => (j === i ? e.target.value : x)))}
                      rows={Math.max(1, Math.ceil(note.length / 38))}
                      className="w-full resize-none rounded border border-transparent bg-background/50 px-2 py-1 text-xs leading-5 focus:border-primary/50 focus:outline-none"
                    />
                    <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100 print:hidden">
                      <button disabled={i === 0} onClick={() => update(b.key, (l) => { const c = [...l]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c; })} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronUp className="h-3 w-3" /></button>
                      <button onClick={() => update(b.key, (l) => l.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                      <button disabled={i === items.length - 1} onClick={() => update(b.key, (l) => { const c = [...l]; [c[i + 1], c[i]] = [c[i], c[i + 1]]; return c; })} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ChevronDown className="h-3 w-3" /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => update(b.key, (l) => [...l, ""])} className="flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-primary print:hidden"><Plus className="h-3 w-3" />Add note</button>
              </div>

              {busy && (
                <div className="mt-2 rounded border border-primary/30 bg-primary/10 p-2 print:hidden">
                  <p className="eyebrow mb-1 text-primary">AI · {ACTIONS.find((a) => a.id === ai!.action)?.label}</p>
                  {!ai!.items ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
                    <>
                      <ul className="mb-2 space-y-1 text-xs">{ai!.items.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                      <div className="flex flex-wrap gap-1">
                        {ai!.action !== "challenge" && <Button size="sm" className="h-6 px-2 text-[11px]" onClick={() => accept(ai!.action !== "ideas")}><Check className="h-3 w-3" />{ai!.action === "ideas" ? "Add" : "Replace"}</Button>}
                        {ai!.action !== "ideas" && <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => accept(false)}><Plus className="h-3 w-3" />Append</Button>}
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setAi(null)}><X className="h-3 w-3" />Discard</Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground print:hidden">Tip: the advisor chat can see this canvas — ask it "Is our UVP strong against competitors?"</p>
    </div>
  );
};

export default CanvasPage;
