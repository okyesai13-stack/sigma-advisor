import { useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Maximize, Printer, Loader2, LayoutGrid } from "lucide-react";
import Seo from "@/components/Seo";

type Any = any;
const latest = (table: string, id: string) =>
  (supabase as Any).from(table).select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle();

const txt = (v: Any): string => (v == null ? "" : typeof v === "string" ? v : typeof v === "number" ? String(v) : v.title || v.name || v.value || "");

/* ---------- Scaling ---------- */
const ScaledSlide = ({ children }: { children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setScale(Math.min(el.clientWidth / 1920, el.clientHeight / 1080)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      <div className="slide-wrapper" style={{ ["--scale" as Any]: scale }}>{children}</div>
    </div>
  );
};

const Slide = ({ kicker, title, children, page, total, name }: { kicker?: string; title: string; children?: ReactNode; page: number; total: number; name: string }) => (
  <div className="slide-content deck-slide flex flex-col px-[120px] pb-[80px] pt-[110px]">
    {kicker && <p className="slide-kicker deck-accent mb-6 font-sans">{kicker}</p>}
    <h2 className="slide-title mb-14 max-w-[1500px] font-display font-semibold">{title}</h2>
    <div className="flex-1 min-h-0">{children}</div>
    <div className="slide-footer deck-muted flex justify-between font-sans"><span>{name}</span><span className="slide-page">{page} / {total}</span></div>
  </div>
);

const Card = ({ label, value, note }: { label: string; value: string; note?: string }) => (
  <div className="deck-card flex min-h-[260px] flex-col justify-between rounded-2xl p-10">
    <p className="slide-kicker deck-muted">{label}</p>
    <p className="slide-subtitle deck-accent font-display font-semibold">{value || "—"}</p>
    {note && <p className="slide-caption deck-muted line-clamp-2">{note}</p>}
  </div>
);

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-7">
    {items.filter(Boolean).slice(0, 4).map((b, i) => (
      <li key={i} className="slide-body flex gap-6"><span className="deck-accent font-display">0{i + 1}</span><span className="max-w-[1400px] line-clamp-2">{b}</span></li>
    ))}
  </ul>
);

/* ---------- Build slides from results ---------- */
function buildSlides(biz: Any, mr: Any, ca: Any, bp: Any, fm: Any) {
  const name = biz.business_name;
  const s: { title: string; render: (p: number, t: number) => ReactNode }[] = [];
  const add = (title: string, fn: (p: number, t: number) => ReactNode) => s.push({ title, render: fn });

  add("Cover", () => (
    <div className="slide-content deck-slide flex flex-col justify-center px-[140px]">
      <p className="slide-kicker deck-accent mb-8">{biz.stage} · {biz.industry || "Pitch"}</p>
      <h1 className="slide-title-lg mb-10 font-display font-semibold">{name}</h1>
      <p className="slide-body-lg deck-muted max-w-[1300px] line-clamp-3">{bp?.value_proposition || biz.pitch}</p>
    </div>
  ));
  if (bp?.executive_summary) add("Summary", (p, t) => (
    <Slide kicker="Executive summary" title="Why this, why now" page={p} total={t} name={name}>
      <p className="slide-body-lg max-w-[1500px] line-clamp-6">{bp.executive_summary}</p>
    </Slide>
  ));
  if (mr) {
    add("Opportunity", (p, t) => (
      <Slide kicker="Market opportunity" title="The opening in the market" page={p} total={t} name={name}>
        <Bullets items={(mr.opportunities || []).map((o: Any) => o.title ? `${o.title} — ${o.rationale || ""}` : txt(o))} />
      </Slide>
    ));
    add("Market size", (p, t) => (
      <Slide kicker="Market size" title="TAM · SAM · SOM" page={p} total={t} name={name}>
        <div className="grid grid-cols-3 gap-10">
          {(["tam", "sam", "som"] as const).map((k) => (
            <Card key={k} label={k.toUpperCase()} value={txt(mr.tam_sam_som?.[k]?.value)} note={mr.tam_sam_som?.[k]?.note} />
          ))}
        </div>
        {mr.market_size?.growth_rate && <p className="slide-body deck-muted mt-12">Growth: {mr.market_size.growth_rate}</p>}
      </Slide>
    ));
  }
  if (ca) {
    add("Competition", (p, t) => (
      <Slide kicker="Competitive landscape" title="Who we're up against" page={p} total={t} name={name}>
        <div className="grid grid-cols-3 gap-8">
          {(ca.competitors || []).slice(0, 3).map((c: Any, i: number) => (
            <div key={i} className="deck-card min-h-[340px] rounded-2xl p-10">
              <p className="slide-kicker deck-muted mb-4">{c.type}</p>
              <p className="slide-subtitle mb-5 font-display font-semibold">{c.name}</p>
              <p className="slide-caption deck-muted line-clamp-4">{c.weaknesses?.[0] ? `Gap: ${c.weaknesses[0]}` : c.description}</p>
            </div>
          ))}
        </div>
      </Slide>
    ));
    add("Differentiation", (p, t) => (
      <Slide kicker="Our position" title={ca.positioning?.our_position ? "Where we win" : "Differentiation"} page={p} total={t} name={name}>
        {ca.positioning?.white_space && <p className="slide-body-lg mb-12 max-w-[1500px] line-clamp-2">{ca.positioning.white_space}</p>}
        <Bullets items={(ca.differentiation || []).slice(0, 3).map((d: Any) => d.angle ? `${d.angle} (${d.defensibility} defensibility)` : txt(d))} />
      </Slide>
    ));
  }
  if (bp) {
    add("Business model", (p, t) => (
      <Slide kicker="Business model" title="How we make money" page={p} total={t} name={name}>
        <div className="grid grid-cols-2 gap-10">
          <Card label="Customers" value="" note={bp.business_model?.customer_segments} />
          <Card label="Revenue model" value="" note={bp.business_model?.revenue_model} />
        </div>
      </Slide>
    ));
    add("Go to market", (p, t) => (
      <Slide kicker="Go-to-market" title="Beachhead & first 90 days" page={p} total={t} name={name}>
        <Bullets items={[bp.go_to_market?.beachhead && `Beachhead: ${bp.go_to_market.beachhead}`, bp.go_to_market?.channels && `Channels: ${bp.go_to_market.channels}`, bp.go_to_market?.first_90_days && `First 90 days: ${bp.go_to_market.first_90_days}`]} />
      </Slide>
    ));
  }
  if (fm) {
    add("Projections", (p, t) => (
      <Slide kicker="Financials" title="Three-year projection" page={p} total={t} name={name}>
        <div className="grid grid-cols-3 gap-10">
          {(fm.projections_3yr || []).slice(0, 3).map((y: Any, i: number) => (
            <Card key={i} label={y.year} value={y.revenue} note={`Profit ${y.profit || "—"} · ${y.customers || "—"} customers`} />
          ))}
        </div>
      </Slide>
    ));
    add("Unit economics", (p, t) => (
      <Slide kicker="Unit economics" title="The numbers behind growth" page={p} total={t} name={name}>
        <div className="grid grid-cols-3 gap-10">
          <Card label="LTV : CAC" value={fm.unit_economics?.ltv_cac_ratio} note={`CAC ${fm.unit_economics?.cac || "—"} · LTV ${fm.unit_economics?.ltv || "—"}`} />
          <Card label="Gross margin" value={fm.unit_economics?.gross_margin} />
          <Card label="Payback" value={fm.unit_economics?.payback_period} />
        </div>
      </Slide>
    ));
  }
  if (bp?.milestones?.length) add("Milestones", (p, t) => (
    <Slide kicker="Roadmap" title="Milestones" page={p} total={t} name={name}>
      <div className="grid grid-cols-4 gap-8">
        {bp.milestones.slice(0, 4).map((m: Any, i: number) => (
          <div key={i} className="deck-card min-h-[300px] rounded-2xl p-8">
            <p className="slide-kicker deck-accent mb-4">{m.timeline}</p>
            <p className="slide-body font-display font-semibold mb-3 line-clamp-2">{m.title}</p>
            <p className="slide-caption deck-muted line-clamp-4">{m.description}</p>
          </div>
        ))}
      </div>
    </Slide>
  ));
  if (fm?.funding_needs?.amount) add("The ask", (p, t) => (
    <Slide kicker="The ask" title={`Raising ${fm.funding_needs.amount}`} page={p} total={t} name={name}>
      <Bullets items={[fm.funding_needs.use_of_funds && `Use of funds: ${fm.funding_needs.use_of_funds}`, fm.funding_needs.runway && `Runway: ${fm.funding_needs.runway}`, fm.funding_needs.next_round && `Next: ${fm.funding_needs.next_round}`]} />
    </Slide>
  ));
  return s;
}

const PitchDeckPage = () => {
  const navigate = useNavigate();
  const { business, isReady } = useResume();
  const [params, setParams] = useSearchParams();
  const [slides, setSlides] = useState<ReturnType<typeof buildSlides> | null>(null);
  const [grid, setGrid] = useState(false);
  const print = params.has("print");
  const total = slides?.length || 0;
  const idx = Math.min(Math.max(0, (parseInt(params.get("slide") || "1") || 1) - 1), Math.max(0, total - 1));
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!business) { navigate("/dashboard"); return; }
    (async () => {
      const [b, mr, ca, bp, fm] = await Promise.all([
        (supabase as Any).from("business_store").select("*").eq("id", business.id).maybeSingle(),
        latest("market_research_result", business.id), latest("competitor_analysis_result", business.id),
        latest("business_plan_result", business.id), latest("financial_model_result", business.id),
      ]);
      setSlides(buildSlides(b.data || business, mr.data, ca.data, bp.data, fm.data));
    })();
  }, [business?.id, isReady]);

  const go = useCallback((i: number) => {
    const n = Math.min(Math.max(0, i), total - 1);
    setParams({ slide: String(n + 1) }, { replace: true });
  }, [total, setParams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); go(idx + 1); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) go(idx - 1);
      if (e.key === "g" || e.key === "G") setGrid((g) => !g);
      if (e.key === "F5") { e.preventDefault(); document.documentElement.requestFullscreen?.(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, go]);

  useEffect(() => {
    if (slides?.[idx]) document.title = `${idx + 1}/${total} — ${slides[idx].title} · Pitch deck`;
  }, [idx, slides, total]);

  if (!slides) return <div className="grid min-h-screen place-items-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (print) return (
    <div className="deck-print">
      {slides.map((s, i) => <div key={i} className="deck-print-page">{s.render(i + 1, total)}</div>)}
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <Seo title="Pitch Deck — Planz" description="Auto-generated investor pitch deck from your Planz strategy dossier." path="/deck" noindex />
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}><ArrowLeft /> Dashboard</Button>
          <span className="eyebrow hidden sm:inline">Pitch deck · {business?.business_name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="All slides" onClick={() => setGrid((g) => !g)}><LayoutGrid /></Button>
          <Button variant="ghost" size="icon" aria-label="Print or save as PDF" onClick={() => window.open("/deck?print", "_blank")}><Printer /></Button>
          <Button size="sm" onClick={() => document.documentElement.requestFullscreen?.()}><Maximize /> Present</Button>
        </div>
      </header>

      {grid ? (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-auto p-6 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s, i) => (
            <button key={i} onClick={() => { go(i); setGrid(false); }} className={`overflow-hidden rounded-lg border text-left ${i === idx ? "border-primary" : "border-border"}`}>
              <div className="aspect-video">{<ScaledSlide>{s.render(i + 1, total)}</ScaledSlide>}</div>
              <p className="px-3 py-2 text-xs text-muted-foreground">{i + 1}. {s.title}</p>
            </button>
          ))}
        </div>
      ) : (
        <div
          className="relative flex-1 bg-background p-4 md:p-8"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current == null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? idx + 1 : idx - 1);
            touchX.current = null;
          }}
        >
          <ScaledSlide>{slides[idx].render(idx + 1, total)}</ScaledSlide>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/90 px-2 py-1 backdrop-blur">
            <Button variant="ghost" size="icon" aria-label="Previous slide" onClick={() => go(idx - 1)} disabled={idx === 0}><ChevronLeft /></Button>
            <span className="text-xs text-muted-foreground tabular-nums">{idx + 1} / {total}</span>
            <Button variant="ghost" size="icon" aria-label="Next slide" onClick={() => go(idx + 1)} disabled={idx === total - 1}><ChevronRight /></Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PitchDeckPage;
