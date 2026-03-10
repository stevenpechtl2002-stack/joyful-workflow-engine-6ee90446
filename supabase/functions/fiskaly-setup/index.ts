import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Trust Services Root R1 certificate (used by fiskaly.com)
const GTS_ROOT_R1 = `-----BEGIN CERTIFICATE-----
MIIFVzCCAz+gAwIBAgINAgPlk28xsBNJiGuiFzANBgkqhkiG9w0BAQwFADBHMQsw
CQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZpY2VzIExMQzEU
MBIGA1UEAxMLR1RTIFJvb3QgUjEwHhcNMTYwNjIyMDAwMDAwWhcNMzYwNjIyMDAw
MDAwWjBHMQswCQYDVQQGEwJVUzEiMCAGA1UEChMZR29vZ2xlIFRydXN0IFNlcnZp
Y2VzIExMQzEUMBIGA1UEAxMLR1RTIFJvb3QgUjEwggIiMA0GCSqGSIb3DQEBAQUA
A4ICDwAwggIKAoICAQC2EQKLHuOhd5s73L+UPreVp0A8of2C+X0yBoJx9vaMf/vo
27xqLpeXo4xL+Sv2sfnOhB2x+cWX3u+58qPpvBKJXqeqUqv4IyfLpLGcY9vXmX7
wCl7raKb0xlpHDU0QM+NOsROjIBMPTraCOS3/CIaa0ORVlZ7TCE7UHG4SgNT8tb+
pYxSqwgMBBpJBAOb7FjgEGSEB7+HZS4S7A1vIQf4/Z6GVll2rusH5Nfh1iRXLNbq
nFaQxkIC90+7sFKZU21gQnFPpqYTJBHfKJjZ7kpFKy7rdLTIkV5VHvDIlYOz/5Kz
Y3MNeQDXFmKF9ow0pFHDIQ7K+5Kq5VNfOZYhSVMLHIL9AB1R/tpUNBBaU+UG8bA
MrjNgfziKUhPQif+AfxQ0hVcsa0t1qGtfQ9VarkBPaBuw91CW3GhPOD49ZxSS0+V
lg+E4+LaVLEWQLqcJ0w2uMaaDSwl9r7BbPFAfGjmBMlZGWJDgWPD2We0cZB4aECO
MBRbTEjjLJGejNqA7bJ/A32SUzFC+FPjOxls2pPlmJFBzHCFB1sV9V4l1PrHaGAR
a8bFYIH0F4r/6kiJMXkLZpDAlRKghkwMPOULJDdI9hICX0yxPS7rB2l60tp/0k3Q
2YSGzjS4x0Z6ghm30z1ZKRi/vPGDJe/W7bxyeIRlXkmqpEeKqmERFIWPAKIBvwID
AQABo0IwQDAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4E
FgQU5K8rJnEaK0gnhS9SZizv8IkTcT4wDQYJKoZIhvcNAQEMBQADggIBAJ+qQibb
C5u+/x6Wki4+XAYhzNJnF+YEaorkWHBIqN5h+ab5DP4mVq1dlq8KsB8EvFUMOWb
6d4kYsBMdXh3Imqnd6e9sembZB8ZDpnl1Rjq89bKRCwvQ5QjdBHbIa8cU9/KXHRS
sDMInk57vRDBjEb+wHiE+IG2m+fjKlAZeEJmsP2MHzWB/e9RhjsMnFG+UYbwJElO
Z8Bk44ekaUMO/9JIAbxKJJO7HFB2bVMgrCJ0oFPqzGNMRfRC/RB81/tNR/OtyS+O
sSPm1rHCbPK7nT6svHMpvhSRfKouB5ER9n7phdVlhHYKB6o/qaYPOSzZoh5IaFag
IEEhXbJMji3HsSr5VmPi7COJmM32EqhcvSJj0ZjCCwWjcHqmYNHW+KNXCfEz/EiE
v2FX3w3rnORzID5V1rNJnGPFHdDfCm/bBMOh5icnXqLD+iCYL8jL+S8S5RWd8rnr
V3gP9ntFJMEUwjbc5CWr4YruLWlL5o2iLHdCRj/blKmHHQBdg2HORwRAonMCIwI3
N0kTs2MtcRnN+RR1X/G3lIZ9K3IHM/NUhG27k9UrV3gHGHER3VjqzifKUMzPJsh/
KU0KIq24GaCP0/C5MCIF7wXv0ls0s/DOjA3Qfh9L4P5U3IGEF5FzRHklCe/xjhtg
a4P+4FIznFNB3VEbd7bU9ubsaN6PEnmBiJ+V
-----END CERTIFICATE-----`;

// GlobalSign ECC Root CA R4 (also used by fiskaly)
const GSR4 = `-----BEGIN CERTIFICATE-----
MIIB3DCCAYOgAwIBAgINAgPlfvU/k/2lCSGypjAKBggqhkjOPQQDAjBQMSQwIgYD
VQQLExtHbG9iYWxTaWduIEVDQyBSb290IENBIC0gUjQxEzARBgNVBAoTCkdsb2Jh
bFNpZ24xEzARBgNVBAMTCkdsb2JhbFNpZ24wHhcNMTIxMTEzMDAwMDAwWhcNMzgw
MTE5MDMxNDE1WjBQMSQwIgYDVQQLExtHbG9iYWxTaWduIEVDQyBSb290IENBIC0g
UjQxEzARBgNVBAoTCkdsb2JhbFNpZ24xEzARBgNVBAMTCkdsb2JhbFNpZ24wWTAT
BgcqhkjOPQIBBggqhkjOPQMBBwNCAAS4xnnTj2wlDp8uORkcA6SumuU5BwkWymOx
uYb4ilfBV85C+nOh92VC/x7BALJucw7/xyHlGKSq2XE/qNS5zowdo0IwQDAOBgNV
HQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQU2fYbRVCwEtjC
DpOoc2KYL5NoIgkwCgYIKoZIzj0EAwIDRwAwRAIgQI4RhONpNB1JC+x2YwsMhxXD
+w3lgA3W0MtCe/CEf3ECIAuO0UrAnGiLacFWx/5eqI64o6Xb2fVPxp3bKiYxyDNO
-----END CERTIFICATE-----`;

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

    // Create HTTP client with fiskaly's CA certificates
    const httpClient = Deno.createHttpClient({
      caCerts: [GTS_ROOT_R1, GSR4],
    });

    // Step 1: Authenticate with fiskaly
    const authResponse = await fetch('https://kassensichv2.fiskaly.com/api/v2/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, api_secret: apiSecret }),
      // @ts-ignore - Deno-specific option
      client: httpClient,
    });

    if (!authResponse.ok) {
      const errText = await authResponse.text();
      httpClient.close();
      return new Response(JSON.stringify({ error: 'Fiskaly auth failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const authData = await authResponse.json();
    const accessToken = (authData as any).access_token;

    // Step 2: Generate client ID
    const clientId = crypto.randomUUID();

    // Step 3: Register client under TSS
    const clientResponse = await fetch(
      `https://kassensichv2.fiskaly.com/api/v2/tss/${tssId}/client/${clientId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ serial_number: `ZENBOOK-${clientId.substring(0, 8).toUpperCase()}` }),
        // @ts-ignore - Deno-specific option
        client: httpClient,
      }
    );

    if (!clientResponse.ok) {
      const errText = await clientResponse.text();
      httpClient.close();
      return new Response(JSON.stringify({ error: 'Client registration failed', details: errText }), { status: 500, headers: corsHeaders });
    }

    const clientData = await clientResponse.json();
    httpClient.close();

    return new Response(JSON.stringify({
      success: true,
      client_id: clientId,
      client: clientData,
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
