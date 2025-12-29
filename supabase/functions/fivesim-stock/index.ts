import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch servers from both tables
    const [smsServersRes, autoSmsServersRes] = await Promise.all([
      supabase.from('sms_servers').select('id, server_name, api_get_number_url, country_code').eq('is_active', true),
      supabase.from('auto_sms_servers').select('id, server_name, api_get_number_url, country_code').eq('is_active', true)
    ]);

    const allServers = [
      ...(smsServersRes.data || []),
      ...(autoSmsServersRes.data || [])
    ];

    // Filter servers that are 5sim (check if api_get_number_url contains 5sim)
    const fiveSimServers = allServers.filter(server => {
      const url = server.api_get_number_url || '';
      return url.toLowerCase().includes('5sim') || url.toLowerCase().includes('api1.5sim.net');
    });

    if (fiveSimServers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, stockData: {}, serverIds: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stockData: Record<string, Record<string, string>> = {};
    
    for (const server of fiveSimServers) {
      // Extract api_key from api_get_number_url using URL parsing
      let apiKey: string | null = null;
      
      try {
        // The URL might have placeholders, but api_key should be a real value
        const urlString = server.api_get_number_url;
        // Use regex to extract api_key parameter value
        const apiKeyMatch = urlString.match(/api_key=([^&]+)/);
        if (apiKeyMatch && apiKeyMatch[1]) {
          const extractedKey = apiKeyMatch[1];
          // Skip if it's a placeholder
          if (!extractedKey.includes('{') && !extractedKey.includes('}')) {
            apiKey = extractedKey;
          }
        }
      } catch (e) {
        // Failed to parse URL, skip this server
      }
      
      if (!apiKey) {
        continue;
      }

      // Use country_code from the database column
      const countryCode = server.country_code;
      
      if (!countryCode) {
        continue;
      }

      // Build the getNumbersStatus URL dynamically
      const stockUrl = `http://api1.5sim.net/stubs/handler_api.php?api_key=${apiKey}&action=getNumbersStatus&country=${countryCode}`;
      
      try {
        const response = await fetch(stockUrl);
        const text = await response.text();
        
        if (response.ok && text) {
          try {
            const data = JSON.parse(text);
            // Store raw response - keys like "servicename_0": "count"
            stockData[server.id] = data;
          } catch (parseError) {
            console.error(`Failed to parse JSON for server ${server.server_name}:`, parseError);
          }
        }
      } catch (fetchError) {
        console.error(`Failed to fetch for server ${server.server_name}:`, fetchError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        stockData,
        serverIds: fiveSimServers.map(s => s.id)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in fivesim-stock function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
