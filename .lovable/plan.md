

## Plan: Stripe Connect Status-Pruefung reparieren

### Problem-Analyse

1. **Live Key + Test-Modus Konflikt**: Der gespeicherte `STRIPE_SECRET_KEY` ist ein Live-Key (`sk_live_...`). Wenn du im Stripe Dashboard den Test-Modus verwendest, werden Test-Express-Accounts erstellt, die der Live-Key nicht sehen kann. Die `check-connect-status` Funktion gibt dann `connected: false` zurueck.

2. **Geloeschte Return-URL**: Die Onboarding-Return-URLs im `create-connect-account` Edge Function zeigen auf `/portal/subscriptions`, die geloescht wurde. Das muss auf `/portal/dashboard` oder eine andere existierende Seite geaendert werden.

3. **Kein User-Feedback**: Wenn der Status-Check ergibt, dass die Verbindung noch nicht aktiv ist, bekommt der User keine Meldung.

### Loesung

**Schritt 1: Entscheide dich fuer Test ODER Live**
- Wenn du im **Test-Modus** arbeiten willst: Der `STRIPE_SECRET_KEY` muss auf einen Test-Key (`sk_test_...`) zurueckgesetzt werden
- Wenn du **Live** gehen willst: Erstelle den Express-Account im Live-Modus (Test-Toggle im Stripe Dashboard ausschalten)

**Schritt 2: `create-connect-account/index.ts`** - Default Return-URLs aendern:
- Zeile 85-86: `/portal/subscriptions` ersetzen durch `/portal/dashboard`

**Schritt 3: `src/components/zenbook/SalonRegistration.tsx`** - Return-URLs aendern:
- Zeile 165-166: `/portal/subscriptions` ersetzen durch `/portal/dashboard`
- Zeile 145-150: Toast-Nachricht hinzufuegen wenn Status-Check negativ ist, damit der User Feedback bekommt (z.B. "Stripe-Verbindung noch nicht abgeschlossen")

### Technische Details

Die `check-connect-status` Edge Function fragt `customers.stripe_account_id` ab und prueft dann bei Stripe ob `charges_enabled` und `payouts_enabled` aktiv sind. Bei einem Test-Account mit Live-Key schlaegt `stripeClient.accounts.retrieve()` fehl, weil der Account nicht existiert.

