import React from 'react';
import { Sparkles, TrendingUp, Users, Calendar, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useRevenueStats } from '@/hooks/useRevenueStats';
import { useReservations } from '@/hooks/useReservations';
import { format, subDays, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

const Insights: React.FC = () => {
  const { data: stats, isLoading: statsLoading } = useRevenueStats('week');
  const { reservations, loading: reservationsLoading } = useReservations();

  const loading = statsLoading || reservationsLoading;

  // Aggregate reservations by day for the last 7 days
  const chartData = React.useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(now, 6 - i);
      return {
        date: format(startOfDay(date), 'yyyy-MM-dd'),
        name: format(date, 'EEE', { locale: de }),
        bookings: 0,
        revenue: 0,
      };
    });

    reservations?.forEach(r => {
      const day = days.find(d => d.date === r.date);
      if (day) {
        day.bookings += 1;
      }
    });

    return days;
  }, [reservations]);

  const totalBookings = stats?.totalReservationCount ?? 0;
  const periodRevenue = stats?.periodRevenue ?? 0;
  const totalCustomers = stats?.totalCustomers ?? 0;
  const todayBookings = stats?.todayReservationCount ?? 0;
  const todayRevenue = stats?.todayRevenue ?? 0;

  // Data-driven summary
  const summaryText = `Diese Woche: ${stats?.periodReservationCount ?? 0} Buchungen mit ${periodRevenue.toFixed(2)} € Umsatz. Heute: ${todayBookings} Buchungen, ${todayRevenue.toFixed(2)} € Umsatz. Insgesamt ${totalCustomers} Kunden in der Datenbank.`;

  const tips = React.useMemo(() => {
    const t: string[] = [];
    if (totalBookings === 0) {
      t.push('Noch keine Buchungen vorhanden – erstelle deine ersten Services und teile deinen Buchungslink.');
    } else {
      if (todayBookings === 0) t.push('Heute noch keine Buchungen – nutze Social Media für kurzfristige Angebote.');
      if (totalCustomers > 0 && totalBookings > 0) {
        const avgPerCustomer = totalBookings / totalCustomers;
        if (avgPerCustomer < 2) t.push('Kundenbindung stärken: Biete Paketpreise oder Stammkunden-Rabatte an.');
      }
      t.push('Optimiere die Pausenzeiten zwischen Terminen für maximale Effizienz.');
    }
    return t;
  }, [totalBookings, todayBookings, totalCustomers]);

  // Count upcoming reservations (future dates)
  const upcomingCount = React.useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return reservations?.filter(r => r.date >= today && r.status !== 'cancelled').length ?? 0;
  }, [reservations]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-serif font-bold text-foreground">Analyse & Insights</h3>
          <p className="text-muted-foreground">Dein Salon auf einen Blick – Live-Daten.</p>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Lade Daten...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Summary */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Gesamtbuchungen</p>
            <h4 className="text-3xl font-bold text-foreground">{totalBookings}</h4>
            <div className="mt-2 text-xs font-bold text-muted-foreground">
              Heute: {todayBookings}
            </div>
          </div>
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Umsatz (Woche)</p>
            <h4 className="text-3xl font-bold text-foreground">{periodRevenue.toFixed(0)} €</h4>
            <div className="mt-2 text-xs font-bold text-muted-foreground">
              Heute: {todayRevenue.toFixed(0)} €
            </div>
          </div>
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">Kunden gesamt</p>
            <h4 className="text-3xl font-bold text-foreground">{totalCustomers}</h4>
            <div className="mt-2 text-xs font-bold text-muted-foreground">
              Neu heute: {stats?.newCustomersToday ?? 0}
            </div>
          </div>
        </div>

        {/* AI Insight Sidebar */}
        <div className="bg-foreground rounded-3xl p-8 text-background flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-primary">Live Insights</span>
            </div>
            
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-muted/20 rounded w-3/4"></div>
                <div className="h-4 bg-muted/20 rounded w-full"></div>
                <div className="h-4 bg-muted/20 rounded w-5/6"></div>
              </div>
            ) : (
              <>
                <h4 className="text-xl font-bold mb-4">Datenbasierter Überblick</h4>
                <p className="text-muted/80 text-sm leading-relaxed mb-6">
                  {summaryText}
                </p>
                <div className="space-y-3">
                  {tips.map((tip, idx) => (
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
            <p className="text-[10px] text-muted/50 uppercase tracking-widest font-bold mb-2">Anstehende Termine</p>
            <p className="text-sm font-medium text-muted/70">{upcomingCount} offene Buchungen</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-border shadow-sm h-[400px]">
          <h4 className="font-bold text-foreground mb-6 flex items-center justify-between">
            Wöchentliche Auslastung
            <span className="text-xs font-medium text-muted-foreground">Buchungen pro Tag (letzte 7 Tage)</span>
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
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} allowDecimals={false} />
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
              <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} allowDecimals={false} />
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
