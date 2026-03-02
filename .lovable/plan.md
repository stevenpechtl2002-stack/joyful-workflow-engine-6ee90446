

## Plan: Kalender-Tabelle per Ecke ziehbar/resizeable machen

Der Kalender (die `Card` mit dem Grid) soll an einer Ecke (oben rechts) einen Resize-Handle bekommen, mit dem man die Größe manuell per Drag anpassen kann – bis hin zum Vollbild.

### Ansatz

CSS `resize: both` mit `overflow: auto` auf dem Kalender-Container. Das ist die einfachste native Lösung – der Browser zeigt automatisch einen Drag-Handle in der unteren rechten Ecke. Zusätzlich setze ich `min-height`, `min-width` und entferne feste Höhenbeschränkungen, damit der Kalender frei skaliert werden kann.

### Änderungen

1. **`src/components/portal/StaffCalendarView.tsx`** (Zeile ~600):  
   Die `<Card>` um den Kalender bekommt die CSS-Klasse `resize overflow-auto` und ein `style` mit `minHeight: 400px, minWidth: 300px`. Dadurch erscheint der native Browser-Resize-Griff unten rechts, und der User kann den Kalender beliebig groß ziehen.

### Ergebnis
- Kleiner Drag-Handle in der Ecke des Kalenders
- Frei ziehbar in Breite und Höhe
- Keine zusätzliche Bibliothek nötig

