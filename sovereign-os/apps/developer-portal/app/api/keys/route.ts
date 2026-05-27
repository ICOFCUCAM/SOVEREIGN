import { NextRequest, NextResponse } from 'next/server';

// Server route: mints a key on behalf of an authenticated developer by proxying to the
// admin-gated issue-key edge function. ADMIN_SECRET stays server-side, never in the client.
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const adminSecret = process.env.ADMIN_SECRET;
  if (!supabaseUrl || !adminSecret) {
    return NextResponse.json(
      { error: 'Portal not configured — set SUPABASE_URL and ADMIN_SECRET.' },
      { status: 503 },
    );
  }

  const payload = await req.json().catch(() => ({}));
  const r = await fetch(`${supabaseUrl}/functions/v1/issue-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
    body: JSON.stringify(payload),
  });
  const body = await r.json().catch(() => ({}));
  return NextResponse.json(body, { status: r.status });
}
