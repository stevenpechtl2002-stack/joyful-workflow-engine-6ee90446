

## Plan: POS-Abschluss-Workflow mit TSE-Signatur

### Übersicht
Erweiterung des Termin-Detail-Dialogs im Kalender um einen Treatwell-ähnlichen POS-Abschluss mit Zahlungsart-Auswahl und TSE-Signatur über fiskaly.

### 1. Datenbank-Migration

Neue Spalten zur `reservations`-Tabelle:
- `payment_method` (text, nullable): `'online'`, `'card'`, `'cash'`
- `payment_status` (text, default `'pending'`): `'pending'`, `'paid'`, `'refunded'`
- `tse_transaction_id` (text, nullable)
- `tse_signature` (text, nullable)
- `tse_timestamp` (timestamptz, nullable)

### 2. Edge Function: `pos-checkout`

Neue Edge Function `supabase/functions/pos-checkout/index.ts`:
- Empfängt `reservation_id`, `payment_method`
- Validiert die Reservierung (muss dem User gehören, darf nicht bereits abgeschlossen sein)
- Ruft fiskaly TSE API auf um eine signierte Transaktion zu erstellen
- Speichert TSE-Daten (`tse_transaction_id`, `tse_signature`, `tse_timestamp`) in der Reservierung
- Setzt `status = 'completed'`, `payment_method`, `payment_status = 'paid'`
- Erstellt automatisch einen Eintrag in der `transactions`-Tabelle (für das Kassenbuch)

Benötigter Secret: `FISKALY_API_KEY` und `FISKALY_API_SECRET` (oder ein kombinierter Token) -- muss vom User bereitgestellt werden.

### 3. UI: Termin-Detail-Dialog erweitern

Im bestehenden Detail-Dialog in `StaffCalendarView.tsx` (Zeilen 680-764) wird zwischen den Termin-Details und den Buttons ein neuer POS-Bereich eingefügt:

**Nur sichtbar wenn `status !== 'completed'` und `status !== 'cancelled'`:**

```text
┌─────────────────────────────┐
│  Zahlungsart wählen         │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │Online│ │Karte│ │ Bar │   │
│  │  💳  │ │  📱 │ │ 💶  │   │
│  └─────┘ └─────┘ └─────┘   │
│                             │
│  ┌─────────────────────┐    │
│  │   ABSCHLIESSEN      │    │
│  └─────────────────────┘    │
└─────────────────────────────┘
```

- 3 Radio-Button-artige Kacheln für die Zahlungsart
- "Online bezahlt" ist vorausgewählt wenn `source === 'storefront'` und Stripe-Zahlung vorhanden
- Großer grüner "ABSCHLIESSEN" Button
- Bei Klick: Edge Function aufrufen, Loading-State, Erfolgs-Toast
- Nach Abschluss: Dialog zeigt "Abgeschlossen" Badge, Buttons verschwinden

**Wenn `status === 'completed'`:** Zeigt Zahlungsart und TSE-Signatur als Info an.

### 4. Secrets

Bevor die fiskaly-Integration funktioniert, werden `FISKALY_API_KEY` und `FISKALY_API_SECRET` als Secrets benötigt. Der User wird aufgefordert, diese bereitzustellen.

### 5. Bestehender Stripe-Flow

Keinerlei Änderungen an `create-storefront-checkout`, `stripe-connect-webhook` oder dem Online-Zahlungsfluss. Der POS-Workflow ist rein additiv.

### Dateien die geändert/erstellt werden

| Datei | Aktion |
|---|---|
| Migration SQL | Neue Spalten auf `reservations` |
| `supabase/functions/pos-checkout/index.ts` | Neue Edge Function |
| `supabase/config.toml` | `verify_jwt = false` für pos-checkout (wird automatisch aktualisiert) |
| `src/components/zenbook/StaffCalendarView.tsx` | POS-UI im Detail-Dialog |
| `src/hooks/useReservations.ts` | Interface um neue Felder erweitern |

