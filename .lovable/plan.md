

## Plan: Footer mit farbigem Muster (Treatwell-Stil)

Der Footer bekommt einen korallroten/pink Hintergrund mit dekorativen geometrischen Formen (Dreiecke, Kreise) — ähnlich dem Treatwell-Screenshot aber mit eigenem Muster passend zum ZenTime-Design.

### Änderungen in `src/components/Footer.tsx`

1. **Hintergrundfarbe**: Von `bg-card` zu einem Coral/Pink-Gradient (`bg-gradient-to-br from-rose-400 via-pink-400 to-rose-500`)
2. **Dekorative SVG-Shapes**: Absolute positionierte geometrische Elemente im Hintergrund:
   - Ein großes abgerundetes Dreieck (halbtransparent, leicht versetzt) unten rechts
   - Ein Kreis/Ellipse oben links
   - Diagonale Streifen oder Wellen als Akzent
   - Farben: gedämpftes Gold/Olive + dunkleres Pink (ähnlich dem Screenshot)
3. **Textfarben anpassen**: Alle Texte auf `text-white` bzw. `text-white/70` umstellen, da der Hintergrund jetzt dunkel/farbig ist
4. **Links**: Hover-Effekt auf `hover:text-white` statt `hover:text-primary`
5. **Logo**: Der "Z"-Badge bleibt, aber Text wird weiß
6. **Trennlinie**: `border-white/20` statt `border-border/50`
7. **Social Icons**: Weiß mit hover-Effekt

