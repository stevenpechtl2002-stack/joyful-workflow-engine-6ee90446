

## Automatische API-Key-Erstellung bei Registrierung

### Was wird geaendert?
Bei jeder neuen Account-Registrierung soll automatisch ein API-Key fuer den Business-Kunden erstellt werden. Aktuell wird zwar ein Eintrag in der `customers`-Tabelle angelegt (durch den `handle_new_user`-Trigger), aber kein API-Key generiert.

### Umsetzung

**1. Datenbank-Trigger erweitern**
- Die bestehende Funktion `handle_new_user()` wird um einen zusaetzlichen INSERT in die `customer_api_keys`-Tabelle ergaenzt
- Der API-Key wird automatisch per `gen_random_uuid()` generiert
- Dies geschieht direkt nach dem Anlegen des `customers`-Eintrags

Neuer Abschnitt in `handle_new_user()`:
```text
-- Nach dem INSERT in customers:
INSERT INTO public.customer_api_keys (customer_id)
VALUES (NEW.id)
ON CONFLICT DO NOTHING;
```

Da die Spalte `api_key` bereits einen Default-Wert von `gen_random_uuid()` hat, wird automatisch ein eindeutiger Key erzeugt.

**2. RLS-Policy pruefen**
- Die `customer_api_keys`-Tabelle hat bereits korrekte RLS-Policies:
  - Nur der Besitzer kann seinen eigenen Key sehen (`SELECT`)
  - Nur der Besitzer kann seinen Key aktualisieren (`UPDATE`)
  - Admins haben vollen Zugriff (`ALL`)
- Es fehlt jedoch eine `INSERT`-Policy fuer den Trigger. Da `handle_new_user()` als `SECURITY DEFINER` laeuft, umgeht es RLS -- daher ist keine zusaetzliche Policy noetig.

**3. Bestehende Nutzer nachruestens**
- Ein einmaliges SQL-Statement erstellt API-Keys fuer alle bestehenden Kunden, die noch keinen haben:

```text
INSERT INTO customer_api_keys (customer_id)
SELECT id FROM customers
WHERE id NOT IN (SELECT customer_id FROM customer_api_keys);
```

### Was sich fuer den Nutzer aendert
- Nach der Registrierung ist auf der API-Einstellungen-Seite sofort ein API-Key sichtbar
- Der "Neuen Key generieren"-Button funktioniert weiterhin zum Erneuern
- Kein manueller Schritt mehr noetig

### Dateien die geaendert werden
- **Datenbank-Migration**: `handle_new_user()`-Funktion erweitern + Backfill bestehender Nutzer
- Keine Frontend-Aenderungen noetig (die API-Settings-Seite zeigt den Key bereits korrekt an)
