import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, ShieldAlert, RefreshCw, ArrowLeft, Skull, Eye, Send, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { cn } from "@/lib/utils";
import { riskLevel, scoreChange, type StressRisk, type KillerRisk } from "@/lib/stressTest";

interface Test { id: string; score: number; verdict: string; reason: string; risks: StressRisk[]; killers: KillerRisk[]; blind_spots: string[]; created_at: string }

const levelCls = { red: "border-destructive/40 bg-destructive/10 text-destructive", amber: "border-warning/40 bg-warning/10 text-warning", green: "border-success/40 bg-success/10 text-success" };

const StressTestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: b }, { data: t }] = await Promise.all([
        supabase.from("business_store").select("business_name").eq("id", id).maybeSingle(),
        supabase.from("idea_stress_test" as any).select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(2),
      ]);
      setName(b?.business_name || "");
      setTests((t as any) || []);
      setLoading(false);
    })();
  }, [id]);

  const run = async () => {
    if (!id || running) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("stress-test", { body: { business_id: id } });
      if (error || data?.error) {
        let msg = data?.error;
        try { msg = msg || (await (error as any)?.context?.json())?.error; } catch { /* ignore */ }
        throw new Error(msg || "Stress test failed");
      }
      setTests((p) => [data, ...p].slice(0, 2));
    } catch (e) {
      toast({ title: "Stress test failed", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally { setRunning(false); }
  };

  const sendToBoard = async (r: StressRisk) => {
    if (!id) return;
    const { data } = await supabase.from("lean_canvas").select("boxes").eq("business_id", id).maybeSingle();
    const boxes: any = data?.boxes || {};
    const board = boxes.__board || {};
    const tasks = Array.isArray(board.tasks) ? board.tasks : [];
    const next = { ...boxes, __board: { ...board, tasks: [...tasks, { id: crypto.randomUUID(), text: `${r.area}: ${r.fix}`.slice(0, 200), owner: "", due: "", status: "todo" }] } };
    const { error } = await supabase.from("lean_canvas").upsert({ business_id: id, boxes: next }, { onConflict: "business_id" });
    if (error) { toast({ title: "Couldn't add task", variant: "destructive" }); return; }
    setSent((s) => new Set(s).add(r.area));
    toast({ title: "Added to your board's action tracker" });
  };

  const cur = tests[0];
  const delta = cur ? scoreChange(cur.score, tests[1]?.score) : null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 animate-fade-in">
      <Seo title="Idea Stress Test — Planz" description="AI investor stress test of your startup idea." path={`/stress-test/${id}`} noindex />
      <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" />Back</button>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Idea stress test</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">{name || "Your idea"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">A tough investor reads all your agent results and your board, then shows where this idea could fail.</p>
        </div>
        <Button onClick={run} disabled={running || loading}>
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : cur ? <RefreshCw className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          {running ? "Testing..." : cur ? "Re-test" : "Run stress test"}
        </Button>
      </div>

      {loading ? (
        <div className="grid h-40 place-items-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : !cur ? (
        <div className="mt-10 rounded-md border border-dashed border-border bg-card/40 p-10 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-primary" />
          <p className="mt-3 font-display text-lg font-semibold">No stress test yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Run it to get your survival score, killer risks and a fix plan. Takes about 20 seconds.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-8">
          <section className="panel-surface grid gap-6 rounded-md border border-border p-6 md:grid-cols-[180px_1fr]">
            <div className="text-center">
              <p className="eyebrow">Survival score</p>
              <p className="font-display text-6xl font-semibold text-primary">{cur.score}</p>
              <p className="text-sm font-medium">{cur.verdict}</p>
              {delta !== null && delta !== 0 && (
                <p className={cn("mt-1 flex items-center justify-center gap-1 text-xs", delta > 0 ? "text-success" : "text-destructive")}>
                  {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{delta > 0 ? "+" : ""}{delta} since last test
                </p>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-base leading-7">{cur.reason}</p>
              <p className="mt-3 text-xs text-muted-foreground">Tested {new Date(cur.created_at).toLocaleString()}</p>
            </div>
          </section>

          <section>
            <p className="eyebrow mb-3 flex items-center gap-2"><Skull className="h-3.5 w-3.5" />Killer risks</p>
            <div className="grid gap-3 md:grid-cols-3">
              {cur.killers.map((k, i) => (
                <div key={i} className="rounded-md border border-destructive/30 bg-card p-4">
                  <p className="font-display font-semibold">{k.risk}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="text-warning">Warning sign:</span> {k.warning_sign}</p>
                  <p className="mt-2 text-xs text-muted-foreground"><span className="text-primary">Test this week:</span> {k.test}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <p className="eyebrow mb-3">8 risk areas & fix plan</p>
            <div className="grid gap-3 md:grid-cols-2">
              {cur.risks.map((r) => {
                const lv = riskLevel(r.score);
                return (
                  <div key={r.area} className="rounded-md border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display font-semibold">{r.area}</p>
                      <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", levelCls[lv])}>{r.score}/10</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{r.why}</p>
                    <p className="mt-2 text-sm italic">"{r.question}"</p>
                    {lv !== "green" && (
                      <div className="mt-3 flex items-start justify-between gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs"><span className="font-medium text-primary">Fix: </span>{r.fix}</p>
                        <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" disabled={sent.has(r.area)} onClick={() => sendToBoard(r)}>
                          <Send className="h-3 w-3" />{sent.has(r.area) ? "Sent" : "Send to board"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {cur.blind_spots.length > 0 && (
            <section>
              <p className="eyebrow mb-3 flex items-center gap-2"><Eye className="h-3.5 w-3.5" />Blind spots</p>
              <ul className="space-y-2">
                {cur.blind_spots.map((b, i) => <li key={i} className="rounded-md border border-warning/30 bg-card px-4 py-3 text-sm">{b}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default StressTestPage;
