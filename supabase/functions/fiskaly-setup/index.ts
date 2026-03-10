import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FISKALY_MW = 'https://kassensichv-middleware.fiskaly.com/api/v2';
const FISKALY_BE = 'https://kassensichv.fiskaly.com/api/v2';
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const apiKey = Deno.env.get('FISKALY_API_KEY');
    const apiSecret = Deno.env.get('FISKALY_API_SECRET');
    const tssId = Deno.env.get('FISKALY_TSS_ID');

    if (!apiKey || !apiSecret || !tssId) {
      return new Response(JSON.stringify({ error: 'Fiskaly credentials not configured' }), { status: 500, headers: corsHeaders });
    }

    // Step 1: Auth via middleware (for most operations)
    console.log('[FISKALY] Auth via middleware...');
    const mwAuthResp = await fetch(`${FISKALY_MW}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });
    if (!mwAuthResp.ok) {
      const err = await mwAuthResp.text();
      return new Response(JSON.stringify({ error: 'MW auth failed', details: err }), { status: 500, headers: corsHeaders });
    }
    const { access_token: mwToken } = await mwAuthResp.json() as any;

    // Also get backend token (needed for TSS creation/retrieval with PUK)
    console.log('[FISKALY] Auth via backend...');
    const beAuthResp = await fetch(`${FISKALY_BE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });
    if (!beAuthResp.ok) {
      const err = await beAuthResp.text();
      return new Response(JSON.stringify({ error: 'BE auth failed', details: err }), { status: 500, headers: corsHeaders });
    }
    const { access_token: beToken } = await beAuthResp.json() as any;
    console.log('[FISKALY] Both auths successful');

    // Step 2: Get TSS state + admin_puk via BACKEND (only backend returns PUK for CREATED TSS)
    console.log('[FISKALY] Getting TSS via backend (for PUK)...');
    const tssResp = await fetch(`${FISKALY_BE}/tss/${tssId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${beToken}` },
    });
    if (!tssResp.ok) {
      const err = await tssResp.text();
      return new Response(JSON.stringify({ error: 'Get TSS failed', details: err }), { status: 500, headers: corsHeaders });
    }
    const tssData = await tssResp.json() as any;
    const tssState = tssData.state;
    const adminPuk = tssData.admin_puk;
    console.log('[FISKALY] TSS state:', tssState, '| PUK available:', !!adminPuk);

    if (tssState === 'DISABLED') {
      return new Response(JSON.stringify({ error: 'TSS is DISABLED' }), { status: 400, headers: corsHeaders });
    }

    // Step 3: If CREATED, deploy to UNINITIALIZED via BACKEND
    if (tssState === 'CREATED') {
      console.log('[FISKALY] Deploying TSS via backend...');
      const deployResp = await fetch(`${FISKALY_BE}/tss/${tssId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${beToken}`,
        },
        body: JSON.stringify({ state: 'UNINITIALIZED' }),
      });
      const deployText = await deployResp.text();
      console.log('[FISKALY] Deploy:', deployResp.status, deployText);
      if (!deployResp.ok) {
        return new Response(JSON.stringify({ error: 'TSS deploy failed', details: deployText }), { status: 500, headers: corsHeaders });
      }
    }

    // Step 4: Change admin PIN using PUK (via middleware)
    if (tssState === 'CREATED' || tssState === 'UNINITIALIZED') {
      if (adminPuk) {
        console.log('[FISKALY] Changing admin PIN using PUK...');
        const changePinResp = await fetch(`${FISKALY_MW}/tss/${tssId}/admin`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mwToken}`,
          },
          body: JSON.stringify({ admin_puk: adminPuk, new_admin_pin: ADMIN_PIN }),
        });
        const changePinText = await changePinResp.text();
        console.log('[FISKALY] Change PIN:', changePinResp.status, changePinText);
      } else {
        console.log('[FISKALY] No PUK available, trying direct admin auth...');
      }

      // Step 5: Authenticate as admin
      console.log('[FISKALY] Admin auth...');
      const adminAuthResp = await fetch(`${FISKALY_MW}/auth`, {
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
      const adminAuthText = await adminAuthResp.text();
      console.log('[FISKALY] Admin auth:', adminAuthResp.status);
      if (!adminAuthResp.ok) {
        return new Response(JSON.stringify({ error: 'Admin auth failed', details: adminAuthText }), { status: 500, headers: corsHeaders });
      }

      const adminData = JSON.parse(adminAuthText);
      const adminToken = adminData.access_token;

      // Step 6: Initialize TSS via middleware with admin token
      console.log('[FISKALY] Initializing TSS...');
      const initResp = await fetch(`${FISKALY_MW}/tss/${tssId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ state: 'INITIALIZED' }),
      });
      const initText = await initResp.text();
      console.log('[FISKALY] Init:', initResp.status, initText);
      if (!initResp.ok) {
        return new Response(JSON.stringify({ error: 'TSS init failed', details: initText }), { status: 500, headers: corsHeaders });
      }
      console.log('[FISKALY] TSS initialized!');
    }

    // Step 7: Register client via middleware
    const clientId = crypto.randomUUID();
    console.log('[FISKALY] Registering client:', clientId);

    const clientResp = await fetch(`${FISKALY_MW}/tss/${tssId}/client/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mwToken}`,
      },
      body: JSON.stringify({ serial_number: `ZENBOOK-${clientId.substring(0, 8).toUpperCase()}` }),
    });

    if (!clientResp.ok) {
      const err = await clientResp.text();
      console.log('[FISKALY] Client reg failed:', err);
      return new Response(JSON.stringify({ error: 'Client registration failed', details: err }), { status: 500, headers: corsHeaders });
    }

    const clientData = await clientResp.json();
    console.log('[FISKALY] Client registered:', clientId);

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
