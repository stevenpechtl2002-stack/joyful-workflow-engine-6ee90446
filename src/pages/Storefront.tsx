import React, { useState, useEffect } from 'react';
import { Loader2, ShoppingBag, Store } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Logo from '@/components/zenbook/Logo';

interface StorefrontProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  salon_name: string;
  user_id: string;
}

const Storefront: React.FC = () => {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('list-connect-products');
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setProducts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error('Error loading storefront:', e);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const handleBuy = async (productId: string) => {
    setBuying(productId);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-checkout', {
        body: { product_id: productId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e: any) {
      toast.error(e.message || 'Checkout fehlgeschlagen');
    }
    setBuying(null);
  };

  // Group products by salon
  const grouped = products.reduce<Record<string, { name: string; products: StorefrontProduct[] }>>((acc, p) => {
    if (!acc[p.user_id]) acc[p.user_id] = { name: p.salon_name, products: [] };
    acc[p.user_id].products.push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo showText />
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            <Store className="w-4 h-4" /> Storefront
          </span>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-hero py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight mb-3">Storefront</h1>
        <p className="text-lg text-muted-foreground font-medium">Entdecke Produkte und Services unserer Salons.</p>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-bold">Noch keine Produkte verfügbar</p>
            <p className="text-sm mt-2">Salons können Produkte in ihrem Dashboard erstellen.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(grouped).map(([userId, group]) => (
              <div key={userId}>
                <h2 className="text-2xl font-black text-foreground mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  {group.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.products.map(p => (
                    <div key={p.id} className="zen-card card-3d">
                      <h3 className="font-black text-foreground text-lg mb-2">{p.name}</h3>
                      {p.description && <p className="text-sm text-muted-foreground mb-4">{p.description}</p>}
                      <div className="flex items-end justify-between mt-auto pt-4 border-t border-border">
                        <span className="text-3xl font-black text-primary">{(p.price_cents / 100).toFixed(2)} €</span>
                        <button
                          onClick={() => handleBuy(p.id)}
                          disabled={buying === p.id}
                          className="px-5 py-3 bg-foreground text-background rounded-xl font-black text-sm flex items-center gap-2 hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
                        >
                          {buying === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingBag className="w-4 h-4" />}
                          {buying === p.id ? 'Laden...' : 'Kaufen'}
                        </button>
                      </div>
                    </div>
                  ))}
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
