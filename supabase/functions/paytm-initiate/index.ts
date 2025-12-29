import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaytmSettings {
  upi_id: string;
  merchant_mid: string;
  payee_name: string;
  min_recharge: number;
  max_pending_minutes: number;
  is_active: boolean;
}

function generateOrderId(): string {
  const timestamp = Date.now();
  const randomNum = Math.floor(Math.random() * 9999999999999999) + 10000000;
  return `${randomNum}`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, amount } = await req.json();
    console.log(`[paytm-initiate] User: ${user_id}, Amount: ${amount}`);

    if (!user_id || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id or amount' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch settings
    const { data: settingData, error: settingError } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'auto_payment_settings')
      .single();

    if (settingError || !settingData) {
      console.error('[paytm-initiate] Settings not found:', settingError);
      return new Response(
        JSON.stringify({ success: false, error: 'Auto payment not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const settings = settingData.setting_value as PaytmSettings;

    if (!settings.is_active) {
      return new Response(
        JSON.stringify({ success: false, error: 'Auto payment is disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.merchant_mid || !settings.upi_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Paytm merchant credentials not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (amount < settings.min_recharge) {
      return new Response(
        JSON.stringify({ success: false, error: `Minimum amount is ₹${settings.min_recharge}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate unique order ID (like PHP script: mt_rand format)
    const orderId = generateOrderId();
    console.log(`[paytm-initiate] Generated Order ID: ${orderId}`);

    // Create order in database
    const { data: orderResult, error: orderError } = await supabase.rpc('create_paytm_order', {
      p_user_id: user_id,
      p_order_id: orderId,
      p_amount: amount,
      p_expires_minutes: settings.max_pending_minutes || 10
    });

    if (orderError || !orderResult?.success) {
      console.error('[paytm-initiate] Failed to create order:', orderError || orderResult?.error);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate UPI intent URL (same format as PHP script)
    // upi://pay?pa=paytmqr2810050501011s25rtxh7ixy@paytm&pn=Paytm%20Merchant&paytmqr=1jr3q358rp&tr=$rnd&tn=PAYING%20TO%20OTP%20WEB&am=$amount
    const upiUrl = `upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.payee_name)}&am=${amount}&cu=INR&tn=Payment%20to%20${encodeURIComponent(settings.payee_name)}&tr=${orderId}`;
    
    // Generate QR using API
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(upiUrl)}&size=256x256`;

    console.log(`[paytm-initiate] UPI URL: ${upiUrl}`);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        amount: amount,
        upi_url: upiUrl,
        qr_url: qrUrl,
        payee_name: settings.payee_name,
        timeout_minutes: settings.max_pending_minutes || 10
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[paytm-initiate] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
