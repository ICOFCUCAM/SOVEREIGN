// ── PIPELINE · SEC EDGAR ────────────────────────────────────────────
// The verification layer. Two jobs:
//   1. resolveCik(name) — via the official company_tickers.json index.
//   2. itemTwoOhOneFilings(cik) — 8-K filings reporting Item 2.01
//      ("Completion of Acquisition or Disposition of Assets") from the
//      submissions API. Each filing is itself an acquisition_event with
//      'verified' confidence (it IS the primary source), and is used to
//      corroborate Wikipedia/Wikidata records for the same buyer within
//      a ±90-day window of the filing date.

import { politeFetch } from './util.js';
import { meta, acquisitionId, slug, type IngestedAcquisition } from './types.js';

interface TickerRow { cik_str: number; ticker: string; title: string }

let tickerIndex: TickerRow[] | null = null;

export async function resolveCik(name: string): Promise<string | undefined> {
  if (!tickerIndex) {
    const res = await politeFetch('https://www.sec.gov/files/company_tickers.json');
    const json = (await res.json()) as Record<string, TickerRow>;
    tickerIndex = Object.values(json);
  }
  const needle = name.toLowerCase().replace(/[.,]| inc\b| corp\b| corporation\b| plc\b/g, '').trim();
  const hit = tickerIndex.find((r) => r.title.toLowerCase().includes(needle));
  return hit ? String(hit.cik_str).padStart(10, '0') : undefined;
}

export interface SecFiling {
  readonly accession: string;
  readonly filed: string;        // ISO date
  readonly form: string;
  readonly items: string;
  readonly url: string;
}

export async function itemTwoOhOneFilings(cik: string): Promise<SecFiling[]> {
  const res = await politeFetch(`https://data.sec.gov/submissions/CIK${cik}.json`);
  const json = (await res.json()) as {
    filings?: { recent?: { accessionNumber?: string[]; filingDate?: string[]; form?: string[]; items?: string[] } };
  };
  const r = json.filings?.recent;
  if (!r?.accessionNumber) return [];
  const out: SecFiling[] = [];
  for (let i = 0; i < r.accessionNumber.length; i++) {
    if (r.form?.[i] !== '8-K') continue;
    const items = r.items?.[i] ?? '';
    if (!items.includes('2.01')) continue;
    const acc = r.accessionNumber[i]!;
    out.push({
      accession: acc,
      filed: r.filingDate?.[i] ?? '',
      form: '8-K',
      items,
      url: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cik}&type=8-K&dateb=&owner=include&count=40`,
    });
  }
  return out;
}

/** Filing-level acquisition events — primary-source records in their own right. */
export function filingsToEvents(buyerName: string, filings: SecFiling[]): IngestedAcquisition[] {
  return filings.map((f) => ({
    ...meta('sec_edgar', `https://www.sec.gov/Archives/edgar/data/${parseInt(f.accession.slice(0, 10), 10)}/${f.accession.replace(/-/g, '')}`, 'verified', 'verified'),
    acquisition_id: acquisitionId(buyerName, `8-K item 2.01 ${f.accession}`, f.filed),
    buyer_id: slug(buyerName),
    buyer_name: buyerName,
    target_name: `[8-K Item 2.01 — completion of acquisition/disposition] ${f.accession}`,
    announced_date: f.filed,
    derived_from: f.accession,
  }));
}

/** Mark wiki-sourced records 'corroborated' when an 8-K item 2.01 by the
 *  same buyer exists within ±90 days of the record's date. */
export function corroborate(records: IngestedAcquisition[], filingsByBuyer: Map<string, SecFiling[]>): IngestedAcquisition[] {
  const DAY = 86_400_000;
  return records.map((rec) => {
    if (rec.verification_status !== 'unverified' || !rec.announced_date) return rec;
    const filings = filingsByBuyer.get(rec.buyer_id);
    if (!filings) return rec;
    const t = new Date(rec.announced_date).getTime();
    const hit = filings.find((f) => Math.abs(new Date(f.filed).getTime() - t) <= 90 * DAY);
    return hit ? { ...rec, verification_status: 'corroborated', derived_from: hit.accession } : rec;
  });
}
