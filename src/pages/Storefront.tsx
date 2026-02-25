import React, { useState, useEffect } from 'react';
import { Search, MapPin, Store, Heart, User, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/components/zenbook/Logo';
import { useNavigate, Link } from 'react-router-dom';

interface Salon {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  category: string;
  published: boolean;
  product_count: number;
  staff_count: number;
}

const Storefront: React.FC = () => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSalons = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('list-salons');
        if (error) throw error;
        setSalons(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error loading salons:', e);
      }
      setLoading(false);
    };
    fetchSalons();
  }, []);

  // Load favorites if logged in
  useEffect(() => {
    if (!user) return;
    const loadFavorites = async () => {
      const { data } = await supabase
        .from('customer_favorites' as any)
        .select('salon_user_id')
        .eq('customer_user_id', user.id);
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
      setFavorites(prev => { const n = new Set(prev); n.delete(salonId); return n; });
    } else {
      await supabase.from('customer_favorites' as any).insert({ customer_user_id: user.id, salon_user_id: salonId } as any);
      setFavorites(prev => new Set(prev).add(salonId));
    }
  };

  // Get unique cities
  const cities = [...new Set(salons.map(s => s.city).filter(Boolean))] as string[];

  // Filter salons
  const filtered = salons.filter(s => {
    if (cityFilter && s.city !== cityFilter) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo showText /></Link>
          <div className="flex items-center gap-4">
            {user && (
              <Link to="/storefront/profile" className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-4 h-4" /> Mein Profil
              </Link>
            )}
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Store className="w-4 h-4" /> Marktplatz
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/20 via-background to-pink-500/10 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">Finde deinen <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500">Salon</span></h1>
        <p className="text-lg text-muted-foreground font-medium mb-8">Entdecke die besten Salons in deiner Nähe und buche direkt online.</p>

        {/* Search & Filter */}
        <div className="max-w-2xl mx-auto px-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Salon suchen..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-card border border-border font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="px-6 py-4 rounded-xl bg-card border border-border font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none min-w-[160px]"
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
          >
            <option value="">Alle Städte</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Store className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold">Keine Salons gefunden</p>
            <p className="text-sm mt-2">Versuche einen anderen Suchbegriff oder eine andere Stadt.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(salon => (
              <div
                key={salon.id}
                onClick={() => navigate(`/storefront/${salon.id}`)}
                className="zen-card card-3d cursor-pointer group relative"
              >
                {/* Favorite button */}
                <button
                  onClick={(e) => toggleFavorite(e, salon.id)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:border-primary transition-all"
                >
                  <Heart className={`w-4 h-4 transition-colors ${favorites.has(salon.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                </button>

                {/* Salon card content */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Store className="w-7 h-7 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-foreground text-lg truncate group-hover:text-primary transition-colors">{salon.name}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-0.5">{salon.category}</p>
                    {salon.city && (
                      <p className="text-sm text-muted-foreground font-medium flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {salon.postal_code && `${salon.postal_code} `}{salon.city}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground border-t border-border pt-4">
                  <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary">{salon.product_count} Services</span>
                  <span className="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500">{salon.staff_count} Mitarbeiter</span>
                  {!salon.published && (
                    <span className="ml-auto px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3" /> Neu
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Storefront;
