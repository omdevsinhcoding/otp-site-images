import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, action, params } = await req.json();
    
    if (!apiKey || !action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing apiKey or action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build URL based on action
    let url = `http://api1.5sim.net/stubs/handler_api.php?api_key=${apiKey}&action=${action}`;
    
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url += `&${key}=${value}`;
      }
    }

    console.log(`[fivesim-proxy] Calling: ${url.replace(apiKey, '***')}`);

    const response = await fetch(url);
    const data = await response.json();

    console.log(`[fivesim-proxy] Response status: ${response.status}`);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[fivesim-proxy] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
