

## Plan: Login direkt zum Kalender statt Dashboard

Der User möchte nach dem Login direkt in den Kalender (`/` = ZenBookApp) statt ins Dashboard (`/portal`).

### Änderungen

1. **`src/pages/UnifiedAuth.tsx`** – Nach erfolgreichem Business-Login Redirect von `/portal` auf `/` ändern
2. **`src/contexts/AuthContext.tsx`** – Falls dort auch ein Redirect nach `/portal` existiert, ebenfalls auf `/` ändern

### Betroffene Dateien
- `src/pages/UnifiedAuth.tsx`
- Eventuell `src/contexts/AuthContext.tsx` oder andere Auth-Flows

