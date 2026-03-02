

## Plan: Google Login für Kunden aktivieren

### Vorgehen

1. **Lovable Cloud Social Auth konfigurieren** - Das Projekt nutzt Lovable Cloud, das Google OAuth automatisch verwaltet. Ich werde die `lovable.auth.signInWithOAuth("google")` Methode einbinden.

2. **`src/pages/UnifiedAuth.tsx` anpassen** - Im Kunden-Login-Bereich (wenn `mode === 'customer'`) einen "Mit Google anmelden" Button hinzufügen, sowohl im Login- als auch im Signup-Tab. Der Button ruft `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` auf.

3. **Lovable Auth Module generieren** - Das `@lovable.dev/cloud-auth-js` Paket und das Modul in `src/integrations/lovable/` müssen erstellt werden, um die OAuth-Funktion bereitzustellen.

4. **Redirect-Handling** - Nach Google-Login wird der User wie gewohnt über den bestehenden `useEffect` in `UnifiedAuth.tsx` basierend auf Rollen weitergeleitet (Kunde → `/storefront/profile`).

### Betroffene Dateien
- `src/pages/UnifiedAuth.tsx` - Google-Button im Kunden-Bereich
- `src/integrations/lovable/` - Auto-generiertes Auth-Modul (wird vom Tool erstellt)

### UI-Änderung
- Trennlinie "oder" zwischen E-Mail-Login und Google-Button
- Google-Button mit Google-Icon, nur sichtbar wenn `mode === 'customer'`

