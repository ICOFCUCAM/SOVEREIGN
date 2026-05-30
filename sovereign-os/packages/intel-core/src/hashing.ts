import { createHash } from 'node:crypto';

// Canonical content hashing for signal dedup. Stable across connectors
// so the same article syndicated from different sources collapses to
// one signal with multiple attestations.

export function sha256Hex(input: string | Uint8Array): string {
  return createHash('sha256').update(input).digest('hex');
}

// Normalize a URL for dedup: lowercased host, no tracking params, no
// trailing slash, no fragment. Conservative — only strips known noise.
const TRACKING_PARAMS = /^(utm_|fbclid|gclid|mc_|ref|igsh|si)/i;

export function canonicalizeUrl(raw: string): string {
  try {
    const u = new URL(raw);
    u.hash = '';
    u.hostname = u.hostname.toLowerCase();
    const kept: [string, string][] = [];
    for (const [k, v] of u.searchParams.entries()) {
      if (!TRACKING_PARAMS.test(k)) kept.push([k, v]);
    }
    kept.sort(([a], [b]) => a.localeCompare(b));
    u.search = '';
    for (const [k, v] of kept) u.searchParams.append(k, v);
    let s = u.toString();
    if (s.endsWith('/') && u.pathname.length > 1) s = s.slice(0, -1);
    return s;
  } catch {
    return raw.trim();
  }
}

// Content-hash function for a normalized signal. Order-insensitive over
// (canonical_url, title, body_excerpt). Two connectors emitting the
// same article must produce the same hash.
export function signalContentHash(input: {
  canonicalUrl?: string;
  title?: string;
  bodyExcerpt?: string;
}): string {
  const url = input.canonicalUrl ? canonicalizeUrl(input.canonicalUrl) : '';
  const title = (input.title ?? '').trim();
  const body = (input.bodyExcerpt ?? '').trim().slice(0, 4096);
  return sha256Hex(`${url}\n${title}\n${body}`);
}
