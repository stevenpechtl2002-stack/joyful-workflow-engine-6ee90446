

## Plan: Spaltenbreite einstellbar + Header-Sync reparieren

### Problem-Analyse
1. **Header und Grid scrollen unabhaengig**: Die Header-Zeile (Zeile 582) ist `sticky top-0` im aeusseren Container, aber der Grid-Body (Zeile 630) hat ein eigenes `overflow-auto` mit `no-scrollbar`. Das bedeutet: horizontales Scrollen im Grid bewegt die Mitarbeiter-Header NICHT mit - sie bleiben stehen waehrend die Zeilen sich verschieben.

2. **Spaltenbreite nicht einstellbar**: Aktuell nutzen alle Spalten `min-w-[140px] flex-1`, sodass sie sich gleichmaessig aufteilen. Es gibt keine Moeglichkeit, die Breite anzupassen, damit alle Mitarbeiter sichtbar sind.

### Loesung

**`src/components/zenbook/StaffCalendarView.tsx`**:

1. **Inneres `overflow-auto` entfernen** (Zeile 630): Das `div.flex-1.overflow-auto.no-scrollbar` wird zu einem einfachen `div.flex-1` ohne eigenes Scrolling. Der aeussere Container (Zeile 572-580) uebernimmt das gesamte Scrollen - damit bewegen sich Header und Grid-Body synchron horizontal.

2. **`columnWidth` State hinzufuegen**: Ein neuer State `columnWidth` (Standard: 160px) bestimmt die Breite jeder Mitarbeiter-Spalte. Statt `min-w-[140px] flex-1` bekommen alle Spalten eine feste `width` und `minWidth` basierend auf diesem Wert.

3. **Spaltenbreite in den Einstellungen**: Im bestehenden Settings-Popover (Zeile 491-528) wird ein neuer Slider fuer "Spaltenbreite" hinzugefuegt (80px bis 300px), analog zur bestehenden Zeilenhoehe-Einstellung.

4. **Konsistente Breiten**: Sowohl die Header-Spalten (Zeile 590-610) als auch die Grid-Spalten in `renderColumn` (Zeile 347) verwenden denselben `columnWidth`-Wert, sodass sie immer ausgerichtet bleiben.

### Aenderungen
- Neuen State `columnWidth` mit Default 160 hinzufuegen (bei den anderen States ~Zeile 73)
- `renderColumn`: `min-w-[140px] flex-1` ersetzen durch `style={{ width: columnWidth, minWidth: columnWidth }}` (Zeile 347)
- Header-Spalten: gleiche feste Breite anwenden (Zeilen 590, 597)
- Inneres `overflow-auto no-scrollbar` vom Grid-Body entfernen (Zeile 630)
- Settings-Popover: Slider fuer Spaltenbreite ergaenzen (nach Zeile 509)

