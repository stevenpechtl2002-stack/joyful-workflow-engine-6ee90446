import React, { useState } from 'react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Camera, 
  Briefcase, 
  Users, 
  Check, 
  Plus, 
  X,
  Sparkles,
  MapPin,
  Info,
  Trash2,
  Euro,
  Clock,
  Loader2
} from 'lucide-react';
import { Service } from '@/types';
import Logo from './Logo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Props {
  onComplete: () => void;
  onCancel: () => void;
}

interface StaffInput {
  id: string;
  name: string;
  color: string;
}

const STAFF_COLORS = [
  '#f87171', // red
  '#fb923c', // orange
  '#fbbf24', // amber
  '#a3e635', // lime
  '#34d399', // emerald
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#f472b6', // pink
];

const SalonRegistration: React.FC<Props> = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Haare',
    location: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800'
  });

  const [services, setServices] = useState<Partial<Service>[]>([
    { id: '1', name: 'Haarschnitt Standard', duration: 45, price: 35, category: 'Haare' }
  ]);
  const [staffMembers, setStaffMembers] = useState<StaffInput[]>([
    { id: 'staff1', name: '', color: STAFF_COLORS[0] }
  ]);

  // Temp states for adding new items
  const [newService, setNewService] = useState({ name: '', duration: 30, price: 0 });
  const [showAddService, setShowAddService] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', color: STAFF_COLORS[1] });

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const addService = () => {
    if (!newService.name) return;
    setServices([...services, { ...newService, id: Math.random().toString(36).substr(2, 9), category: formData.category }]);
    setNewService({ name: '', duration: 30, price: 0 });
    setShowAddService(false);
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  const addStaffMember = () => {
    if (!newStaff.name) return;
    setStaffMembers([...staffMembers, { ...newStaff, id: Math.random().toString(36).substr(2, 9) }]);
    setNewStaff({ name: '', color: STAFF_COLORS[(staffMembers.length + 1) % STAFF_COLORS.length] });
    setShowAddStaff(false);
  };

  const removeStaffMember = (id: string) => {
    if (staffMembers.length <= 1) return;
    setStaffMembers(staffMembers.filter(s => s.id !== id));
  };

  const updateStaffMember = (id: string, field: 'name' | 'color', value: string) => {
    setStaffMembers(staffMembers.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleComplete = async () => {
    if (!user) {
      toast.error('Du musst angemeldet sein');
      return;
    }

    setSaving(true);
    try {
      // Save products (services) to database
      const validServices = services.filter(s => s.name);
      if (validServices.length > 0) {
        const { error: productsError } = await supabase
          .from('products')
          .insert(
            validServices.map((s, idx) => ({
              user_id: user.id,
              name: s.name,
              category: s.category || formData.category,
              duration_minutes: s.duration || 30,
              price: s.price || 0,
              is_active: true,
              sort_order: idx
            }))
          );
        if (productsError) throw productsError;
      }

      // Save staff members to database
      const validStaff = staffMembers.filter(s => s.name);
      if (validStaff.length > 0) {
        const { error: staffError } = await supabase
          .from('staff_members')
          .insert(
            validStaff.map((s, idx) => ({
              user_id: user.id,
              name: s.name,
              color: s.color,
              is_active: true,
              sort_order: idx
            }))
          );
        if (staffError) throw staffError;
      }

      toast.success('Salon erfolgreich erstellt!');
      onComplete();
    } catch (error) {
      console.error('Error saving salon data:', error);
      toast.error('Fehler beim Speichern. Bitte versuche es erneut.');
    } finally {
      setSaving(false);
    }
  };

  const steps = [
    { id: 1, label: 'Basis-Infos', icon: <Info className="w-5 h-5" /> },
    { id: 2, label: 'Galerie', icon: <Camera className="w-5 h-5" /> },
    { id: 3, label: 'Services', icon: <Briefcase className="w-5 h-5" /> },
    { id: 4, label: 'Team', icon: <Users className="w-5 h-5" /> },
    { id: 5, label: 'Abschluss', icon: <Check className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-6">
      {/* Header & Stepper */}
      <div className="max-w-4xl w-full mb-12">
        <div className="flex items-center justify-between mb-12">
          <Logo onClick={onCancel} showText />
          <button onClick={onCancel} className="p-3 text-muted-foreground hover:text-destructive transition-all"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-muted -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}></div>
          {steps.map(s => (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 ${step >= s.id ? 'bg-primary border-primary/30 text-primary-foreground shadow-xl' : 'bg-card border-border text-muted-foreground'}`}>
                {step > s.id ? <Check className="w-5 h-5" /> : s.icon}
              </div>
              <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest ${step >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl w-full bg-card rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] border border-border p-8 md:p-16 animate-in fade-in slide-in-from-bottom-8 duration-500 overflow-hidden">
        
        {step === 1 && (
          <div className="space-y-10">
            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Erzähl uns von deinem Salon</h3>
              <p className="text-muted-foreground font-medium">Diese Infos sehen deine Kunden auf dem Marktplatz.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Salon Name</label>
                <input 
                  type="text" 
                  className="w-full px-6 md:px-8 py-4 md:py-5 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all"
                  placeholder="z.B. Hair & Soul Studio"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Kategorie</label>
                <select 
                  className="w-full px-6 md:px-8 py-4 md:py-5 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all appearance-none"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option>Haare</option>
                  <option>Nägel</option>
                  <option>Kosmetik</option>
                  <option>Wellness</option>
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Standort</label>
                <div className="relative">
                  <MapPin className="absolute left-5 md:left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input 
                    type="text" 
                    className="w-full pl-14 md:pl-16 pr-6 md:pr-8 py-4 md:py-5 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all"
                    placeholder="Straße, Hausnummer, Stadt"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Beschreibung</label>
                <textarea 
                  className="w-full px-6 md:px-8 py-5 md:py-6 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all h-32 resize-none"
                  placeholder="Was macht deinen Salon besonders?"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10">
            <div className="space-y-2 text-center">
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Präsentiere deinen Style</h3>
              <p className="text-muted-foreground font-medium">Bilder sind das wichtigste Verkaufsargument.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative group rounded-2xl overflow-hidden aspect-video shadow-2xl border-4 border-card">
                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button className="p-5 bg-card rounded-full shadow-2xl"><Camera className="w-8 h-8 text-primary" /></button>
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 md:p-10 bg-primary/10 rounded-2xl border border-primary/20">
                <Sparkles className="w-10 h-10 text-primary mb-4" />
                <h4 className="text-xl font-black text-foreground mb-2">Tipp vom Experten</h4>
                <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                  Helle, freundliche Bilder deines Interieurs erhöhen die Buchungsrate um bis zu 40%. Achte auf gute Belichtung!
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black text-muted-foreground uppercase tracking-widest">Oder Bild-URL einfügen (Demo)</label>
              <input 
                type="text" 
                className="w-full px-6 md:px-8 py-4 md:py-5 rounded-xl bg-muted border-2 border-transparent focus:border-primary outline-none font-bold text-foreground transition-all"
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar">
            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Deine Dienstleistungen</h3>
              <p className="text-muted-foreground font-medium">Welche Services bietest du an? (Preise & Dauer)</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-foreground flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-primary" /> Services ({services.length})
                </h4>
                <button 
                  onClick={() => setShowAddService(!showAddService)}
                  className={`p-2 rounded-xl transition-all ${showAddService ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'}`}
                >
                  {showAddService ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {showAddService && (
                <div className="p-6 md:p-8 bg-primary/5 rounded-xl border border-primary/10 space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      type="text" placeholder="Service Name (z.B. Balayage)" 
                      className="px-5 md:px-6 py-4 rounded-xl md:rounded-2xl bg-card border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                      value={newService.name} onChange={e => setNewService({...newService, name: e.target.value})}
                    />
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="number" placeholder="Min" 
                          className="w-full pl-12 pr-4 py-4 rounded-xl md:rounded-2xl bg-card border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                          value={newService.duration} onChange={e => setNewService({...newService, duration: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      <div className="relative flex-1">
                        <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="number" placeholder="Preis" 
                          className="w-full pl-12 pr-4 py-4 rounded-xl md:rounded-2xl bg-card border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                          value={newService.price} onChange={e => setNewService({...newService, price: parseInt(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                  </div>
                  <button onClick={addService} className="w-full py-4 bg-primary text-primary-foreground rounded-xl md:rounded-2xl font-black text-sm shadow-xl">Dienstleistung hinzufügen</button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(s => (
                  <div key={s.id} className="p-5 md:p-6 bg-muted rounded-xl flex justify-between items-center group hover:bg-card hover:shadow-xl border border-transparent hover:border-primary/10 transition-all">
                    <div>
                      <p className="font-black text-foreground">{s.name}</p>
                      <p className="text-xs font-bold text-muted-foreground">{s.duration} min • {s.price} €</p>
                    </div>
                    <button onClick={() => removeService(s.id!)} className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-4 no-scrollbar">
            <div className="space-y-2">
              <h3 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">Dein Team</h3>
              <p className="text-muted-foreground font-medium">Füge deine Mitarbeiter hinzu, die Termine annehmen können.</p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-black text-foreground flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" /> Mitarbeiter ({staffMembers.filter(s => s.name).length})
                </h4>
                <button 
                  onClick={() => setShowAddStaff(!showAddStaff)}
                  className={`p-2 rounded-xl transition-all ${showAddStaff ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'}`}
                >
                  {showAddStaff ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>

              {showAddStaff && (
                <div className="p-6 md:p-8 bg-primary/5 rounded-xl border border-primary/10 space-y-6 animate-in slide-in-from-top-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="text" placeholder="Name des Mitarbeiters" 
                      className="flex-1 px-5 md:px-6 py-4 rounded-xl md:rounded-2xl bg-card border-2 border-transparent focus:border-primary outline-none font-bold text-sm"
                      value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                    />
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-muted-foreground">Farbe:</span>
                      <div className="flex gap-1">
                        {STAFF_COLORS.slice(0, 6).map(color => (
                          <button
                            key={color}
                            onClick={() => setNewStaff({...newStaff, color})}
                            className={`w-8 h-8 rounded-full border-2 transition-all ${newStaff.color === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <button onClick={addStaffMember} className="w-full py-4 bg-primary text-primary-foreground rounded-xl md:rounded-2xl font-black text-sm shadow-xl">Mitarbeiter hinzufügen</button>
                </div>
              )}

              <div className="space-y-4">
                {staffMembers.map((staff, idx) => (
                  <div key={staff.id} className="p-5 md:p-6 bg-muted rounded-xl flex flex-col md:flex-row gap-4 md:items-center group hover:bg-card hover:shadow-xl border border-transparent hover:border-primary/10 transition-all">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0"
                      style={{ backgroundColor: staff.color }}
                    >
                      {staff.name ? staff.name.charAt(0).toUpperCase() : (idx + 1)}
                    </div>
                    <input 
                      type="text"
                      placeholder={`Mitarbeiter ${idx + 1}`}
                      value={staff.name}
                      onChange={e => updateStaffMember(staff.id, 'name', e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-card border-2 border-transparent focus:border-primary outline-none font-bold text-foreground"
                    />
                    <div className="flex gap-1">
                      {STAFF_COLORS.slice(0, 6).map(color => (
                        <button
                          key={color}
                          onClick={() => updateStaffMember(staff.id, 'color', color)}
                          className={`w-6 h-6 rounded-full border-2 transition-all ${staff.color === color ? 'border-foreground scale-110' : 'border-transparent opacity-50 hover:opacity-100'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    {staffMembers.length > 1 && (
                      <button onClick={() => removeStaffMember(staff.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="text-center space-y-10 py-10">
            <div className="w-28 h-28 md:w-32 md:h-32 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto shadow-2xl animate-bounce">
              <Check className="w-14 h-14 md:w-16 md:h-16 stroke-[3.5px]" />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">Fast geschafft!</h3>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-lg mx-auto">
                Dein Salon "{formData.name || 'Mein Salon'}" ist bereit für den Launch. Wir haben {services.length} Services und {staffMembers.filter(s => s.name).length} Mitarbeiter gespeichert.
              </p>
            </div>
            <div className="bg-muted p-6 md:p-8 rounded-2xl text-left border border-border">
               <div className="flex items-center gap-4 mb-4">
                 <Users className="w-6 h-6 text-primary" />
                 <span className="font-black text-foreground">Nächster Schritt</span>
               </div>
               <p className="text-sm text-muted-foreground font-bold">
                 Nach dem Abschluss landest du direkt in deinem Dashboard. Dort kannst du deinen Kalender öffnen und Termine verwalten.
               </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-border flex items-center justify-between">
          {step > 1 ? (
            <button 
              onClick={prevStep}
              disabled={saving}
              className="px-6 md:px-10 py-4 md:py-5 rounded-xl border-2 border-border text-muted-foreground font-black flex items-center gap-3 hover:bg-muted transition-all disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" /> Zurück
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button 
              onClick={nextStep}
              className="px-8 md:px-12 py-5 md:py-6 rounded-xl bg-foreground text-background font-black flex items-center gap-4 hover:bg-primary transition-all shadow-2xl active:scale-95 disabled:opacity-50"
              disabled={step === 1 && !formData.name}
            >
              Weiter <ArrowRight className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          ) : (
            <button 
              onClick={handleComplete}
              disabled={saving}
              className="px-8 md:px-12 py-5 md:py-6 rounded-xl bg-primary text-primary-foreground font-black flex items-center gap-4 hover:bg-primary/90 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> Speichern...
                </>
              ) : (
                <>
                  Salon eröffnen <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalonRegistration;
