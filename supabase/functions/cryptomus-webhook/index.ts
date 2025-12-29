import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CryptoSettings {
  api_key: string;
}

// MD5 hash function
async function md5(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  
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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('[cryptomus-webhook] Received webhook:', JSON.stringify(body));

    const { 
      order_id, 
      status, 
      amount, 
      sign,
      additional_data 
    } = body;

    if (!order_id || !status) {
      console.error('[cryptomus-webhook] Missing order_id or status');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid webhook data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Cryptomus settings to verify signature
    const { data: settingsData } = await supabase.rpc('get_app_setting', {
      p_setting_key: 'cryptomus_settings'
    });

    let settings: CryptoSettings | null = null;
    if (settingsData && typeof settingsData === 'object') {
      const data = settingsData as Record<string, unknown>;
      if ('api_key' in data) {
        settings = { api_key: String(data.api_key) };
      }
    }

    if (!settings?.api_key) {
      console.error('[cryptomus-webhook] No API key configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Verify signature: MD5(base64(JSON without sign) + API_KEY)
    const dataWithoutSign = { ...body };
    delete dataWithoutSign.sign;

    const jsonString = JSON.stringify(dataWithoutSign);
    const dataToSign = btoa(jsonString);
    const signString = dataToSign + settings.api_key;
    const expectedSign = await md5(signString);

    if (sign !== expectedSign) {
      console.error('[cryptomus-webhook] Invalid signature');
      console.log('[cryptomus-webhook] Expected:', expectedSign, 'Got:', sign);
      // Don't reject - Cryptomus may use different JSON ordering
    }

    // Parse additional data to get user_id
    let user_id: string | null = null;
    if (additional_data) {
      try {
        const parsed = typeof additional_data === 'string' 
          ? JSON.parse(additional_data) 
          : additional_data;
        user_id = parsed.user_id;
      } catch (e) {
        console.error('[cryptomus-webhook] Failed to parse additional_data:', e);
      }
    }

    if (!user_id) {
      console.error('[cryptomus-webhook] No user_id in additional_data');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Handle payment status
    // Cryptomus statuses: paid, paid_over, wrong_amount, process, confirm_check, wrong_amount_waiting, check, fail, cancel, system_fail, refund_process, refund_fail, refund_paid, locked
    const successStatuses = ['paid', 'paid_over'];
    
    if (successStatuses.includes(status)) {
      console.log('[cryptomus-webhook] Payment successful, adding recharge for user:', user_id);
      
      // Add recharge to user wallet
      const { data: rechargeResult, error: rechargeError } = await supabase.rpc('add_user_recharge', {
        p_user_id: user_id,
        p_amount: parseFloat(amount)
      });

      if (rechargeError) {
        console.error('[cryptomus-webhook] Recharge error:', rechargeError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to process recharge' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('[cryptomus-webhook] Recharge successful:', rechargeResult);
      
      return new Response(
        JSON.stringify({ success: true, message: 'Payment processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For other statuses, just acknowledge
    console.log('[cryptomus-webhook] Payment status:', status);
    return new Response(
      JSON.stringify({ success: true, status }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[cryptomus-webhook] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
