

## Plan: Hero-Bild natürlicher + Sale-Button knallrot

### Änderungen

1. **`src/components/zenbook/LandingPage.tsx`** (Hero Background, Zeile 153-160):
   - Overlay von `from-background via-background/90 to-background/40` zu `from-background/70 via-background/50 to-transparent` ändern — weniger milchig, Bild kommt natürlicher durch
   - Bild-Opacity nicht einschränken (bleibt `object-cover` ohne extra Opacity)

2. **`src/components/zenbook/LandingPage.tsx`** (Sale % Button, Zeile 131-141):
   - Den "Sale %" Kategorie-Button knallrot stylen: `bg-red-600 text-white` mit hover-Effekt

3. **`src/components/HeroSection.tsx`** (Zeile 15-18):
   - Auch hier die Overlays reduzieren: `from-background/60 via-background/40 to-background` und `from-background/50 via-transparent to-background/60` — damit das hero-ai.png Bild satter und farbiger durchscheint

