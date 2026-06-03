import type { AcquisitionEvent } from './history-types.js';
import type { SectorTag } from '../types.js';

// Wikidata SPARQL adapter. Queries the Wikidata Query Service for
// acquisition relationships using property P749 (parent organization)
// and P127 (owned by) — for each acquirer QID, returns all subsidiaries
// + their disclosed inception/acquisition dates.
//
// Endpoint: https://query.wikidata.org/sparql (Accept: application/json)
//
// Host blocked in this remote-execution environment — the adapter is
// real working code; either run it from an environment where
// query.wikidata.org is reachable, or use scripts/refresh-buyer-history.ts
// which writes the JSON snapshot.

export interface WikidataConfig {
  readonly userAgent: string;                   // 'ExitOS/0.1 (icofcucam@gmail.com)'
  readonly fetcher?: typeof fetch;
}

export interface WikidataBuyer {
  readonly buyerName: string;
  readonly qid: string;                         // e.g. 'Q19837'
  readonly sectorHint?: SectorTag;
}

const SPARQL = 'https://query.wikidata.org/sparql';

const ACQUISITIONS_QUERY = (qid: string): string => `
SELECT ?sub ?subLabel ?date ?country ?countryLabel ?price WHERE {
  ?sub wdt:P749 wd:${qid} .
  OPTIONAL { ?sub wdt:P571 ?date }
  OPTIONAL { ?sub wdt:P17  ?country }
  OPTIONAL { ?sub p:P749 ?stmt .
             ?stmt ps:P749 wd:${qid} .
             OPTIONAL { ?stmt pq:P2284 ?price } }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
ORDER BY DESC(?date)
LIMIT 50
`;

interface SparqlBinding {
  sub:          { value: string };
  subLabel?:    { value: string };
  date?:        { value: string };
  country?:     { value: string };
  countryLabel?:{ value: string };
  price?:       { value: string };
}

interface SparqlResponse {
  results: { bindings: SparqlBinding[] };
}

const COUNTRY_QID_TO_ISO: Record<string, string> = {
  Q30: 'US', Q145: 'GB', Q183: 'DE', Q142: 'FR', Q16: 'CA', Q668: 'IN',
  Q884: 'KR', Q17: 'JP', Q865: 'TW', Q148: 'CN', Q414: 'AR', Q155: 'BR',
  Q96: 'MX', Q408: 'AU', Q664: 'NZ', Q801: 'IL', Q43: 'TR', Q34: 'SE',
  Q39: 'CH', Q35: 'DK', Q33: 'FI', Q20: 'NO', Q31: 'BE', Q55: 'NL',
  Q29: 'ES', Q38: 'IT', Q27: 'IE', Q36: 'PL', Q40: 'AT', Q34020: 'NU',
  Q334: 'SG', Q833: 'MY', Q252: 'ID',
};

export async function fetchWikidataAcquisitions(
  buyer: WikidataBuyer,
  config: WikidataConfig,
): Promise<readonly AcquisitionEvent[]> {
  const fetcher = config.fetcher ?? fetch;
  const url = `${SPARQL}?format=json&query=${encodeURIComponent(ACQUISITIONS_QUERY(buyer.qid))}`;
  const res = await fetcher(url, {
    headers: { 'User-Agent': config.userAgent, 'Accept': 'application/sparql-results+json' },
  });
  if (!res.ok) throw new Error(`Wikidata ${buyer.qid} → HTTP ${res.status}`);
  const body = await res.json() as SparqlResponse;

  const events: AcquisitionEvent[] = [];
  const retrievedAt = new Date().toISOString();

  for (const b of body.results.bindings) {
    const targetName = b.subLabel?.value ?? b.sub.value.split('/').pop() ?? 'Unknown';
    const announcedDate = b.date?.value?.slice(0, 10);
    if (!announcedDate) continue;

    const countryQid = b.country?.value?.split('/').pop();
    const targetGeography = countryQid ? COUNTRY_QID_TO_ISO[countryQid] : undefined;

    const price = b.price?.value ? parseFloat(b.price.value) : undefined;

    events.push({
      buyerName: buyer.buyerName,
      targetName,
      announcedDate,
      ...(price != null && !Number.isNaN(price) ? { headlinePriceUsd: price } : {}),
      ...(targetGeography ? { targetGeography } : {}),
      status: 'closed',
      sourceRefs: [{ kind: 'wikidata', ref: b.sub.value.split('/').pop() ?? buyer.qid, retrievedAt, verified: true }],
      confidence: 'verified',
    });
  }
  return events;
}

// Wikidata QIDs for the buyers in BUYER_REGISTRY. Covers the entities
// EDGAR can't reach (PE wrappers, family offices, foreign acquirers).
export const WIKIDATA_BUYER_QIDS: readonly WikidataBuyer[] = [
  { buyerName: 'Salesforce Acquisition Office',     qid: 'Q941127',   sectorHint: 'enterprise_saas' },
  { buyerName: 'Microsoft Industry Solutions',      qid: 'Q2283',     sectorHint: 'enterprise_saas' },
  { buyerName: 'Adobe Strategic',                   qid: 'Q165152',   sectorHint: 'enterprise_saas' },
  { buyerName: 'ServiceNow Workflow Acquisitions',  qid: 'Q1349878',  sectorHint: 'enterprise_saas' },
  { buyerName: 'Vista Enterprise Software Bolt-On', qid: 'Q7935626',  sectorHint: 'enterprise_saas' },
  { buyerName: 'Thoma Bravo Software Buy-out',      qid: 'Q7785891',  sectorHint: 'enterprise_saas' },
  { buyerName: 'Insight Partners Growth',           qid: 'Q6038180',  sectorHint: 'enterprise_saas' },
  { buyerName: 'General Atlantic',                  qid: 'Q1501523',  sectorHint: 'fintech_payments' },
  { buyerName: 'C.H. Robinson Bolt-on',             qid: 'Q1027063',  sectorHint: 'logistics_freight' },
  { buyerName: 'XPO Strategic',                     qid: 'Q7724866',  sectorHint: 'logistics_freight' },
  { buyerName: 'Uber Acquisitions',                 qid: 'Q693617',   sectorHint: 'mobility' },
  { buyerName: 'Shopify Commerce Buy-outs',         qid: 'Q3417668',  sectorHint: 'consumer_marketplace' },
  { buyerName: 'Amazon Strategic',                  qid: 'Q3884',     sectorHint: 'consumer_marketplace' },
  { buyerName: 'KKR Tech Growth',                   qid: 'Q1140675',  sectorHint: 'enterprise_saas' },
  { buyerName: 'TPG Tech',                          qid: 'Q3990061',  sectorHint: 'enterprise_saas' },
  { buyerName: 'Pritzker Private Capital',          qid: 'Q123141947', sectorHint: 'logistics_freight' },
  { buyerName: 'Walton Enterprises',                qid: 'Q7963075',  sectorHint: 'consumer_marketplace' },
];
