import { NextResponse, type NextRequest } from 'next/server';
import { resolvePrincipal } from '../../../../lib/intel-auth';
import { isEntityType } from '@sovereign/intel-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 200;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const search = url.searchParams.get('q');
  const limitRaw = url.searchParams.get('limit');
  const limit = Math.max(1, Math.min(parseInt(limitRaw ?? '50', 10) || 50, MAX_LIMIT));

  let q = principal.client
    .from('intel_entities')
    .select('id, entity_type, canonical_name, aliases, external_ids, attributes, confidence, mention_count, first_seen_at, last_seen_at')
    .is('merged_into', null)
    .order('last_seen_at', { ascending: false })
    .limit(limit);

  if (type && isEntityType(type)) {
    q = q.eq('entity_type', type);
  }
  if (search) {
    // Trigram-friendly ilike on canonical_name + alias array contains.
    q = q.or(`canonical_name.ilike.%${search.replace(/[%_]/g, '')}%,aliases.cs.{${search}}`);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: data?.length ?? 0, items: data ?? [] });
}
