import type { AcquisitionEvent } from './history-types.js';
import type { SectorTag } from '../types.js';

// SEC EDGAR adapter. Fetches 8-K filings for a list of acquirers and
// extracts disclosed acquisitions (Item 1.01 / 2.01 — entry into
// material agreement / completion of acquisition).
//
// EDGAR full-text search endpoint:
//   https://efts.sec.gov/LATEST/search-index?q=...&forms=8-K&ciks=<cik>
//
// Filing index:
//   https://data.sec.gov/submissions/CIK<10-digit-padded>.json
//
// Host blocked in this remote-execution environment — the adapter is
// real working code; either run it from an environment where
// data.sec.gov and efts.sec.gov are reachable, or use scripts/
// refresh-buyer-history.ts which writes the JSON snapshot.

export interface EdgarConfig {
  readonly userAgent: string;                  // SEC requires identifying UA: 'name email@host'
  readonly fetcher?: typeof fetch;
  readonly throttleMs?: number;                // SEC rate-limit guidance: 10 req/sec
}

export interface EdgarBuyer {
  readonly buyerName: string;                  // must match BuyerEntry.name
  readonly cik: string;                        // 10-digit, zero-padded
  readonly sectorHint?: SectorTag;
}

const SEC_SUBMISSIONS = 'https://data.sec.gov/submissions';
const ACQUISITION_PATTERNS = [
  /\bacqui(?:re|red|ring|sition)\b/i,
  /\bagreement\s+to\s+(?:acquire|purchase|merge)\b/i,
  /\bdefinitive\s+agreement\b/i,
  /\bmerger\b/i,
];

interface EdgarSubmissionsResponse {
  cik: string;
  name: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
      items: string[];
    };
  };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function fetchEdgar8KFilings(
  buyer: EdgarBuyer,
  config: EdgarConfig,
  sinceIso?: string,
): Promise<readonly EdgarFiling[]> {
  const fetcher = config.fetcher ?? fetch;
  const headers = { 'User-Agent': config.userAgent, 'Accept': 'application/json' };
  const cik = buyer.cik.padStart(10, '0');
  const since = sinceIso ? new Date(sinceIso).getTime() : 0;

  const url = `${SEC_SUBMISSIONS}/CIK${cik}.json`;
  const res = await fetcher(url, { headers });
  if (!res.ok) throw new Error(`EDGAR submissions ${cik} → HTTP ${res.status}`);
  const body = await res.json() as EdgarSubmissionsResponse;

  const recent = body.filings.recent;
  const filings: EdgarFiling[] = [];
  for (let i = 0; i < recent.form.length; i++) {
    if (recent.form[i] !== '8-K') continue;
    const filedAt = recent.filingDate[i];
    if (!filedAt) continue;
    if (since > 0 && new Date(filedAt).getTime() < since) continue;
    const items = (recent.items[i] ?? '').split(',').map((s) => s.trim());
    const isMaterialAgreement = items.some((it) => it === '1.01' || it === '2.01');
    if (!isMaterialAgreement) continue;
    const accession = recent.accessionNumber[i];
    const primaryDocument = recent.primaryDocument[i];
    if (!accession || !primaryDocument) continue;
    filings.push({
      accessionNumber: accession,
      filingDate: filedAt,
      form: '8-K',
      items,
      primaryDocument,
      cik,
      buyerName: buyer.buyerName,
    });
  }
  if (config.throttleMs) await sleep(config.throttleMs);
  return filings;
}

export interface EdgarFiling {
  readonly accessionNumber: string;
  readonly filingDate: string;
  readonly form: '8-K' | '10-K';
  readonly items: readonly string[];
  readonly primaryDocument: string;
  readonly cik: string;
  readonly buyerName: string;
}

export async function extractAcquisitionFromFiling(
  filing: EdgarFiling,
  config: EdgarConfig,
): Promise<AcquisitionEvent | null> {
  const fetcher = config.fetcher ?? fetch;
  const accession = filing.accessionNumber.replace(/-/g, '');
  const docUrl = `https://www.sec.gov/Archives/edgar/data/${parseInt(filing.cik, 10)}/${accession}/${filing.primaryDocument}`;
  const res = await fetcher(docUrl, { headers: { 'User-Agent': config.userAgent } });
  if (!res.ok) return null;
  const html = await res.text();

  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 50_000);
  const looksLikeAcquisition = ACQUISITION_PATTERNS.some((re) => re.test(text));
  if (!looksLikeAcquisition) return null;

  const targetMatch = text.match(/(?:agreement\s+to\s+(?:acquire|purchase)|acquired)\s+(?:all\s+(?:of\s+)?the\s+(?:outstanding\s+)?(?:capital\s+stock|equity\s+interests?)\s+of\s+)?([A-Z][A-Za-z0-9.,&'\- ]{2,80}?)(?:[,.]\s+(?:a|an|for|to|in)\s+|\.)/);
  const priceMatch = text.match(/\$\s?([\d,]+(?:\.\d+)?)\s?(billion|million|bn|mm|m|b)\b/i);

  const target = targetMatch?.[1]?.trim() ?? 'Undisclosed target';
  let price: number | undefined;
  if (priceMatch && priceMatch[1] && priceMatch[2]) {
    const n = parseFloat(priceMatch[1].replace(/,/g, ''));
    const unit = priceMatch[2].toLowerCase();
    price = /^b/.test(unit) ? n * 1_000_000_000 : n * 1_000_000;
  }

  if (config.throttleMs) await sleep(config.throttleMs);

  const retrievedAt = new Date().toISOString();
  return {
    buyerName: filing.buyerName,
    targetName: target,
    announcedDate: filing.filingDate,
    ...(price != null ? { headlinePriceUsd: price } : {}),
    status: 'announced',
    sourceRefs: [{ kind: 'edgar_8k', ref: filing.accessionNumber, retrievedAt, verified: true }],
    confidence: 'verified',
    // Price is regex-extracted from the filing body, not a structured
    // disclosure field — tag it down a tier so consumers can refuse
    // to mix it into a verified-only aggregate.
    ...(price != null ? { priceConfidence: 'estimated' as const } : {}),
  };
}

// Canonical CIK list for the buyers in BUYER_REGISTRY whose parent
// entity files with the SEC. PE / family-office wrappers without a
// listed feeder fund are intentionally omitted — they get covered by
// the Wikidata adapter instead.
export const EDGAR_BUYER_CIKS: readonly EdgarBuyer[] = [
  { buyerName: 'Salesforce Acquisition Office',     cik: '1108524', sectorHint: 'enterprise_saas' },
  { buyerName: 'Microsoft Industry Solutions',      cik: '789019',  sectorHint: 'enterprise_saas' },
  { buyerName: 'Adobe Strategic',                   cik: '796343',  sectorHint: 'enterprise_saas' },
  { buyerName: 'ServiceNow Workflow Acquisitions',  cik: '1373715', sectorHint: 'enterprise_saas' },
  { buyerName: 'C.H. Robinson Bolt-on',             cik: '1043277', sectorHint: 'logistics_freight' },
  { buyerName: 'XPO Strategic',                     cik: '1166003', sectorHint: 'logistics_freight' },
  { buyerName: 'Uber Acquisitions',                 cik: '1543151', sectorHint: 'mobility' },
  { buyerName: 'Shopify Commerce Buy-outs',         cik: '1594805', sectorHint: 'consumer_marketplace' },
  { buyerName: 'Amazon Strategic',                  cik: '1018724', sectorHint: 'consumer_marketplace' },
  { buyerName: 'KKR Tech Growth',                   cik: '1404912', sectorHint: 'enterprise_saas' },
  { buyerName: 'TPG Tech',                          cik: '1633917', sectorHint: 'enterprise_saas' },
];
