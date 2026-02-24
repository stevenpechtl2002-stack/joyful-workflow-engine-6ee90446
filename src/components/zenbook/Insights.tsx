import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react';
import { Appointment, Service, Staff } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface Props {
  appointments: Appointment[];
  services: Service[];
  staff: Staff[];
}

const Insights: React.FC<Props> = ({ appointments }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<{
    summary: string;
    tips: string[];
    nextWeekOutlook: string;
  } | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    // Simulated AI insights for demo purposes
    setTimeout(() => {
      setInsights({
        summary: "Dein Salon zeigt eine stabile Auslastung mit einem leichten Wachstum von 12% gegenüber der Vorwoche. Die Kundenbindung ist konstant bei 74%.",
        tips: [
          "Biete Paketpreise für wiederkehrende Kunden an, um die Bindungsrate zu erhöhen.",
          "Nutze Social Media für zeitlich begrenzte Promotionen an Wochentagen.",
          "Optimiere die Pausenzeiten zwischen den Terminen für maximale Effizienz."
        ],
        nextWeekOutlook: "Erwarte eine erhöhte Nachfrage am Freitag und Samstag. Stelle sicher, dass ausreichend Personal eingeplant ist."
      });
      setLoading(false);
    }, 1500);
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Mock data for charts
  const chartData = [
    { name: 'Mo', bookings: 12, revenue: 450 },
    { name: 'Di', bookings: 19, revenue: 680 },
    { name: 'Mi', bookings: 15, revenue: 520 },
    { name: 'Do', bookings: 22, revenue: 890 },
    { name: 'Fr', bookings: 30, revenue: 1200 },
    { name: 'Sa', bookings: 25, revenue: 950 },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-serif font-bold text-foreground">Analyse & Insights</h3>
          <p className="text-muted-foreground">Dein Salon auf einen Blick – powered by AI.</p>
        </div>
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          Insights aktualisieren
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Summary */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Gesamtbuchungen</p>
            <h4 className="text-3xl font-bold text-foreground">{appointments.length}</h4>
            <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-3 h-3" /> +12% vs. Vorwoche
            </div>
          </div>
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Umsatz Schätzung</p>
            <h4 className="text-3xl font-bold text-foreground">1.240 €</h4>
            <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-3 h-3" /> +8% vs. Vormonat
            </div>
          </div>
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Kundenbindung</p>
            <h4 className="text-3xl font-bold text-foreground">74%</h4>
            <div className="mt-2 flex items-center gap-1 text-muted-foreground text-xs font-bold">
              Konstant bleibend
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="bg-foreground rounded-3xl p-8 text-background flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">AI Intelligence</span>
            </div>
            
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                <div className="h-4 bg-muted/20 rounded w-full"></div>
                <div className="h-4 bg-muted/20 rounded w-5/6"></div>
              </div>
            ) : (
              <>
                <h4 className="text-xl font-bold mb-4">Strategischer Überblick</h4>
                <p className="text-muted/80 text-sm leading-relaxed mb-6">
                  {insights?.summary || "Analysiere deine Geschäftsdaten..."}
                </p>
                <div className="space-y-3">
                  {insights?.tips.map((tip, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-background/5 rounded-2xl items-start">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                      <p className="text-xs text-muted/70">{tip}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="mt-8 pt-8 border-t border-background/10 relative z-10">
            <p className="text-[10px] text-muted/50 uppercase tracking-widest font-bold mb-2">Ausblick nächste Woche</p>
            <p className="text-sm font-medium text-muted/70">{insights?.nextWeekOutlook || "Lade Prognose..."}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-border shadow-sm h-[400px]">
          <h4 className="font-bold text-foreground mb-6 flex items-center justify-between">
            Wöchentliche Auslastung
            <span className="text-xs font-medium text-muted-foreground">Buchungen pro Tag</span>
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorBook" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Area type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorBook)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card p-8 rounded-3xl border border-border shadow-sm h-[400px]">
          <h4 className="font-bold text-foreground mb-6">Einnahmen Trend</h4>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
              <Tooltip 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[10, 10, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Insights;