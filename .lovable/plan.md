

## Plan: Kalender resizeable mit fixierten Mitarbeiternamen und einstellbarer Spaltenbreite

### Anforderungen
1. Kalender-Container per Drag an der Ecke in der Groesse veraenderbar (bis Vollbild)
2. Mitarbeiternamen bleiben beim Scrollen fixiert (sticky header)
3. Spaltenbreite der Mitarbeiter-Spalten per Drag einstellbar

### Ansatz

Statt nur CSS `resize: both` (das nur die Container-Groesse aendert) wird ein custom Resize-Handle oben rechts an der Card implementiert, plus:

- **Resizable Container**: Die Calendar-Card bekommt einen Drag-Handle oben rechts. Per `mousedown`/`mousemove` wird die Hoehe und Breite des Containers gesteuert. `max-width: 100vw` und `max-height: 100vh` ermoeglichen Vollbild.
- **Sticky Staff Headers**: Die Mitarbeiter-Header-Zeile (h-12) bekommt `position: sticky; top: 0; z-index: 10`, damit die Namen beim vertikalen Scrollen sichtbar bleiben. Die Zeit-Spalte bekommt `position: sticky; left: 0` fuer horizontales Scrollen.
- **Einstellbare Spaltenbreite**: Die feste `w-40` Breite der Staff-Spalten wird durch einen State `columnWidth` ersetzt. Zwischen den Spalten-Headern wird ein kleiner vertikaler Drag-Handle eingefuegt, mit dem man per `mousedown`/`mousemove` die Breite aendert.

### Aenderungen

1. **`src/components/portal/StaffCalendarView.tsx`**:
   - Neuen State: `containerHeight`, `containerWidth`, `columnWidth` (default 160px)
   - Resize-Handle Component oben rechts an der Card (diagonal-Pfeil Icon), der per Mouse-Events die Container-Groesse steuert
   - Column-Resize-Handle zwischen Staff-Headers, der `columnWidth` per Drag aendert
   - Staff-Header mit `sticky top-0 z-10 bg-card` fixieren
   - Zeit-Spalte mit `sticky left-0 z-20 bg-card` fixieren
   - Feste `w-40` durch `style={{ width: columnWidth }}` ersetzen
   - Card bekommt `overflow: auto` und dynamische `style={{ width, height }}`

### Ergebnis
- Drag-Handle oben rechts zum Groesse aendern des ganzen Kalenders
- Mitarbeiternamen scrollen nicht weg (sticky)
- Spaltenbreiten individuell per Drag einstellbar
- Alle Mitarbeiter passen auf den Bildschirm wenn man die Spalten schmaler zieht

