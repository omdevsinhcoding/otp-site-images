import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ServerConfig {
  id: string
  api_get_number_url: string
  api_get_message_url: string | null
  api_activate_next_message_url: string | null
  api_cancel_number_url: string | null
  api_response_type: string
  api_retry_count: number
  country_code: string
  country_dial_code: string
  uses_headers: boolean
  header_key_name: string | null
  header_value: string | null
  number_id_path: string | null
  phone_number_path: string | null
  otp_path_in_json: string | null
}

interface ServiceConfig {
  id: string
  service_code: string
  final_price: number
  operator?: string
}

// Helper to parse API response
function parseApiResponse(response: string, responseType: string): { id: string; number: string } | null {
  console.log('Parsing response:', response, 'Type:', responseType)
  
  // Common format: ACCESS_NUMBER:id:phone_number
  if (response.startsWith('ACCESS_NUMBER:')) {
    const parts = response.split(':')
    if (parts.length >= 3) {
      return {
        id: parts[1],
        number: parts[2]
      }
    }
  }
  
  // Try JSON parsing
  if (responseType === 'json') {
    try {
      const json = JSON.parse(response)
      // Handle various JSON structures
      if (json.id && json.number) {
        return { id: String(json.id), number: String(json.number) }
      }
      if (json.activation_id && json.phone) {
        return { id: String(json.activation_id), number: String(json.phone) }
      }
    } catch (e) {
      console.log('JSON parse failed:', e)
    }
  }
  
  return null
}

// Helper to check if response indicates no number
function isNoNumberResponse(response: string): boolean {
  const noNumberPatterns = [
    'NO_NUMBER',
    'NO_NUMBERS',
    'WRONG_SERVICE',
    'WRONG_COUNTRY',
    'NO_BALANCE'
  ]
  return noNumberPatterns.some(pattern => response.includes(pattern))
}

interface MessageParseResult {
  status: 'waiting' | 'received' | 'cancelled' | 'error' | 'waiting_retry'
  message?: string
  errorType?: string
  lastCode?: string
}

// Helper to parse message/OTP response
function parseMessageResponse(response: string, responseType: string, otpPath: string | null): MessageParseResult {
  const trimmedResponse = response.trim()
  console.log('Parsing message response:', trimmedResponse)
  
  // Check for error/status responses first
  if (trimmedResponse.includes('BAD_KEY')) {
    return { status: 'error', errorType: 'BAD_KEY' }
  }
  if (trimmedResponse.includes('BAD_ACTION')) {
    return { status: 'error', errorType: 'BAD_ACTION' }
  }
  if (trimmedResponse.includes('NO_ACTIVATION')) {
    return { status: 'error', errorType: 'NO_ACTIVATION' }
  }
  
  // Check for waiting status
  if (trimmedResponse === 'STATUS_WAIT_CODE' || trimmedResponse.includes('STATUS_WAIT_CODE')) {
    return { status: 'waiting' }
  }
  
  // Check for cancel status
  if (trimmedResponse === 'STATUS_CANCEL' || trimmedResponse.includes('STATUS_CANCEL')) {
    return { status: 'cancelled' }
  }
  
  // Check for waiting retry (got code, waiting for next)
  if (trimmedResponse.startsWith('STATUS_WAIT_RETRY:')) {
    const lastCode = trimmedResponse.split(':')[1]
    return { status: 'waiting_retry', lastCode }
  }
  
  // Check for received OTP
  // Format: STATUS_OK:code
  if (trimmedResponse.startsWith('STATUS_OK:')) {
    const otp = trimmedResponse.split(':')[1]
    return { status: 'received', message: otp }
  }
  
  // Try JSON parsing
  if (responseType === 'json') {
    try {
      const json = JSON.parse(trimmedResponse)
      
      // Check for status field
      if (json.status === 'PENDING' || json.status === 'WAIT_CODE') {
        return { status: 'waiting' }
      }
      if (json.status === 'RECEIVED' || json.status === 'FINISHED') {
        // Try to extract OTP from specified path
        let message = json.sms || json.code || json.text || json.message
        if (otpPath && json[otpPath]) {
          message = json[otpPath]
        }
        return { status: 'received', message }
      }
    } catch (e) {
      // Not JSON, continue
    }
  }
  
  // If contains digits that look like OTP
  const otpMatch = trimmedResponse.match(/\b(\d{4,8})\b/)
  if (otpMatch) {
    return { status: 'received', message: otpMatch[1] }
  }
  
  return { status: 'waiting' }
}

// Helper function to get activation with server config from either table
async function getActivationWithServer(supabase: any, activationId: string, userId: string): Promise<{ activation: any; serverConfig: ServerConfig } | null> {
  // First get the activation
  const { data: activation, error: activationError } = await supabase
    .from('number_activations')
    .select('*')
    .eq('activation_id', activationId)
    .eq('user_id', userId)
    .single()

  if (activationError || !activation) {
    console.log('Activation lookup failed:', activationError?.message || 'Not found')
    return null
  }

  console.log('Found activation:', activation.id, 'server_id:', activation.server_id)

  // Try to get server from sms_servers first
  const { data: smsServer, error: smsError } = await supabase
    .from('sms_servers')
    .select('*')
    .eq('id', activation.server_id)
    .maybeSingle()

  if (smsServer) {
    console.log('Found server in sms_servers:', smsServer.server_name)
    return { activation, serverConfig: smsServer as ServerConfig }
  }

  // Try auto_sms_servers
  const { data: autoServer, error: autoError } = await supabase
    .from('auto_sms_servers')
    .select('*')
    .eq('id', activation.server_id)
    .maybeSingle()

  if (autoServer) {
    console.log('Found server in auto_sms_servers:', autoServer.server_name)
    return { activation, serverConfig: autoServer as ServerConfig }
  }

  console.log('Server not found in either table for server_id:', activation.server_id)
  return null
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, userId, serverId, serviceId, activationId } = await req.json()
    console.log('SMS API called with action:', action, 'userId:', userId)

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User ID required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET NUMBER
    if (action === 'get_number') {
      if (!serverId || !serviceId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Server ID and Service ID required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Try fetching from sms_servers first, then auto_sms_servers
      let server: any = null
      let serverError: any = null

      const { data: smsServer, error: smsServerError } = await supabase
        .from('sms_servers')
        .select('*')
        .eq('id', serverId)
        .maybeSingle()

      if (smsServer) {
        server = smsServer
      } else {
        // Try auto_sms_servers
        const { data: autoServer, error: autoServerError } = await supabase
          .from('auto_sms_servers')
          .select('*')
          .eq('id', serverId)
          .maybeSingle()

        if (autoServer) {
          server = autoServer
        } else {
          serverError = smsServerError || autoServerError
        }
      }

      if (!server) {
        console.error('Server fetch error:', serverError)
        return new Response(
          JSON.stringify({ success: false, error: 'Server not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Try fetching from services first, then auto_services
      let service: any = null
      let serviceError: any = null

      const { data: regularService, error: regularServiceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .maybeSingle()

      if (regularService) {
        service = regularService
      } else {
        // Try auto_services
        const { data: autoService, error: autoServiceError } = await supabase
          .from('auto_services')
          .select('*')
          .eq('id', serviceId)
          .maybeSingle()

        if (autoService) {
          service = autoService
        } else {
          serviceError = regularServiceError || autoServiceError
        }
      }

      if (!service) {
        console.error('Service fetch error:', serviceError)
        return new Response(
          JSON.stringify({ success: false, error: 'Service not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const serverConfig = server as ServerConfig
      const serviceConfig = service as ServiceConfig

      // Build the API URL - replace all placeholders
      let apiUrl = serverConfig.api_get_number_url
        .replace('{service_code}', serviceConfig.service_code)
        .replace('{service}', serviceConfig.service_code)
        .replace('{country_code}', serverConfig.country_code)
        .replace('{country}', serverConfig.country_code)
        .replace('{operator}', serviceConfig.operator || '')
        .replace('{provider_id}', serviceConfig.operator || '')

      console.log('Calling API URL:', apiUrl)

      // Prepare headers
      const headers: Record<string, string> = {}
      if (serverConfig.uses_headers && serverConfig.header_key_name && serverConfig.header_value) {
        headers[serverConfig.header_key_name] = serverConfig.header_value
      }

      // Fast fetch with timeout
      const fetchWithTimeout = async (url: string, opts: RequestInit, timeoutMs: number = 8000): Promise<Response> => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        try {
          const response = await fetch(url, { ...opts, signal: controller.signal })
          clearTimeout(timeoutId)
          return response
        } catch (e) {
          clearTimeout(timeoutId)
          throw e
        }
      }

      // Single fast attempt
      const singleAttempt = async (): Promise<{ success: boolean; data?: any; noNumber?: boolean }> => {
        try {
          const response = await fetchWithTimeout(apiUrl, { headers }, 8000)
          const responseText = await response.text()
          console.log('API Response:', responseText)

          if (isNoNumberResponse(responseText)) {
            return { success: false, noNumber: true }
          }

          const parsed = parseApiResponse(responseText, serverConfig.api_response_type)
          if (parsed) {
            return { success: true, data: parsed }
          }
          return { success: false, noNumber: false }
        } catch (e) {
          console.error('Single attempt error:', e)
          return { success: false, noNumber: false }
        }
      }

      // First quick attempt
      console.log('Fast attempt 1...')
      const firstAttempt = await singleAttempt()
      
      if (firstAttempt.success && firstAttempt.data) {
        const parsed = firstAttempt.data
        console.log('Parsed result:', parsed)

        // Create activation in database
        console.log('Creating activation in database...')
        const { data: activationResult, error: activationError } = await supabase
          .rpc('create_number_activation', {
            p_user_id: userId,
            p_server_id: serverId,
            p_service_id: serviceId,
            p_activation_id: parsed.id,
            p_phone_number: parsed.number,
            p_price: serviceConfig.final_price || 0
          })

        if (activationError) {
          console.error('Activation creation error:', activationError)
          return new Response(
            JSON.stringify({ success: false, error: activationError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const result = activationResult as { success: boolean; error?: string; activation?: any; new_balance?: number }
        if (!result.success) {
          return new Response(
            JSON.stringify({ success: false, error: result.error }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({
            success: true,
            activation: {
              ...result.activation,
              country_dial_code: serverConfig.country_dial_code
            },
            new_balance: result.new_balance,
            apiStatus: 'ACCESS_NUMBER'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get cancel_disable_time from service config (in seconds)
      const cancelDisableSeconds = (service as any).cancel_disable_time || 0
      
      // Helper to queue extra number for cancellation (respecting cancel_disable_time)
      const queueExtraCancellation = async (activationId: string, phoneNumber: string) => {
        console.log('Queueing extra number for cancellation:', activationId)
        
        // Calculate when we can cancel (now + cancel_disable_time seconds)
        const cancelAfter = new Date(Date.now() + (cancelDisableSeconds * 1000))
        
        // Save to pending_cancellations table with cancel_after time
        const { error: insertError } = await supabase.from('pending_cancellations').insert({
          activation_id: activationId,
          server_id: serverId,
          service_id: serviceId,
          phone_number: phoneNumber,
          status: 'pending',
          cancel_after: cancelAfter.toISOString()
        })
        
        if (insertError) {
          console.error('Failed to queue cancellation:', insertError)
          return
        }
        
        console.log(`Queued ${activationId} for cancellation after ${cancelDisableSeconds}s (at ${cancelAfter.toISOString()})`)
        
        // If no cancel delay required, try to cancel immediately
        if (cancelDisableSeconds === 0 && serverConfig.api_cancel_number_url) {
          try {
            const cancelUrl = serverConfig.api_cancel_number_url
              .replace('{id}', activationId)
              .replace('{activation_id}', activationId)
            
            const cancelHeaders: Record<string, string> = {}
            if (serverConfig.uses_headers && serverConfig.header_key_name && serverConfig.header_value) {
              cancelHeaders[serverConfig.header_key_name] = serverConfig.header_value
            }
            
            const cancelResponse = await fetchWithTimeout(cancelUrl, { headers: cancelHeaders }, 5000)
            const cancelText = await cancelResponse.text()
            console.log('Immediate cancel response for', activationId, ':', cancelText)
            
            // Check if cancel was successful
            if (cancelText.includes('ACCESS_CANCEL') || cancelText.includes('STATUS_CANCEL')) {
              await supabase.from('pending_cancellations')
                .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
                .eq('activation_id', activationId)
            } else {
              // Failed - will be retried later
              await supabase.from('pending_cancellations')
                .update({ attempts: 1, error_message: cancelText })
                .eq('activation_id', activationId)
            }
          } catch (e) {
            console.error('Immediate cancel failed:', activationId, e)
            await supabase.from('pending_cancellations')
              .update({ attempts: 1, error_message: String(e) })
              .eq('activation_id', activationId)
          }
        }
      }

      // If first attempt returned NO_NUMBER, try PARALLEL requests for speed
      if (firstAttempt.noNumber && serverConfig.api_retry_count > 1) {
        console.log('First attempt returned NO_NUMBER, trying PARALLEL requests...')
        
        const parallelCount = Math.min(serverConfig.api_retry_count - 1, 3) // Max 3 parallel
        const parallelAttempts = Array(parallelCount).fill(null).map(() => singleAttempt())
        
        const results = await Promise.all(parallelAttempts)
        const successfulResults = results.filter(r => r.success && r.data)
        
        console.log(`Parallel results: ${successfulResults.length} successful out of ${parallelCount}`)
        
        if (successfulResults.length > 0) {
          // Use the first successful result for the user
          const primaryResult = successfulResults[0]
          const parsed = primaryResult.data
          console.log('Using primary number:', parsed.id)
          
          // Queue extra numbers for cancellation in background
          if (successfulResults.length > 1) {
            const extraNumbers = successfulResults.slice(1)
            console.log(`Queueing ${extraNumbers.length} extra numbers for cancellation (cancel_disable_time: ${cancelDisableSeconds}s)...`)
            
            // Fire and forget - don't block the response
            const cancelPromises = extraNumbers.map(r => queueExtraCancellation(r.data.id, r.data.number))
            Promise.all(cancelPromises).catch(e => console.error('Background queue error:', e))
          }
          
          // Create activation for the primary number
          const { data: activationResult, error: activationError } = await supabase
            .rpc('create_number_activation', {
              p_user_id: userId,
              p_server_id: serverId,
              p_service_id: serviceId,
              p_activation_id: parsed.id,
              p_phone_number: parsed.number,
              p_price: serviceConfig.final_price || 0
            })

          if (activationError) {
            return new Response(
              JSON.stringify({ success: false, error: activationError.message }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          const result = activationResult as { success: boolean; error?: string; activation?: any; new_balance?: number }
          if (!result.success) {
            return new Response(
              JSON.stringify({ success: false, error: result.error }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          return new Response(
            JSON.stringify({
              success: true,
              activation: {
                ...result.activation,
                country_dial_code: serverConfig.country_dial_code
              },
              new_balance: result.new_balance,
              apiStatus: 'ACCESS_NUMBER'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // All attempts failed
      return new Response(
        JSON.stringify({ success: false, error: 'Number not available', apiStatus: 'NO_NUMBER' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET MESSAGE / CHECK OTP
    if (action === 'get_message') {
      if (!activationId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Activation ID required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get activation and server details using helper
      const result = await getActivationWithServer(supabase, activationId, userId)
      
      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: 'Activation not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { activation, serverConfig } = result

      // Check for auto-cancel (20 minutes timeout)
      const AUTO_CANCEL_MINUTES = 20
      const createdAt = new Date(activation.created_at).getTime()
      const now = Date.now()
      const elapsedMinutes = (now - createdAt) / (1000 * 60)
      
      if (activation.status === 'active' && !activation.has_otp_received && elapsedMinutes >= AUTO_CANCEL_MINUTES) {
        console.log('Auto-cancelling activation after 20 minutes:', activationId)
        
        // Call cancel API if configured
        if (serverConfig.api_cancel_number_url) {
          let apiUrl = serverConfig.api_cancel_number_url
            .replace('{id}', activationId)
            .replace('{activation_id}', activationId)
          
          const headers: Record<string, string> = {}
          if (serverConfig.uses_headers && serverConfig.header_key_name && serverConfig.header_value) {
            headers[serverConfig.header_key_name] = serverConfig.header_value
          }
          
          try {
            await fetch(apiUrl, { headers })
          } catch (e) {
            console.error('Auto-cancel API call failed:', e)
          }
        }
        
        // Cancel and refund in database
        const { data: cancelResult } = await supabase.rpc('cancel_number_activation', {
          p_user_id: userId,
          p_activation_id: activationId
        })
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: null, 
            has_otp: false, 
            auto_cancelled: true,
            refunded: (cancelResult as any)?.refunded || false,
            new_balance: (cancelResult as any)?.new_balance,
            toast: 'Number expired - Refunded'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!serverConfig.api_get_message_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'Message API not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Build API URL
      let apiUrl = serverConfig.api_get_message_url
        .replace('{id}', activationId)
        .replace('{activation_id}', activationId)

      console.log('Get message URL:', apiUrl)

      const headers: Record<string, string> = {}
      if (serverConfig.uses_headers && serverConfig.header_key_name && serverConfig.header_value) {
        headers[serverConfig.header_key_name] = serverConfig.header_value
      }

      try {
        const response = await fetch(apiUrl, { headers })
        const responseText = await response.text()
        console.log('Message response:', responseText)

        const msgResult = parseMessageResponse(responseText, serverConfig.api_response_type, serverConfig.otp_path_in_json)
        
        // Handle different statuses
        if (msgResult.status === 'error') {
          const errorMessages: Record<string, string> = {
            'BAD_KEY': 'Invalid API key',
            'BAD_ACTION': 'Invalid action',
            'NO_ACTIVATION': 'Activation not found',
            'UNKNOWN': 'Unknown error'
          }
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorMessages[msgResult.errorType || 'UNKNOWN'],
              errorType: msgResult.errorType,
              apiStatus: msgResult.errorType || 'ERROR'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        if (msgResult.status === 'cancelled') {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: null, 
              has_otp: false, 
              cancelled: true,
              toast: 'Activation cancelled',
              apiStatus: 'STATUS_CANCEL'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        if (msgResult.status === 'waiting_retry') {
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: null, 
              has_otp: false, 
              waiting: true,
              waitingRetry: true,
              lastCode: msgResult.lastCode,
              toast: 'Waiting for next SMS',
              apiStatus: 'STATUS_WAIT_RETRY'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        
        if (msgResult.status === 'received' && msgResult.message) {
          // Update activation with message
          await supabase.rpc('update_activation_message', {
            p_activation_id: activationId,
            p_message: msgResult.message
          })

          return new Response(
            JSON.stringify({ success: true, message: msgResult.message, has_otp: true, apiStatus: 'STATUS_OK' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // Default waiting status
        return new Response(
          JSON.stringify({ success: true, message: null, has_otp: false, waiting: true, apiStatus: 'STATUS_WAIT_CODE' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (fetchError) {
        console.error('Message fetch error:', fetchError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to check SMS' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // NEXT SMS / ACTIVATE NEXT MESSAGE
    if (action === 'next_sms') {
      if (!activationId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Activation ID required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get activation and server details using helper
      const result = await getActivationWithServer(supabase, activationId, userId)
      
      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: 'Activation not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { serverConfig } = result

      if (!serverConfig.api_activate_next_message_url) {
        return new Response(
          JSON.stringify({ success: false, error: 'Next SMS API not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let apiUrl = serverConfig.api_activate_next_message_url
        .replace('{id}', activationId)
        .replace('{activation_id}', activationId)

      console.log('Next SMS URL:', apiUrl)

      const headers: Record<string, string> = {}
      if (serverConfig.uses_headers && serverConfig.header_key_name && serverConfig.header_value) {
        headers[serverConfig.header_key_name] = serverConfig.header_value
      }

      try {
        const response = await fetch(apiUrl, { headers })
        const responseText = await response.text()
        console.log('Next SMS response:', responseText)

        return new Response(
          JSON.stringify({ success: true, message: 'Next SMS requested', apiStatus: 'ACCESS_RETRY_GET' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (fetchError) {
        console.error('Next SMS error:', fetchError)
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to request next SMS', apiStatus: 'TIMEOUT' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // CANCEL NUMBER
    if (action === 'cancel_number') {
      if (!activationId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Activation ID required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get activation and server details using helper
      const result = await getActivationWithServer(supabase, activationId, userId)
      
      if (!result) {
        return new Response(
          JSON.stringify({ success: false, error: 'Activation not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { activation, serverConfig } = result

      // Call cancel API if configured
      if (serverConfig.api_cancel_number_url) {
        let apiUrl = serverConfig.api_cancel_number_url
          .replace('{id}', activationId)
          .replace('{activation_id}', activationId)

        console.log('Cancel URL:', apiUrl)

        const headers: Record<string, string> = {}
        if (serverConfig.uses_headers && serverConfig.header_key_name && serverConfig.header_value) {
          headers[serverConfig.header_key_name] = serverConfig.header_value
        }

        try {
          const response = await fetch(apiUrl, { headers })
          const responseText = await response.text()
          console.log('Cancel response:', responseText)
          const trimmedResponse = responseText.trim()
          
          // Check for error responses first
          if (trimmedResponse.includes('NO_ACTIVATION')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Activation not found', errorType: 'NO_ACTIVATION', apiStatus: 'NO_ACTIVATION' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          if (trimmedResponse.includes('BAD_STATUS')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid status', errorType: 'BAD_STATUS', apiStatus: 'BAD_STATUS' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          if (trimmedResponse.includes('BAD_KEY')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid API key', errorType: 'BAD_KEY', apiStatus: 'BAD_KEY' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          if (trimmedResponse.includes('BAD_ACTION')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Invalid action', errorType: 'BAD_ACTION', apiStatus: 'BAD_ACTION' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          if (trimmedResponse.includes('EARLY_CANCEL_DENIED')) {
            return new Response(
              JSON.stringify({ success: false, error: 'Wait 2 min to cancel', errorType: 'EARLY_CANCEL_DENIED', apiStatus: 'EARLY_CANCEL_DENIED' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
          
          // Check for success responses
          // ACCESS_CANCEL means successfully cancelled
          if (!trimmedResponse.includes('ACCESS_CANCEL')) {
            // Other statuses like ACCESS_READY, ACCESS_RETRY_GET, ACCESS_ACTIVATION
            // mean the number is still active, cannot cancel
            if (trimmedResponse.includes('ACCESS_READY') || 
                trimmedResponse.includes('ACCESS_RETRY_GET') || 
                trimmedResponse.includes('ACCESS_ACTIVATION')) {
              return new Response(
                JSON.stringify({ success: false, error: 'Number still active', errorType: 'STILL_ACTIVE', apiStatus: 'STILL_ACTIVE' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }
          }
        } catch (fetchError) {
          console.error('Cancel API error:', fetchError)
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to cancel', apiStatus: 'TIMEOUT' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }

      // Update database and handle refund
      const { data: cancelResult, error: cancelError } = await supabase
        .rpc('cancel_number_activation', {
          p_user_id: userId,
          p_activation_id: activationId
        })

      if (cancelError) {
        console.error('Cancel error:', cancelError)
        return new Response(
          JSON.stringify({ success: false, error: cancelError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('Cancel result:', JSON.stringify(cancelResult))

      return new Response(
        JSON.stringify({ ...cancelResult, toast: 'Number cancelled', apiStatus: 'ACCESS_CANCEL' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('SMS API Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
