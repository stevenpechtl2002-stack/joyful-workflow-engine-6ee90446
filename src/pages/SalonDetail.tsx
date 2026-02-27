import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, User, Users, CreditCard, Banknote, Loader2, Calendar, CheckCircle2, Star, Store, ChevronDown, ChevronRight, Camera, MessageSquare, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/zenbook/Logo';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SalonInfo {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  category?: string | null;
  description?: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  price_type: string;
  duration_minutes: number;
  description: string | null;
}

interface StaffMember {
  id: string;
  name: string;
  color: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface SalonImage {
  id: string;
  image_url: string;
  caption: string | null;
}

const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

const StarRating: React.FC<{ rating: number; size?: string; interactive?: boolean; onChange?: (r: number) => void }> = ({ rating, size = 'w-4 h-4', interactive = false, onChange }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`${size} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        onClick={interactive ? () => onChange?.(i) : undefined}
      />
    ))}
  </div>
);

const SalonDetailPage: React.FC = () => {
  const { salonId } = useParams<{ salonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [salon, setSalon] = useState<SalonInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [images, setImages] = useState<SalonImage[]>([]);
  const [openingHours, setOpeningHours] = useState<Record<number, { open: string; close: string } | null>>({});
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'on_site' | 'online'>('on_site');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Review form
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

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
        setReviews(data.reviews || []);
        setImages(data.images || []);
        setOpeningHours(data.opening_hours || {});
        setAvgRating(data.avg_rating || 0);
        setReviewCount(data.review_count || 0);
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
          body: { salon_id: salonId, date: selectedDate, staff_member_id: selectedStaff || undefined, duration: product?.duration_minutes || 30 },
        });
        if (error) throw error;
        setSlots(data.available_slots || []);
      } catch (e) {
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

      const bookingBody = {
        salon_user_id: salonId,
        staff_member_id: selectedStaff || null,
        product_id: selectedProduct || null,
        booking_date: selectedDate,
        booking_time: selectedSlot,
        end_time: endTime,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        customer_email: customerEmail.trim() || null,
        customer_user_id: user?.id || null,
      };

      if (paymentMethod === 'online') {
        // Online payment → redirect to Stripe Checkout
        if (!selectedProduct) {
          toast.error('Bitte wähle einen Service für die Online-Zahlung');
          setBooking(false);
          return;
        }
        const response = await supabase.functions.invoke('create-storefront-checkout', {
          body: bookingBody,
        });
        if (response.error) {
          // Extract actual error from the response context
          let errorMsg = 'Online-Zahlung fehlgeschlagen';
          try {
            const ctx = response.error as any;
            if (ctx.context) {
              const body = await ctx.context.json();
              errorMsg = body?.error || errorMsg;
            }
          } catch {}
          if (response.data?.error) errorMsg = response.data.error;
          throw new Error(errorMsg);
        }
        if (response.data?.error) throw new Error(response.data.error);
        if (response.data?.url) {
          window.location.href = response.data.url;
          return;
        }
      } else {
        // On-site payment → book directly
        const { data, error } = await supabase.functions.invoke('storefront-book', {
          body: { ...bookingBody, payment_method: paymentMethod },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setBookingSuccess(true);
        toast.success('🎉 Buchung erfolgreich!');
      }
    } catch (e: any) {
      toast.error(e.message || 'Buchung fehlgeschlagen');
    }
    setBooking(false);
  };

  const handleSubmitReview = async () => {
    if (!user) { toast.error('Bitte melde dich an, um eine Bewertung abzugeben'); return; }
    setSubmittingReview(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      const { error } = await supabase.from('salon_reviews' as any).insert({
        salon_user_id: salonId,
        reviewer_name: (profile as any)?.full_name || user.email?.split('@')[0] || 'Anonym',
        reviewer_user_id: user.id,
        rating: newRating,
        comment: newComment.trim() || null,
      } as any);
      if (error) throw error;
      toast.success('Bewertung abgegeben!');
      setNewComment('');
      setNewRating(5);
      // Refresh
      const { data } = await supabase.functions.invoke('storefront-salon-detail', { body: { salon_id: salonId } });
      if (data) {
        setReviews(data.reviews || []);
        setAvgRating(data.avg_rating || 0);
        setReviewCount(data.review_count || 0);
      }
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Absenden');
    }
    setSubmittingReview(false);
  };

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
            <button onClick={() => navigate('/storefront')} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm">Zurück zum Marktplatz</button>
            {user && <button onClick={() => navigate('/storefront/profile')} className="px-6 py-3 bg-muted text-foreground rounded-xl font-black text-sm">Mein Profil</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      {/* Header */}
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

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <div className={`grid gap-2 rounded-2xl overflow-hidden ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'} max-h-80`}>
            {images.slice(0, 5).map((img, i) => (
              <div key={img.id} className={`relative overflow-hidden ${i === 0 && images.length >= 3 ? 'row-span-2' : ''}`}>
                <img src={img.image_url} alt={img.caption || salon.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                {img.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-xs font-medium">{img.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {images.length > 5 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">+{images.length - 5} weitere Bilder</p>
          )}
        </div>
      )}

      {/* No images placeholder */}
      {images.length === 0 && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
          <div className="h-48 bg-gradient-to-br from-primary/10 via-accent/5 to-muted rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Noch keine Bilder</p>
            </div>
          </div>
        </div>
      )}

      {/* Salon Hero Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{salon.name}</h1>
            {salon.category && (
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{salon.category}</span>
            )}
            {(salon.address || salon.city) && (
              <p className="text-sm text-muted-foreground font-medium flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4 text-primary" />
                {[salon.address, salon.postal_code, salon.city].filter(Boolean).join(', ')}
              </p>
            )}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(avgRating)} />
                <span className="text-sm font-bold text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : '–'}</span>
                <span className="text-xs text-muted-foreground">({reviewCount} {reviewCount === 1 ? 'Bewertung' : 'Bewertungen'})</span>
              </div>
            </div>
            {salon.description && (
              <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">{salon.description}</p>
            )}
          </div>
          <div className="hidden md:flex flex-col gap-2 min-w-[200px]">
            <a href="#buchen" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm text-center hover:bg-primary/90 transition-colors">
              Termin buchen
            </a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0 mb-6 gap-0 overflow-x-auto">
            <TabsTrigger value="services" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-4 sm:px-6 py-3 text-sm">
              Services
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-4 sm:px-6 py-3 text-sm">
              Bewertungen ({reviewCount})
            </TabsTrigger>
            <TabsTrigger value="team" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-4 sm:px-6 py-3 text-sm">
              Team
            </TabsTrigger>
            <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-bold px-4 sm:px-6 py-3 text-sm">
              Infos & Zeiten
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column — Tab content */}
            <div className="lg:col-span-2">
              {/* SERVICES TAB */}
              <TabsContent value="services" className="mt-0">
                <h2 className="text-lg font-black text-foreground mb-1">Alle Behandlungen</h2>
                <p className="text-sm text-muted-foreground mb-6">Wähle einen Service aus, um zu buchen.</p>
                {products.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-8 text-center">Noch keine Services verfügbar.</p>
                ) : (
                  <div className="space-y-4">
                    {categories.map(cat => {
                      const catProducts = products.filter(p => p.category === cat);
                      const isOpen = expandedCategory === cat || categories.length <= 2;
                      return (
                        <div key={cat} className="border border-border rounded-xl overflow-hidden">
                          <button
                            onClick={() => setExpandedCategory(isOpen && categories.length > 2 ? null : cat)}
                            className="w-full flex items-center justify-between px-5 py-4 bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-black text-foreground">{cat}</span>
                              <span className="text-xs text-muted-foreground">{catProducts.length} Services</span>
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
                                    {p.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                      <Clock className="w-3 h-3" />
                                      <span>{p.duration_minutes} Min.</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                                    <div className="text-right">
                                      <span className="text-lg font-black text-primary">{p.price_type === 'from' ? 'ab ' : ''}{p.price} €</span>
                                    </div>
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

              {/* REVIEWS TAB */}
              <TabsContent value="reviews" className="mt-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-black text-foreground">Bewertungen</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-black text-foreground">{avgRating > 0 ? avgRating.toFixed(1) : '–'}</span>
                      <div>
                        <StarRating rating={Math.round(avgRating)} size="w-5 h-5" />
                        <span className="text-xs text-muted-foreground">{reviewCount} Bewertungen</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Write Review */}
                {user && (
                  <div className="border border-border rounded-xl p-5 mb-6">
                    <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Bewertung schreiben
                    </h3>
                    <div className="space-y-3">
                      <StarRating rating={newRating} size="w-6 h-6" interactive onChange={setNewRating} />
                      <textarea
                        placeholder="Erzähle von deiner Erfahrung..."
                        className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none text-sm text-foreground resize-none min-h-[80px]"
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                      />
                      <button
                        onClick={handleSubmitReview}
                        disabled={submittingReview}
                        className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
                      >
                        {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Absenden
                      </button>
                    </div>
                  </div>
                )}

                {!user && (
                  <div className="border border-border rounded-xl p-5 mb-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Melde dich an, um eine Bewertung abzugeben.</p>
                    <Link to="/login" className="text-sm font-bold text-primary hover:underline">Jetzt anmelden</Link>
                  </div>
                )}

                {/* Review list */}
                {reviews.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Noch keine Bewertungen. Sei der Erste!</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="border border-border rounded-xl p-5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                              {r.reviewer_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm">{r.reviewer_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(r.created_at), 'dd. MMM yyyy', { locale: de })}
                              </p>
                            </div>
                          </div>
                          <StarRating rating={r.rating} />
                        </div>
                        {r.comment && <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TEAM TAB */}
              <TabsContent value="team" className="mt-0">
                <h2 className="text-lg font-black text-foreground mb-4">Unser Team</h2>
                {staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Teammitglieder hinterlegt.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {staff.map(s => (
                      <div key={s.id} className="border border-border rounded-xl p-5 text-center hover:border-primary/30 transition-colors">
                        <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-xl font-black text-white" style={{ backgroundColor: s.color }}>
                          {s.name.charAt(0)}
                        </div>
                        <p className="font-bold text-foreground text-sm">{s.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* INFO TAB */}
              <TabsContent value="info" className="mt-0">
                <div className="space-y-6">
                  {/* Opening Hours */}
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="font-black text-foreground text-sm mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Öffnungszeiten
                    </h3>
                    {Object.keys(openingHours).length > 0 ? (
                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6, 0].map(d => {
                          const hours = openingHours[d];
                          const isToday = new Date().getDay() === d;
                          return (
                            <div key={d} className={`flex items-center justify-between py-2 px-3 rounded-lg text-sm ${isToday ? 'bg-primary/5 font-bold' : ''}`}>
                              <span className={`${isToday ? 'text-primary font-black' : 'text-foreground'}`}>
                                {isToday && '● '}{DAY_NAMES[d]}
                              </span>
                              {hours ? (
                                <span className="text-foreground font-medium">{hours.open} – {hours.close}</span>
                              ) : (
                                <span className="text-muted-foreground">Geschlossen</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Keine Öffnungszeiten hinterlegt.</p>
                    )}
                  </div>

                  {/* Location */}
                  <div className="border border-border rounded-xl p-5">
                    <h3 className="font-black text-foreground text-sm mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Standort
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {[salon.address, salon.postal_code, salon.city].filter(Boolean).join(', ') || 'Keine Adresse hinterlegt'}
                    </p>
                  </div>

                  {/* Description */}
                  {salon.description && (
                    <div className="border border-border rounded-xl p-5">
                      <h3 className="font-black text-foreground text-sm mb-3">Über uns</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{salon.description}</p>
                    </div>
                  )}

                  {/* Categories */}
                  {categories.length > 0 && (
                    <div className="border border-border rounded-xl p-5">
                      <h3 className="font-black text-foreground text-sm mb-3">Angebot</h3>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(c => (
                          <span key={c} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {selectedProductObj && (
                    <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                      <p className="text-xs text-muted-foreground font-medium">Gewählt:</p>
                      <p className="font-bold text-foreground text-sm">{selectedProductObj.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedProductObj.duration_minutes} Min. · {selectedProductObj.price} €</p>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datum</label>
                    <input type="date" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm transition-all" value={selectedDate} min={format(new Date(), 'yyyy-MM-dd')} onChange={e => setSelectedDate(e.target.value)} />
                  </div>

                  {staff.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mitarbeiter</label>
                      <select className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm transition-all appearance-none" value={selectedStaff} onChange={e => setSelectedStaff(e.target.value)}>
                        <option value="">Egal / Nächster frei</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Uhrzeit</label>
                    {loadingSlots ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-3"><Loader2 className="w-4 h-4 animate-spin" /> Lade Zeiten...</div>
                    ) : slots && slots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                        {slots.map(slot => (
                          <button key={slot} onClick={() => setSelectedSlot(slot)} className={`py-2.5 rounded-lg text-xs font-bold transition-all ${selectedSlot === slot ? 'bg-primary text-primary-foreground shadow-md' : 'bg-muted text-foreground hover:bg-primary/10 border border-border'}`}>{slot}</button>
                        ))}
                      </div>
                    ) : slots !== null ? (
                      <p className="text-xs text-muted-foreground py-3">Keine freien Zeiten.</p>
                    ) : null}
                  </div>

                  <div className="space-y-2 mb-4">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Zahlung</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setPaymentMethod('on_site')} className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${paymentMethod === 'on_site' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                        <Banknote className="w-4 h-4" /> Vor Ort
                      </button>
                      <button onClick={() => setPaymentMethod('online')} className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${paymentMethod === 'online' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                        <CreditCard className="w-4 h-4" /> Online
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-5">
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{user ? 'Deine Daten' : 'Deine Daten (Gast)'}</label>
                    {!user && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10 text-xs">
                        <span className="text-muted-foreground">Bereits Kunde?</span>
                        <Link to="/login" className="font-bold text-primary hover:underline">Anmelden</Link>
                      </div>
                    )}
                    <input type="text" placeholder="Dein Name *" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm" value={customerName} onChange={e => setCustomerName(e.target.value)} />
                    <input type="tel" placeholder="Telefon (optional)" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} />
                    <input type="email" placeholder="E-Mail (optional)" className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary outline-none font-medium text-foreground text-sm" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} />
                  </div>

                  <button onClick={handleBook} disabled={booking || !selectedSlot || !customerName.trim()} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none">
                    {booking ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {booking ? 'Wird gebucht...' : 'Jetzt buchen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Mobile sticky bar */}
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
          <a href="#buchen" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black text-sm flex-shrink-0">Buchen</a>
        </div>
      </div>
    </div>
  );
};

export default SalonDetailPage;