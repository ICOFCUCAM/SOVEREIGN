import { NextResponse, type NextRequest } from 'next/server';
import { resolvePrincipal } from '../../../../../lib/intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: { id: string } }): Promise<NextResponse> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const { id } = ctx.params;

  const [signalRes, entitiesRes] = await Promise.all([
    principal.client.from('intel_signals').select('*').eq('id', id).maybeSingle(),
    principal.client
      .from('intel_signal_entities')
      .select('entity_id, salience, sentiment, role, intel_entities!inner(id, entity_type, canonical_name)')
      .eq('signal_id', id),
  ]);

  if (signalRes.error) {
    return NextResponse.json({ ok: false, error: signalRes.error.message }, { status: 500 });
  }
  if (!signalRes.data) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    signal: signalRes.data,
    entities: entitiesRes.data ?? [],
  });
}
