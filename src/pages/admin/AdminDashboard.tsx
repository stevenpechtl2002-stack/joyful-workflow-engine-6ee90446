import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, Phone, Calendar, DollarSign, Activity, 
  Search, LogOut, Shield, Ban, CheckCircle,
  TrendingUp, Clock, Key, Copy, Eye, EyeOff, Link2,
  CreditCard, Bot, Globe, Building2, ChevronDown, ChevronUp,
  Mail, MapPin, Tag, BarChart3, UserX, Euro, ExternalLink,
  UserPlus, Store, Power
} from 'lucide-react';
import { format, subWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, startOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface Customer {
  id: string;
  email: string;
  company_name: string | null;
  plan: string;
  status: string;
  created_at: string;
  notes: string | null;
  sales_rep_id: string | null;
  category: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  website_url: string | null;
  slug: string | null;
  published: boolean;
}

interface CustomerWithApiKey extends Customer {
  api_key?: string;
}

interface CustomerEnriched extends CustomerWithApiKey {
  totalRevenue: number;
  reservationCount: number;
  contactCount: number;
  profileName: string | null;
}

interface CallLog {
  id: string;
  user_id: string;
  caller_phone: string | null;
  call_status: string;
  call_duration: number | null;
  call_outcome: string | null;
  started_at: string;
}

interface ReservationFull {
  id: string;
  user_id: string;
  customer_name: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  status: string;
  price_paid: number | null;
  source: string;
}

interface VoiceAgentConfig {
  id: string;
  user_id: string;
  business_name: string | null;
  industry: string | null;
  language: string | null;
  voice: string | null;
  phone_number: string | null;
  website_url: string | null;
  greeting_text: string | null;
  opening_hours: any;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface StripeSubscription {
  id: string;
  customer: string;
  customer_email?: string;
  status: string;
  current_period_end: number;
  trial_end: number | null;
  metadata: {
    min_contract_months?: string;
    min_contract_end?: string;
    tier_name?: string;
    setup_paid?: string;
  };
  items: {
    data: Array<{
      price: {
        id: string;
        unit_amount: number;
        product: string;
      };
    }>;
  };
}

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 65%, 60%)',
  'hsl(200, 80%, 50%)',
  'hsl(350, 80%, 55%)',
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, roles, signOut, isLoading } = useAuth();
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<CustomerWithApiKey[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [reservations, setReservations] = useState<ReservationFull[]>([]);
  const [storefrontBookings, setStorefrontBookings] = useState<any[]>([]);
  const [voiceAgentConfigs, setVoiceAgentConfigs] = useState<VoiceAgentConfig[]>([]);
  const [stripeSubscriptions, setStripeSubscriptions] = useState<StripeSubscription[]>([]);
  const [transactions, setTransactions] = useState<{ user_id: string; amount: number; created_at?: string }[]>([]);
  const [contactCounts, setContactCounts] = useState<Record<string, number>>({});
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dataLoading, setDataLoading] = useState(true);
  const [subscriptionsLoading, setSubscriptionsLoading] = useState(true);
  const [visibleApiKeys, setVisibleApiKeys] = useState<Set<string>>(new Set());
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerEnriched | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editNotes, setEditNotes] = useState('');
  const [editPlan, setEditPlan] = useState('');
  const [confirmBlockDialog, setConfirmBlockDialog] = useState<CustomerEnriched | null>(null);

  const toggleApiKeyVisibility = (customerId: string) => {
    setVisibleApiKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerId)) newSet.delete(customerId);
      else newSet.add(customerId);
      return newSet;
    });
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Kopiert', description: label ? `${label} in die Zwischenablage kopiert` : 'In die Zwischenablage kopiert' });
  };

  const webhookBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/n8n-reservations`;

  useEffect(() => {
    if (!isLoading && (!user || !roles.includes('admin'))) {
      navigate('/portal/auth');
    }
  }, [user, roles, isLoading, navigate]);

  useEffect(() => {
    if (user && roles.includes('admin')) {
      fetchAllData();
      fetchStripeSubscriptions();
    }
  }, [user, roles]);

  const fetchAllData = async () => {
    setDataLoading(true);
    try {
      const [customersRes, apiKeysRes, callLogsRes, reservationsRes, voiceAgentRes, transactionsRes, contactsRes, profilesRes, storefrontRes] = await Promise.all([
        supabase.from('customers').select('*').order('created_at', { ascending: false }),
        supabase.from('customer_api_keys').select('customer_id, api_key'),
        supabase.from('call_logs').select('*').order('started_at', { ascending: false }).limit(100),
        supabase.from('reservations').select('id, user_id, customer_name, reservation_date, reservation_time, party_size, status, price_paid, source').order('reservation_date', { ascending: false }).limit(500),
        supabase.from('voice_agent_config').select('*').order('updated_at', { ascending: false }),
        supabase.from('transactions').select('user_id, amount, created_at'),
        supabase.from('contacts').select('user_id'),
        supabase.from('profiles').select('id, full_name'),
        supabase.from('storefront_bookings').select('*').order('created_at', { ascending: false }).limit(500),
      ]);

      if (customersRes.data) {
        const apiKeyMap = new Map((apiKeysRes.data || []).map(k => [k.customer_id, k.api_key]));
        setCustomers(customersRes.data.map(c => ({ ...c, api_key: apiKeyMap.get(c.id) })));
      }
      if (callLogsRes.data) setCallLogs(callLogsRes.data);
      if (reservationsRes.data) setReservations(reservationsRes.data as ReservationFull[]);
      if (storefrontRes.data) setStorefrontBookings(storefrontRes.data);
      if (voiceAgentRes.data) setVoiceAgentConfigs(voiceAgentRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data as any);
      if (contactsRes.data) {
        const counts: Record<string, number> = {};
        contactsRes.data.forEach((c: any) => { counts[c.user_id] = (counts[c.user_id] || 0) + 1; });
        setContactCounts(counts);
      }
      if (profilesRes.data) {
        const map: Record<string, string> = {};
        profilesRes.data.forEach((p: any) => { if (p.full_name) map[p.id] = p.full_name; });
        setProfiles(map);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Fehler', description: 'Daten konnten nicht geladen werden', variant: 'destructive' });
    } finally {
      setDataLoading(false);
    }
  };

  const fetchStripeSubscriptions = async () => {
    setSubscriptionsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-list-subscriptions');
      if (error) throw error;
      if (data?.subscriptions) setStripeSubscriptions(data.subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setSubscriptionsLoading(false);
    }
  };

  // Revenue aggregation
  const revenueByUser = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach(t => { map[t.user_id] = (map[t.user_id] || 0) + Number(t.amount); });
    reservations.forEach(r => {
      if (r.price_paid) map[r.user_id] = (map[r.user_id] || 0) + Number(r.price_paid) * r.party_size;
    });
    return map;
  }, [transactions, reservations]);

  const reservationCountByUser = useMemo(() => {
    const map: Record<string, number> = {};
    reservations.forEach(r => { map[r.user_id] = (map[r.user_id] || 0) + 1; });
    return map;
  }, [reservations]);

  const enrichedCustomers: CustomerEnriched[] = useMemo(() => {
    return customers.map(c => ({
      ...c,
      totalRevenue: revenueByUser[c.id] || 0,
      reservationCount: reservationCountByUser[c.id] || 0,
      contactCount: contactCounts[c.id] || 0,
      profileName: profiles[c.id] || null,
    }));
  }, [customers, revenueByUser, reservationCountByUser, contactCounts, profiles]);

  // ===== CHART DATA =====
  const registrationsPerMonth = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
    return months.map(m => {
      const monthStr = format(m, 'yyyy-MM');
      const count = customers.filter(c => c.created_at.startsWith(monthStr)).length;
      return { name: format(m, 'MMM yy', { locale: de }), registrierungen: count };
    });
  }, [customers]);

  const revenuePerMonth = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
    return months.map(m => {
      const monthStr = format(m, 'yyyy-MM');
      const txRevenue = transactions
        .filter(t => t.created_at && t.created_at.startsWith(monthStr))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const resRevenue = reservations
        .filter(r => r.reservation_date.startsWith(monthStr) && r.price_paid)
        .reduce((sum, r) => sum + Number(r.price_paid!) * r.party_size, 0);
      return { name: format(m, 'MMM yy', { locale: de }), umsatz: txRevenue + resRevenue };
    });
  }, [transactions, reservations]);

  const reservationsPerWeek = useMemo(() => {
    const now = new Date();
    const weeks = eachWeekOfInterval({ start: subWeeks(now, 7), end: now }, { weekStartsOn: 1 });
    return weeks.map(w => {
      const weekEnd = endOfWeek(w, { weekStartsOn: 1 });
      const resCount = reservations.filter(r => {
        const d = new Date(r.reservation_date);
        return d >= w && d <= weekEnd;
      }).length;
      const sfCount = storefrontBookings.filter((b: any) => {
        const d = new Date(b.booking_date);
        return d >= w && d <= weekEnd;
      }).length;
      return { name: `KW ${format(w, 'w')}`, reservierungen: resCount, storefront: sfCount };
    });
  }, [reservations, storefrontBookings]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const cat = c.category || 'Ohne Kategorie';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [customers]);

  const toggleCustomerStatus = async (customerId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const { error } = await supabase.from('customers').update({ status: newStatus }).eq('id', customerId);
    if (error) {
      toast({ title: 'Fehler', description: 'Status konnte nicht geändert werden', variant: 'destructive' });
    } else {
      setCustomers(customers.map(c => c.id === customerId ? { ...c, status: newStatus } : c));
      toast({ title: 'Erfolg', description: `Kunde wurde ${newStatus === 'active' ? 'aktiviert' : 'gesperrt'}` });
      setConfirmBlockDialog(null);
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, status: newStatus } : null);
      }
    }
  };

  const saveCustomerDetails = async () => {
    if (!selectedCustomer) return;
    const { error } = await supabase.from('customers').update({ notes: editNotes, plan: editPlan }).eq('id', selectedCustomer.id);
    if (error) {
      toast({ title: 'Fehler', description: 'Änderungen konnten nicht gespeichert werden', variant: 'destructive' });
    } else {
      setCustomers(customers.map(c => c.id === selectedCustomer.id ? { ...c, notes: editNotes, plan: editPlan } : c));
      toast({ title: 'Gespeichert', description: 'Kundendetails wurden aktualisiert' });
    }
  };

  const togglePublished = async (customerId: string, currentPublished: boolean) => {
    const newPublished = !currentPublished;
    const { error } = await supabase.from('customers').update({ published: newPublished }).eq('id', customerId);
    if (error) {
      toast({ title: 'Fehler', description: 'Store-Status konnte nicht geändert werden', variant: 'destructive' });
    } else {
      setCustomers(customers.map(c => c.id === customerId ? { ...c, published: newPublished } : c));
      if (selectedCustomer?.id === customerId) {
        setSelectedCustomer(prev => prev ? { ...prev, published: newPublished } : null);
      }
      toast({ title: 'Erfolg', description: newPublished ? 'Store ist jetzt live' : 'Store wurde deaktiviert' });
    }
  };

  const openCustomerDetail = (customer: CustomerEnriched) => {
    setSelectedCustomer(customer);
    setEditNotes(customer.notes || '');
    setEditPlan(customer.plan);
    setDetailDialogOpen(true);
  };

  const uniqueCategories = useMemo(() => [...new Set(customers.map(c => c.category).filter(Boolean))], [customers]);
  const uniquePlans = useMemo(() => [...new Set(customers.map(c => c.plan))], [customers]);

  const filteredCustomers = enrichedCustomers.filter(customer => {
    const matchesSearch = 
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (customer.profileName?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    const matchesPlan = planFilter === 'all' || customer.plan === planFilter;
    const matchesCategory = categoryFilter === 'all' || customer.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPlan && matchesCategory;
  });

  const getCustomerEmail = (userId: string) => customers.find(c => c.id === userId)?.email || userId;
  const getCustomerCompany = (userId: string) => customers.find(c => c.id === userId)?.company_name || '-';

  const formatSubscriptionStatus = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Aktiv', variant: 'default' },
      trialing: { label: 'Testphase', variant: 'secondary' },
      canceled: { label: 'Gekündigt', variant: 'destructive' },
      past_due: { label: 'Überfällig', variant: 'destructive' },
      incomplete: { label: 'Unvollständig', variant: 'outline' },
    };
    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  // KPI Stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const suspendedCustomers = customers.filter(c => c.status === 'suspended').length;
  const totalCalls = callLogs.length;
  const totalReservationsCount = reservations.length + storefrontBookings.length;
  const activeSubscriptions = stripeSubscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length;
  const configuredVoiceAgents = voiceAgentConfigs.filter(v => v.is_active).length;
  const totalRevenue = Object.values(revenueByUser).reduce((sum, v) => sum + v, 0);
  const avgRevenuePerCustomer = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  const customerReservations = useMemo(() => {
    if (!selectedCustomer) return [];
    return reservations.filter(r => r.user_id === selectedCustomer.id).slice(0, 10);
  }, [selectedCustomer, reservations]);

  // Customer detail extras
  const selectedVoiceAgent = useMemo(() => {
    if (!selectedCustomer) return null;
    return voiceAgentConfigs.find(v => v.user_id === selectedCustomer.id) || null;
  }, [selectedCustomer, voiceAgentConfigs]);

  const selectedSubscription = useMemo(() => {
    if (!selectedCustomer) return null;
    return stripeSubscriptions.find(s => s.customer_email === selectedCustomer.email) || null;
  }, [selectedCustomer, stripeSubscriptions]);

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Alle Kunden und Daten verwalten</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => signOut()} className="gap-2">
            <LogOut className="w-4 h-4" />
            Abmelden
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="glass-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Kunden</p>
                  <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
                </div>
                <Users className="w-7 h-7 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Aktive Abos</p>
                  <p className="text-2xl font-bold text-green-500">{activeSubscriptions}</p>
                </div>
                <CreditCard className="w-7 h-7 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gesamtumsatz</p>
                  <p className="text-2xl font-bold text-emerald-500">{totalRevenue.toFixed(0)}€</p>
                </div>
                <Euro className="w-7 h-7 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Ø Umsatz</p>
                  <p className="text-2xl font-bold text-foreground">{avgRevenuePerCustomer.toFixed(0)}€</p>
                </div>
                <TrendingUp className="w-7 h-7 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Gesperrt</p>
                  <p className="text-2xl font-bold text-red-500">{suspendedCustomers}</p>
                </div>
                <UserX className="w-7 h-7 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Voice Agents</p>
                  <p className="text-2xl font-bold text-purple-500">{configuredVoiceAgents}</p>
                </div>
                <Bot className="w-7 h-7 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Anrufe</p>
                  <p className="text-2xl font-bold text-foreground">{totalCalls}</p>
                </div>
                <Phone className="w-7 h-7 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-border/50">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Reservierungen</p>
                  <p className="text-2xl font-bold text-foreground">{totalReservationsCount}</p>
                </div>
                <Calendar className="w-7 h-7 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== CHARTS SECTION ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Registrierungen pro Monat */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Registrierungen pro Monat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={registrationsPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="registrierungen" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Umsatz-Trend */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Euro className="w-4 h-4 text-emerald-500" />
                Umsatz-Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenuePerMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number) => [`${value.toFixed(0)}€`, 'Umsatz']}
                    />
                    <defs>
                      <linearGradient id="colorUmsatz" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="umsatz" stroke="hsl(142, 71%, 45%)" fill="url(#colorUmsatz)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Reservierungen pro Woche */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                Reservierungen pro Woche
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reservationsPerWeek}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="reservierungen" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="storefront" stroke="hsl(200, 80%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Kundenverteilung nach Kategorie */}
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-500" />
                Kundenverteilung nach Kategorie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                      labelLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                    >
                      {categoryDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="customers" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="customers">Kunden</TabsTrigger>
            <TabsTrigger value="registrations">Registrierungen</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="voiceagents">Voice Agents</TabsTrigger>
            <TabsTrigger value="calls">Anrufe</TabsTrigger>
            <TabsTrigger value="reservations">Reservierungen</TabsTrigger>
            <TabsTrigger value="storefront">Storefront-Buchungen</TabsTrigger>
          </TabsList>

          {/* ===== CUSTOMERS TAB ===== */}
          <TabsContent value="customers">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Kundenverwaltung
                    </CardTitle>
                    <CardDescription>{filteredCustomers.length} von {totalCustomers} Kunden</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Name, E-Mail, Firma..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-56 bg-secondary/50"
                      />
                    </div>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm">
                      <option value="all">Alle Status</option>
                      <option value="active">Aktiv</option>
                      <option value="suspended">Gesperrt</option>
                    </select>
                    <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm">
                      <option value="all">Alle Pläne</option>
                      {uniquePlans.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm">
                      <option value="all">Alle Kategorien</option>
                      {uniqueCategories.map(c => <option key={c} value={c!}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => openCustomerDetail(customer)}
                      className="p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card/80 cursor-pointer transition-all hover:shadow-md group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {(customer.company_name || customer.email).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-foreground truncate">
                                {customer.company_name || customer.profileName || customer.email}
                              </p>
                              <Badge variant={customer.status === 'active' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                                {customer.status === 'active' ? 'Aktiv' : 'Gesperrt'}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{customer.plan}</Badge>
                              {customer.category && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{customer.category}</Badge>
                              )}
                              <Badge 
                                variant={customer.published ? 'default' : 'outline'} 
                                className={`text-[10px] px-1.5 py-0 ${customer.published ? 'bg-emerald-500' : ''}`}
                              >
                                {customer.published ? 'Store Live' : 'Store Offline'}
                              </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>
                              <span>Seit {format(new Date(customer.created_at), 'dd.MM.yyyy', { locale: de })}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm shrink-0">
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Umsatz</p>
                            <p className="font-bold text-emerald-500">{customer.totalRevenue.toFixed(0)}€</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Buchungen</p>
                            <p className="font-bold text-foreground">{customer.reservationCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Kontakte</p>
                            <p className="font-bold text-foreground">{customer.contactCount}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); setConfirmBlockDialog(customer); }}
                          >
                            {customer.status === 'active' ? (
                              <Ban className="w-4 h-4 text-red-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {/* API Key Row */}
                      <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2">
                        <Key className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">API-Key:</span>
                        {customer.api_key ? (
                          <>
                            <code className="text-xs font-mono text-foreground/80">
                              {visibleApiKeys.has(customer.id) ? customer.api_key : `${customer.api_key.substring(0, 8)}••••••••`}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => { e.stopPropagation(); toggleApiKeyVisibility(customer.id); }}
                            >
                              {visibleApiKeys.has(customer.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => { e.stopPropagation(); copyToClipboard(customer.api_key!, 'API-Key'); }}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Nicht vorhanden</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="text-center text-muted-foreground py-12">Keine Kunden gefunden</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== REGISTRATIONS TAB ===== */}
          <TabsContent value="registrations">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Alle Registrierungen
                </CardTitle>
                <CardDescription>Chronologische Liste aller Kunden-Registrierungen ({customers.length})</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Name / Firma</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Kategorie</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Umsatz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrichedCustomers.map((c) => (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openCustomerDetail(c)}>
                        <TableCell className="text-sm">{format(new Date(c.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</TableCell>
                        <TableCell className="font-medium">{c.company_name || c.profileName || '-'}</TableCell>
                        <TableCell className="text-sm">{c.email}</TableCell>
                        <TableCell>{c.category ? <Badge variant="secondary" className="text-[10px]">{c.category}</Badge> : '-'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{c.plan}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={c.status === 'active' ? 'default' : 'destructive'} className="text-[10px]">
                            {c.status === 'active' ? 'Aktiv' : 'Gesperrt'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-emerald-500">{c.totalRevenue.toFixed(0)}€</TableCell>
                      </TableRow>
                    ))}
                    {customers.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Keine Registrierungen vorhanden</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== SUBSCRIPTIONS TAB ===== */}
          <TabsContent value="subscriptions">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Stripe Abonnements</CardTitle>
                    <CardDescription>Alle aktiven Subscriptions und Setup-Status</CardDescription>
                  </div>
                  <Button variant="outline" onClick={fetchStripeSubscriptions} disabled={subscriptionsLoading}>Aktualisieren</Button>
                </div>
              </CardHeader>
              <CardContent>
                {subscriptionsLoading ? (
                  <div className="flex items-center justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kunde</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Setup bezahlt</TableHead>
                        <TableHead>Testphase Ende</TableHead>
                        <TableHead>Nächste Abrechnung</TableHead>
                        <TableHead>Mindestlaufzeit bis</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stripeSubscriptions.map((sub) => {
                        const status = formatSubscriptionStatus(sub.status);
                        const parseTimestamp = (ts: number | null | undefined) => {
                          if (!ts || ts <= 0) return null;
                          const date = new Date(ts * 1000);
                          return isNaN(date.getTime()) ? null : date;
                        };
                        const parseISODate = (isoString: string | null | undefined) => {
                          if (!isoString) return null;
                          const date = new Date(isoString);
                          return isNaN(date.getTime()) ? null : date;
                        };
                        const trialEnd = parseTimestamp(sub.trial_end);
                        const periodEnd = parseTimestamp(sub.current_period_end);
                        const minContractEnd = parseISODate(sub.metadata?.min_contract_end);
                        return (
                          <TableRow key={sub.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{sub.customer_email || sub.customer}</p>
                                <p className="text-xs text-muted-foreground">{sub.id}</p>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline">{sub.metadata?.tier_name || 'Voice Agent Pro'}</Badge></TableCell>
                            <TableCell><Badge variant={status.variant}>{status.label}</Badge></TableCell>
                            <TableCell>
                              {sub.metadata?.setup_paid === 'true' ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="w-3 h-3 mr-1" />Bezahlt</Badge>
                              ) : (<Badge variant="outline">Ausstehend</Badge>)}
                            </TableCell>
                            <TableCell>{trialEnd ? format(trialEnd, 'dd.MM.yyyy', { locale: de }) : '-'}</TableCell>
                            <TableCell>{periodEnd ? format(periodEnd, 'dd.MM.yyyy', { locale: de }) : '-'}</TableCell>
                            <TableCell>{minContractEnd ? format(minContractEnd, 'dd.MM.yyyy', { locale: de }) : '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                      {stripeSubscriptions.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Keine Abonnements gefunden</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== VOICE AGENTS TAB ===== */}
          <TabsContent value="voiceagents">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" />Voice Agent Konfigurationen</CardTitle>
                <CardDescription>Alle Kunden Voice Agent Einstellungen</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Unternehmen</TableHead>
                      <TableHead>Branche</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Sprache</TableHead>
                      <TableHead>Stimme</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zuletzt aktualisiert</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {voiceAgentConfigs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getCustomerEmail(config.user_id)}</p>
                            <p className="text-xs text-muted-foreground">{getCustomerCompany(config.user_id)}</p>
                          </div>
                        </TableCell>
                        <TableCell><div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{config.business_name || '-'}</div></TableCell>
                        <TableCell><Badge variant="outline">{config.industry || '-'}</Badge></TableCell>
                        <TableCell>{config.phone_number ? <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-muted-foreground" /><span className="text-sm">{config.phone_number}</span></div> : '-'}</TableCell>
                        <TableCell>{config.website_url ? <a href={config.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline text-sm"><Globe className="w-3 h-3" />Öffnen</a> : '-'}</TableCell>
                        <TableCell><Badge variant="secondary">{config.language?.toUpperCase() || 'DE'}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{config.voice || '-'}</TableCell>
                        <TableCell><Badge variant={config.is_active ? 'default' : 'secondary'} className={config.is_active ? 'bg-green-500' : ''}>{config.is_active ? 'Aktiv' : 'Inaktiv'}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(config.updated_at), 'dd.MM.yyyy HH:mm', { locale: de })}</TableCell>
                      </TableRow>
                    ))}
                    {voiceAgentConfigs.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Keine Voice Agent Konfigurationen vorhanden</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CALLS TAB ===== */}
          <TabsContent value="calls">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Anrufprotokoll</CardTitle>
                <CardDescription>Letzte 100 Anrufe aller Kunden</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Telefon</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Dauer</TableHead>
                      <TableHead>Ergebnis</TableHead>
                      <TableHead>Datum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callLogs.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>{call.caller_phone || '-'}</TableCell>
                        <TableCell><Badge variant={call.call_status === 'completed' ? 'default' : 'secondary'}>{call.call_status}</Badge></TableCell>
                        <TableCell>{call.call_duration ? `${call.call_duration}s` : '-'}</TableCell>
                        <TableCell>{call.call_outcome || '-'}</TableCell>
                        <TableCell>{format(new Date(call.started_at), 'dd.MM.yyyy HH:mm', { locale: de })}</TableCell>
                      </TableRow>
                    ))}
                    {callLogs.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Keine Anrufe vorhanden</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== RESERVATIONS TAB ===== */}
          <TabsContent value="reservations">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Reservierungen</CardTitle>
                <CardDescription>Letzte 500 Reservierungen aller Kunden</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salon</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Uhrzeit</TableHead>
                      <TableHead>Personen</TableHead>
                      <TableHead>Umsatz</TableHead>
                      <TableHead>Quelle</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell className="text-xs text-muted-foreground">{getCustomerCompany(res.user_id)}</TableCell>
                        <TableCell className="font-medium">{res.customer_name}</TableCell>
                        <TableCell>{format(new Date(res.reservation_date), 'dd.MM.yyyy', { locale: de })}</TableCell>
                        <TableCell>{res.reservation_time}</TableCell>
                        <TableCell>{res.party_size}</TableCell>
                        <TableCell>{res.price_paid ? `${(Number(res.price_paid) * res.party_size).toFixed(2)}€` : '-'}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{res.source}</Badge></TableCell>
                        <TableCell><Badge variant={res.status === 'confirmed' ? 'default' : 'secondary'}>{res.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {reservations.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Keine Reservierungen vorhanden</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== STOREFRONT BOOKINGS TAB ===== */}
          <TabsContent value="storefront">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Storefront-Buchungen
                </CardTitle>
                <CardDescription>{storefrontBookings.length} Buchungen über den Storefront</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salon</TableHead>
                      <TableHead>Kunde</TableHead>
                      <TableHead>Telefon</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead>Uhrzeit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zahlung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storefrontBookings.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs text-muted-foreground">{getCustomerCompany(b.salon_user_id)}</TableCell>
                        <TableCell className="font-medium">{b.customer_name}</TableCell>
                        <TableCell className="text-xs">{b.customer_phone || '-'}</TableCell>
                        <TableCell className="text-xs">{b.customer_email || '-'}</TableCell>
                        <TableCell>{format(new Date(b.booking_date), 'dd.MM.yyyy', { locale: de })}</TableCell>
                        <TableCell>{b.booking_time}</TableCell>
                        <TableCell><Badge variant={b.status === 'confirmed' ? 'default' : 'secondary'}>{b.status || 'pending'}</Badge></TableCell>
                        <TableCell><Badge variant={b.payment_status === 'paid' ? 'default' : 'outline'}>{b.payment_status || 'pending'}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {storefrontBookings.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Keine Storefront-Buchungen vorhanden</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ===== CUSTOMER DETAIL DIALOG ===== */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedCustomer && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-bold text-primary">
                      {(selectedCustomer.company_name || selectedCustomer.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span>{selectedCustomer.company_name || selectedCustomer.profileName || selectedCustomer.email}</span>
                    <p className="text-sm font-normal text-muted-foreground">{selectedCustomer.email}</p>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Registriert am {format(new Date(selectedCustomer.created_at), 'dd.MM.yyyy', { locale: de })}
                </DialogDescription>
              </DialogHeader>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Kategorie</p>
                    <p className="text-sm font-medium">{selectedCustomer.category || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefon</p>
                    <p className="text-sm font-medium">{selectedCustomer.phone || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="text-sm font-medium">
                      {selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.postal_code || ''} ${selectedCustomer.city || ''}` : '-'}
                    </p>
                  </div>
                  {selectedCustomer.website_url && (
                    <div>
                      <p className="text-xs text-muted-foreground">Website</p>
                      <a href={selectedCustomer.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />{selectedCustomer.website_url}
                      </a>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-muted-foreground">Gesamtumsatz</p>
                    <p className="text-2xl font-bold text-emerald-500">{selectedCustomer.totalRevenue.toFixed(2)}€</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Buchungen</p>
                      <p className="text-lg font-bold">{selectedCustomer.reservationCount}</p>
                    </div>
                    <div className="flex-1 p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground">Kontakte</p>
                      <p className="text-lg font-bold">{selectedCustomer.contactCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Info: API Key, Webhook, Voice Agent, Stripe */}
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Technische Details</p>
                
                {/* API Key */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">API-Key</p>
                      <p className="text-sm font-mono">
                        {selectedCustomer.api_key 
                          ? (visibleApiKeys.has(selectedCustomer.id) ? selectedCustomer.api_key : '••••••••-••••-••••-••••')
                          : 'Nicht vorhanden'}
                      </p>
                    </div>
                  </div>
                  {selectedCustomer.api_key && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => toggleApiKeyVisibility(selectedCustomer.id)}>
                        {visibleApiKeys.has(selectedCustomer.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedCustomer.api_key!, 'API-Key')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Webhook URL */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Webhook-URL</p>
                      <p className="text-xs font-mono truncate">{webhookBaseUrl}?api_key={selectedCustomer.api_key || 'N/A'}</p>
                    </div>
                  </div>
                  {selectedCustomer.api_key && (
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${webhookBaseUrl}?api_key=${selectedCustomer.api_key}`, 'Webhook-URL')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Voice Agent Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Voice Agent</p>
                      <p className="text-sm">
                        {selectedVoiceAgent 
                          ? `${selectedVoiceAgent.business_name || 'Konfiguriert'} — ${selectedVoiceAgent.is_active ? 'Aktiv' : 'Inaktiv'}`
                          : 'Nicht konfiguriert'}
                      </p>
                    </div>
                  </div>
                  {selectedVoiceAgent && (
                    <Badge variant={selectedVoiceAgent.is_active ? 'default' : 'secondary'} className={selectedVoiceAgent.is_active ? 'bg-green-500' : ''}>
                      {selectedVoiceAgent.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  )}
                </div>

                {/* Stripe Subscription */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Stripe Abo</p>
                      <p className="text-sm">
                        {selectedSubscription
                          ? `${selectedSubscription.metadata?.tier_name || 'Abo'} — ${formatSubscriptionStatus(selectedSubscription.status).label}`
                          : 'Kein Abo'}
                      </p>
                    </div>
                  </div>
                  {selectedSubscription && (
                    <Badge variant={formatSubscriptionStatus(selectedSubscription.status).variant}>
                      {formatSubscriptionStatus(selectedSubscription.status).label}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Description */}
              {selectedCustomer.description && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Beschreibung</p>
                  <p className="text-sm text-foreground/80">{selectedCustomer.description}</p>
                </div>
              )}

              {/* Last Reservations */}
              {customerReservations.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Letzte Reservierungen</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {customerReservations.map(r => (
                      <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded bg-secondary/30">
                        <span>{r.customer_name}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{format(new Date(r.reservation_date), 'dd.MM.', { locale: de })} {r.reservation_time}</span>
                          {r.price_paid && <span className="text-emerald-500 font-medium">{(Number(r.price_paid) * r.party_size).toFixed(2)}€</span>}
                          <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Section */}
              <div className="mt-4 space-y-3 border-t border-border/50 pt-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Plan</p>
                  <select
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value)}
                    className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-border text-sm"
                  >
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Notizen</p>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="bg-secondary/50" />
                </div>
              </div>

              <DialogFooter className="mt-4 gap-2">
                <Button
                  variant={selectedCustomer.status === 'active' ? 'destructive' : 'default'}
                  onClick={() => setConfirmBlockDialog(selectedCustomer)}
                  className="gap-2"
                >
                  {selectedCustomer.status === 'active' ? <><Ban className="w-4 h-4" />Sperren</> : <><CheckCircle className="w-4 h-4" />Aktivieren</>}
                </Button>
                <Button onClick={saveCustomerDetails}>Speichern</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CONFIRM BLOCK DIALOG ===== */}
      <Dialog open={!!confirmBlockDialog} onOpenChange={() => setConfirmBlockDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmBlockDialog?.status === 'active' ? 'Kunde sperren?' : 'Kunde aktivieren?'}
            </DialogTitle>
            <DialogDescription>
              {confirmBlockDialog?.status === 'active'
                ? `Möchten Sie "${confirmBlockDialog.company_name || confirmBlockDialog.email}" wirklich sperren? Der Kunde kann sich nicht mehr anmelden.`
                : `Möchten Sie "${confirmBlockDialog?.company_name || confirmBlockDialog?.email}" wieder aktivieren?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmBlockDialog(null)}>Abbrechen</Button>
            <Button
              variant={confirmBlockDialog?.status === 'active' ? 'destructive' : 'default'}
              onClick={() => confirmBlockDialog && toggleCustomerStatus(confirmBlockDialog.id, confirmBlockDialog.status)}
            >
              {confirmBlockDialog?.status === 'active' ? 'Sperren' : 'Aktivieren'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
