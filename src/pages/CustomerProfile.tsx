import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Calendar, Clock, MapPin, Store, LogOut, Loader2, User, CalendarDays, Star, Sparkles, Save, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/zenbook/Logo';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface Booking {
  id: string;
  salon_user_id: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  status: string;
  payment_method: string;
  salon_name?: string;
}

interface FavoriteSalon {
  salon_user_id: string;
  name: string;
  city: string | null;
}

interface SuggestedSalon {
  id: string;
  company_name: string;
  category: string | null;
  city: string | null;
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }) };

const CustomerProfile: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSalon[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/login', { replace: true }); return; }
    const loadData = async () => {
      const [bookingsRes, favsRes, profileRes, suggestionsRes] = await Promise.all([
        supabase.from('storefront_bookings' as any).select('*').eq('customer_user_id', user.id).order('booking_date', { ascending: false }),
        supabase.from('customer_favorites' as any).select('salon_user_id').eq('customer_user_id', user.id),
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).single(),
        supabase.from('customers').select('id, company_name, category, city').eq('published', true).limit(6),
      ]);

      if (profileRes.data) {
        setProfileName(profileRes.data.full_name || '');
        setProfilePhone(profileRes.data.phone || '');
      }

      const salonIds = new Set<string>();
      ((bookingsRes.data as any[]) || []).forEach((b: any) => salonIds.add(b.salon_user_id));
      ((favsRes.data as any[]) || []).forEach((f: any) => salonIds.add(f.salon_user_id));

      let salonNames: Record<string, { name: string; city: string | null }> = {};
      if (salonIds.size > 0) {
        const { data: salons } = await supabase.from('customers').select('id, company_name, city, email').in('id', [...salonIds]);
        if (salons) for (const s of salons as any[]) salonNames[s.id] = { name: s.company_name || s.email || 'Salon', city: s.city };
      }

      setBookings(((bookingsRes.data as any[]) || []).map((b: any) => ({ ...b, salon_name: salonNames[b.salon_user_id]?.name || 'Salon' })));
      setFavorites(((favsRes.data as any[]) || []).map((f: any) => ({ salon_user_id: f.salon_user_id, name: salonNames[f.salon_user_id]?.name || 'Salon', city: salonNames[f.salon_user_id]?.city || null })));
      setSuggestions((suggestionsRes.data as any[]) || []);
      setLoading(false);
    };
    loadData();
  }, [user, authLoading, navigate]);

  const removeFavorite = async (salonId: string) => {
    if (!user) return;
    await supabase.from('customer_favorites' as any).delete().eq('customer_user_id', user.id).eq('salon_user_id', salonId);
    setFavorites(prev => prev.filter(f => f.salon_user_id !== salonId));
  };

  const saveProfile = useCallback(async (name: string, phone: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: name, phone: phone }).eq('id', user.id);
    setSaving(false);
    if (error) toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    else toast({ title: 'Profil gespeichert' });
  }, [user, toast]);

  // Auto-save with debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveProfile(profileName, profilePhone);
    }, 1500);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [profileName, profilePhone, saveProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  const upcomingBookings = bookings.filter(b => b.booking_date >= format(new Date(), 'yyyy-MM-dd'));
  const pastBookings = bookings.filter(b => b.booking_date < format(new Date(), 'yyyy-MM-dd'));
  const nextBooking = upcomingBookings[0];
  const memberSince = user?.created_at ? format(new Date(user.created_at), 'MMM yyyy', { locale: de }) : '–';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo showText /></Link>
          <div className="flex items-center gap-4">
            <Link to="/storefront" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Marktplatz</Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {/* Title */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Mein Dashboard</h1>
          <p className="text-muted-foreground font-medium mt-1">{user?.email}</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div initial="hidden" animate="visible" custom={1} variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <CalendarDays className="w-5 h-5" />, label: 'Termine gesamt', value: bookings.length },
            { icon: <Calendar className="w-5 h-5" />, label: 'Anstehend', value: upcomingBookings.length },
            { icon: <Heart className="w-5 h-5" />, label: 'Favoriten', value: favorites.length },
            { icon: <Star className="w-5 h-5" />, label: 'Mitglied seit', value: memberSince },
          ].map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 space-y-2">
              <div className="text-primary">{stat.icon}</div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Next Appointment Hero */}
        {nextBooking && (
          <motion.div initial="hidden" animate="visible" custom={2} variants={fadeUp} className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary shrink-0">
              <span className="text-lg font-black">{format(new Date(nextBooking.booking_date), 'dd', { locale: de })}</span>
              <span className="text-[10px] font-bold uppercase">{format(new Date(nextBooking.booking_date), 'MMM', { locale: de })}</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Dein nächster Termin</p>
              <p className="text-lg font-black text-foreground">{nextBooking.salon_name}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="w-3.5 h-3.5" />{nextBooking.booking_time} Uhr</p>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Editable Profile */}
          <motion.div initial="hidden" animate="visible" custom={3} variants={fadeUp} className="space-y-4">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2"><User className="w-5 h-5 text-primary" />Profil bearbeiten</h2>
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Name</label><Input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Dein Name" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">E-Mail</label><Input value={user?.email || ''} disabled className="opacity-60" /></div>
              <div><label className="text-xs font-bold text-muted-foreground uppercase">Telefon</label><Input value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+49..." /></div>
              <Button onClick={() => saveProfile(profileName, profilePhone)} disabled={saving} className="w-full"><Save className="w-4 h-4 mr-2" />{saving ? 'Speichert...' : 'Profil speichern'}</Button>
            </div>
          </motion.div>

          {/* Favorites */}
          <motion.div initial="hidden" animate="visible" custom={4} variants={fadeUp} className="space-y-4">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2"><Heart className="w-5 h-5 text-destructive" />Favoriten ({favorites.length})</h2>
            {favorites.length === 0 ? (
              <p className="text-muted-foreground text-sm">Noch keine Favoriten. <Link to="/storefront" className="text-primary font-bold">Marktplatz entdecken</Link></p>
            ) : (
              <div className="space-y-3">
                {favorites.map(fav => (
                  <div key={fav.salon_user_id} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/storefront/${fav.salon_user_id}`)}>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Store className="w-5 h-5 text-primary" /></div>
                      <div>
                        <p className="font-bold text-foreground">{fav.name}</p>
                        {fav.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{fav.city}</p>}
                      </div>
                    </div>
                    <button onClick={() => removeFavorite(fav.salon_user_id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"><Heart className="w-4 h-4 fill-destructive" /></button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Salon Suggestions */}
        {suggestions.length > 0 && (
          <motion.div initial="hidden" animate="visible" custom={5} variants={fadeUp} className="space-y-4">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Entdecke Salons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map(s => (
                <div key={s.id} onClick={() => navigate(`/storefront/${s.id}`)} className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground">{s.company_name || 'Salon'}</p>
                      <p className="text-xs text-muted-foreground">{s.category || 'Salon'}{s.city ? ` · ${s.city}` : ''}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming Bookings */}
        <motion.div initial="hidden" animate="visible" custom={6} variants={fadeUp} className="space-y-4">
          <h2 className="text-xl font-black text-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Anstehende Termine ({upcomingBookings.length})</h2>
          {upcomingBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">Keine anstehenden Termine.</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(b => (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                    <span className="text-xs font-black">{format(new Date(b.booking_date), 'dd', { locale: de })}</span>
                    <span className="text-[9px] font-bold uppercase">{format(new Date(b.booking_date), 'MMM', { locale: de })}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground">{b.salon_name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Clock className="w-3 h-3" />{b.booking_time} Uhr
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {b.status === 'confirmed' ? 'Bestätigt' : b.status}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Past Bookings */}
        {pastBookings.length > 0 && (
          <motion.div initial="hidden" animate="visible" custom={7} variants={fadeUp} className="space-y-4">
            <h2 className="text-xl font-black text-foreground flex items-center gap-2"><Clock className="w-5 h-5 text-muted-foreground" />Vergangene Termine ({pastBookings.length})</h2>
            <div className="space-y-3 opacity-60">
              {pastBookings.map(b => (
                <div key={b.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
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
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
