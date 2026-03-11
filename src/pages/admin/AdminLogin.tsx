import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein'),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { signIn, user, isLoading, roles } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isLoading && user && roles.length > 0 && !hasRedirected.current) {
      if (roles.includes('admin')) {
        hasRedirected.current = true;
        navigate('/admin', { replace: true });
      } else {
        toast({ title: 'Zugriff verweigert', description: 'Dieses Konto hat keine Admin-Berechtigung.', variant: 'destructive' });
      }
    }
  }, [user, isLoading, roles, navigate, toast]);

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
    }
  };

  if (isLoading || (user && hasRedirected.current)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />

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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/20 mb-4"
          >
            <ShieldCheck className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium text-destructive">Admin-Bereich</span>
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Admin Login</h1>
          <p className="text-muted-foreground">Zugang nur für Administratoren</p>
        </div>

        <Card className="glass border-border/50">
          <CardHeader className="pb-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">E-Mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="admin-email" type="email" placeholder="admin@zentime.de"
                    value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-10 bg-secondary/50 border-border/50" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Passwort</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="admin-password" type="password" placeholder="••••••••"
                    value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-10 bg-secondary/50 border-border/50" required />
                </div>
              </div>
              <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Anmelden…</>
                ) : (
                  <>Anmelden<ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>
          </CardHeader>
        </Card>

        <div className="text-center mt-6">
          <a href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ← Zurück zur Startseite
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
