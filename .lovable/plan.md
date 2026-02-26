

## Plan: Uploaded Logo-Bild überall einsetzen

Das hochgeladene Bild (Uhr-Icon + "ZENTIME" Text) wird als Logo-Bild in der gesamten App verwendet.

### 1. Bild kopieren nach `src/assets/zentime-logo.png`

### 2. `src/components/zenbook/Logo.tsx` aktualisieren
- Statt dem "Z"-Badge + Text wird das Logo-Bild als `<img>` gerendert
- Höhe anpassbar je nach Variant (default: `h-10`, light: `h-12`)
- `showText` wird ignoriert — das Bild enthält bereits den Text

### 3. `src/components/Navbar.tsx` aktualisieren
- Den hardcoded "Z"-Badge + "ZenTime" Text durch `<img src={zenTimeLogo}>` ersetzen

### 4. `src/components/Footer.tsx` aktualisieren
- Logo im Footer durch das Bild ersetzen

### 5. `src/components/zenbook/LandingPage.tsx` Footer
- Logo im LandingPage-Footer durch das Bild ersetzen

### 6. `src/pages/CustomerAuth.tsx` & `src/pages/Login.tsx`
- Logo-Icon durch das Bild ersetzen

