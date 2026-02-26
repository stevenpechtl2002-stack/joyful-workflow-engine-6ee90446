import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  payment_method: string;
  payment_amount: number;
}

interface DailyClosing {
  id: string;
  closing_date: string;
  cash_drawer_start: number;
  cash_drawer_end: number;
  cash_deposits: number;
  cash_withdrawals: number;
  status: string;
}

const ZBonView = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyClosing, setDailyClosing] = useState<DailyClosing | null>(null);
  const [zbonDrawerStart, setZbonDrawerStart] = useState('0');
  const [zbonDrawerEnd, setZbonDrawerEnd] = useState('0');
  const [deposits, setDeposits] = useState('0');
  const [withdrawals, setWithdrawals] = useState('0');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const fetchData = async () => {
    if (!user) return;
    const [txRes, closingRes] = await Promise.all([
      supabase.from('transactions').select('id, transaction_type, amount, payment_method, payment_amount').eq('user_id', user.id).eq('transaction_date', dateStr),
      supabase.from('daily_closings').select('*').eq('user_id', user.id).eq('closing_date', dateStr).maybeSingle(),
    ]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (closingRes.data) {
      const c = closingRes.data as any;
      setDailyClosing(c);
      setZbonDrawerStart(c.cash_drawer_start?.toString() || '0');
      setZbonDrawerEnd(c.cash_drawer_end?.toString() || '0');
      setDeposits(c.cash_deposits?.toString() || '0');
      setWithdrawals(c.cash_withdrawals?.toString() || '0');
    } else {
      setDailyClosing(null);
      setZbonDrawerStart('0');
      setZbonDrawerEnd('0');
      setDeposits('0');
      setWithdrawals('0');
    }
  };

  useEffect(() => { fetchData(); }, [user, dateStr]);

  const totalAmount = transactions.filter(t => t.transaction_type === 'sale').reduce((s, t) => s + Number(t.amount), 0);
  const cashTotal = transactions.filter(t => t.payment_method === 'bar' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const cardTotal = transactions.filter(t => ['karte_ec', 'karte_kredit'].includes(t.payment_method) && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const onlineTotal = transactions.filter(t => t.payment_method === 'online' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const otherTotal = transactions.filter(t => t.payment_method === 'tap_to_pay' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const vatRate = 19;
  const netRevenue = totalAmount / (1 + vatRate / 100);
  const vatAmount = totalAmount - netRevenue;
  const depositsNum = parseFloat(deposits) || 0;
  const withdrawalsNum = parseFloat(withdrawals) || 0;

  const handleCloseDay = async () => {
    if (!user) return;
    const startVal = parseFloat(zbonDrawerStart) || 0;
    const endVal = parseFloat(zbonDrawerEnd) || 0;
    const { error } = await supabase.from('daily_closings').upsert({
      user_id: user.id,
      closing_date: dateStr,
      gross_revenue_services: totalAmount,
      gross_revenue_products: 0,
      net_revenue: Math.round(netRevenue * 100) / 100,
      vat_amount: Math.round(vatAmount * 100) / 100,
      vat_rate: vatRate,
      payment_cash: cashTotal,
      payment_card: cardTotal,
      payment_online: onlineTotal,
      payment_other: otherTotal,
      cash_drawer_start: startVal,
      cash_drawer_end: endVal,
      cash_deposits: depositsNum,
      cash_withdrawals: withdrawalsNum,
      status: 'closed',
      closed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,closing_date' });
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tagesabschluss erstellt' });
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold">Z-Bon / Tagesabschluss</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-semibold min-w-[160px] text-center">{format(selectedDate, 'dd.MM.yyyy', { locale: de })}</span>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        <Card className="border-2 border-dashed">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold">{profile?.company_name || profile?.full_name || 'Salon'}</h2>
              <p className="text-sm text-muted-foreground">Z-Bon / Tagesabschluss</p>
              <p className="text-sm font-mono">{format(selectedDate, 'dd.MM.yyyy', { locale: de })}</p>
              {dailyClosing?.status === 'closed' && (
                <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Abgeschlossen</Badge>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Brutto-Umsätze</h3>
              <div className="flex justify-between"><span>Dienstleistungen</span><span className="font-mono">{totalAmount.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span>Produkte</span><span className="font-mono">0,00 €</span></div>
              <Separator />
              <div className="flex justify-between font-bold"><span>Brutto Gesamt</span><span className="font-mono">{totalAmount.toFixed(2)} €</span></div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Steuer</h3>
              <div className="flex justify-between"><span>Netto</span><span className="font-mono">{netRevenue.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span>MwSt. ({vatRate}%)</span><span className="font-mono">{vatAmount.toFixed(2)} €</span></div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Zahlungen</h3>
              <div className="flex justify-between"><span>Bar</span><span className="font-mono">{cashTotal.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span>Karte</span><span className="font-mono">{cardTotal.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span>Online</span><span className="font-mono">{onlineTotal.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span>Sonstige</span><span className="font-mono">{otherTotal.toFixed(2)} €</span></div>
            </div>
            <Separator />
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Kassenschublade</h3>
              {(!dailyClosing || dailyClosing.status !== 'closed') ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Anfangsbestand (€)</Label><Input type="number" step="0.01" value={zbonDrawerStart} onChange={e => setZbonDrawerStart(e.target.value)} className="h-9" /></div>
                    <div><Label className="text-xs">Ist-Endbestand (€)</Label><Input type="number" step="0.01" value={zbonDrawerEnd} onChange={e => setZbonDrawerEnd(e.target.value)} className="h-9" /></div>
                  </div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Bareinnahmen</span><span className="font-mono">{cashTotal.toFixed(2)} €</span></div>
                  <div className="flex justify-between font-bold"><span>Soll-Endbestand</span><span className="font-mono">{((parseFloat(zbonDrawerStart) || 0) + cashTotal).toFixed(2)} €</span></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between"><span>Anfangsbestand</span><span className="font-mono">{(dailyClosing.cash_drawer_start ?? 0).toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Einnahmen Bar</span><span className="font-mono">{cashTotal.toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Einzahlungen</span><span className="font-mono">{(dailyClosing.cash_deposits ?? 0).toFixed(2)} €</span></div>
                  <div className="flex justify-between"><span>Entnahmen</span><span className="font-mono">−{(dailyClosing.cash_withdrawals ?? 0).toFixed(2)} €</span></div>
                  <div className="flex justify-between font-bold"><span>Endbestand</span><span className="font-mono">{(dailyClosing.cash_drawer_end ?? 0).toFixed(2)} €</span></div>
                </div>
              )}
            </div>
            {(!dailyClosing || dailyClosing.status !== 'closed') && (
              <Button onClick={handleCloseDay} className="w-full" variant="default">
                <Receipt className="w-4 h-4 mr-2" />Tagesabschluss erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ZBonView;
