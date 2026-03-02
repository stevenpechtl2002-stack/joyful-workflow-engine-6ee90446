import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, ArrowRight, ArrowLeft, Building2, Heart, Phone } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

const loginSchema = z.object({
  email: z.string().trim().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

const businessSignupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(100),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

const customerSignupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, 'Name muss mindestens 2 Zeichen lang sein').max(100),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword'],
});

type UserMode = 'business' | 'customer';

const UnifiedAuth = () => {
  const navigate = useNavigate();
  const { signIn, signUp, user, isLoading, roles } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<UserMode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'reset'>('login');
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '', password: '', confirmPassword: '', fullName: '', phone: ''
  });
  const [resetEmail, setResetEmail] = useState('');

  // Redirect after login based on role
  useEffect(() => {
    if (!isLoading && user && roles.length > 0) {
      if (roles.includes('admin')) {
        navigate('/admin');
      } else if (roles.includes('sales')) {
        navigate('/sales');
      } else if (roles.includes('manager') || mode === 'business') {
        navigate('/');
      } else {
        navigate('/storefront/profile');
      }
    }
  }, [user, isLoading, roles, navigate, mode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      toast({ title: 'Fehler', description: result.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await signIn(loginData.email, loginData.password);
    setIsSubmitting(false);
    if (error) {
      toast({
        title: 'Anmeldung fehlgeschlagen',
        description: error.message === 'Invalid login credentials' ? 'E-Mail oder Passwort ist falsch' : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Willkommen zurück!', description: 'Erfolgreich angemeldet.' });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const schema = mode === 'business' ? businessSignupSchema : customerSignupSchema;
    const result = schema.safeParse(signupData);
    if (!result.success) {
      toast({ title: 'Fehler', description: result.error.errors[0].message, variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await signUp(signupData.email, signupData.password, signupData.fullName);
    setIsSubmitting(false);
    if (error) {
      const msg = error.message.includes('already registered') ? 'Diese E-Mail ist bereits registriert' : error.message;
      toast({ title: 'Registrierung fehlgeschlagen', description: msg, variant: 'destructive' });
    } else {
      toast({ title: 'Account erstellt!', description: 'Bitte bestätigen Sie Ihre E-Mail-Adresse.' });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !z.string().email().safeParse(resetEmail).success) {
      toast({ title: 'Fehler', description: 'Bitte geben Sie eine gültige E-Mail ein', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/login`,
    });
    setIsSubmitting(false);
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'E-Mail gesendet', description: 'Überprüfen Sie Ihren Posteingang.' });
      setActiveTab('login');
      setResetEmail('');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Mode selection screen
  if (!mode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg relative z-10"
        >
          <div className="text-center mb-10">
            <h1 className="text-3xl font-display font-bold text-foreground mb-2">Willkommen bei ZenTime</h1>
            <p className="text-muted-foreground">Wie möchten Sie sich anmelden?</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('business')}
              className="glass-card p-8 rounded-2xl border border-border/50 hover:border-primary/40 transition-all text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Salon-Betreiber</h3>
              <p className="text-sm text-muted-foreground">Verwalte dein Geschäft, Termine & Team</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('customer')}
              className="glass-card p-8 rounded-2xl border border-border/50 hover:border-accent/40 transition-all text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Heart className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Kunde</h3>
              <p className="text-sm text-muted-foreground">Buche Termine & entdecke Salons</p>
            </motion.button>
          </div>

          <div className="text-center mt-8">
            <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Zurück zur Startseite
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  const isBusiness = mode === 'business';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4"
          >
            {isBusiness ? <Building2 className="w-4 h-4 text-primary" /> : <Heart className="w-4 h-4 text-accent" />}
            <span className="text-sm font-medium text-primary">
              {isBusiness ? 'Salon-Portal' : 'Kunden-Bereich'}
            </span>
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {isBusiness ? 'Für Salon-Betreiber' : 'Für Kunden'}
          </h1>
          <p className="text-muted-foreground">
            {isBusiness ? 'Verwalte dein Geschäft, Termine und Team' : 'Buche Termine und entdecke Salons'}
          </p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader className="pb-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup' | 'reset')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="signup">Registrieren</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder="ihre@email.de"
                        value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="pl-10 bg-secondary/50 border-border/50" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-password" type="password" placeholder="••••••••"
                        value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="pl-10 bg-secondary/50 border-border/50" required />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Anmelden...' : 'Anmelden'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {!isBusiness && (
                    <>
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">oder</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isSubmitting}
                        onClick={async () => {
                          const { error } = await lovable.auth.signInWithOAuth("google", {
                            redirect_uri: window.location.origin,
                          });
                          if (error) {
                            toast({ title: 'Fehler', description: 'Google-Anmeldung fehlgeschlagen', variant: 'destructive' });
                          }
                        }}
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Mit Google anmelden
                      </Button>
                    </>
                  )}
                  <button type="button" onClick={() => setActiveTab('reset')}
                    className="w-full text-sm text-muted-foreground hover:text-primary transition-colors mt-2">
                    Passwort vergessen?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="reset" className="mt-6">
                <form onSubmit={handlePasswordReset} className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Geben Sie Ihre E-Mail ein, um einen Reset-Link zu erhalten.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="reset-email" type="email" placeholder="ihre@email.de"
                        value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                        className="pl-10 bg-secondary/50 border-border/50" required />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Senden...' : 'Link senden'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <button type="button" onClick={() => setActiveTab('login')}
                    className="w-full flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mt-2">
                    <ArrowLeft className="w-3 h-3" /> Zurück zur Anmeldung
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Vollständiger Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-name" type="text" placeholder="Max Mustermann"
                        value={signupData.fullName} onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        className="pl-10 bg-secondary/50 border-border/50" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-Mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="ihre@email.de"
                        value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className="pl-10 bg-secondary/50 border-border/50" required />
                    </div>
                  </div>
                  {!isBusiness && (
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone">Telefon (optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-phone" type="tel" placeholder="+49 123 456789"
                          value={signupData.phone} onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          className="pl-10 bg-secondary/50 border-border/50" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Passwort</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-password" type="password" placeholder="••••••••"
                        value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className="pl-10 bg-secondary/50 border-border/50" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Passwort bestätigen</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-confirm" type="password" placeholder="••••••••"
                        value={signupData.confirmPassword} onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className="pl-10 bg-secondary/50 border-border/50" required />
                    </div>
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Registrieren...' : 'Account erstellen'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {!isBusiness && (
                    <>
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">oder</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={isSubmitting}
                        onClick={async () => {
                          const { error } = await lovable.auth.signInWithOAuth("google", {
                            redirect_uri: window.location.origin,
                          });
                          if (error) {
                            toast({ title: 'Fehler', description: 'Google-Anmeldung fehlgeschlagen', variant: 'destructive' });
                          }
                        }}
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Mit Google registrieren
                      </Button>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <button onClick={() => { setMode(null); setActiveTab('login'); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors block mx-auto">
            ← {isBusiness ? 'Ich bin Kunde' : 'Ich bin Salon-Betreiber'}
          </button>
          <a href="/" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors block">
            Zurück zur Startseite
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default UnifiedAuth;
