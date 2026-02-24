import React, { useState } from 'react';
import { UserRole } from '@/types';
import { Briefcase, Heart, ArrowRight, ShieldCheck, Sparkles, User, Lock, Store } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onLogin: (role: UserRole) => void;
  onStartRegistration: () => void;
}

const Login: React.FC<Props> = ({ onLogin, onStartRegistration }) => {
  const [activeTab, setActiveTab] = useState<'salon' | 'customer'>('customer');

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <motion.div 
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-2xl bg-gradient-to-br from-primary/20 via-violet-500/15 to-pink-500/10 blur-[120px]"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-2xl bg-gradient-to-br from-pink-500/15 via-violet-500/10 to-primary/20 blur-[120px]"
        animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />

      <motion.div 
        className="absolute top-[20%] right-[10%] w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 backdrop-blur-xl border border-white/20"
        animate={{ y: [0, -20, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-[30%] left-[8%] w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 backdrop-blur-xl border border-white/20"
        animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div 
          className="space-y-8 pr-0 lg:pr-12"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary via-violet-500 to-pink-500 rounded-2xl flex items-center justify-center text-primary-foreground font-black text-2xl shadow-2xl">
              Z
            </div>
            <h1 className="text-5xl font-black tracking-tighter text-foreground">ZenBook</h1>
          </div>
          
          <h2 className="text-6xl font-black text-foreground leading-[1.1] tracking-tight">
            Wellness Management <br />
            <span className="text-gradient">Neu Definiert.</span>
          </h2>
          
          <p className="text-xl text-muted-foreground font-medium leading-relaxed max-w-lg">
            Die Komplettlösung für modernste Beautysalons und ihre Kunden. Intelligent, vernetzt und einfach schön.
          </p>

          <div className="flex gap-6 pt-4">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://picsum.photos/seed/user${i}/100`} className="w-12 h-12 rounded-xl border-4 border-background object-cover shadow-lg" alt="User" />
              ))}
            </div>
            <div>
              <p className="text-sm font-black text-foreground">+500 Salons</p>
              <p className="text-xs font-bold text-muted-foreground">vertrauen auf ZenBook</p>
            </div>
          </div>
        </motion.div>

        <motion.div 
          className="glass-card rounded-2xl p-12 relative overflow-hidden group"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-2xl -mr-16 -mt-16 blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000"></div>
          
          <div className="flex bg-muted p-1.5 rounded-xl mb-12">
            <button 
              onClick={() => setActiveTab('customer')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-sm font-black transition-all ${activeTab === 'customer' ? 'bg-card text-primary shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Heart className="w-4 h-4" /> Kunden Portal
            </button>
            <button 
              onClick={() => setActiveTab('salon')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg text-sm font-black transition-all ${activeTab === 'salon' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Briefcase className="w-4 h-4" /> Salon Pro
            </button>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="text-3xl font-black text-foreground tracking-tight">
                {activeTab === 'salon' ? 'Willkommen zurück, Partner' : 'Bereit für Entspannung?'}
              </h3>
              <p className="text-muted-foreground font-medium mt-2">Logge dich ein, um fortzufahren.</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="email" 
                  placeholder="Email Adresse" 
                  className="w-full pl-14 pr-6 py-5 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none font-bold text-foreground shadow-inner transition-all"
                  defaultValue={activeTab === 'salon' ? 'salon@zenbook.de' : 'customer@relax.de'}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input 
                  type="password" 
                  placeholder="Passwort" 
                  className="w-full pl-14 pr-6 py-5 rounded-xl bg-muted border-2 border-transparent focus:border-primary focus:bg-card outline-none font-bold text-foreground shadow-inner transition-all"
                  defaultValue="password123"
                />
              </div>
            </div>

            <motion.button 
              onClick={() => onLogin(activeTab)}
              className={`w-full py-6 rounded-xl text-primary-foreground font-black text-lg shadow-2xl transition-all flex items-center justify-center gap-3 ${activeTab === 'salon' ? 'bg-foreground' : 'bg-gradient-to-r from-primary via-violet-500 to-primary'}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Einloggen
              <ArrowRight className="w-6 h-6" />
            </motion.button>

            {activeTab === 'salon' && (
              <div className="pt-6 border-t border-border text-center">
                <p className="text-sm font-bold text-muted-foreground mb-6">Noch kein ZenBook Partner?</p>
                <motion.button 
                  onClick={onStartRegistration}
                  className="w-full py-5 rounded-xl border-2 border-border text-foreground font-black hover:bg-muted transition-all flex items-center justify-center gap-3"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Store className="w-5 h-5 text-primary" />
                  Salon registrieren
                </motion.button>
              </div>
            )}

            <div className="flex items-center justify-center gap-8 pt-4">
              <div className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure SSL
              </div>
              <div className="flex items-center gap-2 text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-primary" /> AI Enabled
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;