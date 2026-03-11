

## Treatwell Gap Analysis — Was fehlt noch?

### Bereits implementiert
- Salon-Marktplatz mit Suche, Filtern, Kategorien, Sortierung
- Buchungsflow (Gast & Login, Service/Mitarbeiter/Zeitslot-Auswahl)
- Online-Zahlung (Stripe Connect) & Vor-Ort-Zahlung
- Salon-Profile (Mini-Website mit Tabs, Reviews, Team, Galerie)
- Kalender mit Wochenansicht & Mitarbeiter-Grid
- Dienstpläne & Schichtausnahmen
- CRM/Kontakte mit Buchungshistorie
- POS/Kassenbuch mit TSE-Signierung
- Kundenprofile mit Favoriten & Buchungsübersicht
- Stornierungsfristen & Pufferzeiten
- Rabatte/Aktionen
- Voice Agent Integration
- Email-Queue-Infrastruktur (DNS pending)

### Fehlende Features (Treatwell-Parität)

#### 1. Automatische E-Mail-Benachrichtigungen (Hoch)
Treatwell sendet automatisch:
- **Buchungsbestätigung** an Kunden nach Buchung
- **Terminerinnerung** (24h vorher)
- **Stornierungsbestätigung**
- **Salon-Benachrichtigung** bei neuer Buchung

**Plan:** Transaktionale E-Mail-Templates scaffolden (`scaffold_transactional_email`) für jeden Typ. Trigger in `storefront-book` und `create-storefront-checkout` Edge Functions einbauen, die E-Mails via `enqueue_email` in die Queue schreiben. Voraussetzung: DNS-Verifizierung für `notify.www.zentime.io` muss abgeschlossen sein.

#### 2. Kunden-Selbststornierung (Hoch)
Kunden können bei Treatwell selbst stornieren (innerhalb der Frist). Aktuell fehlt:
- Stornierungslink/Button in Buchungsbestätigungs-E-Mail
- Stornierungsseite für Kunden (`/storefront/cancel/:bookingId`)
- Frist-Prüfung gegen `cancellation_hours`

**Plan:** Neue Route `/storefront/cancel/:bookingId` mit Token-basierter Stornierung. Edge Function `storefront-cancel` prüft Frist und aktualisiert Status in `storefront_bookings` + `reservations`.

#### 3. Standortbasierte Suche (Mittel)
Treatwell zeigt Salons nach Entfernung. Aktuell nur Text-Suche nach Stadt.

**Plan:** `latitude`/`longitude` Spalten zur `customers`-Tabelle hinzufügen. Geocoding beim Speichern der Adresse (via externem Service oder manuell). Sortierung nach Entfernung im `list-salons` Edge Function.

#### 4. Kunden-Buchungshistorie im Profil (Bereits teilweise vorhanden)
Existiert bereits in `CustomerProfile.tsx` — Past Bookings werden angezeigt. Fehlend: Service-Name und Salon-Details in der Buchungsliste.

**Plan:** `storefront_bookings` Query in CustomerProfile um JOINs zu `products.name` und `customers.company_name` erweitern (via Edge Function).

#### 5. Mehrere Bilder/Galerie pro Salon (Bereits vorhanden)
Salon-Galerie existiert bereits über `salon_images` + `SalonImageManager`.

---

### Empfohlene Reihenfolge
1. **E-Mail-Benachrichtigungen** — Buchungsbestätigungen sind das wichtigste fehlende Feature
2. **Kunden-Selbststornierung** — Direkt verbunden mit E-Mails (Stornierungslink)
3. **Standortbasierte Suche** — Nice-to-have für Marketplace-Wachstum
4. **Buchungshistorie verbessern** — Kleiner UX-Fix

### Zusammenfassung
Die Kernfunktionalität ist zu ~85% Treatwell-konform. Die zwei kritischsten Lücken sind **automatische E-Mail-Benachrichtigungen** (Buchungsbestätigung + Erinnerung) und **Kunden-Selbststornierung**. Beides hängt von der DNS-Verifizierung für `notify.www.zentime.io` ab.

