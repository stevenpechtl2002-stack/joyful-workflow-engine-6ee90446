import React, { useState } from 'react';
import { Copy, Eye, EyeOff, RefreshCw, CheckCircle, Key } from 'lucide-react';
import { useCustomerApiKey } from '@/hooks/useCustomerApiKey';
import { useToast } from '@/hooks/use-toast';

const ApiSettings: React.FC = () => {
  const { apiKey, loading, regenerateKey } = useCustomerApiKey();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const maskedKey = apiKey ? `${apiKey.api_key.slice(0, 8)}${'•'.repeat(24)}` : '';
  const fullKey = apiKey?.api_key || '';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullKey);
    setCopied(true);
    toast({ title: 'Kopiert!', description: 'API-Key wurde in die Zwischenablage kopiert.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (!confirm('Bist du sicher? Der alte Key wird sofort ungültig.')) return;
    setRegenerating(true);
    try {
      await regenerateKey();
      toast({ title: 'Neuer Key generiert', description: 'Dein neuer API-Key ist aktiv.' });
    } catch {
      toast({ title: 'Fehler', description: 'Key konnte nicht generiert werden.', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20 text-muted-foreground">Laden...</div>;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground mb-2">API-Einstellungen</h2>
        <p className="text-sm text-muted-foreground">Dein persönlicher API-Key für die Integration mit n8n, Voice Agents und anderen Diensten.</p>
      </div>

      {/* API Key Card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl"><Key className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="font-bold text-sm text-foreground">Business API-Key</p>
              <p className="text-xs text-muted-foreground">Automatisch generiert bei Registrierung</p>
            </div>
          </div>
          <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">Aktiv</span>
        </div>

        <div className="flex items-center gap-2 bg-muted rounded-xl p-3 font-mono text-sm">
          <span className="flex-1 truncate select-all">{showKey ? fullKey : maskedKey}</span>
          <button onClick={() => setShowKey(!showKey)} className="p-1.5 hover:bg-background rounded-lg transition-colors text-muted-foreground">
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={handleCopy} className="p-1.5 hover:bg-background rounded-lg transition-colors text-muted-foreground">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/10 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${regenerating ? 'animate-spin' : ''}`} />
          Neuen Key generieren
        </button>
      </div>

      {/* n8n Integration Guide */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-foreground">n8n Integration</h3>
        <p className="text-sm text-muted-foreground">Verwende diesen API-Key in deinem n8n-Workflow als Header:</p>
        <pre className="bg-muted rounded-xl p-4 text-xs overflow-x-auto">
{`{
  "headers": {
    "x-api-key": "${showKey ? fullKey : '<dein-api-key>'}"
  }
}`}
        </pre>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p><strong>Verfügbare Endpoints:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><code>POST /functions/v1/get-available-slots</code> — Freie Termine abfragen</li>
            <li><code>POST /functions/v1/create-reservation</code> — Termin erstellen</li>
            <li><code>POST /functions/v1/cancel-reservation</code> — Termin stornieren</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;
