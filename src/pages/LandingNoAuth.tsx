import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUpRight } from "lucide-react";

const agents = [
  { num: "01", name: "Market Research", desc: "TAM/SAM/SOM sizing, trend analysis, audience segmentation, and emerging-opportunity scans drawn from your idea and industry." },
  { num: "02", name: "Competitor Analysis", desc: "Direct and indirect competitors, positioning maps, SWOT framing, and clear differentiation angles you can defend." },
  { num: "03", name: "Business Plan", desc: "Executive summary, value proposition, business model canvas, go-to-market motion, milestones, and risk register." },
  { num: "04", name: "Financial Model", desc: "Revenue streams, cost structure, three-year projections, unit economics, runway, and funding requirements." },
];

const principles = [
  { k: "I.", t: "Idea to evidence", d: "Every claim grounded in market signal, not hand-waving." },
  { k: "II.", t: "Multi-agent rigor", d: "Four specialists deliberate in parallel. No single point of view." },
  { k: "III.", t: "Founder velocity", d: "From blank page to investor-ready strategy in minutes, not weeks." },
];

const LandingNoAuth = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b hairline">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl">Planz</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Strategy Office</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-[0.15em] text-muted-foreground">
            <a href="#agents" className="hover:text-foreground transition-colors">Agents</a>
            <a href="#method" className="hover:text-foreground transition-colors">Method</a>
            <a href="#who" className="hover:text-foreground transition-colors">Who it's for</a>
          </nav>
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="text-xs uppercase tracking-[0.15em]">
            Sign in <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b hairline">
        <div className="container mx-auto px-6 py-24 md:py-36">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-2 hidden md:block">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">№ 001 — 2026</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-2">A new strategy office</p>
            </div>
            <div className="md:col-span-10">
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-6">An AI multi-agent system for founders & operators</p>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[0.95] text-balance mb-8">
                Translate an idea<br />
                into a <em className="italic">viable</em> business.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
                Planz convenes four specialist AI agents — market research, competitor analysis, business planning, and financial modeling — to pressure-test your concept and produce an investor-ready strategy.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <Button size="lg" onClick={() => navigate('/auth')} className="h-12 px-8 rounded-none text-sm uppercase tracking-[0.15em]">
                  Begin a strategy session
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <button onClick={() => document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm underline underline-offset-4 hover:text-muted-foreground">
                  Read the method
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pull quote / positioning */}
      <section className="border-b hairline bg-secondary/40">
        <div className="container mx-auto px-6 py-20">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <p className="md:col-span-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Editorial</p>
            <blockquote className="md:col-span-10 font-serif text-3xl md:text-5xl leading-[1.15] text-balance">
              "Most ideas die in the gap between conviction and evidence. Planz closes that gap with four agents that work the way a strategy team works — in parallel, with rigor, and on the record."
            </blockquote>
          </div>
        </div>
      </section>

      {/* Agents */}
      <section id="agents" className="border-b hairline">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-12 gap-10 mb-16">
            <p className="md:col-span-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">The Roster</p>
            <h2 className="md:col-span-10 font-serif text-4xl md:text-5xl leading-tight">
              Four agents. One coordinated strategy.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-border">
            {agents.map((a) => (
              <article key={a.num} className="bg-background p-10 md:p-12">
                <div className="flex items-baseline gap-4 mb-4">
                  <span className="font-serif text-3xl text-muted-foreground">{a.num}</span>
                  <h3 className="font-serif text-3xl">{a.name}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed max-w-md">{a.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Method */}
      <section id="method" className="border-b hairline">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">The Method</p>
              <h2 className="font-serif text-4xl md:text-5xl leading-tight">
                Idea in.<br />
                Strategy out.
              </h2>
            </div>
            <ol className="md:col-span-8 space-y-10">
              {[
                { n: "01", t: "Brief the office", d: "Share the idea, stage, industry, and target market in a structured intake — no deck required." },
                { n: "02", t: "Agents convene", d: "Each specialist runs in parallel against the same brief, drawing on Gemini 3 to synthesize the landscape." },
                { n: "03", t: "Strategy dossier", d: "A single dashboard surfaces the market, competitors, plan, and financials — alongside a resident strategy advisor for follow-ups." },
              ].map((s) => (
                <li key={s.n} className="grid grid-cols-12 gap-6 border-b hairline pb-10">
                  <span className="col-span-2 font-serif text-3xl text-muted-foreground">{s.n}</span>
                  <div className="col-span-10">
                    <h3 className="font-serif text-2xl mb-2">{s.t}</h3>
                    <p className="text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section id="who" className="border-b hairline bg-secondary/40">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-12 gap-10">
            <p className="md:col-span-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Who it serves</p>
            <div className="md:col-span-10 grid md:grid-cols-3 gap-10">
              {[
                { t: "Founders pre-idea", d: "Discover whether the market wants what you're imagining before you build a thing." },
                { t: "Early-stage startups", d: "Sharpen positioning, model the next round, and stress-test your go-to-market." },
                { t: "Established operators", d: "Scout adjacent markets, evaluate new lines of business, and align the leadership team." },
              ].map((x) => (
                <div key={x.t}>
                  <h3 className="font-serif text-2xl mb-3">{x.t}</h3>
                  <p className="text-muted-foreground leading-relaxed">{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="border-b hairline">
        <div className="container mx-auto px-6 py-24">
          <div className="grid md:grid-cols-3 gap-10">
            {principles.map((p) => (
              <div key={p.k}>
                <p className="font-serif text-5xl mb-4">{p.k}</p>
                <h3 className="text-sm uppercase tracking-[0.15em] mb-3">{p.t}</h3>
                <p className="text-muted-foreground leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-b hairline">
        <div className="container mx-auto px-6 py-32 text-center">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-6">Open the office</p>
          <h2 className="font-serif text-5xl md:text-7xl leading-[1.05] text-balance mb-10 max-w-3xl mx-auto">
            Your idea deserves a strategy team.
          </h2>
          <Button size="lg" onClick={() => navigate('/auth')} className="h-12 px-10 rounded-none text-sm uppercase tracking-[0.15em]">
            Begin a strategy session
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="container mx-auto px-6 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs uppercase tracking-[0.15em] text-muted-foreground">
          <p>Planz — A strategy office for founders</p>
          <p>© 2026 — All ideas reserved</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingNoAuth;
