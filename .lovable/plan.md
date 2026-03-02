

## Plan: Vollständiges Salon-Profil-Management (Treatwell-Style)

### Überblick
Das Salon-Marktplatzprofil wird zu einer vollständig konfigurierbaren "Mini-Website" erweitert, wie bei Treatwell. Salon-Besitzer können im Portal alle Profildetails bearbeiten, die dann auf der öffentlichen Detailseite (`/storefront/:salonId`) angezeigt werden.

### Datenbank-Änderungen

**Neue Spalten in `customers`-Tabelle:**
- `website_url` (text) – Salon-Website
- `instagram_url` (text) – Instagram-Link
- `facebook_url` (text) – Facebook-Link
- `phone` (text) – Salon-Telefonnummer
- `cover_image_url` (text) – Hervorgehobenes Cover-Bild
- `logo_url` (text) – Salon-Logo/Profilbild

**Neuer Storage Bucket:**
- `salon-logos` (public) – für Profilbilder/Logos

### Neuer Portal-Bereich: "Mein Salon-Profil" (eigene Seite)

Statt das Salon-Profil-Management unten auf der Profil-Seite zu verstecken, wird eine eigene Portal-Seite `/portal/salon-profile` erstellt mit folgenden editierbaren Sektionen:

1. **Profilbild & Logo** – Upload mit Vorschau (klickbar)
2. **Cover-Bild** – Auswahl aus hochgeladenen Salon-Bildern oder separater Upload
3. **Salon-Name** (company_name), Kategorie, Beschreibung
4. **Kontaktdaten** – Telefon, Adresse, PLZ, Stadt
5. **Social Media Links** – Website, Instagram, Facebook
6. **Galerie-Manager** – Bilder hochladen, löschen, sortieren (vorhandener SalonImageManager)
7. **Live-Vorschau-Button** – Link zur öffentlichen Profilseite

### Öffentliche Salon-Detailseite erweitern

Die bestehende `SalonDetail.tsx` wird erweitert um:
- Salon-Logo/Profilbild neben dem Namen
- Social Media Links im Info-Tab
- Cover-Bild als Hero-Banner
- Kontaktdaten (Telefon, Website)

### Edge Function Update

`storefront-salon-detail` gibt zusätzlich die neuen Felder zurück: `phone`, `website_url`, `instagram_url`, `facebook_url`, `logo_url`, `cover_image_url`.

### Sidebar-Navigation

Neuer Eintrag "Salon-Profil" in der Portal-Sidebar mit Store-Icon.

### Zusammenfassung der Dateien

| Aktion | Datei |
|--------|-------|
| Neu | `src/pages/portal/SalonProfile.tsx` |
| Ändern | `src/components/portal/PortalSidebar.tsx` (neuer Menüpunkt) |
| Ändern | `src/App.tsx` (neue Route) |
| Ändern | `src/pages/SalonDetail.tsx` (Logo, Social, Kontakt) |
| Ändern | `supabase/functions/storefront-salon-detail/index.ts` (neue Felder) |
| Ändern | `src/pages/portal/Profile.tsx` (SalonImageManager entfernen) |
| Migration | Neue Spalten + Storage Bucket |

