import { Salon, Appointment, Staff, Service } from '@/types';
import { INITIAL_APPOINTMENTS, SERVICES, STAFF, SALONS } from '@/constants';

const KEYS = {
  SALONS: 'zenbook_db_salons',
  APPOINTMENTS: 'zenbook_db_appointments',
  CUSTOMERS: 'zenbook_db_customers',
  STAFF: 'zenbook_db_staff',
  SERVICES: 'zenbook_db_services'
};

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastVisit?: string;
  totalSpent: number;
  bookingsCount: number;
}

export const storageService = {
  init: () => {
    if (!localStorage.getItem(KEYS.SALONS)) localStorage.setItem(KEYS.SALONS, JSON.stringify(SALONS));
    if (!localStorage.getItem(KEYS.SERVICES)) localStorage.setItem(KEYS.SERVICES, JSON.stringify(SERVICES));
    if (!localStorage.getItem(KEYS.STAFF)) localStorage.setItem(KEYS.STAFF, JSON.stringify(STAFF));
    if (!localStorage.getItem(KEYS.APPOINTMENTS)) localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(INITIAL_APPOINTMENTS));
    if (!localStorage.getItem(KEYS.CUSTOMERS)) {
      const initialCustomers: Customer[] = [
        { id: 'c1', name: 'Anna Schmidt', email: 'anna@example.de', phone: '0176 123456', totalSpent: 450, bookingsCount: 5 },
        { id: 'c2', name: 'Thomas Weber', email: 'thomas@web.de', phone: '0151 987654', totalSpent: 120, bookingsCount: 2 }
      ];
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
    }
  },

  getSalons: (): Salon[] => JSON.parse(localStorage.getItem(KEYS.SALONS) || '[]'),
  saveSalon: (salon: Salon) => {
    const salons = storageService.getSalons();
    localStorage.setItem(KEYS.SALONS, JSON.stringify([...salons, salon]));
  },

  getAppointments: (): Appointment[] => {
    const data = JSON.parse(localStorage.getItem(KEYS.APPOINTMENTS) || '[]');
    return data.map((a: any) => ({ ...a, startTime: new Date(a.startTime) }));
  },
  saveAppointment: (app: Appointment) => {
    const apps = storageService.getAppointments();
    const exists = apps.findIndex(a => a.id === app.id);
    if (exists > -1) apps[exists] = app;
    else apps.push(app);
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(apps));
    storageService.updateCustomerStats(app.customerName, 50);
  },
  deleteAppointment: (id: string) => {
    const apps = storageService.getAppointments().filter(a => a.id !== id);
    localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(apps));
  },

  getCustomers: (): Customer[] => JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]'),
  updateCustomerStats: (name: string, price: number) => {
    const customers = storageService.getCustomers();
    const idx = customers.findIndex(c => c.name === name);
    if (idx > -1) {
      customers[idx].bookingsCount += 1;
      customers[idx].totalSpent += price;
      customers[idx].lastVisit = new Date().toISOString();
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
    } else {
      const newCust: Customer = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        email: `${name.toLowerCase().replace(' ', '.')}@guest.de`,
        phone: 'Nicht hinterlegt',
        totalSpent: price,
        bookingsCount: 1,
        lastVisit: new Date().toISOString()
      };
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify([...customers, newCust]));
    }
  },

  getStaff: (): Staff[] => JSON.parse(localStorage.getItem(KEYS.STAFF) || '[]'),
  saveStaff: (staff: Staff) => {
    const staffList = storageService.getStaff();
    const existingIndex = staffList.findIndex(s => s.id === staff.id);
    if (existingIndex >= 0) {
      staffList[existingIndex] = staff;
    } else {
      staffList.push(staff);
    }
    localStorage.setItem(KEYS.STAFF, JSON.stringify(staffList));
  },
  getServices: (): Service[] => JSON.parse(localStorage.getItem(KEYS.SERVICES) || '[]'),
  
  getStats: () => ({
    salons: storageService.getSalons().length,
    customers: storageService.getCustomers().length,
    appointments: storageService.getAppointments().length,
    storageUsed: (JSON.stringify(localStorage).length / 1024).toFixed(2) + ' KB'
  })
};