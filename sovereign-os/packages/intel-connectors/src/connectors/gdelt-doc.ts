import type { Connector, ConnectorContext, ConnectorPullResult, NormalizedSignal } from '@sovereign/intel-core';
import { makeProvenance, signalContentHash, canonicalizeUrl, sha256Hex } from '@sovereign/intel-core';

const CONNECTOR = 'gdelt-doc';
const VERSION = '0.1.0';
const ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';

// GDELT DOC 2.0 article search API. Free, no auth. Query-driven —
// config.query is required (e.g. 'lang:eng', 'sourcecountry:US lang:eng',
// 'theme:CRISISLEX').

export interface GdeltConfig {
  readonly query: string;
  readonly maxrecords?: number;       // 1–250
  readonly timespan?: string;         // e.g. '1d', '6h', '15min'
  readonly sort?: 'DateDesc' | 'DateAsc' | 'ToneDesc' | 'ToneAsc';
}

interface GdeltArticle {
  readonly url?: string;
  readonly url_mobile?: string;
  readonly title?: string;
  readonly seendate?: string;        // "20260530T120000Z"
  readonly socialimage?: string;
  readonly domain?: string;
  readonly language?: string;
  readonly sourcecountry?: string;
}

export function isGdeltConfig(v: unknown): v is GdeltConfig {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return typeof c.query === 'string' && c.query.length > 0;
}

function parseSeenDate(s: string | undefined): string | undefined {
  if (!s) return undefined;
  // "YYYYMMDDTHHMMSSZ"
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (!m) return undefined;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
}

export const gdeltDocConnector: Connector = {
  name: CONNECTOR,
  family: 'news',
  version: VERSION,

  async pull(ctx: ConnectorContext, config?: unknown): Promise<ConnectorPullResult> {
    if (!isGdeltConfig(config)) {
      throw new Error('gdelt-doc: missing or invalid config.query');
    }
    const maxrecords = Math.max(1, Math.min(config.maxrecords ?? 100, 250));
    const url = new URL(ENDPOINT);
    url.searchParams.set('query', config.query);
    url.searchParams.set('mode', 'ArtList');
    url.searchParams.set('format', 'JSON');
    url.searchParams.set('maxrecords', String(maxrecords));
    if (config.timespan) url.searchParams.set('timespan', config.timespan);
    url.searchParams.set('sort', config.sort ?? 'DateDesc');

    ctx.logger.info('gdelt: querying', { query: config.query, maxrecords });

    const res = await ctx.fetch(url.toString(), {
      headers: { 'user-agent': 'sovereign-intel-connector/0.1.0' },
    });
    if (!res.ok) throw new Error(`gdelt-doc: fetch ${res.status}`);
    const body = (await res.json()) as { articles?: GdeltArticle[] };
    const articles = body.articles ?? [];

    const raws: Array<ConnectorPullResult['raws'][number]> = [];
    const signals: NormalizedSignal[] = [];

    for (const a of articles) {
      if (!a.url || !a.title) continue;
      const canonicalUrl = canonicalizeUrl(a.url);
      const publishedAt = parseSeenDate(a.seendate) ?? new Date(ctx.now()).toISOString();
      const provenance = makeProvenance(CONNECTOR, VERSION, {
        additional: {
          query: config.query,
          domain: a.domain,
          sourcecountry: a.sourcecountry,
          socialimage: a.socialimage,
        },
      });
      const rawBody = JSON.stringify(a);
      raws.push({
        contentHash: sha256Hex(rawBody),
        canonicalUrl,
        mime: 'application/json',
        bytes: rawBody.length,
        payloadExcerpt: rawBody.slice(0, 2048),
        provenance,
      });
      signals.push({
        contentHash: signalContentHash({ canonicalUrl, title: a.title }),
        canonicalUrl,
        signalClass: 'news_article',
        publishedAt,
        ...(a.language !== undefined ? { language: a.language.toLowerCase().slice(0, 2) } : {}),
        title: a.title,
        ...(a.sourcecountry !== undefined ? { geoFocus: { countries: [a.sourcecountry] } } : {}),
        attestations: { primarySourceUrl: canonicalUrl, ...(a.domain ? { syndicatedFrom: [a.domain] } : {}) },
        provenance,
      });
    }

    return { raws, signals };
  },
};
