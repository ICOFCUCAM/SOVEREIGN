import type { Connector, ConnectorContext, ConnectorPullResult, NormalizedSignal } from '@sovereign/intel-core';
import { makeProvenance, signalContentHash, sha256Hex } from '@sovereign/intel-core';

const CONNECTOR = 'fred';
const VERSION = '0.1.0';
const ENDPOINT = 'https://api.stlouisfed.org/fred/series/observations';

// Federal Reserve Economic Data (FRED) connector. Free; requires
// FRED_API_KEY (or the env named in source.auth_ref). Emits one
// financial_disclosure signal per observation, with the indicator
// value carried in the title for downstream queries.

export interface FredConfig {
  readonly seriesId: string;
  readonly observationStart?: string;
  readonly observationEnd?: string;
  readonly limit?: number;
}

interface FredResponse {
  readonly observations?: ReadonlyArray<{
    readonly date: string;
    readonly value: string;
  }>;
  readonly error_message?: string;
}

export function isFredConfig(v: unknown): v is FredConfig {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return typeof c.seriesId === 'string' && c.seriesId.length > 0;
}

function readApiKey(authRef: string | undefined): string {
  const envName = authRef && authRef.length > 0 ? authRef : 'FRED_API_KEY';
  const key = process.env[envName];
  if (!key) throw new Error(`fred: env ${envName} not set`);
  return key;
}

export const fredConnector: Connector = {
  name: CONNECTOR,
  family: 'financial',
  version: VERSION,

  async pull(ctx: ConnectorContext, config?: unknown): Promise<ConnectorPullResult> {
    if (!isFredConfig(config)) throw new Error('fred: missing or invalid config.seriesId');
    const apiKey = readApiKey((ctx as ConnectorContext & { authRef?: string }).authRef);
    const limit = Math.max(1, Math.min(config.limit ?? 50, 1000));

    const url = new URL(ENDPOINT);
    url.searchParams.set('series_id', config.seriesId);
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('file_type', 'json');
    url.searchParams.set('sort_order', 'desc');
    url.searchParams.set('limit', String(limit));
    if (config.observationStart) url.searchParams.set('observation_start', config.observationStart);
    if (config.observationEnd)   url.searchParams.set('observation_end',   config.observationEnd);

    ctx.logger.info('fred: fetching observations', { seriesId: config.seriesId, limit });
    const res = await ctx.fetch(url.toString(), {
      headers: { 'user-agent': 'sovereign-intel-connector/0.1.0', 'accept': 'application/json' },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`fred: ${res.status} ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as FredResponse;
    if (body.error_message) throw new Error(`fred: ${body.error_message}`);
    const observations = body.observations ?? [];

    const raws: Array<ConnectorPullResult['raws'][number]> = [];
    const signals: NormalizedSignal[] = [];

    for (const obs of observations) {
      if (!obs.date || obs.value === '.' || obs.value === undefined) continue;
      const observationUrl = `${ENDPOINT}?series_id=${config.seriesId}&observation_date=${obs.date}`;
      const provenance = makeProvenance(CONNECTOR, VERSION, {
        additional: { seriesId: config.seriesId, observationDate: obs.date },
      });
      const rawBody = JSON.stringify(obs);
      raws.push({
        contentHash: sha256Hex(`${config.seriesId}::${obs.date}`),
        canonicalUrl: observationUrl,
        mime: 'application/json',
        bytes: rawBody.length,
        payloadExcerpt: rawBody,
        provenance,
      });

      const title = `${config.seriesId} = ${obs.value} (${obs.date})`;
      const bodyExcerpt = `FRED indicator ${config.seriesId} reported ${obs.value} on ${obs.date}.`;
      signals.push({
        contentHash: signalContentHash({ canonicalUrl: observationUrl, title, bodyExcerpt }),
        canonicalUrl: observationUrl,
        signalClass: 'financial_disclosure',
        publishedAt: `${obs.date}T12:00:00Z`,
        language: 'en',
        title,
        bodyExcerpt,
        attestations: { primarySourceUrl: observationUrl },
        provenance,
      });
    }

    return {
      raws,
      signals,
      metadata: { provider: 'fred', costEstimateUsd: 0, seriesId: config.seriesId },
    };
  },
};
