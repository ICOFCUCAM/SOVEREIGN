import { NextRequest, NextResponse } from 'next/server';

// Server route: starts an OAuth connect by proxying to the admin-gated oauth-start
// edge function and returning the provider authorize URL for the browser to open.
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const adminSecret = process.env.ADMIN_SECRET;
  if (!supabaseUrl || !adminSecret) {
    return NextResponse.json({ error: 'Portal not configured — set SUPABASE_URL and ADMIN_SECRET.' }, { status: 503 });
  }
  const payload = await req.json().catch(() => ({}));
  const r = await fetch(`${supabaseUrl}/functions/v1/oauth-start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
    body: JSON.stringify(payload),
  });
  const body = await r.json().catch(() => ({}));
  return NextResponse.json(body, { status: r.status });
}
