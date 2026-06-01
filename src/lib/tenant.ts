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
 * e.g. VITE_PLATFORM_HOSTS="sovereigndo.com,app.sovereigndo.com"
 */
const CONFIGURED_PLATFORM_HOSTS = (import.meta.env.VITE_PLATFORM_HOSTS ?? 'sovereigndo.com')
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

/**
 * Dedicated registrar infrastructure host. Accepts the canonical
 * `domains.sovereigndo.com` and `domain.sovereigndo.com` (or any
 * `domain./domains.` subdomain). Renders the sovereign domain platform
 * at its root.
 */
export function isRegistrarHost(hostname: string): boolean {
  return (
    hostname === 'domains.sovereigndo.com' ||
    hostname === 'domain.sovereigndo.com' ||
    hostname.startsWith('domains.') ||
    hostname.startsWith('domain.')
  );
}

export function isPlatformHost(hostname: string): boolean {
  if (PLATFORM_HOST_EXACT.has(hostname)) return true;
  if (PLATFORM_HOST_SUFFIXES.some((s) => hostname.endsWith(s))) return true;
  if (CONFIGURED_PLATFORM_HOSTS.includes(hostname)) return true;
  return false;
}

/**
 * Dev host override: visit any URL with `?as=domains.sovereigndo.com`
 * (or any other host) to render the app as that host. The override
 * sticks for the tab via sessionStorage; `?as=` (empty) clears it.
 */
const HOST_OVERRIDE_KEY = '__sovereign_host_override';
function readHostOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('as')) {
      const v = (params.get('as') || '').trim();
      if (v) sessionStorage.setItem(HOST_OVERRIDE_KEY, v);
      else sessionStorage.removeItem(HOST_OVERRIDE_KEY);
      return v || null;
    }
    return sessionStorage.getItem(HOST_OVERRIDE_KEY);
  } catch { return null; }
}

export function resolveTenant(): TenantContext {
  const override = readHostOverride();
  const raw = override || (typeof window !== 'undefined' ? window.location.host : '');
  const hostname = normalizeHostname(raw);
  const mode: TenantMode = !hostname || isPlatformHost(hostname) ? 'platform' : 'tenant';
  return { mode, hostname, raw };
}

/** Absolute origin of the canonical platform, for cross-domain links from a tenant. */
export const PLATFORM_ORIGIN: string =
  CONFIGURED_PLATFORM_HOSTS.length > 0
    ? `https://${CONFIGURED_PLATFORM_HOSTS[0]}`
    : (import.meta.env.VITE_PLATFORM_ORIGIN ?? '');
