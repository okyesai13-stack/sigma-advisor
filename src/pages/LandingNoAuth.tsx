import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight, BarChart3, Bot, CircleCheck, LineChart, Radar, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";

const agents = [
  { num: "01", icon: Radar, name: "Market Research", desc: "Market sizing, trend signals, audience segments, and emerging opportunities." },
  { num: "02", icon: BarChart3, name: "Competitor Analysis", desc: "Competitive maps, positioning gaps, SWOT, and defendable differentiation." },
  { num: "03", icon: Bot, name: "Business Plan", desc: "Value proposition, business model, go-to-market, milestones, and risks." },
  { num: "04", icon: LineChart, name: "Financial Model", desc: "Revenue, cost structure, projections, unit economics, runway, and funding." },
];

const LandingNoAuth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <Seo title="Planz — AI Business Strategy Agents" description="Four AI agents turn your idea into an investor-ready business strategy." path="/" />

      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3" aria-label="Planz home">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">P</span>
            <span className="font-display text-xl font-semibold">Planz</span>
          </button>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#agents" className="transition-colors hover:text-foreground">Agents</a>
            <a href="#method" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#audience" className="transition-colors hover:text-foreground">Who it’s for</a>
          </nav>
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Sign in <ArrowUpRight /></Button>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-[92vh] items-center border-b border-border/70 px-5 pb-16 pt-28 md:px-8">
          <div className="mx-auto grid w-full max-w-7xl items-center gap-14 lg:grid-cols-12">
            <div className="animate-slide-up lg:col-span-7">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                <span className="signal-dot" /> Four specialist agents. One strategy.
              </div>
              <h1 className="max-w-4xl font-display text-5xl font-semibold leading-[1.02] md:text-7xl lg:text-8xl">
                The plan for <span className="text-primary">what’s next.</span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                Turn a business idea into market evidence, competitive positioning, a practical plan, and a financial model—without assembling a consulting team.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => navigate("/auth")}>Start strategy session <ArrowRight /></Button>
                <Button variant="outline" size="lg" onClick={() => document.getElementById("agents")?.scrollIntoView({ behavior: "smooth" })}>Meet the agents</Button>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted-foreground">
                {["Built for real business questions", "Parallel AI analysis", "One connected dossier"].map((item) => (
                  <span key={item} className="flex items-center gap-2"><CircleCheck className="h-4 w-4 text-primary" />{item}</span>
                ))}
              </div>
            </div>

            <div className="relative animate-scale-in delay-200 lg:col-span-5">
              <div className="panel-surface overflow-hidden rounded-lg shadow-lg">
                <div className="flex h-12 items-center justify-between border-b border-border px-4">
                  <div className="flex items-center gap-2"><span className="signal-dot" /><span className="eyebrow">Strategy engine</span></div>
                  <span className="text-xs text-muted-foreground">Live session</span>
                </div>
                <div className="space-y-3 p-4 md:p-6">
                  <div className="rounded-md border border-primary/30 bg-primary/10 p-4">
                    <p className="eyebrow text-primary">Business brief</p>
                    <p className="mt-2 font-display text-lg">AI-native finance workspace for growing teams</p>
                  </div>
                  {agents.map((agent, index) => (
                    <div key={agent.num} className="group flex items-center gap-4 rounded-md border border-border bg-secondary/50 p-4 transition-all hover:border-primary/40 hover:bg-accent">
                      <span className="grid h-9 w-9 place-items-center rounded-md bg-background text-primary"><agent.icon className="h-4 w-4" /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{agent.name}</p><span className="text-xs text-success">Ready</span></div>
                        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${92 - index * 7}%` }} /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border bg-secondary/40 p-4 text-center text-xs text-muted-foreground">All agents synchronize into one decision-ready dossier</div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-md border border-border bg-card px-4 py-3 shadow-lg md:flex">
                <Sparkles className="h-5 w-5 text-primary" /><div><p className="text-sm font-semibold">Analysis ready</p><p className="text-xs text-muted-foreground">Four perspectives aligned</p></div>
              </div>
            </div>
          </div>
        </section>

        <section id="agents" className="border-b border-border px-5 py-24 md:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 max-w-2xl"><p className="eyebrow text-primary">The agent team</p><h2 className="mt-4 font-display text-4xl font-semibold md:text-5xl">Specialists that work in parallel.</h2><p className="mt-4 text-lg text-muted-foreground">Each agent studies the same brief from a different business-critical angle.</p></div>
            <div className="grid gap-3 md:grid-cols-2">
              {agents.map((agent) => (
                <article key={agent.num} className="interactive-panel rounded-lg border border-border bg-card p-6 md:p-8">
                  <div className="flex items-start justify-between"><span className="grid h-11 w-11 place-items-center rounded-md bg-primary/10 text-primary"><agent.icon /></span><span className="font-display text-sm text-muted-foreground">{agent.num}</span></div>
                  <h3 className="mt-8 font-display text-2xl font-semibold">{agent.name}</h3><p className="mt-3 max-w-md leading-relaxed text-muted-foreground">{agent.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="method" className="border-b border-border bg-card/30 px-5 py-24 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <div><p className="eyebrow text-primary">How it works</p><h2 className="mt-4 font-display text-4xl font-semibold md:text-5xl">From uncertainty to a clear next move.</h2></div>
            <div className="space-y-3">
              {[['01','Brief your idea','Share your stage, audience, market, and what makes the idea matter.'],['02','Agents investigate','Four specialists work simultaneously, with progress you can follow.'],['03','Use the dossier','Review evidence, challenge assumptions, and continue with your resident advisor.']].map(([n,t,d]) => (
                <div key={n} className="flex gap-5 rounded-lg border border-border bg-background p-5 md:p-6"><span className="font-display text-sm text-primary">{n}</span><div><h3 className="font-display text-xl font-semibold">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></div></div>
              ))}
            </div>
          </div>
        </section>

        <section id="audience" className="px-5 py-24 md:px-8"><div className="mx-auto max-w-7xl"><p className="eyebrow text-primary">Built for decisive teams</p><div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">{[['Founders','Pressure-test demand before committing time and capital.'],['Early-stage teams','Sharpen positioning, go-to-market, and fundraising assumptions.'],['Established operators','Evaluate new markets and product lines with a shared strategic view.']].map(([t,d]) => <div key={t} className="bg-card p-7"><h3 className="font-display text-2xl font-semibold">{t}</h3><p className="mt-3 text-muted-foreground">{d}</p></div>)}</div></div></section>

        <section className="border-y border-border bg-primary px-5 py-20 text-primary-foreground md:px-8"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 md:flex-row md:items-center"><div><p className="text-sm font-semibold">Your next strategic decision starts here.</p><h2 className="mt-2 max-w-3xl font-display text-4xl font-semibold md:text-5xl">Give your idea a strategy team.</h2></div><Button size="lg" variant="secondary" onClick={() => navigate('/auth')}>Start now <ArrowRight /></Button></div></section>
      </main>

      <footer className="px-5 py-8 md:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-sm text-muted-foreground md:flex-row"><p>Planz — AI business strategy agents</p><p>© 2026 Planz</p></div></footer>
    </div>
  );
};

export default LandingNoAuth;
