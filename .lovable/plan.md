

# Stripe Connect Express Integration -- Provision bei jeder Buchung

## Zusammenfassung

Statt dass Salon-Besitzer nur ein normales Stripe-Konto verbinden, wird **Stripe Connect** mit **Express Accounts** genutzt. Jeder Salon erstellt beim Onboarding (Schritt 4) ein Express-Konto. Du als Plattform-Betreiber kannst dann bei jeder Zahlung automatisch eine Provision (Application Fee) einbehalten.

## Wie Stripe Connect funktioniert

```text
Endkunde zahlt 50€
       │
       ▼
┌─────────────────────┐
│  Deine Plattform    │ ◄── Behält z.B. 10% = 5€ (Application Fee)
│  (Stripe Connect)   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Salon Express-Konto│ ◄── Erhält 45€
└─────────────────────┘
```

## Datenbankänderungen

Neue Spalte auf `customers`-Tabelle:
- `stripe_account_id` (text, nullable) -- speichert die Stripe Express Account ID (z.B. `acct_xxx`)

## Neue Edge Functions

### 1. `create-connect-account` (NEU)
- Erstellt ein Stripe Express Account für den Salon-Besitzer
- Generiert einen Account Link (Onboarding-URL) wo der Salon seine Daten eingibt
- Speichert die `stripe_account_id` in der `customers`-Tabelle
- Redirect nach Abschluss zurück zur App

### 2. `check-connect-status` (NEU)
- Prüft ob das Express-Konto vollständig verifiziert ist (`charges_enabled`, `payouts_enabled`)
- Wird im Onboarding-Schritt 4 aufgerufen um den Status anzuzeigen

### 3. `create-connect-checkout` (NEU, optional für Kundenbuchungen)
- Erstellt eine Checkout Session mit `application_fee_amount` für deine Provision
- Nutzt `stripe_account_id` des Salons als Connected Account
- Beispiel: Bei 50€ Buchung behältst du 5€ (10%) als Plattform-Gebühr

## Änderungen am Onboarding (Schritt 4)

Der bestehende Stripe-Schritt wird umgebaut:
- **Statt** "checkout session für Abo erstellen" → **Jetzt** "Express Account erstellen und onboarden"
- Button: "Stripe-Konto verbinden" → ruft `create-connect-account` auf → leitet zur Stripe-Onboarding-Seite weiter
- Status-Check: Prüft ob `charges_enabled` und `payouts_enabled` aktiv sind
- Grüner Haken wenn vollständig verbunden

## Bestehende Checkout-Funktion

Die bestehende `create-checkout` Edge Function für dein SaaS-Abo (Setup-Fee + Monatsabo) bleibt **separat** bestehen. Stripe Connect ist für die Salon-Zahlungen, das Abo ist für deine Plattform-Gebühr.

## Dateien

| Datei | Aktion |
|---|---|
| `supabase/migrations/` | Migration: `stripe_account_id` auf `customers` |
| `supabase/functions/create-connect-account/index.ts` | NEU: Express Account erstellen + Account Link |
| `supabase/functions/check-connect-status/index.ts` | NEU: Verifizierungsstatus prüfen |
| `src/components/zenbook/SalonRegistration.tsx` | Schritt 4 umbauen: Connect statt Checkout |
| `supabase/config.toml` | JWT-Config für neue Functions |

## Provisions-Modell

Die Application Fee (deine Provision) wird erst relevant wenn Endkunden buchen und bezahlen. Dafür brauchst du später eine weitere Edge Function (`create-connect-checkout`) die bei Buchungen die Zahlung mit `application_fee_amount` erstellt. Das ist ein separater Schritt nach dem Onboarding.

## Voraussetzung

Stripe Connect muss in deinem Stripe Dashboard aktiviert sein (Platform Settings). Express Accounts erfordern keine zusätzlichen API-Keys -- der bestehende `STRIPE_SECRET_KEY` reicht.

