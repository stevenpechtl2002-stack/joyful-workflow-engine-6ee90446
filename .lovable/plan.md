

## Plan: Neues ZenTime Logo überall einsetzen

Das hochgeladene Logo (`zentime-logo-512-2.png`) wird als neues Logo in `src/assets/` kopiert und ersetzt das bisherige `zentime-logo.png` überall.

### Schritte

1. **Logo-Datei kopieren**: `user-uploads://zentime-logo-512-2.png` → `src/assets/zentime-logo.png` (überschreibt das alte)

2. **Keine Import-Änderungen nötig** — alle Komponenten importieren bereits `@/assets/zentime-logo.png`, das neue Bild wird automatisch überall verwendet:
   - `src/components/zenbook/Logo.tsx`
   - `src/components/Navbar.tsx`
   - Alle weiteren Stellen die `zentimeLogo` importieren

