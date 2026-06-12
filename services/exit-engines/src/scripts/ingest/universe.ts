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
export const PE_LIST_PAGE = 'List_of_private_equity_firms';
export const FAMILY_OFFICE_CATEGORY = 'Category:Family_offices';
export const PE_CATEGORY = 'Category:Private_equity_firms';
export const SWF_CATEGORY = 'Category:Sovereign_wealth_funds';

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

export interface CategoryMember { ns: number; title: string }

/** Pure mapper — category-member article titles → buyers of the given type.
 *  Concept pages, lists and disambiguations never become buyers. */
export function buyersFromCategoryMembers(
  members: CategoryMember[],
  buyer_type: IngestedBuyer['buyer_type'],
  category: string,
): IngestedBuyer[] {
  const out = new Map<string, IngestedBuyer>();
  for (const m of members) {
    if (m.ns !== 0) continue;                           // articles only, not sub-categories
    if (/^(family office|private equity|sovereign wealth fund|list of|history of|category:)/i.test(m.title)) continue;
    if (/\(disambiguation\)/i.test(m.title)) continue;
    const name = m.title.replace(/\s*\([^)]*\)\s*$/, '').trim();  // "Carlyle Group (company)" → "Carlyle Group"
    if (name.length < 3) continue;
    const id = slug(name);
    if (out.has(id)) continue;
    out.set(id, {
      ...meta('wikipedia_universe', pageUrl(encodeURIComponent(m.title.replace(/ /g, '_'))), 'reported', 'unverified'),
      buyer_id: id,
      name,
      buyer_type,
      list_page: category,
    });
  }
  return [...out.values()];
}

/** Pure mapper — kept for the family-office entry point. */
export function familyOfficesFromMembers(members: CategoryMember[]): IngestedBuyer[] {
  return buyersFromCategoryMembers(members, 'family_office', FAMILY_OFFICE_CATEGORY);
}

/** Pure parser — the ranked private-equity firms list (PEI ranking mirror). */
export function parsePeListTable(html: string): IngestedBuyer[] {
  const root = parseHtml(html);
  const out: IngestedBuyer[] = [];
  const url = pageUrl(PE_LIST_PAGE);
  for (const table of root.querySelectorAll('table.wikitable')) {
    const rows = table.querySelectorAll('tr');
    const headers = rows[0]?.querySelectorAll('th').map((th) => cleanCell(th.text).toLowerCase()) ?? [];
    const iName = headers.findIndex((h) => /firm|name|company/.test(h));
    const iHq = headers.findIndex((h) => /headquarters|location|city/.test(h));
    if (iName < 0) continue;
    for (const row of rows.slice(1)) {
      const cells = row.querySelectorAll('td,th').map((c) => cleanCell(c.text));
      const name = companyName(cells[iName] ?? '');
      if (!name || name.length < 3 || /^\d+$/.test(name)) continue;
      out.push({
        ...meta('wikipedia_universe', url, 'reported', 'unverified'),
        buyer_id: slug(name),
        name,
        buyer_type: 'private_equity',
        ...(iHq >= 0 && cells[iHq] ? { country: cells[iHq]!.split(',').at(-1)!.trim().slice(0, 60) } : {}),
        list_page: PE_LIST_PAGE,
      });
    }
    if (out.length) break;
  }
  return out;
}

async function fetchParsedHtml(title: string): Promise<string> {
  const url = `${WIKI_API}?action=parse&page=${title}&prop=text&format=json&formatversion=2&redirects=1`;
  const res = await politeFetch(url);
  const json = (await res.json()) as { parse?: { text?: string } };
  return json.parse?.text ?? '';
}

async function fetchCategoryMembers(category: string): Promise<CategoryMember[]> {
  const members: CategoryMember[] = [];
  let cont = '';
  do {
    const url = `${WIKI_API}?action=query&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmlimit=500&format=json&formatversion=2${cont ? `&cmcontinue=${encodeURIComponent(cont)}` : ''}`;
    const res = await politeFetch(url);
    const json = (await res.json()) as CategoryMembersJson;
    members.push(...(json.query?.categorymembers ?? []));
    cont = json.continue?.cmcontinue ?? '';
  } while (cont);
  return members;
}

/** Category + its sub-categories (one level: the by-country splits). */
async function fetchCategoryTree(category: string, maxSubcats = 60): Promise<CategoryMember[]> {
  const top = await fetchCategoryMembers(category);
  const subcats = top.filter((m) => m.ns === 14).slice(0, maxSubcats);
  const all = [...top];
  for (const sub of subcats) {
    try {
      all.push(...await fetchCategoryMembers(sub.title));
    } catch {
      // a missing sub-category page never aborts the roster
    }
  }
  return all;
}

export interface UniverseResult {
  readonly buyers: IngestedBuyer[];
  readonly counts: { sp500: number; largest_us: number; private_equity: number; sovereign_funds: number; family_offices: number };
}

/** Fetch all universe rosters; duplicate names collapse to the richer record. */
export async function ingestUniverse(): Promise<UniverseResult> {
  const sp500 = parseSp500Table(await fetchParsedHtml(SP500_PAGE));
  const largest = parseLargestUsTable(await fetchParsedHtml(LARGEST_US_PAGE));
  // PE: the ranked list page + the category tree (by-country sub-categories)
  const peList = parsePeListTable(await fetchParsedHtml(PE_LIST_PAGE));
  const peCat = buyersFromCategoryMembers(await fetchCategoryTree(PE_CATEGORY), 'private_equity', PE_CATEGORY);
  const swfCat = buyersFromCategoryMembers(await fetchCategoryTree(SWF_CATEGORY), 'sovereign_fund', SWF_CATEGORY);
  const family = familyOfficesFromMembers(await fetchCategoryMembers(FAMILY_OFFICE_CATEGORY));

  const byId = new Map<string, IngestedBuyer>();
  // order matters: S&P (carries GICS) > largest-US > PE list (ranked) > categories
  for (const b of [...sp500, ...largest, ...peList, ...peCat, ...swfCat, ...family]) {
    if (!byId.has(b.buyer_id)) byId.set(b.buyer_id, b);
  }
  const pe = [...byId.values()].filter((b) => b.buyer_type === 'private_equity').length;
  return {
    buyers: [...byId.values()],
    counts: { sp500: sp500.length, largest_us: largest.length, private_equity: pe, sovereign_funds: swfCat.length, family_offices: family.length },
  };
}
