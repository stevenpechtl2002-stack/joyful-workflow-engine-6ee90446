

## Plan: Fiskaly Client automatisch per Edge Function erstellen

Da PowerShell Probleme macht, baue ich eine Backend-Funktion, die den fiskaly Client automatisch erstellt. So musst du nichts in der Kommandozeile machen.

### Schritt 1: Secrets speichern
Die zwei Werte, die du gerade geteilt hast (API Key und API Secret), plus deine TSS-ID als Backend-Secrets hinterlegen.

### Schritt 2: Edge Function `fiskaly-setup` erstellen
Eine neue Backend-Funktion, die:
1. Sich bei fiskaly authentifiziert (mit deinem API Key + Secret)
2. Automatisch einen Client unter deiner TSS erstellt
3. Die Client-ID zurückgibt

### Schritt 3: Setup-Button in den Einstellungen
Einen einfachen Button in der App, mit dem du die fiskaly-Einrichtung per Klick abschliessen kannst. Die generierte Client-ID wird dann ebenfalls als Secret gespeichert.

### Voraussetzung
Du musst mir noch deine **TSS-ID** mitteilen, damit ich alle drei Werte speichern kann.

