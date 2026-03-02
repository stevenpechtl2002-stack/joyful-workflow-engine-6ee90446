

## Plan: Kalender auf Vollbild wie Treatwell

### Analyse

Das Treatwell-Layout zeigt: Der Kalender nimmt den **gesamten verfuegbaren Platz** ein - keine extra Padding, kein Card-Wrapper mit fester Hoehe. Die Staff-Spalten fuellen die volle Breite und Hoehe des Hauptbereichs.

Aktuell hat der Kalender:
- `containerHeight` State mit Default 640px - begrenzt die Hoehe kuenstlich
- `p-10` Padding im Main-Content-Bereich (Zeile 419 in ZenBookApp)
- Resize-Controls und Fullscreen-Toggle die eigentlich ueberfluessig werden

### Aenderungen

**1. `src/components/zenbook/ZenBookApp.tsx`** (Zeile 419):
- Wenn `currentView === 'calendar'`: Padding von `p-10` auf `p-0` reduzieren, damit der Kalender den gesamten Platz nutzt
- Fuer alle anderen Views bleibt `p-10`

**2. `src/components/zenbook/StaffCalendarView.tsx`**:
- Container-Hoehe: Statt fester `containerHeight` wird `flex-1` mit `h-full` verwendet - der Kalender fuellt automatisch den gesamten verfuegbaren Platz
- Entfernen der manuellen Resize-Controls (Plus-Icon oben links) und Fullscreen-Toggle (Maximize oben rechts) - nicht mehr noetig wenn der Kalender immer den vollen Platz einnimmt
- Die States `containerWidth`, `containerHeight`, `isFullscreen`, `savedSize`, `isResizingContainer` und zugehoerige Handler (`handleContainerResizeStart`, `toggleFullscreen`) werden entfernt
- Der aeussere Wrapper bekommt `h-full flex flex-col` und der Kalender-Grid-Container bekommt `flex-1 overflow-auto` statt einer festen Pixel-Hoehe
- Header-Bereich (`mb-6`) wird auf `mb-2 px-4 pt-2` komprimiert fuer weniger Platzverschwendung (aehnlich Treatwell)

### Ergebnis
Der Kalender fuellt wie bei Treatwell den gesamten Bildschirmbereich automatisch aus - ohne manuelle Groessenanpassung noetig.

