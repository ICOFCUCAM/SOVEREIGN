import { NextResponse, type NextRequest } from 'next/server';
import { resolvePrincipal } from '../../../../lib/intel-auth';
import { isSourceFamily } from '@sovereign/intel-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const family = url.searchParams.get('family');

  let q = principal.client
    .from('intel_sources')
    .select('id, family, connector, display_name, enabled, freshness_sla_minutes, last_run_at, last_status, created_at')
    .order('created_at', { ascending: false });

  if (family && isSourceFamily(family)) {
    q = q.eq('family', family);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: data?.length ?? 0, items: data ?? [] });
}
