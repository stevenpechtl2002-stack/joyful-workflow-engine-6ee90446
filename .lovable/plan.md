

## Verbesserung der Kalender-Bild-Analyse

### Ziel
Die Bildanalyse von Treatwell-Screenshots soll deutlich verbessert werden, sodass alle Termine korrekt erkannt, den richtigen Mitarbeitern zugeordnet und als blockierte Zeitslots eingetragen werden. Vor dem Import wird eine Bestaetigungsansicht mit Anzahl der Termine und erkannten Daten angezeigt.

### Aenderungen

**1. Edge Function `parse-calendar-image` verbessern**
- Den AI-Prompt stark ueberarbeiten mit spezifischen Treatwell-Layout-Hinweisen:
  - Spaltenkoepfe enthalten Mitarbeiternamen (oft mit Avataren/Icons)
  - Farbige Bloecke = Termine, Position im Zeitraster = Start-/Endzeit
  - Datum steht im Header (z.B. "Mi, Heute" + Kalender links)
  - Kundennamen ignorieren, stattdessen immer "Blockiert" setzen
  - Service/Behandlung aus dem Text im farbigen Block extrahieren
- Zusaetzlich: Die `temperature` auf 0 setzen fuer konsistentere Ergebnisse
- Das Datum vom Frontend mitsenden (aktuell ausgewaehltes Datum), damit die AI es als Fallback verwenden kann

**2. Frontend SmartTextImport anpassen**
- Das aktuell im Kalender ausgewaehlte Datum an die Edge Function mitsenden
- Die Bestaetigungsansicht verbessern:
  - Klare Zusammenfassung: Anzahl Termine, erkannte Daten, Mitarbeiter-Zuordnungen
  - Nicht-zugeordnete Mitarbeiter hervorheben (gelb markieren)
  - Jeder Eintrag zeigt: Zeit, Mitarbeiter, Service
- Staff-Matching verbessern: Auch Vornamen-Anfaenge matchen (z.B. "Lilly" im System matcht "Lill" aus dem Bild)

### Technische Details

**Edge Function Prompt-Optimierung:**
- Explizite Anweisung: "Das Datum des Screenshots ist [mitgesendetes Datum]. Verwende dieses Datum fuer alle Termine."
- Strukturierte Anweisung pro Spalte: "Gehe Spalte fuer Spalte von links nach rechts durch"
- Anweisung zur Genauigkeit: "Zaehle die Gesamtzahl der farbigen Bloecke und stelle sicher, dass du genau so viele Eintraege zurueckgibst"
- `temperature: 0` fuer deterministische Ergebnisse

**Frontend-Aenderungen:**
- `selectedDate` (oder `defaultDate`) als Parameter `calendarDate` an die Edge Function senden
- Staff-Name-Matching: Levenshtein-aehnliche Toleranz fuer Tippfehler/OCR-Fehler (z.B. "Lill" vs "Lilly")
- Bestaetigungsschritt wird automatisch angezeigt nach der Analyse (schon vorhanden, wird optimiert)

