import type { CompanyProfile } from '../types.js';

// Profile codes as plain English. A document states what the company's data
// says, attributed where it is the company's own assessment; it never turns a
// code like "leader" into a superlative a buyer cannot check.

const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;

const SECTOR: Record<string, string> = {
  enterprise_saas: 'enterprise software', vertical_saas: 'vertical software', b2b_marketplace: 'business-to-business marketplaces',
  consumer_marketplace: 'consumer marketplaces', fintech_payments: 'financial technology and payments', logistics_freight: 'logistics and freight',
};
/** "vertical software", "logistics and freight". */
export const sectorPhrase = (s: string): string => SECTOR[s] ?? s.replace(/_/g, ' ');

const MODEL: Record<string, string> = {
  saas: 'software-as-a-service business', marketplace: 'marketplace business', logistics: 'logistics business',
  mobility: 'mobility business', ai_platform: 'AI platform business', fintech: 'financial-technology business',
  commerce: 'commerce business', media: 'media business', services: 'services business', other: 'business',
};
/** With its article: "a software-as-a-service business", "an AI platform business". */
export const modelPhrase = (m: string, sector?: string): string => {
  let p = MODEL[m] ?? `${m.replace(/_/g, ' ')} business`;
  // "a logistics business in logistics and freight" says the same thing twice: drop the repeated word
  if (sector && sectorPhrase(sector).toLowerCase().includes((p.split(' ')[0] ?? '').toLowerCase())) p = 'business';
  return `${/^[aeiouAEIOU]/.test(p) ? 'an' : 'a'} ${p}`;
};
const NUM = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
/** "three products", "12 products". */
export const count = (n: number, one: string, many = `${one}s`): string => `${n <= 10 ? NUM[n] : n} ${n === 1 ? one : many}`;
/** "once", "twice", "3 times". */
export const times = (n: number): string => (n === 1 ? 'once' : n === 2 ? 'twice' : `${n <= 10 ? NUM[n] : n} times`);
/** A deck or cover line: "Software-as-a-service · Vertical software". */
export const categoryLine = (c: CompanyProfile): string => {
  const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);
  return `${cap((MODEL[c.businessModel] ?? c.businessModel).replace(/ business$/, ''))} · ${cap(sectorPhrase(c.sector))}`;
};

const POSITION: Record<string, string> = {
  commodity: 'a product broadly comparable to the alternatives buyers already use',
  parity: 'a product at parity with its main competitors',
  leader: 'a product the Company assesses as ahead of its main competitors',
  monopolist: 'a product the Company assesses as having no direct competitor',
};
export const positionPhrase = (c: CompanyProfile): string => POSITION[c.product.differentiation] ?? 'a product whose position has not been assessed';

const LEVEL: Record<string, string> = { low: 'low', medium: 'moderate', high: 'high' };
export const level = (x: string): string => LEVEL[x] ?? x;

const ARCH: Record<string, string> = {
  monolith: 'a single application (monolith)', modular_monolith: 'a modular monolith: one deployable application divided into separate components',
  microservices: 'independently deployed services (microservices)', unknown: 'an architecture not yet documented',
};
export const archPhrase = (a: string): string => ARCH[a] ?? a.replace(/_/g, ' ');

const BENCH: Record<string, string> = {
  thin: 'a thin leadership bench below the founders, which an acquirer will want to see strengthened or retained',
  adequate: 'an adequate leadership bench below the founders',
  strong: 'a strong leadership bench below the founders',
};
export const benchPhrase = (b: string): string => BENCH[b] ?? `a leadership bench described as ${b}`;

/** The Rule of 40 (growth + EBITDA margin), stated with its inputs. */
export const rule40 = (c: CompanyProfile): { score: number; text: string } => {
  const score = Math.round((c.growth.arrGrowthYoyPct + c.revenue.ebitdaMarginPct) * 100);
  return { score, text: `${score} (ARR growth ${pct(c.growth.arrGrowthYoyPct)} plus EBITDA margin ${pct(c.revenue.ebitdaMarginPct)})${score >= 40 ? ', above the 40 that buyers of recurring-revenue businesses commonly use as a threshold' : ', below the 40 that buyers of recurring-revenue businesses commonly use as a threshold'}` };
};

/** Profitability stated as it is, never assumed. */
export const profitabilityPhrase = (c: CompanyProfile): string => {
  const m = c.revenue.ebitdaMarginPct;
  return m > 0 ? `EBITDA-positive at a ${pct(m)} margin` : m === 0 ? 'at EBITDA break-even' : `loss-making at EBITDA level (${pct(m)} margin)`;
};

const COUNTRY: Record<string, string> = {
  GB: 'the United Kingdom', UK: 'the United Kingdom', US: 'the United States', IE: 'Ireland', DE: 'Germany', FR: 'France', NL: 'the Netherlands',
  ES: 'Spain', IT: 'Italy', SE: 'Sweden', DK: 'Denmark', NO: 'Norway', FI: 'Finland', CH: 'Switzerland', CA: 'Canada', AU: 'Australia',
  NZ: 'New Zealand', IN: 'India', SG: 'Singapore', AE: 'the United Arab Emirates', BR: 'Brazil', MX: 'Mexico', JP: 'Japan', IL: 'Israel',
};
/** "the United Kingdom" for "GB"; the code itself when unknown. */
export const countryName = (iso: string): string => COUNTRY[iso.toUpperCase()] ?? iso;

/** What each assumable profile field is, for a sentence listing what is still missing. */
export const ASSUMED_LABEL: Record<string, string> = {
  'market.addressableMarketUsd': 'market size', 'market.marketGrowthPct': 'market growth', 'market.competitiveDensity': 'intensity of competition',
  'market.regulatoryRisk': 'regulatory exposure', 'product.differentiation': 'competitive position', 'product.defensibility': 'defensibility',
  'product.technicalArchitecture': 'technical architecture', 'team.headcount': 'headcount', 'team.foundersStillActive': 'founders\' role',
  'team.leadershipBenchStrength': 'leadership team', cap: 'capitalisation table', 'revenue.grossRetentionPct': 'gross retention',
  'growth.customerGrowthYoyPct': 'customer growth', 'cap.fullyDilutedShares': 'fully diluted share count',
};
