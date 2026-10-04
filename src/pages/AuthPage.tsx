import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Sparkles, ShieldCheck, Workflow } from 'lucide-react';
import Seo from '@/components/Seo';

const AuthPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');

  useEffect(() => {
    if (user) checkExistingBusiness(user.id);
  }, [user]);

  const checkExistingBusiness = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('business_store')
        .select('id')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) console.warn('business_store lookup', error);
      if (data?.id) navigate('/dashboard', { replace: true });
      else navigate('/setup', { replace: true });
    } catch (e) {
      console.warn('business_store lookup threw', e);
      navigate('/setup', { replace: true });
    }
  };

  const handleForgotPassword = async () => {
    if (!loginEmail) {
      toast({ title: 'Enter your email', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'Reset email sent', description: 'Check your inbox.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      toast({ title: 'Welcome back' });
      setIsLoading(false);
      // Fire-and-forget routing so a slow DB lookup never traps the spinner
      if (data.user) {
        checkExistingBusiness(data.user.id).catch(() => navigate('/setup', { replace: true }));
      } else {
        navigate('/setup', { replace: true });
      }
    } catch (e: any) {
      toast({ title: 'Sign-in failed', description: e.message, variant: 'destructive' });
      setIsLoading(false);
    }
  };


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword.length < 6) {
      toast({ title: 'Password too short', description: 'At least 6 characters.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: { data: { full_name: signupName }, emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast({ title: 'Account created', description: 'Check your email or sign in directly.' });
    } catch (e: any) {
      toast({ title: 'Sign-up failed', description: e.message, variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Sign In — Planz" description="Sign in or create your Planz account to convene AI strategy agents for your business idea." path="/auth" noindex />
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5 md:px-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}><ArrowLeft /> Back to Planz</Button>
        </div>
      </header>
      <main className="grid min-h-screen lg:grid-cols-2">
        <section className="hidden border-r border-border bg-card/40 p-12 lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-primary font-display font-bold text-primary-foreground">P</span><span className="font-display text-xl font-semibold">Planz</span></div>
          <div className="max-w-xl animate-slide-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs text-muted-foreground"><span className="signal-dot" /> Secure strategy workspace</div>
            <h1 className="font-display text-5xl font-semibold leading-tight">Your strategy office is ready when you are.</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">Sign in to continue your dossier, ask the advisor, or convene a new team of specialist agents.</p>
            <div className="mt-10 grid gap-3">
              <div className="flex items-center gap-3 rounded-md border border-border bg-background/50 p-4"><Workflow className="text-primary" /><span>Four coordinated AI specialists</span></div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-background/50 p-4"><ShieldCheck className="text-primary" /><span>Your business workspace stays private</span></div>
              <div className="flex items-center gap-3 rounded-md border border-border bg-background/50 p-4"><Sparkles className="text-primary" /><span>Continue from your latest strategy</span></div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Planz Strategy Engine · 2026</p>
        </section>

        <section className="flex items-center justify-center px-5 py-24 md:px-10">
          <div className="w-full max-w-md animate-slide-up">
            <p className="eyebrow text-primary">Strategy workspace</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Welcome to Planz.</h2>
            <p className="mt-3 text-muted-foreground">Sign in to continue, or create your workspace in seconds.</p>
            <Tabs defaultValue="login" className="mt-9 w-full">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-md border border-border bg-card p-1">
                <TabsTrigger value="login" className="rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2"><Label htmlFor="le">Email</Label><Input id="le" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="h-12 bg-card" placeholder="you@company.com" required /></div>
                  <div className="space-y-2"><Label htmlFor="lp">Password</Label><Input id="lp" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="h-12 bg-card" placeholder="Enter your password" required /></div>
                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin" />} Sign in</Button>
                  <Button type="button" variant="link" onClick={handleForgotPassword} className="w-full text-muted-foreground" disabled={isLoading}>Forgot your password?</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2"><Label htmlFor="sn">Name</Label><Input id="sn" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="h-12 bg-card" placeholder="Your name" required /></div>
                  <div className="space-y-2"><Label htmlFor="se">Email</Label><Input id="se" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="h-12 bg-card" placeholder="you@company.com" required /></div>
                  <div className="space-y-2"><Label htmlFor="sp">Password</Label><Input id="sp" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} minLength={6} className="h-12 bg-card" placeholder="At least 6 characters" required /></div>
                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin" />} Create account</Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthPage;
