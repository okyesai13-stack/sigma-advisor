import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';

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
    if (user) checkExistingBusiness();
  }, [user]);

  const checkExistingBusiness = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('business_store')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) navigate('/dashboard', { replace: true });
      else navigate('/setup', { replace: true });
    } catch {
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
      const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
      if (error) throw error;
      toast({ title: 'Welcome back' });
    } catch (e: any) {
      toast({ title: 'Sign-in failed', description: e.message, variant: 'destructive' });
    } finally { setIsLoading(false); }
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b hairline">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 hover:opacity-80">
            <ArrowLeft className="w-4 h-4" />
            <span className="font-serif text-2xl">Planz</span>
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">Enter the office</p>
            <h1 className="font-serif text-4xl">Welcome.</h1>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-secondary rounded-none">
              <TabsTrigger value="login" className="rounded-none text-xs uppercase tracking-[0.15em]">Sign in</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-none text-xs uppercase tracking-[0.15em]">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="le" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Email</Label>
                  <Input id="le" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="rounded-none border-x-0 border-t-0 px-0 focus-visible:ring-0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Password</Label>
                  <Input id="lp" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="rounded-none border-x-0 border-t-0 px-0 focus-visible:ring-0" required />
                </div>
                <Button type="submit" className="w-full h-12 rounded-none text-xs uppercase tracking-[0.15em]" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Sign in
                </Button>
                <button type="button" onClick={handleForgotPassword} className="w-full text-xs text-muted-foreground hover:text-foreground underline underline-offset-4" disabled={isLoading}>
                  Forgot your password?
                </button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="sn" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Name</Label>
                  <Input id="sn" value={signupName} onChange={(e) => setSignupName(e.target.value)} className="rounded-none border-x-0 border-t-0 px-0 focus-visible:ring-0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="se" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Email</Label>
                  <Input id="se" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="rounded-none border-x-0 border-t-0 px-0 focus-visible:ring-0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp" className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Password</Label>
                  <Input id="sp" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} minLength={6} className="rounded-none border-x-0 border-t-0 px-0 focus-visible:ring-0" required />
                </div>
                <Button type="submit" className="w-full h-12 rounded-none text-xs uppercase tracking-[0.15em]" disabled={isLoading}>
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AuthPage;
