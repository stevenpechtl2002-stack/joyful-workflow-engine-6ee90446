import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Agent, fetch as undiciFetch } from "npm:undici@6";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create agent that skips TLS verification for fiskaly (their cert isn't in Deno's trust store)
const agent = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

async function fiskalyFetch(url: string, options: any = {}) {
  const resp = await undiciFetch(url, {
    ...options,
    dispatcher: agent,
  });
  return resp;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('FISKALY_API_KEY');
    const apiSecret = Deno.env.get('FISKALY_API_SECRET');
    const tssId = Deno.env.get('FISKALY_TSS_ID');

    if (!apiKey || !apiSecret || !tssId) {
      return new Response(JSON.stringify({ error: 'Fiskaly credentials not configured' }), { status: 500, headers: corsHeaders });
    }

    // Step 1: Authenticate with fiskaly
    const authResponse = await fiskalyFetch('https://kassensichv2.fiskaly.com/api/v2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      return new Response(JSON.stringify({ error: 'Fiskaly auth failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const authData = await authResponse.json() as any;
    const accessToken = authData.access_token;

    // Step 2: Generate client ID
    const clientId = crypto.randomUUID();

    // Step 3: Register client under TSS
    const clientResponse = await fiskalyFetch(
      `https://kassensichv2.fiskaly.com/api/v2/tss/${tssId}/client/${clientId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ serial_number: `ZENBOOK-${clientId.substring(0, 8).toUpperCase()}` }),
      }
    );

    if (!clientResponse.ok) {
      const errText = await clientResponse.text();
      return new Response(JSON.stringify({ error: 'Client registration failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const clientData = await clientResponse.json();

    return new Response(JSON.stringify({
      success: true,
      client_id: clientId,
      client: clientData,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
