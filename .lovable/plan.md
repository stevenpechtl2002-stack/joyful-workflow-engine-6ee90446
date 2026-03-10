

## Plan: Kalenderraster mit Mitarbeiter-Slots in der Wochenansicht

### Problem
Die aktuelle Wochenansicht zeigt nur eine Spalte pro Tag ohne Mitarbeiter-Zuordnung. Der Nutzer möchte (wie in Treatwell) pro Tag die Mitarbeiter-Spalten sehen.

### Änderung in `src/components/zenbook/StaffCalendarView.tsx`

**Toolbar**: Bleibt komplett unverändert.

**Wochenansicht-Grid umbauen**:

1. **Header**: Statt einer einzelnen Spalte pro Tag wird ein gruppiertes Layout erstellt:
   - Obere Zeile: Tagesname + Datum als Gruppenüberschrift (colspan über alle Staff-Spalten)
   - Untere Zeile: Mitarbeiter-Namen innerhalb jedes Tages

```text
|  Zeit  |     Montag 10.     |     Dienstag 11.    |  ...
|        | Anna | Max | Lisa  | Anna | Max | Lisa   |  ...
|--------|------|-----|-------|------|-----|--------|------
| 08:00  |      |     |       |      |     |        |
| 08:30  |      |     |       |      |     |        |
```

2. **Grid-Spalten**: Für jeden Tag werden alle aktiven Mitarbeiter als Spalten gerendert (mit `renderColumn(staffId, day)`) -- gleiche Logik wie in der Tagesansicht.

3. **Spaltenbreite**: In der Wochenansicht werden die Spalten schmaler (z.B. `columnWidth * 0.6`), damit mehr Inhalt sichtbar ist. Mitarbeiter-Namen werden auf den ersten Buchstaben + Farb-Indikator gekürzt.

4. **Sticky Header**: Tag-Gruppierung und Mitarbeiter-Namen bleiben beim Scrollen oben fixiert (sticky top).

### Keine Datenbankänderungen erforderlich.

