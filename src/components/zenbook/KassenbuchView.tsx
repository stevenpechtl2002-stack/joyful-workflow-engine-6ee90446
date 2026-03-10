import { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Plus, Banknote, CreditCard, Smartphone, Globe, CheckCircle2, RotateCcw, Printer, Trash2, Shield, Loader2 } from 'lucide-react';
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
  reservation_id: string | null;
  status: string;
  tse_transaction_id: string | null;
  tse_signature: string | null;
  tse_timestamp: string | null;
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

const KassenbuchView = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSale, setShowNewSale] = useState(false);
  const [newSale, setNewSale] = useState({ customer_name: '', amount: '', payment_method: 'bar', notes: '' });
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('transaction_date', dateStr)
      .order('transaction_time', { ascending: true });
    if (data) setTransactions(data as Transaction[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, dateStr]);

  const totalAmount = transactions.filter(t => t.transaction_type === 'sale').reduce((s, t) => s + Number(t.amount), 0);
  const cashTotal = transactions.filter(t => t.payment_method === 'bar' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const cardTotal = transactions.filter(t => ['karte_ec', 'karte_kredit'].includes(t.payment_method) && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const onlineTotal = transactions.filter(t => t.payment_method === 'online' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);
  const otherTotal = transactions.filter(t => t.payment_method === 'tap_to_pay' && t.transaction_type === 'sale').reduce((s, t) => s + Number(t.payment_amount), 0);

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

  const handleCheckout = async () => {
    if (!selectedTransaction || !user) return;
    setCheckoutLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error('Nicht eingeloggt');

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pos-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ transaction_id: selectedTransaction.id }),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Fehler beim Abschluss');

      toast({ title: 'Transaktion abgeschlossen', description: result.tse_signature ? 'TSE-Signatur erstellt' : 'Ohne TSE abgeschlossen' });
      
      // Update local state
      setSelectedTransaction({
        ...selectedTransaction,
        status: 'completed',
        tse_transaction_id: result.tse_transaction_id,
        tse_signature: result.tse_signature,
        tse_timestamp: result.tse_timestamp,
      });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction || !user) return;
    const { error } = await supabase.from('transactions').delete().eq('id', selectedTransaction.id).eq('user_id', user.id);
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Transaktion storniert' });
      setSelectedTransaction(null);
      setShowDeleteConfirm(false);
      fetchData();
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction || !user) return;
    const { error } = await supabase.from('transactions')
      .update({ status: 'refunded' })
      .eq('id', selectedTransaction.id)
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Rückerstattung erfasst' });
      setSelectedTransaction({ ...selectedTransaction, status: 'refunded' });
      fetchData();
    }
  };

  const handlePrintReceipt = () => {
    if (!selectedTransaction) return;
    const receiptContent = `
BELEG
================================
${selectedTransaction.transaction_number}
Datum: ${selectedTransaction.transaction_date} ${selectedTransaction.transaction_time?.substring(0, 5)}
Kunde: ${selectedTransaction.customer_name}
--------------------------------
Betrag: ${Number(selectedTransaction.amount).toFixed(2)} €
Zahlungsart: ${paymentMethodLabels[selectedTransaction.payment_method] || selectedTransaction.payment_method}
--------------------------------
${selectedTransaction.tse_signature ? `TSE: ${selectedTransaction.tse_signature.substring(0, 30)}...` : 'Ohne TSE'}
================================
    `.trim();
    const w = window.open('', '_blank', 'width=300,height=500');
    if (w) {
      w.document.write(`<pre style="font-family:monospace;font-size:12px;padding:20px;">${receiptContent}</pre>`);
      w.document.close();
      w.print();
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'completed') return <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-500/30">Abgeschlossen</Badge>;
    if (status === 'refunded') return <Badge variant="destructive">Erstattet</Badge>;
    return <Badge variant="outline" className="border-amber-500/50 text-amber-700">Offen</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold">Kassenbuch</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subDays(d, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold min-w-[160px] text-center">
            {format(selectedDate, 'dd.MM.yyyy', { locale: de })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addDays(d, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Dialog open={showNewSale} onOpenChange={setShowNewSale}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Neuer Verkauf</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Neuen Verkauf erfassen</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div><Label>Kundenname</Label><Input value={newSale.customer_name} onChange={e => setNewSale({ ...newSale, customer_name: e.target.value })} placeholder="Kundenname" /></div>
                <div><Label>Betrag (€)</Label><Input type="number" step="0.01" value={newSale.amount} onChange={e => setNewSale({ ...newSale, amount: e.target.value })} placeholder="0.00" /></div>
                <div><Label>Zahlungsart</Label>
                  <Select value={newSale.payment_method} onValueChange={v => setNewSale({ ...newSale, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(paymentMethodLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div><Label>Notizen (optional)</Label><Input value={newSale.notes} onChange={e => setNewSale({ ...newSale, notes: e.target.value })} placeholder="Notizen..." /></div>
                <Button onClick={handleCreateSale} className="w-full">Verkauf speichern</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zeit</TableHead>
                    <TableHead>Trans.-Nr.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead className="text-right">Gesamt</TableHead>
                    <TableHead>Zahlung</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Keine Transaktionen für diesen Tag</TableCell></TableRow>
                  ) : (
                    transactions.map(tx => (
                      <TableRow 
                        key={tx.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <TableCell className="font-mono text-sm">{tx.transaction_time?.substring(0, 5)}</TableCell>
                        <TableCell className="font-mono text-sm">{tx.transaction_number}</TableCell>
                        <TableCell>{statusBadge(tx.status || 'open')}</TableCell>
                        <TableCell>{tx.customer_name}</TableCell>
                        <TableCell className="text-right font-semibold">{Number(tx.amount).toFixed(2)} €</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {paymentMethodIcons[tx.payment_method]}
                            <span className="text-sm">{paymentMethodLabels[tx.payment_method] || tx.payment_method}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{Number(tx.payment_amount).toFixed(2)} €</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Brutto-Umsätze</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Dienstleistungen</span><span className="font-semibold">{totalAmount.toFixed(2)} €</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Produkte</span><span className="font-semibold">0,00 €</span></div>
              <Separator />
              <div className="flex justify-between text-lg font-bold"><span>Gesamt</span><span>{totalAmount.toFixed(2)} €</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Zahlungen</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center"><div className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Bar</span></div><span className="font-semibold">{cashTotal.toFixed(2)} €</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Karte</span></div><span className="font-semibold">{cardTotal.toFixed(2)} €</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center gap-2"><Globe className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Online</span></div><span className="font-semibold">{onlineTotal.toFixed(2)} €</span></div>
              <div className="flex justify-between items-center"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-muted-foreground" /><span className="text-sm">Sonstige</span></div><span className="font-semibold">{otherTotal.toFixed(2)} €</span></div>
              <Separator />
              <div className="flex justify-between font-bold"><span>Gesamt</span><span>{(cashTotal + cardTotal + onlineTotal + otherTotal).toFixed(2)} €</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={(open) => { if (!open) setSelectedTransaction(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Transaktionsdetails
            </DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm text-muted-foreground">{selectedTransaction.transaction_number}</span>
                  {statusBadge(selectedTransaction.status || 'open')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedTransaction.transaction_date} · {selectedTransaction.transaction_time?.substring(0, 5)}
                </div>
              </div>

              <Separator />

              {/* Customer */}
              <div>
                <span className="text-sm text-muted-foreground">Kunde</span>
                <p className="font-semibold">{selectedTransaction.customer_name}</p>
              </div>

              {/* Payment */}
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-muted-foreground">Zahlungsart</span>
                  <div className="flex items-center gap-2 mt-1">
                    {paymentMethodIcons[selectedTransaction.payment_method]}
                    <span>{paymentMethodLabels[selectedTransaction.payment_method] || selectedTransaction.payment_method}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-muted-foreground">Betrag</span>
                  <p className="text-2xl font-bold">{Number(selectedTransaction.amount).toFixed(2)} €</p>
                </div>
              </div>

              {selectedTransaction.notes && (
                <>
                  <Separator />
                  <div>
                    <span className="text-sm text-muted-foreground">Notizen</span>
                    <p className="text-sm mt-1">{selectedTransaction.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              {/* ABSCHLIESSEN - only when open */}
              {(!selectedTransaction.status || selectedTransaction.status === 'open') && (
                <Button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                >
                  {checkoutLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Wird abgeschlossen...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5 mr-2" />ABSCHLIESSEN</>
                  )}
                </Button>
              )}

              {/* TSE Info + Actions - only after completion */}
              {selectedTransaction.status === 'completed' && (
                <div className="space-y-3">
                  {/* TSE Signature */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="w-4 h-4 text-emerald-600" />
                      TSE-Signatur
                    </div>
                    {selectedTransaction.tse_signature ? (
                      <p className="font-mono text-xs text-muted-foreground break-all">{selectedTransaction.tse_signature}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Ohne TSE abgeschlossen</p>
                    )}
                    {selectedTransaction.tse_timestamp && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedTransaction.tse_timestamp), 'dd.MM.yyyy HH:mm:ss')}
                      </p>
                    )}
                  </div>

                  {/* Rückerstattung + Belegkopie */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={handleRefund} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Rückerstattung
                    </Button>
                    <Button variant="outline" onClick={handlePrintReceipt} className="gap-2">
                      <Printer className="w-4 h-4" />
                      Belegkopie
                    </Button>
                  </div>
                </div>
              )}

              {selectedTransaction.status === 'refunded' && (
                <div className="bg-destructive/10 rounded-lg p-3 text-center">
                  <p className="text-sm font-medium text-destructive">Diese Transaktion wurde erstattet</p>
                </div>
              )}

              {/* Stornieren - always available */}
              {selectedTransaction.status !== 'refunded' && (
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  Stornieren
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transaktion stornieren?</AlertDialogTitle>
            <AlertDialogDescription>
              Transaktion {selectedTransaction?.transaction_number} ({Number(selectedTransaction?.amount || 0).toFixed(2)} €) wird unwiderruflich gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTransaction} className="bg-destructive text-destructive-foreground">
              Stornieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KassenbuchView;
