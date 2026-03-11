import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/types';
import {
  Search, MapPin, Calendar, ArrowRight, ChevronDown, Moon, Star, Clock,
  Sparkles, Heart, Play, Check, X, Gift, Award, Smartphone, Download,
  Scissors, Palette, Flower2, HandMetal, UserCircle, Percent,
  Instagram, Facebook, Twitter, MessageCircle, HelpCircle, BookOpen,
  Building2, Users, Shield, Zap } from
'lucide-react';
import Logo from './Logo';
import zentimeLogo from '@/assets/zentime-logo.png';
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

  const navigate = useNavigate();

  const treatmentCategories = [
  { icon: <Scissors className="w-7 h-7" />, label: 'Friseur', count: 'Neu', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop', gradient: 'from-black/50 to-black/20', glow: 'shadow-black/10' },
  { icon: <Palette className="w-7 h-7" />, label: 'Nagelstudio', count: 'Neu', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop', gradient: 'from-black/50 to-black/20', glow: 'shadow-black/10' },
  { icon: <Flower2 className="w-7 h-7" />, label: 'Kosmetik', count: 'Neu', image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=300&fit=crop', gradient: 'from-black/50 to-black/20', glow: 'shadow-black/10' },
  { icon: <UserCircle className="w-7 h-7" />, label: 'Barbershop', count: 'Neu', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop', gradient: 'from-black/50 to-black/20', glow: 'shadow-black/10' },
  { icon: <HandMetal className="w-7 h-7" />, label: 'Massage', count: 'Bald', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop', gradient: 'from-black/50 to-black/20', glow: 'shadow-black/10' },
  { icon: <Sparkles className="w-7 h-7" />, label: 'Waxing', count: 'Bald', image: 'https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=400&h=300&fit=crop', gradient: 'from-black/50 to-black/20', glow: 'shadow-black/10' },
  { icon: <Heart className="w-7 h-7" />, label: 'Wellness', count: 'Bald', image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400&h=300&fit=crop', gradient: 'from-black/50 to-black/20', glow: 'shadow-black/10' },
  { icon: <Award className="w-7 h-7" />, label: 'Microblading', count: 'Bald', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=300&fit=crop', gradient: 'from-black/50 to-black/20', glow: 'shadow-black/10' }];


  const featuredSalons = [
  { name: 'STUDIO NOIR', category: 'Friseur', rating: 4.9, reviews: 12, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop', price: 'Ab 45€', location: 'Berlin Mitte' },
  { name: 'Glow Aesthetics', category: 'Kosmetik', rating: 4.8, reviews: 8, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&h=400&fit=crop', price: 'Ab 65€', location: 'München' },
  { name: 'Zen Massage', category: 'Wellness', rating: 5.0, reviews: 15, image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', price: 'Ab 80€', location: 'Hamburg' },
  { name: 'Nail Art Berlin', category: 'Nails', rating: 4.7, reviews: 6, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=400&fit=crop', price: 'Ab 35€', location: 'Berlin Kreuzberg' }];


  const uspFeatures = [
  { icon: <Zap className="w-8 h-8" />, title: 'Smarte Angebote', desc: 'Buche Last Minute oder zu Nebenzeiten und spare bis zu 30%.' },
  { icon: <Clock className="w-8 h-8" />, title: 'Buche 24/7', desc: 'Einfach vom Bett, aus dem Bus oder wo auch immer du gerade bist.' },
  { icon: <Shield className="w-8 h-8" />, title: 'Top-bewertete Salons', desc: 'Nur geprüfte Salons mit echten Bewertungen.' }];


  // Reusable floating SVG decoration component
  const FloatingShape = ({ type, className, duration = 10, delay = 0 }: {type: 'circle' | 'triangle' | 'stripe';className: string;duration?: number;delay?: number;}) => {
    const shapes: Record<string, React.ReactNode> = {
      circle:
      <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="90" fill="currentColor" />
        </svg>,

      triangle:
      <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon points="50,10 90,85 10,85" fill="currentColor" />
        </svg>,

      stripe:
      <svg viewBox="0 0 400 200" className="w-full h-full">
          <rect x="0" y="60" width="400" height="30" rx="15" fill="currentColor" transform="rotate(-12 200 100)" />
          <rect x="0" y="120" width="300" height="20" rx="10" fill="currentColor" transform="rotate(-12 150 130)" />
        </svg>

    };
    return (
      <motion.div
        className={`absolute pointer-events-none ${className}`}
        animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
        transition={{ duration, repeat: Infinity, ease: "easeInOut", delay }}>
        
        {shapes[type]}
      </motion.div>);

  };

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
              <motion.a
                href="/storefront"
                className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors hidden md:block"
                whileHover={{ scale: 1.05 }}>
                Salons entdecken
              </motion.a>
              <motion.a
                href="/login"
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-black shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}>
                Login
              </motion.a>
            </nav>
          </div>
          {/* Category Navigation */}
          <div className="flex items-center gap-1 pb-3 overflow-x-auto no-scrollbar -mx-2">
            {categories.map((cat, i) =>
            <motion.button
              key={cat.label}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${cat.label === 'Sale %' ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              whileHover={{ y: -3, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const categoryMap: Record<string, string> = { 'Nägel': 'Nagelstudio', 'Männer': 'Barbershop' };
                if (cat.label === 'Sale %') navigate('/storefront?filter=sale');else
                navigate(`/storefront?category=${encodeURIComponent(categoryMap[cat.label] || cat.label)}`);
              }}>

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

          <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-background/20 to-transparent"></div>
        </div>

        {/* Floating Glass Element */}
        <motion.div
          className="absolute top-[30%] right-[12%] w-24 h-24 rounded-2xl bg-gradient-to-br from-[#8B7FC7]/15 to-[#D8B4FE]/15 backdrop-blur-xl border border-white/20 shadow-2xl hidden lg:block z-20 pointer-events-none"
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

        <FloatingShape type="circle" className="w-40 h-40 text-[#C4B5FD]/10 bottom-[15%] left-[5%]" duration={10} delay={0.5} />
        

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

              Finde deinen perfekten Salon und buche in Sekunden.
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
              <motion.a
                href="/storefront"
                className="w-full mt-3 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all block text-center"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.97 }}>
                Suchen
              </motion.a>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* 4. Treatment Categories - Premium Grid */}
      <section className="lg:px-12 px-6 py-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-[20%] right-[8%] w-28 h-28 opacity-[0.15]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#FB7185" /></svg>
          <svg className="absolute bottom-[10%] left-[40%] w-48 h-24 opacity-[0.15]" viewBox="0 0 400 200"><rect x="0" y="80" width="400" height="25" rx="12" fill="#F472B6" transform="rotate(-10 200 100)" /></svg>
        </div>
        <motion.div className="absolute top-[15%] left-[8%] w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B7FC7]/10 to-[#D8B4FE]/10 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, -15, 0], rotate: [0, 4, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[20%] right-[15%] w-14 h-14 rounded-full bg-gradient-to-br from-[#D8B4FE]/12 to-[#8B7FC7]/8 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, 12, 0], rotate: [0, -6, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        <div className="max-w-7xl mx-auto relative">
          <AnimatedSection>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-3 flex items-center gap-2">
                  <span className="w-8 h-px bg-accent" />
                  Kategorien
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
                  Beliebte<br />Behandlungen
                </h2>
              </div>
              <motion.a
                href="/storefront"
                className="hidden md:flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors group"
                whileHover={{ x: 4 }}>
                Alle anzeigen
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {treatmentCategories.map((cat, i) =>
            <motion.div
              key={cat.label}
              className={`group relative cursor-pointer rounded-3xl overflow-hidden h-52 shadow-lg ${cat.glow} hover:shadow-2xl transition-shadow duration-500`}
              initial={{ opacity: 0, y: 30, rotateX: 5 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.6, type: 'spring' }}
              whileHover={{ y: -10, scale: 1.03 }}
              style={{ perspective: 1000 }}
              onClick={() => window.location.href = '/storefront'}>

                {/* Background image */}
                <img
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              
                
                {/* Color gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`} />
                
                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                {/* Content */}
                <div className="relative h-full p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
                      {cat.icon}
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full backdrop-blur-md ${cat.count === 'Neu' ? 'bg-white/25 text-white border border-white/30' : 'bg-black/20 text-white/70 border border-white/10'}`}>
                      {cat.count === 'Neu' ? '● Live' : 'Bald'}
                    </span>
                  </div>
                  <div>
                    <p className="font-black text-white text-lg tracking-wide drop-shadow-lg">{cat.label}</p>
                    <p className="text-white/70 text-xs font-medium mt-0.5">Entdecken →</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 5. Featured Salons */}
      <section className="px-6 lg:px-12 py-0 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute bottom-[25%] left-[50%] w-20 h-20 opacity-[0.15]" viewBox="0 0 100 100"><polygon points="50,10 90,85 10,85" fill="#F43F5E" /></svg>
        </div>
        <motion.div className="absolute top-[40%] right-[6%] w-18 h-18 rounded-2xl bg-gradient-to-br from-[#C4B5FD]/12 to-[#8B7FC7]/8 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, -18, 0], rotate: [0, 6, 0], scale: [1, 1.04, 1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[15%] left-[4%] w-12 h-12 rounded-full bg-gradient-to-br from-[#D8B4FE]/15 to-[#8B7FC7]/10 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, 14, 0], rotate: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-8 mb-10">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-3">Entdecken</p>
                <h2 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
                  Die besten Salons<br />in deiner Nähe
                </h2>
              </div>
              <motion.a
                href="/storefront"
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-accent transition-colors group whitespace-nowrap"
                whileHover={{ x: 4 }}>

                Alle entdecken
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.a>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredSalons.map((salon, index) =>
            <AnimatedSection key={salon.name}>
                <motion.div
                className="group cursor-pointer"
                whileHover={{ y: -10, rotateX: 2, rotateY: -2 }}
                transition={{ duration: 0.3 }}
                onClick={() => window.location.href = '/storefront'}
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
      <section className="py-20 px-6 lg:px-12 bg-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-[30%] left-[60%] w-32 h-32 opacity-[0.15]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#F472B6" /></svg>
        </div>
        <motion.div className="absolute top-[20%] right-[10%] w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8B7FC7]/10 to-[#C4B5FD]/10 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, -16, 0], rotate: [0, -5, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
        <motion.div className="absolute bottom-[25%] left-[6%] w-14 h-14 rounded-full bg-gradient-to-br from-[#D8B4FE]/12 to-[#8B7FC7]/8 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, 12, 0], rotate: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <div className="max-w-7xl mx-auto relative z-10">
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



      <section className="py-16 px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-[40%] right-[45%] w-24 h-24 opacity-[0.15]" viewBox="0 0 300 300"><path d="M50 280 L150 30 L280 260 Q280 290 250 290 L80 290 Q50 290 50 260Z" fill="#FB7185" /></svg>
        </div>
        <motion.div className="absolute top-[10%] right-[20%] w-16 h-16 rounded-full bg-gradient-to-br from-[#C4B5FD]/10 to-[#D8B4FE]/10 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, -20, 0], rotate: [0, 7, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatedSection>
            <div className="flex items-end justify-between gap-8 mb-10">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-3">Inspiration</p>
                <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight">
                  Bereit für eine<br />Veränderung?
                </h2>
              </div>
              <motion.a
                href="/storefront"
                className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-accent transition-colors group whitespace-nowrap"
                whileHover={{ x: 4 }}>
                Alle Styles
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.a>
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

      {/* 10. CTA Section */}
      <section className="py-24 px-6 lg:px-12 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-[40%] right-[30%] w-20 h-20 opacity-[0.15]" viewBox="0 0 100 100"><polygon points="50,10 90,85 10,85" fill="#F43F5E" /></svg>
        </div>
        <motion.div className="absolute bottom-[20%] right-[8%] w-18 h-18 rounded-2xl bg-gradient-to-br from-[#D8B4FE]/12 to-[#C4B5FD]/10 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, -14, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <AnimatedSection>
            <h2 className="text-4xl md:text-5xl font-black text-foreground leading-tight mb-6">
              Bereit für deinen <span className="text-primary">nächsten Termin?</span>
            </h2>
            <p className="text-lg text-muted-foreground font-medium mb-10 max-w-lg mx-auto">
              Entdecke Salons in deiner Nähe und buche direkt online – mit oder ohne Account.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.a
                href="/storefront"
                className="px-8 py-4 bg-primary text-primary-foreground rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}>
                Jetzt Salon finden
              </motion.a>
              <motion.a
                href="/login"
                className="px-8 py-4 border-2 border-border text-foreground rounded-xl text-xs font-black uppercase tracking-wider hover:bg-muted transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}>
                Login / Registrieren
              </motion.a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Salon-Partner Sektion */}
      <section className="py-24 px-6 lg:px-12 bg-gradient-to-br from-primary/5 via-accent/5 to-background relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-[60%] left-[55%] w-24 h-24 opacity-[0.15]" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#F43F5E" /></svg>
        </div>
        <motion.div className="absolute top-[15%] left-[5%] w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B7FC7]/12 to-[#C4B5FD]/10 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, -22, 0], rotate: [0, 8, 0], scale: [1, 1.04, 1] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-[10%] right-[12%] w-14 h-14 rounded-full bg-gradient-to-br from-[#D8B4FE]/15 to-[#8B7FC7]/10 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, 16, 0], rotate: [0, -6, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <AnimatedSection>
            <div className="text-center mb-14">
              <p className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-3">Für Salons</p>
              <h2 className="text-3xl md:text-5xl font-black text-foreground leading-tight mb-4">
                Du bist <span className="text-primary">Salon-Betreiber?</span>
              </h2>
              <p className="text-lg text-muted-foreground font-medium max-w-lg mx-auto">
                Werde Teil von ZenTime und erreiche neue Kunden – komplett kostenlos.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
            { icon: <Users className="w-8 h-8" />, title: 'Neue Kunden gewinnen', desc: 'Werde online sichtbar und von neuen Kunden gefunden.' },
            { icon: <Calendar className="w-8 h-8" />, title: 'Online-Buchungen 24/7', desc: 'Dein Kalender füllt sich automatisch – auch nachts.' },
            { icon: <Zap className="w-8 h-8" />, title: 'Einfache Verwaltung', desc: 'Staff, Services & Termine in einem einzigen Tool.' },
            { icon: <Shield className="w-8 h-8" />, title: 'Kostenlos starten', desc: 'Keine Grundgebühr, keine Vertragsbindung.' }].
            map((item, i) =>
            <AnimatedSection key={item.title}>
                <motion.div
                className="glass-card rounded-2xl p-8 text-center h-full"
                whileHover={{ y: -8, rotateX: 2, rotateY: -1 }}
                transition={{ duration: 0.3 }}
                style={{ perspective: 1000 }}>
                  <motion.div
                  className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 text-primary"
                  whileHover={{ scale: 1.1, rotate: 5 }}>
                    {item.icon}
                  </motion.div>
                  <h3 className="text-lg font-black text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              </AnimatedSection>
            )}
          </div>

          <AnimatedSection className="text-center">
            <motion.a
              href="/portal/auth"
              className="inline-block px-10 py-4 bg-primary text-primary-foreground rounded-xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}>
              Jetzt kostenlos registrieren
            </motion.a>
          </AnimatedSection>
        </div>
      </section>

      {/* 11. Stats Section */}
      <section className="py-20 px-6 lg:px-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute top-[50%] left-[70%] w-20 h-20 opacity-[0.15]" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="#FB7185" /></svg>
        </div>
        <motion.div className="absolute top-[30%] left-[3%] w-14 h-14 rounded-full bg-gradient-to-br from-[#C4B5FD]/10 to-[#8B7FC7]/8 backdrop-blur-xl border border-white/10 shadow-xl hidden lg:block z-20 pointer-events-none" animate={{ y: [0, -12, 0], rotate: [0, 4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
            { value: 'Wachsend', label: 'Partner-Salons' },
            { value: '24/7', label: 'Online buchbar' },
            { value: 'Einfach', label: 'In Sekunden buchen' },
            { value: '5.0', label: 'Unser Qualitätsziel' }].
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
      <footer className="relative overflow-hidden py-16 px-6 lg:px-12 bg-gradient-to-br from-rose-400 via-pink-400 to-rose-500">
        {/* Decorative geometric shapes */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute -bottom-16 -right-16 w-80 h-80 opacity-30" viewBox="0 0 300 300">
            <path d="M50 280 L150 30 L280 260 Q280 290 250 290 L80 290 Q50 290 50 260Z" fill="#8B7355" />
          </svg>
          <svg className="absolute -top-20 -left-20 w-64 h-64 opacity-20" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="#C4A35A" />
          </svg>
          <svg className="absolute top-1/3 right-1/4 w-32 h-32 opacity-15" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#BE185D" />
          </svg>
          <svg className="absolute bottom-0 left-1/4 w-96 h-48 opacity-10" viewBox="0 0 400 200">
            <rect x="0" y="60" width="400" height="30" rx="15" fill="#8B7355" transform="rotate(-12 200 100)" />
            <rect x="0" y="120" width="300" height="20" rx="10" fill="#C4A35A" transform="rotate(-12 150 130)" />
          </svg>
          <svg className="absolute top-8 right-12 w-24 h-24 opacity-20" viewBox="0 0 100 100">
            <polygon points="50,10 90,85 10,85" fill="#9F7AEA" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <h4 className="font-black text-white text-sm mb-4">Kunden-Hilfe</h4>
              <ul className="space-y-2.5">
                {['Chat', 'Kontakt', 'FAQ', 'Stornierung'].map((item) => (
                  <li key={item}><button className="text-sm text-white/70 hover:text-white transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white text-sm mb-4">Entdecke</h4>
              <ul className="space-y-2.5">
                {['Treatment Guide', 'Blog', 'Gutscheine', 'Newsletter', 'Rewards'].map((item) => (
                  <li key={item}><button className="text-sm text-white/70 hover:text-white transition-colors">{item}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white text-sm mb-4">Für Salons</h4>
              <ul className="space-y-2.5">
                <li><a href="/login" className="text-sm text-white/70 hover:text-white transition-colors">Salon registrieren</a></li>
                <li><button className="text-sm text-white/70 hover:text-white transition-colors">Help Center</button></li>
                <li><button className="text-sm text-white/70 hover:text-white transition-colors">Preise</button></li>
                <li><button className="text-sm text-white/70 hover:text-white transition-colors">Features</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white text-sm mb-4">Unternehmen</h4>
              <ul className="space-y-2.5">
                {['Über uns', 'Jobs', 'Presse', 'Impressum', 'Datenschutz'].map((item) =>
                <li key={item}><button className="text-sm text-white/70 hover:text-white transition-colors">{item}</button></li>
                )}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={zentimeLogo} alt="ZenTime" className="h-16 w-auto object-contain brightness-0 invert" />
            </div>
            
            <div className="flex items-center gap-3">
              {[Instagram, Facebook, Twitter].map((Icon, i) =>
              <motion.button
                key={i}
                className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/25 transition-colors"
                whileHover={{ y: -3, scale: 1.1 }}>
                  <Icon className="w-4 h-4" />
                </motion.button>
              )}
            </div>

            <p className="text-xs text-white/70">© 2026 ZenTime. Alle Rechte vorbehalten.</p>
          </div>
          
          <div className="pt-4 flex justify-center">
            <motion.button
              onClick={() => navigate('/admin/login')}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
              whileHover={{ scale: 1.02 }}>
              Admin Login
            </motion.button>
          </div>
        </div>
      </footer>
    </div>);

};

export default LandingPage;