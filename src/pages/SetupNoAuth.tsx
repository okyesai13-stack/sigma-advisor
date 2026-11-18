import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Loader2, Building2, Globe2, Target, Layers3, Check } from "lucide-react";
import Seo from "@/components/Seo";

const STAGES = [
  { id: "idea", label: "Idea" },
  { id: "early", label: "Early-stage" },
  { id: "established", label: "Established" },
];

const SetupNoAuth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { setBusiness } = useResume();

  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [pitch, setPitch] = useState("");
  const [stage, setStage] = useState("idea");
  const [industry, setIndustry] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [geography, setGeography] = useState("");
  const [rawContext, setRawContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data } = await supabase.from("business_store").select("*").eq("id", editId).maybeSingle();
      if (!data) return;
      setBusinessName(data.business_name || "");
      setPitch(data.pitch || "");
      setStage(data.stage || "idea");
      setIndustry(data.industry || "");
      setTargetMarket(data.target_market || "");
      setGeography(data.geography || "");
      setRawContext(data.raw_context || "");
    })();
  }, [editId]);

  const canSubmit = businessName.trim() && pitch.trim() && industry.trim() && targetMarket.trim();

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!canSubmit) {
      toast({ title: "Missing fields", description: "Business name, pitch, industry, and target market are required.", variant: "destructive" });
      return;
    }
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    const activeUser = sessionData?.session?.user ?? user;
    if (sessionErr || !activeUser) {
      console.error("[setup] no active session", sessionErr);
      toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out. Check your connection and try again.")), 15000)
    );

    try {
      console.log("[setup] inserting business for user", activeUser.id);
      const fields = {
          business_name: businessName.trim(),
          pitch: pitch.trim(),
          stage,
          industry: industry.trim(),
          target_market: targetMarket.trim(),
          geography: geography.trim() || null,
          raw_context: rawContext.trim() || null,
      };
      const cols = "id, business_name, pitch, stage, industry, target_market, geography";
      const insertPromise = editId
        ? supabase.from("business_store").update(fields).eq("id", editId).select(cols).single()
        : supabase.from("business_store").insert({ user_id: activeUser.id, ...fields }).select(cols).single();

      const { data, error } = (await Promise.race([insertPromise, timeoutPromise])) as any;

      console.log("[setup] insert result", { data, error });
      if (error) throw error;
      if (!data?.id) throw new Error("Brief was not saved. Please try again.");
      setBusiness(data as any);
      toast({ title: "Brief filed", description: "Convening the strategy office..." });
      navigate("/sigma");
    } catch (e: any) {
      console.error("[setup] insert failed", e);
      toast({ title: "Couldn't save brief", description: e?.message || "Unknown error. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-background">
      <Seo
        title="Business Brief — Planz"
        description="Describe your business idea so the Planz strategy agents can analyze your market, competitors, plan, and finances."
        path="/setup"
        noindex
      />
      <header className="border-b border-border bg-card/30">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <span className="eyebrow hidden sm:block">Step 1 of 2 — Brief</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/analysis")}>
            View dashboard
          </Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-5 py-8 md:px-8 md:py-12 lg:grid-cols-[230px_1fr]">
        <aside><p className="text-xl font-semibold">Planz</p><p className="eyebrow mt-6 text-primary">{editId ? "Update & re-run" : "New strategy session"}</p><nav className="mt-6 grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3" aria-label="Brief progress">{["Your business", "Your market", "Review & context"].map((title,i) => <Button key={title} variant={step===i ? "secondary" : "ghost"} className="h-auto min-h-12 justify-start whitespace-normal px-3 py-3 text-left text-xs sm:text-sm" disabled={i>step} onClick={() => setStep(i)}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${step===i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i<step ? <Check className="h-3 w-3" /> : i+1}</span>{title}</Button>)}</nav><p className="mt-8 hidden text-sm leading-relaxed text-muted-foreground lg:block">A clear brief is the foundation of your strategy.</p></aside>
        <section className="min-w-0"><div className="mb-8"><p className="eyebrow">Brief · {step+1} of 3</p><h1 className="mt-3 text-3xl font-semibold md:text-4xl">{[editId ? "Refine your business brief." : "What are you building?", "Find your place in the market.", "Ready to brief your strategy team?"][step]}</h1><p className="mt-4 text-muted-foreground">{["Start with the idea and where you are today.", "Define the industry and audience your business serves.", "Review your brief and add any context your agents should know."][step]}</p><div role="progressbar" aria-label="Brief progress" aria-valuenow={step+1} aria-valuemin={0} aria-valuemax={3} className="mt-6 flex gap-2">{[0,1,2].map(i=><span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i<=step ? "bg-primary" : "bg-muted"}`} />)}</div></div>
          <form onSubmit={e=>{e.preventDefault(); if(step<2)setStep(step+1); else void handleSubmit();}}>
            <div key={step} className="form-step space-y-6">
              {step===0 && <><Field label="Business name"><Input id="business-name" aria-label="Business name" required value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="e.g., Northwind Coffee Roasters" className="h-12 bg-card" /></Field><Field label="One-line pitch"><Textarea aria-label="One-line pitch" required value={pitch} onChange={e=>setPitch(e.target.value)} placeholder="What it is, who it’s for, and why it matters." className="min-h-[110px] bg-card" /></Field><Field label="Stage"><div className="grid grid-cols-3 gap-2">{STAGES.map(s=><Button key={s.id} type="button" variant={stage===s.id ? "default" : "outline"} aria-pressed={stage===s.id} onClick={()=>setStage(s.id)} className="h-12 px-2 text-xs">{s.label}</Button>)}</div></Field></>}
              {step===1 && <><Field label="Industry"><Input aria-label="Industry" required value={industry} onChange={e=>setIndustry(e.target.value)} placeholder="e.g., Specialty food & beverage" className="h-12 bg-card" /></Field><Field label="Target market"><Input aria-label="Target market" required value={targetMarket} onChange={e=>setTargetMarket(e.target.value)} placeholder="e.g., Urban professionals 25–45" className="h-12 bg-card" /></Field><Field label="Geography" hint="optional"><Input aria-label="Geography" value={geography} onChange={e=>setGeography(e.target.value)} placeholder="e.g., North America, India, Global" className="h-12 bg-card" /></Field></>}
              {step===2 && <><dl className="divide-y divide-border border-y border-border">{[["Business",businessName],["Pitch",pitch],["Stage",STAGES.find(s=>s.id===stage)?.label],["Industry",industry],["Target market",targetMarket],["Geography",geography||"Not specified"]].map(([label,value])=><div key={label} className="grid gap-1 py-3 sm:grid-cols-[130px_1fr]"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="break-words text-sm font-medium">{value}</dd></div>)}</dl><Field label="Additional context" hint="optional"><Textarea aria-label="Additional context" value={rawContext} onChange={e=>setRawContext(e.target.value)} placeholder="Existing notes, traction or constraints…" className="min-h-[120px] bg-card" /></Field></>}
            </div><div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6"><Button type="button" variant="ghost" disabled={step===0 || isSubmitting} onClick={()=>setStep(step-1)}><ArrowLeft />Back</Button><Button type="submit" disabled={isSubmitting || (step===0 && (!businessName.trim() || !pitch.trim())) || (step===1 && (!industry.trim() || !targetMarket.trim())) || (step===2 && !canSubmit)}>{isSubmitting ? <Loader2 className="animate-spin" /> : <ArrowRight />}{step<2 ? "Continue" : editId ? "Update & re-run agents" : "Convene the agents"}</Button></div>
          </form>
        </section>
      </main>
    </div>
  );
};

const Field = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
  <div>
    <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
      {label} {hint && <span className="text-xs font-normal text-muted-foreground">— {hint}</span>}
    </Label>
    <div className="mt-2">{children}</div>
  </div>
);

export default SetupNoAuth;
