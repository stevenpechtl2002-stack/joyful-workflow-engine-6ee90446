import React, { useState } from 'react';
import { Key, Copy, Plus, Trash2, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useApiKeys, ApiKey } from '@/hooks/useApiKeys';
import { Button } from '@/components/ui/button';

export function ApiKeyManagement() {
  const { apiKeys, loading, generateApiKey, deleteApiKey } = useApiKeys();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateKey = async () => {
    setGenerating(true);
    setError(null);
    setNewKey(null);
    
    try {
      const result = await generateApiKey('Voice Agent');
      setNewKey(result.api_key);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyKey = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteKey = async (id: string) => {
    if (confirm('API-Schlüssel wirklich löschen?')) {
      await deleteApiKey(id);
    }
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
          <Key className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h4 className="text-2xl font-black text-foreground tracking-tighter">API Schlüssel</h4>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Voice Agent Integration</p>
        </div>
      </div>

      {/* New Key Alert */}
      {newKey && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm text-foreground">Neuer API-Schlüssel erstellt!</p>
              <p className="text-xs text-muted-foreground">Kopiere und speichere diesen Schlüssel sicher. Er wird nur einmal angezeigt.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 p-3 bg-background rounded-lg font-mono text-xs break-all">
              {newKey}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyKey(newKey)}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Laden...
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-border rounded-xl">
            <Key className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">Noch keine API-Schlüssel erstellt</p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="p-4 bg-card/50 border border-border rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${key.is_active ? 'bg-primary' : 'bg-muted'}`} />
                <div>
                  <p className="font-mono text-sm text-foreground">{key.key_prefix}</p>
                  <p className="text-xs text-muted-foreground">
                    {key.name} • Erstellt: {new Date(key.created_at).toLocaleDateString('de-DE')}
                    {key.last_used_at && ` • Zuletzt: ${new Date(key.last_used_at).toLocaleDateString('de-DE')}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteKey(key.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Generate Button */}
      <Button
        onClick={handleGenerateKey}
        disabled={generating}
        className="w-full"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generiere...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Neuen API-Schlüssel generieren
          </>
        )}
      </Button>

      {/* API Endpoints Documentation */}
      <div className="p-4 bg-muted/50 rounded-xl space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">API Endpunkte</p>
        <div className="space-y-2 font-mono text-xs">
          <div className="p-2 bg-background rounded flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">GET</span>
            <span className="text-muted-foreground truncate">{supabaseUrl}/functions/v1/get-available-slots</span>
          </div>
          <div className="p-2 bg-background rounded flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">POST</span>
            <span className="text-muted-foreground truncate">{supabaseUrl}/functions/v1/create-reservation</span>
          </div>
          <div className="p-2 bg-background rounded flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold">POST</span>
            <span className="text-muted-foreground truncate">{supabaseUrl}/functions/v1/cancel-reservation</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Sende den API-Schlüssel im Header: <code className="bg-background px-1 rounded">x-api-key: zen_live_...</code>
        </p>
      </div>
    </div>
  );
}
