import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Storefront from "./pages/Storefront";
import CheckoutSuccess from "./pages/CheckoutSuccess";

const SalonDetail = lazy(() => import("./pages/SalonDetail"));
const CustomerAuth = lazy(() => import("./pages/CustomerAuth"));
const CustomerProfile = lazy(() => import("./pages/CustomerProfile"));

const PortalAuth = lazy(() => import("./pages/portal/Auth"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const SalesDashboard = lazy(() => import("./pages/sales/SalesDashboard"));
const Dashboard = lazy(() => import("./pages/portal/Dashboard"));
const Calendar = lazy(() => import("./pages/portal/Calendar"));
const Reservations = lazy(() => import("./pages/portal/Reservations"));
const Customers = lazy(() => import("./pages/portal/Customers"));
const Staff = lazy(() => import("./pages/portal/Staff"));
const Shifts = lazy(() => import("./pages/portal/Shifts"));
const Products = lazy(() => import("./pages/portal/Products"));
const Documents = lazy(() => import("./pages/portal/Documents"));
const Analytics = lazy(() => import("./pages/portal/Analytics"));
const Notifications = lazy(() => import("./pages/portal/Notifications"));
const Profile = lazy(() => import("./pages/portal/Profile"));
const Support = lazy(() => import("./pages/portal/Support"));
const Subscriptions = lazy(() => import("./pages/portal/Subscriptions"));
const ApiSettings = lazy(() => import("./pages/portal/ApiSettings"));
const VoiceAgent = lazy(() => import("./pages/portal/VoiceAgent"));
const Sales = lazy(() => import("./pages/portal/Sales"));
const Contact = lazy(() => import("./pages/Contact"));
const Impressum = lazy(() => import("./pages/Impressum"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const AGB = lazy(() => import("./pages/AGB"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/storefront" element={<Storefront />} />
              <Route path="/login" element={<CustomerAuth />} />
              <Route path="/storefront/profile" element={<CustomerProfile />} />
              <Route path="/storefront/:salonId" element={<SalonDetail />} />
              <Route path="/success" element={<CheckoutSuccess />} />
              <Route path="/portal/auth" element={<PortalAuth />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/sales" element={<SalesDashboard />} />
              <Route path="/portal" element={<Dashboard />} />
              <Route path="/portal/calendar" element={<Calendar />} />
              <Route path="/portal/reservations" element={<Reservations />} />
              <Route path="/portal/customers" element={<Customers />} />
              <Route path="/portal/staff" element={<Staff />} />
              <Route path="/portal/shifts" element={<Shifts />} />
              <Route path="/portal/products" element={<Products />} />
              <Route path="/portal/documents" element={<Documents />} />
              <Route path="/portal/analytics" element={<Analytics />} />
              <Route path="/portal/notifications" element={<Notifications />} />
              <Route path="/portal/profile" element={<Profile />} />
              <Route path="/portal/support" element={<Support />} />
              <Route path="/portal/subscriptions" element={<Subscriptions />} />
              <Route path="/portal/api-settings" element={<ApiSettings />} />
              <Route path="/portal/voice-agent" element={<VoiceAgent />} />
              <Route path="/portal/sales" element={<Sales />} />
              <Route path="/kontakt" element={<Contact />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
              <Route path="/agb" element={<AGB />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
