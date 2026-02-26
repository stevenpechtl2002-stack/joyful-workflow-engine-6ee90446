

## Plan: Kalender vereinfachen + Kassenfunktionen vervollständigen

### 1. Kalender auf Staff-Kalender reduzieren (`src/pages/portal/Calendar.tsx`)
- Entferne `calendarType` State und die 3-Tab-Leiste (Standard/Mitarbeiter/Verfügbar)
- Entferne den kompletten Standard-Kalender (Monats-, Wochen-, Tagesansicht mit Filtern, Suche, Status-Select)
- `StaffCalendarView` wird direkt als einzige Ansicht gerendert (wie im Screenshot)
- "Freie Slots" und "Dienstplan" bleiben über die Buttons in der StaffCalendarView erreichbar
- "Neue Reservierung" Button bleibt im Header

### 2. Kassenabrechnung erweitern (`src/pages/portal/Sales.tsx`)
- **Kassenbuch**: Bereits vorhanden mit Transaktions-Tabelle und Zusammenfassung -- bleibt
- **Z-Bon**: Bereits vorhanden -- bleibt
- **Neuer Tab "Kassenabrechnung"**: Hinzufuegen mit:
  - Kassenschublade Start-/Endbestand editierbar
  - Einzahlungen und Entnahmen erfassen (z.B. Trinkgeld-Entnahme, Wechselgeld-Einlage)
  - Kassenbestand-Differenz anzeigen (Soll vs. Ist)
  - Übersicht: Anfangsbestand + Bareinnahmen + Einzahlungen - Entnahmen = Soll-Endbestand
- **Transaktionen loeschen**: Button zum Stornieren/Loeschen einzelner Transaktionen im Kassenbuch
- **Tagesabschluss verbessern**: Kassenschublade Start-/Endbestand beim Z-Bon-Generieren eingeben koennen

### Technische Details
- Keine DB-Aenderungen noetig -- `daily_closings` hat bereits `cash_drawer_start`, `cash_drawer_end`, `cash_deposits`, `cash_withdrawals`
- Calendar.tsx wird von ~430 auf ~50 Zeilen reduziert

