

## Plan: Admin Dashboard modernisieren mit Statistiken und Diagrammen

### Was fehlt
Das Dashboard hat bereits KPI-Karten und Tabellen, aber **keine Diagramme/Charts**. `recharts` ist installiert aber wird nicht genutzt. Es fehlt eine visuelle Übersicht über Trends.

### Änderungen an `src/pages/admin/AdminDashboard.tsx`

**1. Charts-Sektion zwischen KPI-Karten und Tabs einfügen:**
- **Registrierungen pro Monat** (BarChart) — aggregiert aus `customers.created_at`
- **Umsatz-Trend** (AreaChart) — aggregiert aus `transactions` + `reservations.price_paid` nach Monat
- **Reservierungen pro Woche** (LineChart) — aus `reservations` + `storefront_bookings` der letzten 8 Wochen
- **Kundenverteilung nach Kategorie** (PieChart) — aus `customers.category`

**2. Neuer Tab "Registrierungen":**
- Chronologische Liste aller Kunden-Registrierungen mit Datum, Name, E-Mail, Kategorie, Plan, Status
- Sortiert nach `created_at` (neueste zuerst)

**3. Kundenprofile im Detail-Dialog erweitern:**
- API-Key anzeigen (mit Sichtbarkeit-Toggle)
- Webhook-URL pro Kunde
- Voice Agent Status des Kunden
- Stripe Abo-Status des Kunden (wenn vorhanden)

**4. Visuelle Verbesserungen:**
- Charts in 2x2 Grid mit Card-Wrappern
- Responsive Layout für mobile Ansicht
- Farblich abgestimmte Chart-Farben passend zum Theme

### Technische Details
- Import von `BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer` aus `recharts`
- Aggregationslogik mit `useMemo` für Chart-Daten aus den bereits geladenen Daten (kein neuer DB-Call nötig)
- Registrierungen-Tab nutzt dieselben `enrichedCustomers`, sortiert nach Datum

### Dateien
- `src/pages/admin/AdminDashboard.tsx` — Charts hinzufügen, Registrierungen-Tab, Detail-Dialog erweitern

