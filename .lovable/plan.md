## Treatwell Gap Analysis — Implementierungsstatus

### ✅ Erledigt
1. **E-Mail-Trigger in Buchungs-Functions** — `storefront-book` und `create-storefront-checkout` enqueuen jetzt Bestätigungs-E-Mails und erstellen Salon-Benachrichtigungen
2. **Kunden-Selbststornierung** — Edge Function `storefront-cancel` + UI-Seite `/storefront/cancel/:bookingId` mit Fristprüfung gegen `cancellation_hours`
3. **Geolocation-Spalten** — `latitude`/`longitude` zur `customers`-Tabelle hinzugefügt mit Index

### 🔲 Noch offen
- **Transaktionale E-Mail-Templates** — Templates müssen via `scaffold_transactional_email` erstellt werden (DNS-Verifizierung für `notify.www.zentime.io` muss erst abgeschlossen sein)
- **Standortbasierte Sortierung** — `list-salons` Edge Function um Distanz-Sortierung erweitern
- **Buchungshistorie im Kundenprofil** — Service-Name und Salon-Details ergänzen
