

## Plan: Stripe auf Live-Modus umstellen

### Problem
Der `STRIPE_SECRET_KEY` ist ein Test-Key. Dadurch werden Express-Accounts im Test-Modus erstellt und das Onboarding zeigt "Testkonto mit Testdaten".

### Schritte

**Schritt 1: Live Secret Key setzen**
- Den `STRIPE_SECRET_KEY` auf den Live-Key (`sk_live_...`) aktualisieren
- Zu finden im Stripe Dashboard unter Developers -> API Keys (Live-Modus aktiviert)

**Schritt 2: Alten Test-Account aus DB entfernen**
- SQL-Migration: `UPDATE customers SET stripe_account_id = NULL WHERE stripe_account_id IS NOT NULL;`
- Damit wird beim naechsten "Mit Stripe verbinden" ein neuer Express-Account im Live-Modus erstellt

### Wichtig
- Der Live-Key muss mit `sk_live_` beginnen (nicht `sk_test_`, nicht `rk_test_`, nicht `rk_live_`)
- Nach dem Wechsel muessen alle Salons sich erneut mit Stripe verbinden

