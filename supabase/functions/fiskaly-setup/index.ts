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

    // Step 1: Get API token
    console.log('[FISKALY] Authenticating...');
    const authResp = await fetch(`${FISKALY_BASE}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
    });

    if (!authResp.ok) {
      const errText = await authResp.text();
      console.log('[FISKALY] Auth failed:', errText);
      return new Response(JSON.stringify({ error: 'Fiskaly auth failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const { access_token: apiToken } = await authResp.json() as any;
    console.log('[FISKALY] Auth successful');

    // Step 2: Check TSS state
    const tssResp = await fetch(`${FISKALY_BASE}/tss/${tssId}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiToken}` },
    });

    if (!tssResp.ok) {
      const errText = await tssResp.text();
      console.log('[FISKALY] Get TSS failed:', errText);
      return new Response(JSON.stringify({ error: 'Failed to get TSS', details: errText }), { status: 500, headers: corsHeaders });
    }

    const tssData = await tssResp.json() as any;
    const tssState = tssData.state;
    console.log('[FISKALY] TSS state:', tssState);

    // Step 3: If CREATED, deploy to UNINITIALIZED
    if (tssState === 'CREATED') {
      console.log('[FISKALY] Deploying TSS (CREATED → UNINITIALIZED)...');
      const deployResp = await fetch(`${FISKALY_BASE}/tss/${tssId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ state: 'UNINITIALIZED' }),
      });
      if (!deployResp.ok) {
        const errText = await deployResp.text();
        console.log('[FISKALY] Deploy failed:', errText);
        return new Response(JSON.stringify({ error: 'TSS deploy failed', details: errText }), { status: 500, headers: corsHeaders });
      }
      console.log('[FISKALY] TSS deployed to UNINITIALIZED');
    }

    // Step 4: If UNINITIALIZED (or just deployed), set admin PIN and initialize
    if (tssState === 'CREATED' || tssState === 'UNINITIALIZED') {
      // Set the admin PIN on the TSS
      console.log('[FISKALY] Setting admin PIN...');
      const pinResp = await fetch(`${FISKALY_BASE}/tss/${tssId}/admin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ admin_pin: ADMIN_PIN }),
      });

      if (!pinResp.ok) {
        const errText = await pinResp.text();
        console.log('[FISKALY] Set PIN failed:', errText);
        // Try alternative: PUT to set initial admin PIN
        console.log('[FISKALY] Trying PUT for initial admin PIN...');
        const pinResp2 = await fetch(`${FISKALY_BASE}/tss/${tssId}/admin`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiToken}`,
          },
          body: JSON.stringify({ admin_pin: ADMIN_PIN }),
        });
        if (!pinResp2.ok) {
          const errText2 = await pinResp2.text();
          console.log('[FISKALY] PUT PIN also failed:', errText2);
          // Continue anyway - PIN might already be set
        } else {
          console.log('[FISKALY] Admin PIN set via PUT');
        }
      } else {
        console.log('[FISKALY] Admin PIN set successfully');
      }

      // Authenticate as admin
      console.log('[FISKALY] Authenticating as admin...');
      const adminAuthResp = await fetch(`${FISKALY_BASE}/auth`, {
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
        return new Response(JSON.stringify({ error: 'Admin auth failed', details: errText }), { status: 500, headers: corsHeaders });
      }

      const { access_token: adminToken } = await adminAuthResp.json() as any;
      console.log('[FISKALY] Admin auth successful');

      // Initialize TSS
      console.log('[FISKALY] Initializing TSS...');
      const initResp = await fetch(`${FISKALY_BASE}/tss/${tssId}`, {
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
        return new Response(JSON.stringify({ error: 'TSS init failed', details: errText }), { status: 500, headers: corsHeaders });
      }
      console.log('[FISKALY] TSS initialized!');
    }

    if (tssState === 'DISABLED') {
      return new Response(JSON.stringify({ error: 'TSS is DISABLED. Please create a new TSS in the fiskaly dashboard.' }), { status: 400, headers: corsHeaders });
    }

    // Step 5: Register client (TSS should now be INITIALIZED)
    const clientId = crypto.randomUUID();
    console.log('[FISKALY] Registering client:', clientId);

    const clientResp = await fetch(`${FISKALY_BASE}/tss/${tssId}/client/${clientId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
      },
      body: JSON.stringify({ serial_number: `ZENBOOK-${clientId.substring(0, 8).toUpperCase()}` }),
    });

    if (!clientResp.ok) {
      const errText = await clientResp.text();
      console.log('[FISKALY] Client registration failed:', errText);
      return new Response(JSON.stringify({ error: 'Client registration failed', details: errText }), { status: 500, headers: corsHeaders });
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
