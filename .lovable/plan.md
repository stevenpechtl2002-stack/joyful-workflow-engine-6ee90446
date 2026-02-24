

# Design-Transfer von "Website Zip Archive" (ZenBook)

## Zusammenfassung

Das komplette visuelle Design (Farben, Schriftart, Glass-Effekte, Animationen, Buttons) wird aus dem ZenBook-Projekt uebertragen. Alle Funktionen (Kalender, n8n, API-Keys, Edge Functions, Datenbank) bleiben 1:1 erhalten.

## Was sich aendert

Nur **2 Dateien** werden angepasst:

### 1. `src/index.css`

Komplett ersetzen mit dem ZenBook-Styling:

- **Schriftart**: Plus Jakarta Sans (statt Inter/Space Grotesk)
- **Helles Farbschema (Standard)**:
  - Background: heller Grauton (`240 20% 98%`)
  - Primary: Indigo (`252 80% 60%`)
  - Accent: Pink (`330 85% 60%`)
  - Helle Borders und Inputs
- **Dunkles Farbschema**: Angepasste dunkle Varianten mit Indigo/Pink
- **Neue Glass-Effekte**: `floating-3d`, `glass-card`, `card-3d`, `rim-light`, `gradient-border`
- **Neue Utility-Klassen**: `zen-label`, `zen-input`, `zen-button-primary`, `zen-button-secondary`, `zen-card`
- **Neue Animationen**: 3D-Hover, Glow-Pulse, Shimmer, Float

Die bestehenden Utility-Klassen (`text-gradient`, `glass`, `glow-primary`, `animate-float`, etc.) werden auf das neue Farbschema umgemappt, damit vorhandene Komponenten weiter funktionieren. Die Variable `--border-subtle` wird beibehalten, da sie in bestehenden Komponenten referenziert wird.

### 2. `tailwind.config.ts`

- Schriftfamilie auf `Plus Jakarta Sans` aendern
- `border-subtle` Farbvariable beibehalten
- Rest bleibt identisch

## Was NICHT angefasst wird

- Keine Komponenten, Seiten, Hooks, Router oder Auth-System
- Keine Edge Functions, Datenbank oder Migrationen
- Keine Supabase-Konfiguration
- Kalender, n8n-Integration, API-Key-Logik - alles bleibt 1:1

## Technischer Hintergrund

Alle bestehenden Komponenten verwenden CSS-Variablen (`bg-background`, `text-primary`, `bg-card`, etc.). Durch das Ersetzen der CSS-Variablenwerte uebernehmen sie automatisch das neue Farbschema - kein Komponenten-Code muss geaendert werden.

