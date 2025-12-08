import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar, 
  FileText, 
  Download,
  CheckCircle,
  Clock,
  Package,
  Euro,
  ExternalLink
} from 'lucide-react';

// Mock data - wird später durch Stripe ersetzt
const mockSubscription = {
  id: 'sub_1',
  name: 'Professional Plan',
  status: 'active' as const,
  price: 99.00,
  currency: 'EUR',
  interval: 'month' as const,
  currentPeriodStart: new Date('2024-12-01'),
  currentPeriodEnd: new Date('2025-01-01'),
  features: [
    'KI-Telefonassistent',
    'Unbegrenzte Anrufe',
    'Workflow-Automatisierungen',
    'Priority Support',
    '24/7 Verfügbarkeit'
  ]
};

const mockInvoices = [
  {
    id: 'inv_001',
    date: new Date('2024-12-01'),
    amount: 99.00,
    status: 'paid' as const,
    description: 'Professional Plan - Dezember 2024'
  },
  {
    id: 'inv_002',
    date: new Date('2024-11-01'),
    amount: 99.00,
    status: 'paid' as const,
    description: 'Professional Plan - November 2024'
  },
  {
    id: 'inv_003',
    date: new Date('2024-10-01'),
    amount: 99.00,
    status: 'paid' as const,
    description: 'Professional Plan - Oktober 2024'
  },
];

const Subscriptions = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices'>('overview');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: 'active' | 'canceled' | 'past_due' | 'paid' | 'open') => {
    const variants = {
      active: { label: 'Aktiv', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      paid: { label: 'Bezahlt', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
      canceled: { label: 'Gekündigt', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      past_due: { label: 'Überfällig', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      open: { label: 'Offen', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
    };
    const variant = variants[status];
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-display font-bold text-foreground mb-2">
          Abonnement & Abrechnung
        </h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihr Abonnement und sehen Sie Ihre Rechnungen ein
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
          className="gap-2"
        >
          <Package className="w-4 h-4" />
          Übersicht
        </Button>
        <Button
          variant={activeTab === 'invoices' ? 'default' : 'outline'}
          onClick={() => setActiveTab('invoices')}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          Rechnungen
        </Button>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid gap-6">
          {/* Current Subscription Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass border-border/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
              <CardHeader className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-display flex items-center gap-3">
                      <Package className="w-6 h-6 text-primary" />
                      {mockSubscription.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Ihr aktuelles Abonnement
                    </CardDescription>
                  </div>
                  {getStatusBadge(mockSubscription.status)}
                </div>
              </CardHeader>
              <CardContent className="relative space-y-6">
                {/* Price Display */}
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold text-foreground">
                    {formatCurrency(mockSubscription.price)}
                  </span>
                  <span className="text-muted-foreground">/ Monat</span>
                </div>

                {/* Billing Period */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Aktueller Zeitraum:</span>
                    <span className="text-foreground font-medium">
                      {formatDate(mockSubscription.currentPeriodStart)} - {formatDate(mockSubscription.currentPeriodEnd)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Nächste Abrechnung:</span>
                    <span className="text-foreground font-medium">
                      {formatDate(mockSubscription.currentPeriodEnd)}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Features */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Enthaltene Leistungen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {mockSubscription.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" className="gap-2" disabled>
                    <CreditCard className="w-4 h-4" />
                    Zahlungsmethode ändern
                  </Button>
                  <Button variant="ghost" className="gap-2 text-muted-foreground" disabled>
                    Abo kündigen
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  * Stripe-Integration wird in Kürze aktiviert. Kontaktieren Sie uns für Änderungen.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Method Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-xl font-display flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Zahlungsmethode
                </CardTitle>
                <CardDescription>
                  Ihre hinterlegte Zahlungsmethode
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
                  <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-400 rounded flex items-center justify-center text-white text-xs font-bold">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Gültig bis 12/26</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">Standard</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      ) : (
        /* Invoices Tab */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-xl font-display flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Rechnungshistorie
              </CardTitle>
              <CardDescription>
                Alle Ihre bisherigen Rechnungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockInvoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-border/50 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Euro className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{invoice.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(invoice.date)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatCurrency(invoice.amount)}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <Button variant="ghost" size="icon" disabled title="Download (bald verfügbar)">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {mockInvoices.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Noch keine Rechnungen vorhanden</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Contact Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">Fragen zu Ihrem Abonnement?</p>
                <p className="text-sm text-muted-foreground">
                  Unser Team hilft Ihnen gerne weiter.
                </p>
              </div>
              <Button variant="outline" className="gap-2" asChild>
                <a href="/kontakt">
                  <ExternalLink className="w-4 h-4" />
                  Kontakt aufnehmen
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Subscriptions;
