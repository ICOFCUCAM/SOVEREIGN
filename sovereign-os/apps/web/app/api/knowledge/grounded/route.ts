import { NextResponse } from 'next/server';
import { getKnowledgeProvider } from '../../../../lib/knowledge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const question = typeof body.question === 'string' ? body.question.trim() : '';
  if (!question) {
    return NextResponse.json({ ok: false, error: { code: 'invalid_argument', message: 'question required' } }, { status: 400 });
  }

  // Reference principal for the demo surface. Production wiring will
  // resolve the principal from the authenticated session.
  const principal = {
    tenantId: 'reference-demo',
    principalId: 'console-demo',
    roles: ['operator' as const],
    clearance: 'internal',
  };

  const provider = getKnowledgeProvider();
  const result = await provider.reference.groundedAnswer(principal, question, {});
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    value: result.value,
    provider: {
      implementation:        provider.meta.implementation,
      implementationVersion: provider.meta.implementationVersion,
    },
  });
}
