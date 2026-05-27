import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { sha256Hex } from './keys.ts';

// Authenticates an incoming request by its Bearer API key, enforces scope, records
// usage, and stamps last_used_at. Any edge function can guard itself with this.

export interface AuthContext {
  clientId: string;
  keyId: string;
  scopes: string[];
}

export interface AuthResult {
  ok: boolean;
  status: number;
  error?: string;
  ctx?: AuthContext;
}

export async function authenticate(
  req: Request,
  admin: SupabaseClient,
  requiredScope?: string,
): Promise<AuthResult> {
  const header = req.headers.get('authorization') ?? '';
  const presented = header.replace(/^Bearer\s+/i, '').trim();
  if (!presented || !presented.startsWith('sov_')) {
    return { ok: false, status: 401, error: 'Missing or malformed API key.' };
  }

  const hash = await sha256Hex(presented);
  const { data: key } = await admin
    .from('api_keys')
    .select('id, client_id, scopes, status, rate_limit_per_month')
    .eq('key_hash', hash)
    .single();

  if (!key || key.status !== 'active') {
    return { ok: false, status: 401, error: 'Invalid or revoked API key.' };
  }

  const scopes: string[] = key.scopes ?? [];
  if (requiredScope && !scopes.includes('*') && !scopes.includes(requiredScope)) {
    return { ok: false, status: 403, error: `Key lacks required scope "${requiredScope}".` };
  }

  // Monthly usage enforcement.
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', key.client_id)
    .gte('at', since);
  if (typeof count === 'number' && count >= key.rate_limit_per_month) {
    return { ok: false, status: 429, error: 'Monthly API quota exceeded.' };
  }

  await admin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', key.id);
  await admin.from('api_usage').insert({ client_id: key.client_id, key_id: key.id, metric: 'api_call' });

  return { ok: true, status: 200, ctx: { clientId: key.client_id, keyId: key.id, scopes } };
}
