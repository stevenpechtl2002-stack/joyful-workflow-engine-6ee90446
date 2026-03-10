import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// fiskaly uses separate URLs for different operations
const FISKALY_MIDDLEWARE = 'https://kassensichv-middleware.fiskaly.com/api/v2';
const FISKALY_BACKEND = 'https://kassensichv.fiskaly.com/api/v2';

const ADMIN_PIN = '112877';

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

    // Step 1: Get API token (backend - for TSS management)
    console.log('[FISKALY] Getting backend API token...');
    const apiAuthResp = await fetch(`${FISKALY_BACKEND}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });

    if (!apiAuthResp.ok) {
      const errText = await apiAuthResp.text();
      return new Response(JSON.stringify({ error: 'Fiskaly API auth failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const apiAuthData = await apiAuthResp.json() as any;
    const apiToken = apiAuthData.access_token;
    console.log('[FISKALY] API auth successful');

    // Step 2: Check TSS state
    const tssResp = await fetch(`${FISKALY_BACKEND}/tss/${tssId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiToken}` },
    });

    if (!tssResp.ok) {
      const errText = await tssResp.text();
      return new Response(JSON.stringify({ error: 'Failed to get TSS', details: errText }), { status: 500, headers: corsHeaders });
    }

    const tssData = await tssResp.json() as any;
    console.log('[FISKALY] TSS state:', tssData.state);

    // Step 3: Initialize TSS if needed
    if (tssData.state === 'UNINITIALIZED' || tssData.state === 'CREATED') {
      if (tssData.state === 'CREATED') {
        console.log('[FISKALY] Moving TSS to UNINITIALIZED...');
        const deployResp = await fetch(`${FISKALY_BACKEND}/tss/${tssId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`,
          },
          body: JSON.stringify({ state: 'UNINITIALIZED' }),
        });
        if (!deployResp.ok) {
          const errText = await deployResp.text();
          return new Response(JSON.stringify({ error: 'TSS deploy failed', details: errText }), { status: 500, headers: corsHeaders });
        }
        console.log('[FISKALY] TSS set to UNINITIALIZED');
      }

      // Get admin token via MIDDLEWARE auth with admin PIN
      console.log('[FISKALY] Getting admin token via middleware...');
      const adminAuthResp = await fetch(`${FISKALY_MIDDLEWARE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey,
          api_secret: apiSecret,
          tss_id: tssId,
          type: 'admin',
          admin_pin: ADMIN_PIN,
        }),
      });

      if (!adminAuthResp.ok) {
        const errText = await adminAuthResp.text();
        console.log('[FISKALY] Middleware admin auth failed:', errText);
        return new Response(JSON.stringify({ 
          error: 'Admin authentication failed', 
          details: errText 
        }), { status: 500, headers: corsHeaders });
      }

      const adminAuthData = await adminAuthResp.json() as any;
      const adminToken = adminAuthData.access_token;
      console.log('[FISKALY] Middleware admin auth successful');

      // Initialize TSS via MIDDLEWARE with admin token
      console.log('[FISKALY] Initializing TSS via middleware...');
      const initResp = await fetch(`${FISKALY_MIDDLEWARE}/tss/${tssId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ state: 'INITIALIZED' }),
      });

      if (!initResp.ok) {
        const errText = await initResp.text();
        console.log('[FISKALY] Init failed:', errText);
        return new Response(JSON.stringify({ error: 'TSS initialization failed', details: errText }), { status: 500, headers: corsHeaders });
      }
      console.log('[FISKALY] TSS initialized successfully!');
    }

    // Step 4: Get middleware token for client registration
    console.log('[FISKALY] Getting middleware token...');
    const mwAuthResp = await fetch(`${FISKALY_MIDDLEWARE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });

    if (!mwAuthResp.ok) {
      const errText = await mwAuthResp.text();
      return new Response(JSON.stringify({ error: 'Middleware auth failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const mwAuthData = await mwAuthResp.json() as any;
    const mwToken = mwAuthData.access_token;

    // Step 5: Register client
    const clientId = crypto.randomUUID();
    console.log('[FISKALY] Registering client:', clientId);

    const clientResp = await fetch(`${FISKALY_MIDDLEWARE}/tss/${tssId}/client/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mwToken}`,
      },
      body: JSON.stringify({ serial_number: `ZENBOOK-${clientId.substring(0, 8).toUpperCase()}` }),
    });

    if (!clientResp.ok) {
      const errText = await clientResp.text();
      console.log('[FISKALY] Client registration failed:', errText);
      return new Response(JSON.stringify({ error: 'Client registration failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const clientData = await clientResp.json();
    console.log('[FISKALY] Client registered successfully:', clientId);

    return new Response(JSON.stringify({
      success: true,
      client_id: clientId,
      client: clientData,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[FISKALY] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
