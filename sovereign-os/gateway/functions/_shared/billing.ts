// Deno mirror of @sovereign/api-platform/billing. Keep in sync.
type Plan = 'free' | 'basic' | 'pro' | 'enterprise';

interface PlanSpec { quotaPerMonth: number; maxConnections: number; scopes: string[]; }

export const PLAN_CATALOG: Record<Plan, PlanSpec> = {
  free: { quotaPerMonth: 100, maxConnections: 2, scopes: ['publish'] },
  basic: { quotaPerMonth: 1000, maxConnections: 5, scopes: ['publish', 'media:render', 'social:connect'] },
  pro: { quotaPerMonth: 25000, maxConnections: 25, scopes: ['publish', 'media:render', 'intelligence:run', 'analytics:read', 'social:connect', 'webhooks:manage'] },
  enterprise: { quotaPerMonth: 1_000_000, maxConnections: 1000, scopes: ['*'] },
};

export function planQuota(plan: string): number {
  return (PLAN_CATALOG[plan as Plan] ?? PLAN_CATALOG.free).quotaPerMonth;
}

export function effectiveScopes(plan: string, requested: string[]): string[] {
  const spec = PLAN_CATALOG[plan as Plan] ?? PLAN_CATALOG.free;
  if (spec.scopes.includes('*')) return requested;
  return requested.filter((s) => spec.scopes.includes(s));
}
