

## Plan: Erweitertes Admin Dashboard mit Kunden-Übersicht & Umsätzen

Das bestehende Admin Dashboard unter `src/pages/admin/AdminDashboard.tsx` wird erweitert um ein modernes Kundenmanagement mit Gesamtumsätzen, Sperr-Funktionen und Detail-Ansichten.

### Änderungen an `src/pages/admin/AdminDashboard.tsx`

**1. Zusätzliche Daten laden**
- `transactions` Tabelle abfragen, um pro Kunde den Gesamtumsatz zu berechnen (`SUM(amount)` gruppiert nach `user_id`)
- `reservations` mit `price_paid` für Umsatz-Aggregation nutzen
- `profiles` Tabelle für vollständige Namen
- Gesamtumsatz-KPI-Karte im Stats-Bereich hinzufügen

**2. Customers-Tab modernisieren**
- Kundenliste im modernen Card-Layout statt nur Tabelle
- Pro Kunde anzeigen: Name, E-Mail, Firma, Kategorie, Plan, Status, Registrierungsdatum, Gesamtumsatz, Anzahl Reservierungen, Anzahl Kontakte
- Sperren/Aktivieren Button mit Bestätigungs-Dialog
- Expandierbare Detailansicht pro Kunde (letzte Reservierungen, Umsatz-Verlauf)
- Suchfeld und Filter (Status, Plan, Kategorie)

**3. Neue KPI-Karten**
- Gesamtumsatz aller Kunden (Summe aller `transactions.amount` bzw. `reservations.price_paid`)
- Durchschnittlicher Umsatz pro Kunde
- Gesperrte Kunden Anzahl

**4. Kunden-Detailansicht (Dialog)**
- Klick auf Kunde öffnet Dialog mit:
  - Profil-Infos, Salon-Beschreibung, Kontaktdaten
  - Umsatz-Übersicht (Gesamt, letzter Monat)
  - Letzte Reservierungen
  - Aktionen: Sperren/Entsperren, Notizen bearbeiten, Plan ändern

### Keine Datenbankänderungen nötig
Alle benötigten Daten (transactions, reservations, customers, profiles) existieren bereits. Der Admin hat via RLS bereits Zugriff auf alle Tabellen.

### Dateien
- `src/pages/admin/AdminDashboard.tsx` — Hauptänderung: Kunden-Tab erweitern, Umsatzdaten laden, moderne UI

