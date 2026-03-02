

## Plan: Sticky Headers und Resize-Controls reparieren

### Problem-Analyse
1. Das **Plus-Icon** (oben links) und der **Maximize-Button** (oben rechts) sind zwar im Code vorhanden, aber sie liegen moeglicherweise unter der Header-Zeile oder sind schlecht sichtbar weil sie `z-50` haben aber innerhalb des `relative` Wrappers positioniert sind, waehrend der Kalender-Content darueber scrollt.

2. Die **sticky Headers** (Mitarbeiter-Namen oben, Zeit-Spalte links) funktionieren nur korrekt, wenn der scrollbare Container (`overflow: auto`) direkt der Parent der sticky-Elemente ist. Aktuell ist die Struktur:
   - `div.relative` (Wrapper) -> `Card` (overflow-auto) -> `div.flex` (renderDayView) -> sticky elements
   - Das ist korrekt aufgebaut, aber die `Card` Component fuegt extra Wrapper-Elemente hinzu, die die sticky-Kette brechen koennten.

### Loesung

**`src/components/portal/StaffCalendarView.tsx`**:

1. **Plus-Icon und Maximize-Button sichtbarer machen**: Die Buttons bekommen einen staerkeren visuellen Stil (groesser, deutlichere Farbe, `shadow-md`) und werden mit `pointer-events-auto` versehen. Zusaetzlich den `z-50` beibehalten aber sicherstellen, dass sie ueber dem Card-Content liegen.

2. **Card durch einfaches `div` ersetzen**: Statt `<Card>` wird ein einfaches `<div>` mit den gleichen Styles verwendet (`rounded-lg border bg-card overflow-auto`). Das entfernt potenzielle Extra-Wrapper, die die sticky-Positionierung brechen.

3. **Sticky-Verhalten testen**: Sicherstellen dass:
   - Ecke oben links (Uhr-Header): `sticky top-0 left-0 z-30 bg-card`
   - Mitarbeiter-Header: `sticky top-0 z-10 bg-card` 
   - Zeit-Spalte: `sticky left-0 z-20 bg-card`
   - Alle sticky-Elemente einen soliden `bg-card` Background haben (nicht transparent)

### Aenderungen
- Card-Element durch `div` mit gleichen Styles ersetzen (Zeile 706-715)
- Plus-Icon groesser und sichtbarer machen (Zeile 676-682)
- Maximize-Button sichtbarer machen (Zeile 685-704)
- Sicherstellen dass alle sticky-Header `bg-card` haben (Zeilen 401-402, 418, 460)

