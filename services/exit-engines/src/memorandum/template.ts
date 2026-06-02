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

function valuationTable(i: MemorandumInputs): MemorandumTable {
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
      body: `${name} reports ${money(r.trailingTwelveMonthsRevenueUsd, !!i.anonymize)} in trailing twelve-month revenue at ${(r.grossMarginPct * 100).toFixed(0)}% gross margin and ${(r.ebitdaMarginPct * 100).toFixed(0)}% EBITDA margin.`,
      tables: [valuationTable(i)],
    },
    {
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
      body: 'Targeted process. Bilateral outreach to qualified candidates with a structured timeline through term-sheet, exclusivity, diligence and signing.',
    },
  ];

  const wordCount = sections.reduce((s, sec) => s + sec.body.split(/\s+/).length + (sec.bullets?.length ?? 0) * 8, 0);
  return { kind: 'cim', title: `Confidential Information Memorandum — ${name}`, sections, anonymized: !!i.anonymize, wordCount, producedBy: `${IMPL}@${VERSION}` };
}

function executiveSummary(i: MemorandumInputs): MemorandumDocument {
  const name = anonName(i.company.name, !!i.anonymize);
  const sections: MemorandumSection[] = [
    {
      heading: 'At a glance',
      body: `${name} · ${i.company.businessModel} · ${i.company.sector.replace(/_/g, ' ')} · ${i.anonymize ? '[redacted]' : i.company.jurisdiction} · founded ${i.company.foundedYear}.`,
      bullets: [
        `Revenue (TTM): ${money(i.company.revenue.trailingTwelveMonthsRevenueUsd, !!i.anonymize)} · ARR: ${money(i.company.revenue.annualRecurringRevenueUsd, !!i.anonymize)}`,
        `Growth: ${(i.company.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY · Gross margin: ${(i.company.revenue.grossMarginPct * 100).toFixed(0)}%`,
        `Valuation: ${money(i.valuation.headline.low, !!i.anonymize)} – ${money(i.valuation.headline.high, !!i.anonymize)}`,
      ],
    },
    {
      heading: 'Why it matters',
      body: i.company.narrative ?? `${i.company.product.differentiation} differentiation in a ${i.company.market.competitiveDensity}-density market growing ${(i.company.market.marketGrowthPct * 100).toFixed(0)}% per year.`,
    },
    {
      heading: 'Process',
      body: 'Bilateral outreach to qualified strategic and financial buyers. NDA + management presentation on engagement. LOI in 4–6 weeks.',
    },
  ];
  return { kind: 'executive_summary', title: `${name} — Executive Summary`, sections, anonymized: !!i.anonymize, wordCount: 180, producedBy: `${IMPL}@${VERSION}` };
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
    slide('Slide 8 · Valuation',       `${money(i.valuation.headline.low, !!i.anonymize)} – ${money(i.valuation.headline.high, !!i.anonymize)} headline range.`, i.valuation.premiums.map((p) => `${p.name}: ${(p.pct * 100).toFixed(0)}%`)),
    slide('Slide 9 · Process',         'Bilateral outreach. Targeted process. LOI in 4–6 weeks.'),
    slide('Slide 10 · Contact',        'Bilateral inquiries through the ExitOS dispatch desk.'),
  ];
  return { kind: 'investor_deck', title: `${name} — Investor deck`, sections, anonymized: !!i.anonymize, wordCount: 240, producedBy: `${IMPL}@${VERSION}` };
}

function buyerTeaser(i: MemorandumInputs): MemorandumDocument {
  const anonInputs: MemorandumInputs = { ...i, anonymize: true };
  const projectName = 'Project Cipher';
  const sections: MemorandumSection[] = [
    {
      heading: projectName,
      body: `A ${i.company.businessModel} in ${i.company.sector.replace(/_/g, ' ')} with ${money(i.company.revenue.annualRecurringRevenueUsd, true)} ARR, growing ${(i.company.growth.arrGrowthYoyPct * 100).toFixed(0)}% YoY. Headquartered in a tier-one jurisdiction. Headline valuation range disclosed under NDA.`,
      bullets: [
        `Recurring revenue: ${money(i.company.revenue.annualRecurringRevenueUsd, true)}`,
        `Gross margin: ${(i.company.revenue.grossMarginPct * 100).toFixed(0)}%`,
        `EBITDA margin: ${(i.company.revenue.ebitdaMarginPct * 100).toFixed(0)}%`,
        `Customer base: redacted under NDA`,
      ],
    },
    {
      heading: 'Why it is interesting',
      body: i.company.product.hasNetworkEffects || i.company.product.hasDataMoat
        ? 'The asset combines durable moat characteristics with sector-leading growth.'
        : 'The asset combines disciplined unit economics with a growing addressable market.',
    },
    {
      heading: 'Next steps',
      body: 'Mutual NDA available on request. Management presentation within 10 business days of execution.',
    },
  ];
  return { kind: 'buyer_teaser', title: `${projectName} — Anonymized teaser`, sections, anonymized: true, wordCount: 140, producedBy: `${IMPL}@${VERSION}` };
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
