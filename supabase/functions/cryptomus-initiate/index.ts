import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CryptoSettings {
  merchant_id: string;
  api_key: string;
  min_recharge: number;
  is_active: boolean;
}

// MD5 hash function using Web Crypto API workaround
async function md5(message: string): Promise<string> {
  // Use a simple MD5 implementation since Deno doesn't support MD5 in crypto.subtle
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
  // MD5 implementation
  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function add32(a: number, b: number) {
    return (a + b) & 0xFFFFFFFF;
  }

  function md5blk(s: Uint8Array) {
    const md5blks: number[] = [];
    for (let i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s[i] + (s[i + 1] << 8) + (s[i + 2] << 16) + (s[i + 3] << 24);
    }
    return md5blks;
  }

  function rhex(n: number) {
    const hex_chr = '0123456789abcdef';
    let s = '';
    for (let j = 0; j < 4; j++) {
      s += hex_chr.charAt((n >> (j * 8 + 4)) & 0x0F) + hex_chr.charAt((n >> (j * 8)) & 0x0F);
    }
    return s;
  }

  function hex(x: number[]) {
    return rhex(x[0]) + rhex(x[1]) + rhex(x[2]) + rhex(x[3]);
  }

  const n = data.length;
  const state = [1732584193, -271733879, -1732584194, 271733878];
  let i: number;
  
  for (i = 64; i <= n; i += 64) {
    md5cycle(state, md5blk(data.slice(i - 64, i)));
  }
  
  const tail = new Uint8Array(64);
  const remaining = n - (i - 64);
  for (let j = 0; j < remaining; j++) {
    tail[j] = data[i - 64 + j];
  }
  tail[remaining] = 0x80;
  
  if (remaining > 55) {
    md5cycle(state, md5blk(tail));
    tail.fill(0);
  }
  
  const bitLen = n * 8;
  tail[56] = bitLen & 0xFF;
  tail[57] = (bitLen >> 8) & 0xFF;
  tail[58] = (bitLen >> 16) & 0xFF;
  tail[59] = (bitLen >> 24) & 0xFF;
  tail[60] = 0;
  tail[61] = 0;
  tail[62] = 0;
  tail[63] = 0;
  
  md5cycle(state, md5blk(tail));
  
  return hex(state);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, user_id } = await req.json();

    if (!amount || !user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Amount and user_id are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Cryptomus settings from app_settings
    const { data: settingsData, error: settingsError } = await supabase.rpc('get_app_setting', {
      p_setting_key: 'cryptomus_settings'
    });

    if (settingsError) {
      console.error('[cryptomus-initiate] Error fetching settings:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to fetch crypto settings' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Parse settings - get_app_setting returns JSONB directly
    let settings: CryptoSettings | null = null;

    if (settingsData && typeof settingsData === 'object') {
      const data = settingsData as Record<string, unknown>;
      // Direct JSONB response
      if ('merchant_id' in data && 'api_key' in data) {
        settings = data as unknown as CryptoSettings;
      }
    }

    console.log('[cryptomus-initiate] Settings loaded:', { 
      has_merchant_id: !!settings?.merchant_id, 
      has_api_key: !!settings?.api_key,
      is_active: settings?.is_active,
      min_recharge: settings?.min_recharge
    });

    if (!settings || !settings.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Crypto payments are not enabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (!settings.merchant_id || !settings.api_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'Crypto payment not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check minimum amount (Cryptomus requires minimum 81 INR)
    const cryptomusMinimum = 81;
    const minAmount = Math.max(settings.min_recharge || 10, cryptomusMinimum);
    
    if (amount < minAmount) {
      return new Response(
        JSON.stringify({ success: false, error: `Minimum recharge amount is ₹${minAmount}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Generate unique order ID
    const order_id = `CRYPTO_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Cryptomus API endpoint
    const cryptomusUrl = 'https://api.cryptomus.com/v1/payment';
    
    // Create payment request body per Cryptomus docs
    const paymentData = {
      amount: amount.toString(),
      currency: 'INR',
      order_id: order_id,
      url_callback: `${supabaseUrl}/functions/v1/cryptomus-webhook`,
      url_return: `${req.headers.get('origin') || 'https://app.example.com'}/recharge?status=success`,
      is_payment_multiple: false,
      lifetime: 3600, // 1 hour
      additional_data: JSON.stringify({ user_id })
    };

    console.log('[cryptomus-initiate] Creating payment:', { order_id, amount, user_id });

    // Generate signature for Cryptomus: MD5(base64(JSON) + API_KEY)
    const jsonString = JSON.stringify(paymentData);
    const dataToSign = btoa(jsonString);
    const signString = dataToSign + settings.api_key;
    const sign = await md5(signString);

    console.log('[cryptomus-initiate] Generated signature');

    // Make request to Cryptomus
    const response = await fetch(cryptomusUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'merchant': settings.merchant_id,
        'sign': sign
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    console.log('[cryptomus-initiate] Cryptomus response:', result);

    if (!response.ok || result.state !== 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.message || 'Failed to create payment' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Return payment URL
    return new Response(
      JSON.stringify({
        success: true,
        payment_url: result.result?.url,
        order_id: order_id,
        amount: amount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cryptomus-initiate] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
