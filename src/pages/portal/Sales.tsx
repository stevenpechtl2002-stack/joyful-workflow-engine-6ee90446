import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PortalSidebar from '@/components/portal/PortalSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Plus, Receipt, Euro, CreditCard, Banknote, Smartphone, Globe, Trash2, Calculator, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_type: string;
  customer_name: string;
  amount: number;
  payment_method: string;
  payment_amount: number;
  transaction_date: string;
  transaction_time: string;
  notes: string | null;
  staff_member_id: string | null;
}

interface DailyClosing {
  id: string;
  closing_date: string;
  gross_revenue_services: number;
  gross_revenue_products: number;
  net_revenue: number;
  vat_amount: number;
  vat_rate: number;
  payment_cash: number;
  payment_card: number;
  payment_online: number;
  payment_other: number;
  cash_drawer_start: number;
  cash_drawer_end: number;
  cash_deposits: number;
  cash_withdrawals: number;
  status: string;
  closed_at: string | null;
}

const paymentMethodLabels: Record<string, string> = {
  bar: 'Bar',
  karte_ec: 'EC-Karte',
  karte_kredit: 'Kreditkarte',
  online: 'Online',
  tap_to_pay: 'Tap to Pay',
};

const paymentMethodIcons: Record<string, React.ReactNode> = {
  bar: <Banknote className="w-4 h-4" />,
  karte_ec: <CreditCard className="w-4 h-4" />,
  karte_kredit: <CreditCard className="w-4 h-4" />,
  online: <Globe className="w-4 h-4" />,
  tap_to_pay: <Smartphone className="w-4 h-4" />,
};

const Sales = () => {
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyClosing, setDailyClosing] = useState<DailyClosing | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewSale, setShowNewSale] = useState(false);
  const [newSale, setNewSale] = useState({
    customer_name: '',
    amount: '',
    payment_method: 'bar',
    notes: '',
  });

  // Kassenabrechnung state
  const [cashDrawerStart, setCashDrawerStart] = useState('');
  const [cashDrawerEnd, setCashDrawerEnd] = useState('');
  const [deposits, setDeposits] = useState('');
  const [withdrawals, setWithdrawals] = useState('');

  // Z-Bon cash drawer inputs
  const [zbonDrawerStart, setZbonDrawerStart] = useState('');
  const [zbonDrawerEnd, setZbonDrawerEnd] = useState('');

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [txRes, closingRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('transaction_date', dateStr)
        .order('transaction_time', { ascending: true }),
      supabase
        .from('daily_closings')
        .select('*')
        .eq('user_id', user.id)
        .eq('closing_date', dateStr)
        .maybeSingle(),
    ]);

    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (closingRes.data) {
      const c = closingRes.data as DailyClosing;
      setDailyClosing(c);
      setCashDrawerStart(c.cash_drawer_start?.toString() || '0');
      setCashDrawerEnd(c.cash_drawer_end?.toString() || '0');
      setDeposits(c.cash_deposits?.toString() || '0');
      setWithdrawals(c.cash_withdrawals?.toString() || '0');
      setZbonDrawerStart(c.cash_drawer_start?.toString() || '0');
      setZbonDrawerEnd(c.cash_drawer_end?.toString() || '0');
    } else {
      setDailyClosing(null);
      setCashDrawerStart('0');
      setCashDrawerEnd('0');
      setDeposits('0');
      setWithdrawals('0');
      setZbonDrawerStart('0');
      setZbonDrawerEnd('0');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, dateStr]);

  const totalAmount = transactions.filter(t => t.transaction_type === 'sale').reduce((s, t) => s + Number(t.amount), 0);
  const cashTotal = transactions.filter(t => t.payment_method === 'bar' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const cardTotal = transactions.filter(t => ['karte_ec', 'karte_kredit'].includes(t.payment_method) && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const onlineTotal = transactions.filter(t => t.payment_method === 'online' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const otherTotal = transactions.filter(t => t.payment_method === 'tap_to_pay' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const vatRate = 19;
  const netRevenue = totalAmount / (1 + vatRate / 100);
  const vatAmount = totalAmount - netRevenue;

  // Kassenabrechnung calculations
  const drawerStart = parseFloat(cashDrawerStart) || 0;
  const drawerEnd = parseFloat(cashDrawerEnd) || 0;
  const depositsNum = parseFloat(deposits) || 0;
  const withdrawalsNum = parseFloat(withdrawals) || 0;
  const expectedEnd = drawerStart + cashTotal + depositsNum - withdrawalsNum;
  const difference = drawerEnd - expectedEnd;

  const generateTransactionNumber = () => {
    const datePrefix = format(selectedDate, 'yyyyMMdd');
    const seq = (transactions.length + 1).toString().padStart(3, '0');
    return `TX-${datePrefix}-${seq}`;
  };

  const handleCreateSale = async () => {
    if (!user || !newSale.customer_name || !newSale.amount) return;
    const amount = parseFloat(newSale.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Fehler', description: 'Bitte einen gültigen Betrag eingeben.', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      transaction_number: generateTransactionNumber(),
      transaction_type: 'sale',
      customer_name: newSale.customer_name,
      amount,
      payment_method: newSale.payment_method,
      payment_amount: amount,
      transaction_date: dateStr,
      transaction_time: format(new Date(), 'HH:mm:ss'),
      notes: newSale.notes || null,
    });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Verkauf erfasst' });
      setNewSale({ customer_name: '', amount: '', payment_method: 'bar', notes: '' });
      setShowNewSale(false);
      fetchData();
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Transaktion storniert' });
      fetchData();
    }
  };

  const handleSaveAbrechnung = async () => {
    if (!user) return;
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
      cash_drawer_start: drawerStart,
      cash_drawer_end: drawerEnd,
      cash_deposits: depositsNum,
      cash_withdrawals: withdrawalsNum,
      status: dailyClosing?.status || 'open',
    }, { onConflict: 'user_id,closing_date' });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Kassenabrechnung gespeichert' });
      fetchData();
    }
  };

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

  const DateNav = () => (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="font-semibold text-lg min-w-[180px] text-center">
        {format(selectedDate, 'dd.MM.yyyy', { locale: de })}
      </span>
      <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );

  useEffect(() => {
    if (!authLoading && !user) navigate('/portal/auth');
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="flex min-h-screen bg-background w-full">
      <PortalSidebar />
      <main className="flex-1 overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Verkauf</h1>
            <p className="text-muted-foreground">Kassenbuch, Kassenabrechnung & Z-Bon</p>
          </div>
          <div className="flex items-center gap-3">
            <DateNav />
            <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
              <DialogTrigger asChild>
                <Button className="bg-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Neuer Verkauf
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neuen Verkauf erfassen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Kundenname</Label>
                    <Input value={newSale.customer_name} onChange={e => setNewSale({ ...newSale, customer_name: e.target.value })} placeholder="Kundenname" />
                  </div>
                  <div>
                    <Label>Betrag (€)</Label>
                    <Input type="number" step="0.01" value={newSale.amount} onChange={e => setNewSale({ ...newSale, amount: e.target.value })} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Zahlungsart</Label>
                    <Select value={newSale.payment_method} onValueChange={v => setNewSale({ ...newSale, payment_method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(paymentMethodLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Notizen (optional)</Label>
                    <Input value={newSale.notes} onChange={e => setNewSale({ ...newSale, notes: e.target.value })} placeholder="Notizen..." />
                  </div>
                  <Button onClick={handleCreateSale} className="w-full">Verkauf speichern</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="kassenbuch">
          <TabsList>
            <TabsTrigger value="kassenbuch">
              <Receipt className="w-4 h-4 mr-2" />
              Kassenbuch
            </TabsTrigger>
            <TabsTrigger value="abrechnung">
              <Calculator className="w-4 h-4 mr-2" />
              Kassenabrechnung
            </TabsTrigger>
            <TabsTrigger value="zbon">
              <Euro className="w-4 h-4 mr-2" />
              Z-Bon
            </TabsTrigger>
          </TabsList>

          {/* ===== KASSENBUCH ===== */}
          <TabsContent value="kassenbuch" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zeit</TableHead>
                          <TableHead>Trans.-Nr.</TableHead>
                          <TableHead>Typ</TableHead>
                          <TableHead>Kunde</TableHead>
                          <TableHead className="text-right">Gesamt</TableHead>
                          <TableHead>Zahlung</TableHead>
                          <TableHead className="text-right">Betrag</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              Keine Transaktionen für diesen Tag
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map(tx => (
                            <TableRow key={tx.id}>
                              <TableCell className="font-mono text-sm">{tx.transaction_time?.substring(0, 5)}</TableCell>
                              <TableCell className="font-mono text-sm">{tx.transaction_number}</TableCell>
                              <TableCell>
                                <Badge variant="default" className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                                  VERKAUF
                                </Badge>
                              </TableCell>
                              <TableCell>{tx.customer_name}</TableCell>
                              <TableCell className="text-right font-semibold">{Number(tx.amount).toFixed(2)} €</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {paymentMethodIcons[tx.payment_method]}
                                  <span className="text-sm">{paymentMethodLabels[tx.payment_method] || tx.payment_method}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">{Number(tx.payment_amount).toFixed(2)} €</TableCell>
                              <TableCell>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Transaktion stornieren?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Transaktion {tx.transaction_number} ({Number(tx.amount).toFixed(2)} €) wird unwiderruflich gelöscht.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteTransaction(tx.id)} className="bg-destructive text-destructive-foreground">
                                        Stornieren
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Summary Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Brutto-Umsätze
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Dienstleistungen</span>
                      <span className="font-semibold">{totalAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Produkte</span>
                      <span className="font-semibold">0,00 €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Gesamt</span>
                      <span>{totalAmount.toFixed(2)} €</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Zahlungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Banknote className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Bar</span>
                      </div>
                      <span className="font-semibold">{cashTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Karte</span>
                      </div>
                      <span className="font-semibold">{cardTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Online</span>
                      </div>
                      <span className="font-semibold">{onlineTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Sonstige</span>
                      </div>
                      <span className="font-semibold">{otherTotal.toFixed(2)} €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Gesamt</span>
                      <span>{(cashTotal + cardTotal + onlineTotal + otherTotal).toFixed(2)} €</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===== KASSENABRECHNUNG ===== */}
          <TabsContent value="abrechnung" className="mt-4">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Kassenschublade */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Kassenschublade
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Anfangsbestand (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cashDrawerStart}
                        onChange={e => setCashDrawerStart(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Ist-Endbestand (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cashDrawerEnd}
                        onChange={e => setCashDrawerEnd(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Einzahlungen & Entnahmen */}
              <Card>
                <CardHeader>
                  <CardTitle>Einzahlungen & Entnahmen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-2">
                        <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
                        Einzahlungen (€)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={deposits}
                        onChange={e => setDeposits(e.target.value)}
                        placeholder="z.B. Wechselgeld-Einlage"
                      />
                      <p className="text-xs text-muted-foreground mt-1">z.B. Wechselgeld-Einlage</p>
                    </div>
                    <div>
                      <Label className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-red-600" />
                        Entnahmen (€)
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={withdrawals}
                        onChange={e => setWithdrawals(e.target.value)}
                        placeholder="z.B. Trinkgeld-Entnahme"
                      />
                      <p className="text-xs text-muted-foreground mt-1">z.B. Trinkgeld-Entnahme</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Übersicht */}
              <Card>
                <CardHeader>
                  <CardTitle>Kassenbestand-Übersicht</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anfangsbestand</span>
                    <span className="font-mono">{drawerStart.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">+ Bareinnahmen</span>
                    <span className="font-mono text-emerald-600">+{cashTotal.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">+ Einzahlungen</span>
                    <span className="font-mono text-emerald-600">+{depositsNum.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">− Entnahmen</span>
                    <span className="font-mono text-red-600">−{withdrawalsNum.toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Soll-Endbestand</span>
                    <span className="font-mono">{expectedEnd.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Ist-Endbestand</span>
                    <span className="font-mono">{drawerEnd.toFixed(2)} €</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Differenz</span>
                    <span className={`font-mono ${difference === 0 ? 'text-emerald-600' : difference > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {difference >= 0 ? '+' : ''}{difference.toFixed(2)} €
                    </span>
                  </div>
                  {difference !== 0 && (
                    <p className="text-sm text-muted-foreground">
                      {difference > 0 ? 'Kassenüberschuss' : 'Kassenfehlbetrag'} von {Math.abs(difference).toFixed(2)} €
                    </p>
                  )}
                </CardContent>
              </Card>

              <Button onClick={handleSaveAbrechnung} className="w-full">
                <Calculator className="w-4 h-4 mr-2" />
                Kassenabrechnung speichern
              </Button>
            </div>
          </TabsContent>

          {/* ===== Z-BON ===== */}
          <TabsContent value="zbon" className="mt-4">
            <div className="max-w-lg mx-auto">
              <Card className="border-2 border-dashed">
                <CardContent className="p-8 space-y-6">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-bold">{profile?.company_name || profile?.full_name || 'Salon'}</h2>
                    <p className="text-sm text-muted-foreground">Z-Bon / Tagesabschluss</p>
                    <p className="text-sm font-mono">{format(selectedDate, 'dd.MM.yyyy', { locale: de })}</p>
                    {dailyClosing?.status === 'closed' && (
                      <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">
                        Abgeschlossen
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {/* Revenue */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Brutto-Umsätze</h3>
                    <div className="flex justify-between">
                      <span>Dienstleistungen</span>
                      <span className="font-mono">{totalAmount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Produkte</span>
                      <span className="font-mono">0,00 €</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Brutto Gesamt</span>
                      <span className="font-mono">{totalAmount.toFixed(2)} €</span>
                    </div>
                  </div>

                  {/* Tax */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Steuer</h3>
                    <div className="flex justify-between">
                      <span>Netto</span>
                      <span className="font-mono">{netRevenue.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>MwSt. ({vatRate}%)</span>
                      <span className="font-mono">{vatAmount.toFixed(2)} €</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Payments */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Zahlungen</h3>
                    <div className="flex justify-between">
                      <span>Bar</span>
                      <span className="font-mono">{cashTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Karte</span>
                      <span className="font-mono">{cardTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Online</span>
                      <span className="font-mono">{onlineTotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sonstige</span>
                      <span className="font-mono">{otherTotal.toFixed(2)} €</span>
                    </div>
                  </div>

                  <Separator />

                  {/* Cash Drawer with editable inputs */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Kassenschublade</h3>
                    {(!dailyClosing || dailyClosing.status !== 'closed') ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Anfangsbestand (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={zbonDrawerStart}
                              onChange={e => setZbonDrawerStart(e.target.value)}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Ist-Endbestand (€)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={zbonDrawerEnd}
                              onChange={e => setZbonDrawerEnd(e.target.value)}
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bareinnahmen</span>
                          <span className="font-mono">{cashTotal.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Soll-Endbestand</span>
                          <span className="font-mono">{((parseFloat(zbonDrawerStart) || 0) + cashTotal).toFixed(2)} €</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Anfangsbestand</span>
                          <span className="font-mono">{(dailyClosing.cash_drawer_start ?? 0).toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Einnahmen Bar</span>
                          <span className="font-mono">{cashTotal.toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Einzahlungen</span>
                          <span className="font-mono">{(dailyClosing.cash_deposits ?? 0).toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Entnahmen</span>
                          <span className="font-mono">−{(dailyClosing.cash_withdrawals ?? 0).toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between font-bold">
                          <span>Endbestand</span>
                          <span className="font-mono">{(dailyClosing.cash_drawer_end ?? 0).toFixed(2)} €</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {(!dailyClosing || dailyClosing.status !== 'closed') && (
                    <Button onClick={handleCloseDay} className="w-full" variant="default">
                      <Receipt className="w-4 h-4 mr-2" />
                      Tagesabschluss erstellen
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
    </div>
  );
};

export default Sales;
