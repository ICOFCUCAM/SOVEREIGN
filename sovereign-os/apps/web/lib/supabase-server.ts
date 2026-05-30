import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://qvjdivcdefuprnenedje.supabase.co';

// Fallback to the same public anon key embedded in lib/supabase.ts so the
// server routes work without explicit env configuration in dev. Production
// deployments override via NEXT_PUBLIC_SUPABASE_ANON_KEY.
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2amRpdmNkZWZ1cHJuZW5lZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2NjMwMjYsImV4cCI6MjA5NTIzOTAyNn0.2cKjQRxnspeySCRwsOGz0ntKZ9LD3BVKR80H1mPOu_c';

// Server-only Supabase clients for route handlers and server components.
// Use the anon client by default — RLS enforces tenant isolation. The
// service-role client is reserved for worker code that needs to bypass
// RLS (ingestion, normalization) and must never be exposed to the
// client bundle.

export function anonServerClient(): SupabaseClient {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_ANON_KEY;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export function serviceRoleClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured');
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

// Bearer-token client: scoped to the calling user's session so RLS
// policies receive the right auth.uid(). Route handlers extract the
// token from the incoming request and pass it here.
export function userScopedClient(accessToken: string): SupabaseClient {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? DEFAULT_ANON_KEY;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
