import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BharatPeTransaction {
  bankReferenceNo: string;
  amount: number;
  payerName: string;
  payerHandle: string;
  status: string;
}

interface BharatPeResponse {
  data?: {
    transactions?: BharatPeTransaction[];
  };
  status?: string;
  message?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, txn_id } = await req.json();

    // Validate inputs
    if (!user_id || !txn_id) {
      console.error('Missing required fields:', { user_id: !!user_id, txn_id: !!txn_id });
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id or txn_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate UTR format - alphanumeric only, max 12 chars
    const utrPattern = /^[a-zA-Z0-9]+$/;
    if (!utrPattern.test(txn_id)) {
      console.error('Invalid UTR format - contains special characters:', txn_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid UTR - only alphanumeric characters allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (txn_id.length > 12) {
      console.error('UTR too long:', txn_id.length);
      return new Response(
        JSON.stringify({ success: false, error: 'UTR cannot be more than 12 digits' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (txn_id.startsWith('0')) {
      console.error('UTR starts with 0:', txn_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid UTR entered' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if UTR already used
    const { data: existingRecharge } = await supabase
      .from('upi_recharges')
      .select('id')
      .eq('txn_id', txn_id)
      .single();

    if (existingRecharge) {
      console.error('UTR already used:', txn_id);
      return new Response(
        JSON.stringify({ success: false, error: 'UTR already used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get UPI settings
    const { data: settings, error: settingsError } = await supabase
      .from('upi_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError || !settings) {
      console.error('Failed to get UPI settings:', settingsError);
      return new Response(
        JSON.stringify({ success: false, error: 'Payment system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.is_active) {
      console.error('UPI payments disabled');
      return new Response(
        JSON.stringify({ success: false, error: 'UPI payments are currently disabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.merchant_id || !settings.merchant_token) {
      console.error('BharatPe credentials not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Payment gateway not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Verifying UTR with BharatPe:', txn_id);

    // Call BharatPe API
    const bharatpeUrl = `https://payments-tesseract.bharatpe.in/api/v1/merchant/transactions?module=PAYMENT_QR&merchantId=${settings.merchant_id}`;
    
    const bharatpeResponse = await fetch(bharatpeUrl, {
      method: 'GET',
      headers: {
        'token': settings.merchant_token,
        'Content-Type': 'application/json',
      },
    });

    if (!bharatpeResponse.ok) {
      console.error('BharatPe API error:', bharatpeResponse.status, bharatpeResponse.statusText);
      return new Response(
        JSON.stringify({ success: false, error: 'Payment verification failed. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const bharatpeData: BharatPeResponse = await bharatpeResponse.json();
    console.log('BharatPe response received, transactions count:', bharatpeData?.data?.transactions?.length || 0);

    // Find matching transaction
    const transactions = bharatpeData?.data?.transactions || [];
    const matchingTransaction = transactions.find(
      (t: BharatPeTransaction) => t.bankReferenceNo === txn_id
    );

    if (!matchingTransaction) {
      console.error('Transaction not found in BharatPe:', txn_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Payment not found. Please check your UTR and try again.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const amount = matchingTransaction.amount;
    const payerName = matchingTransaction.payerName || null;
    const payerHandle = matchingTransaction.payerHandle || null;

    console.log('Transaction found:', { amount, payerName, payerHandle });

    // Check minimum recharge
    if (amount < settings.min_recharge) {
      console.error('Amount below minimum:', amount, 'min:', settings.min_recharge);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Amount ₹${amount} is less than minimum recharge of ₹${settings.min_recharge}. Please contact support.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Process the recharge using database function
    const { data: result, error: processError } = await supabase.rpc('process_upi_recharge', {
      p_user_id: user_id,
      p_amount: amount,
      p_txn_id: txn_id,
      p_payer_name: payerName,
      p_payer_handle: payerHandle,
    });

    if (processError) {
      console.error('Error processing recharge:', processError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to process recharge. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const processResult = result as { success: boolean; error?: string; amount?: number; new_balance?: number };

    if (!processResult.success) {
      console.error('Recharge processing failed:', processResult.error);
      return new Response(
        JSON.stringify({ success: false, error: processResult.error || 'Failed to process recharge' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Recharge successful:', processResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: `₹${amount} credited to your account`,
        amount: amount,
        new_balance: processResult.new_balance,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});