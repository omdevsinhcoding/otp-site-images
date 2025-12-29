import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ServerConfig {
  id: string
  api_cancel_number_url: string | null
  uses_headers: boolean
  header_key_name: string | null
  header_value: string | null
}

interface PendingCancellation {
  id: string
  activation_id: string
  server_id: string
  service_id: string | null
  phone_number: string
  status: string
  cancel_after: string
  attempts: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('Processing pending cancellations...')

    // Get all pending cancellations where cancel_after has passed and attempts < 5
    const now = new Date().toISOString()
    const { data: pendingItems, error: fetchError } = await supabase
      .from('pending_cancellations')
      .select('*')
      .eq('status', 'pending')
      .lte('cancel_after', now)
      .lt('attempts', 5)
      .order('cancel_after', { ascending: true })
      .limit(20) // Process max 20 at a time

    if (fetchError) {
      console.error('Failed to fetch pending cancellations:', fetchError)
      return new Response(
        JSON.stringify({ success: false, error: fetchError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!pendingItems || pendingItems.length === 0) {
      console.log('No pending cancellations to process')
      return new Response(
        JSON.stringify({ success: true, processed: 0, message: 'No pending cancellations' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${pendingItems.length} pending cancellations to process`)

    // Cache server configs to avoid repeated lookups
    const serverCache: Record<string, ServerConfig | null> = {}

    const getServerConfig = async (serverId: string): Promise<ServerConfig | null> => {
      if (serverCache[serverId] !== undefined) {
        return serverCache[serverId]
      }

      // Try sms_servers first
      const { data: smsServer } = await supabase
        .from('sms_servers')
        .select('id, api_cancel_number_url, uses_headers, header_key_name, header_value')
        .eq('id', serverId)
        .maybeSingle()

      if (smsServer) {
        serverCache[serverId] = smsServer as ServerConfig
        return smsServer as ServerConfig
      }

      // Try auto_sms_servers
      const { data: autoServer } = await supabase
        .from('auto_sms_servers')
        .select('id, api_cancel_number_url, uses_headers, header_key_name, header_value')
        .eq('id', serverId)
        .maybeSingle()

      if (autoServer) {
        serverCache[serverId] = autoServer as ServerConfig
        return autoServer as ServerConfig
      }

      serverCache[serverId] = null
      return null
    }

    let processed = 0
    let cancelled = 0
    let failed = 0

    for (const item of pendingItems as PendingCancellation[]) {
      console.log(`Processing cancellation for ${item.activation_id}...`)
      
      const server = await getServerConfig(item.server_id)
      
      if (!server || !server.api_cancel_number_url) {
        console.log(`No cancel URL for server ${item.server_id}, marking as failed`)
        await supabase.from('pending_cancellations')
          .update({ 
            status: 'failed', 
            error_message: 'No cancel URL configured',
            attempts: item.attempts + 1 
          })
          .eq('id', item.id)
        failed++
        continue
      }

      try {
        const cancelUrl = server.api_cancel_number_url
          .replace('{id}', item.activation_id)
          .replace('{activation_id}', item.activation_id)

        const headers: Record<string, string> = {}
        if (server.uses_headers && server.header_key_name && server.header_value) {
          headers[server.header_key_name] = server.header_value
        }

        console.log(`Calling cancel URL: ${cancelUrl}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        
        const response = await fetch(cancelUrl, { 
          headers, 
          signal: controller.signal 
        })
        clearTimeout(timeoutId)
        
        const responseText = await response.text()
        console.log(`Cancel response for ${item.activation_id}:`, responseText)

        // Check if successful
        if (responseText.includes('ACCESS_CANCEL') || responseText.includes('STATUS_CANCEL') || responseText.includes('CANCEL')) {
          await supabase.from('pending_cancellations')
            .update({ 
              status: 'cancelled', 
              cancelled_at: new Date().toISOString() 
            })
            .eq('id', item.id)
          cancelled++
          console.log(`Successfully cancelled ${item.activation_id}`)
        } else if (responseText.includes('NO_ACTIVATION') || responseText.includes('BAD_KEY')) {
          // Number doesn't exist or bad key - mark as failed permanently
          await supabase.from('pending_cancellations')
            .update({ 
              status: 'failed', 
              error_message: responseText,
              attempts: 5 // Max attempts to stop retrying
            })
            .eq('id', item.id)
          failed++
        } else if (responseText.includes('EARLY_CANCEL_DENIED')) {
          // Need to wait longer - increment attempts and retry later
          await supabase.from('pending_cancellations')
            .update({ 
              attempts: item.attempts + 1,
              error_message: responseText,
              cancel_after: new Date(Date.now() + 60000).toISOString() // Retry in 1 minute
            })
            .eq('id', item.id)
          console.log(`Early cancel denied for ${item.activation_id}, will retry in 1 minute`)
        } else {
          // Unknown response - increment attempts
          await supabase.from('pending_cancellations')
            .update({ 
              attempts: item.attempts + 1,
              error_message: responseText
            })
            .eq('id', item.id)
        }
        
        processed++
      } catch (e) {
        console.error(`Error cancelling ${item.activation_id}:`, e)
        await supabase.from('pending_cancellations')
          .update({ 
            attempts: item.attempts + 1,
            error_message: String(e)
          })
          .eq('id', item.id)
        failed++
        processed++
      }
    }

    console.log(`Processed: ${processed}, Cancelled: ${cancelled}, Failed: ${failed}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed, 
        cancelled, 
        failed,
        message: `Processed ${processed} cancellations` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Process cancellations error:', error)
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
