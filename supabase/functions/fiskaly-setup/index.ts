import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FISKALY_AUTH_URL = 'https://kassensichv-middleware.fiskaly.com/api/v2/auth';
const FISKALY_TSS_BASE = 'https://kassensichv-middleware.fiskaly.com/api/v2/tss';

// Default admin PIN for TSE setup (KassenSichV requirement)
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

    console.log('[FISKALY] Attempting auth...');

    // Step 1: Authenticate with fiskaly API
    const authResponse = await fetch(FISKALY_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      console.log('[FISKALY] Auth failed:', errText);
      return new Response(JSON.stringify({ error: 'Fiskaly auth failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const authData = await authResponse.json() as any;
    const accessToken = authData.access_token;
    console.log('[FISKALY] Auth successful');

    // Step 2: Check TSS state
    console.log('[FISKALY] Checking TSS state...');
    const tssGetResponse = await fetch(`${FISKALY_TSS_BASE}/${tssId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });

    if (!tssGetResponse.ok) {
      const errText = await tssGetResponse.text();
      return new Response(JSON.stringify({ error: 'Failed to get TSS', details: errText }), { status: 500, headers: corsHeaders });
    }

    const tssData = await tssGetResponse.json() as any;
    console.log('[FISKALY] TSS state:', tssData.state);

    // Step 3: Initialize TSS if needed
    if (tssData.state === 'UNINITIALIZED' || tssData.state === 'CREATED') {
      // If CREATED, first move to UNINITIALIZED
      if (tssData.state === 'CREATED') {
        console.log('[FISKALY] Moving TSS to UNINITIALIZED...');
        const deployResp = await fetch(`${FISKALY_TSS_BASE}/${tssId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ state: 'UNINITIALIZED' }),
        });
        if (!deployResp.ok) {
          const errText = await deployResp.text();
          return new Response(JSON.stringify({ error: 'TSS deploy failed', details: errText }), { status: 500, headers: corsHeaders });
        }
        console.log('[FISKALY] TSS set to UNINITIALIZED');
      }

      // Set Admin PIN on TSS
      console.log('[FISKALY] Setting admin PIN...');
      const adminPinResp = await fetch(`${FISKALY_TSS_BASE}/${tssId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          admin_pin: ADMIN_PIN,
        }),
      });

      if (!adminPinResp.ok) {
        const errText = await adminPinResp.text();
        console.log('[FISKALY] Admin PIN setup failed:', errText);
        // Try to continue - PIN might already be set
      } else {
        console.log('[FISKALY] Admin PIN set successfully');
      }

      // Authenticate as admin
      console.log('[FISKALY] Authenticating as TSS admin...');
      const adminAuthResp = await fetch(FISKALY_AUTH_URL, {
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
        console.log('[FISKALY] Admin auth failed:', errText);
        return new Response(JSON.stringify({ error: 'Admin authentication failed', details: errText }), { status: 500, headers: corsHeaders });
      }

      const adminAuthData = await adminAuthResp.json() as any;
      const adminToken = adminAuthData.access_token;
      console.log('[FISKALY] Admin auth successful');

      // Initialize TSS with admin token
      console.log('[FISKALY] Initializing TSS...');
      const initResp = await fetch(`${FISKALY_TSS_BASE}/${tssId}`, {
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
      console.log('[FISKALY] TSS initialized successfully');
    }

    // Step 4: Generate client ID
    const clientId = crypto.randomUUID();

    // Step 5: Register client under TSS
    console.log('[FISKALY] Registering client:', clientId);
    const clientResponse = await fetch(
      `${FISKALY_TSS_BASE}/${tssId}/client/${clientId}`,
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
      console.log('[FISKALY] Client registration failed:', errText);
      return new Response(JSON.stringify({ error: 'Client registration failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const clientData = await clientResponse.json();
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
