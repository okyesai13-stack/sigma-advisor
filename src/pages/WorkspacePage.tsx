import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, LayoutGrid, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Seo from "@/components/Seo";

const TABLES = ["market_research_result", "competitor_analysis_result", "business_plan_result", "financial_model_result", "marketing_strategy_result", "ai_operations_result"] as const;

interface Row { id: string; business_name: string; pitch: string; stage: string; industry: string | null; created_at: string; done: number; hasCanvas: boolean; }

const WorkspacePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: biz } = await supabase.from("business_store").select("id, business_name, pitch, stage, industry, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
      const ids = (biz || []).map((b) => b.id);
      const counts: Record<string, number> = {};
      let canvasIds = new Set<string>();
      if (ids.length) {
        const res = await Promise.all(TABLES.map((t) => supabase.from(t).select("business_id").in("business_id", ids)));
        res.forEach((r) => new Set((r.data || []).map((x: any) => x.business_id)).forEach((id) => { counts[id] = (counts[id] || 0) + 1; }));
        const { data: c } = await supabase.from("lean_canvas").select("business_id").in("business_id", ids);
        canvasIds = new Set((c || []).map((x) => x.business_id));
      }
      setRows((biz || []).map((b) => ({ ...b, done: counts[b.id] || 0, hasCanvas: canvasIds.has(b.id) })));
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 animate-fade-in">
      <Seo title="Workspace — Planz" description="All your business analyses and Lean Canvas boards." path="/workspace" noindex />
      <p className="eyebrow">Workspace</p>
      <h1 className="mt-1 font-display text-3xl font-semibold">All analyses</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Open any brief to work on its Lean Canvas with the AI.</p>

      {loading ? (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <button onClick={() => navigate("/setup")} className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border bg-card/40 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
            <Plus className="h-6 w-6" /><span className="text-sm font-medium">New brief</span>
          </button>
          {rows.map((r) => (
            <button key={r.id} onClick={() => navigate(`/workspace/${r.id}`)} className="interactive-panel group flex min-h-[180px] flex-col rounded-md border border-border bg-card p-5 text-left transition-colors hover:border-primary/50">
              <div className="flex items-center justify-between">
                <span className="eyebrow">{r.stage}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold group-hover:text-primary">{r.business_name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.pitch}</p>
              <div className="mt-auto pt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{r.industry || "—"}</span><span>{r.done}/6 agents</span>
                </div>
                <div className="h-1 overflow-hidden rounded bg-border"><div className="h-full bg-primary" style={{ width: `${(r.done / 6) * 100}%` }} /></div>
                <p className="mt-3 flex items-center gap-1 text-xs font-medium text-primary"><LayoutGrid className="h-3.5 w-3.5" />{r.hasCanvas ? "Open canvas" : "Start canvas"}<ArrowRight className="h-3 w-3" /></p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
