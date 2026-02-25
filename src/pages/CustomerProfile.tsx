import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Calendar, Clock, MapPin, Store, ArrowLeft, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/zenbook/Logo';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Booking {
  id: string;
  salon_user_id: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  status: string;
  payment_method: string;
  salon_name?: string;
  product_name?: string;
}

interface FavoriteSalon {
  salon_user_id: string;
  name: string;
  city: string | null;
}

const CustomerProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSalon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/portal/auth');
      return;
    }
    const loadData = async () => {
      // Load bookings
      const { data: bookingsData } = await supabase
        .from('storefront_bookings' as any)
        .select('*')
        .eq('customer_user_id', user.id)
        .order('booking_date', { ascending: false });

      // Load favorites
      const { data: favsData } = await supabase
        .from('customer_favorites' as any)
        .select('salon_user_id')
        .eq('customer_user_id', user.id);

      // Enrich with salon names
      const salonIds = new Set<string>();
      ((bookingsData as any[]) || []).forEach((b: any) => salonIds.add(b.salon_user_id));
      ((favsData as any[]) || []).forEach((f: any) => salonIds.add(f.salon_user_id));

      let salonNames: Record<string, { name: string; city: string | null }> = {};
      if (salonIds.size > 0) {
        const { data: salons } = await supabase
          .from('customers')
          .select('id, company_name, city, email')
          .in('id', [...salonIds]);
        if (salons) {
          for (const s of salons as any[]) {
            salonNames[s.id] = { name: s.company_name || s.email || 'Salon', city: s.city };
          }
        }
      }

      setBookings(((bookingsData as any[]) || []).map((b: any) => ({
        ...b,
        salon_name: salonNames[b.salon_user_id]?.name || 'Salon',
      })));

      setFavorites(((favsData as any[]) || []).map((f: any) => ({
        salon_user_id: f.salon_user_id,
        name: salonNames[f.salon_user_id]?.name || 'Salon',
        city: salonNames[f.salon_user_id]?.city || null,
      })));

      setLoading(false);
    };
    loadData();
  }, [user, navigate]);

  const removeFavorite = async (salonId: string) => {
    if (!user) return;
    await supabase.from('customer_favorites' as any).delete().eq('customer_user_id', user.id).eq('salon_user_id', salonId);
    setFavorites(prev => prev.filter(f => f.salon_user_id !== salonId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingBookings = bookings.filter(b => b.booking_date >= format(new Date(), 'yyyy-MM-dd'));
  const pastBookings = bookings.filter(b => b.booking_date < format(new Date(), 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/storefront" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors font-bold text-sm">
            <ArrowLeft className="w-4 h-4" /> Marktplatz
          </Link>
          <Link to="/"><Logo showText /></Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <User className="w-8 h-8 text-primary" /> Mein Profil
          </h1>
          <p className="text-muted-foreground font-medium mt-1">{user?.email}</p>
        </div>

        {/* Favorites */}
        <div>
          <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive" /> Favoriten ({favorites.length})
          </h2>
          {favorites.length === 0 ? (
            <p className="text-muted-foreground text-sm">Du hast noch keine Favoriten. Besuche den <Link to="/storefront" className="text-primary font-bold">Marktplatz</Link> um Salons zu entdecken.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favorites.map(fav => (
                <div key={fav.salon_user_id} className="zen-card flex items-center justify-between">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/storefront/${fav.salon_user_id}`)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Store className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{fav.name}</p>
                      {fav.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{fav.city}</p>}
                    </div>
                  </div>
                  <button onClick={() => removeFavorite(fav.salon_user_id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                    <Heart className="w-4 h-4 fill-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div>
          <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Anstehende Termine ({upcomingBookings.length})
          </h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine anstehenden Termine.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(b => (
                <div key={b.id} className="zen-card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                      <span className="text-xs font-black">{format(new Date(b.booking_date), 'dd', { locale: de })}</span>
                      <span className="text-[9px] font-bold uppercase">{format(new Date(b.booking_date), 'MMM', { locale: de })}</span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{b.salon_name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" /> {b.booking_time} Uhr
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                          {b.status === 'confirmed' ? 'Bestätigt' : b.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-muted-foreground" /> Vergangene Termine ({pastBookings.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {pastBookings.map(b => (
                <div key={b.id} className="zen-card flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-muted flex flex-col items-center justify-center text-muted-foreground">
                    <span className="text-xs font-black">{format(new Date(b.booking_date), 'dd', { locale: de })}</span>
                    <span className="text-[9px] font-bold uppercase">{format(new Date(b.booking_date), 'MMM', { locale: de })}</span>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{b.salon_name}</p>
                    <p className="text-xs text-muted-foreground">{b.booking_time} Uhr</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
