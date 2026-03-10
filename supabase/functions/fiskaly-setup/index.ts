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

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Fiskaly credentials not configured' }), { status: 500, headers: corsHeaders });
    }

    // Step 1: Auth via BACKEND (for TSS creation only)
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

    // Step 2: Auth via MIDDLEWARE (for all other operations)
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
    console.log('[FISKALY] Both auths OK');

    // Step 3: Create NEW TSS via BACKEND (only backend returns admin_puk)
    const newTssId = crypto.randomUUID();
    console.log('[FISKALY] Creating TSS:', newTssId);
    const createResp = await fetch(`${FISKALY_BE}/tss/${newTssId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${beToken}`,
      },
      body: JSON.stringify({ description: 'ZenBook KassenSichV TSE' }),
    });
    const createText = await createResp.text();
    console.log('[FISKALY] Create TSS:', createResp.status);
    if (!createResp.ok) {
      return new Response(JSON.stringify({ error: 'Create TSS failed', details: createText }), { status: 500, headers: corsHeaders });
    }
    const tssData = JSON.parse(createText);
    const adminPuk = tssData.admin_puk;
    console.log('[FISKALY] PUK available:', !!adminPuk);
    if (!adminPuk) {
      return new Response(JSON.stringify({ error: 'No PUK returned' }), { status: 500, headers: corsHeaders });
    }

    // Step 4: Deploy TSS (CREATED → UNINITIALIZED) via MIDDLEWARE
    console.log('[FISKALY] Deploying TSS...');
    const deployResp = await fetch(`${FISKALY_MW}/tss/${newTssId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mwToken}`,
      },
      body: JSON.stringify({ state: 'UNINITIALIZED' }),
    });
    console.log('[FISKALY] Deploy:', deployResp.status);
    if (!deployResp.ok) {
      const err = await deployResp.text();
      return new Response(JSON.stringify({ error: 'Deploy failed', details: err }), { status: 500, headers: corsHeaders });
    }

    // Step 5: Set admin PIN using PUK via MIDDLEWARE
    console.log('[FISKALY] Setting admin PIN with PUK...');
    const pinResp = await fetch(`${FISKALY_MW}/tss/${newTssId}/admin`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mwToken}`,
      },
      body: JSON.stringify({ admin_puk: adminPuk, new_admin_pin: ADMIN_PIN }),
    });
    console.log('[FISKALY] Set PIN:', pinResp.status);
    if (!pinResp.ok) {
      const err = await pinResp.text();
      console.log('[FISKALY] PIN error:', err);
    }

    // Step 6: Admin auth via MIDDLEWARE
    console.log('[FISKALY] Admin auth...');
    const adminAuthResp = await fetch(`${FISKALY_MW}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        api_secret: apiSecret,
        tss_id: newTssId,
        type: 'admin',
        admin_pin: ADMIN_PIN,
      }),
    });
    console.log('[FISKALY] Admin auth:', adminAuthResp.status);
    if (!adminAuthResp.ok) {
      const err = await adminAuthResp.text();
      return new Response(JSON.stringify({ error: 'Admin auth failed', details: err }), { status: 500, headers: corsHeaders });
    }
    const { access_token: adminToken } = await adminAuthResp.json() as any;

    // Step 7: Initialize TSS via MIDDLEWARE with admin token
    console.log('[FISKALY] Initializing TSS...');
    const initResp = await fetch(`${FISKALY_MW}/tss/${newTssId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ state: 'INITIALIZED' }),
    });
    console.log('[FISKALY] Init:', initResp.status);
    if (!initResp.ok) {
      const err = await initResp.text();
      return new Response(JSON.stringify({ error: 'Init failed', details: err }), { status: 500, headers: corsHeaders });
    }

    // Step 8: Register client via MIDDLEWARE
    const clientId = crypto.randomUUID();
    console.log('[FISKALY] Registering client:', clientId);
    const clientResp = await fetch(`${FISKALY_MW}/tss/${newTssId}/client/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mwToken}`,
      },
      body: JSON.stringify({ serial_number: `ZENBOOK-${clientId.substring(0, 8).toUpperCase()}` }),
    });
    if (!clientResp.ok) {
      const err = await clientResp.text();
      return new Response(JSON.stringify({ error: 'Client reg failed', details: err }), { status: 500, headers: corsHeaders });
    }

    const clientData = await clientResp.json();
    console.log('[FISKALY] SUCCESS! TSS:', newTssId, 'Client:', clientId);

    return new Response(JSON.stringify({
      success: true,
      tss_id: newTssId,
      client_id: clientId,
      client: clientData,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[FISKALY] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
