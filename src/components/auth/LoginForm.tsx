import React, { useState } from 'react';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

interface LoginFormProps {
  onSwitchToSignup?: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError.message === 'Invalid login credentials' 
        ? 'Ungültige Anmeldedaten' 
        : signInError.message);
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
          Willkommen zurück
        </h1>
        <p className="text-muted-foreground">
          Melde dich an, um fortzufahren
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="email"
            placeholder="E-Mail Adresse"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-12 font-bold"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Anmelden...
            </>
          ) : (
            'Anmelden'
          )}
        </Button>
      </form>

      {onSwitchToSignup && (
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Noch kein Konto?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-primary font-semibold hover:underline"
            >
              Jetzt registrieren
            </button>
          </p>
        </div>
      )}
    </div>
  );
}