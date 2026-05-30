import type { Connector, ConnectorContext, ConnectorPullResult, NormalizedSignal } from '@sovereign/intel-core';
import { makeProvenance, signalContentHash, canonicalizeUrl, sha256Hex } from '@sovereign/intel-core';

const CONNECTOR = 'hacker-news';
const VERSION = '0.1.0';
const FIREBASE = 'https://hacker-news.firebaseio.com/v0';
const DEFAULT_LIMIT = 50;

interface HnItem {
  readonly id: number;
  readonly type?: 'story' | 'job' | 'poll' | 'comment';
  readonly title?: string;
  readonly url?: string;
  readonly text?: string;
  readonly by?: string;
  readonly time?: number;
  readonly score?: number;
  readonly descendants?: number;
}

// HN public Firebase API. Pulls top stories and normalizes them as
// social_post signals. No auth, no rate-limit header; we respect
// ctx.limit and stop early.

export const hackerNewsConnector: Connector = {
  name: CONNECTOR,
  family: 'social',
  version: VERSION,

  async pull(ctx: ConnectorContext): Promise<ConnectorPullResult> {
    const limit = Math.max(1, Math.min(ctx.limit ?? DEFAULT_LIMIT, 100));
    ctx.logger.info('hn: fetching top story ids', { limit });

    const topRes = await ctx.fetch(`${FIREBASE}/topstories.json`);
    if (!topRes.ok) throw new Error(`hn: top fetch ${topRes.status}`);
    const ids = (await topRes.json()) as number[];
    const slice = ids.slice(0, limit);

    const items: HnItem[] = [];
    // Sequential fetch — HN allows it, keeps backpressure simple.
    for (const id of slice) {
      const r = await ctx.fetch(`${FIREBASE}/item/${id}.json`);
      if (!r.ok) {
        ctx.logger.warn('hn: item fetch failed', { id, status: r.status });
        continue;
      }
      const it = (await r.json()) as HnItem | null;
      if (it && (it.type === 'story' || it.type === 'job')) items.push(it);
    }

    const raws: Array<ConnectorPullResult['raws'][number]> = [];
    const signals: NormalizedSignal[] = [];
    for (const it of items) {
      if (!it.title) continue;
      const canonicalUrl = it.url ? canonicalizeUrl(it.url) : `https://news.ycombinator.com/item?id=${it.id}`;
      const bodyExcerpt = it.text ?? `${it.score ?? 0} points · ${it.descendants ?? 0} comments`;
      const provenance = makeProvenance(CONNECTOR, VERSION, {
        additional: { hn_id: it.id, hn_score: it.score, hn_by: it.by },
      });
      const rawBody = JSON.stringify(it);
      raws.push({
        contentHash: sha256Hex(rawBody),
        canonicalUrl,
        mime: 'application/json',
        bytes: rawBody.length,
        payloadExcerpt: rawBody.slice(0, 2048),
        provenance,
      });
      signals.push({
        contentHash: signalContentHash({ canonicalUrl, title: it.title, bodyExcerpt }),
        canonicalUrl,
        signalClass: 'social_post',
        publishedAt: it.time ? new Date(it.time * 1000).toISOString() : new Date(ctx.now()).toISOString(),
        language: 'en',
        title: it.title,
        bodyExcerpt,
        attestations: { primarySourceUrl: canonicalUrl },
        provenance,
      });
    }

    return { raws, signals };
  },
};
