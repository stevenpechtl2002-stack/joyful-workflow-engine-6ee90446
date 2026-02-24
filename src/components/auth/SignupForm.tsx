import React, { useState } from 'react';
import { Mail, Lock, User, Loader2, CheckCircle, Key, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from './AuthProvider';

interface SignupFormProps {
  onSwitchToLogin?: () => void;
}

export function SignupForm({ onSwitchToLogin }: SignupFormProps) {
  const { signUp } = useAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateApiKey = async (accessToken: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-api-key`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: 'Voice Agent' }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.api_key;
      }
      return null;
    } catch (err) {
      console.error('Error generating API key:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein');
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await signUp(email, password, fullName);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data?.session?.access_token) {
      const apiKey = await generateApiKey(data.session.access_token);
      if (apiKey) {
        setGeneratedApiKey(apiKey);
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  const copyApiKey = () => {
    if (generatedApiKey) {
      navigator.clipboard.writeText(generatedApiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Registrierung erfolgreich!
        </h2>
        
        {generatedApiKey ? (
          <div className="mt-6 text-left">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-5 h-5 text-emerald-500" />
                <p className="font-bold text-foreground">Dein API Key wurde erstellt!</p>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Speichere diesen Key sicher - er wird nur einmal angezeigt.
              </p>
              <div className="flex items-center gap-2 p-3 bg-background rounded-lg border">
                <code className="flex-1 text-xs font-mono break-all text-foreground">
                  {generatedApiKey}
                </code>
                <Button size="sm" variant="ghost" onClick={copyApiKey}>
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-2">API Base URL:</p>
              <code className="text-xs font-mono break-all">
                {import.meta.env.VITE_SUPABASE_URL}/functions/v1/
              </code>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground mb-6">
            Du kannst dich jetzt anmelden und in den Einstellungen einen API Key erstellen.
          </p>
        )}

        {onSwitchToLogin && (
          <Button onClick={onSwitchToLogin} className="mt-6 w-full">
            Zum Dashboard
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
          Konto erstellen
        </h1>
        <p className="text-muted-foreground">
          Starte jetzt mit ZenBook
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Vollständiger Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

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
            placeholder="Passwort (min. 6 Zeichen)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 h-12"
            required
            minLength={6}
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
              Registrieren...
            </>
          ) : (
            'Konto erstellen'
          )}
        </Button>
      </form>

      {onSwitchToLogin && (
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Bereits ein Konto?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary font-semibold hover:underline"
            >
              Jetzt anmelden
            </button>
          </p>
        </div>
      )}
    </div>
  );
}