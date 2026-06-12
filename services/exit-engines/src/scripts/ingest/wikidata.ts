// ── PIPELINE · WIKIDATA ─────────────────────────────────────────────
// Two jobs:
//   1. resolveQid(name) — entity resolution via wbsearchentities, so we
//      never hardcode (and never mis-assign) a QID.
//   2. acquisitionsOf(qid) — SPARQL over ownership statements
//      (p:P127 "owned by" with start-time qualifiers) → acquisition
//      records with entity-level provenance URLs.

import { politeFetch } from './util.js';
import { meta, acquisitionId, slug, type IngestedAcquisition } from './types.js';

const WD_API = 'https://www.wikidata.org/w/api.php';
const SPARQL = 'https://query.wikidata.org/sparql';

export async function resolveQid(name: string): Promise<string | undefined> {
  const url = `${WD_API}?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&type=item&limit=5&format=json`;
  const res = await politeFetch(url);
  const json = (await res.json()) as { search?: Array<{ id: string; description?: string }> };
  // prefer an entity whose description looks corporate
  const hit = json.search?.find((s) => /compan|corporat|enterprise|firm|fund|conglomerate|business/i.test(s.description ?? ''))
    ?? json.search?.[0];
  return hit?.id;
}

interface SparqlBinding { [k: string]: { value: string } | undefined }

export async function acquisitionsOf(buyerName: string, qid: string): Promise<IngestedAcquisition[]> {
  // companies whose "owned by" (P127) statement points at the buyer,
  // with optional start time (P580) and the statement as provenance
  const q = `
SELECT ?target ?targetLabel ?start WHERE {
  ?target p:P127 ?st .
  ?st ps:P127 wd:${qid} .
  OPTIONAL { ?st pq:P580 ?start . }
  ?target wdt:P31/wdt:P279* wd:Q4830453 .
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
} LIMIT 500`;
  const res = await politeFetch(`${SPARQL}?query=${encodeURIComponent(q)}&format=json`, {
    headers: { Accept: 'application/sparql-results+json' },
  });
  const json = (await res.json()) as { results?: { bindings?: SparqlBinding[] } };
  const out: IngestedAcquisition[] = [];
  for (const b of json.results?.bindings ?? []) {
    const targetUri = b['target']?.value;
    const label = b['targetLabel']?.value;
    if (!targetUri || !label || /^Q\d+$/.test(label)) continue;    // unlabeled entity — skip, don't guess
    const date = b['start']?.value?.slice(0, 10);
    out.push({
      ...meta('wikidata', targetUri, 'reported', 'unverified'),
      acquisition_id: acquisitionId(buyerName, label, date),
      buyer_id: slug(buyerName),
      buyer_name: buyerName,
      target_name: label,
      ...(date ? { announced_date: date } : {}),
    });
  }
  return out;
}
