import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, apiKey, country, serverId } = await req.json();

    if (action === 'getUsdtRate') {
      // Fetch USDT to INR rate from Binance P2P
      const data = {
        additionalKycVerifyFilters: 0,
        asset: "USDT",
        classifies: ["mass", "profession", "fiat_trade"],
        countries: [],
        fiat: "INR",
        filterType: "tradable",
        followed: false,
        page: 1,
        payTypes: [],
        periods: [],
        proMerchantAds: false,
        publisherType: "merchant",
        rows: 20,
        tradeType: "BUY",
        shieldMerchantAds: false,
        tradedWith: false
      };

      const response = await fetch("https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      const price = parseFloat(result?.data?.[0]?.adv?.price || '0');

      return new Response(JSON.stringify({ success: true, rate: price }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get stock data for all smsbower servers (secure - fetches API keys from DB)
    if (action === 'getAllStock') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Fetch smsbower servers with their API keys securely
      const { data: servers, error } = await supabase
        .from('auto_sms_servers')
        .select('id, api_key, country_code')
        .eq('provider', 'smsbower')
        .eq('is_active', true);
      
      if (error || !servers?.length) {
        return new Response(JSON.stringify({ success: true, stockData: {}, serverIds: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const allStockData: Record<string, Record<string, number>> = {};
      const serverIds: string[] = [];
      
      for (const server of servers) {
        try {
          const url = `https://smsbower.online/stubs/handler_api.php?api_key=${server.api_key}&action=getPricesV3&country=${server.country_code}`;
          const response = await fetch(url);
          const pricesData = await response.json();
          
          const serverStock: Record<string, number> = {};
          
          for (const [serviceCode, operators] of Object.entries(pricesData)) {
            if (typeof operators === 'object' && operators !== null) {
              for (const [operatorId, details] of Object.entries(operators as Record<string, { count?: number }>)) {
                const count = (details as { count?: number })?.count || 0;
                const key = `${serviceCode}_${operatorId}`;
                serverStock[key] = count;
              }
            }
          }
          
          allStockData[server.id] = serverStock;
          serverIds.push(server.id);
        } catch (err) {
          console.error(`[smsbower-proxy] Error fetching stock for server ${server.id}:`, err);
        }
      }
      
      return new Response(JSON.stringify({ success: true, stockData: allStockData, serverIds }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'getCountries') {
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const url = `https://smsbower.online/stubs/handler_api.php?api_key=${apiKey}&action=getCountries`;
      const response = await fetch(url);
      const data = await response.json();

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'getServicesList') {
      if (!apiKey) {
        return new Response(JSON.stringify({ error: 'API key required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const url = `https://smsbower.online/stubs/handler_api.php?api_key=${apiKey}&action=getServicesList`;
      const response = await fetch(url);
      const data = await response.json();

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'getPricesV3') {
      if (!apiKey || !country) {
        return new Response(JSON.stringify({ error: 'API key and country required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const url = `https://smsbower.online/stubs/handler_api.php?api_key=${apiKey}&action=getPricesV3&country=${country}`;
      const response = await fetch(url);
      const data = await response.json();

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[smsbower-proxy] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
