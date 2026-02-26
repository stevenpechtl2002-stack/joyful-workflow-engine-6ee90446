

## Plan: Kundenprofil als Dashboard + Kalender-Menü mit Kassenbuch/Z-Bon + Scrollbar

### 1. Kundenprofil als Dashboard (`src/pages/CustomerProfile.tsx`) - Komplett umbauen

- **Header**: Logo, "Mein Dashboard" Titel, Logout-Button (rechts oben)
- **Statistik-Cards** (4er Grid): Termine gesamt, anstehende Termine, Favoriten, Mitglied seit
- **"Dein nächster Termin"** Hero-Card mit Datum, Uhrzeit, Salon-Name
- **Editierbares Profil**: Name, E-Mail (readonly), Telefon - Speichern schreibt in `profiles` Tabelle (UPDATE RLS existiert bereits)
- **Favoriten**: Horizontale scrollbare Karten mit Salon-Info + Entfernen-Button
- **Salon-Vorschläge**: "Entdecke Salons" Sektion - lädt aus `customers` wo `published = true`, zeigt Name, Kategorie, Stadt
- **Buchungshistorie**: Anstehende + vergangene Termine mit Status-Badges
- **Design**: Grid-Layout, framer-motion Animationen, responsive 1-2 Spalten

### 2. ZenBookApp Sidebar erweitern (`src/components/zenbook/ZenBookApp.tsx`)

**Neue Nav-Items in `navItems` Array:**
- `{ id: 'kassenbuch', label: 'Kassenbuch', icon: <Receipt /> }`
- `{ id: 'zbon', label: 'Z-Bon', icon: <Euro /> }`

**ViewType erweitern** (`src/types/index.ts`):
- `'kassenbuch' | 'zbon'` zu `ViewType` hinzufügen

**Views rendern**: Kassenbuch und Z-Bon Content inline im `renderView` Switch-Case einbauen (Sales-Logik direkt in ZenBookApp oder als extrahierte Komponenten)

### 3. Sidebar unterhalb Kalender scrollbar machen (`src/components/zenbook/ZenBookApp.tsx`)

- Nach dem Mini-Kalender (Zeile 311): Einen neuen `<div className="flex-1 overflow-y-auto">` Wrapper öffnen
- Navigation, API Gateway, "Neu"-Button und Logout alle in diesen Container verschieben
- `shrink-0` von den unteren Elementen (API Gateway, Neu-Button, Logout) entfernen
- `flex-1` von der `<nav>` entfernen (der neue Wrapper übernimmt das)

### 4. Sales-Komponenten extrahieren (`src/pages/portal/Sales.tsx`)

- Kassenbuch-Tab-Content und Z-Bon-Tab-Content als eigenständige exportierte Komponenten extrahieren
- Diese in ZenBookApp importieren und bei `currentView === 'kassenbuch'` bzw. `'zbon'` rendern

### Dateien die geändert werden:
- `src/pages/CustomerProfile.tsx` - Komplett umbauen zu Dashboard
- `src/components/zenbook/ZenBookApp.tsx` - Nav-Items + Scrollbar + neue Views
- `src/types/index.ts` - ViewType erweitern
- `src/pages/portal/Sales.tsx` - Kassenbuch/Z-Bon Komponenten exportieren (oder neue Dateien)

