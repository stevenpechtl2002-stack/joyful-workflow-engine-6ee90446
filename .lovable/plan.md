

## Plan: Salon-URLs mit Namen statt IDs

Aktuell: `/storefront/abc-123-uuid` → Neu: `/salon/salonname` (oder `/storefront/salonname`)

### Ansatz: Slug-Feld in der `customers`-Tabelle

1. **Neues Feld `slug`** in der `customers`-Tabelle (unique, text). Wird aus `company_name` generiert (lowercase, Umlaute ersetzen, Sonderzeichen entfernen, Leerzeichen zu Bindestrichen).

2. **Edge Function `storefront-salon-detail`** erweitern: Neben `salon_id` auch `slug` als Lookup akzeptieren. Wenn `slug` übergeben wird, wird der Salon per Slug gesucht.

3. **Edge Function `list-salons`** erweitern: Slug im Response mitsenden, damit die Storefront den Slug für Links nutzen kann.

4. **Route ändern**: `/storefront/:salonId` bleibt bestehen, akzeptiert jetzt aber auch Slugs. SalonDetail.tsx prüft ob der Parameter ein UUID oder ein Slug ist und ruft die Edge Function entsprechend auf.

5. **Storefront.tsx**: Links ändern von `/storefront/${salon.id}` zu `/storefront/${salon.slug || salon.id}`.

6. **Slug-Generierung**: Beim Speichern des Salon-Profils (SalonRegistration / SalonProfile) wird automatisch ein Slug generiert. Bestehende Salons bekommen per Migration einen Slug aus ihrem `company_name`.

### Technische Details

**Migration:**
- `ALTER TABLE customers ADD COLUMN slug text UNIQUE;`
- Update bestehende Salons: Slug aus company_name generieren
- Slug-Format: `mein-salon-berlin` (lowercase, keine Umlaute, keine Sonderzeichen)

**Dateien:**
- `supabase/functions/storefront-salon-detail/index.ts` — Slug-Lookup hinzufügen
- `supabase/functions/list-salons/index.ts` — Slug im Response
- `src/pages/SalonDetail.tsx` — Slug statt UUID an Edge Function senden
- `src/pages/Storefront.tsx` — Links mit Slug
- `src/components/zenbook/SalonRegistration.tsx` — Slug beim Erstellen generieren
- `src/pages/portal/SalonProfile.tsx` — Slug beim Update generieren

