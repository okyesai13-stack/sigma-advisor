import { useNavigate } from "react-router-dom";
import { Coins } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PLANS, useCredits } from "@/lib/credits";

const when = (iso?: string) => (iso ? new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "");

const CreditBadge = () => {
  const { credits, total } = useCredits();
  const navigate = useNavigate();
  if (!credits) return null;
  const rows = [
    { label: "Daily", value: credits.daily_balance, note: `Resets ${when(credits.daily_reset_at)}` },
    { label: "Monthly", value: credits.monthly_balance, note: credits.plan === "pro" ? `Resets ${when(credits.monthly_reset_at)}` : "Pro plan only" },
    { label: "Top-up", value: credits.topup_balance, note: "Never expires" },
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5" aria-label="AI credits">
          <Coins className="h-4 w-4 text-primary" /><span className="font-display">{total}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold">{total} credits left</p>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">{PLANS[credits.plan]?.name ?? "Free"}</span>
        </div>
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between text-sm">
            <div><p>{r.label}</p><p className="text-xs text-muted-foreground">{r.note}</p></div>
            <span className="font-display">{r.value}</span>
          </div>
        ))}
        <Button size="sm" className="w-full" onClick={() => navigate("/pricing")}>{credits.plan === "pro" ? "View plans" : "Upgrade to Pro"}</Button>
      </PopoverContent>
    </Popover>
  );
};

export default CreditBadge;
