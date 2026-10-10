import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Plus, Minus, Trash2, Printer, ExternalLink, Loader2, Hand, MousePointer2, Maximize, StickyNote, RotateCcw, Wand2 } from "lucide-react";
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
  { id: "improve", label: "Improve these notes" },
  { id: "sharpen", label: "Make sharper" },
  { id: "challenge", label: "Challenge this" },
  { id: "ideas", label: "Suggest 3 ideas" },
];

const COLORS = {
  orange: "bg-primary/20 border-primary/50",
  mint: "bg-success/20 border-success/50",
  amber: "bg-warning/20 border-warning/50",
  red: "bg-destructive/20 border-destructive/50",
  slate: "bg-secondary border-border",
} as const;
type Color = keyof typeof COLORS;

interface Note { id: string; text: string; x: number; y: number; color: Color; ai?: boolean; }

const CW = 300, RH = 340, BH = 280, GAP = 16, HEAD = 56;
const ZONES: Record<BoxKey, { x: number; y: number; w: number; h: number }> = {
  problem: { x: 0, y: 0, w: CW, h: RH * 2 + GAP },
  solution: { x: CW + GAP, y: 0, w: CW, h: RH },
  key_metrics: { x: CW + GAP, y: RH + GAP, w: CW, h: RH },
  uvp: { x: (CW + GAP) * 2, y: 0, w: CW, h: RH * 2 + GAP },
  unfair_advantage: { x: (CW + GAP) * 3, y: 0, w: CW, h: RH },
  channels: { x: (CW + GAP) * 3, y: RH + GAP, w: CW, h: RH },
  customer_segments: { x: (CW + GAP) * 4, y: 0, w: CW, h: RH * 2 + GAP },
  cost_structure: { x: 0, y: (RH + GAP) * 2, w: CW * 2 + GAP, h: BH },
  revenue_streams: { x: (CW + GAP) * 2, y: (RH + GAP) * 2, w: CW * 3 + GAP * 2, h: BH },
};
const BOARD_W = (CW + GAP) * 5 - GAP;
const IDEAS = { x: BOARD_W + 60, y: 0, w: 520, h: RH * 2 + GAP + BH + GAP };
const NW = 200;

const uid = () => Math.random().toString(36).slice(2, 10);
const zoneOf = (n: Note): BoxKey | null => {
  const cx = n.x + NW / 2, cy = n.y + 30;
  for (const k of Object.keys(ZONES) as BoxKey[]) {
    const z = ZONES[k];
    if (cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h) return k;
  }
  return null;
};
const slot = (k: BoxKey, i: number) => {
  const z = ZONES[k]; const cols = Math.max(1, Math.floor((z.w - 16) / (NW + 12)));
  return { x: z.x + 12 + (i % cols) * (NW + 12), y: z.y + HEAD + Math.floor(i / cols) * 110 };
};
const layout = (b: Boxes): Note[] =>
  CANVAS_BOXES.flatMap((bx) => (b[bx.key] || []).map((t, i) => ({ id: uid(), text: t, color: "orange" as Color, ...slot(bx.key, i) })));
const toBoxes = (notes: Note[]): Boxes => {
  const out: Boxes = {};
  [...notes].sort((a, b) => a.y - b.y || a.x - b.x).forEach((n) => { const k = zoneOf(n); if (k && n.text.trim()) (out[k] ||= []).push(n.text); });
  return out;
};

const CanvasPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setBusiness, resultsVersion } = useResume();
  const [biz, setBiz] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [source, setSource] = useState<Boxes>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [tool, setTool] = useState<"select" | "hand">("select");
  const [color, setColor] = useState<Color>("orange");
  const [view, setView] = useState({ x: 40, y: 40, z: 0.7 });
  const viewRef = useRef(view); viewRef.current = view;
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ kind: "pan" | "note"; id?: string; sx: number; sy: number; ox: number; oy: number } | null>(null);
  const ready = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true); ready.current = false;
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
      const saved: any = c?.boxes || {};
      if (Array.isArray(saved.__board?.notes)) setNotes(saved.__board.notes);
      else setNotes(layout(Object.keys(saved).length ? saved : filled));
      setLoading(false);
      setTimeout(() => { ready.current = true; fit(); }, 0);
    })();
  }, [id, resultsVersion]);

  useEffect(() => {
    if (!ready.current) return;
    setSaving(true);
    const t = setTimeout(async () => {
      const { error } = await supabase.from("lean_canvas").upsert({ business_id: id, boxes: { ...toBoxes(notes), __board: { notes } } as any }, { onConflict: "business_id" });
      setSaving(false);
      if (error) toast({ title: "Couldn't save board", variant: "destructive" });
    }, 800);
    return () => clearTimeout(t);
  }, [notes]);

  // wheel zoom (native, non-passive)
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current; const r = el.getBoundingClientRect();
      if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaX) + Math.abs(e.deltaY) < 400 && e.deltaMode === 0 && !e.altKey && e.shiftKey) {
        setView({ ...v, x: v.x - e.deltaY, y: v.y }); return;
      }
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const z = Math.min(2, Math.max(0.2, v.z * Math.exp(-dy * 0.0015)));
      const px = e.clientX - r.left, py = e.clientY - r.top, k = z / v.z;
      setView({ z, x: px - (px - v.x) * k, y: py - (py - v.y) * k });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [loading]);

  const zoomBy = (f: number) => {
    const el = wrap.current; if (!el) return;
    const r = el.getBoundingClientRect(); const v = viewRef.current;
    const z = Math.min(2, Math.max(0.2, v.z * f)), px = r.width / 2, py = r.height / 2, k = z / v.z;
    setView({ z, x: px - (px - v.x) * k, y: py - (py - v.y) * k });
  };
  const fit = useCallback(() => {
    const el = wrap.current; if (!el) return;
    const r = el.getBoundingClientRect(); const W = IDEAS.x + IDEAS.w, H = IDEAS.h;
    const z = Math.min(1.2, Math.max(0.2, Math.min((r.width - 60) / W, (r.height - 60) / H)));
    setView({ z, x: (r.width - W * z) / 2, y: (r.height - H * z) / 2 });
  }, []);

  const toWorld = (cx: number, cy: number) => {
    const r = wrap.current!.getBoundingClientRect(); const v = viewRef.current;
    return { x: (cx - r.left - v.x) / v.z, y: (cy - r.top - v.y) / v.z };
  };

  const onBgDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-note],[data-ui]")) return;
    setSel(null);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
  };
  const onNoteDown = (e: React.PointerEvent, n: Note) => {
    setSel(n.id);
    if ((e.target as HTMLElement).tagName === "TEXTAREA" && tool === "select") return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.stopPropagation();
    wrap.current!.setPointerCapture(e.pointerId);
    drag.current = tool === "hand"
      ? { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y }
      : { kind: "note", id: n.id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (d.kind === "pan") setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
    else setNotes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: d.ox + dx / viewRef.current.z, y: d.oy + dy / viewRef.current.z } : n)));
  };
  const onUp = () => { drag.current = null; };

  const addNote = (x?: number, y?: number, text = "", c: Color = color) => {
    let p = { x: x ?? 0, y: y ?? 0 };
    if (x == null) { const r = wrap.current!.getBoundingClientRect(); p = toWorld(r.left + r.width / 2, r.top + r.height / 2); p.x -= NW / 2; }
    const n: Note = { id: uid(), text, x: p.x, y: p.y, color: c };
    setNotes((ns) => [...ns, n]); setSel(n.id);
  };
  const patch = (nid: string, p: Partial<Note>) => setNotes((ns) => ns.map((n) => (n.id === nid ? { ...n, ...p } : n)));
  const remove = (nid: string) => { setNotes((ns) => ns.filter((n) => n.id !== nid)); setSel(null); };

  const runAI = async (box: BoxKey, action: string, focus?: Note) => {
    const key = focus?.id || box;
    setBusy(key);
    const inZone = notes.filter((n) => zoneOf(n) === box);
    const { data, error } = await supabase.functions.invoke("canvas-assist", { body: { business_id: id, box, action, notes: focus ? [focus.text] : inZone.map((n) => n.text) } });
    setBusy(null);
    if (error || data?.error) { toast({ title: "AI couldn't help right now", description: data?.error || error?.message, variant: "destructive" }); return; }
    const items: string[] = data.suggestions || [];
    const c: Color = action === "challenge" ? "red" : "mint";
    const base = focus ? { x: focus.x + NW + 24, y: focus.y } : null;
    const start = inZone.length;
    setNotes((ns) => [...ns, ...items.map((t, i) => ({ id: uid(), text: t, color: c, ai: true, ...(base ? { x: base.x, y: base.y + i * 110 } : slot(box, start + i)) }))]);
    toast({ title: `AI added ${items.length} notes`, description: "Green = ideas, red = challenges. Drag, edit or delete them." });
  };

  const resetZone = (k: BoxKey) => setNotes((ns) => [...ns.filter((n) => zoneOf(n) !== k), ...(source[k] || []).map((t, i) => ({ id: uid(), text: t, color: "orange" as Color, ...slot(k, i) }))]);
  const jump = (section: string) => { if (biz) setBusiness(biz); navigate(`/dashboard#section-${section}`); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "v") setTool("select");
      if (e.key === "h") setTool("hand");
      if (e.key === "n") addNote();
      if ((e.key === "Delete" || e.key === "Backspace") && sel) remove(sel);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (loading) return <div className="grid h-full place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  if (!biz) return <div className="p-10 text-center text-sm text-muted-foreground">Analysis not found. <Button variant="link" onClick={() => navigate("/workspace")}>Back to workspace</Button></div>;

  const selected = notes.find((n) => n.id === sel);

  return (
    <div className="flex h-full flex-col animate-fade-in">
      <Seo title={`${biz.business_name} Whiteboard — Planz`} description="Startup whiteboard" path={`/workspace/${id}`} noindex />
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/workspace")} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />All analyses</button>
          <div><p className="eyebrow">Whiteboard</p><h1 className="font-display text-lg font-semibold leading-tight">{biz.business_name}</h1></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{saving ? "Saving…" : "Saved"}</span>
          <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="h-3.5 w-3.5" />Export</Button>
        </div>
      </div>

      <div
        ref={wrap}
        onPointerDown={onBgDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onDoubleClick={(e) => { if ((e.target as HTMLElement).closest("[data-note],[data-ui]")) return; const p = toWorld(e.clientX, e.clientY); addNote(p.x - NW / 2, p.y - 20); }}
        className={`relative flex-1 touch-none select-none overflow-hidden bg-background ${tool === "hand" ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)", backgroundSize: `${24 * view.z}px ${24 * view.z}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
      >
        <div className="absolute left-0 top-0" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "0 0" }}>
          {CANVAS_BOXES.map((b) => {
            const z = ZONES[b.key];
            return (
              <div key={b.key} className={`absolute rounded-lg border bg-card/40 ${busy === b.key ? "border-primary" : "border-border"}`} style={{ left: z.x, top: z.y, width: z.w, height: z.h }}>
                <div data-ui className="flex items-start justify-between gap-2 px-3 pt-2.5">
                  <div><p className="font-display text-sm font-semibold">{b.title}</p><p className="text-[11px] text-muted-foreground">{b.hint}</p></div>
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 text-primary" title="Ask AI agent">{busy === b.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}</Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">{ACTIONS.map((a) => <DropdownMenuItem key={a.id} onClick={() => runAI(b.key, a.id)}>{a.label}</DropdownMenuItem>)}</DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Reset from agent results" onClick={() => resetZone(b.key)}><RotateCcw className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Open source section" onClick={() => jump(b.section)}><ExternalLink className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="absolute rounded-lg border border-dashed border-border" style={{ left: IDEAS.x, top: IDEAS.y, width: IDEAS.w, height: IDEAS.h }}>
            <p className="px-3 pt-2.5 font-display text-sm font-semibold">Brainstorm area</p>
            <p className="px-3 text-[11px] text-muted-foreground">Free space — drag notes into a box when ready</p>
          </div>

          {notes.map((n) => (
            <div
              key={n.id} data-note
              onPointerDown={(e) => onNoteDown(e, n)}
              className={`absolute rounded-md border p-2 shadow-lg transition-shadow ${COLORS[n.color]} ${sel === n.id ? "ring-2 ring-primary" : ""} ${tool === "select" ? "cursor-move" : ""}`}
              style={{ left: n.x, top: n.y, width: NW }}
            >
              {n.ai && <p className="mb-1 flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground"><Sparkles className="h-2.5 w-2.5" />AI</p>}
              <textarea
                value={n.text} placeholder="Type an idea…"
                onChange={(e) => patch(n.id, { text: e.target.value })}
                rows={Math.max(2, Math.ceil(n.text.length / 28))}
                className="w-full cursor-text resize-none bg-transparent text-xs leading-5 text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {busy === n.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            </div>
          ))}
        </div>

        {/* toolbar */}
        <div data-ui className="glass-surface absolute left-4 top-1/2 flex -translate-y-1/2 flex-col gap-1 rounded-lg border border-border p-1.5">
          <Button size="icon" variant={tool === "select" ? "default" : "ghost"} className="h-8 w-8" title="Select & move (V)" onClick={() => setTool("select")}><MousePointer2 className="h-4 w-4" /></Button>
          <Button size="icon" variant={tool === "hand" ? "default" : "ghost"} className="h-8 w-8" title="Pan (H)" onClick={() => setTool("hand")}><Hand className="h-4 w-4" /></Button>
          <div className="my-1 h-px bg-border" />
          <Button size="icon" variant="ghost" className="h-8 w-8" title="Add sticky note (N)" onClick={() => addNote()}><StickyNote className="h-4 w-4" /></Button>
          {(Object.keys(COLORS) as Color[]).map((c) => (
            <button key={c} title={c} onClick={() => { setColor(c); if (selected) patch(selected.id, { color: c }); }} className={`mx-auto h-5 w-5 rounded-full border ${COLORS[c]} ${color === c ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`} />
          ))}
        </div>

        {/* selection bar */}
        {selected && (
          <div data-ui className="glass-surface absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border p-1.5 animate-fade-in">
            <span className="px-2 text-xs text-muted-foreground">{zoneOf(selected) ? CANVAS_BOXES.find((b) => b.key === zoneOf(selected))?.title : "Brainstorm"}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-8 text-primary"><Wand2 className="h-3.5 w-3.5" />AI on this note</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                {ACTIONS.map((a) => <DropdownMenuItem key={a.id} onClick={() => runAI(zoneOf(selected) || "solution", a.id, selected)}>{a.label}</DropdownMenuItem>)}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" title="Delete (Del)" onClick={() => remove(selected.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
          </div>
        )}

        {/* zoom */}
        <div data-ui className="glass-surface absolute bottom-4 right-4 flex items-center gap-1 rounded-lg border border-border p-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => zoomBy(1 / 1.2)}><Minus className="h-4 w-4" /></Button>
          <button className="w-12 text-xs tabular-nums text-muted-foreground" onClick={() => zoomBy(1 / view.z)}>{Math.round(view.z * 100)}%</button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => zoomBy(1.2)}><Plus className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" title="Fit board" onClick={fit}><Maximize className="h-4 w-4" /></Button>
        </div>
        <p data-ui className="absolute bottom-5 left-4 text-[11px] text-muted-foreground">Double-click to add a note · drag empty space to pan · scroll to zoom</p>
      </div>
    </div>
  );
};

export default CanvasPage;
