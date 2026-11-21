import {safeReturnPath} from '@/lib/collaboration';
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
import WorkspacePreview from '@/components/brand/WorkspacePreview';

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
  const [mode, setMode] = useState(new URLSearchParams(window.location.search).get('mode') === 'signup' ? 'signup' : 'login');
  const [recovery, setRecovery] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  useEffect(() => {
    if (user) checkExistingBusiness(user.id);
  }, [user]);

  const checkExistingBusiness = async (uid: string) => {
    const returnTo=new URLSearchParams(window.location.search).get('returnTo');
    if(returnTo){navigate(safeReturnPath(returnTo),{replace:true});return;}

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
      setRecoverySent(true);
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
        options: { data: { full_name: signupName }, emailRedirectTo: window.location.origin + safeReturnPath(new URLSearchParams(window.location.search).get('returnTo')) },
      });
      if (error) throw error;
      toast({ title: 'Account created', description: 'Check your email or sign in directly.' });
    } catch (e: any) {
      toast({ title: 'Sign-up failed', description: e.message, variant: 'destructive' });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Sign In — Planz" description="Sign in or create your Planz account to plan projects and collaborate with your team." path="/auth" noindex />
      <header className="absolute inset-x-0 top-0 z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5 md:px-8">
          <Button variant="ghost" size="sm" className="lg:command-muted" onClick={() => navigate('/')}><ArrowLeft /> Back to Planz</Button>
        </div>
      </header>
      <main className="grid min-h-screen lg:grid-cols-2">
        <section className="command-surface hidden overflow-hidden p-12 pt-24 lg:flex lg:flex-col lg:justify-center">
          <div className="mb-10 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-md bg-primary font-bold text-primary-foreground">P</span><span className="text-xl font-semibold">Planz</span></div>
          <div className="max-w-xl animate-slide-up"><p className="eyebrow command-muted">Your intelligent workspace</p><h1 className="mt-4 text-4xl font-semibold leading-tight">Less scattered work.<br />More forward motion.</h1><p className="command-muted mt-5 text-lg leading-relaxed">Plan smarter. Execute faster. Stay in control.</p><WorkspacePreview className="mt-10 [&_figcaption]:command-muted" /><p className="command-muted mt-7 flex items-center gap-2 text-sm"><ShieldCheck className="h-4 w-4" />Your workspace stays private.</p></div>
        </section>
        <section className="flex items-center justify-center px-5 py-24 md:px-10">
          <div className="w-full max-w-md animate-slide-up">
            <p className="eyebrow text-primary">Planz workspace</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">{recovery ? "Reset your password." : mode === "signup" ? "Build better projects with Planz." : "Welcome back."}</h2>
            <p className="mt-3 text-muted-foreground">{recovery ? "We’ll email you a secure reset link." : mode === "signup" ? "Create your workspace and bring your projects together." : "Your workspace is ready. Let’s make progress."}</p>
            {recovery ? <div className="mt-8 space-y-5">{recoverySent ? <div role="status" className="rounded-md border border-border bg-accent p-5"><ShieldCheck className="mb-3 text-success" /><p className="font-medium">Check your inbox</p><p className="mt-2 text-sm text-muted-foreground">If an account exists for this email, you’ll receive a password reset link.</p></div> : <form onSubmit={e => { e.preventDefault(); void handleForgotPassword(); }} className="space-y-5"><div className="space-y-2"><Label htmlFor="recovery-email">Email</Label><Input id="recovery-email" type="email" autoComplete="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required className="h-12" placeholder="you@company.com" /></div><Button type="submit" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin" />}Send reset link</Button></form>}<Button variant="ghost" className="w-full" onClick={() => {setRecovery(false); setRecoverySent(false);}}><ArrowLeft />Back to sign in</Button></div> : <Tabs value={mode} onValueChange={setMode} className="mt-9 w-full">
              <TabsList className="grid h-11 w-full grid-cols-2 rounded-md border border-border bg-card p-1">
                <TabsTrigger value="login" className="rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Sign in</TabsTrigger>
                <TabsTrigger value="signup" className="rounded data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2"><Label htmlFor="le">Email</Label><Input id="le" autoComplete="email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="h-12 bg-card" placeholder="you@company.com" required /></div>
                  <div className="space-y-2"><Label htmlFor="lp">Password</Label><Input id="lp" autoComplete="current-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="h-12 bg-card" placeholder="Enter your password" required /></div>
                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin" />} Sign in</Button>
                  <Button type="button" variant="link" onClick={() => setRecovery(true)} className="w-full text-muted-foreground" disabled={isLoading}>Forgot your password?</Button>
                </form>
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-5">
                  <div className="space-y-2"><Label htmlFor="sn">Full name</Label><Input id="sn" autoComplete="name" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="h-12 bg-card" placeholder="Your name" required /></div>
                  <div className="space-y-2"><Label htmlFor="se">Email</Label><Input id="se" autoComplete="email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="h-12 bg-card" placeholder="you@company.com" required /></div>
                  <div className="space-y-2"><Label htmlFor="sp">Password</Label><Input id="sp" autoComplete="new-password" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} minLength={6} className="h-12 bg-card" placeholder="At least 6 characters" required /></div>
                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading && <Loader2 className="animate-spin" />} Create account</Button>
                </form>
              </TabsContent>
            </Tabs>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AuthPage;
