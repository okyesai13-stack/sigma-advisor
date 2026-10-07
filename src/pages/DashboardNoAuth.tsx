import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, RefreshCw, Plus, TrendingUp, Target, BarChart3, WalletCards, Megaphone, Cpu } from "lucide-react";
import Seo from "@/components/Seo";

type Json = any;

interface MarketRes { market_size: Json; tam_sam_som: Json; trends: Json[]; target_audience: Json[]; opportunities: Json[]; risks: Json[]; summary: string | null; }
interface CompRes { competitors: any[]; swot: Json; positioning: Json; differentiation: any[]; summary: string | null; }
interface PlanRes { executive_summary: string | null; value_proposition: string | null; business_model: Json; go_to_market: Json; milestones: any[]; risks: any[]; team_needs: any[]; }
interface FinRes { revenue_streams: any[]; cost_structure: any[]; projections_3yr: any[]; unit_economics: Json; funding_needs: Json; key_assumptions: any[]; summary: string | null; }

const DOSSIER_SUMMARY = [
  { icon: TrendingUp, title: "Market", label: "Research filed", key: "market" },
  { icon: Target, title: "Position", label: "Competitive map", key: "comp" },
  { icon: BarChart3, title: "Plan", label: "Roadmap ready", key: "plan" },
  { icon: WalletCards, title: "Finance", label: "Model prepared", key: "fin" },
  { icon: Megaphone, title: "Marketing", label: "Strategy ready", key: "mkt" },
  { icon: Cpu, title: "AI Ops", label: "Blueprint ready", key: "aio" },
] as const;

const DashboardNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { business, clearSession, isReady, reload, setBusiness, resultsVersion } = useResume();
  const [allBiz, setAllBiz] = useState<any[]>([]);
  useEffect(() => {
    if (!isReady) return;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.from("business_store")
        .select("id, business_name, pitch, stage, industry, target_market, geography, created_at")
        .eq("user_id", session.user.id).order("created_at", { ascending: false });
      setAllBiz(data || []);
    })();
  }, [isReady, business?.id]);

  const [loading, setLoading] = useState(true);
  const [triedReload, setTriedReload] = useState(false);
  const [market, setMarket] = useState<MarketRes | null>(null);
  const [comp, setComp] = useState<CompRes | null>(null);
  const [plan, setPlan] = useState<PlanRes | null>(null);
  const [fin, setFin] = useState<FinRes | null>(null);
  const [mkt, setMkt] = useState<any | null>(null);
  const [aio, setAio] = useState<any | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!business) {
      if (!triedReload) {
        // Business may not be in memory yet — fetch the latest one before giving up.
        setTriedReload(true);
        reload().catch(() => {});
        return;
      }
      setLoading(false);
      return;
    }
    loadAll();
  }, [business?.id, isReady, triedReload]);

  useEffect(() => {
    if (resultsVersion > 0 && business?.id) loadAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultsVersion]);

  const loadAll = async (silent = false) => {
    if (!business) return;
    if (!silent) setLoading(true);
    try {
      const [m, c, p, f, mk, ai] = await Promise.all([
        supabase.from("market_research_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("competitor_analysis_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("business_plan_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("financial_model_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        (supabase as any).from("marketing_strategy_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        (supabase as any).from("ai_operations_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
      setAio(ai.data as any);
      setMkt(mk.data as any);
      setMarket(m.data as any);
      setComp(c.data as any);
      setPlan(p.data as any);
      setFin(f.data as any);
    } catch (e) {
      toast({ title: "Failed to load dossier", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (key: string) => {
    document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading || (!business && !triedReload)) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">Loading your strategy dossier</p></div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-full flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="eyebrow mb-3 text-primary">Strategy dossier</p>
          <h1 className="mb-3 font-display text-3xl font-semibold">No brief on file yet.</h1>
          <p className="text-muted-foreground mb-6">File a business brief and convene the agents to build your dossier.</p>
          <Button onClick={() => navigate("/setup")}>
            File a brief <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const hasAny = market || comp || plan || fin || mkt || aio;

  return (
    <div className="min-h-full bg-background">
      <Seo
        title="Strategy Dashboard — Planz"
        description="Your complete AI-generated strategy dossier: market research, competitor analysis, business plan, financial model, marketing strategy, and AI operations blueprint."
        path="/dashboard"
        noindex
      />
      {/* Header strip */}
      <header className="border-b border-border bg-card/30">
        <div className="px-5 py-8 md:px-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="eyebrow mb-2 text-primary">Strategy dossier</p>
              <h1 className="font-display text-4xl font-semibold leading-tight md:text-5xl">{business.business_name}</h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">{business.pitch}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border bg-card px-3 py-1.5">Stage · {business.stage}</span>
                {business.industry && <span className="rounded-full border border-border bg-card px-3 py-1.5">Industry · {business.industry}</span>}
                {business.target_market && <span className="rounded-full border border-border bg-card px-3 py-1.5">Market · {business.target_market}</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => navigate(`/setup?edit=${business.id}`)}>
                <RefreshCw className="w-3.5 h-3.5" /> Update & re-run
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { clearSession(); navigate("/setup"); }}>
                <Plus /> New brief
              </Button>
            </div>
          </div>
        </div>
      </header>

      {allBiz.length > 1 && (
        <div className="border-b border-border px-5 py-4 md:px-10">
          <p className="eyebrow mb-3">All analyses ({allBiz.length})</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allBiz.map((b) => (
              <button key={b.id} onClick={() => { const { created_at, ...rest } = b; setBusiness(rest); window.scrollTo({ top: 0 }); }}
                className={`shrink-0 rounded-md border px-4 py-2.5 text-left transition-colors ${b.id === business.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"}`}>
                <p className="text-sm font-semibold">{b.business_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleDateString()} · {b.stage}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!hasAny && (
        <div className="px-6 md:px-10 py-20 text-center">
          <p className="text-muted-foreground mb-6">No analysis yet for this business.</p>
          <Button onClick={() => navigate("/sigma")}>
            Run the strategy session <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {hasAny && <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-2 md:px-10 xl:grid-cols-6">
        {DOSSIER_SUMMARY.map(({ icon: Icon, title, label, key }) => { const ready = key === "market" ? !!market : key === "comp" ? !!comp : key === "plan" ? !!plan : key === "fin" ? !!fin : key === "aio" ? !!aio : !!mkt; return <button key={title} onClick={() => scrollToSection(key)} className="group flex items-center gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-card/80"><span className="grid h-9 w-9 place-items-center rounded bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><div><p className="text-xs font-semibold transition-colors group-hover:text-primary">{title}</p><p className="text-xs text-muted-foreground">{ready ? label : 'Pending'}</p></div></button>; })}
      </div>}
      <div className="space-y-16 px-5 py-10 md:px-10">
        {/* Executive Summary */}
        {plan?.executive_summary && (
          <Section number="I." title="Executive Summary" id="section-summary">
            <p className="max-w-4xl text-balance font-display text-2xl font-medium leading-snug md:text-3xl">
              {plan.executive_summary}
            </p>
            {plan.value_proposition && (
              <div className="mt-8 pt-8 border-t hairline">
                <Label>Value proposition</Label>
                <p className="text-lg leading-relaxed mt-2 max-w-3xl">{plan.value_proposition}</p>
              </div>
            )}
          </Section>
        )}

        {/* Market Research */}
        {market && (
          <Section number="II." title="Market Research" id="section-market">
            {market.summary && <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-3xl">{market.summary}</p>}

            {market.tam_sam_som && (
              <div className="mb-8 grid gap-3 md:grid-cols-3">
                {["tam", "sam", "som"].map((k) => (
                  <div key={k} className="rounded-md border border-border bg-card p-6">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{k.toUpperCase()}</p>
                    <p className="font-display text-3xl font-semibold text-primary">{market.tam_sam_som?.[k]?.value || "—"}</p>
                    {market.tam_sam_som?.[k]?.note && <p className="text-xs text-muted-foreground mt-2">{market.tam_sam_som[k].note}</p>}
                  </div>
                ))}
              </div>
            )}

            <Grid2>
              <Block title="Key trends">
                <Bullets items={(market.trends || []).map((t: any) => typeof t === "string" ? t : (t.title || t.trend || JSON.stringify(t)))} />
              </Block>
              <Block title="Target audience">
                <Bullets items={(market.target_audience || []).map((a: any) => typeof a === "string" ? a : (a.segment || a.title || a.name || JSON.stringify(a)))} />
              </Block>
              <Block title="Opportunities">
                <Bullets items={(market.opportunities || []).map((o: any) => typeof o === "string" ? o : (o.title || o.opportunity || JSON.stringify(o)))} />
              </Block>
              <Block title="Risks">
                <Bullets items={(market.risks || []).map((r: any) => typeof r === "string" ? r : (r.title || r.risk || JSON.stringify(r)))} />
              </Block>
            </Grid2>
          </Section>
        )}

        {/* Competitor Analysis */}
        {comp && (
          <Section number="III." title="Competitor Analysis" id="section-comp">
            {comp.summary && <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-3xl">{comp.summary}</p>}

            {comp.competitors?.length > 0 && (
              <div className="border-y hairline divide-y divide-border mb-10">
                {comp.competitors.map((c: any, i: number) => (
                  <div key={i} className="py-5 grid grid-cols-12 gap-4">
                    <span className="col-span-1 font-serif text-xl text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                    <div className="col-span-4">
                      <h4 className="font-serif text-xl">{c.name || c.company}</h4>
                      {c.type && <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground mt-1">{c.type}</p>}
                    </div>
                    <div className="col-span-7">
                      <p className="text-sm text-muted-foreground leading-relaxed">{c.description || c.positioning || c.notes}</p>
                      {c.strengths && <p className="text-xs mt-2"><span className="uppercase tracking-[0.15em] text-muted-foreground">Strength — </span>{Array.isArray(c.strengths) ? c.strengths.join(", ") : c.strengths}</p>}
                      {c.weaknesses && <p className="text-xs mt-1"><span className="uppercase tracking-[0.15em] text-muted-foreground">Weakness — </span>{Array.isArray(c.weaknesses) ? c.weaknesses.join(", ") : c.weaknesses}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {comp.swot && (
              <div className="mb-8 grid gap-3 md:grid-cols-2">
                {(["strengths", "weaknesses", "opportunities", "threats"] as const).map((k) => (
                  <div key={k} className="rounded-md border border-border bg-card p-6">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">{k}</p>
                    <Bullets items={comp.swot?.[k] || []} />
                  </div>
                ))}
              </div>
            )}

            {comp.differentiation && comp.differentiation.length > 0 && (
              <Block title="Differentiation">
                <Bullets items={comp.differentiation.map((d: any) => typeof d === "string" ? d : (d.title || d.angle || JSON.stringify(d)))} />
              </Block>
            )}
          </Section>
        )}

        {/* Business Plan */}
        {plan && (plan.business_model || plan.go_to_market || plan.milestones?.length) && (
          <Section number="IV." title="Business Plan" id="section-plan">
            {plan.business_model && (
              <Block title="Business model">
                <KeyValue obj={plan.business_model} />
              </Block>
            )}
            {plan.go_to_market && (
              <Block title="Go-to-market">
                <KeyValue obj={plan.go_to_market} />
              </Block>
            )}
            <Grid2>
              {plan.milestones?.length > 0 && (
                <Block title="Milestones">
                  <ol className="space-y-3">
                    {plan.milestones.map((m: any, i: number) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-serif text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <p className="font-medium">{m.title || m.milestone || m.name}</p>
                          {m.timeline && <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{m.timeline}</p>}
                          {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Block>
              )}
              {plan.risks?.length > 0 && (
                <Block title="Risk register">
                  <Bullets items={plan.risks.map((r: any) => typeof r === "string" ? r : (r.title || r.risk || JSON.stringify(r)))} />
                </Block>
              )}
              {plan.team_needs?.length > 0 && (
                <Block title="Team needs">
                  <Bullets items={plan.team_needs.map((t: any) => typeof t === "string" ? t : (t.role || t.title || JSON.stringify(t)))} />
                </Block>
              )}
            </Grid2>
          </Section>
        )}

        {/* Financial Model */}
        {fin && (
          <Section number="V." title="Financial Model" id="section-fin">
            {fin.summary && <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-3xl">{fin.summary}</p>}

            {fin.projections_3yr?.length > 0 && (
              <Block title="3-Year projections">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b hairline">
                        <th className="text-left py-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-normal">Year</th>
                        <th className="text-right py-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-normal">Revenue</th>
                        <th className="text-right py-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-normal">Costs</th>
                        <th className="text-right py-3 text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-normal">Profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fin.projections_3yr.map((y: any, i: number) => (
                        <tr key={i} className="border-b hairline">
                          <td className="py-3 font-serif text-lg">{y.year || `Year ${i + 1}`}</td>
                          <td className="text-right">{y.revenue || "—"}</td>
                          <td className="text-right">{y.costs || y.expenses || "—"}</td>
                          <td className="text-right font-medium">{y.profit || y.net_income || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Block>
            )}

            <Grid2>
              {fin.revenue_streams?.length > 0 && (
                <Block title="Revenue streams">
                  <Bullets items={fin.revenue_streams.map((r: any) => typeof r === "string" ? r : `${r.name || r.stream}${r.amount ? ` — ${r.amount}` : ""}`)} />
                </Block>
              )}
              {fin.cost_structure?.length > 0 && (
                <Block title="Cost structure">
                  <Bullets items={fin.cost_structure.map((c: any) => typeof c === "string" ? c : `${c.category || c.name}${c.amount ? ` — ${c.amount}` : ""}`)} />
                </Block>
              )}
              {fin.unit_economics && (
                <Block title="Unit economics">
                  <KeyValue obj={fin.unit_economics} />
                </Block>
              )}
              {fin.funding_needs && (
                <Block title="Funding needs">
                  <KeyValue obj={fin.funding_needs} />
                </Block>
              )}
            </Grid2>

            {fin.key_assumptions?.length > 0 && (
              <Block title="Key assumptions">
                <Bullets items={fin.key_assumptions.map((a: any) => typeof a === "string" ? a : JSON.stringify(a))} />
              </Block>
            )}
          </Section>
        )}
        {/* Marketing Strategy */}
        {mkt && (
          <Section number="VI." title="Marketing Plan & Strategy" id="section-mkt">
            {mkt.summary && <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-3xl">{mkt.summary}</p>}
            {mkt.positioning && Object.keys(mkt.positioning).length > 0 && (
              <Block title="Positioning"><KeyValue obj={mkt.positioning} /></Block>
            )}
            {mkt.personas?.length > 0 && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {mkt.personas.map((p: any, i: number) => (
                  <div key={i} className="rounded-md border border-border bg-card p-5">
                    <p className="eyebrow text-primary">Persona {String(i + 1).padStart(2, "0")}</p>
                    <h4 className="mt-2 font-display text-lg font-semibold">{p.name}</h4>
                    {p.description && <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>}
                    {p.pain_points && <p className="mt-3 text-xs"><span className="text-muted-foreground uppercase tracking-[0.15em]">Pain — </span>{p.pain_points}</p>}
                    {p.where_to_reach && <p className="mt-1 text-xs"><span className="text-muted-foreground uppercase tracking-[0.15em]">Reach — </span>{p.where_to_reach}</p>}
                  </div>
                ))}
              </div>
            )}
            {mkt.channels?.length > 0 && (
              <div className="mt-3"><Block title="Channel mix">
                <div className="divide-y divide-border">
                  {mkt.channels.map((c: any, i: number) => (
                    <div key={i} className="grid gap-2 py-3 text-sm md:grid-cols-[1fr_auto_2fr_auto] md:items-center md:gap-4">
                      <span className="font-medium">{c.channel}</span>
                      <span className="w-fit rounded-full border border-border px-2 py-0.5 text-xs text-primary">{c.priority}</span>
                      <span className="text-muted-foreground">{c.tactic}</span>
                      <span className="font-display font-semibold">{c.budget_share}</span>
                    </div>
                  ))}
                </div>
              </Block></div>
            )}
            <Grid2>
              {mkt.content_pillars?.length > 0 && (
                <Block title="Content pillars">
                  <Bullets items={mkt.content_pillars.map((c: any) => typeof c === "string" ? c : `${c.pillar}${c.examples ? ` — ${c.examples}` : ""}`)} />
                </Block>
              )}
              {mkt.campaigns?.length > 0 && (
                <Block title="Campaigns">
                  <Bullets items={mkt.campaigns.map((c: any) => typeof c === "string" ? c : `${c.name}: ${c.objective || ""}${c.timeline ? ` (${c.timeline})` : ""}`)} />
                </Block>
              )}
              {mkt.kpis?.length > 0 && (
                <Block title="KPIs">
                  <Bullets items={mkt.kpis.map((k: any) => typeof k === "string" ? k : `${k.metric} — ${k.target}`)} />
                </Block>
              )}
              {mkt.budget && Object.keys(mkt.budget).length > 0 && (
                <Block title="Marketing budget"><KeyValue obj={mkt.budget} /></Block>
              )}
            </Grid2>
            {mkt.roadmap_90_days?.length > 0 && (
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {mkt.roadmap_90_days.map((r: any, i: number) => (
                  <div key={i} className="rounded-md border border-border bg-card/60 p-5">
                    <p className="eyebrow text-primary">{r.phase}</p>
                    <p className="mt-2 font-medium">{r.focus}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{r.actions}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}
        {/* AI Operations */}
        {aio && (
          <Section number="VII." title="AI Operations & Automation Blueprint" id="section-aio">
            {aio.summary && <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-3xl">{aio.summary}</p>}
            <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["AI readiness", aio.readiness?.score != null ? `${aio.readiness.score}/100` : "—", aio.readiness?.level],
                ["Hours saved / week", aio.roi?.weekly_hours_saved, "Projected"],
                ["Overhead reduction", aio.roi?.overhead_reduction, aio.roi?.payback_period ? `Payback ${aio.roi.payback_period}` : ""],
                ["Monthly tool cost", aio.roi?.monthly_tool_cost, "Estimated"],
              ].map(([k, v, n]) => (
                <div key={k as string} className="rounded-md border border-border bg-card p-6">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{k}</p>
                  <p className="font-display text-3xl font-semibold text-primary">{v || "—"}</p>
                  {n && <p className="text-xs text-muted-foreground mt-2">{n}</p>}
                </div>
              ))}
            </div>
            {aio.readiness?.biggest_pain_point && (
              <Block title="Biggest pain point"><p className="text-lg font-medium">{aio.readiness.biggest_pain_point}</p>{aio.readiness.explanation && <p className="mt-2 text-sm text-muted-foreground">{aio.readiness.explanation}</p>}</Block>
            )}
            {aio.quick_wins?.length > 0 && (
              <div className="mt-3">
                <Label>Quick wins · first 2 weeks</Label>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {aio.quick_wins.map((w: any, i: number) => (
                    <div key={i} className="rounded-md border border-border bg-card p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-display text-lg font-semibold">{w.title}</h4>
                        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-primary">{w.difficulty}</span>
                      </div>
                      {w.pain_point && <p className="mt-2 text-xs"><span className="text-muted-foreground uppercase tracking-[0.15em]">Pain — </span>{w.pain_point}</p>}
                      {w.solution && <p className="mt-2 text-sm text-muted-foreground">{w.solution}</p>}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {w.tools && <span className="rounded bg-primary/10 px-2 py-1 text-primary">{w.tools}</span>}
                        {w.hours_saved_per_week && <span className="rounded border border-border px-2 py-1">{w.hours_saved_per_week} hrs/week</span>}
                        {w.timeline && <span className="rounded border border-border px-2 py-1">{w.timeline}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {aio.systemic_automations?.length > 0 && (
              <div className="mt-3"><Block title="Systemic automations · months 1-3">
                <div className="divide-y divide-border">
                  {aio.systemic_automations.map((a: any, i: number) => (
                    <div key={i} className="py-4">
                      <div className="flex flex-wrap items-center gap-3"><span className="font-display text-primary">{String(i + 1).padStart(2, "0")}</span><p className="font-medium">{a.title}</p>{a.timeline && <span className="text-xs text-muted-foreground">{a.timeline}</span>}</div>
                      {a.workflow && <p className="mt-1 text-xs uppercase tracking-[0.15em] text-muted-foreground">{a.workflow}</p>}
                      {a.how_it_works && <p className="mt-2 text-sm text-muted-foreground">{a.how_it_works}</p>}
                      {a.impact && <p className="mt-1 text-sm"><span className="text-muted-foreground">Impact — </span>{a.impact}</p>}
                      {a.tools && <p className="mt-1 text-xs text-primary">{a.tools}</p>}
                    </div>
                  ))}
                </div>
              </Block></div>
            )}
            <Grid2>
              {aio.tool_stack?.length > 0 && (
                <Block title="Recommended AI tool stack">
                  <Bullets items={aio.tool_stack.map((t: any) => typeof t === "string" ? t : `${t.tool} (${t.category}) — ${t.purpose}${t.est_cost ? ` · ${t.est_cost}` : ""}`)} />
                </Block>
              )}
              {aio.defensibility && Object.keys(aio.defensibility).length > 0 && (
                <Block title="AI threat & moat"><KeyValue obj={aio.defensibility} /></Block>
              )}
            </Grid2>
          </Section>
        )}
      </div>
    </div>
  );
};

/* --- Building blocks --- */
const Section = ({ number, title, id, children }: { number: string; title: string; id?: string; children: React.ReactNode }) => (
  <section id={id} className="animate-slide-up scroll-mt-20">
    <div className="mb-8 flex items-center gap-5 border-b border-border pb-4">
      <span className="grid h-9 min-w-9 place-items-center rounded bg-primary/10 font-display text-xs font-semibold text-primary">{number}</span>
      <h2 className="font-display text-3xl font-semibold md:text-4xl">{title}</h2>
    </div>
    {children}
  </section>
);
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="eyebrow">{children}</p>
);
const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="rounded-md border border-border bg-card/60 p-5">
    <Label>{title}</Label>
    <div className="mt-3">{children}</div>
  </div>
);
const Grid2 = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-3 grid gap-3 md:grid-cols-2">{children}</div>
);
const Bullets = ({ items }: { items: any[] }) => {
  if (!items || items.length === 0) return <p className="text-sm text-muted-foreground italic">None.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 text-sm leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{String(it)}</span>
        </li>
      ))}
    </ul>
  );
};
const KeyValue = ({ obj }: { obj: any }) => {
  if (!obj || typeof obj !== "object") return null;
  const entries = Object.entries(obj);
  if (entries.length === 0) return null;
  return (
    <dl className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-3 gap-4 text-sm py-2 border-b hairline last:border-0">
          <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{k.replace(/_/g, " ")}</dt>
          <dd className="col-span-2 leading-relaxed">
            {typeof v === "string" || typeof v === "number" ? String(v) : Array.isArray(v) ? v.join(", ") : JSON.stringify(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default DashboardNoAuth;
