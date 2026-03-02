

## Plan: "Sale %" Button zeigt aktive Rabatte an

### Was passiert
Beim Klick auf den "Sale %" Button in der LandingPage-Navigation wird ein Bereich mit allen aktiven Rabatten eingeblendet (oder der User wird zur Storefront mit Rabatt-Filter navigiert).

### Ansatz
1. **LandingPage.tsx anpassen**: Beim Klick auf "Sale %" Button navigiert der User zur Storefront-Seite mit einem Query-Parameter (`/storefront?filter=sale`).
2. **Storefront.tsx anpassen**: Wenn der URL-Parameter `filter=sale` gesetzt ist, wird automatisch nur der Rabatt-Bereich prominent angezeigt und die Salon-Liste nach Salons mit aktiven Rabatten gefiltert.

### Alternativ (einfacher, besser UX)
Statt Navigation: Direkt auf der LandingPage einen Modal/Sheet öffnen, der alle aktiven Rabatte aus der `discounts`-Tabelle lädt und anzeigt, mit Klick-Navigation zum jeweiligen Salon.

### Empfohlener Ansatz: Navigation zur Storefront
- Einfacher, nutzt bestehende Rabatt-Anzeige auf der Storefront
- Button bekommt `onClick={() => navigate('/storefront?filter=sale')}`
- Storefront liest den Query-Parameter aus und scrollt zum Rabatt-Bereich / zeigt nur Salons mit Rabatten

### Dateien
- `src/components/zenbook/LandingPage.tsx` — onClick-Handler für "Sale %" Button hinzufügen
- `src/pages/Storefront.tsx` — Query-Parameter `filter=sale` auslesen, Rabatte hervorheben, ggf. Salons ohne Rabatte ausblenden

