import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Database, 
  Trash2, 
  Cpu,
  Terminal,
  Code,
  ShieldCheck,
  RefreshCw,
  Activity
} from 'lucide-react';
import { storageService } from '@/services/storageService';
import { ApiKeyManagement } from './ApiKeyManagement';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  onSimulateIncoming: (payload: any) => void;
}

const Settings: React.FC<Props> = ({ onSimulateIncoming }) => {
  const { isAuthenticated } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState(localStorage.getItem('zenbook_webhook_url') || '');
  const [saveStatus, setSaveStatus] = useState(false);
  const [dbStats, setDbStats] = useState(storageService.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setDbStats(storageService.getStats());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveWebhook = () => {
    localStorage.setItem('zenbook_webhook_url', webhookUrl);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} wurde kopiert!`);
  };

  const apiUrl = `https://api.zenbook.io/v1/webhooks/zen_live_bk_prod`;

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* API Key Management - Only show when authenticated */}
        {isAuthenticated && (
          <div className="xl:col-span-2 bg-card/60 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-xl card-3d rim-light">
            <ApiKeyManagement />
          </div>
        )}

        {/* Database 3D Card */}
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-xl card-3d flex flex-col rim-light">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-2xl font-black text-foreground tracking-tighter">Datenbank</h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Client-Persistence</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            {[
              { label: 'Einträge', val: dbStats.appointments + dbStats.customers + dbStats.salons },
              { label: 'Speicher', val: dbStats.storageUsed },
              { label: 'Kunden', val: dbStats.customers },
              { label: 'Termine', val: dbStats.appointments }
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-card/50 rounded-xl border border-border shadow-inner">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-foreground">{stat.val}</p>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => { if(confirm('Sicher?')) { localStorage.clear(); window.location.reload(); } }}
            className="w-full mt-6 py-4 border border-destructive/30 text-destructive rounded-xl font-black text-[10px] hover:bg-destructive/10 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset Database
          </button>
        </div>

        {/* Simulator Card */}
        <div className="bg-card/60 backdrop-blur-xl rounded-2xl p-8 border border-border shadow-xl card-3d rim-light">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-2xl font-black text-foreground tracking-tighter">n8n Simulator</h4>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Test-Events</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Request Endpoint</label>
              <div className="flex gap-2">
                <div className="flex-1 bg-card/50 border border-border rounded-xl px-5 py-3 font-mono text-[11px] text-foreground flex items-center overflow-hidden">
                  <span className="truncate">{apiUrl}</span>
                </div>
                <button onClick={() => copyToClipboard(apiUrl, "API URL")} className="p-3 bg-foreground text-background rounded-xl hover:bg-primary transition-colors"><Copy className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-5 bg-foreground rounded-xl border border-border flex items-center justify-between shadow-lg">
               <div className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-background text-[10px] font-black uppercase tracking-widest">Voice Agent Test</p>
                    <p className="text-[9px] text-muted">Simuliere eingehenden Anruf</p>
                  </div>
               </div>
               <button 
                onClick={() => onSimulateIncoming({
                  customerName: "Christian K.",
                  serviceName: "Wellness Massage",
                  staffName: "Marco K.",
                  startTime: new Date(new Date().setHours(new Date().getHours() + 2, 0, 0, 0)).toISOString()
                })}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-black text-[10px] hover:bg-primary/90"
               >
                 Simulation
               </button>
            </div>
          </div>
        </div>

        {/* Full-width n8n 3D Container */}
        <div className="xl:col-span-2 bg-foreground rounded-2xl p-10 border border-border shadow-2xl relative overflow-hidden rim-light">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <Terminal className="w-6 h-6 text-primary" />
                <h4 className="text-2xl font-black text-background tracking-tight">Integration Specs</h4>
              </div>
              <div className="bg-background/10 rounded-xl p-6 border border-background/5 shadow-inner">
                <pre className="font-mono text-[10px] text-muted leading-relaxed overflow-x-auto">
{`{
  "customer_name": "Sarah L.",
  "customer_phone": "+49 171 123456",
  "date": "2025-02-07",
  "time": "14:00",
  "staff_id": "uuid",
  "product_id": "uuid"
}`}
                </pre>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { icon: <ShieldCheck className="w-6 h-6 text-primary" />, label: 'Auth', desc: 'API-Key Header' },
                 { icon: <RefreshCw className="w-6 h-6 text-primary" />, label: 'Realtime', desc: 'Live-Updates' },
                 { icon: <Activity className="w-6 h-6 text-primary" />, label: 'Logs', desc: 'Status-Monitor' },
                 { icon: <Code className="w-6 h-6 text-primary" />, label: 'REST', desc: 'JSON API' }
               ].map((item, i) => (
                 <div key={i} className="p-5 bg-background/5 rounded-xl border border-background/5 flex flex-col justify-between group hover:bg-background/10 transition-all cursor-default">
                    {item.icon}
                    <div className="mt-4">
                       <p className="text-background font-black text-[10px] uppercase tracking-widest">{item.label}</p>
                       <p className="text-muted text-[9px] font-bold">{item.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Outgoing Webhook 3D Card */}
        <div className="xl:col-span-2 bg-primary rounded-2xl p-10 shadow-xl relative overflow-hidden rim-light text-primary-foreground">
          <div className="absolute top-0 right-0 w-64 h-64 bg-background/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h4 className="text-3xl font-black tracking-tighter mb-2">Automatisierung</h4>
              <p className="text-primary-foreground/80 font-bold max-w-lg">
                Sende Ereignisse aus dem Kalender an n8n, um Bestätigungen oder Marketing-Aktionen zu triggern.
              </p>
            </div>
            
            <div className="w-full lg:w-[400px] space-y-4">
              <input 
                type="text" 
                placeholder="n8n Webhook URL..." 
                className="w-full px-6 py-4 bg-background/10 border border-background/20 rounded-xl text-sm font-bold outline-none shadow-inner placeholder:text-primary-foreground/40"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <button 
                onClick={handleSaveWebhook}
                className={`w-full py-4 rounded-xl font-black text-xs transition-all shadow-lg ${saveStatus ? 'bg-background text-primary' : 'bg-background text-primary hover:scale-[1.02]'}`}
              >
                {saveStatus ? 'Gespeichert!' : 'Konfiguration sichern'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
