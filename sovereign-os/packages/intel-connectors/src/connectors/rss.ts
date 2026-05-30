import type {
  Connector, ConnectorContext, ConnectorPullResult, NormalizedSignal, SignalClass, SourceFamily,
} from '@sovereign/intel-core';
import { makeProvenance, signalContentHash, canonicalizeUrl, sha256Hex } from '@sovereign/intel-core';
import { parseFeed } from '../parse/rss.js';

const CONNECTOR = 'rss';
const VERSION = '0.1.0';

// Generic RSS/Atom connector. Config-driven: every intel_sources row of
// connector 'rss' carries config.feed_url + optional signal_class /
// family override. One connector module covers government press
// release feeds, news outlet RSS, blogs and Atom feeds at no extra
// engineering cost.

export interface RssConfig {
  readonly feed_url: string;
  readonly signal_class?: SignalClass;
  readonly source_family?: SourceFamily;
  readonly language?: string;
}

export function isRssConfig(v: unknown): v is RssConfig {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return typeof c.feed_url === 'string' && c.feed_url.length > 0;
}

export const rssConnector: Connector = {
  name: CONNECTOR,
  family: 'news',     // overridden via source.family — this is just the default
  version: VERSION,

  async pull(ctx: ConnectorContext, config?: unknown): Promise<ConnectorPullResult> {
    if (!isRssConfig(config)) {
      throw new Error('rss: missing or invalid config.feed_url');
    }
    const feedUrl = config.feed_url;
    const signalClass: SignalClass = config.signal_class ?? 'news_article';
    ctx.logger.info('rss: fetching feed', { feedUrl });

    const res = await ctx.fetch(feedUrl, { headers: { 'user-agent': 'sovereign-intel-connector/0.1.0' } });
    if (!res.ok) throw new Error(`rss: fetch ${res.status} on ${feedUrl}`);
    const xml = await res.text();
    const feed = parseFeed(xml);

    if (feed.format === 'unknown') {
      ctx.logger.warn('rss: unknown feed format', { feedUrl });
      return { raws: [], signals: [] };
    }

    const raws: Array<ConnectorPullResult['raws'][number]> = [];
    const signals: NormalizedSignal[] = [];

    for (const item of feed.items) {
      if (!item.title) continue;
      const canonicalUrl = item.link ? canonicalizeUrl(item.link) : (item.guid ?? '');
      if (!canonicalUrl) continue;
      const publishedAt = item.publishedAt ?? new Date(ctx.now()).toISOString();
      const provenance = makeProvenance(CONNECTOR, VERSION, {
        additional: { feed_url: feedUrl, format: feed.format },
      });
      const rawBody = JSON.stringify(item);
      raws.push({
        contentHash: sha256Hex(rawBody),
        canonicalUrl,
        mime: 'text/xml',
        bytes: rawBody.length,
        payloadExcerpt: rawBody.slice(0, 2048),
        provenance,
      });
      signals.push({
        contentHash: signalContentHash({
          canonicalUrl,
          title: item.title,
          ...(item.description !== undefined ? { bodyExcerpt: item.description } : {}),
        }),
        canonicalUrl,
        signalClass,
        publishedAt,
        ...(config.language !== undefined ? { language: config.language } : {}),
        title: item.title,
        ...(item.description !== undefined ? { bodyExcerpt: item.description } : {}),
        attestations: { primarySourceUrl: canonicalUrl },
        provenance,
      });
    }

    ctx.logger.info('rss: parsed', { items: signals.length, feedUrl });
    return { raws, signals };
  },
};
