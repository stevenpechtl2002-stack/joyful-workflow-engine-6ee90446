

# Plan: Salon-Marktplatz mit Buchung & Kundenprofil

## Zusammenfassung
Der Storefront wird zu einem vollwertigen Salon-Marktplatz umgebaut mit Stadtfilter, Terminbuchung mit Zeitslot-Anzeige, Mitarbeiterauswahl, Zahlungsoptionen und einem Kundenprofil mit Favoriten und Buchungshistorie.

---

## Datenbank-Änderungen

### 1. Neue Spalten in `customers`
- `address TEXT` (Straße + Hausnummer)
- `city TEXT` (Stadt, für Filterung)
- `postal_code TEXT` (PLZ)

### 2. Neue Tabelle `customer_favorites`
- `id UUID PRIMARY KEY`
- `customer_user_id UUID NOT NULL` (der Endkunde)
- `salon_user_id UUID NOT NULL` (der Salon)
- `created_at TIMESTAMPTZ DEFAULT now()`
- UNIQUE constraint auf (customer_user_id, salon_user_id)
- RLS: Nutzer können eigene Favoriten lesen/erstellen/löschen

### 3. Neue Tabelle `storefront_bookings`
- `id UUID PRIMARY KEY`
- `customer_user_id UUID` (nullable, falls Gast)
- `salon_user_id UUID NOT NULL`
- `staff_member_id UUID`
- `product_id UUID`
- `booking_date DATE NOT NULL`
- `booking_time TIME NOT NULL`
- `end_time TIME`
- `customer_name TEXT NOT NULL`
- `customer_phone TEXT`
- `customer_email TEXT`
- `payment_method TEXT DEFAULT 'on_site'` (on_site | online)
- `payment_status TEXT DEFAULT 'pending'`
- `status TEXT DEFAULT 'pending'`
- `created_at TIMESTAMPTZ DEFAULT now()`
- RLS: Öffentliches INSERT erlaubt, Nutzer sehen eigene Buchungen

---

## Frontend-Änderungen

### 1. Onboarding anpassen (`SalonRegistration.tsx`)
- Adresse in separate Felder aufteilen: Straße, PLZ, Stadt
- Beim Speichern `address`, `city`, `postal_code` in `customers` schreiben
- Salon wird sofort im Storefront angezeigt (auch ohne `published = true`)

### 2. Storefront komplett umbauen (`Storefront.tsx`)
- **Salon-Liste statt Produkt-Liste**: Alle Salons aus `customers` laden (nicht nur veröffentlichte)
- **Stadtfilter**: Dropdown/Suchfeld oben, filtert nach `city`
- **Salon-Karten**: Name, Kategorie, Stadt, Bild anzeigen
- **Klick → Salon-Detail-Seite**

### 3. Neue Seite: Salon-Detail (`/storefront/:salonId`)
- Salon-Info (Name, Adresse, Beschreibung)
- Services/Produkte des Salons
- **Buchungsformular**:
  - Service-Auswahl (Dropdown)
  - Datumswahl
  - Verfügbare Zeitslots anzeigen (via `check-availability` Edge Function)
  - Mitarbeiter-Dropdown (aktive Mitarbeiter des Salons laden)
  - Zahlungsmethode: "Online vorab" oder "Vor Ort"
  - Kundendaten (Name, Telefon, E-Mail)
  - Buchung absenden → `storefront_bookings` + `reservations` erstellen

### 4. Neue Seite: Kundenprofil (`/storefront/profile`)
- Login/Registrierung für Endkunden
- Favoriten-Salons anzeigen (aus `customer_favorites`)
- Aktuelle und vergangene Buchungen (aus `storefront_bookings`)
- Favorit hinzufügen/entfernen (Herz-Icon auf Salon-Karten)

### 5. Edge Function: Salon-Daten öffentlich laden
- `list-connect-products` erweitern oder neue Function `list-salons`:
  - Alle Salons mit `company_name`, `city`, `address`, `category` laden
  - Öffentlich zugänglich (kein JWT)

### 6. Verfügbarkeits-Check für Storefront
- Bestehende `check-availability` Edge Function nutzen
- Erweitern um salon_user_id Parameter (damit Endkunden die Verfügbarkeit eines fremden Salons abfragen können)

---

## Routing (neue Routen)
```text
/storefront              → Salon-Marktplatz mit Stadtfilter
/storefront/:salonId     → Salon-Detail + Buchung
/storefront/profile      → Kundenprofil (Favoriten + Buchungen)
```

---

## Technische Details

### Verfügbarkeits-Abfrage für Buchung
Die bestehende `check-availability` Function prüft Schichten und Reservierungen. Sie muss erweitert werden, damit sie auch ohne Auth-Token funktioniert, stattdessen eine `salon_user_id` akzeptiert, um die Daten des richtigen Salons zu laden.

### Zahlungsoptionen
- **Vor Ort**: Buchung wird direkt erstellt mit `payment_method: 'on_site'`
- **Online vorab**: Stripe Checkout via bestehende Connect-Integration, nach Erfolg wird Buchung bestätigt

### Salon-Sichtbarkeit
Alle Salons werden angezeigt, unabhängig vom `published`-Status. Optional kann ein Badge "Neu" oder "In Vorbereitung" angezeigt werden für nicht-veröffentlichte Salons.

