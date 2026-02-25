

# Plan: Stripe Connect V1 Fallback -- Stabile Produkterstellung und Provisionsflow

## Problem

Die V2 Accounts API (`stripeClient.v2.core.accounts.create`) funktioniert nicht zuverlässig in der Deno/Supabase Edge Functions Umgebung. Die wiederholten `Cannot read properties of undefined` Fehler zeigen, dass der V2 Namespace im npm-Paket nicht korrekt gebundelt wird.

## Lösung

Umstellung von V2 auf die bewährte **V1 Express Accounts API**, die stabil und vollständig unterstützt wird. Der gesamte Flow bleibt identisch:

1. Salon registriert sich und verbindet Stripe (Express Account)
2. Salon erstellt Produkte im Dashboard
3. Kunde kauft im Storefront
4. Zahlung geht über Destination Charges mit 10% Provision an die Plattform

## Änderungen

### 1. `create-connect-account/index.ts` -- Rewrite zu V1

Ersetze den V2 Aufruf durch die stabile V1 API:

```js
// V1 Express Account (statt V2)
const account = await stripeClient.accounts.create({
  type: 'express',
  country: 'de',
  email: user.email,
  capabilities: {
    card_payments: { requested: true },
    transfers: { requested: true },
  },
  business_profile: {
    name: customer?.company_name || undefined,
  },
});

// V1 Account Link (statt V2)
const accountLink = await stripeClient.accountLinks.create({
  account: accountId,
  type: 'account_onboarding',
  refresh_url: refreshUrl,
  return_url: returnUrl,
});
```

### 2. `check-connect-status/index.ts` -- Rewrite zu V1

Ersetze den V2 Retrieve durch die stabile V1 API:

```js
const account = await stripeClient.accounts.retrieve(accountId);
// Prüfe: account.charges_enabled, account.payouts_enabled, account.details_submitted
```

### 3. `create-connect-product/index.ts` -- Keine Änderung nötig

Nutzt bereits V1 `stripeClient.products.create()` -- funktioniert korrekt.

### 4. `create-connect-checkout/index.ts` -- Keine Änderung nötig

Nutzt bereits V1 Checkout Sessions mit Destination Charges -- funktioniert korrekt.

### 5. `stripe-connect-webhook/index.ts` -- Vereinfachen zu V1

Ersetze `parseThinEvent` durch Standard-Webhook-Verifikation mit `stripeClient.webhooks.constructEvent()`.

## Dateien

| Datei | Aktion |
|---|---|
| `supabase/functions/create-connect-account/index.ts` | Rewrite: V1 Express API |
| `supabase/functions/check-connect-status/index.ts` | Rewrite: V1 accounts.retrieve |
| `supabase/functions/stripe-connect-webhook/index.ts` | Vereinfachen: V1 webhooks |

Die restlichen Dateien (`create-connect-product`, `create-connect-checkout`, `list-connect-products`, `ConnectProducts.tsx`, `Storefront.tsx`, `CheckoutSuccess.tsx`) bleiben unverändert -- sie funktionieren bereits korrekt.

## Flow nach Implementierung

```text
Salon Dashboard                    Storefront (Kunde)
     │                                    │
     ├─ Stripe verbinden (V1 Express)     │
     ├─ Produkt erstellen ───────────────►│ Produkt sichtbar
     │                                    ├─ "Kaufen" klicken
     │                                    ├─ Checkout Session
     │                                    │   (Destination Charge)
     │                                    │
     │                              Stripe verarbeitet:
     │                              ├─ 90% → Salon (Connected Account)
     │                              └─ 10% → Plattform (Application Fee)
```

