

## Plan: Texte für neues Projekt anpassen + Salon-Partner Sektion + Hero-Overlay

### 1. Hero-Overlay weniger milchig (`LandingPage.tsx`, Zeile 159)
- Von `from-background/70 via-background/50` zu `from-background/40 via-background/20 to-transparent`

### 2. Alle Texte und Zahlen für "ganz neues Projekt" anpassen

**Hero (Zeile 209):**
- "Über 5.000 verifizierte Salons" → "Finde deinen perfekten Salon und buche in Sekunden."

**Treatment Categories (Zeile 41-48) — Counts:**
- Alle `count`-Werte realistisch für Neustart: "Neu", "Bald verfügbar" o.ä. statt "2.400+"

**Featured Salons (Zeile 51-55):**
- Reviews auf realistische Werte: 12, 8, 15, 6 statt 234, 189, 312, 156

**USP Features (Zeile 58-61):**
- "Tausende verifizierte Salons mit echten Bewertungen" → "Nur geprüfte Salons mit echten Bewertungen"

**Stats Section (Zeile 483-487):**
- `5.000+` → "Wachsend" oder kleine realistische Zahl
- `2M+` → entfernen oder "Erste Nutzer"
- `98%` → "Einfach" 
- `4.9` → "5.0" (Ziel)

Komplette Überarbeitung zu ehrlichen, startup-gerechten Texten ohne aufgeblähte Zahlen.

### 3. Neue Salon-Partner Sektion (nach Zeile 477, vor Stats)

Neue `AnimatedSection` mit Pitch an Salon-Betreiber:
- Überschrift: "Du bist Salon-Betreiber?"
- 4 Vorteilskarten mit Icons:
  - **Neue Kunden gewinnen** — Werde online sichtbar und von neuen Kunden gefunden
  - **Online-Buchungen 24/7** — Dein Kalender füllt sich automatisch
  - **Einfache Verwaltung** — Staff, Services & Termine in einem Tool
  - **Kostenlos starten** — Keine Grundgebühr, keine Vertragsbindung
- CTA-Button → `/portal/auth`
- Farbiger Hintergrund zur Abgrenzung

