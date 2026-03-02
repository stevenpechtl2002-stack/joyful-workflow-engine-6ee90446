import React, { useState, useEffect } from 'react';
import { Search, MapPin, Store, Heart, User, Loader2, Sparkles, Star, Camera, Percent, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/zenbook/Logo';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Salon {
  id: string;
  name: string;
  slug: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  category: string;
  description: string | null;
  logo_url: string | null;
  published: boolean;
  product_count: number;
  staff_count: number;
  avg_rating: number;
  review_count: number;
  cover_image: string | null;
}

interface StorefrontDiscount {
  id: string;
  user_id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_until: string;
}

const Storefront: React.FC = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [discounts, setDiscounts] = useState<StorefrontDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const saleFilter = searchParams.get('filter') === 'sale';
  const categoryFilter = searchParams.get('category') || '';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salonsRes, discountsRes] = await Promise.all([
        supabase.functions.invoke('list-salons'),
        supabase.from('discounts' as any).select('id, user_id, name, discount_type, discount_value, valid_from, valid_until').gte('valid_until', new Date().toISOString().split('T')[0]).eq('is_active', true)]
        );
        if (!salonsRes.error) setSalons(Array.isArray(salonsRes.data) ? salonsRes.data : []);
        if (!discountsRes.error && discountsRes.data) setDiscounts(discountsRes.data as any[]);
      } catch (e) {
        console.error('Error loading data:', e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Load favorites if logged in
  useEffect(() => {
    if (!user) return;
    const loadFavorites = async () => {
      const { data } = await supabase.
      from('customer_favorites' as any).
      select('salon_user_id').
      eq('customer_user_id', user.id);
      if (data) {
        setFavorites(new Set((data as any[]).map((f: any) => f.salon_user_id)));
      }
    };
    loadFavorites();
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, salonId: string) => {
    e.stopPropagation();
    if (!user) {
      navigate('/portal/auth');
      return;
    }
    const isFav = favorites.has(salonId);
    if (isFav) {
      await supabase.from('customer_favorites' as any).delete().eq('customer_user_id', user.id).eq('salon_user_id', salonId);
      setFavorites((prev) => {const n = new Set(prev);n.delete(salonId);return n;});
    } else {
      await supabase.from('customer_favorites' as any).insert({ customer_user_id: user.id, salon_user_id: salonId } as any);
      setFavorites((prev) => new Set(prev).add(salonId));
    }
  };

  // Get unique cities
  const cities = [...new Set(salons.map((s) => s.city).filter(Boolean))] as string[];

  // Filter salons
  const salonIdsWithDiscounts = new Set(discounts.map((d) => d.user_id));
  const filtered = salons.filter((s) => {
    if (saleFilter && !salonIdsWithDiscounts.has(s.id)) return false;
    if (categoryFilter && s.category !== categoryFilter) return false;
    if (cityFilter && s.city !== cityFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between py-0">
          <Link to="/"><Logo showText /></Link>
          <div className="flex items-center gap-4">
            {user &&
            <Link to="/storefront/profile" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-4 h-4" /> Mein Profil
              </Link>
            }
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Store className="w-4 h-4" /> Marktplatz
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-pink-500/10 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">
          {saleFilter ?
          <>Aktuelle <span className="text-transparent bg-clip-text bg-gradient-to-r from-destructive to-primary">Angebote</span></> :
          categoryFilter ?
          <>Die besten <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">{categoryFilter === 'Nagelstudio' ? 'Nagelstudios' : categoryFilter === 'Barbershop' ? 'Barbershops' : `${categoryFilter}-Salons`}</span></> :

          <>Finde deinen <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">Salon</span></>
          }
        </h1>
        <p className="text-lg text-muted-foreground font-medium mb-8">
          {saleFilter ? 'Entdecke die besten Rabatte und Aktionen der Salons.' : categoryFilter ? `Alle ${categoryFilter}-Salons in deiner Nähe.` : 'Entdecke die besten Salons in deiner Nähe und buche direkt online.'}
        </p>

        {/* Category chips */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-6 px-6">
          {[
          { label: 'Alle', value: '' },
          { label: 'Friseur', value: 'Friseur' },
          { label: 'Nägel', value: 'Nagelstudio' },
          { label: 'Kosmetik', value: 'Kosmetik' },
          { label: 'Massage', value: 'Massage' },
          { label: 'Männer', value: 'Barbershop' }].
          map((c) =>
          <button
            key={c.value}
            onClick={() => {const p = new URLSearchParams(searchParams);if (c.value) p.set('category', c.value);else p.delete('category');p.delete('filter');setSearchParams(p);}}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${categoryFilter === c.value || !categoryFilter && !c.value && !saleFilter ? 'bg-primary text-primary-foreground shadow-lg' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            
              {c.label}
            </button>
          )}
          <button
            onClick={() => {const p = new URLSearchParams();p.set('filter', 'sale');setSearchParams(p);}}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${saleFilter ? 'bg-destructive text-white shadow-lg' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
            
            Sale %
          </button>
        </div>

        {/* Search & Filter */}
        <div className="max-w-2xl mx-auto px-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Salon suchen..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-card border border-border font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} />
            
          </div>
          <select
            className="px-6 py-4 rounded-xl bg-card border border-border font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none min-w-[160px]"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}>
            
            <option value="">Alle Städte</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ?
        <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div> :
        filtered.length === 0 ?
        <div className="text-center py-20 text-muted-foreground">
            <Store className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold">Keine Salons gefunden</p>
            <p className="text-sm mt-2">Versuche einen anderen Suchbegriff oder eine andere Stadt.</p>
          </div> :

        <>
            {/* Featured Discounts */}
            {discounts.length > 0 &&
          <div className="mb-10">
                <h2 className="text-xl font-black text-foreground mb-4 flex items-center gap-2">
                  <Percent className="w-5 h-5 text-primary" /> Aktuelle Angebote
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {discounts.map((d) => {
                const salon = salons.find((s) => s.id === d.user_id);
                return (
                  <div
                    key={d.id}
                    onClick={() => salon && navigate(`/storefront/${salon.slug || salon.id}`)}
                    className="zen-card cursor-pointer group border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:border-primary/40 transition-all">
                    
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-lg font-black text-primary">
                              {d.discount_type === 'percentage' ? `${d.discount_value}%` : `${d.discount_value}€`}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-black text-foreground truncate group-hover:text-primary transition-colors">{d.name}</h3>
                            {salon && <p className="text-xs text-muted-foreground font-medium">{salon.name}</p>}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-bold">
                          Gültig bis {format(new Date(d.valid_until), 'dd. MMM yyyy', { locale: de })}
                        </p>
                        <div className="flex items-center gap-1 text-xs font-bold text-primary mt-2">
                          Zum Salon <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>);

              })}
                </div>
              </div>
          }

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((salon) =>
            <div
              key={salon.id}
              onClick={() => navigate(`/storefront/${salon.slug || salon.id}`)}
              className="zen-card card-3d cursor-pointer group relative overflow-hidden">
              
                {/* Cover image */}
                {salon.cover_image ?
              <div className="h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
                    <img src={salon.cover_image} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div> :

              <div className="h-28 -mx-6 -mt-6 mb-4 bg-gradient-to-br from-primary/10 via-accent/5 to-muted flex items-center justify-center">
                    <Camera className="w-8 h-8 text-muted-foreground/20" />
                  </div>
              }

                {/* Favorite button */}
                <button
                onClick={(e) => toggleFavorite(e, salon.id)}
                className="absolute top-3 right-3 z-10 p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:border-primary transition-all">
                
                  <Heart className={`w-4 h-4 transition-colors ${favorites.has(salon.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                </button>

                {/* Salon card content */}
                <div className="min-w-0 mb-3 flex items-start gap-3">
                  {salon.logo_url &&
                <img src={salon.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-border" />
                }
                  <div className="min-w-0">
                    <h3 className="font-black text-foreground text-lg truncate group-hover:text-primary transition-colors">{salon.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-0.5">{salon.category}</p>
                    {salon.city &&
                  <p className="text-sm text-muted-foreground font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {salon.postal_code && `${salon.postal_code} `}{salon.city}
                      </p>
                  }
                  </div>
                </div>
                {salon.description &&
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{salon.description}</p>
              }

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) =>
                  <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(salon.avg_rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                  )}
                  </div>
                  <span className="text-xs font-bold text-foreground">{salon.avg_rating > 0 ? salon.avg_rating.toFixed(1) : '–'}</span>
                  <span className="text-xs text-muted-foreground">({salon.review_count})</span>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground border-t border-border pt-3">
                  <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary">{salon.product_count} Services</span>
                  <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500">{salon.staff_count} Mitarbeiter</span>
                  {!salon.published &&
                <span className="ml-auto px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3" /> Neu
                    </span>
                }
                </div>
              </div>
            )}
          </div>
          </>
        }
      </div>
    </div>);

};

export default Storefront;