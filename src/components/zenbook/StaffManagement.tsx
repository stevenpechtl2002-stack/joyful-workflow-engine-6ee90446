import React, { useState } from 'react';
import { Staff } from '@/types';
import { Mail, Phone, MoreVertical, UserPlus, Star, X } from 'lucide-react';

interface Props {
  staff: Staff[];
  onAddStaff: (staff: Staff) => void;
}

const COLORS = [
  'bg-rose-100 border-rose-200 text-rose-700',
  'bg-emerald-100 border-emerald-200 text-emerald-700',
  'bg-indigo-100 border-indigo-200 text-indigo-700',
  'bg-amber-100 border-amber-200 text-amber-700',
  'bg-sky-100 border-sky-200 text-sky-700',
  'bg-purple-100 border-purple-200 text-purple-700',
];

const StaffManagement: React.FC<Props> = ({ staff, onAddStaff }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.role) return;

    const newStaff: Staff = {
      id: 's' + Math.random().toString(36).substr(2, 9),
      name: formData.name,
      role: formData.role,
      avatar: `https://picsum.photos/seed/${formData.name.replace(/\s/g, '')}/200`,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };

    onAddStaff(newStaff);
    setShowModal(false);
    setFormData({ name: '', role: '' });
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-4xl font-black text-foreground tracking-tight">Dein Power-Team</h3>
          <p className="text-muted-foreground font-medium mt-2">Verwalte Berechtigungen und Verfügbarkeiten deines Teams mit KI-Unterstützung.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 px-8 py-5 bg-gradient-to-r from-primary via-purple-600 to-pink-600 text-primary-foreground rounded-[2rem] font-black hover:scale-[1.05] transition-all shadow-2xl active:scale-95"
        >
          <UserPlus className="w-6 h-6 stroke-[2.5px]" />
          Hinzufügen
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
        {staff.map(member => (
          <div key={member.id} className="bg-card rounded-[3rem] overflow-hidden border border-border shadow-2xl floating-card group">
            <div className="h-32 bg-gradient-to-br from-primary via-purple-500 to-pink-500 relative">
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <button className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-2xl text-white backdrop-blur-md transition-all">
                <MoreVertical className="w-5 h-5" />
               </button>
            </div>
            <div className="px-8 pb-10 text-center">
              <div className="relative inline-block -mt-16 mb-6">
                <div className="p-1.5 bg-card rounded-[2.5rem] shadow-2xl">
                  <img 
                    src={member.avatar} 
                    alt={member.name} 
                    className="w-28 h-28 rounded-[2rem] object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 border-[6px] border-card rounded-full shadow-lg"></div>
              </div>
              
              <h4 className="text-2xl font-black text-foreground tracking-tight">{member.name}</h4>
              <p className="text-primary font-black text-xs uppercase tracking-widest mt-1">{member.role}</p>

              <div className="flex items-center justify-center gap-1.5 mt-4 mb-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                ))}
                <span className="text-xs text-muted-foreground font-black ml-2">4.8</span>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 h-14 bg-muted rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center shadow-inner">
                  <Mail className="w-6 h-6" />
                </button>
                <button className="flex-1 h-14 bg-muted rounded-2xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center shadow-inner">
                  <Phone className="w-6 h-6" />
                </button>
                <button className="flex-[2] h-14 bg-foreground text-background rounded-2xl text-sm font-black hover:bg-primary transition-all shadow-xl active:scale-95">
                  Dienstplan
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modern Floating Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-card rounded-[3rem] w-full max-w-md p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] animate-in zoom-in-95 duration-300 relative border border-border">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-8 right-8 p-3 text-muted-foreground hover:text-primary rounded-2xl hover:bg-muted transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <h4 className="text-3xl font-black mb-10 tracking-tight text-foreground">Talent einladen</h4>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Vollständiger Name</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all font-bold text-foreground shadow-inner" 
                  placeholder="z.B. Julia Meier"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">Spezialisierung</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-6 py-4 rounded-2xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none transition-all font-bold text-foreground shadow-inner" 
                  placeholder="z.B. Color Specialist"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                />
              </div>
              <div className="pt-6">
                <button 
                  type="submit"
                  className="w-full px-8 py-5 rounded-[2rem] bg-gradient-to-r from-primary to-purple-600 text-primary-foreground font-black hover:scale-[1.03] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3"
                >
                  <UserPlus className="w-6 h-6 stroke-[2.5px]" />
                  Bestätigen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;