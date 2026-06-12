// ── BUYER UNIVERSE ──────────────────────────────────────────────────
// Expands the buyer registry from named public rosters:
//   · S&P 500 constituents — Wikipedia's table carries official GICS
//     Sector + Sub-Industry per company (the taxonomy source of record);
//   · largest US companies by revenue — Wikipedia's mirror of the
//     Fortune ranking, with citations;
//   · family offices — members of Wikipedia's Family offices category.
// Same hard rules as every pipeline: every buyer cites the page it came
// from; nothing is synthesized. Parsers are pure and unit-tested offline.

import { parse as parseHtml } from 'node-html-parser';
import { politeFetch, cleanCell } from './util.js';
import { meta, slug, type IngestedBuyer } from './types.js';
import { mapToExitOs } from './taxonomy.js';

export const SP500_PAGE = 'List_of_S%26P_500_companies';
export const LARGEST_US_PAGE = 'List_of_largest_companies_in_the_United_States_by_revenue';
export const FAMILY_OFFICE_CATEGORY = 'Category:Family_offices';

const WIKI_API = 'https://en.wikipedia.org/w/api.php';
const pageUrl = (title: string): string => `https://en.wikipedia.org/wiki/${title}`;

// "Alphabet Inc. (Class A)" and "(Class C)" are one buyer; strip share-class noise
const companyName = (raw: string): string =>
  raw.replace(/\s*\((class [a-c]|the company)\)\s*/i, '').trim();

/** Pure parser — S&P 500 constituents table → corporate buyers with GICS taxonomy. */
export function parseSp500Table(html: string): IngestedBuyer[] {
  const root = parseHtml(html);
  const out: IngestedBuyer[] = [];
  const url = pageUrl(SP500_PAGE);
  for (const table of root.querySelectorAll('table.wikitable')) {
    const rows = table.querySelectorAll('tr');
    const headers = rows[0]?.querySelectorAll('th').map((th) => cleanCell(th.text).toLowerCase()) ?? [];
    const iName = headers.findIndex((h) => /security|company/.test(h));
    const iSector = headers.findIndex((h) => /gics sector/.test(h));
    const iSub = headers.findIndex((h) => /gics sub/.test(h));
    const iHq = headers.findIndex((h) => /headquarters|location/.test(h));
    if (iName < 0 || iSector < 0) continue;             // the constituents table, not the changes table
    for (const row of rows.slice(1)) {
      const cells = row.querySelectorAll('td,th').map((c) => cleanCell(c.text));
      const name = companyName(cells[iName] ?? '');
      if (!name || name.length < 2) continue;
      const official = [cells[iSector], iSub >= 0 ? cells[iSub] : undefined].filter(Boolean).join(' · ');
      out.push({
        ...meta('wikipedia_universe', url, 'reported', 'unverified'),
        buyer_id: slug(name),
        name,
        buyer_type: 'corporate',
        ...(iHq >= 0 && cells[iHq] ? { country: cells[iHq]!.includes(',') ? 'United States' : cells[iHq]!.slice(0, 60) } : {}),
        ...(official ? { industry_official: official.slice(0, 120) } : {}),
        sector_exitos: mapToExitOs(official),
        list_page: SP500_PAGE,
      });
    }
    if (out.length) break;                              // first matching table IS the constituent list
  }
  return out;
}

/** Pure parser — largest US companies by revenue (the Fortune ranking's public mirror). */
export function parseLargestUsTable(html: string): IngestedBuyer[] {
  const root = parseHtml(html);
  const out: IngestedBuyer[] = [];
  const url = pageUrl(LARGEST_US_PAGE);
  for (const table of root.querySelectorAll('table.wikitable')) {
    const rows = table.querySelectorAll('tr');
    const headers = rows[0]?.querySelectorAll('th').map((th) => cleanCell(th.text).toLowerCase()) ?? [];
    const iName = headers.findIndex((h) => /^name|company/.test(h));
    const iIndustry = headers.findIndex((h) => /industry/.test(h));
    if (iName < 0 || iIndustry < 0) continue;
    for (const row of rows.slice(1)) {
      const cells = row.querySelectorAll('td,th').map((c) => cleanCell(c.text));
      const name = companyName(cells[iName] ?? '');
      if (!name || name.length < 2) continue;
      const official = cells[iIndustry];
      out.push({
        ...meta('wikipedia_universe', url, 'reported', 'unverified'),
        buyer_id: slug(name),
        name,
        buyer_type: 'corporate',
        country: 'United States',
        ...(official ? { industry_official: official.slice(0, 120) } : {}),
        sector_exitos: mapToExitOs(official),
        list_page: LARGEST_US_PAGE,
      });
    }
    if (out.length) break;
  }
  return out;
}

interface CategoryMembersJson {
  query?: { categorymembers?: Array<{ ns: number; title: string }> };
  continue?: { cmcontinue: string };
}

/** Pure mapper — category-member titles → family-office buyers. */
export function familyOfficesFromMembers(members: Array<{ ns: number; title: string }>): IngestedBuyer[] {
  return members
    .filter((m) => m.ns === 0)                          // articles only, not sub-categories
    .filter((m) => !/^(family office|list of)/i.test(m.title))
    .map((m) => ({
      ...meta('wikipedia_universe', pageUrl(encodeURIComponent(m.title.replace(/ /g, '_'))), 'reported', 'unverified'),
      buyer_id: slug(m.title),
      name: m.title,
      buyer_type: 'family_office' as const,
      list_page: FAMILY_OFFICE_CATEGORY,
    }));
}

async function fetchParsedHtml(title: string): Promise<string> {
  const url = `${WIKI_API}?action=parse&page=${title}&prop=text&format=json&formatversion=2&redirects=1`;
  const res = await politeFetch(url);
  const json = (await res.json()) as { parse?: { text?: string } };
  return json.parse?.text ?? '';
}

async function fetchFamilyOffices(): Promise<IngestedBuyer[]> {
  const members: Array<{ ns: number; title: string }> = [];
  let cont = '';
  do {
    const url = `${WIKI_API}?action=query&list=categorymembers&cmtitle=${FAMILY_OFFICE_CATEGORY}&cmlimit=500&format=json&formatversion=2${cont ? `&cmcontinue=${cont}` : ''}`;
    const res = await politeFetch(url);
    const json = (await res.json()) as CategoryMembersJson;
    members.push(...(json.query?.categorymembers ?? []));
    cont = json.continue?.cmcontinue ?? '';
  } while (cont);
  return familyOfficesFromMembers(members);
}

export interface UniverseResult {
  readonly buyers: IngestedBuyer[];
  readonly counts: { sp500: number; largest_us: number; family_offices: number };
}

/** Fetch all universe rosters; duplicate names collapse to the richer record. */
export async function ingestUniverse(): Promise<UniverseResult> {
  const sp500 = parseSp500Table(await fetchParsedHtml(SP500_PAGE));
  const largest = parseLargestUsTable(await fetchParsedHtml(LARGEST_US_PAGE));
  const family = await fetchFamilyOffices();
  const byId = new Map<string, IngestedBuyer>();
  for (const b of [...sp500, ...largest, ...family]) {
    if (!byId.has(b.buyer_id)) byId.set(b.buyer_id, b);  // S&P record (with GICS) wins
  }
  return {
    buyers: [...byId.values()],
    counts: { sp500: sp500.length, largest_us: largest.length, family_offices: family.length },
  };
}
