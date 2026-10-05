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
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            View dashboard
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12 md:px-12 md:py-16">
        <div className="mb-10 animate-slide-up">
          <div className="mb-5 flex items-center gap-2"><span className="signal-dot" /><p className="eyebrow text-primary">{editId ? "Update & re-run" : "New strategy session"}</p></div>
          <h1 className="font-display text-4xl font-semibold leading-tight md:text-6xl">{editId ? "Update your brief." : "Brief the strategy office."}</h1>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            Tell us what you're building. The four agents will use this brief to convene a strategy session.
          </p>
        </div>

        <div className="panel-surface animate-slide-up space-y-8 rounded-lg p-5 delay-100 md:p-8">
          <div className="grid gap-3 border-b border-border pb-6 sm:grid-cols-4">
            {[['Business', Building2], ['Position', Target], ['Market', Globe2], ['Context', Layers3]].map(([name, Icon], i) => (
              <div key={String(name)} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="grid h-7 w-7 place-items-center rounded bg-primary/10 text-primary">{i === 0 ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}</span>{String(name)}</div>
            ))}
          </div>
          <Field label="Business name">
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Northwind Coffee Roasters" className="h-12 bg-background text-base" />
          </Field>

          <Field label="One-line pitch">
            <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="What it is, who it's for, and why it matters." className="min-h-[100px] resize-none bg-background text-base" />
          </Field>

          <Field label="Stage">
            <div className="mt-2 grid grid-cols-3 gap-2">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStage(s.id)}
                  className={`rounded-md border py-4 text-xs font-semibold transition-all ${
                    stage === s.id ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid md:grid-cols-2 gap-10">
            <Field label="Industry">
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Specialty food & beverage" className="h-11 bg-background" />
            </Field>
            <Field label="Target market">
              <Input value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} placeholder="e.g., Urban professionals 25-45" className="h-11 bg-background" />
            </Field>
          </div>

          <Field label="Geography" hint="optional">
            <Input value={geography} onChange={(e) => setGeography(e.target.value)} placeholder="e.g., North America, India, Global" className="h-11 bg-background" />
          </Field>

          <Field label="Additional context" hint="optional — existing notes, traction, constraints">
            <Textarea value={rawContext} onChange={(e) => setRawContext(e.target.value)} placeholder="Anything else the agents should know..." className="min-h-[120px] resize-none bg-background" />
          </Field>

          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">Required: name, pitch, industry, and target market</p>
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} size="lg" className="w-full sm:w-auto">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Convene the agents
            </Button>
          </div>
        </div>
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
