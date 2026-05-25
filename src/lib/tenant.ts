/**
 * Tenant resolution layer.
 *
 * The platform is multi-tenant by hostname: the canonical app host (the
 * Vercel deployment / localhost) serves the marketplace + console, while any
 * other connected custom domain (e.g. `payvera.ai`) resolves to that domain's
 * own branded landing page.
 *
 * On a static SPA we resolve the tenant client-side from `window.location`.
 * (A future Next.js edge-middleware variant would do the same off the `Host`
 * header for SSR; the contract here is intentionally framework-agnostic.)
 */

export type TenantMode = 'platform' | 'tenant';

export interface TenantContext {
  mode: TenantMode;
  /** Normalized hostname (lowercased, no port, no leading `www.`). */
  hostname: string;
  /** Raw `window.location.host` as seen by the browser. */
  raw: string;
}

/** Hosts that always render the platform experience, never a tenant landing. */
const PLATFORM_HOST_EXACT = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
]);

/** Suffixes that always render the platform experience (preview/deploy URLs). */
const PLATFORM_HOST_SUFFIXES = [
  '.vercel.app',
  '.databasepad.com',
  '.netlify.app',
];

/**
 * Additional canonical platform hosts, configurable per environment.
 * e.g. VITE_PLATFORM_HOSTS="sovereign.os,app.sovereign.os"
 */
const CONFIGURED_PLATFORM_HOSTS = (import.meta.env.VITE_PLATFORM_HOSTS ?? '')
  .split(',')
  .map((h) => normalizeHostname(h))
  .filter(Boolean);

export function normalizeHostname(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, '') // strip port
    .replace(/^www\./, ''); // treat www and apex as one tenant
}

export function isPlatformHost(hostname: string): boolean {
  if (PLATFORM_HOST_EXACT.has(hostname)) return true;
  if (PLATFORM_HOST_SUFFIXES.some((s) => hostname.endsWith(s))) return true;
  if (CONFIGURED_PLATFORM_HOSTS.includes(hostname)) return true;
  return false;
}

export function resolveTenant(): TenantContext {
  const raw = typeof window !== 'undefined' ? window.location.host : '';
  const hostname = normalizeHostname(raw);
  const mode: TenantMode = !hostname || isPlatformHost(hostname) ? 'platform' : 'tenant';
  return { mode, hostname, raw };
}

/** Absolute origin of the canonical platform, for cross-domain links from a tenant. */
export const PLATFORM_ORIGIN: string =
  CONFIGURED_PLATFORM_HOSTS.length > 0
    ? `https://${CONFIGURED_PLATFORM_HOSTS[0]}`
    : (import.meta.env.VITE_PLATFORM_ORIGIN ?? '');
