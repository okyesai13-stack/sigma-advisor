import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ACTION_LABELS, PLANS, useCredits } from "@/lib/credits";

type Entry = { id: string; action: string; amount: number; created_at: string };

const BillingSection = () => {
  const { credits, total } = useCredits();
  const navigate = useNavigate();
  const [ledger, setLedger] = useState<Entry[]>([]);
  useEffect(() => {
    (supabase.from as any)("credit_ledger").select("id, action, amount, created_at").order("created_at", { ascending: false }).limit(10)
      .then(({ data }: { data: Entry[] | null }) => setLedger(data || []));
  }, [total]);
  if (!credits) return null;
  const plan = PLANS[credits.plan] ?? PLANS.free;
  return (
    <div className="panel-surface space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Coins className="h-4 w-4 text-primary" /> Plan & credits</h2>
        <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>{credits.plan === "pro" ? "View plans" : "Upgrade"}</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Plan</p><p className="font-display text-lg">{plan.name} · ${plan.price}/mo</p></div>
        <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Daily</p><p className="font-display text-lg">{credits.daily_balance}</p></div>
        <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Monthly</p><p className="font-display text-lg">{credits.monthly_balance}</p></div>
        <div className="rounded-md border border-border p-3"><p className="text-xs text-muted-foreground">Top-up</p><p className="font-display text-lg">{credits.topup_balance}</p></div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Recent credit use</p>
        {ledger.length === 0 ? <p className="text-sm text-muted-foreground">No credits used yet.</p> : (
          <ul className="divide-y divide-border text-sm">
            {ledger.map((e) => (
              <li key={e.id} className="flex justify-between py-1.5">
                <span>{ACTION_LABELS[e.action] ?? e.action}<span className="ml-2 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span></span>
                <span className="text-primary">{e.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default BillingSection;
