

## Plan: Kategorie-Seiten für den Marktplatz

Jede Kategorie (Friseur, Nägel, Kosmetik, Massage, Männer) bekommt eine eigene gefilterte Ansicht auf der Storefront. Statt separate Seiten-Komponenten zu erstellen, nutzen wir den bestehenden Query-Parameter-Ansatz (wie bei `filter=sale`).

### Ansatz: URL-Parameter `category`

Die Storefront-Seite bekommt einen neuen URL-Parameter `category`, z.B. `/storefront?category=Friseur`. Jede Kategorie-Taste auf der LandingPage navigiert dorthin.

### Änderungen

**1. `src/components/zenbook/LandingPage.tsx`**
- Alle Kategorie-Buttons (Friseur, Nägel, Kosmetik, Massage, Männer) bekommen einen `onClick`-Handler: `navigate('/storefront?category=<Name>')`
- "Nägel" mappt auf die Salon-Kategorie "Nagelstudio"
- "Männer" mappt auf "Barbershop"

**2. `src/pages/Storefront.tsx`**
- Neuen Query-Parameter `category` auslesen
- Salon-Liste nach `salon.category` filtern wenn gesetzt
- Hero-Überschrift dynamisch anpassen (z.B. "Die besten Friseure")
- Kategorie-Mapping: Nägel → Nagelstudio, Männer → Barbershop
- Kategorie-Filter-Chips oben anzeigen (die gleichen 5 Buttons), aktive Kategorie hervorheben

### Mapping-Tabelle
| Button-Label | Salon-Kategorie |
|---|---|
| Friseur | Friseur |
| Nägel | Nagelstudio |
| Kosmetik | Kosmetik |
| Massage | Massage |
| Männer | Barbershop |

### Dateien
- `src/components/zenbook/LandingPage.tsx` — onClick für alle Kategorie-Buttons
- `src/pages/Storefront.tsx` — category-Filter + dynamischer Hero + Kategorie-Navigation

