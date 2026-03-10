

## Plan: Kassenbuch Transaktionsdetail-Dialog mit Abschluss-Workflow

### Ablauf
1. Klick auf Transaktionszeile → Detail-Dialog öffnet sich
2. Dialog zeigt Transaktionsinfos (Nr., Zeit, Kunde, Betrag, Zahlungsart)
3. **Wenn noch nicht abgeschlossen**: Großer "ABSCHLIESSEN" Button → ruft TSE-Signatur auf
4. **Erst nach Abschluss**: "Rückerstattung" und "Belegkopie" Buttons werden sichtbar
5. "Stornieren" Button wird aus der Tabellenzeile entfernt und in den Dialog verschoben

### Datenbank-Migration

Neue Spalten auf `transactions`-Tabelle:
- `status` (text, default `'open'`): `'open'`, `'completed'`, `'refunded'`
- `tse_transaction_id` (text, nullable)
- `tse_signature` (text, nullable)  
- `tse_timestamp` (timestamptz, nullable)

### Edge Function: `pos-checkout` erweitern

Zusätzlich zum bestehenden Reservierungs-Flow einen neuen Modus für direkte Transaktionen hinzufügen:
- Akzeptiert `transaction_id` als Alternative zu `reservation_id`
- Signiert über fiskaly TSE
- Setzt `status = 'completed'` auf der Transaktion

### UI: `KassenbuchView.tsx`

- `Transaction` Interface erweitern um `status`, `tse_*` Felder, `reservation_id`
- Trash-Button aus Tabellenzeile entfernen
- Zeilen klickbar machen → `selectedTransaction` State
- Neuer Detail-Dialog:

```text
┌──────────────────────────────────────┐
│  Transaktionsdetails              ✕  │
│                                      │
│  TX-20260310-001                     │
│  10.03.2026 09:28                    │
│  Kunde: Max Mustermann              │
│  Zahlungsart: Bar                    │
│  Betrag: 35,00 €                     │
│                                      │
│  ┌──────────────────────────────┐    │
│  │      ✅ ABSCHLIESSEN         │    │  ← nur wenn status='open'
│  └──────────────────────────────┘    │
│                                      │
│  --- nach Abschluss: ---             │
│  TSE Signatur: abc123...             │
│  ┌────────────┐  ┌────────────┐      │
│  │Rückerstattung│ │ Belegkopie │      │  ← nur wenn status='completed'
│  └────────────┘  └────────────┘      │
│  ┌──────────────────────────────┐    │
│  │       🗑️ Stornieren          │    │
│  └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Dateien

| Datei | Aktion |
|---|---|
| Migration SQL | `status`, `tse_*` Spalten auf `transactions` |
| `supabase/functions/pos-checkout/index.ts` | Transaction-Modus hinzufügen |
| `src/components/zenbook/KassenbuchView.tsx` | Detail-Dialog + klickbare Zeilen |

