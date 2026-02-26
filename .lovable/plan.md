

## Plan: Einheitliche Login-Seite mit Business/Kunden-Auswahl

### Aktueller Zustand
- `/login` → CustomerAuth (Kunden-Login)
- `/portal/auth` → PortalAuth (Business/Salon-Login)
- Navbar, Landing Page, Footer verlinken teilweise auf `/portal/auth`, teilweise auf `/login`

### Änderung 1: Neue einheitliche Auth-Seite (`src/pages/UnifiedAuth.tsx`)
- Eine Seite unter `/login` mit zwei Modi: **Business** und **Kunde**
- Oben zwei große Buttons/Cards zur Auswahl: "Ich bin Salon-Betreiber" vs "Ich bin Kunde"
- Beide Modi haben Login + Registrieren Tabs + Passwort-vergessen
- **Business-Registrierung**: Name, E-Mail, Passwort, Passwort bestätigen
- **Kunden-Registrierung**: Name, E-Mail, Telefon (optional), Passwort, Passwort bestätigen
- Nach Login/Registrierung:
  - Business → `/portal` (bzw. `/admin` oder `/sales` je nach Rolle)
  - Kunde → `/storefront/profile`

### Änderung 2: Alle Links vereinheitlichen
- `src/components/Navbar.tsx`: `/portal/auth` → `/login`, Button-Text: "Login"
- `src/components/PortalCTASection.tsx`: `/portal/auth` → `/login`
- `src/components/zenbook/LandingPage.tsx`: alle `/portal/auth` und `/login` → `/login`
- `src/components/portal/PortalLayout.tsx`: Redirect auf `/login`
- `src/pages/CustomerProfile.tsx`: Redirect auf `/login`
- `src/pages/sales/SalesDashboard.tsx`: Redirect auf `/login`
- `src/pages/portal/Sales.tsx`: Redirect auf `/login`

### Änderung 3: Routes (`src/App.tsx`)
- `/login` → neue `UnifiedAuth` Komponente
- `/portal/auth` → Redirect auf `/login`
- CustomerAuth entfernen

### Änderung 4: CustomerProfile verbessern
- Bereits vorhanden mit Favoriten, anstehenden und vergangenen Terminen
- Profilinformationen (Name, E-Mail, Telefon) editierbar machen
- Logout-Button hinzufügen

### Ergebnis
Ein einziger Login-Punkt für alle Nutzer. Business-User landen im Dashboard, Kunden sehen ihr Profil mit Daten, Reservierungen und Favoriten.

