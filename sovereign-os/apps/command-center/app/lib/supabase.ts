import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Browser client. Returns null when env is unconfigured so the UI can render
// dormant states instead of crashing (this scaffold ships without a live project).
let cached: SupabaseClient | null | undefined;

export function browserClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  cached = url && key ? createClient(url, key) : null;
  return cached;
}
