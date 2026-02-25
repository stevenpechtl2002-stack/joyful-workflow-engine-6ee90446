import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Package, Euro, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ConnectProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

const ConnectProducts: React.FC = () => {
  const [products, setProducts] = useState<ConnectProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '' });

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('connect_products' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setProducts(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.price) {
      toast.error('Name und Preis sind Pflichtfelder');
      return;
    }
    setSaving(true);
    try {
      const priceCents = Math.round(parseFloat(form.price) * 100);
      const { data, error } = await supabase.functions.invoke('create-connect-product', {
        body: { name: form.name, description: form.description || null, price_cents: priceCents, currency: 'eur' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success('Produkt erstellt!');
      setForm({ name: '', description: '', price: '' });
      setShowForm(false);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message || 'Fehler beim Erstellen');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-foreground">Stripe Produkte</h2>
          <p className="text-sm text-muted-foreground">Erstelle Produkte, die Kunden im Storefront kaufen können.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm shadow-lg hover:shadow-xl transition-all"
        >
          {showForm ? 'Abbrechen' : <><Plus className="w-4 h-4" /> Produkt erstellen</>}
        </button>
      </div>

      {showForm && (
        <div className="zen-card space-y-4 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="zen-label">Produktname</label>
              <input className="zen-input" placeholder="z.B. Deluxe Haarschnitt" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="zen-label">Preis (EUR)</label>
              <div className="relative">
                <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input className="zen-input pl-10" type="number" step="0.01" placeholder="35.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="zen-label">Beschreibung (optional)</label>
            <textarea className="zen-input h-20 resize-none" placeholder="Was beinhaltet dieses Produkt?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <button onClick={handleCreate} disabled={saving} className="zen-button-primary flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Wird erstellt...' : 'Produkt erstellen'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-bold">Noch keine Produkte</p>
          <p className="text-sm">Erstelle dein erstes Produkt für den Storefront.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="zen-card hover:shadow-xl transition-all">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-black text-foreground">{p.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}`}>
                  {p.is_active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </div>
              {p.description && <p className="text-sm text-muted-foreground mb-3">{p.description}</p>}
              <p className="text-2xl font-black text-primary">{(p.price_cents / 100).toFixed(2)} €</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ConnectProducts;
