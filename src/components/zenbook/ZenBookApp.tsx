import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CalendarClock,
  Users, 
  Briefcase, 
  PieChart, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search as SearchIcon, 
  ChevronDown, 
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  Radio,
  Contact2,
  PanelLeftClose,
  PanelLeftOpen,
  Wand2,
  Loader2,
  Key,
  AlertTriangle,
  ShoppingBag,
  Receipt,
  Euro,
  Store
} from 'lucide-react';
import { 
  format, 
  isSameMonth, 
  isSameDay, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  startOfDay,
  parseISO,
  addMonths,
  subMonths
} from 'date-fns';
import { de } from 'date-fns/locale';
import { ViewType, Appointment, AppointmentStatus, Staff, Service, UserRole } from '@/types';
import { 
  LandingPage,
  ServiceManagement, 
  StaffManagement, 
  CustomerManagement, 
  Insights, 
  Settings as SettingsComponent, 
  CustomerPortal, 
  SalonRegistration 
} from '@/components/zenbook';
import { AdminDashboard } from '@/components/zenbook/AdminDashboard';
import ApiSettings from '@/components/zenbook/ApiSettings';
import Shifts from '@/pages/portal/Shifts';
import StaffCalendarView from '@/components/zenbook/StaffCalendarView';
import Logo from '@/components/zenbook/Logo';
import ConnectProducts from '@/components/zenbook/ConnectProducts';
import KassenbuchView from '@/components/zenbook/KassenbuchView';
import ZBonView from '@/components/zenbook/ZBonView';
import SalonProfilePage from '@/pages/portal/SalonProfile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffMembers } from '@/hooks/useStaffMembers';
import { useProducts } from '@/hooks/useProducts';
import { useReservations } from '@/hooks/useReservations';
import { useStaffShifts } from '@/hooks/useStaffShifts';
import { useShiftExceptions } from '@/hooks/useShiftExceptions';
import { AuthPage } from '@/components/auth';

const navItems = [
  { id: 'calendar', label: 'Kalender', icon: <CalendarIcon className="w-5 h-5" /> },
  { id: 'shifts', label: 'Dienstplan', icon: <CalendarClock className="w-5 h-5" /> },
  { id: 'customers', label: 'Kunden', icon: <Contact2 className="w-5 h-5" /> },
  { id: 'services', label: 'Services', icon: <Briefcase className="w-5 h-5" /> },
  { id: 'connect-products', label: 'Stripe Produkte', icon: <ShoppingBag className="w-5 h-5" /> },
  { id: 'staff', label: 'Team', icon: <Users className="w-5 h-5" /> },
  { id: 'kassenbuch', label: 'Kassenbuch', icon: <Receipt className="w-5 h-5" /> },
  { id: 'zbon', label: 'Z-Bon', icon: <Euro className="w-5 h-5" /> },
  { id: 'insights', label: 'KI Insights', icon: <PieChart className="w-5 h-5" /> },
  { id: 'api', label: 'API', icon: <Key className="w-5 h-5" /> },
  { id: 'salon-profile', label: 'Profil', icon: <Store className="w-5 h-5" /> },
  { id: 'settings', label: 'Einstellungen', icon: <SettingsIcon className="w-5 h-5" /> },
];

const ZenBookApp: React.FC = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const isAuthenticated = !!user;
  
  // Supabase hooks for data
  const { staffMembers: supabaseStaff, isLoading: staffLoading, createStaffMember, deleteStaffMember } = useStaffMembers();
  const { products: supabaseProducts, loading: productsLoading, createProduct } = useProducts();
  const { reservations: supabaseReservations, loading: reservationsLoading, createReservation, updateReservation, deleteReservation: deleteSupabaseReservation } = useReservations();
  const { shifts, isLoading: shiftsLoading } = useStaffShifts();
  const { exceptions, isLoading: exceptionsLoading } = useShiftExceptions();
  
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [apiActivity, setApiActivity] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean | null>(null);

  // Check published status
  useEffect(() => {
    const checkPublished = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('customers')
        .select('published')
        .eq('id', user.id)
        .single();
      setIsPublished((data as any)?.published ?? false);
    };
    if (isAuthenticated) checkPublished();
  }, [user, isAuthenticated]);

  // Convert Supabase data to app format
  const staffMembers: Staff[] = useMemo(() => 
    supabaseStaff.map(s => ({
      id: s.id,
      name: s.name,
      role: 'Mitarbeiter',
      avatar: s.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${s.name}`,
      color: s.color
    })), [supabaseStaff]);

  const services: Service[] = useMemo(() => 
    supabaseProducts.map(p => ({
      id: p.id,
      name: p.name,
      duration: p.duration_minutes,
      price: Number(p.price),
      category: p.category
    })), [supabaseProducts]);

  const appointments: Appointment[] = useMemo(() => 
    supabaseReservations.map(r => ({
      id: r.id,
      startTime: parseISO(`${r.date}T${r.time}`),
      serviceId: r.product_id || '',
      staffId: r.staff_member_id || '',
      customerName: r.customer_name,
      status: r.status === 'confirmed' ? AppointmentStatus.CONFIRMED : 
              r.status === 'cancelled' ? AppointmentStatus.CANCELLED :
              r.status === 'completed' ? AppointmentStatus.COMPLETED : AppointmentStatus.PENDING,
      isBlock: false
    })), [supabaseReservations]);

  // Auto-set userRole when authenticated
  useEffect(() => {
    if (isAuthenticated && !userRole) {
      setUserRole('salon');
    }
  }, [isAuthenticated, userRole]);


  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { locale: de }),
    end: endOfWeek(endOfMonth(currentMonth), { locale: de })
  });

  const handleIncomingWebhook = async (payload: any) => {
    setApiActivity(true);
    const matchedService = services.find(s => s.name.toLowerCase().includes(payload.serviceName.toLowerCase())) || services[0];
    const matchedStaff = staffMembers.find(s => s.name.toLowerCase().includes(payload.staffName.toLowerCase())) || staffMembers[0];
    
    if (!matchedService || !matchedStaff) return;
    
    try {
      const startTime = parseISO(payload.startTime);
      await createReservation({
        customer_name: payload.customerName,
        customer_phone: null,
        customer_email: null,
        date: format(startTime, 'yyyy-MM-dd'),
        time: format(startTime, 'HH:mm:ss'),
        end_time: null,
        staff_member_id: matchedStaff.id,
        product_id: matchedService.id,
        status: 'confirmed',
        source: 'voice_agent',
        notes: null
      });
      setSelectedDate(startTime);
      setCurrentView('calendar');
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
    setTimeout(() => setApiActivity(false), 3000);
  };


  const handleLogout = async () => {
    setUserRole(null);
    setCurrentView('calendar');
    // signOut clears local session and redirects to /
    await signOut();
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // Show landing page if not authenticated and no role selected
  if (!isAuthenticated && !userRole) {
    return (
      <LandingPage 
        onLogin={(role) => {
          if (role === 'admin') {
            setUserRole('admin');
          } else if (role === 'customer') {
            // Customer login → go to auth, then redirect to portal
            setUserRole('salon');
          } else {
            setUserRole(role);
          }
        }}
        onStartRegistration={() => setUserRole('salon')}
      />
    );
  }

  // Show auth page for salon/admin login
  if (!isAuthenticated && (userRole === 'salon' || userRole === 'admin')) {
    return <AuthPage />;
  }

  // Login screens for customer/registration
  if (userRole === 'salon_registration') {
    return (
      <SalonRegistration 
        onComplete={() => { 
          setUserRole('salon'); 
        }} 
        onCancel={() => setUserRole(null)} 
      />
    );
  }
  
  if (userRole === 'customer') {
    return <CustomerPortal onLogout={() => setUserRole(null)} />;
  }

  // Admin Dashboard - check if user is admin (specific email)
  if (userRole === 'admin' && isAuthenticated) {
    const isAdminUser = user?.email === 'stevenpechtl2002@gmail.com';
    if (!isAdminUser) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Zugriff verweigert</h1>
            <p className="text-muted-foreground mb-6">Du hast keine Admin-Berechtigung.</p>
            <button 
              onClick={handleLogout}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold"
            >
              Zurück
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Logo variant="admin" onClick={() => { handleLogout(); setUserRole(null); }} />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Logout</span>
            </button>
          </div>
          <AdminDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden p-4 gap-6 relative">
      {/* 3D Floating Sidebar */}
      <aside className={`fixed lg:relative h-[calc(100vh-2rem)] z-50 flex flex-col gap-0 shrink-0 floating-3d rounded-2xl p-3 pt-2 transition-all duration-500 ease-in-out ${isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full lg:w-20 lg:translate-x-0 lg:p-3 overflow-hidden'}`}>
        <div className={`flex items-center gap-3 mb-0 transition-opacity duration-300 ${!isSidebarOpen && 'lg:opacity-0'}`}>
          <Logo onClick={() => { handleLogout(); setUserRole(null); }} showText={isSidebarOpen} />
        </div>

        {/* Small Calendar - Now at top above navigation */}
        <div className={`mb-1 transition-all duration-300 ${!isSidebarOpen && 'lg:scale-0 lg:h-0 overflow-hidden'}`}>
           <div className="flex items-center justify-between px-2 mb-3">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(currentMonth, 'MMMM yyyy', { locale: de })}</span>
             <div className="flex gap-1">
               <ChevronLeft className="w-3 h-3 text-slate-300 cursor-pointer hover:text-slate-600" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} />
               <ChevronRight className="w-3 h-3 text-slate-300 cursor-pointer hover:text-slate-600" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} />
             </div>
           </div>
           <div className="grid grid-cols-7 gap-1">
             {calendarDays.map((day, idx) => (
               <div key={idx} className="flex items-center justify-center h-6 w-full relative">
                 <span className={`text-[10px] font-bold z-10 ${!isSameMonth(day, currentMonth) ? 'text-slate-200' : isSameDay(day, new Date()) ? 'text-white' : 'text-slate-500'}`}>
                   {format(day, 'd')}
                 </span>
                 {isSameDay(day, new Date()) && <div className="absolute inset-0 m-auto w-5 h-5 bg-indigo-600 rounded-full"></div>}
               </div>
             ))}
           </div>
        </div>

        {/* Scrollable container for everything below calendar */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-2">
          {/* Navigation Menu */}
          <nav className="flex flex-col gap-2 px-0 py-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as ViewType)}
                className={`flex items-center gap-3 px-5 py-4 rounded-xl transition-all font-bold text-sm group relative shrink-0 ${
                  currentView === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
                }`}
              >
                <span className="shrink-0">{React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-5 h-5' })}</span>
                <span className={`transition-all duration-300 ${!isSidebarOpen && 'lg:opacity-0 lg:w-0 overflow-hidden'}`}>{item.label}</span>
                {!isSidebarOpen && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            ))}
          </nav>

          <div className={`transition-all duration-300 ${!isSidebarOpen && 'lg:scale-0 lg:h-0 overflow-hidden'}`}>
            <div className={`p-4 rounded-xl bg-muted border border-border text-muted-foreground mb-4 transition-all duration-700 ${apiActivity ? 'bg-emerald-50 border-emerald-100' : ''}`}>
              <div className="flex items-center gap-3">
                <Radio className={`w-4 h-4 ${apiActivity ? 'animate-pulse text-emerald-500' : 'text-slate-400'}`} />
                <div className="flex-1 overflow-hidden">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">API Gateway</p>
                  <p className="text-xs font-bold text-slate-600 truncate">{apiActivity ? 'Requesting...' : 'Listening Mode'}</p>
                </div>
              </div>
            </div>

            <div className="relative mb-4">
               <button 
                onClick={() => setShowAddDropdown(!showAddDropdown)}
                className="w-full flex items-center justify-between px-6 py-5 bg-foreground text-background rounded-xl font-black shadow-xl hover:shadow-2xl transition-all active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5" />
                  <span className="text-sm">Neu</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAddDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showAddDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-3 bg-card rounded-2xl shadow-2xl border border-border z-[60] py-2 animate-in slide-in-from-bottom-2">
                  <button onClick={() => { setCurrentView('calendar'); setShowAddDropdown(false); }} className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold text-foreground hover:bg-muted">
                    <CalendarIcon className="w-4 h-4" /> Termin (im Kalender)
                  </button>
                  <button onClick={() => setShowAddDropdown(false)} className="w-full flex items-center gap-3 px-5 py-4 text-xs font-bold text-primary hover:bg-primary/5">
                    <Sparkles className="w-4 h-4" /> KI-Buchung
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 p-4 text-muted-foreground hover:text-destructive transition-colors text-left w-full border-t border-border pt-6 ${!isSidebarOpen && 'lg:justify-center lg:px-0'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className={`text-xs font-black uppercase tracking-widest transition-all ${!isSidebarOpen && 'hidden'}`}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className={`flex-1 flex flex-col min-w-0 floating-3d rounded-2xl overflow-hidden rim-light transition-all duration-500`}>
        <header className="h-20 flex items-center justify-between px-6 lg:px-10 border-b border-slate-50 shrink-0 bg-white">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-xl border border-slate-100"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {currentView === 'calendar' ? 'Kalender' : navItems.find(i => i.id === currentView)?.label}
            </h2>
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-full text-[10px] font-black text-emerald-600 border border-emerald-100 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
               <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input type="text" placeholder="Suche..." className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white transition-all w-48" />
            </div>
            <button className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all border border-slate-100"><Wand2 className="w-5 h-5" /></button>
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm shrink-0">
               <img src="https://picsum.photos/seed/admin/100" alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className={`flex-1 overflow-auto relative no-scrollbar bg-white ${currentView === 'calendar' ? 'p-0' : 'p-10'}`}>
          {/* Unpublished Banner */}
          {isPublished === false && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-sm font-bold text-amber-800">Dein Profil ist noch nicht veröffentlicht – Onboarding abschließen</p>
              </div>
              <button
                onClick={() => setUserRole('salon_registration')}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl font-black text-xs shrink-0 hover:bg-primary/90 transition-all"
              >
                Onboarding
              </button>
            </div>
          )}
          {currentView === 'calendar' && (
            <StaffCalendarView
              reservations={supabaseReservations}
              staffMembers={supabaseStaff}
              shifts={shifts}
              exceptions={exceptions}
              products={supabaseProducts}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onCreateReservation={createReservation}
              onUpdateReservation={updateReservation}
              onDeleteReservation={deleteSupabaseReservation}
            />
          )}
          {currentView === 'customers' && <CustomerManagement />}
          {currentView === 'services' && <ServiceManagement services={services} />}
          {currentView === 'staff' && <StaffManagement staff={staffMembers} onAddStaff={async (s) => { 
            try {
              await createStaffMember({ name: s.name, color: s.color });
            } catch (error) {
              console.error('Error creating staff member:', error);
            }
          }} />}
          {currentView === 'insights' && <Insights appointments={appointments} services={services} staff={staffMembers} />}
          {currentView === 'api' && <ApiSettings />}
          {currentView === 'shifts' && <Shifts />}
          {currentView === 'connect-products' && <ConnectProducts />}
          {currentView === 'kassenbuch' && <KassenbuchView />}
          {currentView === 'zbon' && <ZBonView />}
          {currentView === 'salon-profile' && <SalonProfilePage />}
          {currentView === 'settings' && <SettingsComponent onSimulateIncoming={handleIncomingWebhook} />}
        </div>
      </main>

      {/* Overlay for Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
        ></div>
      )}

    </div>
  );
};

export default ZenBookApp;
