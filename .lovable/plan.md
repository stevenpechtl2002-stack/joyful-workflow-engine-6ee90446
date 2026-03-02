

## Plan: Salon-Profil als klarer "Profil"-Menüpunkt

### Was ist das Ziel?
Der bestehende Menüpunkt "Salon-Profil" im Portal-Sidebar soll der zentrale Ort sein, um die Mini-Website (Marktplatzprofil) einzustellen. Keine neuen Features nötig -- die Seite `/portal/salon-profile` existiert bereits mit allen Einstellungen (Logo, Cover, Name, Kontakt, Social Media, Galerie).

### Änderung

**`src/components/portal/PortalSidebar.tsx`**
- Der Menüpunkt "Salon-Profil" ist bereits vorhanden (Zeile mit `Store`-Icon, Pfad `/portal/salon-profile`)
- Falls gewünscht: Label von "Salon-Profil" zu "Profil" umbenennen oder an prominentere Position verschieben (z.B. weiter oben in der Liste)

### Zusammenfassung
Es ist alles bereits implementiert. Die einzige mögliche Anpassung wäre das Umbenennen oder Umpositionieren des Menüpunkts. Wenn du auf "Salon-Profil" im Sidebar klickst, kommst du direkt zur Konfigurationsseite deiner Mini-Website.

