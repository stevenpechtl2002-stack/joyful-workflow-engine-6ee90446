

## Plan: Resize-Handle als Plus-Zeichen oben links + fixierte Header

### Problem
1. Der aktuelle Resize-Handle (unten rechts, innerhalb der scrollbaren Card) funktioniert nicht zuverlässig - er scrollt mit dem Inhalt weg
2. Mitarbeiter-Header und Zeit-Spalte sind nicht korrekt fixiert beim Scrollen

### Lösung

**`src/components/portal/StaffCalendarView.tsx`**:

1. **Resize-Handle nach oben links verschieben** - Ein kleines `+`-Icon (oder `Move`/`GripVertical`-Icon) in der oberen linken Ecke der Calendar-Card. Dieses wird **außerhalb** des scrollbaren Bereichs positioniert, indem ein Wrapper-`div` mit `position: relative` um die Card gelegt wird. Der Handle bleibt damit immer sichtbar und klickbar.

2. **Sticky Headers korrekt umsetzen**:
   - Die Ecke oben links (Zeit-Header): `sticky top-0 left-0 z-30 bg-card`
   - Mitarbeiter-Header-Zeile: `sticky top-0 z-10 bg-card` (bereits vorhanden, wird verifiziert)
   - Zeit-Spalte (Body): `sticky left-0 z-20 bg-card` (bereits vorhanden)
   - "Nicht zugewiesen"-Spalte Header: `sticky top-0 z-10`

3. **Wrapper-Struktur ändern**:
   ```
   <div className="relative"> ← Wrapper
     <div className="absolute top-0 left-0 z-50"> ← Plus-Handle, immer sichtbar
       <Plus icon />
     </div>
     <Card ref={containerRef} overflow-auto style={width, height}>
       ... calendar content ...
     </Card>
   </div>
   ```

4. **Alten Handle unten rechts entfernen**, neuen oben links mit `cursor: nwse-resize` und `mousedown` Event für Container-Resize.

### Betroffene Datei
- `src/components/portal/StaffCalendarView.tsx` (Zeilen 671-692 für Card/Handle, Zeilen 396-536 für sticky fixes)

