

## Plan: Rabatt-System mit Storefront-Integration

### 1. Datenbank: Neue `discounts` Tabelle erstellen
Neue Tabelle mit folgenden Spalten:
- `id` (uuid, PK)
- `user_id` (uuid, Salon-Besitzer)
- `name` (text, z.B. "Frühlings-Rabatt")
- `discount_type` (text: 'percentage' oder 'fixed')
- `discount_value` (numeric, z.B. 20 für 20% oder 10 für 10€)
- `applies_to` (text: 'all', 'product', 'category')
- `product_id` (uuid, nullable, wenn applies_to = 'product')
- `category` (text, nullable, wenn applies_to = 'category')
- `valid_from` (date)
- `valid_until` (date)
- `is_active` (boolean, default true)
- `created_at` (timestamptz)

RLS-Policies: Salon-Besitzer CRUD auf eigene Rabatte, öffentlich lesbar für aktive Rabatte (für Storefront).

### 2. ViewType & Navigation erweitern
- `src/types/index.ts`: `'discounts'` zum `ViewType` hinzufügen
- `src/components/zenbook/ZenBookApp.tsx`: Neuen Nav-Item "Rabatte" mit `Percent`-Icon einfügen (vor "Profil"), und Rendering der neuen Komponente bei `currentView === 'discounts'`

### 3. Neue Komponente: `src/components/zenbook/DiscountManagement.tsx`
Formular zum Erstellen/Bearbeiten/Löschen von Rabatten:
- Name, Rabatt-Typ (Prozent/Fest), Wert
- Gilt für: Alle Services / Bestimmtes Produkt / Kategorie
- Gültig von/bis Datum
- Aktiv-Toggle
- Liste aller eigenen Rabatte mit Bearbeiten/Löschen

### 4. Storefront: Rabatte auf der Startseite anzeigen
- `src/pages/Storefront.tsx`: Neuer "Aktuelle Angebote" Bereich über den Salon-Karten
- Aktive, nicht abgelaufene Rabatte aus der DB laden (mit Salon-Name)
- Als auffällige Banner/Cards mit Rabatt-Prozent, Salon-Name und Gültigkeit anzeigen
- Klick navigiert zur Salon-Detailseite

### 5. Uploaded Image als Navigations-Icon für "Profil"
Das hochgeladene Bild wird als Icon/Avatar für den "Profil"-Menüpunkt in der Sidebar verwendet (anstelle des Store-Icons).

### Technische Details

**Migration SQL:**
```sql
CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage',
  discount_value numeric NOT NULL DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'all',
  product_id uuid,
  category text,
  valid_from date NOT NULL,
  valid_until date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Owner CRUD
CREATE POLICY "Users can manage own discounts" ON public.discounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public read for active discounts
CREATE POLICY "Anyone can view active discounts" ON public.discounts FOR SELECT USING (is_active = true AND valid_until >= CURRENT_DATE);

-- Admin
CREATE POLICY "Admins can manage all discounts" ON public.discounts FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
```

**Dateien die geändert/erstellt werden:**
- `src/types/index.ts` — ViewType erweitern
- `src/components/zenbook/ZenBookApp.tsx` — Nav-Item + Rendering + Bild-Import
- `src/components/zenbook/DiscountManagement.tsx` — Neue Komponente
- `src/pages/Storefront.tsx` — Rabatt-Sektion
- `supabase/functions/list-salons/index.ts` — Optional: Rabatte mit zurückgeben
- Bild kopieren nach `src/assets/` für Profil-Icon

