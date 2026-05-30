import { NextResponse, type NextRequest } from 'next/server';
import { resolvePrincipal } from '../../../../lib/intel-auth';
import { isSignalClass } from '@sovereign/intel-core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_LIMIT = 200;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const url = new URL(req.url);
  const signalClass = url.searchParams.get('class');
  const since = url.searchParams.get('since');
  const limitRaw = url.searchParams.get('limit');
  const limit = Math.max(1, Math.min(parseInt(limitRaw ?? '50', 10) || 50, MAX_LIMIT));

  let q = principal.client
    .from('intel_signals')
    .select('id, source_id, signal_class, published_at, ingested_at, language, title, body_excerpt, sentiment, influence_score, velocity_at_ingest, narrative_cluster_id, attestations')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (signalClass && isSignalClass(signalClass)) {
    q = q.eq('signal_class', signalClass);
  }
  if (since) {
    q = q.gte('published_at', since);
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    count: data?.length ?? 0,
    items: data ?? [],
  });
}
