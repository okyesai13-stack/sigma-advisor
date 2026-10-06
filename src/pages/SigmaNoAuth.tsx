import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, AlertTriangle, ArrowRight, Radar, BarChart3, Bot, LineChart, RotateCcw, Megaphone, Cpu } from "lucide-react";
import Seo from "@/components/Seo";

type Status = "pending" | "running" | "completed" | "error";
type AgentId = "market_research" | "competitor_analysis" | "business_plan" | "financial_model" | "marketing_strategy" | "ai_operations";

const AGENTS = [
  { id: "market_research" as AgentId, num: "01", icon: Radar, name: "Market Research", endpoint: "market-research", desc: "Sizing the opportunity and reading the market" },
  { id: "competitor_analysis" as AgentId, num: "02", icon: BarChart3, name: "Competitor Analysis", endpoint: "competitor-analysis", desc: "Mapping the field and finding white space" },
  { id: "business_plan" as AgentId, num: "03", icon: Bot, name: "Business Plan", endpoint: "business-plan", desc: "Drafting strategy, GTM, and milestones" },
  { id: "financial_model" as AgentId, num: "04", icon: LineChart, name: "Financial Model", endpoint: "financial-model", desc: "Building projections and unit economics" },
  { id: "marketing_strategy" as AgentId, num: "05", icon: Megaphone, name: "Marketing Strategy", endpoint: "marketing-strategy", desc: "Planning positioning, channels, and campaigns" },
  { id: "ai_operations" as AgentId, num: "06", icon: Cpu, name: "AI Operations & Automation", endpoint: "ai-operations", desc: "Finding pain points AI can automate, with tools and ROI" },
];

const SigmaNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { business, isReady } = useResume();
  const [status, setStatus] = useState<Record<AgentId, Status>>({
    market_research: "pending",
    competitor_analysis: "pending",
    business_plan: "pending",
    financial_model: "pending",
    marketing_strategy: "pending",
    ai_operations: "pending",
  });
  const [allDone, setAllDone] = useState(false);
  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!business) {
      navigate("/setup");
      return;
    }
    if (startedFor.current === business.id) return;
    startedFor.current = business.id;
    runAll();
  }, [business?.id, isReady]);

  const runAgent = async (a: typeof AGENTS[number]): Promise<boolean> => {
    if (!business) return false;
    setStatus((p) => ({ ...p, [a.id]: "running" }));
    try {
      const { data, error } = await supabase.functions.invoke(a.endpoint, {
        body: { business_id: business.id },
      });
      if (error) {
        let msg = error.message;
        try { const b = await (error as any).context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
        throw new Error(msg);
      }
      if (!data?.success) throw new Error(data?.error || `${a.name} failed`);
      setStatus((p) => ({ ...p, [a.id]: "completed" }));
      return true;
    } catch (e: any) {
      console.error(`${a.id} error:`, e);
      setStatus((p) => ({ ...p, [a.id]: "error" }));
      toast({ title: `${a.name} failed`, description: e?.message || "Please retry this agent.", variant: "destructive" });
      return false;
    }
  };

  const runAll = async () => {
    const results = await Promise.all(AGENTS.map(runAgent));
    setAllDone(true);
    const ok = results.filter(Boolean).length;
    toast(ok === AGENTS.length
      ? { title: "Strategy session complete", description: "Your dossier is ready." }
      : { title: `${ok} of ${AGENTS.length} agents filed`, description: "Retry the failed agents or open the dossier." });
  };

  const retry = (id: AgentId) => {
    const a = AGENTS.find((x) => x.id === id);
    if (a) runAgent(a);
  };

  const StatusIcon = ({ s }: { s: Status }) => {
    if (s === "completed") return <Check className="w-4 h-4" />;
    if (s === "running") return <Loader2 className="w-4 h-4 animate-spin" />;
    if (s === "error") return <AlertTriangle className="w-4 h-4" />;
    return <span className="w-4 h-4 inline-block rounded-full border hairline" />;
  };

  return (
    <div className="min-h-full bg-background">
      <Seo
        title="Strategy Console — Planz"
        description="Watch the six Planz AI agents — market research, competitor analysis, business plan, financial model, marketing strategy, and AI operations — work in parallel."
        path="/sigma"
        noindex
      />
      <header className="border-b border-border bg-card/30">
        <div className="px-6 h-14 flex items-center justify-between">
          <span className="eyebrow">Step 2 of 2 — Strategy session</span>
          {allDone && (
            <Button onClick={() => navigate("/dashboard")} size="sm">
              Open dossier <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-12 md:px-12 md:py-16">
        <div className="mb-10 animate-slide-up">
          <div className="mb-5 flex items-center gap-2"><span className="signal-dot animate-pulse" /><p className="eyebrow text-primary">Agents in session</p></div>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">The office is convened.</h1>
          {business && (
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
              Five agents are working on <strong className="font-medium text-foreground">{business.business_name}</strong>. Each runs in parallel to brief their findings.
            </p>
          )}
        </div>

        <div className="grid gap-3">
          {AGENTS.map((a) => {
            const s = status[a.id];
            return (
              <div key={a.id} className={`grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg border p-5 transition-all md:grid-cols-[auto_1fr_auto] ${s === 'running' ? 'border-primary/50 bg-primary/5 shadow-glow' : 'border-border bg-card'}`}>
                <div className="grid h-11 w-11 place-items-center rounded-md bg-background text-primary"><a.icon className="h-5 w-5" /></div>
                <div>
                  <div className="mb-1 flex items-center gap-3"><span className="text-xs text-muted-foreground">{a.num}</span><h3 className="font-display text-lg font-semibold">{a.name}</h3></div>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                  {s === "error" && (
                    <Button onClick={() => retry(a.id)} variant="ghost" size="sm" className="mt-2 text-destructive"><RotateCcw /> Retry agent</Button>
                  )}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-1">
                  <StatusIcon s={s} />
                  <span className="eyebrow">
                    {s === "pending" && "Queued"}
                    {s === "running" && "Working"}
                    {s === "completed" && "Filed"}
                    {s === "error" && "Failed"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {allDone && (
          <div className="mt-12 text-center">
            <Button onClick={() => navigate("/dashboard")} size="lg">
              Open the strategy dossier
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default SigmaNoAuth;
