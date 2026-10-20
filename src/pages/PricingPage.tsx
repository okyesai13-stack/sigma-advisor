import { useState } from "react";
import { Check, Coins, Loader2, Sparkles, Ticket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { ACTION_LABELS, CREDIT_COSTS, CREDIT_PACKS, DAILY_CREDITS, PLANS, notifyCreditsChanged, useCredits } from "@/lib/credits";

const PricingPage = () => {
  const { credits } = useCredits();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const isPro = credits?.plan === "pro";

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setRedeeming(true);
    const { error } = await (supabase.rpc as any)("redeem_coupon", { p_code: code });
    setRedeeming(false);
    notifyCreditsChanged();
    if (!error) { setCode(""); toast({ title: "Pro plan activated", description: "100 monthly credits added to your account." }); return; }
    const m = error.message || "";
    toast({ variant: "destructive", title: "Couldn't apply code",
      description: m.includes("invalid_coupon") ? "That coupon code isn't valid." : m.includes("already_pro") ? "You're already on Pro." : m });
  };

  const upgrade = async () => {
    setBusy(true);
    const { error } = await (supabase.rpc as any)("request_upgrade");
    setBusy(false);
    notifyCreditsChanged();
    toast(error ? { title: "Something went wrong", description: error.message, variant: "destructive" }
      : { title: "You're on the list", description: "Payments are coming soon. We'll let you know when Pro is ready." });
  };


  const plans = [
    { id: "free", features: [`${DAILY_CREDITS} AI credits every day`, "All six agents", "Whiteboard and pitch deck"] },
    { id: "pro", features: [`${PLANS.pro.monthlyCredits} AI credits every month`, `Plus ${DAILY_CREDITS} credits every day`, "Everything in Free", "Buy extra credit packs"] },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-5 md:p-8 animate-fade-in">
      <Seo title="Pricing — Planz" description="Planz plans and AI credits." path="/pricing" noindex />
      <div>
        <p className="eyebrow">Pricing</p>
        <h1 className="font-display text-3xl font-semibold">Plans and AI credits</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every AI action uses credits. Daily credits are used first, then monthly, then top-ups.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((p) => {
          const plan = PLANS[p.id];
          const current = (credits?.plan ?? "free") === p.id;
          return (
            <div key={p.id} className={`panel-surface flex flex-col gap-4 p-6 ${p.id === "pro" ? "border-primary/60 shadow-glow" : ""}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">{plan.name}</h2>
                {current && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">Current plan</span>}
              </div>
              <p><span className="font-display text-4xl font-semibold">${plan.price}</span><span className="text-sm text-muted-foreground"> / month</span></p>
              <ul className="flex-1 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{f}</li>)}
              </ul>
              {p.id === "pro" && !isPro && (
                <Button onClick={upgrade} disabled={busy || !!credits?.upgrade_requested_at}>
                  {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {credits?.upgrade_requested_at ? "On the waitlist" : "Upgrade to Pro"}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {!isPro && (
        <form onSubmit={redeem} className="panel-surface flex flex-col gap-3 p-6 sm:flex-row sm:items-end">
          <div className="flex-1">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Ticket className="h-4 w-4 text-primary" /> Have a coupon code?</h2>
            <p className="mb-2 text-sm text-muted-foreground">Enter it to activate the Pro plan.</p>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" />
          </div>
          <Button type="submit" disabled={redeeming || !code.trim()}>{redeeming ? <Loader2 className="animate-spin" /> : null}Apply code</Button>
        </form>
      )}



      <div className="panel-surface space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Coins className="h-4 w-4 text-primary" /> Credit packs</h2>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">Coming soon</span>
        </div>
        <p className="text-sm text-muted-foreground">One-time top-ups that never expire.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CREDIT_PACKS.map((k) => (
            <div key={k.credits} className="rounded-md border border-border bg-background/40 p-4">
              <p className="font-display text-2xl font-semibold">{k.credits} credits</p>
              <p className="text-sm text-muted-foreground">${k.price}</p>
              <Button className="mt-3 w-full" variant="outline" size="sm" disabled>Coming soon</Button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel-surface p-6">
        <h2 className="mb-3 font-display text-lg font-semibold">What things cost</h2>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(CREDIT_COSTS).map(([k, v]) => (
            <div key={k} className="flex justify-between rounded-md border border-border px-3 py-2"><span>{ACTION_LABELS[k]}</span><span className="text-primary">{v} credit{v > 1 ? "s" : ""}</span></div>
          ))}
          <div className="flex justify-between rounded-md border border-border px-3 py-2"><span>Pitch deck and viewing results</span><span className="text-muted-foreground">Free</span></div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
