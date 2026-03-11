

## Plan: Footer-Style Farbverlauf-Schwebeelemente + Animationen auf allen Sektionen

### Was wird gemacht
Jede Sektion der Landing Page bekommt dezente, animierte SVG-Dekoelemente im Footer-Stil (rose/pink/gold Kreise, Dreiecke, Streifen) als Hintergrund-Schwebeelemente. Die Elemente sind leicht transparent (opacity 5-15%) und schweben sanft mit Framer Motion Animationen.

### Betroffene Datei
`src/components/zenbook/LandingPage.tsx`

### Änderungen pro Sektion

**Hero (Sektion 3):** Bestehende Glass-Schwebeelemente bekommen zusätzlich rose/gold SVG-Shapes mit sanftem Farbverlauf (from-rose-400/10 to-pink-400/10). Floating-Animation beibehalten.

**Treatment Categories (Sektion 4):** Bisherige `bg-primary/5` Blobs ersetzen durch animierte SVG-Kreise und Dreiecke in rose/gold Tönen (opacity-10), die langsam schweben (`y: [0, -15, 0]`, duration 8-12s).

**Featured Salons (Sektion 5):** Neue dezente SVG-Dekoelemente hinzufügen — goldener Kreis oben-links, rose Dreieck unten-rechts, diagonaler Streifen. Alle mit `motion.div` Floating-Animation.

**USP "Warum ZenTime?" (Sektion 6):** SVG-Circle top-right, kleines Dreieck bottom-left mit rose-400/8 Farbverlauf, animiert.

**Inspiration Sektion:** Goldene Kreise und rose Streifen als Hintergrund-Dekoration.

**CTA "Nächster Termin" (Sektion 10):** Rose/pink Gradient-Shapes, animierte Kreise und Dreiecke.

**Salon-Partner Sektion:** Gold/rose SVG-Shapes passend zum bestehenden Gradient-Hintergrund.

**Stats Sektion:** Dezente animierte Kreise.

### Animations-Muster (wie zentime.io)
- `animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}` mit `duration: 8-12s, repeat: Infinity`
- SVG-Shapes als `motion.svg` mit easeInOut
- Opacity zwischen 5-15% — subtil, nicht dominant
- Farben: `#F43F5E` (rose), `#EC4899` (pink), `#C4A35A` (gold), `#8B7355` (bronze), `#9F7AEA` (violet) — wie im Footer

### Kein Einfluss auf
- Content, Layout, Bilder, Texte — alles bleibt gleich
- Nur dekorative Hintergrund-Layer werden hinzugefügt

