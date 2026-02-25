

# Onboarding-Wizard mit 5 Schritten, Stripe und Veröffentlichung

## Zusammenfassung

Der bestehende `SalonRegistration`-Wizard wird komplett überarbeitet zu einem vollwertigen Onboarding mit 5 Schritten. Schritt 4 verbindet Stripe, Schritt 5 zeigt eine Zusammenfassung mit "Profil veröffentlichen"-Button, Konfetti-Animation und setzt `published: true`. Im Dashboard erscheint ein Banner solange das Profil nicht veröffentlicht ist.

## Datenbankänderungen

Zwei neue Spalten auf der `customers`-Tabelle:
- `published` (boolean, default false) -- steuert Sichtbarkeit auf der Plattform
- `onboarding_step` (integer, default 1) -- speichert den aktuellen Fortschritt

RLS: Nutzer kann eigenes `published` und `onboarding_step` updaten (bereits durch bestehende UPDATE-Policy abgedeckt).

## Die 5 Schritte

```text
[1. Basis-Infos] → [2. Galerie] → [3. Services & Team] → [4. Stripe] → [5. Veröffentlichen]
```

**Schritt 1 -- Basis-Infos:** Name, Kategorie, Standort, Beschreibung (wie bisher). Überspringen-Button vorhanden.

**Schritt 2 -- Galerie:** Bild-Upload/URL (wie bisher). Überspringen-Button vorhanden.

**Schritt 3 -- Services & Team:** Services und Mitarbeiter zusammengefasst (bisherige Schritte 3+4). Überspringen-Button vorhanden.

**Schritt 4 -- Stripe verbinden:** Button ruft `create-checkout` Edge Function auf. Kein Überspringen-Button. Zeigt Abo-Status an falls bereits verbunden.

**Schritt 5 -- Veröffentlichen:** Zusammenfassung aller Daten (Name, Services, Team, Stripe-Status). "Profil veröffentlichen"-Button setzt `published: true` in der `customers`-Tabelle. Konfetti-Animation bei Erfolg (via `canvas-confetti` oder CSS-basiert). Kein Überspringen.

## Navigation

- Jeder Schritt hat "Weiter" und "Zurück" Buttons
- Schritte 1-3 haben zusätzlich "Überspringen"-Button
- Schritt 4 (Stripe) und 5 (Veröffentlichen) haben keinen Überspringen-Button
- Fortschritt wird bei jedem Schrittwechsel via `UPDATE customers SET onboarding_step = X` gespeichert
- Beim Laden wird `onboarding_step` gelesen und der Wizard springt zum gespeicherten Schritt

## Dashboard-Banner

In `ZenBookApp.tsx` wird geprüft ob `published === false`. Falls ja, wird ein prominenter Banner angezeigt:

> "Dein Profil ist noch nicht veröffentlicht -- Onboarding abschließen"

Mit Button der zum Onboarding navigiert.

## Konfetti-Animation

CSS-basierte Konfetti-Animation (keine zusätzliche Dependency nötig). Wird bei erfolgreichem Veröffentlichen für 3 Sekunden angezeigt.

## Dateien

| Datei | Aktion |
|---|---|
| `supabase/migrations/` | Migration: `published` + `onboarding_step` auf `customers` |
| `src/components/zenbook/SalonRegistration.tsx` | Kompletter Umbau: 5 neue Schritte, Fortschritts-Persistenz, Konfetti |
| `src/components/zenbook/ZenBookApp.tsx` | Unpublished-Banner im Dashboard |

## Design

Bestehender ZenTime-Style: Lila/Pink Gradients, `floating-3d` Cards, `font-black` Headings, `rounded-2xl` Elemente. Mobil-optimiert mit responsive Grid.

