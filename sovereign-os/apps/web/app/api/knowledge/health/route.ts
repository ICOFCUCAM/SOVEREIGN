import { NextResponse } from 'next/server';
import { getKnowledgeProvider, isReferenceSeeded } from '../../../../lib/knowledge';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const provider = getKnowledgeProvider();
  const health = await provider.health();
  return NextResponse.json({
    contract:               provider.meta.contract,
    contractVersion:        provider.meta.version,
    implementation:         provider.meta.implementation,
    implementationVersion:  provider.meta.implementationVersion,
    status:                 health.status,
    checkedAt:              health.checkedAt,
    seeded:                 isReferenceSeeded(),
    degraded:               provider.meta.implementation !== 'veritas-os',
    details:                health.details ?? null,
  });
}
