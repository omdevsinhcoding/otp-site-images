import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cache for service codes - maps service name (lowercase) to short code
let smsbowerCache: Record<string, string> | null = null;
let smsActivateCache: Record<string, string> | null = null;

async function fetchSmsbowerServices(): Promise<Record<string, string>> {
  if (smsbowerCache) return smsbowerCache;
  
  try {
    console.log('[service-code-lookup] Fetching from smsbower...');
    const res = await fetch('https://smsbower.online/stubs/handler_api.php?api_key=iIuH64ac0eNnq24TC1kbet8KNsdeFIHs&action=getServicesList&country=22');
    
    if (!res.ok) {
      console.error('[service-code-lookup] smsbower fetch failed:', res.status);
      return {};
    }
    
    const data = await res.json();
    console.log('[service-code-lookup] smsbower raw response keys:', Object.keys(data));
    
    const serviceMap: Record<string, string> = {};
    
    // API returns: { "status": "success", "services": [{ "code": "wx", "name": "Apple" }, ...] }
    if (data.services && Array.isArray(data.services)) {
      console.log(`[service-code-lookup] smsbower services count: ${data.services.length}`);
      
      // Log first 3 services to verify format
      for (let i = 0; i < Math.min(3, data.services.length); i++) {
        console.log(`[service-code-lookup] smsbower sample[${i}]:`, JSON.stringify(data.services[i]));
      }
      
      for (const service of data.services) {
        if (service.name && service.code) {
          // Map service name (lowercase) to short code
          const nameLower = service.name.toLowerCase().trim();
          serviceMap[nameLower] = service.code;
        }
      }
    }
    
    console.log(`[service-code-lookup] smsbower parsed ${Object.keys(serviceMap).length} services`);
    
    // Log some samples
    const samples = Object.entries(serviceMap).slice(0, 5);
    console.log('[service-code-lookup] smsbower samples:', JSON.stringify(samples));
    
    smsbowerCache = serviceMap;
    return serviceMap;
  } catch (e) {
    console.error('[service-code-lookup] smsbower error:', e);
    return {};
  }
}

async function fetchSmsActivateServices(): Promise<Record<string, string>> {
  if (smsActivateCache) return smsActivateCache;
  
  try {
    console.log('[service-code-lookup] Fetching from sms-activate.ae...');
    const res = await fetch('https://api.sms-activate.ae/stubs/handler_api.php?action=getServicesList&api_key=0f3b8465ee9fdA02ffe910d8c455703d');
    
    if (!res.ok) {
      console.error('[service-code-lookup] sms-activate fetch failed:', res.status);
      return {};
    }
    
    const data = await res.json();
    console.log('[service-code-lookup] sms-activate raw response keys:', Object.keys(data));
    
    const serviceMap: Record<string, string> = {};
    
    // API returns: { "status": "success", "services": [{ "code": "wx", "name": "Apple" }, ...] }
    if (data.services && Array.isArray(data.services)) {
      console.log(`[service-code-lookup] sms-activate services count: ${data.services.length}`);
      
      for (const service of data.services) {
        if (service.name && service.code) {
          const nameLower = service.name.toLowerCase().trim();
          serviceMap[nameLower] = service.code;
        }
      }
    }
    
    console.log(`[service-code-lookup] sms-activate parsed ${Object.keys(serviceMap).length} services`);
    smsActivateCache = serviceMap;
    return serviceMap;
  } catch (e) {
    console.error('[service-code-lookup] sms-activate error:', e);
    return {};
  }
}

// Find short code by service name - searches in smsbower first, then sms-activate
function findCodeByName(
  serviceName: string, 
  smsbower: Record<string, string>, 
  smsActivate: Record<string, string>
): string | null {
  const normalized = serviceName.toLowerCase().trim();
  
  // Step 1: Exact match in smsbower
  if (smsbower[normalized]) {
    console.log(`[service-code-lookup] Found "${serviceName}" in smsbower (exact): ${smsbower[normalized]}`);
    return smsbower[normalized];
  }
  
  // Step 2: Partial match in smsbower (service name contains or is contained by API name)
  for (const [name, code] of Object.entries(smsbower)) {
    if (name.includes(normalized) || normalized.includes(name)) {
      console.log(`[service-code-lookup] Found "${serviceName}" in smsbower (partial "${name}"): ${code}`);
      return code;
    }
  }
  
  // Step 3: Exact match in sms-activate
  if (smsActivate[normalized]) {
    console.log(`[service-code-lookup] Found "${serviceName}" in sms-activate (exact): ${smsActivate[normalized]}`);
    return smsActivate[normalized];
  }
  
  // Step 4: Partial match in sms-activate
  for (const [name, code] of Object.entries(smsActivate)) {
    if (name.includes(normalized) || normalized.includes(name)) {
      console.log(`[service-code-lookup] Found "${serviceName}" in sms-activate (partial "${name}"): ${code}`);
      return code;
    }
  }
  
  console.log(`[service-code-lookup] "${serviceName}" not found in any API`);
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { serviceName } = body;
    
    // Fetch both APIs in parallel
    const [smsbower, smsActivate] = await Promise.all([
      fetchSmsbowerServices(),
      fetchSmsActivateServices()
    ]);
    
    let code: string | null = null;
    
    if (serviceName) {
      code = findCodeByName(serviceName, smsbower, smsActivate);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        code,
        // Return the full caches so client can do lookups without multiple API calls
        smsbower, 
        smsActivate,
        stats: {
          smsbowerCount: Object.keys(smsbower).length,
          smsActivateCount: Object.keys(smsActivate).length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('[service-code-lookup] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});