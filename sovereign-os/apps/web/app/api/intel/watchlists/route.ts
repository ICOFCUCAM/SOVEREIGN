import { NextResponse, type NextRequest } from 'next/server';
import { resolvePrincipal } from '../../../../lib/intel-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }

  const { data, error } = await principal.client
    .from('intel_watchlists')
    .select('id, name, description, definition, enabled, severity_thresholds, delivery_channels, quiet_hours, precision_budget_per_day, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, count: data?.length ?? 0, items: data ?? [] });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const principal = await resolvePrincipal(req);
  if (!principal) {
    return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  if (!body.name || !body.definition) {
    return NextResponse.json({ ok: false, error: 'name and definition required' }, { status: 400 });
  }

  const { data, error } = await principal.client
    .from('intel_watchlists')
    .insert({
      tenant_id: principal.tenantId,
      name: body.name,
      description: body.description ?? null,
      definition: body.definition,
      severity_thresholds: body.severityThresholds ?? undefined,
      delivery_channels: body.deliveryChannels ?? undefined,
      quiet_hours: body.quietHours ?? null,
      enabled: body.enabled ?? true,
      precision_budget_per_day: body.precisionBudgetPerDay ?? 50,
      created_by: principal.userId,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, watchlist: data }, { status: 201 });
}
