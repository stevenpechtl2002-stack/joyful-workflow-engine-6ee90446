import React, { useState, useRef } from 'react';
import { UserRole } from '@/types';
import {
  Search, MapPin, Calendar, ArrowRight, ChevronDown, Moon, Star, Clock,
  Sparkles, Heart, Play, Check, X, Gift, Award, Smartphone, Download,
  Scissors, Palette, Flower2, HandMetal, UserCircle, Percent,
  Instagram, Facebook, Twitter, MessageCircle, HelpCircle, BookOpen,
  Building2, Users, Shield, Zap } from
'lucide-react';
import Logo from './Logo';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';

interface Props {
  onLogin: (role: UserRole) => void;
  onStartRegistration: () => void;
}

const LandingPage: React.FC<Props> = ({ onLogin, onStartRegistration }) => {
  const [searchTreatment, setSearchTreatment] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [showPromoBanner, setShowPromoBanner] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);

  const categories = [
  { icon: <Scissors className="w-5 h-5" />, label: 'Friseur' },
  { icon: <Palette className="w-5 h-5" />, label: 'Nägel' },
  { icon: <Flower2 className="w-5 h-5" />, label: 'Kosmetik' },
  { icon: <HandMetal className="w-5 h-5" />, label: 'Massage' },
  { icon: <UserCircle className="w-5 h-5" />, label: 'Männer' },
  { icon: <Percent className="w-5 h-5" />, label: 'Sale %' }];


  const treatmentCategories = [
  { icon: <Scissors className="w-8 h-8" />, label: 'Friseur', count: '2.400+', color: 'from-primary/20 to-primary/5' },
  { icon: <Palette className="w-8 h-8" />, label: 'Nagelstudio', count: '1.800+', color: 'from-accent/20 to-accent/5' },
  { icon: <Flower2 className="w-8 h-8" />, label: 'Kosmetik', count: '1.200+', color: 'from-[hsl(var(--zen-emerald))]/20 to-[hsl(var(--zen-emerald))]/5' },
  { icon: <HandMetal className="w-8 h-8" />, label: 'Massage', count: '900+', color: 'from-primary/15 to-accent/10' },
  { icon: <Sparkles className="w-8 h-8" />, label: 'Waxing', count: '600+', color: 'from-accent/15 to-primary/10' },
  { icon: <Heart className="w-8 h-8" />, label: 'Wellness', count: '450+', color: 'from-[hsl(var(--zen-emerald))]/15 to-primary/10' },
  { icon: <Star className="w-8 h-8" />, label: 'Microblading', count: '320+', color: 'from-primary/20 to-accent/15' },
  { icon: <UserCircle className="w-8 h-8" />, label: 'Barbershop', count: '780+', color: 'from-foreground/10 to-foreground/5' }];


  const featuredSalons = [
  { name: 'STUDIO NOIR', category: 'Friseur', rating: 4.9, reviews: 234, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop', price: 'Ab 45€', location: 'Berlin Mitte' },
  { name: 'Glow Aesthetics', category: 'Kosmetik', rating: 4.8, reviews: 189, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop', price: 'Ab 65€', location: 'München' },
  { name: 'Zen Massage', category: 'Wellness', rating: 5.0, reviews: 312, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', price: 'Ab 80€', location: 'Hamburg' },
  { name: 'Nail Art Berlin', category: 'Nails', rating: 4.7, reviews: 156, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop', price: 'Ab 35€', location: 'Berlin Kreuzberg' }];


  const uspFeatures = [
  { icon: <Zap className="w-8 h-8" />, title: 'Smarte Angebote', desc: 'Buche Last Minute oder zu Nebenzeiten und spare bis zu 30%.' },
  { icon: <Clock className="w-8 h-8" />, title: 'Buche 24/7', desc: 'Einfach vom Bett, aus dem Bus oder wo auch immer du gerade bist.' },
  { icon: <Shield className="w-8 h-8" />, title: 'Top-bewertete Salons', desc: 'Tausende verifizierte Salons mit echten Bewertungen.' }];


  const AnimatedSection = ({ children, className = '' }: {children: React.ReactNode;className?: string;}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-80px" });
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 60 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 60 }}
        transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        className={className}>

        {children}
      </motion.div>);

  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* 1. Promo Banner */}
      <AnimatePresence>
        {showPromoBanner &&
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground overflow-hidden">

            <div className="max-w-7xl mx-auto px-6 py-2.5 flex items-center justify-center gap-3 relative">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wide">Ready for your glow? — Entdecke dein Wohlbefinden</span>
              <button onClick={() => setShowPromoBanner(false)} className="absolute right-4 p-1 hover:bg-white/20 rounded transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        }
      </AnimatePresence>

      {/* 2. Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30">

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="h-16 flex items-center justify-between">
            <Logo variant="light" />
            <nav className="flex items-center gap-6">
              <motion.button
                onClick={onStartRegistration}
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors hidden md:block"
                whileHover={{ scale: 1.05 }}>

                Für Geschäftspartner
              </motion.button>
              <motion.button
                onClick={() => onLogin('customer')}
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors hidden md:block"
                whileHover={{ scale: 1.05 }}>

                Kunden Portal
              </motion.button>
              <motion.button
                onClick={() => onLogin('salon')}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}>

                Login
              </motion.button>
            </nav>
          </div>
          {/* Category Navigation */}
          <div className="flex items-center gap-1 pb-3 overflow-x-auto no-scrollbar -mx-2">
            {categories.map((cat, i) =>
            <motion.button
              key={cat.label}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted whitespace-nowrap transition-all"
              whileHover={{ y: -3, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}>

                {cat.icon}
                {cat.label}
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* 3. Hero Section */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="relative py-20 lg:py-32 px-6 lg:px-12 overflow-hidden">

        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&h=1080&fit=crop&q=80"
            alt="Beauty Background"
            className="w-full h-full object-cover" />

          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40"></div>
        </div>

        {/* Floating 3D Glass Elements */}
        <motion.div
          className="absolute top-20 right-[15%] w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 backdrop-blur-xl border border-white/20 shadow-2xl hidden lg:block"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ perspective: 800 }} />

        <motion.div
          className="absolute bottom-20 right-[25%] w-20 h-20 rounded-full bg-gradient-to-br from-accent/20 to-primary/10 backdrop-blur-xl border border-white/20 shadow-2xl hidden lg:block"
          animate={{ y: [0, 15, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />

        <motion.div
          className="absolute top-40 right-[8%] w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--zen-emerald))]/15 to-primary/10 backdrop-blur-xl border border-white/20 shadow-2xl hidden lg:block"
          animate={{ y: [0, 25, 0], rotate: [0, 12, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }} />


        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-6">

              READY FOR YOUR GLOW?
            </motion.p>
            
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight mb-6">

              Alles für dein{' '}
               <span className="text-accent">
                 Wohlbefinden.
               </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg text-muted-foreground font-medium mb-10 max-w-lg">

              Über 5.000 verifizierte Salons. Einfach buchen, entspannt genießen.
            </motion.p>

            {/* Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="bg-card/95 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-primary/5 border border-border/50 p-4"
              whileHover={{ boxShadow: "0 30px 60px -15px hsl(195 80% 28% / 0.15)" }}>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border/50">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Welche Behandlung?"
                    value={searchTreatment}
                    onChange={(e) => setSearchTreatment(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm font-medium" />

                </div>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border/50">
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="In welcher Stadt?"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-sm font-medium" />

                </div>
              </div>
              <motion.button
                onClick={() => onLogin('customer')}
                className="w-full mt-3 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}>

                Suchen
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 4. Treatment Categories - Horizontal Scroll */}
      <section className="lg:px-12 px-[24px] rounded-none shadow-sm mx-0 py-[40px]">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <h2 className="text-2xl md:text-3xl font-black text-foreground mb-8">Beliebte Behandlungen</h2>
          </AnimatedSection>
          <motion.div
            className="flex gap-4 overflow-x-auto no-scrollbar pb-4 cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={{ left: -600, right: 0 }}>

            {treatmentCategories.map((cat, i) =>
            <motion.div
              key={cat.label}
              className={`flex-shrink-0 w-40 p-5 rounded-2xl bg-gradient-to-br ${cat.color} border border-border/30 cursor-pointer`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{
                y: -8,
                rotateY: 5,
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)'
              }}
              style={{ perspective: 800 }}
              onClick={() => onLogin('customer')}>

                <div className="text-primary mb-3">{cat.icon}</div>
                <p className="font-black text-foreground text-sm mb-1">{cat.label}</p>
                <p className="text-xs text-muted-foreground font-medium">{cat.count} Salons</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 5. Featured Salons */}
      <section className="px-6 lg:px-12 py-0">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-8 mb-10">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-3">Entdecken</p>
                <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
                  Die besten Salons<br />in deiner Nähe
                </h2>
              </div>
              <motion.button
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-accent transition-colors group whitespace-nowrap"
                whileHover={{ x: 4 }}>

                Alle entdecken
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSalons.map((salon, index) =>
            <AnimatedSection key={salon.name}>
                <motion.div
                className="group cursor-pointer"
                whileHover={{ y: -10, rotateX: 2, rotateY: -2 }}
                transition={{ duration: 0.3 }}
                onClick={() => onLogin('customer')}
                style={{ perspective: 1000 }}>

                  <div className="relative rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-2xl transition-shadow">
                    <div className="aspect-[4/3] overflow-hidden">
                      <motion.img
                      src={salon.image}
                      alt={salon.name}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.5 }} />

                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <motion.button
                    className="absolute bottom-4 left-4 right-4 py-3 bg-accent text-accent-foreground rounded-xl text-xs font-black opacity-0 group-hover:opacity-100 transition-all shadow-lg">

                      Jetzt buchen
                    </motion.button>
                    <div className="absolute top-3 right-3 px-2.5 py-1 bg-card/90 backdrop-blur-xl rounded-lg flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-foreground">{salon.rating}</span>
                    </div>
                  </div>
                  <div className="px-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{salon.category}</p>
                    <h3 className="text-base font-black text-foreground mb-1">{salon.name}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{salon.location}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{salon.reviews} Bewertungen</p>
                      <p className="text-sm font-bold text-foreground">{salon.price}</p>
                    </div>
                  </div>
                </motion.div>
              </AnimatedSection>
            )}
          </div>
        </div>
      </section>

      {/* 6. USP Section */}
      <section className="py-20 px-6 lg:px-12 bg-primary-foreground">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">Warum ZenTime?</h2>
              <p className="text-muted-foreground font-medium max-w-lg mx-auto">Dein Wohlbefinden verdient das Beste.</p>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {uspFeatures.map((feature, i) =>
            <AnimatedSection key={feature.title}>
                <motion.div
                className="glass-card rounded-2xl p-8 text-center"
                whileHover={{ y: -8, rotateX: 2, rotateY: -1 }}
                transition={{ duration: 0.3 }}
                style={{ perspective: 1000 }}>

                  <motion.div
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 text-primary"
                  whileHover={{ scale: 1.1, rotate: 5 }}>

                    {feature.icon}
                  </motion.div>
                  <h3 className="text-lg font-black text-foreground mb-3">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              </AnimatedSection>
            )}
          </div>
        </div>
      </section>



      <section className="py-16 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-8 mb-10">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-3">Inspiration</p>
                <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
                  Bereit für eine<br />Veränderung?
                </h2>
              </div>
              <motion.button
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-accent transition-colors group whitespace-nowrap"
                whileHover={{ x: 4 }}>

                Alle Styles
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </AnimatedSection>

          <AnimatedSection>
            <motion.div
              className="relative rounded-2xl overflow-hidden h-[60vh] group cursor-pointer"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.5 }}>

              <motion.img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&h=1080&fit=crop&q=80"
                alt="Friseur"
                className="w-full h-full object-cover"
                initial={{ scale: 1.08 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 1.2 }} />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-opacity"
                whileHover={{ scale: 1.1 }}>

                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </motion.div>

              <div className="absolute bottom-0 left-0 p-8 lg:p-12 text-white max-w-xl">
                <span className="inline-block px-4 py-2 bg-accent rounded-lg text-xs font-black uppercase tracking-wider mb-4">Friseur</span>
                <h3 className="text-3xl md:text-5xl font-black leading-tight mb-4">
                  Exzellenz in<br />
                  <span className="text-accent">jedem Schnitt.</span>
                </h3>
                <p className="text-white/70 font-medium">Entdecke die besten Stylisten deiner Stadt.</p>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* 10. Business Section */}
      <section className="py-24 px-6 lg:px-12 bg-muted/30 relative overflow-hidden">
        <motion.div
          className="absolute top-20 right-[10%] w-36 h-36 rounded-2xl bg-gradient-to-br from-primary/8 to-accent/8 backdrop-blur-xl border border-white/10 hidden lg:block"
          animate={{ y: [0, -25, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />

        <motion.div
          className="absolute bottom-32 left-[5%] w-24 h-24 rounded-full bg-gradient-to-br from-accent/10 to-primary/5 backdrop-blur-xl border border-white/10 hidden lg:block"
          animate={{ y: [0, 18, 0], rotate: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />


        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-6">Für Geschäftspartner</p>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[0.95] tracking-tight">
                  <span className="text-primary">Wachstum</span>
                  <br />als{' '}
                  <span className="text-foreground">Standard.</span>
                </h2>
                <p className="mt-8 text-lg text-muted-foreground font-medium leading-relaxed max-w-lg">
                  Die leistungsstärkste Suite für moderne Salons. Präsentiere deine Produkte und Services.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  {[
                  { icon: <Sparkles className="w-5 h-5" />, title: 'KI-Terminplanung' },
                  { icon: <Heart className="w-5 h-5" />, title: 'Kundenbindung' },
                  { icon: <Star className="w-5 h-5" />, title: 'Bewertungen' }].
                  map((feature, i) =>
                  <motion.div
                    key={feature.title}
                    className="flex items-center gap-2 px-4 py-2.5 bg-card rounded-xl border border-border shadow-sm"
                    whileHover={{ scale: 1.05, y: -2 }}>

                      <span className="text-primary">{feature.icon}</span>
                      <span className="font-bold text-foreground text-sm">{feature.title}</span>
                    </motion.div>
                  )}
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <motion.button
                    onClick={onStartRegistration}
                    className="px-8 py-4 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}>

                    Jetzt starten
                  </motion.button>
                  <motion.button
                    onClick={() => onLogin('salon')}
                    className="px-8 py-4 border-2 border-border text-foreground rounded-xl text-xs font-black uppercase tracking-wider hover:bg-muted transition-all"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}>

                    Demo anfordern
                  </motion.button>
                </div>
              </div>
            </AnimatedSection>
            
            <AnimatedSection>
              <div className="relative">
                <motion.div
                  className="rounded-2xl overflow-hidden shadow-2xl bg-card border border-border"
                  whileHover={{ y: -8, rotateY: 2, rotateX: -2 }}
                  transition={{ duration: 0.4 }}
                  style={{ perspective: 1000 }}>

                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop" alt="Salon" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-white font-bold text-sm">4.9 (312 Bewertungen)</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Signature Treatment</p>
                        <h4 className="text-lg font-black text-foreground">Aromatherapie Massage</h4>
                      </div>
                      <p className="text-xl font-black text-foreground">89€</p>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground text-sm">
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>60 min</span></div>
                      <div className="flex items-center gap-1.5"><Check className="w-4 h-4 text-[hsl(var(--zen-emerald))]" /><span>Sofort buchbar</span></div>
                    </div>
                  </div>
                </motion.div>
                <motion.div
                  className="absolute -bottom-5 -left-5 bg-card rounded-2xl p-5 shadow-xl border border-border z-10"
                  whileHover={{ scale: 1.05 }}>

                  <p className="text-3xl font-black text-primary">+127%</p>
                  <p className="text-xs font-bold text-muted-foreground mt-1">Wachstum</p>
                </motion.div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 11. Stats Section */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
            { value: '5.000+', label: 'Verifizierte Salons' },
            { value: '2M+', label: 'Zufriedene Kunden' },
            { value: '98%', label: 'Buchungsrate' },
            { value: '4.9', label: 'Durchschnittsbewertung' }].
            map((stat) =>
            <AnimatedSection key={stat.label}>
                <motion.div
                className="glass-card rounded-2xl p-6 text-center"
                whileHover={{ y: -6, rotateX: 2, rotateY: -1 }}
                style={{ perspective: 1000 }}>

                  <p className="text-3xl md:text-4xl font-black text-primary">{stat.value}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-2">{stat.label}</p>
                </motion.div>
              </AnimatedSection>
            )}
          </div>
        </div>
      </section>

      {/* 12. Extended Footer */}
      <footer className="py-16 px-6 lg:px-12 border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <h4 className="font-black text-foreground text-sm mb-4">Kunden-Hilfe</h4>
              <ul className="space-y-2.5">
                {['Chat', 'Kontakt', 'FAQ', 'Stornierung'].map((item) =>
                <li key={item}><button className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</button></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-foreground text-sm mb-4">Entdecke</h4>
              <ul className="space-y-2.5">
                {['Treatment Guide', 'Blog', 'Gutscheine', 'Newsletter', 'Rewards'].map((item) =>
                <li key={item}><button className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</button></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-foreground text-sm mb-4">Geschäftspartner</h4>
              <ul className="space-y-2.5">
                {['Partner werden', 'Help Center', 'Preise', 'Features'].map((item) =>
                <li key={item}><button className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</button></li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-foreground text-sm mb-4">Unternehmen</h4>
              <ul className="space-y-2.5">
                {['Über uns', 'Jobs', 'Presse', 'Impressum', 'Datenschutz'].map((item) =>
                <li key={item}><button className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item}</button></li>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md">Z</div>
              <span className="text-sm font-black text-foreground">ZenTime<span className="text-accent">Beauty</span></span>
            </div>
            
            <div className="flex items-center gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) =>
              <motion.button
                key={i}
                className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                whileHover={{ y: -3, scale: 1.1 }}>

                  <Icon className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">© 2026 ZenTime Beauty. Alle Rechte vorbehalten.</p>
          </div>
          
          <div className="pt-4 flex justify-center">
            <motion.button
              onClick={() => onLogin('admin')}
              className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              whileHover={{ scale: 1.02 }}>

              Admin Login
            </motion.button>
          </div>
        </div>
      </footer>
    </div>);

};

export default LandingPage;