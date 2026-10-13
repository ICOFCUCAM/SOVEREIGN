import type { MemorandumInputs, MemorandumDocument, MemorandumSection, MemorandumTable, SectionCoverage } from './types.js';
import { PROVENANCE_LABEL, cleanStory, effectiveProvenance, usableMarketEstimate, usableForecast, type CompanyStory, type FactMeta } from '../story/story.js';
import { timelineLines } from '../process/timeline.js';
import { modelPhrase, sectorPhrase, countryName, rule40, profitabilityPhrase, archPhrase, ASSUMED_LABEL, count, times } from './prose.js';
import { cimHelpers as h } from './template.js';

// ── THE CONFIDENTIAL INFORMATION MEMORANDUM ─────────────────────────
// A buyer-facing memorandum built only from what the company has supplied.
// Its structure is the one a buyer's adviser expects; each section is written
// from the company story and the headline figures, or — where the information
// is not yet supplied — states the gap, why a buyer needs it, and what would
// complete it. Every material figure is listed with its provenance in the
// source notes. It states no valuation, price guidance or seller intelligence.

const pct = (x: number): string => `${(x * 100).toFixed(0)}%`;
const usd = (n: number): string => h.money(n);
const sentence = (t: string): string => t.trim().replace(/\.?$/, '.');

/** A gap statement: what is missing, why it matters, what completes it. */
const gap = (what: string, why: string, need: string): string => `Not yet supplied: ${what}. ${why} To complete this section the Company needs to provide ${need}.`;

/** "supplied by the Company" / "FY2025 statutory accounts (31 Mar 2026)" / "estimate: <method>" */
function basisOf(m: FactMeta | undefined, story: CompanyStory): string {
  const p = effectiveProvenance(m, story);
  if ((p.provenance === 'source' || p.provenance === 'verified') && m?.sourceId) {
    const d = story.sources.find((s) => s.id === m.sourceId);
    if (d) return `${p.provenance === 'verified' ? 'verified; ' : ''}${d.title} (${d.date})`;
  }
  if (p.provenance === 'estimated' && m?.method) return `estimate: ${m.method}`;
  return PROVENANCE_LABEL[p.provenance];
}

interface Built { section: MemorandumSection; coverage: SectionCoverage }

export function buildCim(i: MemorandumInputs): MemorandumDocument {
  const c = i.company, r = c.revenue, s: CompanyStory = cleanStory(i.story ?? { version: 1, updatedAt: '', sources: [] });
  const name = h.anonName(c.name, !!i.anonymize, i.codeName);
  const known = (path: string): boolean => !(i.assumed ?? c.assumed ?? []).includes(path);
  const head = (field: string): FactMeta | undefined => s.headline?.[field];
  let k = 0;
  const n = (): string => `${++k}.`;
  const out: Built[] = [];
  const add = (heading: string, body: string, status: SectionCoverage['status'], extra: Partial<MemorandumSection> = {}, missing: string[] = []): void => {
    out.push({ section: { heading, body, ...extra }, coverage: { section: heading.replace(/^\d+\.\s*/, ''), status, missing } });
  };

  const prods = s.products ?? [];
  // 1 · Executive summary and investment highlights
  add(`${n()} Executive summary and investment highlights`,
    `${name} is ${modelPhrase(c.businessModel, c.sector)} in ${sectorPhrase(c.sector)}, founded in ${c.foundedYear} and headquartered in ${countryName(c.jurisdiction)}. It has ${usd(r.annualRecurringRevenueUsd)} of annual recurring revenue, growing ${pct(c.growth.arrGrowthYoyPct)} year over year, and ${usd(r.trailingTwelveMonthsRevenueUsd)} of revenue over the last twelve months; it is ${profitabilityPhrase(c)}.${prods.length ? ` Its ${prods.length === 1 ? 'product is' : 'products are'} ${prods.map((p) => p.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}.` : ''} Its shareholders are inviting a small number of qualified acquirers to consider a purchase of the Company through a structured, confidential process.`,
    'supported', { bullets: h.investmentHighlights(i) });

  // 2 · History
  const hist = s.history;
  if (hist && (hist.origin || hist.milestones.length)) {
    add(`${n()} Company history and overview`,
      `${hist.origin ? sentence(hist.origin) : `${name} was founded in ${c.foundedYear}.`}${hist.ownershipChanges.length ? ` Ownership has changed ${times(hist.ownershipChanges.length)} since founding, as set out below.` : ''}`,
      hist.milestones.length && hist.origin ? 'supported' : 'partial',
      {
        ...(hist.milestones.length ? { bullets: [...hist.milestones].sort((a, b) => a.year - b.year).map((m) => `${m.year} — ${m.event}`) } : {}),
        ...(hist.ownershipChanges.length ? { tables: [{ caption: 'Ownership changes', headers: ['Date', 'Change'], rows: hist.ownershipChanges.map((o) => [o.date, o.description]) }] } : {}),
      }, [...(!hist.origin ? ['how the company started'] : []), ...(!hist.milestones.length ? ['milestones'] : [])]);
  } else add(`${n()} Company history and overview`, `${name} was founded in ${c.foundedYear}. ${gap('the company\'s history, major milestones and any changes of ownership', 'Buyers read the history to understand how the business was built, what has been tested, and who has owned it.', 'a short account of how the company started, its main milestones by year, and any investment rounds, secondary sales or changes of control')}`, 'gap', {}, ['history']);

  // 3 · Products and services
  if (prods.length) add(`${n()} Products and services`,
    `${name} offers ${count(prods.length, 'product')}: ${prods.map((p) => p.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}.`,
    prods.every((p) => p.pricingModel && p.differentiators) ? 'supported' : 'partial',
    { bullets: prods.map((p) => [`${p.name}: ${sentence(p.description)}`, p.useCases ? ` Used for: ${sentence(p.useCases)}` : '', p.pricingModel ? ` Pricing: ${sentence(p.pricingModel)}` : '', p.differentiators ? ` Differentiation (as described by the Company): ${sentence(p.differentiators)}` : '', p.roadmap ? ` Roadmap: ${sentence(p.roadmap)}` : ''].join('')) },
    [...(prods.some((p) => !p.pricingModel) ? ['pricing for every product'] : []), ...(prods.some((p) => !p.differentiators) ? ['differentiation for every product'] : [])]);
  else add(`${n()} Products and services`, gap('a description of the products and services', 'A buyer needs to understand each product it would acquire: its purpose, its users, its price and how it differs from alternatives.', 'each product\'s description, use cases, pricing model, share of revenue and differentiators'), 'gap', {}, ['products']);

  // 4 · Business model and revenue composition
  const streams = s.businessModel?.revenueStreams ?? [];
  const withShare = prods.filter((p) => p.revenueSharePct != null);
  if (streams.length || withShare.length) {
    const recurring = streams.filter((x) => x.recurring).reduce((t, x) => t + x.sharePct, 0);
    add(`${n()} Business model and revenue composition`,
      `${streams.length ? `Revenue comes from ${count(streams.length, 'stream')}, of which ${pct(recurring)} is recurring.` : 'Revenue by product is shown below.'}${s.businessModel?.pricingNotes ? ` ${sentence(s.businessModel.pricingNotes)}` : ''}`,
      'supported', { tables: [
        ...(streams.length ? [{ caption: 'Revenue by stream', headers: ['Stream', 'Share of revenue', 'Recurring', 'Basis'], rows: streams.map((x) => [x.name, pct(x.sharePct), x.recurring ? 'Yes' : 'No', basisOf(x.meta, s)]) }] : []),
        ...(withShare.length ? [{ caption: 'Revenue by product', headers: ['Product', 'Share of revenue', 'Basis'], rows: withShare.map((p) => [p.name, pct(p.revenueSharePct!), basisOf(p.revenueShareMeta, s)]) }] : []),
      ] });
  } else add(`${n()} Business model and revenue composition`, `${usd(r.annualRecurringRevenueUsd)} of the Company's ${usd(r.trailingTwelveMonthsRevenueUsd)} trailing revenue is annual recurring revenue. ${gap('the split of revenue by stream and by product', 'The mix of recurring and one-off revenue, and how dependent revenue is on one product, shapes how a buyer values it.', 'each revenue stream with its share of revenue and whether it recurs')}`, 'partial', {}, ['revenue composition']);

  // 5 · Market and competition
  const est = (s.market?.estimates ?? []).filter((e) => usableMarketEstimate(e, s).ok);
  const rejected = (s.market?.estimates ?? []).filter((e) => !usableMarketEstimate(e, s).ok);
  const comps = s.market?.competitors ?? [];
  const mParts: string[] = [];
  if (s.market?.targetMarkets) mParts.push(sentence(`${name} serves ${s.market.targetMarkets}`));
  if (s.market?.geographies.length) mParts.push(`It sells in ${s.market.geographies.join(', ').replace(/, ([^,]*)$/, ' and $1')}.`);
  if (est.length) mParts.push(`Market-size estimates are set out below; their sources and methods are in the notes.`);
  else mParts.push(gap('a sourced estimate of the market size', `A market figure is only useful to a buyer with its source, geography, period and method${rejected.length ? `; ${rejected.length === 1 ? 'the estimate supplied lacks' : 'the estimates supplied lack'} these and ${rejected.length === 1 ? 'is' : 'are'} not stated` : ''}.`, 'an estimate with its geography, period, methodology and either a published source or a documented calculation'));
  if (!comps.length) mParts.push(gap('named competitors', 'Buyers compare the Company with the alternatives its customers consider.', 'the main competitors and how the Company wins against them'));
  add(`${n()} Market, industry and competitive positioning`, mParts.join(' '), est.length && comps.length ? 'supported' : est.length || comps.length || s.market?.targetMarkets ? 'partial' : 'gap', {
    ...(est.length ? { bullets: est.map((e, k) => `Note ${k + 1} — ${basisOf(e.meta, s)}. Method: ${sentence(e.methodology)}`) } : {}),
    tables: [
    ...(est.length ? [{ caption: 'Market-size estimates', headers: ['Market', 'Size', 'Geography', 'Period', 'Source'], rows: est.map((e, k) => [e.label, usd(e.valueUsd), e.geography, e.period, `Note ${k + 1}`]) }] : []),
    ...(comps.length ? [{ caption: 'Competitors (as described by the Company)', headers: ['Competitor', 'Positioning', 'How the Company differs'], rows: comps.map((x) => [x.name, x.description ?? '—', x.differentiation ?? '—']) }] : []),
  ] }, [...(!est.length ? ['sourced market size'] : []), ...(!comps.length ? ['competitors'] : [])]);

  // 6 · Customers
  const cu = s.customers;
  const cuBullets = [
    `${c.users.totalCustomers.toLocaleString('en-US')} customers, averaging ${usd(r.annualRecurringRevenueUsd / Math.max(1, c.users.totalCustomers))} of ARR each (calculated)`,
    ...(r.netRetentionPct != null ? [`Net revenue retention: ${pct(r.netRetentionPct)} (${basisOf(head('netRetentionPct'), s)})`] : []),
    ...(cu?.grossRetentionPct != null ? [`Gross revenue retention: ${pct(cu.grossRetentionPct)} (${basisOf(cu.grossRetentionMeta, s)})`] : []),
    ...(cu?.logoChurnPct != null ? [`Annual customer churn: ${pct(cu.logoChurnPct)} (${basisOf(cu.logoChurnMeta, s)})`] : []),
    ...(cu?.contractTerms ? [`Contracts: ${sentence(cu.contractTerms)}`] : []),
  ];
  const approved = (cu?.caseStudies ?? []).filter((x) => x.approvedForUse);
  add(`${n()} Customers, concentration and retention`,
    `${h.concentrationSentence(r).trim()}${cu?.segments.length ? ` The Company serves ${count(cu.segments.length, 'customer segment')}, shown below.` : ''}${!cu?.segments.length || (cu?.grossRetentionPct == null && cu?.logoChurnPct == null) ? ` ${gap([!cu?.segments.length ? 'customer segments' : '', cu?.grossRetentionPct == null && cu?.logoChurnPct == null ? 'gross retention or churn' : ''].filter(Boolean).join(' and '), 'Buyers test how revenue moves within the existing base and how exposed it is to losing customers.', 'segment shares of revenue and gross retention or churn, with the period they cover')}` : ''}`,
    cu?.segments.length && (cu.grossRetentionPct != null || cu.logoChurnPct != null) ? 'supported' : 'partial',
    { bullets: [...cuBullets, ...(cu?.profiles ?? []).map((p) => `${p.label}${p.segment && !p.label.toLowerCase().includes((p.segment.toLowerCase().replace(/s$/, '').split(' ')[0] ?? '')) ? ` (${p.segment})` : ''}${p.since ? `, a customer since ${p.since}` : ''}: ${sentence(p.description)}`), ...approved.map((x) => `Case study — ${x.title}: ${sentence(x.summary)}${x.outcome ? ` Outcome: ${sentence(x.outcome)}` : ''}`)],
      ...(cu?.segments.length ? { tables: [cu.segments.some((x) => x.description)
        ? { caption: 'Customer segments', headers: ['Segment', 'Share of revenue', 'Description', 'Basis'], rows: cu.segments.map((x) => [x.name, x.sharePct != null ? pct(x.sharePct) : '—', x.description ?? '—', basisOf(x.meta, s)]) }
        : { caption: 'Customer segments', headers: ['Segment', 'Share of revenue', 'Basis'], rows: cu.segments.map((x) => [x.name, x.sharePct != null ? pct(x.sharePct) : '—', basisOf(x.meta, s)]) }] } : {}) },
    [...(!cu?.segments.length ? ['segments'] : []), ...(cu?.grossRetentionPct == null && cu?.logoChurnPct == null ? ['retention'] : [])]);

  // 7 · Sales and marketing
  const sm = s.salesMarketing;
  if (sm && (sm.channels || sm.team || sm.salesCycle || sm.partners)) add(`${n()} Sales, marketing and distribution`,
    [sm.channels ? `Channels: ${sentence(sm.channels)}` : '', sm.team ? `Sales organisation: ${sentence(sm.team)}` : '', sm.salesCycle ? `Sales cycle: ${sentence(sm.salesCycle)}` : '', sm.partners ? `Partners: ${sentence(sm.partners)}` : ''].filter(Boolean).join(' '),
    sm.channels && (sm.team || sm.salesCycle) ? 'supported' : 'partial');
  else add(`${n()} Sales, marketing and distribution`, gap('how the Company finds and wins customers', 'A buyer assesses whether growth can continue under new ownership and what its own channels could add.', 'its channels to market, the team that sells, the typical length of a sale and any partners'), 'gap', {}, ['sales and marketing']);

  // 8 · Financial performance
  const annual = [...(s.financials?.annual ?? [])].sort((a, b) => a.period.localeCompare(b.period));
  const forecasts = (s.financials?.forecasts ?? []).filter(usableForecast);
  const headRows: string[][] = [
    ['Revenue (TTM)', usd(r.trailingTwelveMonthsRevenueUsd), basisOf(head('ttmRevenueUsd'), s)],
    ['Annual recurring revenue', usd(r.annualRecurringRevenueUsd), basisOf(head('arrUsd'), s)],
    ['ARR growth (YoY)', pct(c.growth.arrGrowthYoyPct), basisOf(head('growthPct'), s)],
    ['Gross margin', pct(r.grossMarginPct), basisOf(head('grossMarginPct'), s)],
    ['EBITDA margin', pct(r.ebitdaMarginPct), basisOf(head('ebitdaMarginPct'), s)],
    ...(r.netRetentionPct != null ? [['Net revenue retention', pct(r.netRetentionPct), basisOf(head('netRetentionPct'), s)]] : []),
  ];
  add(`${n()} Historical financial performance and forecasts`,
    `${name} reports ${usd(r.trailingTwelveMonthsRevenueUsd)} of trailing twelve-month revenue at a ${pct(r.grossMarginPct)} gross margin and a ${pct(r.ebitdaMarginPct)} EBITDA margin. Its Rule of 40 score is ${rule40(c).text}.${annual.length ? ` Reported annual figures are set out below${s.financials?.definitions ? `; ${s.financials.definitions.replace(/\.$/, '')}` : ''}.` : ` ${gap('annual financial history', 'Buyers need several years of reported figures to judge the trend and its quality; this memorandum shows no prior period it was not given.', 'revenue, gross margin and EBITDA for each of the last two to three financial years, with the source document for each')}`}${forecasts.length ? ' The Company\'s forecasts, with the basis it gives for each, follow; they are the Company\'s estimates, not commitments.' : ''}`,
    annual.length >= 2 ? 'supported' : annual.length ? 'partial' : 'partial',
    { tables: [
      { caption: 'Financial profile (current)', headers: ['Measure', 'Value', 'Basis'], rows: headRows },
      ...(annual.length ? [{ caption: 'Reported annual financials', headers: ['Period', 'Revenue', 'ARR', 'Gross margin', 'EBITDA', 'Basis'], rows: annual.map((a) => [a.period, a.revenueUsd != null ? usd(a.revenueUsd) : '—', a.arrUsd != null ? usd(a.arrUsd) : '—', a.grossMarginPct != null ? pct(a.grossMarginPct) : '—', a.ebitdaUsd != null ? usd(a.ebitdaUsd) : '—', basisOf(a.meta, s)]) }] : []),
      ...(forecasts.length ? [{ caption: 'Company forecasts (estimates)', headers: ['Period', 'Revenue', 'EBITDA', 'Basis given by the Company'], rows: forecasts.map((f) => [f.period, f.revenueUsd != null ? usd(f.revenueUsd) : '—', f.ebitdaUsd != null ? usd(f.ebitdaUsd) : '—', f.basis]) }] : []),
    ] as MemorandumTable[] }, annual.length >= 2 ? [] : ['annual history']);

  // 9 · Operations, technology and IP
  const op = s.operations;
  const tech: string[] = [];
  if (op?.technology) tech.push(sentence(op.technology));
  else if (known('product.technicalArchitecture')) tech.push(`The platform is built as ${archPhrase(c.product.technicalArchitecture)}.`);
  if (c.product.aiNative) tech.push('Machine learning is part of the core workflow.');
  if (c.product.hasNetworkEffects) tech.push('The Company reports network effects: each additional customer makes the product more useful to the others.');
  if (c.product.hasDataMoat) tech.push('It also reports a proprietary data asset built up through use of the product.');
  if (op?.intellectualProperty) tech.push(`Intellectual property: ${sentence(op.intellectualProperty)}`);
  if (op?.operations) tech.push(sentence(op.operations));
  add(`${n()} Operations, technology and intellectual property`,
    `${tech.join(' ')}${!op?.technology || !op?.intellectualProperty ? ` ${gap([!op?.technology ? 'a description of the technology' : '', !op?.intellectualProperty ? 'the intellectual property position' : ''].filter(Boolean).join(' and '), 'Technical and IP diligence is where integration cost and ownership risk are assessed.', 'how the platform is built and run, and what IP the Company owns, licenses or has applied for')}` : ''}`.trim(),
    op?.technology && op?.intellectualProperty ? 'supported' : tech.length ? 'partial' : 'gap', {}, [...(!op?.technology ? ['technology'] : []), ...(!op?.intellectualProperty ? ['IP'] : [])]);

  // 10 · Management and organisation
  const t = s.team;
  if (t && (t.leaders.length || t.headcount.length)) {
    const total = t.headcount.reduce((x, y) => x + y.count, 0);
    add(`${n()} Management and organisation`,
      `${total ? `${name} employs ${total} people${t.headcountAsOf ? ` (at ${t.headcountAsOf})` : ''}.` : ''}${t.structure ? ` ${sentence(t.structure)}` : ''} Management presentations to engaged buyers are part of the process; key-person and retention arrangements are a matter for the definitive agreement.`.trim(),
      t.leaders.length && t.headcount.length ? 'supported' : 'partial',
      { tables: [
        ...(t.leaders.length ? [{ caption: 'Leadership team', headers: ['Name', 'Role', 'Background', 'Responsibilities'], rows: t.leaders.map((l) => [l.name, `${l.role}${l.founder ? ' (founder)' : ''}${l.since ? `, since ${l.since}` : ''}`, l.bio, l.responsibilities ?? '—']) }] : []),
        ...(t.headcount.length ? [{ caption: 'Headcount by function', headers: ['Function', 'People'], rows: [...t.headcount.map((x) => [x.function, String(x.count)]), ['Total', String(total)]] }] : []),
      ] }, [...(!t.leaders.length ? ['leadership biographies'] : []), ...(!t.headcount.length ? ['headcount'] : [])]);
  } else add(`${n()} Management and organisation`, gap('the management team and headcount', 'Buyers assess who runs the business, what they are responsible for, and how dependent it is on any one person.', 'biographies and responsibilities of the leadership team, headcount by function and an organisation chart'), 'gap', {}, ['management']);

  // 11 · Ownership
  const cap = s.capitalization;
  if (cap?.holders.length) add(`${n()} Ownership and capitalisation`,
    `Ownership on a fully diluted basis${cap.asOf ? ` at ${cap.asOf}` : ''}. Source: ${basisOf(cap.meta, s)}.${cap.shareClasses ? ` ${sentence(cap.shareClasses)}` : ''}${cap.instruments.length ? ' Other instruments are listed below.' : ''} The allocation of proceeds depends on the share classes and any preferences, and is set out in the data room.`,
    'supported', { tables: [
      { caption: 'Shareholders', headers: ['Holder', 'Class', 'Fully diluted'], rows: [...cap.holders.map((x) => [x.name, x.shareClass, pct(x.pct)]), ...(cap.optionPoolPct != null ? [['Option pool', '—', pct(cap.optionPoolPct)]] : [])] },
      ...(cap.instruments.length ? [{ caption: 'Other instruments', headers: ['Instrument', 'Amount', 'Terms'], rows: cap.instruments.map((x) => [x.instrument, x.amountUsd != null ? usd(x.amountUsd) : '—', x.terms]) }] : []),
    ] });
  else add(`${n()} Ownership and capitalisation`, gap('the capitalisation table', 'Buyers need fully diluted ownership, share classes, options and any convertible instruments to understand who must approve a sale and how proceeds are shared.', 'shareholders with their share class and fully diluted percentage, the option pool and any convertible or preferred instruments'), 'gap', {}, ['capitalisation']);

  // 12 · Growth opportunities
  const g = s.growth?.opportunities ?? [];
  if (g.length) add(`${n()} Growth opportunities and strategic rationale`, `The Company identifies the following opportunities. They are management's view, not forecasts.`, 'supported', { bullets: g.map((x) => `${x.title}: ${sentence(x.description)}`) });
  else add(`${n()} Growth opportunities and strategic rationale`, gap('management\'s view of growth opportunities', 'A buyer weighs what the business could become under its ownership as well as what it is today.', 'the main opportunities management sees — new products, segments, geographies or partnerships — and what each would need'), 'gap', {}, ['growth opportunities']);

  // 13 · Risks
  const own = h.risksSection(i, '');
  const declared = s.risks ?? [];
  const missing = (i.assumed ?? c.assumed ?? []).filter((a) => ['cap', 'team.headcount', 'market.addressableMarketUsd'].includes(a));
  add(`${n()} Material risks, dependencies and diligence considerations`,
    `${declared.length ? 'The risks and dependencies the Company has identified, with its mitigations, are listed first; the remaining points come from rule-based checks on its figures, not from a review of its documents.' : 'The Company has not yet set out the risks and dependencies it sees; the points below come from rule-based checks on its figures, not from a review of its documents.'}`,
    declared.length ? 'supported' : 'partial',
    { bullets: [...declared.map((x) => `${x.title}: ${sentence(x.description)}${x.mitigation ? ` Mitigation: ${sentence(x.mitigation)}` : ''}`), ...(own.bullets ?? []).filter((b) => !/Information not yet supplied/.test(b)), ...(missing.length ? [`Information not yet supplied (${missing.map((a) => ASSUMED_LABEL[a] ?? a).join(', ')}); buyers will ask for it early`] : [])] },
    declared.length ? [] : ['risks identified by the Company']);

  // 14 · Process
  add(`${n()} Process and timing`,
    `The Company is being offered through a targeted, confidential process: outreach to qualified candidates, then indications of interest, a letter of intent with exclusivity, confirmatory diligence and signing. All requests for information go through the process coordinator; recipients must not contact management, customers or employees directly. The dates below are ${h.timelineOf(i).basis.replace(/^ExitOS default process plan — /, '')}.`,
    'supported', { bullets: timelineLines(h.timelineOf(i), ['nda', 'management_presentations', 'ioi', 'loi', 'confirmatory_diligence', 'signing']) });

  // Appendix · source notes
  const notes: string[][] = [
    ...headRows.map((row) => [row[0] ?? "", row[1] ?? "", row[2] ?? ""]),
    ...annual.map((a) => [`Financials ${a.period}`, a.revenueUsd != null ? usd(a.revenueUsd) : '—', basisOf(a.meta, s)]),
    ...est.map((e) => [`Market size: ${e.label}`, usd(e.valueUsd), basisOf(e.meta, s)]),
    ...(cu?.grossRetentionPct != null ? [['Gross revenue retention', pct(cu.grossRetentionPct), basisOf(cu.grossRetentionMeta, s)]] : []),
    ...(cap?.holders.length ? [['Capitalisation table', `${cap.holders.length} holders`, basisOf(cap.meta, s)]] : []),
  ];
  add('Appendix: Source notes and basis of preparation',
    `Figures are stated in US dollars. Revenue is trailing twelve months; ARR is the annualised value of recurring contracts at the date of preparation; growth is measured against the same date a year earlier. Each material figure is listed with its basis: supplied by the Company (not independently checked), supported by a named source document, independently verified (only where a verification was recorded), or an estimate with its method. The memorandum states no prior period the Company has not reported. Timeline: ${h.timelineOf(i).basis}.`,
    'supported', { tables: [
      { caption: 'Material figures and their basis', headers: ['Figure', 'Value', 'Basis'], rows: notes },
      ...(s.sources.length ? [{ caption: 'Source documents', headers: ['Document', 'Type', 'Date', 'Period'], rows: s.sources.map((d) => [d.title, d.kind.replace(/_/g, ' '), d.date, d.period ?? '—']) }] : []),
    ] });

  const sections = [h.importantNotice(name), ...out.map((x) => x.section)];
  return {
    kind: 'cim', title: `Confidential Information Memorandum — ${name}`, sections, anonymized: !!i.anonymize,
    wordCount: h.countWords(sections), producedBy: `${h.IMPL}@${h.VERSION}`, coverage: out.map((x) => x.coverage),
  };
}
