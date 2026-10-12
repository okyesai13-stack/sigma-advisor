import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Sparkles, Plus, Minus, Trash2, Printer, ExternalLink, Loader2, Hand, MousePointer2, Maximize, StickyNote, RotateCcw, Wand2, Download, RefreshCw, TrendingUp, Swords, FileText, DollarSign, Megaphone, Cpu, GripVertical, GitBranch, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { containsNote, moveSectionNotes, canConnect, connectionGeometry, sectionAnchor, type ConnectionSide, type SectionRect, type SectionConnection } from "@/lib/whiteboardGeometry";
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

const FTOP = IDEAS.h + 120, FW = 640, FH = 520, FG = 24;
const AGENTS = [
  { key: "mr", title: "Market Research", table: "market_research_result", fn: "market-research", section: "market", box: "customer_segments", icon: TrendingUp },
  { key: "ca", title: "Competitor Position", table: "competitor_analysis_result", fn: "competitor-analysis", section: "comp", box: "unfair_advantage", icon: Swords },
  { key: "bp", title: "Business Plan", table: "business_plan_result", fn: "business-plan", section: "plan", box: "solution", icon: FileText },
  { key: "fm", title: "Financial Model", table: "financial_model_result", fn: "financial-model", section: "fin", box: "revenue_streams", icon: DollarSign },
  { key: "ms", title: "Marketing Strategy", table: "marketing_strategy_result", fn: "marketing-strategy", section: "mkt", box: "channels", icon: Megaphone },
  { key: "aio", title: "AI Operations", table: "ai_operations_result", fn: "ai-operations", section: "aio", box: "key_metrics", icon: Cpu },
] as const;
type AgentKey = typeof AGENTS[number]["key"];
const FRAMES = Object.fromEntries(AGENTS.map((a, i) => [a.key, { x: (i % 3) * (FW + FG), y: FTOP + Math.floor(i / 3) * (FH + FG), w: FW, h: FH }])) as Record<AgentKey, { x: number; y: number; w: number; h: number }>;
const BOTTOM = FTOP + 2 * (FH + FG);
const flat = (v: any): string => {
  if (v == null) return "";
  if (typeof v !== "object") return String(v);
  if (Array.isArray(v)) return v.slice(0, 3).map(flat).filter(Boolean).join("; ");
  return Object.entries(v).slice(0, 4).map(([k, x]) => `${k.replace(/_/g, " ")}: ${flat(x)}`).join(" · ");
};
const insights = (row: any): string[] => row ? Object.entries(row)
  .filter(([k, v]) => !["id", "business_id", "created_at", "updated_at", "user_id"].includes(k) && v != null && v !== "")
  .map(([k, v]) => `${k.replace(/_/g, " ").toUpperCase()}: ${flat(v)}`.slice(0, 240)).slice(0, 12) : [];

const uid = () => Math.random().toString(36).slice(2, 10);
const DEFAULT_SECTIONS: Record<string, SectionRect> = { ...ZONES, ...FRAMES, ideas: IDEAS };
const slot = (k: BoxKey, i: number, sections = DEFAULT_SECTIONS) => {
  const z = sections[k]; const cols = Math.max(1, Math.floor((z.w - 16) / (NW + 12)));
  return { x: z.x + 12 + (i % cols) * (NW + 12), y: z.y + HEAD + Math.floor(i / cols) * 110 };
};
const layout = (b: Boxes): Note[] =>
  CANVAS_BOXES.flatMap((bx) => (b[bx.key] || []).map((t, i) => ({ id: uid(), text: t, color: "orange" as Color, ...slot(bx.key, i) })));
const CanvasPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setBusiness, resultsVersion } = useResume();
  const [biz, setBiz] = useState<any>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const sectionsRef = useRef(sections); sectionsRef.current = sections;
  const [connections, setConnections] = useState<SectionConnection[]>([]);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [connectSide, setConnectSide] = useState<ConnectionSide | undefined>();
  const [connectionPoint, setConnectionPoint] = useState<{ x: number; y: number } | null>(null);
  const connectionDrag = useRef<{ key: string; side: ConnectionSide; x: number; y: number } | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const zoneOf = (n: Note): BoxKey | null => CANVAS_BOXES.find((b) => containsNote(sections[b.key], n))?.key || null;
  const frameOf = (n: Note): AgentKey | null => AGENTS.find((a) => containsNote(sections[a.key], n))?.key || null;
  const zoneSlot = (k: BoxKey, i: number) => slot(k, i, sections);
  const frameSlot = (k: AgentKey, i: number) => { const f = sections[k]; return { x: f.x + 12 + (i % 3) * (NW + 12), y: f.y + HEAD + Math.floor(i / 3) * 120 }; };
  const toBoxes = (ns: Note[]): Boxes => {
    const out: Boxes = {};
    [...ns].sort((a, b) => a.y - b.y || a.x - b.x).forEach((n) => { const k = zoneOf(n); if (k && n.text.trim()) (out[k] ||= []).push(n.text); });
    return out;
  };
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
  const drag = useRef<{ kind: "pan" | "note" | "section"; id?: string; sx: number; sy: number; ox: number; oy: number; initial?: Note[]; ids?: string[] } | null>(null);
  const ready = useRef(false);
  const [results, setResults] = useState<Partial<Record<AgentKey, any>>>({});

  useEffect(() => {
    (async () => {
      setLoading(true); ready.current = false;
      const [{ data: b }, mr, ca, bp, fm, ms, aio, { data: c }] = await Promise.all([
        supabase.from("business_store").select("id, business_name, pitch, stage, industry, target_market, geography").eq("id", id).maybeSingle(),
        latest("market_research_result", id), latest("competitor_analysis_result", id), latest("business_plan_result", id),
        latest("financial_model_result", id), latest("marketing_strategy_result", id), latest("ai_operations_result", id),
        supabase.from("lean_canvas").select("boxes").eq("business_id", id).maybeSingle(),
      ]);
      if (!b) { setLoading(false); return; }
      setBiz(b);
      const filled = autofill({ mr: mr.data, ca: ca.data, bp: bp.data, fm: fm.data, ms: ms.data });
      setSource(filled);
      setResults({ mr: mr.data, ca: ca.data, bp: bp.data, fm: fm.data, ms: ms.data, aio: aio.data });
      const saved: any = c?.boxes || {};
      const restored = { ...DEFAULT_SECTIONS };
      for (const [key, rect] of Object.entries(DEFAULT_SECTIONS)) {
        const position = saved.__board?.sections?.[key];
        if (Number.isFinite(position?.x) && Number.isFinite(position?.y)) restored[key] = { ...rect, x: position.x, y: position.y };
      }
      sectionsRef.current = restored;
      setSections(restored);
      setConnections(Array.isArray(saved.__board?.connections) ? saved.__board.connections.filter((c: SectionConnection) => restored[c.from] && restored[c.to] && typeof c.id === "string").map((c: SectionConnection) => ({ ...c, label: typeof c.label === "string" ? c.label : "" })) : []);
      setConnectFrom(null); setSelectedConnection(null);
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
      const { error } = await supabase.from("lean_canvas").upsert({ business_id: id, boxes: { ...toBoxes(notes), __board: { notes, sections, connections } } as any }, { onConflict: "business_id" });
      setSaving(false);
      if (error) toast({ title: "Couldn't save board", variant: "destructive" });
    }, 800);
    return () => clearTimeout(t);
  }, [notes, sections, connections]);

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
    const r = el.getBoundingClientRect();
    const rects = Object.values(sectionsRef.current);
    const minX = Math.min(...rects.map((f) => f.x)), minY = Math.min(...rects.map((f) => f.y));
    const W = Math.max(...rects.map((f) => f.x + f.w)) - minX, H = Math.max(...rects.map((f) => f.y + f.h)) - minY;
    const z = Math.min(1.2, Math.max(0.2, Math.min((r.width - 60) / W, (r.height - 60) / H)));
    setView({ z, x: (r.width - W * z) / 2 - minX * z, y: (r.height - H * z) / 2 - minY * z });
  }, []);

  const toWorld = (cx: number, cy: number) => {
    const r = wrap.current?.getBoundingClientRect(); const v = viewRef.current;
    if (!r) return { x: 0, y: 0 };
    return { x: (cx - r.left - v.x) / v.z, y: (cy - r.top - v.y) / v.z };
  };

  // Events from portaled menus bubble through React; ignore anything not physically inside the board.
  const outside = (e: React.SyntheticEvent) => !(e.currentTarget as HTMLElement).contains(e.target as Node);
  const onBgDown = (e: React.PointerEvent) => {
    if (outside(e) || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-note],[data-ui]")) return;
    (document.activeElement as HTMLElement | null)?.blur?.();
    setSel(null); setSelectedConnection(null);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
  };
  const onNoteDown = (e: React.PointerEvent, n: Note) => {
    e.stopPropagation();
    if (outside(e) || e.button !== 0) return;
    setSel(n.id); setSelectedConnection(null); setConnectFrom(null);
    if ((e.target as HTMLElement).tagName === "TEXTAREA" && tool === "select") return;
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    wrap.current?.setPointerCapture(e.pointerId);
    drag.current = tool === "hand"
      ? { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y }
      : { kind: "note", id: n.id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y };
  };
  const onSectionDown = (e: React.PointerEvent, key: string) => {
    e.stopPropagation();
    if (outside(e) || e.button !== 0 || (e.target as HTMLElement).closest("button,[role=menuitem]")) return;
    if (connectFrom) { connectSection(key); return; }
    e.preventDefault(); setSel(null); setSelectedConnection(null);
    wrap.current?.setPointerCapture(e.pointerId);
    if (tool === "hand") {
      drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: view.x, oy: view.y };
      return;
    }
    const rect = sections[key];
    drag.current = { kind: "section", id: key, sx: e.clientX, sy: e.clientY, ox: rect.x, oy: rect.y, initial: notes, ids: notes.filter((n) => containsNote(rect, n)).map((n) => n.id) };
  };
  const connectSection = (key: string, side?: ConnectionSide) => {
    setSel(null); setSelectedConnection(null);
    if (!connectFrom) { setConnectFrom(key); setConnectSide(side); setConnectionPoint(null); return; }
    if (connectFrom === key) { setConnectFrom(null); setConnectionPoint(null); return; }
    const from = connectFrom;
    const connectionId = uid();
    setConnections((cs) => canConnect(cs, from, key) ? [...cs, { id: connectionId, from, to: key, label: "", fromSide: connectSide, toSide: side }] : cs);
    setConnectFrom(null); setConnectionPoint(null); setSelectedConnection(connectionId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (connectFrom) setConnectionPoint(toWorld(e.clientX, e.clientY));
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (d.kind === "pan") setView((v) => ({ ...v, x: d.ox + dx, y: d.oy + dy }));
    else if (d.kind === "section" && d.id) {
      const key = d.id, wx = dx / viewRef.current.z, wy = dy / viewRef.current.z;
      setSections((ss) => ({ ...ss, [key]: { ...ss[key], x: d.ox + wx, y: d.oy + wy } }));
      setNotes((ns) => moveSectionNotes(ns, d.initial || [], d.ids || [], wx, wy));
    }
    else setNotes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: d.ox + dx / viewRef.current.z, y: d.oy + dy / viewRef.current.z } : n)));
  };
  const onUp = (e: React.PointerEvent) => {
    drag.current = null;
    const start = connectionDrag.current;
    connectionDrag.current = null;
    if (!start || e.type === "pointercancel") return;
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) < 5) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-connection-port]");
    const key = target?.dataset.sectionKey;
    const side = target?.dataset.side as ConnectionSide | undefined;
    if (key && key !== start.key) connectSection(key, side);
    else { setConnectFrom(null); setConnectionPoint(null); }
  };

  const addNote = (x?: number, y?: number, text = "", c: Color = color) => {
    let p = { x: x ?? 0, y: y ?? 0 };
    if (x == null) { const r = wrap.current?.getBoundingClientRect(); if (!r) return; p = toWorld(r.left + r.width / 2, r.top + r.height / 2); p.x -= NW / 2; }
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
    setNotes((ns) => [...ns, ...items.map((t, i) => ({ id: uid(), text: t, color: c, ai: true, ...(base ? { x: base.x, y: base.y + i * 110 } : zoneSlot(box, start + i)) }))]);
    toast({ title: `AI added ${items.length} notes`, description: "Green = ideas, red = challenges. Drag, edit or delete them." });
  };

  const pullAgent = (k: AgentKey) => {
    const items = insights(results[k]);
    if (!items.length) { toast({ title: "No results yet", description: "Run this agent first." }); return; }
    setNotes((ns) => [...ns.filter((n) => frameOf(n) !== k), ...items.map((t, i) => ({ id: uid(), text: t, color: "slate" as Color, ...frameSlot(k, i) }))]);
  };
  const rerunAgent = async (a: typeof AGENTS[number]) => {
    setBusy(a.key);
    const { data, error } = await supabase.functions.invoke(a.fn, { body: { business_id: id } });
    if (error || !data?.success) { setBusy(null); toast({ title: `${a.title} failed`, description: data?.error || error?.message, variant: "destructive" }); return; }
    const { data: row } = await latest(a.table, id);
    setResults((r) => ({ ...r, [a.key]: row }));
    setBusy(null);
    const items = insights(row);
    setNotes((ns) => [...ns.filter((n) => frameOf(n) !== a.key), ...items.map((t, i) => ({ id: uid(), text: t, color: "slate" as Color, ...frameSlot(a.key, i) }))]);
    toast({ title: `${a.title} refreshed`, description: "Fresh insights are on the board." });
  };
  const aiFrame = async (a: typeof AGENTS[number], action: string) => {
    setBusy(a.key);
    const inFrame = notes.filter((n) => frameOf(n) === a.key).map((n) => n.text);
    const { data, error } = await supabase.functions.invoke("canvas-assist", { body: { business_id: id, box: a.box, action, notes: inFrame.length ? inFrame : insights(results[a.key]) } });
    setBusy(null);
    if (error || data?.error) { toast({ title: "AI couldn't help right now", description: data?.error || error?.message, variant: "destructive" }); return; }
    const items: string[] = data.suggestions || [];
    const start = inFrame.length;
    setNotes((ns) => [...ns, ...items.map((t, i) => ({ id: uid(), text: t, color: (action === "challenge" ? "red" : "mint") as Color, ai: true, ...frameSlot(a.key, start + i) }))]);
  };

  const resetZone = (k: BoxKey) => setNotes((ns) => [...ns.filter((n) => zoneOf(n) !== k), ...(source[k] || []).map((t, i) => ({ id: uid(), text: t, color: "orange" as Color, ...zoneSlot(k, i) }))]);
  const jump = (section: string) => { if (biz) setBusiness(biz); navigate(`/dashboard#section-${section}`); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["TEXTAREA", "INPUT", "SELECT"].includes(t.tagName) || t.isContentEditable || t.closest("[role=menu],[role=dialog]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") { setConnectFrom(null); setSelectedConnection(null); }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedConnection) { e.preventDefault(); setConnections((cs) => cs.filter((c) => c.id !== selectedConnection)); setSelectedConnection(null); }
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
        onDoubleClick={(e) => { if (outside(e)) return; if ((e.target as HTMLElement).closest("[data-note],[data-ui]")) return; const p = toWorld(e.clientX, e.clientY); addNote(p.x - NW / 2, p.y - 20); }}
        className={`relative flex-1 touch-none select-none overflow-hidden bg-background ${tool === "hand" ? "cursor-grab active:cursor-grabbing" : ""}`}
        style={{ backgroundImage: "radial-gradient(hsl(var(--border)) 1px, transparent 1px)", backgroundSize: `${24 * view.z}px ${24 * view.z}px`, backgroundPosition: `${view.x}px ${view.y}px` }}
      >
        <div className="absolute left-0 top-0" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.z})`, transformOrigin: "0 0" }}>
          {CANVAS_BOXES.map((b) => {
            const z = sections[b.key];
            return (
              <div key={b.key} className={`absolute rounded-lg border bg-card/40 ${busy === b.key ? "border-primary" : "border-border"}`} style={{ left: z.x, top: z.y, width: z.w, height: z.h }}>
                <div data-ui onPointerDown={(e) => onSectionDown(e, b.key)} className="flex cursor-grab items-start justify-between gap-2 px-3 pt-2.5 active:cursor-grabbing">
                  <div className="flex items-start gap-1"><GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" /><div><p className="font-display text-sm font-semibold">{b.title}</p><p className="text-[11px] text-muted-foreground">{b.hint}</p></div></div>
                  <div className="flex items-center">
                    <Button size="icon" variant={connectFrom === b.key ? "default" : "ghost"} className="h-7 w-7" title={connectFrom ? `Connect to ${b.title}` : `Connect ${b.title}`} aria-label={`Connect ${b.title}`} onClick={() => connectSection(b.key)}><GitBranch className="h-3.5 w-3.5" /></Button>
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
          <div className="absolute rounded-lg border border-dashed border-border" style={{ left: sections.ideas.x, top: sections.ideas.y, width: sections.ideas.w, height: sections.ideas.h }}>
            <div data-ui onPointerDown={(e) => onSectionDown(e, "ideas")} className="flex cursor-grab items-center justify-between px-3 pt-2.5"><p className="flex items-center gap-1 font-display text-sm font-semibold"><GripVertical className="h-4 w-4" />Brainstorm area</p><Button size="icon" variant={connectFrom === "ideas" ? "default" : "ghost"} className="h-7 w-7" title="Connect Brainstorm area" aria-label="Connect Brainstorm area" onClick={() => connectSection("ideas")}><GitBranch className="h-3.5 w-3.5" /></Button></div>
            <p className="px-3 text-[11px] text-muted-foreground">Free space — drag notes into a box when ready</p>
          </div>

          {AGENTS.map((a) => {
            const f = sections[a.key]; const has = !!results[a.key]; const Icon = a.icon;
            return (
              <div key={a.key} className={`absolute rounded-lg border bg-card/30 ${busy === a.key ? "border-primary" : "border-border"}`} style={{ left: f.x, top: f.y, width: f.w, height: f.h }}>
                <div data-ui onPointerDown={(e) => onSectionDown(e, a.key)} className="flex cursor-grab items-start justify-between gap-2 px-3 pt-2.5 active:cursor-grabbing">
                  <div className="flex items-center gap-2"><GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="grid h-7 w-7 place-items-center rounded-md bg-primary/10 text-primary"><Icon className="h-3.5 w-3.5" /></span>
                    <div><p className="font-display text-sm font-semibold">{a.title}</p><p className="text-[11px] text-muted-foreground">{has ? "Results ready" : "Not run yet"}</p></div></div>
                  <div className="flex items-center">
                    <Button size="icon" variant={connectFrom === a.key ? "default" : "ghost"} className="h-7 w-7" title={connectFrom ? `Connect to ${a.title}` : `Connect ${a.title}`} aria-label={`Connect ${a.title}`} onClick={() => connectSection(a.key)}><GitBranch className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Pull results onto board" disabled={!has} onClick={() => pullAgent(a.key)}><Download className="h-3.5 w-3.5" /></Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-7 w-7 text-primary" title="Ask AI agent">{busy === a.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}</Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">{ACTIONS.map((x) => <DropdownMenuItem key={x.id} onClick={() => aiFrame(a, x.id)}>{x.label}</DropdownMenuItem>)}</DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title={has ? "Re-run this agent" : "Run this agent"} disabled={busy === a.key} onClick={() => rerunAgent(a)}><RefreshCw className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" title="Open in dashboard" onClick={() => jump(a.section)}><ExternalLink className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </div>
            );
          })}

          <svg className="pointer-events-none absolute overflow-visible" width="1" height="1" aria-label="Section connections">
            <defs><marker id="section-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" className="fill-primary" /></marker></defs>
            {connections.map((c) => {
              const from = sections[c.from], to = sections[c.to]; if (!from || !to) return null;
              const g = connectionGeometry(from, to, c.fromSide, c.toSide);
              return <g key={c.id} data-ui>
                <path d={g.path} fill="none" className="stroke-primary" strokeWidth={selectedConnection === c.id ? 4 : 2} markerEnd="url(#section-arrow)" />
                <path d={g.path} fill="none" stroke="transparent" strokeWidth="20" className="pointer-events-auto cursor-pointer" aria-label="Select connection" onPointerDown={(e) => { e.stopPropagation(); setSelectedConnection(c.id); setSel(null); }} />
                {c.label && <text x={g.mid.x} y={g.mid.y - 10} textAnchor="middle" className="fill-foreground text-xs">{c.label}</text>}
              </g>;
            })}
            {connectFrom && connectionPoint && (() => {
              const rect = sections[connectFrom];
              if (!rect) return null;
              const start = sectionAnchor(rect, connectSide || "right");
              return <path d={`M ${start.x} ${start.y} L ${connectionPoint.x} ${connectionPoint.y}`} fill="none" className="stroke-primary" strokeWidth="2" strokeDasharray="8 5" markerEnd="url(#section-arrow)" />;
            })()}
          </svg>

          {notes.map((n) => (
            <div
              key={n.id} data-note
              onPointerDown={(e) => onNoteDown(e, n)}
              className={`absolute rounded-md border p-2 shadow-lg transition-shadow ${COLORS[n.color]} ${sel === n.id ? "ring-2 ring-primary" : ""} ${tool === "select" ? "cursor-move" : ""}`}
              style={{ left: n.x, top: n.y, width: NW }}
            >
              <div className="-mx-2 -mt-2 mb-1 flex h-5 cursor-move items-center justify-between rounded-t-md px-2 text-[9px] uppercase tracking-wider text-muted-foreground" title="Drag to move">
                <span className="flex items-center gap-1">{n.ai && <><Sparkles className="h-2.5 w-2.5" />AI</>}</span>
                <span className="tracking-[0.2em]">⋮⋮</span>
              </div>
              <textarea
                value={n.text} placeholder="Type an idea…"
                onChange={(e) => patch(n.id, { text: e.target.value })}
                rows={Math.max(2, Math.ceil(n.text.length / 28))}
                className="w-full cursor-text resize-none bg-transparent text-xs leading-5 text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {busy === n.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            </div>
          ))}
          {Object.entries(sections).flatMap(([key, rect]) => (["top", "right", "bottom", "left"] as ConnectionSide[]).map((side) => {
            const point = sectionAnchor(rect, side);
            const title = CANVAS_BOXES.find((b) => b.key === key)?.title || AGENTS.find((a) => a.key === key)?.title || "Brainstorm area";
            return <Button key={`${key}-${side}`} data-ui data-connection-port data-section-key={key} data-side={side} size="icon" variant="outline"
              aria-label={`Connect ${title} ${side}`} title={`Connect ${title} · ${side}`}
              className={`absolute z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background p-0 text-primary hover:bg-primary hover:text-primary-foreground ${connectFrom === key ? "bg-primary text-primary-foreground" : ""}`}
              style={{ left: point.x, top: point.y }}
              onPointerDown={(e) => {
                e.stopPropagation(); e.preventDefault();
                if (e.button !== 0) return;
                if (connectFrom) { connectSection(key, side); return; }
                setSel(null); setSelectedConnection(null); setConnectFrom(key); setConnectSide(side); setConnectionPoint(point);
                connectionDrag.current = { key, side, x: e.clientX, y: e.clientY };
                wrap.current?.setPointerCapture(e.pointerId);
              }}
              onClick={(e) => { if (e.detail === 0) connectSection(key, side); }}><Plus className="h-3 w-3" /></Button>;
          }))}
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

        {connectFrom && <div data-ui className="glass-surface absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-2 rounded-md border border-primary px-3 py-2 text-xs"><GitBranch className="h-4 w-4 text-primary" /><span>{CANVAS_BOXES.find((b) => b.key === connectFrom)?.title || AGENTS.find((a) => a.key === connectFrom)?.title || "Brainstorm"} →</span><Button size="icon" variant="ghost" className="h-7 w-7" title="Cancel connection" onClick={() => setConnectFrom(null)}><X className="h-4 w-4" /></Button></div>}
        {selectedConnection && <div data-ui className="glass-surface absolute left-1/2 top-4 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-2 rounded-md border border-border p-2">
          <GitBranch className="h-4 w-4 shrink-0 text-primary" />
          <input aria-label="Connection label" placeholder="Relationship…" maxLength={80} className="min-w-0 w-48 bg-transparent text-sm outline-none" value={connections.find((c) => c.id === selectedConnection)?.label || ""} onChange={(e) => setConnections((cs) => cs.map((c) => c.id === selectedConnection ? { ...c, label: e.target.value } : c))} />
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Delete connection" onClick={() => { setConnections((cs) => cs.filter((c) => c.id !== selectedConnection)); setSelectedConnection(null); }}><Trash2 className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Close connection editor" onClick={() => setSelectedConnection(null)}><X className="h-4 w-4" /></Button>
        </div>}
        {/* selection bar */}
        {selected && (
          <div data-ui className="glass-surface absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-border p-1.5 animate-fade-in">
            <span className="px-2 text-xs text-muted-foreground">{zoneOf(selected) ? CANVAS_BOXES.find((b) => b.key === zoneOf(selected))?.title : frameOf(selected) ? AGENTS.find((a) => a.key === frameOf(selected))?.title : "Brainstorm"}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button size="sm" variant="ghost" className="h-8 text-primary"><Wand2 className="h-3.5 w-3.5" />AI on this note</Button></DropdownMenuTrigger>
              <DropdownMenuContent>
                {ACTIONS.map((a) => <DropdownMenuItem key={a.id} onClick={() => runAI(zoneOf(selected) || (AGENTS.find((x) => x.key === frameOf(selected))?.box as BoxKey) || "solution", a.id, selected)}>{a.label}</DropdownMenuItem>)}
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
