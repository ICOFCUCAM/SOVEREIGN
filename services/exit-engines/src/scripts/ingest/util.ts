// Shared fetch + parsing utilities for the ingestion pipelines.
// Polite by construction: identified User-Agent, per-host rate limiting,
// exponential backoff on 429/5xx. SEC requires a contactable UA.

export const USER_AGENT = 'ExitOS-Research/1.0 (acquisition registry; contact: research@sovereigndo.com)';

export const REQUIRED_HOSTS = [
  'en.wikipedia.org',
  'www.wikidata.org',
  'query.wikidata.org',
  'www.sec.gov',
  'data.sec.gov',
  'efts.sec.gov',
] as const;

const lastHit = new Map<string, number>();
const HOST_INTERVAL_MS: Record<string, number> = {
  'data.sec.gov': 150,   // SEC fair-use: ≤10 req/s — we stay far under
  'www.sec.gov': 150,
  'efts.sec.gov': 250,
  'query.wikidata.org': 1100,
  default: 350,
};

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

export async function politeFetch(url: string, init: RequestInit = {}, retries = 3): Promise<Response> {
  const host = new URL(url).host;
  const interval = HOST_INTERVAL_MS[host] ?? HOST_INTERVAL_MS['default']!;
  const since = Date.now() - (lastHit.get(host) ?? 0);
  if (since < interval) await sleep(interval - since);
  lastHit.set(host, Date.now());

  const headers = { 'User-Agent': USER_AGENT, ...((init.headers as Record<string, string>) ?? {}) };
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { ...init, headers });
    if (res.ok) return res;
    const retriable = res.status === 429 || res.status >= 500;
    if (!retriable || attempt >= retries) {
      const body = (await res.text()).slice(0, 200);
      throw new Error(`fetch ${res.status} ${url} :: ${body}`);
    }
    await sleep(1000 * 2 ** attempt + Math.random() * 500);
  }
}

/** Preflight — verifies egress to every required host before ingesting.
 *  Fails with the exact allowlist the operator must configure. */
export async function preflight(): Promise<void> {
  const blocked: string[] = [];
  for (const host of REQUIRED_HOSTS) {
    try {
      const res = await fetch(`https://${host}/`, { method: 'HEAD', headers: { 'User-Agent': USER_AGENT } });
      // any HTTP status proves egress; proxy blocks surface as 403 + allowlist text
      if (res.status === 403) {
        const body = await (await fetch(`https://${host}/`, { headers: { 'User-Agent': USER_AGENT } })).text();
        if (body.includes('not in allowlist')) blocked.push(host);
      }
    } catch {
      blocked.push(host);
    }
  }
  if (blocked.length > 0) {
    throw new Error(
      `NETWORK EGRESS BLOCKED — no data was ingested and none will be fabricated.\n` +
      `Add these hosts to the environment's network allowlist, then re-run:\n` +
      blocked.map((h) => `  - ${h}`).join('\n'),
    );
  }
}

// ── value / date parsing ────────────────────────────────────────────

/** "US$26.2 billion" | "$1,200 million" | "€4.85 billion" → USD number (EUR/GBP left unconverted → undefined). */
export function parseMoneyUsd(raw: string | undefined, assumeUsd = false): number | undefined {
  if (!raw) return undefined;
  const text = raw.replace(/ /g, ' ').trim();
  // unmarked numerics are accepted only when the COLUMN declares USD
  // (e.g. Wikipedia's "Value (USD)" columns list bare figures)
  if (!/(US\$|\$|USD)/.test(text) && !(assumeUsd && /^[\d,]+(\.\d+)?( ?(billion|million))?$/i.test(text))) return undefined;
  const m = text.match(/([\d,]+(?:\.\d+)?)\s*(billion|million|thousand|bn|m\b)?/i);
  if (!m) return undefined;
  const n = parseFloat(m[1]!.replace(/,/g, ''));
  if (!Number.isFinite(n)) return undefined;
  const unit = (m[2] ?? '').toLowerCase();
  const mult = unit.startsWith('b') ? 1e9 : unit.startsWith('m') ? 1e6 : unit.startsWith('t') ? 1e3 : 1;
  return Math.round(n * mult);
}

const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
};

/** "September 24, 1993" | "24 September 1993" | "1993-09-24" → ISO date. */
export function parseDateIso(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.replace(/ /g, ' ').trim();
  let m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = t.match(/([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
  if (m) { const mo = MONTHS[m[1]!.toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[2]!.padStart(2, '0')}`; }
  m = t.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (m) { const mo = MONTHS[m[2]!.toLowerCase()]; if (mo) return `${m[3]}-${mo}-${m[1]!.padStart(2, '0')}`; }
  m = t.match(/([A-Za-z]+)\s+(\d{4})/);
  if (m) { const mo = MONTHS[m[1]!.toLowerCase()]; if (mo) return `${m[2]}-${mo}-01`; }
  m = t.match(/\b(\d{4})\b/);
  if (m) return `${m[1]}-01-01`;
  return undefined;
}

export const cleanCell = (s: string): string =>
  s.replace(/\[\d+\]/g, '').replace(/\s+/g, ' ').trim();
