import { NextResponse, type NextRequest } from 'next/server';
import { resolvePrincipal } from '../../../../lib/intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 200;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const severity = url.searchParams.get('severity');
  const state = url.searchParams.get('state');
  const limitRaw = url.searchParams.get('limit');
  const limit = Math.max(1, Math.min(parseInt(limitRaw ?? '50', 10) || 50, MAX_LIMIT));

  let q = principal.client
    .from('intel_alerts')
    .select('id, watchlist_id, signal_id, severity, state, matched_definition, delivered_to, acknowledged_by, acknowledged_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (severity && ['info','warn','critical'].includes(severity)) {
    q = q.eq('severity', severity);
  }
  if (state && ['open','acknowledged','suppressed','closed'].includes(state)) {
    q = q.eq('state', state);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: data?.length ?? 0, items: data ?? [] });
}
