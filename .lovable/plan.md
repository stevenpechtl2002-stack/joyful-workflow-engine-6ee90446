

## Plan: KI Smart Setup - Website/Treatwell Import

Ein neuer "Smart Setup" Schritt im Salon-Onboarding, bei dem der Nutzer seine Website- oder Treatwell-URL eingibt. Das System scrapt die Seite, extrahiert alle relevanten Infos per KI und füllt automatisch Salon-Name, Beschreibung, Kategorie, Adresse, Services (mit Preisen & Dauer) aus.

### Architektur

```text
[User gibt URL ein]
       ↓
[Edge Function: smart-import]
       ↓
[Firecrawl: Seite scrapen → Markdown]
       ↓
[Lovable AI (Gemini): Strukturierte Daten extrahieren]
       ↓
[JSON Response: name, description, category, address, services[]]
       ↓
[Frontend: Felder vorausfüllen, User bestätigt]
```

### Voraussetzungen

- **Firecrawl Connector** muss verbunden sein (zum Scrapen der Website/Treatwell-Seite)
- **Lovable AI** ist bereits verfügbar (LOVABLE_API_KEY vorhanden)

### Änderungen

**1. Firecrawl Connector verbinden**
- Prüfen ob Firecrawl bereits verbunden ist, ggf. User auffordern

**2. Neue Edge Function: `supabase/functions/smart-import/index.ts`**
- Nimmt URL entgegen
- Scrapt die Seite via Firecrawl API (Markdown-Format)
- Sendet Markdown an Lovable AI mit Tool-Calling, um strukturierte Daten zu extrahieren:
  - `salon_name`, `description`, `category`, `address`, `city`, `postal_code`, `phone`, `website_url`
  - `services[]` mit `name`, `duration_minutes`, `price`, `category`
- Gibt strukturiertes JSON zurück

**3. `src/components/zenbook/SalonRegistration.tsx` erweitern**
- Im Step 1 einen neuen Bereich oben: "Smart Setup" mit URL-Eingabefeld und "KI Import starten" Button
- Bei Klick: Edge Function aufrufen, Ladeanimation zeigen
- Ergebnis in `formData` und `services` einfüllen
- User kann alle vorausgefüllten Felder noch anpassen bevor er weitergeht

**4. `supabase/config.toml` aktualisieren**
- Neue Function `smart-import` mit `verify_jwt = false`

### UI-Flow

Step 1 bekommt oben ein auffälliges Banner:
- Sparkles-Icon + "KI Smart Setup"
- URL-Eingabefeld (Placeholder: "Website-URL oder Treatwell-Profil einfügen")
- Button "Automatisch ausfüllen"
- Loading-State mit Fortschrittsanzeige
- Nach Import: Alle Felder sind ausgefüllt, grüner Hinweis "X Infos importiert"

