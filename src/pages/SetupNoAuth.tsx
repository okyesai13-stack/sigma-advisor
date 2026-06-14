import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useResume } from "@/contexts/ResumeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

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
      const insertPromise = supabase
        .from("business_store")
        .insert({
          user_id: activeUser.id,
          business_name: businessName.trim(),
          pitch: pitch.trim(),
          stage,
          industry: industry.trim(),
          target_market: targetMarket.trim(),
          geography: geography.trim() || null,
          raw_context: rawContext.trim() || null,
        })
        .select("id, business_name, pitch, stage, industry, target_market, geography")
        .single();

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
      <header className="border-b hairline">
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Step 1 of 2 — Brief</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-xs uppercase tracking-[0.15em]">
            View dashboard
          </Button>
        </div>
      </header>

      <main className="px-6 md:px-12 py-12 max-w-3xl mx-auto">
        <div className="mb-12">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">Intake — № 001</p>
          <h1 className="font-serif text-5xl md:text-6xl leading-tight mb-4">Brief the office.</h1>
          <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
            Tell us what you're building. The four agents will use this brief to convene a strategy session.
          </p>
        </div>

        <div className="space-y-10">
          <Field label="Business name">
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g., Northwind Coffee Roasters" className="rounded-none border-x-0 border-t-0 px-0 text-lg h-12 focus-visible:ring-0" />
          </Field>

          <Field label="One-line pitch">
            <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="What it is, who it's for, and why it matters." className="rounded-none border-x-0 border-t-0 px-0 text-lg resize-none focus-visible:ring-0 min-h-[80px]" />
          </Field>

          <Field label="Stage">
            <div className="grid grid-cols-3 gap-px bg-border mt-2">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStage(s.id)}
                  className={`bg-background py-4 text-xs uppercase tracking-[0.15em] transition-colors ${
                    stage === s.id ? "bg-foreground text-background" : "hover:bg-secondary"
                  }`}
                  style={stage === s.id ? { backgroundColor: "hsl(var(--foreground))", color: "hsl(var(--background))" } : undefined}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid md:grid-cols-2 gap-10">
            <Field label="Industry">
              <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g., Specialty food & beverage" className="rounded-none border-x-0 border-t-0 px-0 h-11 focus-visible:ring-0" />
            </Field>
            <Field label="Target market">
              <Input value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} placeholder="e.g., Urban professionals 25-45" className="rounded-none border-x-0 border-t-0 px-0 h-11 focus-visible:ring-0" />
            </Field>
          </div>

          <Field label="Geography" hint="optional">
            <Input value={geography} onChange={(e) => setGeography(e.target.value)} placeholder="e.g., North America, India, Global" className="rounded-none border-x-0 border-t-0 px-0 h-11 focus-visible:ring-0" />
          </Field>

          <Field label="Additional context" hint="optional — existing notes, traction, constraints">
            <Textarea value={rawContext} onChange={(e) => setRawContext(e.target.value)} placeholder="Anything else the agents should know..." className="rounded-none border-x-0 border-t-0 px-0 resize-none focus-visible:ring-0 min-h-[100px]" />
          </Field>

          <div className="pt-6 border-t hairline">
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} size="lg" className="w-full md:w-auto h-12 px-10 rounded-none text-xs uppercase tracking-[0.15em]">
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
    <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2">
      {label} {hint && <span className="normal-case tracking-normal italic font-serif">— {hint}</span>}
    </Label>
    <div className="mt-2">{children}</div>
  </div>
);

export default SetupNoAuth;
