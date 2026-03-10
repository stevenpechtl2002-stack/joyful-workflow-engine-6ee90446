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

    // List all TSS to find a usable one
    console.log('[FISKALY] Listing all TSS...');
    const listResp = await fetch(`${FISKALY_BE}/tss`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${beToken}` },
    });
    const listData = await listResp.json() as any;
    const allTss = listData.data || [];
    console.log('[FISKALY] Found', allTss.length, 'TSS:', allTss.map((t: any) => `${t._id.substring(0,8)}…(${t.state})`).join(', '));

    // Strategy: find existing usable TSS instead of creating new ones
    // Priority: 1) INITIALIZED, 2) UNINITIALIZED (can be initialized), 3) CREATED (needs deploy first)
    let targetTss = allTss.find((t: any) => t.state === 'INITIALIZED');
    let needsInit = false;
    let needsDeploy = false;

    if (!targetTss) {
      targetTss = allTss.find((t: any) => t.state === 'UNINITIALIZED');
      if (targetTss) needsInit = true;
    }

    if (!targetTss) {
      targetTss = allTss.find((t: any) => t.state === 'CREATED');
      if (targetTss) {
        needsDeploy = true;
        needsInit = true;
      }
    }

    if (!targetTss) {
      return new Response(JSON.stringify({ 
        error: 'No usable TSS found and limit reached. Please disable unused TSS in the fiskaly dashboard first.' 
      }), { status: 500, headers: corsHeaders });
    }

    const tssId = targetTss._id;
    console.log('[FISKALY] Using TSS:', tssId, 'state:', targetTss.state);

    // Deploy if CREATED
    if (needsDeploy) {
      console.log('[FISKALY] Deploying TSS...');
      const deployResp = await fetch(`${FISKALY_MW}/tss/${tssId}`, {
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
    }

    // Initialize if needed
    if (needsInit) {
      // We need the PUK to set admin PIN. For existing TSS we may not have it.
      // Try to get it from the TSS detail via backend API
      console.log('[FISKALY] Getting TSS details for PUK...');
      const detailResp = await fetch(`${FISKALY_BE}/tss/${tssId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${beToken}` },
      });
      const detailData = await detailResp.json() as any;
      const adminPuk = detailData.admin_puk;
      console.log('[FISKALY] PUK available:', !!adminPuk);

      if (!adminPuk) {
        // PUK is only returned at creation time. Try admin auth directly
        // (PIN may already be set from a previous attempt)
        console.log('[FISKALY] No PUK - trying admin auth with existing PIN...');
      } else {
        // Set admin PIN with PUK
        console.log('[FISKALY] Setting PIN with PUK...');
        const pinResp = await fetch(`${FISKALY_MW}/tss/${tssId}/admin`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mwToken}`,
          },
          body: JSON.stringify({ admin_puk: adminPuk, new_admin_pin: ADMIN_PIN }),
        });
        console.log('[FISKALY] PIN set:', pinResp.status);
      }

      // Admin auth
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
      console.log('[FISKALY] Admin auth:', adminAuthResp.status);
      if (!adminAuthResp.ok) {
        const err = await adminAuthResp.text();
        return new Response(JSON.stringify({ error: 'Admin auth failed', details: err }), { status: 500, headers: corsHeaders });
      }
      const { access_token: adminToken } = await adminAuthResp.json() as any;

      // Initialize
      console.log('[FISKALY] Initializing...');
      const initResp = await fetch(`${FISKALY_MW}/tss/${tssId}`, {
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
    }

    // Check if a client already exists for this TSS
    console.log('[FISKALY] Checking existing clients...');
    const clientsResp = await fetch(`${FISKALY_MW}/tss/${tssId}/client`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${mwToken}` },
    });
    
    if (clientsResp.ok) {
      const clientsData = await clientsResp.json() as any;
      const existingClients = clientsData.data || [];
      const activeClient = existingClients.find((c: any) => c.state === 'REGISTERED');
      
      if (activeClient) {
        console.log('[FISKALY] Found existing client:', activeClient._id);
        return new Response(JSON.stringify({
          success: true,
          tss_id: tssId,
          client_id: activeClient._id,
          client: activeClient,
          reused: true,
        }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Register new client
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
      return new Response(JSON.stringify({ error: 'Client reg failed', details: err }), { status: 500, headers: corsHeaders });
    }

    const clientData = await clientResp.json();
    console.log('[FISKALY] SUCCESS! TSS:', tssId, 'Client:', clientId);

    return new Response(JSON.stringify({
      success: true,
      tss_id: tssId,
      client_id: clientId,
      client: clientData,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('[FISKALY] Error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
