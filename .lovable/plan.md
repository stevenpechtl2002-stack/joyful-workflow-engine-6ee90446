

# Kompletter Frontend-Transfer: ZenBook auf NextGenAI

## Zusammenfassung

Alle Quelldateien aus dem ZenBook-Projekt wurden vollstaendig gelesen und sind bereit fuer den Transfer. Das gesamte Frontend wird 1:1 uebertragen, waehrend alle Backend-Funktionen (Supabase, Edge Functions, n8n) unveraendert bleiben.

## Was erstellt wird

### Infrastruktur-Dateien (3 Dateien)
- `src/types/index.ts` - ViewType, UserRole, Appointment, Service, Staff, etc.
- `src/constants/index.ts` - SERVICES, SALONS, STAFF, CUSTOMERS, BUSINESS_HOURS
- `src/services/storageService.ts` - LocalStorage-Datendienst

### Hooks (11 Dateien - neue + ersetzte)
- `src/hooks/useAuth.ts` - Auth Hook (NEU)
- `src/hooks/useReservations.ts` - Reservierungen mit Realtime (NEU)
- `src/hooks/useContacts.ts` - Kontakte CRUD (NEU)
- `src/hooks/useCustomerApiKey.ts` - Kunden-API-Key (NEU)
- `src/hooks/useApiKeys.ts` - API-Key Management (NEU)
- `src/hooks/useNotifications.ts` - Benachrichtigungen (NEU)
- `src/hooks/useStaffMembers.ts` - ERSETZT (nutzt useAuth)
- `src/hooks/useProducts.ts` - ERSETZT (nutzt useAuth)
- `src/hooks/useStaffShifts.ts` - ERSETZT (nutzt useAuth)
- `src/hooks/useShiftExceptions.ts` - ERSETZT (nutzt useAuth)
- `src/hooks/useBusinessSettings.ts` - ERSETZT (nutzt useAuth)

### Auth-Komponenten (5 Dateien)
- `src/components/auth/AuthProvider.tsx`
- `src/components/auth/AuthPage.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SignupForm.tsx`
- `src/components/auth/index.ts`

### ZenBook-Komponenten (18 Dateien)
- `src/components/zenbook/ZenBookApp.tsx` - Haupt-App (425 Zeilen)
- `src/components/zenbook/LandingPage.tsx` - Landing Page (665 Zeilen)
- `src/components/zenbook/Logo.tsx`
- `src/components/zenbook/Login.tsx`
- `src/components/zenbook/StaffCalendarView.tsx` - Staff-Kalender (632 Zeilen)
- `src/components/zenbook/CalendarView.tsx`
- `src/components/zenbook/ReservationForm.tsx`
- `src/components/zenbook/ServiceManagement.tsx`
- `src/components/zenbook/StaffManagement.tsx`
- `src/components/zenbook/CustomerManagement.tsx`
- `src/components/zenbook/Insights.tsx`
- `src/components/zenbook/Settings.tsx`
- `src/components/zenbook/CustomerPortal.tsx`
- `src/components/zenbook/SalonRegistration.tsx` (500 Zeilen)
- `src/components/zenbook/AdminDashboard.tsx`
- `src/components/zenbook/ApiSettings.tsx`
- `src/components/zenbook/ApiKeyManagement.tsx`
- `src/components/zenbook/index.ts`

### Geaenderte Dateien (4 Dateien)
- `src/App.tsx` - Vereinfacht auf 2 Routen, AuthProvider aus @/components/auth
- `src/pages/Index.tsx` - Nur ZenBookApp rendern
- `src/index.css` - ZenBook CSS (Plus Jakarta Sans, Indigo/Pink)
- `tailwind.config.ts` - Standard Tailwind Config

## Datenbank-Migration

Eine `api_keys` Tabelle wird erstellt, da der AdminDashboard und useApiKeys Hook diese referenzieren. Spalten: id, user_id, key_prefix, name, is_active, last_used_at, created_at.

## Was NICHT angefasst wird

- Alle Edge Functions (`supabase/functions/*`)
- Supabase Client und Types
- UI Components (`src/components/ui/*`)
- `.env`, `supabase/config.toml`
- Datenbank-Trigger und bestehende Tabellen

## Kalender-Funktionen die 1:1 erhalten bleiben

Der StaffCalendarView nutzt direkt die bestehenden Supabase-Tabellen:
- Reservierungen mit Realtime-Updates
- Staff-Spalten mit Farben/Avataren
- Shift-basierte Arbeitszeitpruefung inkl. Exceptions
- Drag-and-Drop zwischen Mitarbeitern
- Tag/Woche-Ansicht mit konfigurierbarem Intervall
- Termin erstellen/bearbeiten/loeschen mit Produktzuordnung
- Dauer-Autoberechnung basierend auf Produktauswahl

