

## Plan: Live Insights + Storefront-Buchungen im Admin Dashboard

### Was geändert wird

**1. Insights-Komponente auf Live-Daten umstellen** (`src/components/zenbook/Insights.tsx`)

- Props (`appointments`, `services`, `staff`) entfernen — stattdessen `useRevenueStats('week')` und `useReservations()` direkt nutzen
- KPI-Karten zeigen echte Werte: Gesamtbuchungen (aus Reservierungen), Umsatz (aus `useRevenueStats`), Kundenanzahl (aus Kontakte)
- Alle Werte starten bei 0 wenn keine Daten vorhanden
- Chart-Daten: Reservierungen der letzten 7 Tage nach Wochentag aggregieren
- AI-Insights Text durch datenbasierte Zusammenfassung ersetzen (echte Zahlen statt "12% Wachstum" und "74% Kundenbindung")
- Parent-Komponente `ZenBookApp.tsx` anpassen: Props entfernen bei `<Insights />`

**2. Storefront-Buchungen im Admin Dashboard anzeigen** (`src/pages/admin/AdminDashboard.tsx`)

- `storefront_bookings` Tabelle zusätzlich in `fetchAllData()` abfragen
- Neuen Tab "Storefront-Buchungen" hinzufügen mit Spalten: Salon, Kunde, Telefon, E-Mail, Datum, Uhrzeit, Status, Zahlungsstatus
- Storefront-Buchungen in die KPI-Karte "Reservierungen" mit einrechnen
- KPI-Karte hinzufügen: "Storefront-Buchungen" Gesamtzahl

### Technische Details

- `storefront_bookings` hat bereits eine Admin-ALL RLS Policy — kein DB-Change nötig
- `useRevenueStats` existiert bereits und berechnet Umsatz aus `reservations` + `products` — wird direkt in Insights verwendet
- Insights braucht keine neuen Hooks, nutzt bestehende `useRevenueStats` und die Reservierungs-Hooks

### Dateien
- `src/components/zenbook/Insights.tsx` — komplett auf Live-Daten umbauen
- `src/components/zenbook/ZenBookApp.tsx` — Props bei Insights entfernen
- `src/pages/admin/AdminDashboard.tsx` — Storefront-Buchungen Tab + Daten hinzufügen

