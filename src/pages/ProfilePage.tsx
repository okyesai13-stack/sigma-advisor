import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Seo from "@/components/Seo";
import { Loader2, Trash2, ExternalLink, KeyRound, User, Briefcase, LogOut } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Biz = { id: string; business_name: string; stage: string; industry: string | null; created_at: string };

const RESULT_TABLES = [
  "market_research_result", "competitor_analysis_result", "business_plan_result",
  "financial_model_result", "marketing_strategy_result", "ai_operations_result", "advisor_messages",
] as const;

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: b }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("business_store").select("id, business_name, stage, industry, created_at").order("created_at", { ascending: false }),
      ]);
      setFullName(p?.full_name || user.user_metadata?.full_name || "");
      setAvatarUrl(p?.avatar_url || "");
      setBusinesses(b || []);
      setLoading(false);
    })();
  }, [user]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const name = fullName.trim().slice(0, 100);
    const { error } = await supabase.from("profiles").update({ full_name: name, avatar_url: avatarUrl.trim() || null, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (!error) await supabase.auth.updateUser({ data: { full_name: name } });
    setSaving(false);
    toast(error ? { title: "Could not save", description: error.message, variant: "destructive" } : { title: "Profile saved" });
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) return toast({ title: "Password must be at least 8 characters", variant: "destructive" });
    if (newPw !== confirmPw) return toast({ title: "Passwords do not match", variant: "destructive" });
    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw, current_password: currentPw } as any);
    setPwSaving(false);
    if (error) return toast({ title: "Could not change password", description: error.message, variant: "destructive" });
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    toast({ title: "Password updated" });
  };

  const deleteBusiness = async (id: string) => {
    for (const t of RESULT_TABLES) await supabase.from(t).delete().eq("business_id", id);
    const { error } = await supabase.from("business_store").delete().eq("id", id);
    if (error) return toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    setBusinesses((prev) => prev.filter((b) => b.id !== id));
    toast({ title: "Analysis deleted" });
  };

  const initials = (fullName || user?.email || "?").slice(0, 2).toUpperCase();
  const joined = user?.created_at ? new Date(user.created_at).toLocaleDateString() : "";

  if (loading) return <div className="grid h-full place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-5 md:p-8 animate-fade-in">
      <Seo title="Your Profile — Planz" description="Manage your Planz account, password and saved analyses." path="/profile" noindex />

      <div className="panel-surface flex items-center gap-4 p-5">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full border border-border object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">{initials}</div>
        )}
        <div className="min-w-0 flex-1">
          <p className="eyebrow">Account</p>
          <h1 className="truncate font-display text-2xl font-semibold">{fullName || "Your profile"}</h1>
          <p className="truncate text-sm text-muted-foreground">{user?.email} · Joined {joined}</p>
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-display text-2xl font-semibold text-primary">{businesses.length}</p>
          <p className="text-xs text-muted-foreground">analyses</p>
        </div>
      </div>

      <form onSubmit={saveProfile} className="panel-surface space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><User className="h-4 w-4 text-primary" /> Personal details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" value={fullName} maxLength={100} onChange={(e) => setFullName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" value={user?.email || ""} disabled /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="avatar">Photo link (optional)</Label><Input id="avatar" type="url" placeholder="https://…" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} /></div>
        </div>
        <Button type="submit" disabled={saving}>{saving && <Loader2 className="animate-spin" />} Save changes</Button>
      </form>

      <form onSubmit={changePassword} className="panel-surface space-y-4 p-5">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><KeyRound className="h-4 w-4 text-primary" /> Password</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="cur">Current</Label><Input id="cur" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label htmlFor="new">New</Label><Input id="new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required /></div>
          <div className="space-y-1.5"><Label htmlFor="conf">Confirm</Label><Input id="conf" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required /></div>
        </div>
        <Button type="submit" variant="outline" disabled={pwSaving}>{pwSaving && <Loader2 className="animate-spin" />} Update password</Button>
      </form>

      <div className="panel-surface space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><Briefcase className="h-4 w-4 text-primary" /> Your analyses</h2>
          <Button size="sm" onClick={() => navigate("/setup")}>New brief</Button>
        </div>
        {businesses.length === 0 && <p className="text-sm text-muted-foreground">No analyses yet.</p>}
        {businesses.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-md border border-border bg-background/40 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{b.business_name}</p>
              <p className="text-xs text-muted-foreground">{b.stage}{b.industry ? ` · ${b.industry}` : ""} · {new Date(b.created_at).toLocaleDateString()}</p>
            </div>
            <Button size="icon" variant="ghost" title="Open" onClick={() => { localStorage.setItem("planz_business_id", b.id); navigate(`/dashboard?id=${b.id}`); }}><ExternalLink /></Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button size="icon" variant="ghost" title="Delete"><Trash2 className="text-destructive" /></Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete "{b.business_name}"?</AlertDialogTitle><AlertDialogDescription>This removes the brief, all agent results and its advisor chat. This can't be undone.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => deleteBusiness(b.id)}>Delete</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
      </div>

      <div className="panel-surface flex items-center justify-between p-5">
        <div><h2 className="font-display text-lg font-semibold">Sign out</h2><p className="text-sm text-muted-foreground">End your session on this device.</p></div>
        <Button variant="outline" onClick={async () => { await signOut(); navigate("/"); }}><LogOut /> Sign out</Button>
      </div>
    </div>
  );
};

export default ProfilePage;
