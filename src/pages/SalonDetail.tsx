import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, Euro, User, Users, CreditCard, Banknote, Loader2, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/zenbook/Logo';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface SalonDetail {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  postal_code: string | null;
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

  // Load available slots when date/staff/product changes
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
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/storefront" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Link>
          <Link to="/"><Logo showText /></Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Salon Info */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">{salon.name}</h1>
          {(salon.address || salon.city) && (
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {[salon.address, salon.postal_code, salon.city].filter(Boolean).join(', ')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Services */}
          <div>
            <h2 className="text-xl font-black text-foreground mb-4">Services</h2>
            {products.length === 0 ? (
              <p className="text-muted-foreground text-sm">Noch keine Services verfügbar.</p>
            ) : (
              <div className="space-y-3">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p.id === selectedProduct ? '' : p.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedProduct === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/30'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-foreground">{p.name}</h3>
                        {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <span className="text-lg font-black text-primary">{p.price} €</span>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" /> {p.duration_minutes} Min
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Booking Form */}
          <div className="space-y-6">
            <h2 className="text-xl font-black text-foreground">Termin buchen</h2>

            {/* Date */}
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Datum
              </label>
              <input
                type="date"
                className="w-full px-5 py-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all"
                value={selectedDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setSelectedDate(e.target.value)}
              />
            </div>

            {/* Staff */}
            {staff.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Mitarbeiter
                </label>
                <select
                  className="w-full px-5 py-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all appearance-none"
                  value={selectedStaff}
                  onChange={e => setSelectedStaff(e.target.value)}
                >
                  <option value="">Egal / Nächster verfügbar</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            )}

            {/* Available Slots */}
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Verfügbare Zeiten
              </label>
              {loadingSlots ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 className="w-4 h-4 animate-spin" /> Lade Zeiten...
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {slots.map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-xl text-sm font-bold transition-all ${
                        selectedSlot === slot
                          ? 'bg-primary text-primary-foreground shadow-lg'
                          : 'bg-muted text-foreground hover:bg-primary/10'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : slots !== null ? (
                <p className="text-sm text-muted-foreground py-4">Keine freien Zeiten an diesem Tag.</p>
              ) : null}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Zahlung</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPaymentMethod('on_site')}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    paymentMethod === 'on_site' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm">Vor Ort</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('online')}
                  className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-primary" />
                  <span className="font-bold text-sm">Online</span>
                </button>
              </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-4">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Deine Daten
              </label>
              <input
                type="text"
                placeholder="Dein Name *"
                className="w-full px-5 py-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="tel"
                  placeholder="Telefon"
                  className="w-full px-5 py-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                />
                <input
                  type="email"
                  placeholder="E-Mail"
                  className="w-full px-5 py-4 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Book Button */}
            <button
              onClick={handleBook}
              disabled={booking || !selectedSlot || !customerName.trim()}
              className="w-full py-5 bg-foreground text-background rounded-xl font-black text-base flex items-center justify-center gap-2 hover:bg-primary transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
            >
              {booking ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {booking ? 'Wird gebucht...' : 'Jetzt buchen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonDetailPage;
