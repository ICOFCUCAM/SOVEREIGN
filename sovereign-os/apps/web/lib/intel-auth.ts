import 'server-only';
import type { NextRequest } from 'next/server';
import { userScopedClient } from './supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Resolve the calling principal from the incoming request. Used by the
// /api/intel/* route handlers to scope queries through RLS. Returns
// null when no usable bearer token is present.

export interface IntelPrincipal {
  readonly userId: string;
  readonly tenantId: string;
  readonly client: SupabaseClient;
}

export async function resolvePrincipal(req: NextRequest): Promise<IntelPrincipal | null> {
  const auth = req.headers.get('authorization');
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  const client = userScopedClient(token);
  let userId: string;
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    userId = data.user.id;
  } catch {
    return null;
  }

  // Sprint 1.1 simplification: tenantId === userId. Future sprints
  // resolve institution membership through a tenants table.
  return {
    userId,
    tenantId: userId,
    client,
  };
}
