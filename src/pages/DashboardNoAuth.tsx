import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, RefreshCw, Plus, TrendingUp, Target, BarChart3, WalletCards } from "lucide-react";
import Seo from "@/components/Seo";

type Json = any;

interface MarketRes { market_size: Json; tam_sam_som: Json; trends: Json[]; target_audience: Json[]; opportunities: Json[]; risks: Json[]; summary: string | null; }
interface CompRes { competitors: any[]; swot: Json; positioning: Json; differentiation: any[]; summary: string | null; }
interface PlanRes { executive_summary: string | null; value_proposition: string | null; business_model: Json; go_to_market: Json; milestones: any[]; risks: any[]; team_needs: any[]; }
interface FinRes { revenue_streams: any[]; cost_structure: any[]; projections_3yr: any[]; unit_economics: Json; funding_needs: Json; key_assumptions: any[]; summary: string | null; }

const DashboardNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { business, clearSession, isReady, reload } = useResume();

  const [loading, setLoading] = useState(true);
  const [triedReload, setTriedReload] = useState(false);
  const [market, setMarket] = useState<MarketRes | null>(null);
  const [comp, setComp] = useState<CompRes | null>(null);
  const [plan, setPlan] = useState<PlanRes | null>(null);
  const [fin, setFin] = useState<FinRes | null>(null);

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

  const loadAll = async () => {
    if (!business) return;
    setLoading(true);
    try {
      const [m, c, p, f] = await Promise.all([
        supabase.from("market_research_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("competitor_analysis_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("business_plan_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("financial_model_result").select("*").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      ]);
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

  const hasAny = market || comp || plan || fin;

  return (
    <div className="min-h-full bg-background">
      <Seo
        title="Strategy Dashboard — Planz"
        description="Your complete AI-generated strategy dossier: market research, competitor analysis, business plan, and financial model."
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
              <Button variant="outline" size="sm" onClick={() => navigate("/sigma")}>
                <RefreshCw className="w-3.5 h-3.5" /> Re-run
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { clearSession(); navigate("/setup"); }}>
                <Plus /> New brief
              </Button>
            </div>
          </div>
        </div>
      </header>

      {!hasAny && (
        <div className="px-6 md:px-10 py-20 text-center">
          <p className="text-muted-foreground mb-6">No analysis yet for this business.</p>
          <Button onClick={() => navigate("/sigma")}>
            Run the strategy session <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {hasAny && <div className="grid gap-3 border-b border-border px-5 py-5 sm:grid-cols-2 md:px-10 xl:grid-cols-4">
        {[[TrendingUp,'Market','Research filed',!!market],[Target,'Position','Competitive map',!!comp],[BarChart3,'Plan','Roadmap ready',!!plan],[WalletCards,'Finance','Model prepared',!!fin]].map(([Icon,title,label,ready]) => <div key={String(title)} className="flex items-center gap-3 rounded-md border border-border bg-card p-3"><span className="grid h-9 w-9 place-items-center rounded bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span><div><p className="text-xs font-semibold">{String(title)}</p><p className="text-xs text-muted-foreground">{ready ? String(label) : 'Pending'}</p></div></div>)}
      </div>}
      <div className="space-y-16 px-5 py-10 md:px-10">
        {/* Executive Summary */}
        {plan?.executive_summary && (
          <Section number="I." title="Executive Summary">
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
          <Section number="II." title="Market Research">
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
          <Section number="III." title="Competitor Analysis">
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
          <Section number="IV." title="Business Plan">
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
          <Section number="V." title="Financial Model">
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
      </div>
    </div>
  );
};

/* --- Building blocks --- */
const Section = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <section className="animate-slide-up scroll-mt-20">
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
