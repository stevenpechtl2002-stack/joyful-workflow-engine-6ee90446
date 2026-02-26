import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Euro, User, Users, CreditCard, Banknote, Loader2, Calendar, CheckCircle2, Star, Phone, Mail, ChevronDown, ChevronRight, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/zenbook/Logo';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SalonDetail {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  category?: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  description: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  color: string;
}

const SalonDetailPage: React.FC = () => {
  const { salonId } = useParams<{ salonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Booking form state
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'on_site' | 'online'>('on_site');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!salonId) return;
    const fetchSalon = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('storefront-salon-detail', {
          body: { salon_id: salonId },
        });
        if (error) throw error;
        setSalon(data.salon);
        setProducts(data.products || []);
        setStaff(data.staff || []);
      } catch (e) {
        console.error('Error loading salon:', e);
      }
      setLoading(false);
    };
    fetchSalon();
  }, [salonId]);

  useEffect(() => {
    if (!salonId || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      setSelectedSlot('');
      try {
        const product = products.find(p => p.id === selectedProduct);
        const { data, error } = await supabase.functions.invoke('storefront-salon-detail', {
          body: {
            salon_id: salonId,
            date: selectedDate,
            staff_member_id: selectedStaff || undefined,
            duration: product?.duration_minutes || 30,
          },
        });
        if (error) throw error;
        setSlots(data.available_slots || []);
      } catch (e) {
        console.error('Error loading slots:', e);
        setSlots([]);
      }
      setLoadingSlots(false);
    };
    fetchSlots();
  }, [salonId, selectedDate, selectedStaff, selectedProduct, products]);

  const handleBook = async () => {
    if (!customerName.trim()) { toast.error('Bitte gib deinen Namen ein'); return; }
    if (!selectedSlot) { toast.error('Bitte wähle einen Zeitslot'); return; }

    setBooking(true);
    try {
      const product = products.find(p => p.id === selectedProduct);
      const endMinutes = product?.duration_minutes || 30;
      const [h, m] = selectedSlot.split(':').map(Number);
      const endDate = new Date(2000, 0, 1, h, m + endMinutes);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      const { data, error } = await supabase.functions.invoke('storefront-book', {
        body: {
          salon_user_id: salonId,
          staff_member_id: selectedStaff || null,
          product_id: selectedProduct || null,
          booking_date: selectedDate,
          booking_time: selectedSlot,
          end_time: endTime,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          customer_email: customerEmail.trim() || null,
          payment_method: paymentMethod,
          customer_user_id: user?.id || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setBookingSuccess(true);
      toast.success('🎉 Buchung erfolgreich!');
    } catch (e: any) {
      toast.error(e.message || 'Buchung fehlgeschlagen');
    }
    setBooking(false);
  };

  // Group products by category
  const categories = [...new Set(products.map(p => p.category))];

  const selectedProductObj = products.find(p => p.id === selectedProduct);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground font-bold">Salon nicht gefunden</p>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-foreground">Buchung bestätigt!</h2>
          <p className="text-muted-foreground font-medium">
            Dein Termin bei <span className="text-foreground font-bold">{salon.name}</span> am{' '}
            <span className="text-foreground font-bold">{format(new Date(selectedDate), 'dd. MMMM yyyy', { locale: de })}</span> um{' '}
            <span className="text-foreground font-bold">{selectedSlot} Uhr</span> wurde bestätigt.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/storefront')} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm">
              Zurück zum Marktplatz
            </button>
            {user && (
              <button onClick={() => navigate('/storefront/profile')} className="px-6 py-3 bg-muted text-foreground rounded-xl font-black text-sm">
                Mein Profil
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header — Treatwell style */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link to="/storefront" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Link>
          <Link to="/"><Logo showText /></Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/storefront/profile" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <User className="w-4 h-4" /> Profil
              </Link>
            ) : (
              <Link to="/login" className="text-sm font-bold text-primary hover:underline">Anmelden</Link>
            )}
          </div>
        </div>
      </header>

      {/* Salon Hero — like Treatwell */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-accent/5 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Store className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{salon.name}</h1>
                  {salon.category && (
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{salon.category}</span>
                  )}
                </div>
              </div>
              {(salon.address || salon.city) && (
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  {[salon.address, salon.postal_code, salon.city].filter(Boolean).join(', ')}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-sm font-bold text-foreground ml-1">5.0</span>
                </div>
                <span className="text-xs text-muted-foreground">{products.length} Services</span>
                <span className="text-xs text-muted-foreground">{staff.length} Mitarbeiter</span>
              </div>
            </div>
            {/* Quick action buttons — desktop */}
            <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
              <a href="#buchen" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm text-center hover:bg-primary/90 transition-colors">
                Termin buchen
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main content — Treatwell 2-column layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 mb-6 gap-0">
            <TabsTrigger value="services" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3">
              Services
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3">
              Team
            </TabsTrigger>
            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-6 py-3">
              Infos
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column — Tab content */}
            <div className="lg:col-span-2">
              <TabsContent value="services" className="mt-0">
                <h2 className="text-lg font-black text-foreground mb-1">Passende Behandlungen</h2>
                <p className="text-sm text-muted-foreground mb-6">Wähle einen Service aus, um zu buchen.</p>

                {products.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">Noch keine Services verfügbar.</p>
                ) : (
                  <div className="space-y-4">
                    {categories.map(cat => {
                      const catProducts = products.filter(p => p.category === cat);
                      const isOpen = expandedCategory === cat || categories.length === 1;
                      return (
                        <div key={cat} className="border border-border rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedCategory(isOpen && categories.length > 1 ? null : cat)}
                            className="w-full flex items-center justify-between px-5 py-4 bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-black text-foreground">{cat}</span>
                              <span className="text-xs text-muted-foreground font-medium">{catProducts.length} {catProducts.length === 1 ? 'Service' : 'Services'}</span>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="divide-y divide-border">
                              {catProducts.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => setSelectedProduct(p.id === selectedProduct ? '' : p.id)}
                                  className={`w-full text-left px-5 py-4 flex items-center justify-between hover:bg-primary/5 transition-all ${
                                    selectedProduct === p.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                                  }`}
                                >
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-foreground text-sm">{p.name}</h4>
                                    {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      <span>{p.duration_minutes} Min.</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                    <span className="text-lg font-black text-primary">{p.price} €</span>
                                    {selectedProduct === p.id ? (
                                      <CheckCircle2 className="w-5 h-5 text-primary" />
                                    ) : (
                                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <h2 className="text-lg font-black text-foreground mb-4">Unser Team</h2>
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Teammitglieder hinterlegt.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {staff.map(s => (
                      <div key={s.id} className="border border-border rounded-xl p-4 text-center hover:border-primary/30 transition-colors">
                        <div
                          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-black text-primary-foreground"
                          style={{ backgroundColor: s.color }}
                        >
                          {s.name.charAt(0)}
                        </div>
                        <p className="font-bold text-foreground text-sm">{s.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="info" className="mt-0">
                <h2 className="text-lg font-black text-foreground mb-4">Salon-Informationen</h2>
                <div className="space-y-4">
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="font-bold text-foreground text-sm mb-3">Standort</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      {[salon.address, salon.postal_code, salon.city].filter(Boolean).join(', ') || 'Keine Adresse hinterlegt'}
                    </p>
                  </div>
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="font-bold text-foreground text-sm mb-3">Angebot</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map(c => (
                        <span key={c} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            {/* Right column — Sticky Booking Sidebar */}
            <div className="lg:col-span-1" id="buchen">
              <div className="lg:sticky lg:top-24 space-y-5">
                <div className="border border-border rounded-2xl p-5 bg-card shadow-sm">
                  <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Termin buchen
                  </h3>

                  {/* Selected service summary */}
                  {selectedProductObj && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                      <p className="text-xs text-muted-foreground font-medium">Gewählt:</p>
                      <p className="font-bold text-foreground text-sm">{selectedProductObj.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProductObj.duration_minutes} Min. · {selectedProductObj.price} €</p>
                    </div>
                  )}

                  {/* Date */}
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datum</label>
                    <input
                      type="date"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm transition-all"
                      value={selectedDate}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      onChange={e => setSelectedDate(e.target.value)}
                    />
                  </div>

                  {/* Staff */}
                  {staff.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mitarbeiter</label>
                      <select
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm transition-all appearance-none"
                        value={selectedStaff}
                        onChange={e => setSelectedStaff(e.target.value)}
                      >
                        <option value="">Egal / Nächster frei</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Slots */}
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Uhrzeit</label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                        <Loader2 className="w-4 h-4 animate-spin" /> Lade Zeiten...
                      </div>
                    ) : slots && slots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {slots.map(slot => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-2.5 rounded-lg text-xs font-bold transition-all ${
                              selectedSlot === slot
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-muted text-foreground hover:bg-primary/10 border border-border'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    ) : slots !== null ? (
                      <p className="text-xs text-muted-foreground py-3">Keine freien Zeiten an diesem Tag.</p>
                    ) : null}
                  </div>

                  {/* Payment */}
                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Zahlung</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('on_site')}
                        className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                          paymentMethod === 'on_site' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'
                        }`}
                      >
                        <Banknote className="w-4 h-4" /> Vor Ort
                      </button>
                      <button
                        onClick={() => setPaymentMethod('online')}
                        className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${
                          paymentMethod === 'online' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" /> Online
                      </button>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="space-y-3 mb-5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {user ? 'Deine Daten' : 'Deine Daten (Gast)'}
                    </label>
                    {!user && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs">
                        <span className="text-muted-foreground">Bereits Kunde?</span>
                        <Link to="/login" className="font-bold text-primary hover:underline">Anmelden</Link>
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Dein Name *"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm transition-all"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                    />
                    <input
                      type="tel"
                      placeholder="Telefon (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm transition-all"
                      value={customerPhone}
                      onChange={e => setCustomerPhone(e.target.value)}
                    />
                    <input
                      type="email"
                      placeholder="E-Mail (optional)"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm transition-all"
                      value={customerEmail}
                      onChange={e => setCustomerEmail(e.target.value)}
                    />
                  </div>

                  {/* Book button */}
                  <button
                    onClick={handleBook}
                    disabled={booking || !selectedSlot || !customerName.trim()}
                    className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {booking ? 'Wird gebucht...' : 'Jetzt buchen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Mobile sticky booking bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border p-4 z-50">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            {selectedProductObj ? (
              <div>
                <p className="font-bold text-foreground text-sm truncate">{selectedProductObj.name}</p>
                <p className="text-xs text-muted-foreground">{selectedProductObj.price} € · {selectedProductObj.duration_minutes} Min.</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-medium">Service wählen ↑</p>
            )}
          </div>
          <a href="#buchen" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm flex-shrink-0">
            Buchen
          </a>
        </div>
      </div>
    </div>
  );
};

export default SalonDetailPage;