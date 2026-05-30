// PrincipalContext travels with every contract call. The provider is the
// authority on what this principal may read; callers pass identity and
// trust the verdict.

export type PrincipalRole =
  | 'operator'
  | 'analyst'
  | 'executive'
  | 'minister'
  | 'service';

export interface PrincipalContext {
  readonly tenantId: string;
  readonly principalId: string;
  readonly roles: readonly PrincipalRole[];
  readonly clearance?: string;
  readonly jurisdiction?: string;
  readonly correlationId?: string;
}

export function isPrincipalContext(value: unknown): value is PrincipalContext {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.tenantId === 'string'
    && typeof v.principalId === 'string'
    && Array.isArray(v.roles);
}
