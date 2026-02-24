import React, { useState, useMemo } from 'react';
import { SALONS, SERVICES } from '@/constants';
import { 
  LogOut, 
  Star, 
  Search, 
  MapPin, 
  Filter, 
  ArrowRight,
  SlidersHorizontal,
  Navigation,
  Plus
} from 'lucide-react';
import { Salon } from '@/types';

interface Props {
  onLogout: () => void;
}

const CustomerPortal: React.FC<Props> = ({ onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alle');
  const [selectedLocation, setSelectedLocation] = useState('Alle Standorte');
  const [selectedPrice, setSelectedPrice] = useState('Alle Preise');
  const [viewedSalon, setViewedSalon] = useState<Salon | null>(null);

  const categories = ['Alle', 'Haare', 'Nägel', 'Kosmetik', 'Wellness'];
  const locations = ['Alle Standorte', 'Berlin', 'München', 'Hamburg', 'Köln'];
  const prices = ['Alle Preise', '$', '$$', '$$$'];

  const filteredSalons = useMemo(() => {
    return SALONS.filter(salon => {
      const matchesSearch = salon.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          salon.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'Alle' || salon.category === selectedCategory;
      const matchesLocation = selectedLocation === 'Alle Standorte' || salon.location === selectedLocation;
      const matchesPrice = selectedPrice === 'Alle Preise' || salon.priceLevel === selectedPrice;
      
      return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
    });
  }, [searchQuery, selectedCategory, selectedLocation, selectedPrice]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg">
              Z
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-foreground">
              ZenBook <span className="text-primary">Relax</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <button className="hidden md:flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-primary transition-colors">
              <Navigation className="w-4 h-4" /> Standorte
            </button>
            <div className="h-6 w-px bg-border"></div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-muted text-muted-foreground font-bold hover:text-destructive hover:bg-destructive/10 transition-all border border-transparent"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {viewedSalon ? (
          /* Salon Detail View */
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => setViewedSalon(null)}
              className="mb-8 flex items-center gap-2 text-sm font-black text-muted-foreground hover:text-primary transition-all"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Zurück zur Suche
            </button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-12">
                <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                  <img src={viewedSalon.image} className="w-full h-full object-cover" alt={viewedSalon.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent"></div>
                  <div className="absolute bottom-10 left-10 text-primary-foreground">
                    <span className="px-4 py-1.5 bg-primary rounded-full text-[10px] font-black uppercase tracking-widest">{viewedSalon.category}</span>
                    <h2 className="text-5xl font-black mt-4">{viewedSalon.name}</h2>
                    <div className="flex items-center gap-6 mt-4 opacity-90 font-bold">
                       <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {viewedSalon.location}</div>
                       <div className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {viewedSalon.rating} ({viewedSalon.reviews} Bewertungen)</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-3xl font-black text-foreground tracking-tight">Verfügbare Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SERVICES.map(service => (
                      <div key={service.id} className="bg-card p-8 rounded-2xl border border-border shadow-xl flex justify-between items-center group hover:border-primary/50 transition-all">
                        <div>
                          <h4 className="text-xl font-black text-foreground">{service.name}</h4>
                          <div className="flex items-center gap-4 text-muted-foreground font-bold text-sm mt-1">
                            <span>{service.duration} min</span>
                            <span className="text-foreground">{service.price} €</span>
                          </div>
                        </div>
                        <button className="w-12 h-12 bg-foreground text-background rounded-xl flex items-center justify-center group-hover:bg-primary transition-colors shadow-lg">
                          <Plus className="w-6 h-6" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                 <div className="bg-card p-8 rounded-2xl shadow-2xl border border-border">
                    <h4 className="text-xl font-black text-foreground mb-6">Öffnungszeiten</h4>
                    <div className="space-y-4">
                      {['Mo - Fr', 'Sa', 'So'].map((day, i) => (
                        <div key={day} className="flex justify-between text-sm font-bold">
                          <span className="text-muted-foreground">{day}</span>
                          <span className="text-foreground">{i === 2 ? 'Geschlossen' : '09:00 - 20:00'}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-10 py-5 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                      Termin anfragen
                    </button>
                 </div>
              </div>
            </div>
          </div>
        ) : (
          /* Search & Marketplace Main View */
          <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center space-y-8 max-w-4xl mx-auto">
              <h2 className="text-7xl font-black text-foreground tracking-tight leading-[1.05]">
                Finde deinen <br />
                <span className="gradient-text">perfekten Moment.</span>
              </h2>
              
              {/* Main Search Bar */}
              <div className="relative group max-w-2xl mx-auto mt-12">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
                <div className="relative flex items-center bg-card rounded-2xl p-3 shadow-2xl border border-border">
                  <div className="pl-6 pr-4">
                    <Search className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Salon oder Service suchen..."
                    className="flex-1 py-4 bg-transparent outline-none font-bold text-lg text-foreground placeholder:text-muted-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button className="h-14 px-10 bg-foreground text-background rounded-xl font-black hover:bg-primary transition-all">
                    Suchen
                  </button>
                </div>
              </div>

              {/* Advanced Filter Bar */}
              <div className="flex flex-wrap justify-center items-center gap-4 mt-12">
                <div className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl shadow-sm">
                   <Filter className="w-4 h-4 text-primary" />
                   <select 
                    className="bg-transparent outline-none font-bold text-sm text-foreground cursor-pointer"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                   >
                     {categories.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>

                <div className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl shadow-sm">
                   <MapPin className="w-4 h-4 text-primary" />
                   <select 
                    className="bg-transparent outline-none font-bold text-sm text-foreground cursor-pointer"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                   >
                     {locations.map(l => <option key={l} value={l}>{l}</option>)}
                   </select>
                </div>

                <div className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl shadow-sm">
                   <SlidersHorizontal className="w-4 h-4 text-primary" />
                   <select 
                    className="bg-transparent outline-none font-bold text-sm text-foreground cursor-pointer"
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                   >
                     {prices.map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-foreground tracking-tight">
                  {filteredSalons.length} Salons gefunden
                </h3>
                <div className="flex gap-2">
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Sortieren nach: Relevanz</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredSalons.map(salon => (
                  <div 
                    key={salon.id} 
                    onClick={() => setViewedSalon(salon)}
                    className="bg-card rounded-2xl overflow-hidden border border-border shadow-2xl group cursor-pointer hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.12)] transition-all duration-500"
                    style={{ perspective: '1000px' }}
                  >
                    <div className="h-56 relative overflow-hidden">
                      <img 
                        src={salon.image} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={salon.name} 
                      />
                      <div className="absolute top-6 right-6 px-4 py-2 bg-card/90 backdrop-blur-md rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary shadow-xl">
                        {salon.category}
                      </div>
                      <div className="absolute bottom-6 left-6 flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= salon.priceLevel.length ? 'bg-primary-foreground' : 'bg-primary-foreground/30'}`}></div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-8 space-y-4">
                      <div className="flex justify-between items-start">
                        <h4 className="text-2xl font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{salon.name}</h4>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-black text-foreground">{salon.rating}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-sm">
                        <MapPin className="w-4 h-4" />
                        {salon.location}
                      </div>

                      <div className="pt-4 flex items-center justify-between">
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{salon.reviews} Bewertungen</span>
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSalons.length === 0 && (
                <div className="text-center py-32 space-y-6">
                  <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h4 className="text-2xl font-black text-foreground">Keine Ergebnisse gefunden</h4>
                  <p className="text-muted-foreground font-bold max-w-sm mx-auto">Versuche deine Filter anzupassen oder suche nach einem anderen Ort.</p>
                  <button 
                    onClick={() => { setSelectedCategory('Alle'); setSelectedLocation('Alle Standorte'); setSearchQuery(''); }}
                    className="text-primary font-black text-sm uppercase tracking-widest border-b-2 border-primary"
                  >
                    Alle Filter zurücksetzen
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto mt-32 py-12 px-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-8">
        <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">© 2026 ZenBook Relax Marketplace</p>
        <div className="flex gap-10">
          {['Datenschutz', 'Impressum', 'Support'].map(link => (
            <a key={link} href="#" className="text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">{link}</a>
          ))}
        </div>
      </footer>
    </div>
  );
};

export default CustomerPortal;