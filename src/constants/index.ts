import { Service, Staff, Appointment, AppointmentStatus, Salon, Customer } from '@/types';

export const SERVICES: Service[] = [
  { id: '1', name: 'Haarschnitt & Styling', duration: 60, price: 45, category: 'Haare' },
  { id: '2', name: 'Maniküre Classic', duration: 30, price: 25, category: 'Nägel' },
  { id: '3', name: 'Gesichtsbehandlung Relax', duration: 45, price: 55, category: 'Kosmetik' },
  { id: '4', name: 'Ganzkörpermassage', duration: 90, price: 85, category: 'Wellness' },
];

export const SALONS: Salon[] = [
  { id: 'sl1', name: 'Aura Hair & Soul', category: 'Haare', location: 'Berlin', rating: 4.9, reviews: 128, image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400', priceLevel: '$$' },
  { id: 'sl2', name: 'Pure Wellness Spa', category: 'Wellness', location: 'München', rating: 4.7, reviews: 85, image: 'https://images.unsplash.com/photo-1544161515-4ae6ce6ea858?auto=format&fit=crop&q=80&w=400', priceLevel: '$$$' },
  { id: 'sl3', name: 'Nail Art Studio', category: 'Nägel', location: 'Hamburg', rating: 4.5, reviews: 210, image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=400', priceLevel: '$' },
  { id: 'sl4', name: 'The Grooming Room', category: 'Haare', location: 'Berlin', rating: 4.8, reviews: 56, image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400', priceLevel: '$$' },
  { id: 'sl5', name: 'Silk Skin Cosmetics', category: 'Kosmetik', location: 'Köln', rating: 4.6, reviews: 92, image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=400', priceLevel: '$$$' },
  { id: 'sl6', name: 'Zen Nails', category: 'Nägel', location: 'München', rating: 4.9, reviews: 340, image: 'https://images.unsplash.com/photo-1604654894610-df490668979d?auto=format&fit=crop&q=80&w=400', priceLevel: '$' },
];

export const STAFF: Staff[] = [
  { id: 's1', name: 'Sarah M.', role: 'Senior Stylist', avatar: 'https://picsum.photos/seed/sarah/200', color: 'bg-rose-100 border-rose-200 text-rose-700' },
  { id: 's2', name: 'Marco K.', role: 'Massage Therapeut', avatar: 'https://picsum.photos/seed/marco/200', color: 'bg-emerald-100 border-emerald-200 text-emerald-700' },
  { id: 's3', name: 'Elena R.', role: 'Kosmetikerin', avatar: 'https://picsum.photos/seed/elena/200', color: 'bg-indigo-100 border-indigo-200 text-indigo-700' },
];

export const CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Anna Schmidt', email: 'anna.schmidt@email.de', phone: '+49 171 1234567', totalVisits: 12, avatar: 'https://picsum.photos/seed/anna/200' },
  { id: 'c2', name: 'Thomas Weber', email: 'thomas.weber@email.de', phone: '+49 172 2345678', totalVisits: 5, avatar: 'https://picsum.photos/seed/thomas/200' },
  { id: 'c3', name: 'Julia Müller', email: 'julia.mueller@email.de', phone: '+49 173 3456789', totalVisits: 8, avatar: 'https://picsum.photos/seed/julia/200' },
];

const today = new Date();
today.setHours(9, 0, 0, 0);

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    startTime: new Date(today.getTime() + 1000 * 60 * 60 * 1), // 10:00
    serviceId: '1',
    staffId: 's1',
    customerName: 'Anna Schmidt',
    status: AppointmentStatus.CONFIRMED
  },
  {
    id: 'a2',
    startTime: new Date(today.getTime() + 1000 * 60 * 60 * 3), // 12:00
    serviceId: '2',
    staffId: 's3',
    customerName: 'Thomas Weber',
    status: AppointmentStatus.PENDING
  }
];

export const BUSINESS_HOURS = {
  start: 8,
  end: 20
};