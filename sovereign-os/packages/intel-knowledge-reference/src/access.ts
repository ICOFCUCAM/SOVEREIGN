import type { Classification, PrincipalContext } from '@sovereign/intel-knowledge-contract';

// Classification ladder. Reference policy: principal must hold the
// classification (or higher) of the document to read it. Production
// Veritas OS replaces this with per-document ACLs and full policy
// engine; the contract permits both.

export const CLEARANCE_ORDER: readonly Classification[] = [
  'public', 'internal', 'restricted', 'confidential', 'secret',
];

function rank(c: Classification | undefined): number {
  if (!c) return 0;
  const idx = CLEARANCE_ORDER.indexOf(c);
  return idx < 0 ? 0 : idx;
}

export type AccessDecision =
  | { readonly verdict: 'permit' }
  | { readonly verdict: 'redact'; readonly auditPointer: string }
  | { readonly verdict: 'deny'; readonly reason: string };

export function decideAccess(
  principal: PrincipalContext,
  documentClassification: Classification,
  documentJurisdiction: string | undefined,
): AccessDecision {
  if (rank(principal.clearance as Classification | undefined) < rank(documentClassification)) {
    return {
      verdict: 'redact',
      auditPointer: `principal:${principal.principalId}:insufficient_clearance`,
    };
  }
  if (
    documentJurisdiction !== undefined &&
    principal.jurisdiction !== undefined &&
    documentJurisdiction !== principal.jurisdiction
  ) {
    return {
      verdict: 'deny',
      reason: `jurisdiction_mismatch:${documentJurisdiction}!=${principal.jurisdiction}`,
    };
  }
  return { verdict: 'permit' };
}

export function isValidPrincipal(p: unknown): p is PrincipalContext {
  if (!p || typeof p !== 'object') return false;
  const v = p as Record<string, unknown>;
  return typeof v.tenantId === 'string' && v.tenantId.length > 0
    && typeof v.principalId === 'string' && v.principalId.length > 0
    && Array.isArray(v.roles);
}
