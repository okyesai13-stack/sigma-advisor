import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, AlertTriangle, ArrowRight } from "lucide-react";

type Status = "pending" | "running" | "completed" | "error";
type AgentId = "market_research" | "competitor_analysis" | "business_plan" | "financial_model";

const AGENTS: { id: AgentId; num: string; name: string; endpoint: string; desc: string }[] = [
  { id: "market_research", num: "01", name: "Market Research", endpoint: "market-research", desc: "Sizing the opportunity and reading the market" },
  { id: "competitor_analysis", num: "02", name: "Competitor Analysis", endpoint: "competitor-analysis", desc: "Mapping the field and finding white space" },
  { id: "business_plan", num: "03", name: "Business Plan", endpoint: "business-plan", desc: "Drafting strategy, GTM, and milestones" },
  { id: "financial_model", num: "04", name: "Financial Model", endpoint: "financial-model", desc: "Building projections and unit economics" },
];

const SigmaNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { business } = useResume();
  const [status, setStatus] = useState<Record<AgentId, Status>>({
    market_research: "pending",
    competitor_analysis: "pending",
    business_plan: "pending",
    financial_model: "pending",
  });
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    if (!business) {
      navigate("/setup");
      return;
    }
    runAll();
  }, [business?.id]);

  const runAgent = async (a: typeof AGENTS[number]) => {
    setStatus((p) => ({ ...p, [a.id]: "running" }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `https://chxelpkvtnlduzlkauep.supabase.co/functions/v1/${a.endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
          },
          body: JSON.stringify({ business_id: business!.id }),
        }
      );
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || `${a.name} failed`);
      setStatus((p) => ({ ...p, [a.id]: "completed" }));
    } catch (e: any) {
      console.error(`${a.id} error:`, e);
      setStatus((p) => ({ ...p, [a.id]: "error" }));
    }
  };

  const runAll = async () => {
    await Promise.all(AGENTS.map(runAgent));
    setAllDone(true);
    toast({ title: "Strategy session complete", description: "Your dossier is ready." });
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
      <header className="border-b hairline">
        <div className="px-6 h-14 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Step 2 of 2 — Strategy Session</span>
          {allDone && (
            <Button onClick={() => navigate("/dashboard")} size="sm" className="rounded-none text-xs uppercase tracking-[0.15em]">
              Open dossier <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </header>

      <main className="px-6 md:px-12 py-16 max-w-4xl mx-auto">
        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">In session — № 002</p>
          <h1 className="font-serif text-5xl md:text-6xl leading-tight mb-4">The office is convened.</h1>
          {business && (
            <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
              Four agents are working on <em className="font-serif italic">{business.business_name}</em>. Each runs in parallel, drawing on Gemini 3 to brief their findings.
            </p>
          )}
        </div>

        <div className="border-y hairline divide-y divide-border">
          {AGENTS.map((a) => {
            const s = status[a.id];
            return (
              <div key={a.id} className="py-8 grid grid-cols-12 gap-6 items-start">
                <span className="col-span-2 font-serif text-3xl text-muted-foreground">{a.num}</span>
                <div className="col-span-7">
                  <h3 className="font-serif text-2xl mb-1">{a.name}</h3>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                  {s === "error" && (
                    <button onClick={() => retry(a.id)} className="text-xs underline underline-offset-4 mt-2 text-destructive">
                      Retry agent
                    </button>
                  )}
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <StatusIcon s={s} />
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
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
            <Button onClick={() => navigate("/dashboard")} size="lg" className="h-12 px-10 rounded-none text-xs uppercase tracking-[0.15em]">
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
