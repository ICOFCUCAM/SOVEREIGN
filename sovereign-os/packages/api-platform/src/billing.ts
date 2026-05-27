import type { Plan } from './types.js';
import type { Scope } from './scopes.js';

// Plan catalog + entitlements. Pure: the source of truth for what each plan grants
// (monthly quota, connection limit, allowed scopes, price). Keys derive their quota from
// the client's plan; auth can additionally gate scopes the plan doesn't include.

export interface PlanSpec {
  label: string;
  priceUsdMonthly: number; // 0 = free or custom (enterprise)
  quotaPerMonth: number;
  maxConnections: number;
  scopes: Scope[];
}

export const PLAN_CATALOG: Record<Plan, PlanSpec> = {
  free: { label: 'Free', priceUsdMonthly: 0, quotaPerMonth: 100, maxConnections: 2, scopes: ['publish'] },
  basic: { label: 'Basic', priceUsdMonthly: 29, quotaPerMonth: 1000, maxConnections: 5, scopes: ['publish', 'media:render', 'social:connect'] },
  pro: { label: 'Pro', priceUsdMonthly: 199, quotaPerMonth: 25000, maxConnections: 25, scopes: ['publish', 'media:render', 'intelligence:run', 'analytics:read', 'social:connect', 'webhooks:manage'] },
  enterprise: { label: 'Enterprise', priceUsdMonthly: 0, quotaPerMonth: 1_000_000, maxConnections: 1000, scopes: ['*'] },
};

export function getPlan(plan: Plan): PlanSpec {
  return PLAN_CATALOG[plan];
}

export function planQuota(plan: Plan): number {
  return PLAN_CATALOG[plan].quotaPerMonth;
}

export function planAllowsScope(plan: Plan, scope: Scope): boolean {
  const scopes = PLAN_CATALOG[plan].scopes;
  return scopes.includes('*') || scopes.includes(scope);
}

export function planAllowsConnection(plan: Plan, currentConnections: number): boolean {
  return currentConnections < PLAN_CATALOG[plan].maxConnections;
}

/** Intersect requested key scopes with what the plan permits. */
export function effectiveScopes(plan: Plan, requested: Scope[]): Scope[] {
  if (PLAN_CATALOG[plan].scopes.includes('*')) return requested;
  return requested.filter((s) => planAllowsScope(plan, s));
}
