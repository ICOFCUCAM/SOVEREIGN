import type {
  MemorandumGenerator, MemorandumKind, MemorandumInputs, MemorandumDocument,
  MemorandumSection, MemorandumTable,
} from './types.js';
import { DEFAULT_PROCESS_TIMELINE, milestone, timelineLines, weeksPhrase, type ProcessTimeline } from '../process/timeline.js';

import { buildCim } from './cim.js';
import { modelPhrase, sectorPhrase, categoryLine, positionPhrase, level, archPhrase, benchPhrase, rule40, profitabilityPhrase, countryName, ASSUMED_LABEL } from './prose.js';

/** Whether a profile field was supplied by the company (not set to a neutral value for the engines). */
import { usableMarketEstimate as usable } from '../story/story.js';
const usableMarketEstimate = (e: Parameters<typeof usable>[0], st: Parameters<typeof usable>[1]): boolean => usable(e, st).ok;
const known = (i: MemorandumInputs, path: string): boolean => !(i.assumed ?? i.company.assumed ?? []).includes(path);

const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;

// Deterministic template generator. No LLM. Produces structurally
// correct memoranda from the engine inputs — narrative is mechanical
// but the document shape matches what counsel and bankers expect.
// Use as the reference and as the fallback when ANTHROPIC_API_KEY
// isn't configured.

const IMPL = 'template-memorandum-generator';
const VERSION = '0.2.0';

function money(n: number, anonymize = false): string {
  if (anonymize) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

// the code name for an anonymised document (the engine's own default only when a caller gives none)
const DEFAULT_CODE_NAME = 'Project Cipher';
/** Words actually in the document: section bodies and bullets, counted, not estimated. */
export function countWords(sections: readonly MemorandumSection[]): number {
  const words = (t: string): number => t.split(/\s+/).filter(Boolean).length;
  return sections.reduce((n, s) => n + words(s.heading) + words(s.body) + (s.bullets ?? []).reduce((b, x) => b + words(x), 0), 0);
}
const timelineOf = (i: MemorandumInputs): ProcessTimeline => i.timeline ?? DEFAULT_PROCESS_TIMELINE;

function anonName(orig: string, anonymize: boolean, codeName?: string): string {
  return anonymize ? (codeName ?? DEFAULT_CODE_NAME) : orig;
}

function financialProfileTable(i: MemorandumInputs): MemorandumTable {
  const r = i.company.revenue;
  return {
    caption: 'Financial profile',
    headers: ['Measure', 'Value'],
    rows: [
      ['Revenue (TTM)', money(r.trailingTwelveMonthsRevenueUsd, !!i.anonymize)],
      ['Annual recurring revenue', money(r.annualRecurringRevenueUsd, !!i.anonymize)],
      ['ARR growth (YoY)', `${(i.company.growth.arrGrowthYoyPct * 100).toFixed(0)}%`],
      ['Gross margin', `${(r.grossMarginPct * 100).toFixed(0)}%`],
      ['EBITDA margin', `${(r.ebitdaMarginPct * 100).toFixed(0)}%`],
      ...(r.netRetentionPct != null ? [['Net revenue retention', `${(r.netRetentionPct * 100).toFixed(0)}%`]] : []),
    ],
  };
}

/** Customer concentration, stated in every named memorandum's financial section: a material risk is disclosed, never left for diligence to find. */
function concentrationSentence(r: { readonly customerConcentrationTop10Pct?: number }): string {
  const c = r.customerConcentrationTop10Pct;
  if (c == null) return ' Customer concentration has not been supplied.';
  return ` The ten largest customers account for ${(c * 100).toFixed(0)}% of revenue${c >= 0.35 ? ' — a concentration buyers will test in diligence' : ''}.`;
}


function investmentHighlights(i: MemorandumInputs): string[] {
  const c = i.company, r = c.revenue, anon = !!i.anonymize;
  // highlights are the strengths the figures support; weaknesses belong in the risks section, stated there
  const out = [
    `Recurring revenue of ${money(r.annualRecurringRevenueUsd, anon)} ARR, ${c.growth.arrGrowthYoyPct >= 0 ? `up ${pct(c.growth.arrGrowthYoyPct)}` : `down ${pct(-c.growth.arrGrowthYoyPct)}`} on the prior year`,
    r.ebitdaMarginPct > 0 ? `${pct(r.grossMarginPct)} gross margin; ${profitabilityPhrase(c)}` : `${pct(r.grossMarginPct)} gross margin`,
    ...(rule40(c).score >= 40 ? [`Rule of 40: ${rule40(c).text}`] : []),
  ];
  if (r.netRetentionPct != null && r.netRetentionPct >= 1) out.push(`Net revenue retention of ${pct(r.netRetentionPct)}: existing customers, taken together, spend more each year than the last`);
  if (r.customerConcentrationTop10Pct != null && r.customerConcentrationTop10Pct < 0.25) out.push(`A diversified customer base: the ten largest customers are ${pct(r.customerConcentrationTop10Pct)} of revenue`);
  const est = (i.story?.market?.estimates ?? []).filter((e) => usableMarketEstimate(e, i.story!)).sort((a, b) => b.valueUsd - a.valueUsd)[0];
  if (est) out.push(`A ${money(est.valueUsd, anon)} market (${est.label}, ${est.period}${est.growthPct != null ? `, growing ${pct(est.growthPct)} a year` : ''}; ${est.meta.provenance === 'estimated' ? 'company estimate' : 'published estimate'})`);
  else if (known(i, 'market.addressableMarketUsd') && known(i, 'market.marketGrowthPct')) out.push(`A ${money(c.market.addressableMarketUsd, anon)} addressable market growing ${pct(c.market.marketGrowthPct)} a year (company estimate)`);
  if (c.product.hasNetworkEffects) out.push('Network effects reported by the Company: the product becomes more useful as more customers use it');
  if (c.product.hasDataMoat) out.push('A proprietary data asset reported by the Company, accumulated through use of the product');
  if (c.product.aiNative) out.push('Machine learning built into the core workflow');
  if (known(i, 'team.foundersStillActive') && c.team.foundersStillActive) out.push('Founders active in the business and available through a transition');
  return out;
}

/** The standard notice on a confidential memorandum: what it is and is not. */
function importantNotice(name: string): MemorandumSection {
  return {
    heading: 'Important notice',
    body: `This memorandum has been prepared from information supplied by ${name} (the "Company") to help recipients decide whether to pursue a transaction. It is provided under the confidentiality agreement the recipient has signed and must not be copied or passed on except as that agreement allows. The information has not been audited or independently verified. Any forecasts are the Company's own estimates and depend on the assumptions stated with them. The memorandum does not state a price; if the shareholders give guidance on value, it is given separately, in writing, as part of the process. Nothing in it is an offer, a recommendation or legal, tax or accounting advice; any transaction will be governed only by a definitive agreement. Recipients should make their own investigation and take their own advice.`,
  };
}

/** Where every figure came from and what was assumed. */

function customersSection(i: MemorandumInputs, name: string, heading: string): MemorandumSection {
  const c = i.company, r = c.revenue, u = c.users, anon = !!i.anonymize;
  const perCustomer = u.totalCustomers > 0 ? r.annualRecurringRevenueUsd / u.totalCustomers : 0;
  const lines: string[] = [];
  lines.push(anon ? 'Customer count: disclosed under NDA' : `${u.totalCustomers.toLocaleString('en-US')} customers, averaging ${money(perCustomer)} of ARR each`);
  if (r.netRetentionPct != null) lines.push(`Net revenue retention: ${pct(r.netRetentionPct)}`);
  if (r.grossRetentionPct != null && known(i, 'revenue.grossRetentionPct')) lines.push(`Gross revenue retention: ${pct(r.grossRetentionPct)}`);
  if (u.churnAnnualizedPct != null) lines.push(`Annualised customer churn: ${pct(u.churnAnnualizedPct)}`);
  if (r.customerConcentrationTop10Pct == null) lines.push('Customer concentration: not yet supplied');
  return {
    heading,
    body: `Revenue quality is what an acquirer tests first: how much of it recurs, how it moves within the existing base, and how much depends on a few customers.${concentrationSentence(r)}${r.netRetentionPct == null ? ' Retention has not been supplied; buyers will ask for cohort data.' : ''}`,
    bullets: lines,
  };
}


function risksSection(i: MemorandumInputs, heading: string): MemorandumSection {
  const flags = i.diligence?.redFlags ?? [];
  const questions = i.diligence?.criticalQuestions ?? [];
  const c = i.company;
  const own: string[] = [];
  if (known(i, 'market.regulatoryRisk') && c.market.regulatoryRisk === 'high') own.push('Regulatory exposure is assessed as high; buyers will review licensing and compliance in detail');
  if (known(i, 'market.competitiveDensity') && c.market.competitiveDensity === 'high') own.push('The market is crowded; buyers will test how the product is differentiated and how customers are won');
  if (known(i, 'team.foundersStillActive') && !c.team.foundersStillActive) own.push('The founders are no longer active; continuity of leadership will be examined');
  if (known(i, 'team.leadershipBenchStrength') && c.team.leadershipBenchStrength === 'thin') own.push('Leadership depth below the founders is thin; retention and succession will be examined');
  if (c.revenue.ebitdaMarginPct < 0) own.push('The business is loss-making at EBITDA level; buyers will model the path to profitability');
  if (c.revenue.netRetentionPct != null && c.revenue.netRetentionPct < 1) own.push(`Net revenue retention is ${(c.revenue.netRetentionPct * 100).toFixed(0)}%: revenue from existing customers shrinks without new sales, and buyers will ask for cohort data`);
  if (rule40(c).score < 40) own.push(`The Rule of 40 score is ${rule40(c).text}`);
  const missing = (i.assumed ?? []).filter((a) => ['cap', 'team.headcount', 'market.addressableMarketUsd', 'team.leadershipBenchStrength'].includes(a));
  if (missing.length) own.push(`Information not yet supplied (${missing.map((a) => ASSUMED_LABEL[a] ?? a).join(', ')}); buyers will ask for it early`);
  const items = [...flags, ...own].slice(0, 8);
  return {
    heading,
    body: 'The matters a buyer\'s diligence is likely to focus on, stated here so they are addressed early rather than discovered late. They come from rule-based checks on the Company\'s own figures, not from a review of its documents.',
    bullets: items.length ? items : ['No matter rose to a red flag in the rule-based checks; buyers will still test the figures above against the accounts'],
    ...(questions.length ? { tables: [{ caption: 'Questions to prepare for', headers: ['#', 'Question'], rows: questions.slice(0, 8).map((q, n) => [String(n + 1), q]) }] } : {}),
  };
}

/** The market, stated only from what the company supplied. */
function marketParagraph(i: MemorandumInputs, name: string): string {
  const c = i.company, anon = !!i.anonymize, parts: string[] = [];
  const est = (i.story?.market?.estimates ?? []).filter((e) => usableMarketEstimate(e, i.story!)).sort((a, b) => b.valueUsd - a.valueUsd)[0];
  if (est) parts.push(`The ${est.label} market is estimated at ${money(est.valueUsd, anon)} (${est.geography}, ${est.period}; ${est.meta.provenance === 'estimated' ? `the Company's estimate: ${est.methodology}` : 'a published estimate, cited in the CIM'}).`);
  else if (known(i, 'market.addressableMarketUsd')) parts.push(`The Company estimates its addressable market at ${money(c.market.addressableMarketUsd, anon)}${known(i, 'market.marketGrowthPct') ? `, growing ${pct(c.market.marketGrowthPct)} a year` : ''}${c.market.serviceableMarketUsd ? `, of which ${money(c.market.serviceableMarketUsd, anon)} is serviceable with its current product` : ''}.`);
  const comps = i.story?.market?.competitors ?? [];
  if (comps.length) parts.push(`Its main competitors are ${comps.slice(0, 4).map((x) => x.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`);
  if (known(i, 'market.competitiveDensity') && known(i, 'market.regulatoryRisk')) parts.push(`Competition is ${level(c.market.competitiveDensity)} and regulatory exposure ${level(c.market.regulatoryRisk)}.`);
  if (known(i, 'product.differentiation')) parts.push(`${name} competes with ${positionPhrase(c)}${known(i, 'product.defensibility') ? `, and its defensibility is assessed as ${level(c.product.defensibility)}` : ''}.`);
  return parts.length ? parts.join(' ') : `${name} has not yet supplied its market size, growth or competitive position. Buyers will expect an estimate of the addressable market with its source, and a view of the main competitors and how ${name} wins against them.`;
}

/** The team, stated only from what the company supplied. */
function managementSentence(i: MemorandumInputs, name: string): string {
  const t = i.company.team, anon = !!i.anonymize, parts: string[] = [];
  if (known(i, 'team.headcount')) parts.push(`${name} employs ${anon ? 'a team disclosed under NDA' : `${t.headcount} people`}${t.engineeringHeadcount && !anon ? `, ${t.engineeringHeadcount} of them in engineering` : ''}${t.tenureMedianYears ? `, with a median tenure of ${t.tenureMedianYears} years` : ''}.`);
  if (known(i, 'team.foundersStillActive')) parts.push(`The founders ${t.foundersStillActive ? 'remain active in the business' : 'are no longer active in the business'}${known(i, 'team.leadershipBenchStrength') ? `, with ${benchPhrase(t.leadershipBenchStrength)}` : ''}.`);
  return parts.length ? parts.join(' ') : `${name} has not yet supplied its headcount or management team; buyers will ask for an organisation chart and the leadership team's backgrounds.`;
}

function executiveSummary(i: MemorandumInputs): MemorandumDocument {
  const name = anonName(i.company.name, !!i.anonymize, i.codeName);
  const c = i.company, anon = !!i.anonymize;
  const sections: MemorandumSection[] = [
    {
      heading: 'The opportunity',
      body: `${name} is ${modelPhrase(c.businessModel, c.sector)} in ${sectorPhrase(c.sector)}${anon ? '' : `, headquartered in ${countryName(c.jurisdiction)}`} and founded in ${c.foundedYear}. ${c.narrative ?? (known(i, 'product.differentiation') ? `It competes with ${positionPhrase(c)}.` : `It has ${money(c.revenue.annualRecurringRevenueUsd, anon)} of recurring revenue growing ${pct(c.growth.arrGrowthYoyPct)} a year.`)} Its shareholders are inviting a small group of qualified strategic and financial acquirers to consider a purchase through a structured, confidential process.`,
    },
    {
      heading: 'Financial profile',
      body: `${name} reports ${money(c.revenue.trailingTwelveMonthsRevenueUsd, anon)} in trailing twelve-month revenue, with ${money(c.revenue.annualRecurringRevenueUsd, anon)} of annual recurring revenue growing ${pct(c.growth.arrGrowthYoyPct)} year over year. It is ${profitabilityPhrase(c)}, with a Rule of 40 score of ${rule40(c).score}.${concentrationSentence(c.revenue)}`,
      tables: [financialProfileTable(i)],
    },
    {
      heading: 'Investment highlights',
      body: 'The points an acquirer is likely to weigh most, each drawn from the figures above or attributed to the Company:',
      bullets: investmentHighlights(i),
    },
    {
      heading: 'Market position',
      body: `${marketParagraph(i, name)} ${anon ? 'Its customer base is described under NDA.' : `It serves ${c.users.totalCustomers.toLocaleString('en-US')} customers${c.users.activeMonthly ? ` and ${c.users.activeMonthly.toLocaleString('en-US')} monthly active users` : ''}.`}`,
    },
    {
      heading: 'Key considerations',
      body: 'Matters buyers are likely to examine closely, raised now so they can be prepared for:',
      bullets: [...(risksSection(i, '').bullets ?? [])].slice(0, 4),
    },
    {
      heading: 'Process & timeline',
      body: `Outreach is to qualified counterparties on a strictly confidential basis. Interested parties sign a mutual NDA, receive the confidential information memorandum and staged data-room access, and attend a management presentation in ${weeksPhrase(milestone(timelineOf(i), 'management_presentations'))} of the process. Indications of interest are due in ${weeksPhrase(milestone(timelineOf(i), 'ioi'))}, with a signed letter of intent targeted in ${weeksPhrase(milestone(timelineOf(i), 'loi'))}. These dates are a planning assumption.`,
    },
    {
      heading: 'Basis',
      body: `Prepared from information supplied by the Company, unaudited, in US dollars. Market figures are company estimates. This summary is not an offer; any transaction is governed only by a definitive agreement.`,
    },
  ];
  const wordCount = countWords(sections);
  return { kind: 'executive_summary', title: `${name} — Executive Summary`, sections, anonymized: !!i.anonymize, wordCount, producedBy: `${IMPL}@${VERSION}` };
}

function investorDeck(i: MemorandumInputs): MemorandumDocument {
  const name = anonName(i.company.name, !!i.anonymize, i.codeName);
  const c = i.company, r = c.revenue, anon = !!i.anonymize;
  const slide = (heading: string, body: string, bullets?: string[]): MemorandumSection =>
    ({ heading, body, ...(bullets ? { bullets } : {}) });

  const sections: MemorandumSection[] = [
    slide('Slide 1 · Title', `${name} — Acquisition opportunity`, [categoryLine(c), `Founded ${c.foundedYear}`, 'Strictly confidential']),
    slide('Slide 2 · The opportunity', `${modelPhrase(c.businessModel, c.sector).replace(/^a/, 'A')} in ${sectorPhrase(c.sector)}${known(i, 'product.differentiation') ? `, competing with ${positionPhrase(c)}` : ''}.`, [
      ...(known(i, 'market.addressableMarketUsd') ? [`Addressable market ${money(c.market.addressableMarketUsd, anon)}${known(i, 'market.marketGrowthPct') ? `, growing ${pct(c.market.marketGrowthPct)} a year` : ''} (see the CIM for its source)`] : ['Market size: to be supplied by the Company']),
      ...(known(i, 'market.competitiveDensity') ? [`Competition ${level(c.market.competitiveDensity)}; regulatory exposure ${level(c.market.regulatoryRisk)}`] : []),
      `${money(c.revenue.annualRecurringRevenueUsd, anon)} ARR growing ${pct(c.growth.arrGrowthYoyPct)} a year`,
    ]),
    slide('Slide 3 · Traction', `${money(r.annualRecurringRevenueUsd, anon)} ARR · ${pct(c.growth.arrGrowthYoyPct)} YoY growth.`, [
      `${anon ? '—' : c.users.totalCustomers.toLocaleString('en-US')} customers`,
      `${pct(r.grossMarginPct)} gross margin`,
      ...(r.netRetentionPct ? [`${pct(r.netRetentionPct)} net retention`] : []),
      ...(r.customerConcentrationTop10Pct != null ? [`Top ten customers ${pct(r.customerConcentrationTop10Pct)} of revenue`] : []),
    ]),
    slide('Slide 4 · Product', known(i, 'product.technicalArchitecture') ? `Built as ${archPhrase(c.product.technicalArchitecture)}.` : 'Product and technology overview to be supplied by the Company.', [
      ...(c.product.hasNetworkEffects ? ['Network effects (company-reported)'] : []),
      ...(c.product.hasDataMoat ? ['Proprietary data asset (company-reported)'] : []),
      ...(c.product.aiNative ? ['Machine learning in the core workflow'] : []),
      'Technical documentation available for diligence',
    ]),
    slide('Slide 5 · Customers', `Revenue quality: what recurs, how it grows inside the base, and how concentrated it is.`, [...(customersSection(i, name, '').bullets ?? [])]),
    slide('Slide 6 · Financials', `${money(r.trailingTwelveMonthsRevenueUsd, anon)} TTM revenue; ${profitabilityPhrase(c)}.`, [`Rule of 40: ${rule40(c).score}`, `Gross margin ${pct(r.grossMarginPct)}`]),
    slide('Slide 7 · Team', managementSentence(i, name), ['Management presentations to engaged buyers in the process']),
    slide('Slide 8 · Investment highlights', `Why ${name} is worth a closer look.`, investmentHighlights(i).slice(0, 5)),
    slide('Slide 9 · Process', `A targeted, confidential process. Indications due ${weeksPhrase(milestone(timelineOf(i), 'ioi'))}; LOI targeted ${weeksPhrase(milestone(timelineOf(i), 'loi'))} (planning assumption).`, [
      `NDA and CIM: ${weeksPhrase(milestone(timelineOf(i), 'nda'))}`,
      `Management presentations: ${weeksPhrase(milestone(timelineOf(i), 'management_presentations'))}`,
      `Signing: ${weeksPhrase(milestone(timelineOf(i), 'signing'))}`,
    ]),
    slide('Slide 10 · Contact', 'All enquiries through the process coordinator. Please do not contact the Company, its staff or its customers directly.'),
  ];
  return { kind: 'investor_deck', title: `${name} — Investor deck`, sections, anonymized: !!i.anonymize, wordCount: countWords(sections), producedBy: `${IMPL}@${VERSION}` };
}

function buyerTeaser(i: MemorandumInputs): MemorandumDocument {
  const projectName = i.codeName ?? DEFAULT_CODE_NAME;
  const c = i.company;
  const sections: MemorandumSection[] = [
    {
      heading: 'The opportunity',
      body: `${projectName} is ${modelPhrase(c.businessModel, c.sector)} in ${sectorPhrase(c.sector)}. It has built a recurring-revenue business growing ${pct(c.growth.arrGrowthYoyPct)} year over year, and its shareholders are inviting a small group of qualified acquirers to consider a purchase through a structured, confidential process. The Company's identity and detailed financials are disclosed once a mutual NDA is signed.`,
    },
    {
      heading: 'Selected metrics',
      body: 'Headline operating profile (absolute figures disclosed under NDA):',
      bullets: [
        `Revenue growth: ${pct(c.growth.arrGrowthYoyPct)} year over year, recurring-revenue led`,
        `Gross margin: ${pct(c.revenue.grossMarginPct)}`,
        `EBITDA margin: ${pct(c.revenue.ebitdaMarginPct)}`,
        ...(c.revenue.netRetentionPct != null ? [`Net revenue retention: ${pct(c.revenue.netRetentionPct)}`] : []),
        `Rule of 40: ${rule40(c).score}`,
        ...(known(i, 'market.marketGrowthPct') ? [`Market: growing ${pct(c.market.marketGrowthPct)} a year (company estimate)${known(i, 'market.competitiveDensity') ? `; ${level(c.market.competitiveDensity)} competition` : ''}`] : []),
      ],
    },
    {
      heading: 'Why this asset',
      body: `${known(i, 'product.differentiation') ? `${projectName} competes with ${positionPhrase(c)}.` : `${projectName} combines recurring revenue with ${pct(c.revenue.grossMarginPct)} gross margins.`}${c.product.hasNetworkEffects || c.product.hasDataMoat ? ` The Company reports ${[c.product.hasNetworkEffects ? 'network effects' : '', c.product.hasDataMoat ? 'a proprietary data asset built up through use' : ''].filter(Boolean).join(' and ')}.` : ''} ${c.revenue.netRetentionPct != null && c.revenue.netRetentionPct >= 1 ? 'Existing customers spend more each year, so growth does not rely on new customers alone.' : ''}`.trim(),
      bullets: [
        `${pct(c.revenue.grossMarginPct)} gross margin; ${profitabilityPhrase(c)}`,
        ...(c.product.aiNative ? ['Machine learning built into the core workflow'] : []),
        ...(known(i, 'team.foundersStillActive') && c.team.foundersStillActive ? ['Founders active and available through a transition'] : []),
      ],
    },
    {
      heading: 'Process & next steps',
      body: `Interested parties should request the mutual NDA. Once it is signed they receive the confidential information memorandum and staged data-room access, and are offered a management presentation in ${weeksPhrase(milestone(timelineOf(i), 'management_presentations'))} of the process. Indications of interest are due in ${weeksPhrase(milestone(timelineOf(i), 'ioi'))} (planning assumption).`,
    },
    {
      heading: 'Confidentiality',
      body: `This overview identifies the Company by code name only. Please do not attempt to identify or contact the Company, its staff or its customers; all enquiries go through the process coordinator. The figures are supplied by the Company, unaudited, and this overview is not an offer.`,
    },
  ];
  const wordCount = countWords(sections);
  return { kind: 'buyer_teaser', title: `${projectName} — Confidential opportunity overview`, sections, anonymized: true, wordCount, producedBy: `${IMPL}@${VERSION}` };
}

function ddRoomIndex(i: MemorandumInputs): MemorandumDocument {
  const name = anonName(i.company.name, !!i.anonymize, i.codeName);
  const docs = i.diligence?.documents ?? [];
  const required = docs.reduce((k, d) => k + d.artifacts.filter((a) => a.required).length, 0);
  const total = docs.reduce((k, d) => k + d.artifacts.length, 0);
  const sections: MemorandumSection[] = docs.length
    ? [
        {
          heading: 'About this index',
          body: `The data room for ${name} is organised into ${docs.length} packages holding ${total} documents, ${required} of which buyers will treat as required. ★ marks a required document and ◇ an optional one. Access is staged: summary materials after the NDA, detailed and commercially sensitive materials to shortlisted parties after a letter of intent. Each document is listed once, under the package a buyer's adviser will look for it in.`,
        },
        ...docs.map((doc) => ({
          heading: doc.title,
          body: `Covers ${doc.sections.map((x) => x.heading.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' and $1')}. Access level: ${doc.classification.replace(/_/g, ' ')}; ${doc.artifacts.filter((a) => a.required).length} of its ${doc.artifacts.length} documents are required.`,
          bullets: doc.artifacts.map((a) => `${a.required ? '★' : '◇'} ${a.filename} — ${a.description}`),
        })),
        {
          heading: 'Using the data room',
          body: 'Questions go through the process coordinator as written requests and are answered in the Q&A log, which all bidders at the same stage can see. Downloads and views are logged. Documents added after the room opens are announced to every party with access.',
        },
      ]
    : [{ heading: 'Diligence package not generated', body: 'Run the due-diligence engine to populate this index.' }];
  return { kind: 'dd_room_index', title: `${name} — Data room index`, sections, anonymized: !!i.anonymize, wordCount: countWords(sections), producedBy: `${IMPL}@${VERSION}` };
}

export class TemplateMemorandumGenerator implements MemorandumGenerator {
  readonly implementation = IMPL;
  readonly version = VERSION;

  async generate(kind: MemorandumKind, inputs: MemorandumInputs): Promise<MemorandumDocument> {
    switch (kind) {
      case 'cim':                return buildCim(inputs);
      case 'executive_summary':  return executiveSummary(inputs);
      case 'investor_deck':      return investorDeck(inputs);
      case 'buyer_teaser':       return buyerTeaser(inputs);
      case 'dd_room_index':      return ddRoomIndex(inputs);
    }
  }
}

/** Shared with cim.ts (internal). */
export const cimHelpers = { money, anonName, investmentHighlights, concentrationSentence, risksSection, importantNotice, timelineOf, countWords, IMPL, VERSION };
