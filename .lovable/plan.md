

## Plan: Portal-Kalender durch ZenBookApp-Kalender ersetzen

Der aktuelle `/portal/calendar` zeigt eine vereinfachte Version mit dem Portal-Sidebar. Der User will stattdessen den ZenBookApp-Kalender (auf `/`) mit dem ZenTime-Sidebar, Mini-Kalender, Staff-Spalten, API Gateway Status, etc.

### Änderung 1: Portal Sidebar Link anpassen
- `src/components/portal/PortalSidebar.tsx`: "Kalender" Link von `/portal/calendar` auf `/` ändern, damit direkt die ZenBookApp geöffnet wird

### Änderung 2: Portal Calendar Route entfernen (optional)
- `src/App.tsx`: Route `/portal/calendar` entfernen oder als Redirect auf `/` einrichten
- `src/pages/portal/Calendar.tsx`: Kann gelöscht oder als Redirect implementiert werden

### Ergebnis
Klick auf "Kalender" im Portal → öffnet die ZenBookApp (`/`) mit dem gewohnten ZenTime-Layout (linkes Menü, Mini-Kalender, Staff-Spalten, Live-Badge, API Gateway)

