// ── domain-search ─────────────────────────────────────────────────────
// Synchronous registrar DISCOVERY layer (read-only). Live domain availability
// + pricing + premium detection + intelligent suggestions over the Openprovider
// v1beta API. Results are cached (short TTL) and provider calls are rate-limited
// via a token bucket. No transactional registration happens here.

import { createClient, SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

const DEFAULT_BASE = 'https://api.openprovider.eu';
const CACHE_TTL_SEC = 300;        // availability freshness window
const CHUNK = 10;                 // Openprovider per-request domain cap
const BUCKET = 'op_search';
const CAPACITY = 60;
const REFILL_PER_SEC = 1;

// Discovery TLD set — infrastructure-oriented, not a retail dump.
const PRIMARY_TLDS = ['com', 'so', 'io', 'ai'];
// Curated sovereign namespace for the TLD pricing explorer.
const SOVEREIGN_TLDS = ['com', 'so', 'io', 'ai', 'net', 'org', 'co', 'app', 'dev', 'cloud', 'tech', 'xyz'];
const SUGGEST_TLDS = ['com', 'so', 'io', 'ai', 'net', 'org', 'co', 'app', 'dev', 'xyz', 'tech', 'cloud', 'systems', 'network'];
const PREFIXES = ['get', 'try', 'use', 'my', 'go'];
const SUFFIXES = ['hq', 'app', 'ai', 'labs', 'cloud', 'os'];

function clean(v?: string): string | undefined {
  let s = (v ?? '').trim();
  if (s.length >= 2 && ((s[0] === '"' && s.at(-1) === '"') || (s[0] === "'" && s.at(-1) === "'"))) s = s.slice(1, -1);
  return s || undefined;
}

// Sanitize a raw query into a bare label (no protocol, path, spaces).
function sanitizeLabel(q: string): string {
  return q.toLowerCase().trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

function splitDomain(input: string): { name: string; extension: string } | null {
  const s = input.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const dot = s.indexOf('.');
  if (dot === -1) return null;
  const name = sanitizeLabel(s.slice(0, dot));
  const extension = s.slice(dot + 1).replace(/[^a-z0-9.]/g, '');
  if (!name || !extension) return null;
  return { name, extension };
}

interface DomainResult {
  domain: string;
  available: boolean;
  premium: boolean;
  price: number | null;
  currency: string | null;
  status: string;
  source: 'cache' | 'live';
}

class Openprovider {
  private base: string;
  private username?: string;
  private password?: string;
  private token: string | null = null;
  constructor() {
    const raw = (Deno.env.get('OPENPROVIDER_BASE_URL') || DEFAULT_BASE).trim();
    this.base = raw.replace(/\/+$/, '').replace(/\/v1beta$/i, '');
    this.username = clean(Deno.env.get('OPENPROVIDER_USERNAME'));
    this.password = clean(Deno.env.get('OPENPROVIDER_PASSWORD'));
  }
  get configured() { return Boolean(this.username && this.password); }

  async login() {
    const resp = await fetch(this.base + '/v1beta/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: this.username, password: this.password, ip: '0.0.0.0' }),
    });
    const body = await resp.json().catch(() => ({})) as { code?: number; desc?: string; data?: { token?: string } };
    if (!resp.ok || (body?.code && body.code !== 0) || !body?.data?.token) {
      throw new Error(body?.desc || 'Openprovider authentication failed');
    }
    this.token = body.data.token;
  }

  // Batch availability + price. Openprovider caps batch size; chunk at 30.
  async check(domains: Array<{ name: string; extension: string }>): Promise<DomainResult[]> {
    if (!this.token) await this.login();
    const chunks: Array<Array<{ name: string; extension: string }>> = [];
    for (let i = 0; i < domains.length; i += CHUNK) chunks.push(domains.slice(i, i + CHUNK));
    const batches = await Promise.all(chunks.map((chunk) => this.checkChunk(chunk)));
    return batches.flat();
  }

  private async checkChunk(chunk: Array<{ name: string; extension: string }>): Promise<DomainResult[]> {
    const resp = await fetch(this.base + '/v1beta/domains/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.token}` },
      body: JSON.stringify({ domains: chunk, with_price: true }),
    });
    const body = await resp.json().catch(() => ({})) as {
      code?: number; desc?: string;
      data?: { results?: Array<{ domain: string; status: string; is_premium?: boolean; price?: { reseller?: { price?: number; currency?: string }; product?: { price?: number; currency?: string } } }> };
    };
    if (!resp.ok || (body?.code && body.code !== 0)) throw new Error(body?.desc || `Openprovider check failed (${resp.status})`);
    return (body?.data?.results ?? []).map((r) => {
      const p = r.price?.reseller ?? r.price?.product;
      return {
        domain: r.domain,
        available: r.status === 'free',
        premium: Boolean(r.is_premium),
        price: typeof p?.price === 'number' ? p.price : null,
        currency: p?.currency ?? null,
        status: r.status,
        source: 'live' as const,
      };
    });
  }
}

// Token-bucket rate limiter shared with the DNS layer's table.
async function consumeTokens(admin: SupabaseClient, n: number): Promise<boolean> {
  const now = Date.now();
  const { data: row } = await admin.from('dns_rate_limits').select('*').eq('bucket', BUCKET).maybeSingle();
  if (!row) {
    await admin.from('dns_rate_limits').insert({ bucket: BUCKET, tokens: CAPACITY - n, capacity: CAPACITY, refill_per_sec: REFILL_PER_SEC });
    return true;
  }
  const elapsed = (now - new Date(row.updated_at).getTime()) / 1000;
  const tokens = Math.min(row.capacity, row.tokens + elapsed * row.refill_per_sec);
  if (tokens < n) {
    await admin.from('dns_rate_limits').update({ tokens, updated_at: new Date(now).toISOString() }).eq('bucket', BUCKET);
    return false;
  }
  await admin.from('dns_rate_limits').update({ tokens: tokens - n, updated_at: new Date(now).toISOString() }).eq('bucket', BUCKET);
  return true;
}

// Resolve a set of domains using cache first, then a single live batch for misses.
async function resolve(admin: SupabaseClient, op: Openprovider, domains: string[]): Promise<DomainResult[]> {
  const uniq = Array.from(new Set(domains.map((d) => d.toLowerCase()))).filter(Boolean);
  const freshAfter = new Date(Date.now() - CACHE_TTL_SEC * 1000).toISOString();
  const { data: cached } = await admin.from('domain_search_cache').select('*').in('domain', uniq).gte('checked_at', freshAfter);
  const cachedMap = new Map((cached ?? []).map((c: Record<string, unknown>) => [c.domain as string, c]));

  const results: DomainResult[] = [];
  const misses: Array<{ name: string; extension: string }> = [];
  for (const d of uniq) {
    const c = cachedMap.get(d);
    if (c) {
      results.push({ domain: d, available: c.available as boolean, premium: c.premium as boolean, price: c.price as number | null, currency: c.currency as string | null, status: c.status as string, source: 'cache' });
    } else {
      const parts = splitDomain(d);
      if (parts) misses.push(parts);
    }
  }

  if (misses.length) {
    if (!(await consumeTokens(admin, Math.ceil(misses.length / CHUNK)))) {
      throw Object.assign(new Error('Search rate limit reached — please retry in a moment.'), { code: 429 });
    }
    const live = await op.check(misses);
    results.push(...live);
    if (live.length) {
      await admin.from('domain_search_cache').upsert(
        live.map((r) => ({ domain: r.domain, available: r.available, premium: r.premium, price: r.price, currency: r.currency, status: r.status, checked_at: new Date().toISOString() })),
        { onConflict: 'domain' },
      );
    }
  }
  return results;
}

// Heuristic suggestion engine ("AI-powered" discovery): TLD spread + affixes.
function buildCandidates(label: string): string[] {
  const set = new Set<string>();
  for (const t of SUGGEST_TLDS) set.add(`${label}.${t}`);
  for (const p of PREFIXES) { set.add(`${p}${label}.com`); set.add(`${p}${label}.so`); }
  for (const s of SUFFIXES) { set.add(`${label}${s}.com`); set.add(`${label}${s}.io`); }
  return Array.from(set).slice(0, 26);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });
  const op = new Openprovider();
  if (!op.configured) return json({ error: 'Registrar backend not configured.' }, 503);

  try {
    const body = await req.json().catch(() => ({}));
    const action = (body.action as string) || 'search';

    // Indicative annual pricing across the sovereign TLD namespace. Price is
    // returned by the provider independent of availability, so we probe a fixed
    // label and read the per-extension price (cached like any other check).
    if (action === 'tld-pricing') {
      // Neutral, non-dictionary label so registry-premium names don't skew base pricing.
      const probe = 'qzx7w9k2m';
      const resolved = await resolve(admin, op, SOVEREIGN_TLDS.map((t) => `${probe}.${t}`));
      const pricing = SOVEREIGN_TLDS
        .map((tld) => {
          const r = resolved.find((x) => x.domain === `${probe}.${tld}`);
          return { tld, price: r?.price ?? null, currency: r?.currency ?? null };
        })
        .filter((p) => p.price != null);
      return json({ pricing });
    }

    if (action === 'check') {
      const domains = (body.domains as string[] | undefined)?.filter(Boolean) ?? [];
      if (!domains.length) return json({ error: 'domains[] is required' }, 400);
      return json({ results: await resolve(admin, op, domains) });
    }

    if (action === 'search') {
      const raw = (body.query as string | undefined)?.trim();
      if (!raw) return json({ error: 'query is required' }, 400);

      // Exact intent: if the query already has a TLD, honor it; else spread across primaries.
      const explicit = splitDomain(raw);
      const label = sanitizeLabel(explicit ? explicit.name : raw);
      if (!label) return json({ error: 'Enter a valid domain or keyword.' }, 400);

      const exactDomains = explicit ? [`${explicit.name}.${explicit.extension}`] : PRIMARY_TLDS.map((t) => `${label}.${t}`);
      const tlds = (body.tlds as string[] | undefined)?.length ? (body.tlds as string[]) : null;
      const candidates = tlds ? tlds.map((t) => `${label}.${t}`) : buildCandidates(label);

      const all = Array.from(new Set([...exactDomains, ...candidates]));
      const resolved = await resolve(admin, op, all);
      const byDomain = new Map(resolved.map((r) => [r.domain, r]));

      const exact = exactDomains.map((d) => byDomain.get(d)).filter(Boolean) as DomainResult[];
      const suggestions = resolved
        .filter((r) => !exactDomains.includes(r.domain) && r.available)
        .sort((a, b) => (a.premium === b.premium ? (a.price ?? 1e9) - (b.price ?? 1e9) : a.premium ? 1 : -1))
        .slice(0, 18);

      return json({ query: label, exact, suggestions });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (e) {
    const err = e as Error & { code?: number };
    return json({ error: err.message || 'Registrar search failed.' }, err.code === 429 ? 429 : 502);
  }
});
