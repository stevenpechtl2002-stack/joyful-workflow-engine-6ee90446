

# Kompletter Frontend-Transfer: ZenBook auf NextGenAI

## Zusammenfassung

Das gesamte Frontend des ZenBook-Projekts wird 1:1 in dieses Projekt uebertragen. Der Kalender mit allen bestehenden Backend-Funktionen (Supabase-Tabellen, Edge Functions, n8n-Integration, Realtime) bleibt vollstaendig erhalten, da die ZenBook-Hooks die gleichen Supabase-Tabellen verwenden.

## Wichtiger Hinweis: `api_keys` Tabelle

Das ZenBook-Projekt verwendet eine `api_keys` Tabelle (in `useApiKeys.ts`, `AdminDashboard.tsx`, `ApiKeyManagement.tsx`), die im aktuellen Projekt **nicht existiert**. Es gibt nur `customer_api_keys`. Die betroffenen Hooks werden so angepasst, dass sie mit `customer_api_keys` arbeiten, oder die `api_keys`-Tabelle wird per Migration angelegt.

## Architektur-Aenderung

- **Aktuell**: Multi-Page React Router mit ca. 20 Routen (`/portal/calendar`, `/portal/staff`, etc.) und Portal-Sidebar
- **Neu**: Single-Page App mit internem State-Management (`currentView`), alles laeuft auf `/`

## Dateien die erstellt werden (1:1 aus ZenBook kopiert)

### Neue Verzeichnisse und Dateien

1. `src/types/index.ts` - TypeScript-Typen (ViewType, UserRole, Appointment, Service, Staff, etc.)
2. `src/constants/index.ts` - Demo-Konstanten (SERVICES, SALONS, STAFF, CUSTOMERS, BUSINESS_HOURS)
3. `src/services/storageService.ts` - LocalStorage-basierter Datendienst fuer Demo-Daten

### Komponenten (src/components/zenbook/)

4. `ZenBookApp.tsx` - Haupt-App mit Sidebar, Navigation, Kalender-Integration, Supabase-Hooks
5. `LandingPage.tsx` - Landing Page mit Hero, Suchfunktion, Salon-Karten (nutzt framer-motion)
6. `Logo.tsx` - ZenTime Logo-Komponente
7. `StaffCalendarView.tsx` - Staff-Kalender mit Tag/Woche-Ansicht, Drag-and-Drop, Shift-/Exception-Pruefung
8. `CalendarView.tsx` - Einfacherer Kalender (wird von ZenBookApp nicht direkt genutzt, aber exportiert)
9. `ReservationForm.tsx` - Termin-Formular (Erstellen/Bearbeiten) mit Produkt-Dauer-Autoberechnung
10. `ServiceManagement.tsx` - Service-Verwaltung (Supabase products-Tabelle)
11. `StaffManagement.tsx` - Team-Verwaltung (Supabase staff_members-Tabelle)
12. `CustomerManagement.tsx` - Kundenstamm (nutzt useContacts Hook -> contacts-Tabelle)
13. `Insights.tsx` - KI-Insights mit Recharts (Mock-Daten)
14. `Settings.tsx` - Einstellungen mit n8n-Simulator und API-Key-Management
15. `CustomerPortal.tsx` - Kunden-Marktplatz (Demo-Ansicht)
16. `SalonRegistration.tsx` - Salon-Registrierungsassistent (speichert in products + staff_members)
17. `AdminDashboard.tsx` - Admin-Uebersicht (Salons + API Keys)
18. `ApiSettings.tsx` - API-Key Anzeige/Regeneration (nutzt useCustomerApiKey)
19. `ApiKeyManagement.tsx` - API-Key CRUD (nutzt useApiKeys)
20. `Login.tsx` - Login-Screen mit Tabs (Salon/Kunde)
21. `index.ts` - Barrel-Exports

### Auth-Komponenten (src/components/auth/)

22. `AuthProvider.tsx` - Auth Context Provider (wrapping useAuth Hook)
23. `AuthPage.tsx` - Auth-Seite (Login/Signup Toggle mit framer-motion)
24. `LoginForm.tsx` - Login-Formular
25. `SignupForm.tsx` - Registrierung mit optionaler API-Key-Generierung
26. `index.ts` - Barrel-Exports

### Hooks (src/hooks/)

27. `useAuth.ts` - Auth-Hook (ersetzt bestehenden AuthContext)
28. `useReservations.ts` - Reservierungen mit Realtime-Subscription (gleiche `reservations`-Tabelle)
29. `useContacts.ts` - Kontakte CRUD (gleiche `contacts`-Tabelle)
30. `useCustomerApiKey.ts` - Kunden-API-Key (gleiche `customer_api_keys`-Tabelle)
31. `useApiKeys.ts` - API-Key Management (referenziert `api_keys`-Tabelle -- muss angepasst oder Tabelle erstellt werden)
32. `useNotifications.ts` - Benachrichtigungen (gleiche `notifications`-Tabelle)
33. `useStaffMembers.ts` - Ersetzt bestehende Version (nutzt useAuth statt AuthContext)
34. `useProducts.ts` - Ersetzt bestehende Version
35. `useStaffShifts.ts` - Ersetzt bestehende Version
36. `useShiftExceptions.ts` - Ersetzt bestehende Version
37. `useBusinessSettings.ts` - Ersetzt bestehende Version

## Dateien die geaendert werden

### `src/App.tsx`
- Vereinfachen: nur `/` und `*` Route
- AuthProvider aus `@/components/auth` statt `@/contexts/AuthContext`

### `src/pages/Index.tsx`
- Nur noch `<ZenBookApp />` rendern

### `src/index.css`
- Komplett durch ZenBook-CSS ersetzen (Plus Jakarta Sans, Indigo/Pink Farbschema, Glass-Effekte)

### `tailwind.config.ts`
- ZenBook-Version uebernehmen

## Dateien die nicht mehr benoetigt werden

Diese werden nicht geloescht, aber nicht mehr importiert:

- `src/components/Navbar.tsx`, `NavLink.tsx`, `HeroSection.tsx`, `ServicesSection.tsx`, `BenefitsSection.tsx`, `PortalCTASection.tsx`, `Footer.tsx`
- `src/components/portal/*` (PortalLayout, PortalSidebar, PinProtection, AvailabilityView, etc.)
- `src/contexts/AuthContext.tsx`
- Alle Seiten unter `src/pages/portal/*`, `src/pages/admin/*`, `src/pages/sales/*`
- `src/pages/Login.tsx`, `src/pages/Contact.tsx`, `src/pages/Impressum.tsx`, `src/pages/Datenschutz.tsx`, `src/pages/AGB.tsx`
- `src/hooks/usePortalData.ts`, `src/hooks/useRevenueStats.ts`, `src/hooks/useRealtimeSubscription.ts`

## Was NICHT angefasst wird

- Edge Functions (`supabase/functions/*`) - alle bleiben 1:1
- Datenbank-Migrationen und Trigger
- Supabase Client (`src/integrations/supabase/client.ts`)
- Supabase Types (`src/integrations/supabase/types.ts`)
- UI Components (`src/components/ui/*`) - werden von ZenBook auch genutzt
- `.env`, `supabase/config.toml`

## Datenbank-Kompatibilitaet

Alle ZenBook-Hooks nutzen exakt die gleichen Supabase-Tabellen:

```text
ZenBook Hook            -> Supabase Tabelle
-------------------------------------------------
useReservations         -> reservations
useStaffMembers         -> staff_members
useProducts             -> products
useStaffShifts          -> staff_shifts
useShiftExceptions      -> shift_exceptions
useContacts             -> contacts
useCustomerApiKey       -> customer_api_keys
useNotifications        -> notifications
useBusinessSettings     -> voice_agent_config
useAuth                 -> auth.users (Supabase Auth)
```

### Offener Punkt: `api_keys` Tabelle

Der `useApiKeys` Hook und `AdminDashboard`/`ApiKeyManagement` referenzieren eine `api_keys` Tabelle mit Spalten `id, user_id, key_prefix, name, is_active, last_used_at, created_at`. Diese existiert im aktuellen Projekt nicht. Es gibt zwei Optionen:

1. **Tabelle per Migration anlegen** (empfohlen) - damit alle Funktionen 1:1 funktionieren
2. **Hooks anpassen** auf `customer_api_keys` - weniger funktional

Option 1 wird umgesetzt: Eine `api_keys`-Tabelle wird erstellt, plus das passende Edge Function `generate-api-key` falls nicht vorhanden.

## Kalender-Funktionen die erhalten bleiben

Der `StaffCalendarView` aus ZenBook nutzt direkt die Supabase-Daten:
- Reservierungen mit Realtime-Updates
- Staff-Spalten mit Farben und Avataren
- Shift-basierte Arbeitszeitpruefung (inkl. Exceptions)
- Drag-and-Drop zwischen Mitarbeitern
- Tag/Woche-Ansicht mit konfigurierbarem Intervall (15/30/60 Min.)
- Termindetails mit Status, Quelle, Kontaktdaten
- Termin erstellen/bearbeiten/loeschen mit Produktzuordnung
- Dauer-Autoberechnung basierend auf Produktauswahl

All diese Funktionen arbeiten mit den bestehenden Supabase-Tabellen und Edge Functions weiter.

## Reihenfolge der Implementierung

1. Datenbank-Migration: `api_keys`-Tabelle erstellen (falls noetig)
2. Types, Constants, Services erstellen
3. Hooks erstellen/ersetzen
4. Auth-Komponenten erstellen
5. ZenBook-Komponenten erstellen
6. CSS und Tailwind-Config ersetzen
7. App.tsx und Index.tsx anpassen

