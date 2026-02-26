export enum AppointmentStatus {
  PENDING = 'Anstehend',
  CONFIRMED = 'Bestätigt',
  CANCELLED = 'Storniert',
  COMPLETED = 'Abgeschlossen'
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes
  price: number;
  category: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
}

export interface Salon {
  id: string;
  name: string;
  category: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  priceLevel: '$' | '$$' | '$$$';
  description?: string;
  products?: Product[];
}

export interface Appointment {
  id: string;
  startTime: Date;
  serviceId: string;
  staffId: string;
  customerName: string;
  status: AppointmentStatus;
  isBlock?: boolean;
  blockReason?: string;
  durationOverride?: number;
}

export interface WaitlistEntry {
  id: string;
  customerName: string;
  serviceId: string;
  preferredStaffId?: string;
  requestTime: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  totalVisits: number;
  lastVisit?: Date;
  notes?: string;
}

export type ViewType = 'calendar' | 'services' | 'staff' | 'insights' | 'settings' | 'customers' | 'api' | 'shifts' | 'connect-products' | 'kassenbuch' | 'zbon';
export type UserRole = 'salon' | 'customer' | 'salon_registration' | 'admin' | null;

export interface ConnectProduct {
  id: string;
  user_id: string;
  stripe_product_id: string;
  stripe_price_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}