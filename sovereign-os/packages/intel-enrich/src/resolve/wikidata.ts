import type { EntityType } from '@sovereign/intel-core';

// Wikidata grounding client. Queries wbsearchentities for the top
// candidate matching a mention; returns a QID + label + description
// the resolver writes into intel_entities.external_ids.

export interface WikidataMatch {
  readonly qid: string;
  readonly label: string;
  readonly description?: string;
  readonly score: number;
}

export interface WikidataClientOptions {
  readonly baseUrl?: string;
  readonly userAgent?: string;
  readonly fetchImpl?: typeof fetch;
}

interface WbSearchResponse {
  readonly search?: ReadonlyArray<{
    readonly id?: string;
    readonly label?: string;
    readonly description?: string;
    readonly match?: { readonly type?: string };
  }>;
}

// Mapping from our EntityType → Wikidata "type" facet. Heuristic — we
// don't query strictly typed (instance of) here; we filter by candidate
// description keywords after the search.
const TYPE_HINTS: Record<EntityType, readonly string[]> = {
  person:       ['person','politician','minister','executive','journalist','author'],
  organization: ['organization','company','government','agency','ministry','party','bank','university'],
  place:        ['country','city','region','province','state','place'],
  product:      ['product','brand','software','service'],
  topic:        ['concept','theme','topic','phenomenon'],
  event:        ['event','election','treaty','conflict','crisis'],
  asset:        ['security','asset','currency','commodity','instrument'],
  document:     ['document','report','treaty','law','publication'],
};

export class WikidataClient {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: WikidataClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? 'https://www.wikidata.org';
    this.userAgent = opts.userAgent ?? 'sovereign-intel-enrich/0.1.0 (institutional@sovereigndo.com)';
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async search(mention: string, entityType: EntityType, language = 'en'): Promise<WikidataMatch | undefined> {
    if (!mention) return undefined;
    const url = new URL(`${this.baseUrl}/w/api.php`);
    url.searchParams.set('action', 'wbsearchentities');
    url.searchParams.set('format', 'json');
    url.searchParams.set('language', language);
    url.searchParams.set('search', mention);
    url.searchParams.set('limit', '5');
    url.searchParams.set('type', 'item');

    const res = await this.fetchImpl(url.toString(), {
      headers: { 'user-agent': this.userAgent, 'accept': 'application/json' },
    });
    if (!res.ok) return undefined;
    const body = (await res.json()) as WbSearchResponse;
    const candidates = body.search ?? [];

    const hints = TYPE_HINTS[entityType];
    let best: WikidataMatch | undefined;
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      if (!c?.id || !c.label) continue;
      const description = (c.description ?? '').toLowerCase();
      const matchesHint = hints.some((h) => description.includes(h));
      const score = (matchesHint ? 0.7 : 0.4) + (1 / (i + 1)) * 0.3;
      const match: WikidataMatch = {
        qid: c.id,
        label: c.label,
        ...(c.description !== undefined ? { description: c.description } : {}),
        score,
      };
      if (!best || score > best.score) best = match;
    }
    return best;
  }
}
