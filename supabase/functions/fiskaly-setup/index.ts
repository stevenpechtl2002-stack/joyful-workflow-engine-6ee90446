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

    // Auth via both endpoints
    console.log('[FISKALY] Authenticating...');
    const [beAuthResp, mwAuthResp] = await Promise.all([
      fetch(`${FISKALY_BE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      }),
      fetch(`${FISKALY_MW}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      }),
    ]);

    if (!beAuthResp.ok || !mwAuthResp.ok) {
      return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 500, headers: corsHeaders });
    }

    const { access_token: beToken } = await beAuthResp.json() as any;
    const { access_token: mwToken } = await mwAuthResp.json() as any;
    console.log('[FISKALY] Auth OK');

    // List all TSS to find unused ones to disable
    console.log('[FISKALY] Listing all TSS...');
    const listResp = await fetch(`${FISKALY_BE}/tss`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${beToken}` },
    });
    const listData = await listResp.json() as any;
    const allTss = listData.data || [];
    console.log('[FISKALY] Found', allTss.length, 'TSS');

    // Disable TSS that are UNINITIALIZED or CREATED (not needed)
    for (const tss of allTss) {
      if (tss.state === 'UNINITIALIZED' || tss.state === 'CREATED') {
        console.log('[FISKALY] Disabling unused TSS:', tss._id, 'state:', tss.state);
        
        if (tss.state === 'UNINITIALIZED') {
          // Need admin auth to disable - try changing PIN first if we have PUK
          // For UNINITIALIZED without PUK, we use middleware to disable
          const disableResp = await fetch(`${FISKALY_MW}/tss/${tss._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${mwToken}`,
            },
            body: JSON.stringify({ state: 'DISABLED' }),
          });
          console.log('[FISKALY] Disable result:', disableResp.status);
        }
      }
    }

    // Now create a new TSS via BACKEND
    const newTssId = crypto.randomUUID();
    console.log('[FISKALY] Creating new TSS:', newTssId);
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
    console.log('[FISKALY] PUK:', !!adminPuk);
    if (!adminPuk) {
      return new Response(JSON.stringify({ error: 'No PUK' }), { status: 500, headers: corsHeaders });
    }

    // Deploy TSS via MIDDLEWARE
    console.log('[FISKALY] Deploying...');
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

    // Set admin PIN with PUK via MIDDLEWARE
    console.log('[FISKALY] Setting PIN...');
    const pinResp = await fetch(`${FISKALY_MW}/tss/${newTssId}/admin`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mwToken}`,
      },
      body: JSON.stringify({ admin_puk: adminPuk, new_admin_pin: ADMIN_PIN }),
    });
    console.log('[FISKALY] PIN:', pinResp.status);

    // Admin auth via MIDDLEWARE
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

    // Initialize via MIDDLEWARE with admin token
    console.log('[FISKALY] Initializing...');
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

    // Register client via MIDDLEWARE
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
