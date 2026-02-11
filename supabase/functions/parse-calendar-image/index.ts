import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, staffNames, calendarDate } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const staffList = staffNames && staffNames.length > 0 
      ? `\n\nDie folgenden Mitarbeiter existieren im System: ${staffNames.join(', ')}. Du MUSST exakt diese Namen in "staff_name" verwenden. Ordne jeden farbigen Block der Spalte zu, in der er sich befindet, und verwende den entsprechenden Mitarbeiternamen aus der Spaltenüberschrift.`
      : '';

    const dateHint = calendarDate 
      ? `\n\nDas aktuelle Datum des Kalenders ist: ${calendarDate}. Verwende dieses Datum für ALLE Termine, es sei denn, im Screenshot ist ein anderes Datum klar erkennbar.`
      : '';

    const systemPrompt = `Du bist ein Experte für die Extraktion von Termindaten aus Kalender-Screenshots, insbesondere von Treatwell und ähnlichen Buchungssystemen.

LAYOUT-ANALYSE (Treatwell und ähnliche Systeme):
- Der Screenshot zeigt einen TAGESKALENDER mit SPALTEN für jeden Mitarbeiter/Stylist
- Die SPALTENÜBERSCHRIFTEN oben enthalten die Mitarbeiternamen (oft mit kleinen Profilbildern/Avataren)
- Links befindet sich eine ZEITACHSE mit Uhrzeiten (z.B. 08:00, 08:30, 09:00, ...)
- FARBIGE BLÖCKE in den Spalten = Termine/Buchungen
- Die VERTIKALE POSITION eines Blocks im Zeitraster bestimmt die START- und ENDZEIT
- Die SPALTE in der ein Block liegt bestimmt den MITARBEITER
- Im farbigen Block steht oft der SERVICE/die Behandlung und eventuell ein Kundenname

VORGEHEN - SCHRITT FÜR SCHRITT:
1. Identifiziere ZUERST alle Spaltenüberschriften (= Mitarbeiternamen) von LINKS nach RECHTS
2. Identifiziere die Zeitachse links (Stundenraster)
3. Gehe dann SPALTE FÜR SPALTE von links nach rechts durch
4. Für JEDEN farbigen Block in einer Spalte:
   a) Bestimme die STARTZEIT anhand der oberen Kante des Blocks im Zeitraster
   b) Bestimme die ENDZEIT anhand der unteren Kante des Blocks
   c) Lies den TEXT im Block (Service/Behandlung)
   d) Der MITARBEITER ist der Name aus der Spaltenüberschrift
5. ZÄHLE die Gesamtzahl der farbigen Blöcke und stelle sicher, dass du EXAKT so viele Einträge zurückgibst
6. Überprüfe dein Ergebnis: Stimmen die Zeiten? Stimmen die Mitarbeiter-Zuordnungen?

WICHTIGE REGELN:
- Setze customer_name IMMER auf "Blockiert" - ignoriere Kundennamen komplett
- Achte auf ALLE Blöcke, auch kleine (15-Minuten-Termine) oder teilweise verdeckte
- Wenn Zeiten nicht exakt lesbar sind, schätze basierend auf der Position im Raster
- Runde Zeiten auf 5-Minuten-Intervalle (z.B. 09:00, 09:05, 09:10, ...)
- Service/Behandlung aus dem Text IM farbigen Block extrahieren
- Wenn kein Service lesbar ist, setze "service" auf ""
${staffList}${dateHint}

AUSGABEFORMAT - NUR JSON-Array:
[
  {
    "staff_name": "Exakter Mitarbeitername",
    "customer_name": "Blockiert",
    "reservation_date": "YYYY-MM-DD",
    "reservation_time": "HH:MM",
    "end_time": "HH:MM",
    "service": "Behandlungsname falls lesbar",
    "notes": ""
  }
]

Wenn du keine Termine findest, antworte mit: []
Gib NUR das JSON zurück, KEINEN anderen Text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analysiere diesen Kalender-Screenshot SEHR GENAU. Gehe Spalte für Spalte durch und extrahiere JEDEN farbigen Block als Termin. Zähle alle Blöcke und stelle sicher, dass kein einziger fehlt:"
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit erreicht. Bitte versuche es später erneut." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Guthaben aufgebraucht. Bitte lade Guthaben auf." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Parse the JSON response
    let appointments = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        appointments = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      appointments = [];
    }

    return new Response(
      JSON.stringify({ appointments }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("parse-calendar-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
