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
    const { imageBase64, staffNames } = await req.json();
    
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
      ? `\n\nDie folgenden Mitarbeiter/Spalten existieren im System: ${staffNames.join(', ')}. Ordne jeden Termin dem passenden Mitarbeiter zu. Verwende exakt diese Namen.`
      : '';

    const systemPrompt = `Du bist ein Experte für die Extraktion von Termindaten aus Kalender-Screenshots (z.B. Treatwell, Google Calendar, Terminplaner).

WICHTIGE REGELN:
1. Analysiere das Bild SEHR SORGFÄLTIG. Schaue dir JEDE Spalte und JEDE Zeile genau an.
2. Kalender-Screenshots haben typischerweise Spalten für jeden Mitarbeiter/Stylist und Zeilen für Zeitslots.
3. Jeder farbige Block oder Eintrag in einer Spalte ist ein Termin.
4. Extrahiere die EXAKTE Startzeit und Endzeit aus der Position des Blocks im Zeitraster.
5. Der Mitarbeitername steht in der Spaltenüberschrift.
6. Das Datum steht oft oben im Screenshot oder im Header.
7. Kundennamen sind NICHT wichtig - setze sie auf leer oder "Blockiert".
8. Achte auf ALLE Termine, auch kleine Blöcke oder überlappende Einträge.
9. Wenn Zeiten nicht exakt lesbar sind, schätze sie basierend auf der Position im Zeitraster.
10. Achte auf die Dienstleistung/Service-Bezeichnung die oft IM farbigen Block steht.
${staffList}

Für jeden erkannten Termin/Block extrahiere:
- staff_name: Name des Mitarbeiters (aus der Spaltenüberschrift)
- reservation_date: Datum im Format YYYY-MM-DD
- reservation_time: Startzeit im Format HH:MM (24-Stunden)
- end_time: Endzeit im Format HH:MM (24-Stunden)
- service: Dienstleistung/Behandlung (falls im Block lesbar)
- notes: Zusätzliche Informationen (falls lesbar)

Antworte NUR mit einem JSON-Array:
[
  {
    "staff_name": "Mitarbeitername",
    "reservation_date": "2025-02-11",
    "reservation_time": "09:00",
    "end_time": "10:00",
    "service": "Behandlung",
    "notes": ""
  }
]

Wenn du keine Termine findest, antworte mit einem leeren Array: []
Gib NUR das JSON zurück, keinen anderen Text.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analysiere diesen Kalender-Screenshot SEHR GENAU. Extrahiere ALLE sichtbaren Termine/Blöcke mit ihren exakten Zeiten und Mitarbeiterzuordnungen:"
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
