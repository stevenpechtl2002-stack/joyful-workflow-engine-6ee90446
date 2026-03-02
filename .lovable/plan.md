

## Plan: Abonnement-Seite und Navigation entfernen

### Aenderungen

**1. `src/components/portal/PortalSidebar.tsx`** (Zeile 41):
- Den Sidebar-Eintrag `{ icon: CreditCard, label: 'Abonnement', path: '/portal/subscriptions' }` entfernen

**2. `src/App.tsx`** (Zeilen 33, 82):
- Den lazy Import `const Subscriptions = ...` entfernen
- Die Route `<Route path="/portal/subscriptions" .../>` entfernen

**3. `src/pages/portal/Subscriptions.tsx`**:
- Datei komplett loeschen

Die Edge Functions (`create-checkout`, `check-subscription`, `customer-portal`) bleiben bestehen, falls Stripe spaeter wieder gebraucht wird.

