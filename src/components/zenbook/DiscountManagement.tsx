import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/hooks/useProducts';
import { Percent, Plus, Trash2, Pencil, Tag, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Discount {
  id: string;
  user_id: string;
  name: string;
  discount_type: string;
  discount_value: number;
  applies_to: string;
  product_id: string | null;
  category: string | null;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  name: '',
  discount_type: 'percentage',
  discount_value: 0,
  applies_to: 'all',
  product_id: '',
  category: '',
  valid_from: format(new Date(), 'yyyy-MM-dd'),
  valid_until: '',
  is_active: true,
};

const DiscountManagement: React.FC = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const categories = [...new Set(products.map(p => p.category))];

  const fetchDiscounts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('discounts' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setDiscounts(data as any[]);
    setLoading(false);
  };

  useEffect(() => { fetchDiscounts(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name || !form.valid_until || form.discount_value <= 0) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    setSaving(true);
    const payload: any = {
      user_id: user.id,
      name: form.name,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      applies_to: form.applies_to,
      product_id: form.applies_to === 'product' && form.product_id ? form.product_id : null,
      category: form.applies_to === 'category' && form.category ? form.category : null,
      valid_from: form.valid_from,
      valid_until: form.valid_until,
      is_active: form.is_active,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from('discounts' as any).update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('discounts' as any).insert(payload));
    }
    setSaving(false);
    if (error) { toast.error('Fehler beim Speichern'); return; }
    toast.success(editId ? 'Rabatt aktualisiert' : 'Rabatt erstellt');
    setForm(emptyForm);
    setEditId(null);
    fetchDiscounts();
  };

  const handleEdit = (d: Discount) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      applies_to: d.applies_to,
      product_id: d.product_id || '',
      category: d.category || '',
      valid_from: d.valid_from,
      valid_until: d.valid_until,
      is_active: d.is_active,
    });
  };

  const handleDelete = async (id: string) => {
    await supabase.from('discounts' as any).delete().eq('id', id);
    toast.success('Rabatt gelöscht');
    fetchDiscounts();
  };

  const toggleActive = async (d: Discount) => {
    await supabase.from('discounts' as any).update({ is_active: !d.is_active } as any).eq('id', d.id);
    fetchDiscounts();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
          <Percent className="w-6 h-6 text-primary" /> Rabatte verwalten
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Erstelle Rabatte die auf der Storefront angezeigt werden.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="zen-card space-y-4">
        <h3 className="font-bold text-foreground">{editId ? 'Rabatt bearbeiten' : 'Neuen Rabatt erstellen'}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Name *</label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="z.B. Frühlings-Rabatt" />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Rabatt-Typ</label>
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
              <option value="percentage">Prozent (%)</option>
              <option value="fixed">Festbetrag (€)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Wert *</label>
            <Input type="number" min={0} value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))} placeholder={form.discount_type === 'percentage' ? '20' : '10'} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Gilt für</label>
            <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.applies_to} onChange={e => setForm(f => ({ ...f, applies_to: e.target.value }))}>
              <option value="all">Alle Services</option>
              <option value="product">Bestimmter Service</option>
              <option value="category">Kategorie</option>
            </select>
          </div>

          {form.applies_to === 'product' && (
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Service</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.product_id} onChange={e => setForm(f => ({ ...f, product_id: e.target.value }))}>
                <option value="">Wählen...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} – {p.price}€</option>)}
              </select>
            </div>
          )}

          {form.applies_to === 'category' && (
            <div>
              <label className="text-xs font-bold text-muted-foreground mb-1 block">Kategorie</label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                <option value="">Wählen...</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Gültig von *</label>
            <Input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-1 block">Gültig bis *</label>
            <Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
          <span className="text-sm font-bold text-foreground">Aktiv</span>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {editId ? 'Speichern' : 'Erstellen'}
          </Button>
          {editId && (
            <Button type="button" variant="outline" onClick={() => { setEditId(null); setForm(emptyForm); }}>Abbrechen</Button>
          )}
        </div>
      </form>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : discounts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="font-bold">Keine Rabatte vorhanden</p>
        </div>
      ) : (
        <div className="space-y-3">
          {discounts.map(d => (
            <div key={d.id} className={`zen-card flex items-center justify-between gap-4 ${!d.is_active ? 'opacity-50' : ''}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-black text-foreground">{d.name}</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {d.discount_type === 'percentage' ? `${d.discount_value}%` : `${d.discount_value}€`}
                  </span>
                  {d.applies_to !== 'all' && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold">
                      {d.applies_to === 'product' ? 'Service' : d.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {d.valid_from} – {d.valid_until}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={d.is_active} onCheckedChange={() => toggleActive(d)} />
                <Button size="icon" variant="ghost" onClick={() => handleEdit(d)}><Pencil className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(d.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscountManagement;
