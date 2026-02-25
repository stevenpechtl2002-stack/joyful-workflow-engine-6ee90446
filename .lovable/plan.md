

# Stripe Connect V2 Integration -- Full Platform with Storefront

## Summary

Upgrade the existing Stripe Connect integration from the V1 API to the **V2 Accounts API**, add product creation at platform level, build a public storefront displaying all salons and their products, and process payments using **Destination Charges** with application fees. Also add a webhook handler for account requirement updates.

## Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
├──────────┬──────────┬──────────────┬────────────────────┤
│ Onboard  │ Create   │  Storefront  │ Webhook Status     │
│ Connect  │ Products │  (Public)    │ Display            │
│ Account  │          │              │                    │
└────┬─────┴────┬─────┴──────┬───────┴────────┬───────────┘
     │          │            │                │
     ▼          ▼            ▼                ▼
┌──────────┐┌──────────┐┌───────────┐┌──────────────────┐
│create-   ││create-   ││create-    ││stripe-connect-   │
│connect-  ││connect-  ││connect-   ││webhook           │
│account   ││product   ││checkout   ││                  │
│(V2 API)  ││          ││           ││                  │
└──────────┘└──────────┘└───────────┘└──────────────────┘
```

## Database Changes

### New table: `connect_products`
Stores products created at platform level, mapping each to a connected account.

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | default gen_random_uuid() |
| user_id | uuid | The salon owner who created it |
| stripe_product_id | text | Stripe product ID (prod_xxx) |
| stripe_price_id | text | Stripe price ID (price_xxx) |
| name | text | Product name |
| description | text | nullable |
| price_cents | integer | Price in cents |
| currency | text | default 'eur' |
| is_active | boolean | default true |
| created_at | timestamptz | default now() |

RLS: Users can read/insert/update their own rows. Public read for active products (storefront).

## Edge Functions

### 1. `create-connect-account` (REWRITE)
- Switch from V1 `stripe.accounts.create({ type: 'express' })` to **V2 API**: `stripeClient.v2.core.accounts.create(...)` with `dashboard: 'express'`, `fees_collector: 'application'`, `losses_collector: 'application'`, and `stripe_transfers` capability
- Use `stripeClient.v2.core.accountLinks.create(...)` with `use_case.type: 'account_onboarding'`
- Save `stripe_account_id` to `customers` table
- Detailed code comments on every step

### 2. `check-connect-status` (REWRITE)
- Use V2 API: `stripeClient.v2.core.accounts.retrieve(accountId, { include: ['configuration.recipient', 'requirements'] })`
- Check `configuration.recipient.capabilities.stripe_balance.stripe_transfers.status === 'active'`
- Check `requirements.summary.minimum_deadline.status` for onboarding completeness
- Return structured status object

### 3. `create-connect-product` (NEW)
- Creates a Stripe product at platform level using `stripeClient.products.create(...)` with `default_price_data`
- Stores mapping in `connect_products` table with `stripe_product_id`, `stripe_price_id`, and `user_id` (connected account owner)
- Stores connected account ID in product metadata

### 4. `create-connect-checkout` (NEW)
- Creates a Checkout Session using **Destination Charges**:
  ```js
  stripeClient.checkout.sessions.create({
    line_items: [{ price_data: ..., quantity: 1 }],
    payment_intent_data: {
      application_fee_amount: calculatedFee,
      transfer_data: { destination: connectedAccountId },
    },
    mode: 'payment',
    success_url: ...,
  })
  ```
- Looks up product from `connect_products` table to get connected account ID
- Calculates 10% application fee

### 5. `stripe-connect-webhook` (NEW)
- Parses thin events using `stripeClient.parseThinEvent(body, sig, webhookSecret)`
- Fetches full event via `stripeClient.v2.core.events.retrieve(thinEvent.id)`
- Handles:
  - `v2.core.account[requirements].updated` -- logs requirement changes
  - `v2.core.account[.recipient].capability_status_updated` -- logs capability updates
- Placeholder for webhook secret with helpful error message
- `verify_jwt = false` in config.toml

### 6. `list-connect-products` (NEW)
- Public endpoint (verify_jwt = false) that queries `connect_products` joined with `customers` to return all active products with salon info for the storefront

## Frontend Components

### 1. Update `SalonRegistration.tsx` Step 4
- Replace current Stripe Connect logic with V2 API calls
- Show real-time onboarding status from `check-connect-status` (V2 response fields)
- "Onboard to collect payments" button

### 2. New: Product Creation UI (in portal)
- Add "Produkte (Stripe)" nav item or section within existing Services view
- Form: name, description, price (EUR)
- Calls `create-connect-product` edge function
- Lists existing connect products

### 3. New: Storefront Page (`/storefront`)
- Public page, no auth required
- Fetches all active products via `list-connect-products`
- Groups by salon (connected account)
- Each product has a "Buy" button that calls `create-connect-checkout`
- Clean design matching ZenTime purple/pink style
- Add route in `App.tsx`

### 4. Success Page (`/success`)
- Simple confirmation page after checkout
- Add route in `App.tsx`

## Config Changes

### `supabase/config.toml`
Add entries for all new functions:
```toml
[functions.create-connect-product]
verify_jwt = false

[functions.create-connect-checkout]
verify_jwt = false

[functions.list-connect-products]
verify_jwt = false

[functions.stripe-connect-webhook]
verify_jwt = false
```

## Files Summary

| File | Action |
|---|---|
| `supabase/migrations/` | New migration: `connect_products` table with RLS |
| `supabase/functions/create-connect-account/index.ts` | Rewrite: V2 Accounts API |
| `supabase/functions/check-connect-status/index.ts` | Rewrite: V2 Accounts retrieve |
| `supabase/functions/create-connect-product/index.ts` | NEW: Create product at platform level |
| `supabase/functions/create-connect-checkout/index.ts` | NEW: Destination charge checkout |
| `supabase/functions/list-connect-products/index.ts` | NEW: Public product listing |
| `supabase/functions/stripe-connect-webhook/index.ts` | NEW: Thin event webhook handler |
| `supabase/config.toml` | Add new function configs |
| `src/components/zenbook/SalonRegistration.tsx` | Update Step 4 for V2 status |
| `src/components/zenbook/ConnectProducts.tsx` | NEW: Product creation UI |
| `src/pages/Storefront.tsx` | NEW: Public storefront |
| `src/pages/CheckoutSuccess.tsx` | NEW: Success page |
| `src/App.tsx` | Add `/storefront` and `/success` routes |
| `src/components/zenbook/ZenBookApp.tsx` | Add connect products nav item |
| `src/types/index.ts` | Add `ConnectProduct` type |

## Webhook Setup Note

The `stripe-connect-webhook` function requires a `STRIPE_CONNECT_WEBHOOK_SECRET` to verify thin events. After deployment, the user must:
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add destination for Connected accounts
3. Select thin payload style
4. Select `v2.core.account[requirements].updated` and capability status events
5. Point to the deployed function URL
6. Copy the webhook signing secret

The code will include a placeholder with a helpful error message if the secret is missing.

## Technical Notes

- All Stripe calls use `const stripeClient = new Stripe(stripeKey)` pattern (client instance)
- No `apiVersion` specified -- SDK uses latest automatically
- V2 API uses `stripeClient.v2.core.accounts.*` namespace
- Products use V1 API (`stripeClient.products.create`) since V2 products API is not available
- Checkout uses V1 API with destination charges
- All edge functions include detailed code comments explaining each step
- Missing values marked with `// PLACEHOLDER:` comments and runtime errors

