

## Plan: Kassenbuch & Z-Bon System + Logo vergrößern

### 1. Logo nochmal 5x vergrößern
- `Logo.tsx`: `h-28` → `h-[140px]`, `h-32` → `h-[160px]`  
- `Navbar.tsx`: `h-12` → `h-[60px]`, navbar height `h-16` → `h-24`
- `Footer.tsx`: Logo height vergrößern
- `CustomerAuth.tsx`: Logo height vergrößern

### 2. Neue DB-Tabelle: `transactions`
Speichert jeden Verkauf/Transaktion mit Zahlungsmethode:

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid |
| reservation_id | uuid (nullable) |
| transaction_number | text |
| transaction_type | text (default: 'sale') |
| customer_name | text |
| amount | numeric |
| payment_method | text (bar/karte_ec/karte_kredit/online/tap_to_pay) |
| payment_amount | numeric |
| staff_member_id | uuid (nullable) |
| notes | text (nullable) |
| transaction_date | date |
| transaction_time | time |
| created_at | timestamptz |

RLS: Users can CRUD their own transactions.

### 3. Neue DB-Tabelle: `daily_closings` (Z-Bon)
Speichert Tagesabschlüsse:

| Column | Type |
|--------|------|
| id | uuid PK |
| user_id | uuid |
| closing_date | date (unique per user) |
| gross_revenue_services | numeric |
| gross_revenue_products | numeric |
| net_revenue | numeric |
| vat_amount | numeric |
| vat_rate | numeric (default: 19) |
| payment_cash | numeric |
| payment_card | numeric |
| payment_online | numeric |
| payment_other | numeric |
| cash_drawer_start | numeric |
| cash_drawer_end | numeric |
| cash_deposits | numeric |
| cash_withdrawals | numeric |
| status | text (open/closed) |
| closed_at | timestamptz |
| created_at | timestamptz |

RLS: Users can CRUD their own closings.

### 4. Neue Seite: `src/pages/portal/Sales.tsx`
Treatwell-ähnliches "Verkauf"-Dropdown mit 3 Tabs/Views:
- **Kassenbuch**: Tabelle mit Zeit, Transaktions-Nr, Typ (VERKAUF Badge), Kunde, Gesamtsumme, Zahlungstyp, Betrag. Rechte Sidebar mit Brutto-Umsätze Zusammenfassung und Zahlungen-Breakdown.
- **Z-Bon**: Tagesabschluss generieren und als PDF-artige Ansicht anzeigen (wie im Screenshot): Salon-Name, Adresse, Brutto-Umsätze, Netto, MwSt, Zahlungen-Breakdown, Kassenschublade.
- **Neuer Verkauf**: Dialog zum manuellen Erfassen einer Transaktion.

### 5. Sidebar & Routing aktualisieren
- `PortalSidebar.tsx`: Neuen "Verkauf" Menüpunkt hinzufügen (mit Euro/Receipt icon)
- `App.tsx`: Route `/portal/sales` → `Sales` Seite registrieren

### Technische Details
- Datumsnavigation mit Pfeilen (< 26.02.2026 >) wie im Screenshot
- Z-Bon automatisch aus Transaktionen des Tages berechnen
- Kassenbuch zeigt rechts eine sticky Zusammenfassung (Brutto-Umsätze, Zahlungen)
- Status "abgeschlossen" nach Tagesabschluss

