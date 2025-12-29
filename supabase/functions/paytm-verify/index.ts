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

// Generate HMAC-SHA256 checksum using MID as key (same as PHP check.php)
async function generateChecksum(data: Record<string, string>, mid: string): Promise<string> {
  const jsonData = JSON.stringify(data);
  const encoder = new TextEncoder();
  const keyData = encoder.encode(mid);
  const msgData = encoder.encode(jsonData);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, order_id, amount, user_id } = await req.json();
    console.log(`[paytm-verify] Action: ${action}, Order: ${order_id}, Amount: ${amount}`);

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
      console.error('[paytm-verify] Settings not found:', settingError);
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

    // Action: get_settings - Return public settings for frontend
    if (action === 'get_settings') {
      return new Response(
        JSON.stringify({
          success: true,
          settings: {
            upi_id: settings.upi_id,
            payee_name: settings.payee_name,
            min_recharge: settings.min_recharge,
            max_pending_minutes: settings.max_pending_minutes,
            is_active: settings.is_active
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: check_status - Verify payment status with Paytm
    if (action === 'check_status') {
      if (!order_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing order_id' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!settings.merchant_mid) {
        return new Response(
          JSON.stringify({ success: false, error: 'Paytm MID not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if order exists and is pending
      const { data: orderData, error: orderError } = await supabase.rpc('get_pending_paytm_order', {
        p_user_id: user_id,
        p_order_id: order_id
      });

      if (orderError) {
        console.error('[paytm-verify] Order lookup error:', orderError);
      }

      // Method 1: Use merchant-status/getTxnStatus with POST (like PHP check.php)
      const paytmTxnUrl = "https://securegw.paytm.in/merchant-status/getTxnStatus";
      
      const data: Record<string, string> = {
        MID: settings.merchant_mid,
        ORDERID: order_id
      };

      // Generate checksum using MID as the key (same logic as PHP)
      const checksum = await generateChecksum(data, settings.merchant_mid);
      
      const requestBody = {
        ...data,
        CHECKSUMHASH: checksum
      };

      console.log(`[paytm-verify] Checking status for Order: ${order_id} with MID: ${settings.merchant_mid}`);
      console.log(`[paytm-verify] Request body:`, JSON.stringify(requestBody));

      try {
        const statusResponse = await fetch(paytmTxnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const paytmResult = await statusResponse.json();
        console.log('[paytm-verify] Paytm response:', JSON.stringify(paytmResult));

        const status = paytmResult.STATUS;
        const txnAmount = parseFloat(paytmResult.TXNAMOUNT || '0');
        const midFromResponse = paytmResult.MID;
        const orderIdFromResponse = paytmResult.ORDERID;

        // FIRST: Check if order is "invalid" (not in Paytm system yet = payment pending)
        // This MUST be checked BEFORE TXN_FAILURE to avoid showing error prematurely
        const isInvalidOrder = 
          paytmResult.RESPCODE === '330' || 
          paytmResult.RESPCODE === '334' ||
          paytmResult.RESPMSG?.toLowerCase().includes('invalid order');

        if (isInvalidOrder) {
          // Order not found in Paytm - user hasn't paid yet, keep waiting
          console.log('[paytm-verify] Order not in Paytm yet, treating as PENDING');
          return new Response(
            JSON.stringify({
              success: false,
              status: 'PENDING',
              message: 'Waiting for payment...'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // THEN: Check for real success
        if (status === 'TXN_SUCCESS') {
          // Verify the response matches our request
          if (midFromResponse === settings.merchant_mid && orderIdFromResponse === order_id) {
            console.log('[paytm-verify] Payment successful!');

            // Update order status in database
            await supabase.rpc('update_paytm_order', {
              p_order_id: order_id,
              p_status: 'success',
              p_paytm_txn_id: paytmResult.TXNID || null,
              p_bank_txn_id: paytmResult.BANKTXNID || null,
              p_gateway_name: paytmResult.GATEWAYNAME || null,
              p_payment_mode: paytmResult.PAYMENTMODE || null,
              p_resp_code: paytmResult.RESPCODE || null,
              p_resp_msg: paytmResult.RESPMSG || null
            });

            // Credit user balance
            if (user_id && (amount || txnAmount)) {
              const creditAmount = amount || txnAmount;
              const { data: rechargeResult, error: rechargeError } = await supabase.rpc('add_user_recharge', {
                p_user_id: user_id,
                p_amount: creditAmount
              });

              if (rechargeError) {
                console.error('[paytm-verify] Failed to credit balance:', rechargeError);
                return new Response(
                  JSON.stringify({
                    success: false,
                    status: 'CREDIT_FAILED',
                    error: 'Payment verified but failed to credit balance'
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }

              console.log('[paytm-verify] Balance credited:', rechargeResult);
            }

            return new Response(
              JSON.stringify({
                success: true,
                status: 'TXN_SUCCESS',
                utr: paytmResult.BANKTXNID || 'N/A',
                txn_id: paytmResult.TXNID || 'N/A',
                amount: txnAmount,
                payment_mode: paytmResult.PAYMENTMODE
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          } else {
            console.error('[paytm-verify] Response MID/ORDERID mismatch!');
          }
        }

        // THEN: Check for real failure (after eliminating "invalid order" cases)
        if (status === 'TXN_FAILURE') {
          // Update order as failed
          await supabase.rpc('update_paytm_order', {
            p_order_id: order_id,
            p_status: 'failed',
            p_resp_code: paytmResult.RESPCODE || null,
            p_resp_msg: paytmResult.RESPMSG || null
          });

          return new Response(
            JSON.stringify({
              success: false,
              status: 'TXN_FAILURE',
              message: paytmResult.RESPMSG || 'Payment failed'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Other pending status
        return new Response(
          JSON.stringify({
            success: false,
            status: status || 'PENDING',
            message: paytmResult.RESPMSG || 'Payment pending'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (fetchError) {
        console.error('[paytm-verify] Fetch error:', fetchError);
        return new Response(
          JSON.stringify({ success: false, status: 'PENDING', error: 'Network error checking status' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[paytm-verify] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
