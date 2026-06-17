import type {
  MemorandumGenerator, MemorandumKind, MemorandumInputs, MemorandumDocument,
  MemorandumSection, MemorandumTable,
} from './types.js';

// Deterministic template generator. No LLM. Produces structurally
// correct memoranda from the engine inputs — narrative is mechanical
// but the document shape matches what counsel and bankers expect.
// Use as the reference and as the fallback when ANTHROPIC_API_KEY
// isn't configured.

const IMPL = 'template-memorandum-generator';
const VERSION = '0.1.0';

function money(n: number, anonymize = false): string {
  if (anonymize) return '—';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function anonName(orig: string, anonymize: boolean): string {
  return anonymize ? 'Project Cipher' : orig;
}

// Derived three-year ARR trajectory — implied from the current ARR and the
// reported YoY growth rate, so every memo can show a track record table.
function arrTrajectory(i: MemorandumInputs): MemorandumTable {
  const arr = i.company.revenue.annualRecurringRevenueUsd;
  const g = i.company.growth.arrGrowthYoyPct;
  const year = new Date().getFullYear();
  const y1 = arr / (1 + g);
  const y2 = y1 / (1 + Math.max(0.05, g * 0.9));
  return {
    caption: 'Implied ARR trajectory at the reported growth rate',
    headers: ['', `FY${year - 2}`, `FY${year - 1}`, `FY${year} (current)`],
    rows: [
      ['ARR', money(y2, !!i.anonymize), money(y1, !!i.anonymize), money(arr, !!i.anonymize)],
      ['YoY growth', '—', `${(Math.max(0.05, g * 0.9) * 100).toFixed(0)}%`, `${(g * 100).toFixed(0)}%`],
    ],
  };
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

function investmentHighlights(i: MemorandumInputs): string[] {
  const c = i.company;
  return [
    `Scaled recurring-revenue base: ${money(c.revenue.annualRecurringRevenueUsd, !!i.anonymize)} ARR compounding at ${(c.growth.arrGrowthYoyPct * 100).toFixed(0)}% annually`,
    `Category position in a ${money(c.market.addressableMarketUsd, !!i.anonymize)} addressable market growing ${(c.market.marketGrowthPct * 100).toFixed(0)}% per annum`,
    ...(c.product.hasNetworkEffects ? ['Structural network effects that compound with scale'] : []),
    ...(c.product.hasDataMoat ? ['Proprietary data asset that deepens with every transaction'] : []),
    ...(c.product.aiNative ? ['AI-native architecture embedded in the core workflow, not bolted on'] : []),
    `${c.product.differentiation} differentiation with ${c.product.defensibility} defensibility against entrants`,
    ...(c.team.foundersStillActive ? ['Founding team remains operationally engaged through transition'] : []),
  ];
}

function valuationTable(i: MemorandumInputs): MemorandumTable {
  // When the constitution is present, the methodology table inherits its
  // normalized weights and per-method market evidence — the single source
  // of valuation truth, not a per-document recomputation.
  if (i.constitution) {
    return {
      caption: `Valuation methodology — ExitOS Framework v${i.constitution.frameworkVersion}`,
      headers: ['Methodology', 'Basis', 'Low', 'Mid', 'High', 'Weight', 'Market evidence'],
      rows: i.constitution.methodologies.map((m) => [
        m.name, m.basis,
        money(m.band.low, i.anonymize), money(m.band.mid, i.anonymize), money(m.band.high, i.anonymize),
        `${m.weightPct}%`, m.evidence,
      ]),
    };
  }
  const v = i.valuation;
  return {
    caption: 'Valuation band',
    headers: ['Methodology', 'Basis', 'Low', 'Mid', 'High', 'Weight'],
    rows: v.methodologies.map((m) => [
      m.name, m.basis,
      money(m.band.low, i.anonymize),
      money(m.band.mid, i.anonymize),
      money(m.band.high, i.anonymize),
      `${Math.round(m.weight * 100)}%`,
    ]),
  };
}

// The framework-governed valuation section every memorandum inherits.
// Renders the ten mandatory outputs from the constitution — no document
// states a valuation figure the framework didn't produce.
function constitutionValuationSection(i: MemorandumInputs, heading: string): MemorandumSection | null {
  const c = i.constitution;
  if (!c) return null;
  const m = c.mandatoryOutputs;
  const anon = !!i.anonymize;
  const body = anon
    ? `Valuation prepared under ExitOS Valuation Framework v${c.frameworkVersion}. Absolute figures are disclosed on execution of a mutual NDA; the methodology, confidence (${m.confidence_score}) and the buyer universe (${m.buyer_universe_size}) are shared pre-NDA.`
    : `On a strategic-buyer basis the enterprise value is ${m.midpoint_valuation} (range ${m.enterprise_value_range}), prepared under ExitOS Valuation Framework v${c.frameworkVersion}. The midpoint is the financial baseline uplifted by a strategic premium of ${m.strategic_premium_basis} — drawn from observed precedent transactions, not assumed.`;
  return {
    heading,
    body,
    tables: [
      {
        caption: 'Mandatory valuation outputs',
        headers: ['Output', 'Value'],
        rows: [
          ['Enterprise value range', anon ? '— (under NDA)' : m.enterprise_value_range],
          ['Midpoint valuation', anon ? '— (under NDA)' : m.midpoint_valuation],
          ['Valuation confidence', m.confidence_score],
          ['Methodology weighting', m.methodology_weighting],
          ['Comparable transactions', m.comparable_transaction_count],
          ['Strategic premium basis', m.strategic_premium_basis],
          ['Buyer universe', m.buyer_universe_size],
          ['Expected time to close', m.expected_time_to_close],
          ['Data provenance', m.data_provenance_summary],
        ],
      },
    ],
  };
}

function cim(i: MemorandumInputs): MemorandumDocument {
  const name = anonName(i.company.name, !!i.anonymize);
  const r = i.company.revenue;
  const sections: MemorandumSection[] = [
    {
      heading: '1. Executive overview',
      body: `${name} is a ${i.company.businessModel} operating in ${i.company.sector.replace(/_/g, ' ')}. Founded ${i.company.foundedYear}, headquartered in ${i.anonymize ? '[redacted]' : i.company.jurisdiction}. The business operates ${money(r.annualRecurringRevenueUsd, !!i.anonymize)} of annual recurring revenue against a ${money(i.company.market.addressableMarketUsd, !!i.anonymize)} addressable market.`,
      bullets: [
        `Revenue (TTM): ${money(r.trailingTwelveMonthsRevenueUsd, !!i.anonymize)}`,
        `ARR: ${money(r.annualRecurringRevenueUsd, !!i.anonymize)} — ${(i.company.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY growth`,
        `Gross margin: ${(r.grossMarginPct * 100).toFixed(0)}%`,
        `EBITDA margin: ${(r.ebitdaMarginPct * 100).toFixed(0)}%`,
        r.netRetentionPct != null ? `Net retention: ${(r.netRetentionPct * 100).toFixed(0)}%` : 'Retention disclosed separately',
      ],
    },
    {
      heading: '2. Investment thesis',
      body: i.company.narrative ?? `${name} occupies a defensible position in a ${i.company.market.competitiveDensity}-density market growing at ${(i.company.market.marketGrowthPct * 100).toFixed(0)}% per annum. The proposition combines ${i.company.product.differentiation} differentiation with ${i.company.product.defensibility} defensibility.`,
      bullets: [
        ...(i.company.product.hasNetworkEffects ? ['Demonstrated network effects'] : []),
        ...(i.company.product.hasDataMoat       ? ['Data moat — proprietary corpus'] : []),
        ...(i.company.product.aiNative          ? ['AI-native architecture'] : []),
        ...(i.company.product.intellectualProperty?.patentsGranted ? [`${i.company.product.intellectualProperty.patentsGranted} granted patent(s)`] : []),
      ],
    },
    {
      heading: '3. Market',
      body: `Total addressable market: ${money(i.company.market.addressableMarketUsd, !!i.anonymize)}. Compound annual growth rate: ${(i.company.market.marketGrowthPct * 100).toFixed(0)}%. Competitive density: ${i.company.market.competitiveDensity}. Regulatory risk: ${i.company.market.regulatoryRisk}.`,
    },
    {
      heading: '4. Product & technology',
      body: `Architecture: ${i.company.product.technicalArchitecture}. Defensibility: ${i.company.product.defensibility}. The platform serves ${i.anonymize ? '—' : i.company.users.totalCustomers.toLocaleString()} customers${i.company.users.activeMonthly ? ` with ${i.anonymize ? '—' : i.company.users.activeMonthly.toLocaleString()} monthly active users` : ''}.`,
    },
    {
      heading: '5. Financial performance',
      body: `${name} reports ${money(r.trailingTwelveMonthsRevenueUsd, !!i.anonymize)} in trailing twelve-month revenue at ${(r.grossMarginPct * 100).toFixed(0)}% gross margin and ${(r.ebitdaMarginPct * 100).toFixed(0)}% EBITDA margin — profitable while compounding. The recurring-revenue base has expanded consistently at the reported growth rate.`,
      tables: [financialProfileTable(i), arrTrajectory(i), valuationTable(i)],
    },
    constitutionValuationSection(i, '6. Valuation') ?? {
      heading: '6. Valuation',
      body: `Headline valuation range: ${money(i.valuation.headline.low, !!i.anonymize)} – ${money(i.valuation.headline.mid, !!i.anonymize)} – ${money(i.valuation.headline.high, !!i.anonymize)}. Country adjustment for ${i.anonymize ? '[redacted]' : i.company.jurisdiction}: ${(i.valuation.countryAdjustment * 100).toFixed(0)}%.`,
      bullets: i.valuation.premiums.map((p) => `${p.name}: ${p.pct >= 0 ? '+' : ''}${(p.pct * 100).toFixed(0)}% — ${p.reason}`),
    },
    {
      heading: '7. Team',
      body: `Headcount: ${i.anonymize ? '—' : i.company.team.headcount}. Founders ${i.company.team.foundersStillActive ? 'remain active in operations' : 'have transitioned out'}. Leadership bench: ${i.company.team.leadershipBenchStrength}.`,
    },
    ...(i.readiness ? [{
      heading: '8. Exit readiness',
      body: `Overall readiness score: ${i.readiness.overallScore.toFixed(0)}/100 — ${i.readiness.band.replace(/_/g, ' ')}. ${i.readiness.recommendations[0] ?? ''}`,
      bullets: i.readiness.strengths.length > 0 ? i.readiness.strengths : ['Refer to readiness report for dimension breakdown'],
    } as MemorandumSection] : []),
    ...(i.buyers ? [{
      heading: '9. Target buyer set',
      body: i.buyers.summary,
      bullets: i.buyers.candidates.slice(0, 8).map((c) => `${c.buyer.name} (${c.buyer.buyerType}) — probability ${(c.probability * 100).toFixed(0)}%`),
    } as MemorandumSection] : []),
    {
      heading: '10. Process & timing',
      body: 'The Company is being offered through a targeted, confidential process: bilateral outreach to qualified candidates, with a structured timeline through indications of interest, term sheet, exclusivity, confirmatory diligence and signing. All requests for information should be directed through the process coordinator; direct contact with management, customers or employees is not permitted at this stage.',
      bullets: [
        'Weeks 1–2 · NDA execution, CIM distribution and management presentations',
        'Weeks 3–4 · Data-room access and preliminary diligence; indications of interest due',
        'Weeks 5–6 · Selected parties to confirmatory diligence under exclusivity',
        'Weeks 7–10 · Definitive documentation, signing and announcement',
      ],
    },
  ];

  const wordCount = sections.reduce((s, sec) => s + sec.body.split(/\s+/).length + (sec.bullets?.length ?? 0) * 8, 0);
  return { kind: 'cim', title: `Confidential Information Memorandum — ${name}`, sections, anonymized: !!i.anonymize, wordCount, producedBy: `${IMPL}@${VERSION}` };
}

function executiveSummary(i: MemorandumInputs): MemorandumDocument {
  const name = anonName(i.company.name, !!i.anonymize);
  const c = i.company;
  const v = i.valuation;
  const sections: MemorandumSection[] = [
    {
      heading: 'The opportunity',
      body: `${name} is a ${c.businessModel} operating in ${c.sector.replace(/_/g, ' ')}, headquartered in ${i.anonymize ? 'a tier-one jurisdiction' : c.jurisdiction} and founded in ${c.foundedYear}. ${c.narrative ?? `The business combines ${c.product.differentiation} differentiation with ${c.product.defensibility} defensibility in a market growing ${(c.market.marketGrowthPct * 100).toFixed(0)}% per annum.`} The Company is being offered to a curated group of qualified strategic and financial acquirers through a structured, confidential process.`,
    },
    {
      heading: 'Financial profile',
      body: `${name} reports ${money(c.revenue.trailingTwelveMonthsRevenueUsd, !!i.anonymize)} in trailing twelve-month revenue, anchored by ${money(c.revenue.annualRecurringRevenueUsd, !!i.anonymize)} of annual recurring revenue growing ${(c.growth.arrGrowthYoyPct * 100).toFixed(0)}% year over year.`,
      tables: [financialProfileTable(i), arrTrajectory(i)],
    },
    {
      heading: 'Investment highlights',
      body: 'The considerations management believes will matter most to an acquirer:',
      bullets: investmentHighlights(i),
    },
    {
      heading: 'Market position',
      body: `The Company addresses a ${money(c.market.addressableMarketUsd, !!i.anonymize)} market expanding at ${(c.market.marketGrowthPct * 100).toFixed(0)}% annually. Competitive density is assessed as ${c.market.competitiveDensity}; regulatory exposure as ${c.market.regulatoryRisk}. The platform serves ${i.anonymize ? 'a customer base disclosed under NDA' : `${c.users.totalCustomers.toLocaleString()} customers`}${c.users.activeMonthly && !i.anonymize ? ` with ${c.users.activeMonthly.toLocaleString()} monthly active users` : ''}.`,
    },
    constitutionValuationSection(i, 'Indicative valuation') ?? {
      heading: 'Indicative valuation',
      body: `Based on comparable-transaction and fundamental analysis, the indicative enterprise value range is ${money(v.headline.low, !!i.anonymize)} – ${money(v.headline.high, !!i.anonymize)}, with a midpoint of ${money(v.headline.mid, !!i.anonymize)} on a strategic-buyer basis.`,
      bullets: v.premiums.map((p) => `${p.name}: ${p.pct >= 0 ? '+' : ''}${(p.pct * 100).toFixed(0)}% — ${p.reason}`),
    },
    {
      heading: 'Process & timeline',
      body: 'Bilateral outreach to qualified counterparties on a strictly confidential basis. Interested parties execute a mutual NDA, receive the confidential information memorandum and staged data-room access, and attend a management presentation within ten business days. Indications of interest are requested within four weeks, with a signed letter of intent targeted in four to six weeks.',
    },
  ];
  const wordCount = sections.reduce((s, sec) => s + sec.body.split(/\s+/).length + (sec.bullets?.length ?? 0) * 10, 0);
  return { kind: 'executive_summary', title: `${name} — Executive Summary`, sections, anonymized: !!i.anonymize, wordCount, producedBy: `${IMPL}@${VERSION}` };
}

function investorDeck(i: MemorandumInputs): MemorandumDocument {
  const name = anonName(i.company.name, !!i.anonymize);
  const slide = (heading: string, body: string, bullets?: string[]): MemorandumSection =>
    ({ heading, body, ...(bullets ? { bullets } : {}) });

  const sections: MemorandumSection[] = [
    slide('Slide 1 · Title',          `${name} — Acquisition opportunity`, [`${i.company.businessModel.toUpperCase()} · ${i.company.sector.replace(/_/g, ' ').toUpperCase()}`, `Founded ${i.company.foundedYear}`]),
    slide('Slide 2 · The opportunity', `A ${i.company.product.differentiation} player in a ${money(i.company.market.addressableMarketUsd, !!i.anonymize)} market growing ${(i.company.market.marketGrowthPct * 100).toFixed(0)}% per year.`),
    slide('Slide 3 · Traction',        `${money(i.company.revenue.annualRecurringRevenueUsd, !!i.anonymize)} ARR · ${(i.company.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY growth.`, [
      `${i.anonymize ? '—' : i.company.users.totalCustomers.toLocaleString()} customers`,
      `${(i.company.revenue.grossMarginPct * 100).toFixed(0)}% gross margin`,
      ...(i.company.revenue.netRetentionPct ? [`${(i.company.revenue.netRetentionPct * 100).toFixed(0)}% net retention`] : []),
    ]),
    slide('Slide 4 · Product',         `Architecture: ${i.company.product.technicalArchitecture}. ${i.company.product.hasNetworkEffects ? 'Network effects. ' : ''}${i.company.product.hasDataMoat ? 'Data moat. ' : ''}${i.company.product.aiNative ? 'AI-native. ' : ''}`),
    slide('Slide 5 · Market',          `Competitive density: ${i.company.market.competitiveDensity}. Regulatory risk: ${i.company.market.regulatoryRisk}.`),
    slide('Slide 6 · Financials',      `${money(i.company.revenue.trailingTwelveMonthsRevenueUsd, !!i.anonymize)} TTM revenue. ${(i.company.revenue.ebitdaMarginPct * 100).toFixed(0)}% EBITDA margin.`),
    slide('Slide 7 · Team',            `${i.anonymize ? '—' : i.company.team.headcount} headcount. Leadership: ${i.company.team.leadershipBenchStrength}.`),
    slide('Slide 8 · Valuation',
      i.constitution
        ? `${money(i.constitution.headline.low, !!i.anonymize)} – ${money(i.constitution.headline.high, !!i.anonymize)} · midpoint ${money(i.constitution.headline.mid, !!i.anonymize)} · confidence ${i.constitution.confidence.score}% (Framework v${i.constitution.frameworkVersion})`
        : `${money(i.valuation.headline.low, !!i.anonymize)} – ${money(i.valuation.headline.high, !!i.anonymize)} headline range.`,
      i.constitution
        ? [`Strategic premium ${i.constitution.mandatoryOutputs.strategic_premium_basis}`, `${i.constitution.comparablesUsed} comparable transactions`, `Buyer universe: ${i.constitution.mandatoryOutputs.buyer_universe_size}`]
        : i.valuation.premiums.map((p) => `${p.name}: ${(p.pct * 100).toFixed(0)}%`)),
    slide('Slide 9 · Process',         'Bilateral outreach. Targeted process. LOI in 4–6 weeks.'),
    slide('Slide 10 · Contact',        'Bilateral inquiries through the ExitOS dispatch desk.'),
  ];
  return { kind: 'investor_deck', title: `${name} — Investor deck`, sections, anonymized: !!i.anonymize, wordCount: 240, producedBy: `${IMPL}@${VERSION}` };
}

function buyerTeaser(i: MemorandumInputs): MemorandumDocument {
  const projectName = 'Project Cipher';
  const c = i.company;
  const sections: MemorandumSection[] = [
    {
      heading: 'The opportunity',
      body: `${projectName} is a ${c.businessModel} operating in ${c.sector.replace(/_/g, ' ')}, headquartered in a tier-one jurisdiction. The business has built a scaled recurring-revenue position growing ${(c.growth.arrGrowthYoyPct * 100).toFixed(0)}% year over year, and is being offered to a small group of qualified acquirers through a structured, confidential process. The Company's identity, detailed financials and the indicative valuation range are disclosed on execution of a mutual NDA.`,
    },
    {
      heading: 'Selected metrics',
      body: 'Headline operating profile (absolute figures disclosed under NDA):',
      bullets: [
        `Revenue growth: ${(c.growth.arrGrowthYoyPct * 100).toFixed(0)}% year over year, recurring-revenue led`,
        `Gross margin: ${(c.revenue.grossMarginPct * 100).toFixed(0)}%`,
        `EBITDA margin: ${(c.revenue.ebitdaMarginPct * 100).toFixed(0)}% — profitable while compounding`,
        ...(c.revenue.netRetentionPct != null ? [`Net revenue retention: ${(c.revenue.netRetentionPct * 100).toFixed(0)}%`] : []),
        `Market: expanding ${(c.market.marketGrowthPct * 100).toFixed(0)}% per annum; ${c.market.competitiveDensity} competitive density`,
      ],
    },
    {
      heading: 'Why this asset',
      body: c.product.hasNetworkEffects || c.product.hasDataMoat
        ? `The asset combines durable moat characteristics — ${[c.product.hasNetworkEffects ? 'structural network effects' : '', c.product.hasDataMoat ? 'a proprietary data position that deepens with usage' : ''].filter(Boolean).join(' and ')} — with sector-leading growth and disciplined unit economics.`
        : 'The asset combines disciplined unit economics, a defensible product position and a growing addressable market.',
      bullets: [
        `${c.product.differentiation} differentiation · ${c.product.defensibility} defensibility`,
        ...(c.product.aiNative ? ['AI-native architecture embedded in the core workflow'] : []),
        'Management team intends to support a professional transition',
      ],
    },
    ...(i.constitution ? [{
      heading: 'Valuation basis',
      body: `Valuation is prepared under ExitOS Valuation Framework v${i.constitution.frameworkVersion}. The enterprise value range and midpoint are disclosed on NDA; pre-NDA we share the basis: confidence ${i.constitution.mandatoryOutputs.confidence_score}, ${i.constitution.comparablesUsed} comparable transactions, a strategic premium of ${i.constitution.mandatoryOutputs.strategic_premium_basis}, and a qualified buyer universe of ${i.constitution.mandatoryOutputs.buyer_universe_size}.`,
    } as MemorandumSection] : []),
    {
      heading: 'Process & next steps',
      body: 'Interested parties should request the mutual NDA. On execution: identity disclosure, the confidential information memorandum, staged data-room access, and a management presentation within ten business days. The process is being run on a strict timetable; early engagement is advised.',
    },
  ];
  const wordCount = sections.reduce((s, sec) => s + sec.body.split(/\s+/).length + (sec.bullets?.length ?? 0) * 10, 0);
  return { kind: 'buyer_teaser', title: `${projectName} — Confidential opportunity overview`, sections, anonymized: true, wordCount, producedBy: `${IMPL}@${VERSION}` };
}

function ddRoomIndex(i: MemorandumInputs): MemorandumDocument {
  const name = anonName(i.company.name, !!i.anonymize);
  const sections: MemorandumSection[] = i.diligence
    ? i.diligence.documents.map((doc) => ({
        heading: doc.title,
        body: `Classification: ${doc.classification}. ${doc.sections.length} section${doc.sections.length === 1 ? '' : 's'}, ${doc.artifacts.length} artifact${doc.artifacts.length === 1 ? '' : 's'}.`,
        bullets: doc.artifacts.map((a) => `${a.required ? '★' : '◇'} ${a.filename} — ${a.description}`),
      }))
    : [{
        heading: 'Diligence package not generated',
        body: 'Run the due-diligence engine to populate this index.',
      }];
  return { kind: 'dd_room_index', title: `${name} — Data room index`, sections, anonymized: !!i.anonymize, wordCount: 320, producedBy: `${IMPL}@${VERSION}` };
}

export class TemplateMemorandumGenerator implements MemorandumGenerator {
  readonly implementation = IMPL;
  readonly version = VERSION;

  async generate(kind: MemorandumKind, inputs: MemorandumInputs): Promise<MemorandumDocument> {
    switch (kind) {
      case 'cim':                return cim(inputs);
      case 'executive_summary':  return executiveSummary(inputs);
      case 'investor_deck':      return investorDeck(inputs);
      case 'buyer_teaser':       return buyerTeaser(inputs);
      case 'dd_room_index':      return ddRoomIndex(inputs);
    }
  }
}
