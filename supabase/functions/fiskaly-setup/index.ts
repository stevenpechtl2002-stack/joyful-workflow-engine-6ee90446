import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import https from "node:https";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function httpsRequest(url: string, options: { method: string; headers: Record<string, string>; body?: string }): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: options.method,
      headers: options.headers,
      rejectUnauthorized: false, // Skip TLS verification for fiskaly
    }, (res) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode || 500, body: data }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const authResult = await httpsRequest('https://kassensichv2.fiskaly.com/api/v2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });

    if (authResult.status !== 200) {
      return new Response(JSON.stringify({ error: 'Fiskaly auth failed', details: authResult.body }), { status: 500, headers: corsHeaders });
    }

    const authData = JSON.parse(authResult.body);
    const accessToken = authData.access_token;

    // Step 2: Generate client ID
    const clientId = crypto.randomUUID();

    // Step 3: Register client under TSS
    const clientResult = await httpsRequest(
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

    if (clientResult.status < 200 || clientResult.status >= 300) {
      return new Response(JSON.stringify({ error: 'Client registration failed', details: clientResult.body }), { status: 500, headers: corsHeaders });
    }

    const clientData = JSON.parse(clientResult.body);

    return new Response(JSON.stringify({
      success: true,
      client_id: clientId,
      client: clientData,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
