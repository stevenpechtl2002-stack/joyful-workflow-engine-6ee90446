import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { X } from 'lucide-react';
import { StaffMember } from '@/hooks/useStaffMembers';
import { Product } from '@/hooks/useProducts';

interface ReservationFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  date: string;
  time: string;
  end_time: string;
  staff_member_id: string;
  product_id: string;
  notes: string;
  status: string;
}

interface Props {
  onSubmit: (data: ReservationFormData) => void;
  onClose: () => void;
  onDelete?: () => void;
  staffMembers: StaffMember[];
  products: Product[];
  initialData?: Partial<ReservationFormData>;
  isEdit?: boolean;
}

const ReservationForm: React.FC<Props> = ({
  onSubmit, onClose, onDelete, staffMembers, products, initialData, isEdit
}) => {
  const [form, setForm] = useState<ReservationFormData>({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    end_time: '10:00',
    staff_member_id: '',
    product_id: '',
    notes: '',
    status: 'confirmed',
    ...initialData,
  });

  // Auto-fill end_time based on product duration
  useEffect(() => {
    if (form.product_id && form.time) {
      const product = products.find(p => p.id === form.product_id);
      if (product) {
        const [h, m] = form.time.split(':').map(Number);
        const totalMin = h * 60 + m + product.duration_minutes;
        const endH = Math.floor(totalMin / 60);
        const endM = totalMin % 60;
        setForm(prev => ({
          ...prev,
          end_time: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
        }));
      }
    }
  }, [form.product_id, form.time, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const activeProducts = products.filter(p => p.is_active);
  const grouped = activeProducts.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4 animate-in fade-in">
      <form onSubmit={handleSubmit} className="bg-card rounded-[2rem] w-full max-w-lg p-8 shadow-2xl border border-border max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-black text-foreground tracking-tight">
            {isEdit ? 'Termin bearbeiten' : 'Neuer Termin'}
          </h4>
          <button type="button" onClick={onClose} className="p-2 text-muted-foreground hover:text-destructive">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Customer Name */}
          <div className="space-y-1.5">
            <label className="zen-label ml-1">Kundenname *</label>
            <input required className="zen-input" value={form.customer_name}
              onChange={e => setForm({ ...form, customer_name: e.target.value })} />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="zen-label ml-1">Telefon</label>
              <input className="zen-input" value={form.customer_phone}
                onChange={e => setForm({ ...form, customer_phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="zen-label ml-1">E-Mail</label>
              <input type="email" className="zen-input" value={form.customer_email}
                onChange={e => setForm({ ...form, customer_email: e.target.value })} />
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="zen-label ml-1">Datum *</label>
              <input required type="date" className="zen-input" value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="zen-label ml-1">Von *</label>
              <input required type="time" className="zen-input" value={form.time}
                onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <label className="zen-label ml-1">Bis</label>
              <input type="time" className="zen-input" value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })} />
            </div>
          </div>

          {/* Staff */}
          <div className="space-y-1.5">
            <label className="zen-label ml-1">Mitarbeiter</label>
            <select className="zen-input" value={form.staff_member_id}
              onChange={e => setForm({ ...form, staff_member_id: e.target.value })}>
              <option value="">Nicht zugewiesen</option>
              {staffMembers.filter(s => s.is_active).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Product */}
          <div className="space-y-1.5">
            <label className="zen-label ml-1">Service</label>
            <select className="zen-input" value={form.product_id}
              onChange={e => setForm({ ...form, product_id: e.target.value })}>
              <option value="">Kein Service</option>
              {Object.entries(grouped).map(([cat, prods]) => (
                <optgroup key={cat} label={cat}>
                  {prods.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — €{p.price} ({p.duration_minutes} Min.)
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="zen-label ml-1">Notizen</label>
            <textarea className="zen-input min-h-[60px] resize-none" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div className="space-y-1.5">
              <label className="zen-label ml-1">Status</label>
              <select className="zen-input" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="pending">Ausstehend</option>
                <option value="confirmed">Bestätigt</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Storniert</option>
                <option value="no_show">Nicht erschienen</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {isEdit && onDelete && (
              <button type="button" onClick={onDelete}
                className="px-4 py-3 rounded-xl border border-destructive/30 text-destructive font-bold text-xs hover:bg-destructive/10 transition-all">
                Löschen
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 zen-button-secondary">Abbrechen</button>
            <button type="submit" className="flex-[2] zen-button-primary">
              {isEdit ? 'Speichern' : 'Termin erstellen'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReservationForm;
