

## Plan: Drucker-IP Feld im Salon-Profil hinzufügen

### Was wird gemacht
Ein neues Feld `printer_ip` in der `customers`-Tabelle und im Salon-Profil (Buchungseinstellungen-Karte), damit Salon-Betreiber die IP-Adresse ihres WLAN-Bondruckers hinterlegen können. Diese IP wird später beim POS-Abschluss genutzt, um die Kassenlade per ESC/POS-Befehl zu öffnen.

### Schritte

1. **DB-Migration**: Neue Spalte `printer_ip TEXT` zur `customers`-Tabelle hinzufügen

2. **SalonProfile.tsx anpassen**:
   - `printer_ip` zu `formData` State und Select-Query hinzufügen
   - `printer_ip` in `handleSave` Update aufnehmen
   - Neues Eingabefeld mit Printer-Icon in der "Buchungseinstellungen"-Karte einfügen (unterhalb der Pufferzeit)
   - Hilfetext: "IP-Adresse deines WLAN-Bondruckers (z.B. 192.168.1.100) — wird zum Öffnen der Kassenlade verwendet"

3. **KassenbuchView.tsx** (optional, gleicher Schritt): Beim "ABSCHLIESSEN" die `printer_ip` aus der DB laden und einen `fetch()`-Request an den Drucker senden, um die Kassenlade zu öffnen

### Technische Details
- Spalte: `ALTER TABLE customers ADD COLUMN printer_ip TEXT;`
- Icon: `Printer` aus lucide-react
- Platzhalter: `192.168.1.100`
- Keine neuen RLS-Policies nötig — bestehende `customers`-Policies decken das ab

