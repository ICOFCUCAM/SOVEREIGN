import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Server-side admin client factory. Never expose the service-role key to the browser.
export function adminClient(url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY): SupabaseClient {
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  return createClient(url, key, { auth: { persistSession: false } });
}
