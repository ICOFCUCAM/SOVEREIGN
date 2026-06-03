import type { BusinessModel, SectorTag } from '../types.js';

export type BuyerType = 'strategic' | 'pe' | 'vc' | 'family_office' | 'sponsor';

export interface BuyerEntry {
  readonly name: string;
  readonly buyerType: BuyerType;
  readonly sectorsActive: readonly SectorTag[];
  readonly modelsActive: readonly BusinessModel[];
  readonly checkSizeLowUsd: number;
  readonly checkSizeHighUsd: number;
  readonly geographyPreferred: readonly string[];        // ISO countries; empty = global
  readonly recentActivityScore: number;                  // 0..1 (last 12 months)
  readonly appetite: 'active' | 'warm' | 'dormant';
  readonly thesis: string;
}

// Reference buyer registry. Curated set spanning strategic acquirers,
// PE firms, family offices and sector specialists. Real production
// deployments override / extend via the registry surface.
export const BUYER_REGISTRY: readonly BuyerEntry[] = [
  // ── Strategic — Enterprise SaaS ────────────────────────────────────
  { name: 'Salesforce Acquisition Office',     buyerType: 'strategic', sectorsActive: ['enterprise_saas','vertical_saas','ai_infra'],     modelsActive: ['saas','ai_platform'],          checkSizeLowUsd: 50_000_000,  checkSizeHighUsd: 2_500_000_000, geographyPreferred: ['US','CA','GB','DE'],         recentActivityScore: 0.78, appetite: 'active',  thesis: 'Vertical clouds + AI tooling that compose with the Customer 360 stack' },
  { name: 'Microsoft Industry Solutions',      buyerType: 'strategic', sectorsActive: ['enterprise_saas','ai_infra','developer_tools'],   modelsActive: ['saas','ai_platform'],          checkSizeLowUsd: 50_000_000,  checkSizeHighUsd: 5_000_000_000, geographyPreferred: ['US','CA','GB','IE','IL'],    recentActivityScore: 0.85, appetite: 'active',  thesis: 'AI infrastructure + vertical platforms that consume Azure capacity' },
  { name: 'Adobe Strategic',                   buyerType: 'strategic', sectorsActive: ['enterprise_saas','media_content','ai_infra'],     modelsActive: ['saas','ai_platform','media'],  checkSizeLowUsd: 50_000_000,  checkSizeHighUsd: 1_500_000_000, geographyPreferred: ['US','CA','GB','DE'],         recentActivityScore: 0.55, appetite: 'warm',    thesis: 'Creative + content infrastructure that extends the Creative Cloud' },
  { name: 'ServiceNow Workflow Acquisitions',  buyerType: 'strategic', sectorsActive: ['enterprise_saas','vertical_saas'],                modelsActive: ['saas'],                         checkSizeLowUsd: 50_000_000,  checkSizeHighUsd: 1_500_000_000, geographyPreferred: ['US','CA','GB','DE'],         recentActivityScore: 0.62, appetite: 'active',  thesis: 'Workflow + ITSM extensions and adjacent enterprise software' },

  // ── Strategic — Vertical SaaS ──────────────────────────────────────
  { name: 'Vista Enterprise Software Bolt-On', buyerType: 'pe',        sectorsActive: ['vertical_saas','enterprise_saas','developer_tools'], modelsActive: ['saas'],                       checkSizeLowUsd: 25_000_000,  checkSizeHighUsd: 1_000_000_000, geographyPreferred: ['US','CA','GB','AU'],         recentActivityScore: 0.92, appetite: 'active',  thesis: 'Vertical-SaaS consolidation, 18-mo platform thesis, cash-paying customers' },
  { name: 'Thoma Bravo Software Buy-out',      buyerType: 'pe',        sectorsActive: ['enterprise_saas','vertical_saas','fintech_payments'], modelsActive: ['saas','fintech'],            checkSizeLowUsd: 100_000_000, checkSizeHighUsd: 5_000_000_000, geographyPreferred: ['US','CA','GB','AU','SG'],   recentActivityScore: 0.88, appetite: 'active',  thesis: 'Profitable enterprise software with durable margins' },

  // ── PE — Growth equity ─────────────────────────────────────────────
  { name: 'Insight Partners Growth',           buyerType: 'pe',        sectorsActive: ['enterprise_saas','vertical_saas','ai_infra','developer_tools'], modelsActive: ['saas','ai_platform'], checkSizeLowUsd: 20_000_000,  checkSizeHighUsd: 300_000_000,   geographyPreferred: ['US','CA','GB','IL','IN'],   recentActivityScore: 0.81, appetite: 'active',  thesis: 'Late-stage growth into SaaS and ai-native infrastructure' },
  { name: 'General Atlantic',                  buyerType: 'pe',        sectorsActive: ['fintech_payments','enterprise_saas','consumer_marketplace'], modelsActive: ['saas','fintech','marketplace'], checkSizeLowUsd: 50_000_000, checkSizeHighUsd: 500_000_000, geographyPreferred: ['US','GB','BR','IN','SG'],  recentActivityScore: 0.74, appetite: 'active',  thesis: 'Late-stage growth across software, fintech and marketplaces' },

  // ── Strategic — Logistics / Mobility ───────────────────────────────
  { name: 'C.H. Robinson Bolt-on',             buyerType: 'strategic', sectorsActive: ['logistics_freight','mobility'],                    modelsActive: ['logistics','mobility'],         checkSizeLowUsd: 25_000_000,  checkSizeHighUsd: 800_000_000,   geographyPreferred: ['US','CA','MX'],              recentActivityScore: 0.45, appetite: 'warm',    thesis: 'Brokerage + 3PL tuck-ins extending the freight stack' },
  { name: 'XPO Strategic',                     buyerType: 'strategic', sectorsActive: ['logistics_freight'],                               modelsActive: ['logistics'],                    checkSizeLowUsd: 50_000_000,  checkSizeHighUsd: 1_000_000_000, geographyPreferred: ['US','CA','GB','DE','FR'],    recentActivityScore: 0.40, appetite: 'warm',    thesis: 'LTL and brokerage acquisitions with technology overlay' },
  { name: 'Uber Acquisitions',                 buyerType: 'strategic', sectorsActive: ['mobility','consumer_marketplace','logistics_freight'], modelsActive: ['mobility','marketplace'],     checkSizeLowUsd: 50_000_000,  checkSizeHighUsd: 1_500_000_000, geographyPreferred: ['US','GB','BR','IN','MX','AU'], recentActivityScore: 0.66, appetite: 'active', thesis: 'Mobility, last-mile and on-demand consumer marketplaces' },

  // ── Strategic — Marketplaces ───────────────────────────────────────
  { name: 'Shopify Commerce Buy-outs',         buyerType: 'strategic', sectorsActive: ['consumer_marketplace','b2b_marketplace','enterprise_saas'], modelsActive: ['marketplace','commerce','saas'], checkSizeLowUsd: 25_000_000, checkSizeHighUsd: 1_000_000_000, geographyPreferred: ['US','CA','GB','DE'],   recentActivityScore: 0.58, appetite: 'warm',    thesis: 'Commerce infrastructure and merchant-facing tooling' },
  { name: 'Amazon Strategic',                  buyerType: 'strategic', sectorsActive: ['consumer_marketplace','logistics_freight','ai_infra'], modelsActive: ['marketplace','commerce','logistics','ai_platform'], checkSizeLowUsd: 100_000_000, checkSizeHighUsd: 10_000_000_000, geographyPreferred: ['US','CA','GB','DE','IN','JP','BR'], recentActivityScore: 0.30, appetite: 'dormant', thesis: 'Selective strategic bets in marketplaces, logistics and AI infrastructure' },

  // ── PE — Vertical/sector specialists ───────────────────────────────
  { name: 'KKR Tech Growth',                   buyerType: 'pe',        sectorsActive: ['enterprise_saas','vertical_saas','fintech_payments','ai_infra'], modelsActive: ['saas','fintech','ai_platform'], checkSizeLowUsd: 100_000_000, checkSizeHighUsd: 2_500_000_000, geographyPreferred: ['US','GB','DE','SG','AU'], recentActivityScore: 0.78, appetite: 'active', thesis: 'Late-stage growth across enterprise software, fintech and AI' },
  { name: 'TPG Tech',                          buyerType: 'pe',        sectorsActive: ['enterprise_saas','consumer_marketplace','media_content'], modelsActive: ['saas','marketplace','media'], checkSizeLowUsd: 50_000_000, checkSizeHighUsd: 1_000_000_000, geographyPreferred: ['US','GB','IN','SG'], recentActivityScore: 0.68, appetite: 'active', thesis: 'Growth and buy-out across software, marketplaces and digital media' },

  // ── Family offices ─────────────────────────────────────────────────
  { name: 'Pritzker Private Capital',          buyerType: 'family_office', sectorsActive: ['logistics_freight','consumer_marketplace','enterprise_saas'], modelsActive: ['logistics','saas','commerce'], checkSizeLowUsd: 50_000_000, checkSizeHighUsd: 500_000_000, geographyPreferred: ['US','CA','GB'], recentActivityScore: 0.55, appetite: 'warm', thesis: 'Long-hold operating positions; control deals only' },
  { name: 'Walton Enterprises',                buyerType: 'family_office', sectorsActive: ['logistics_freight','consumer_marketplace','b2b_marketplace'], modelsActive: ['logistics','marketplace'],     checkSizeLowUsd: 50_000_000, checkSizeHighUsd: 800_000_000, geographyPreferred: ['US','MX'], recentActivityScore: 0.40, appetite: 'warm', thesis: 'Long-hold infrastructure investments adjacent to retail and logistics' },

  // ── Venture funds (late-stage growth / secondaries) ───────────────
  // VCs surface in ExitOS exit conversations as growth-round acquirers
  // (cap-table reset + partial founder liquidity), continuation
  // vehicles, and secondary buyers for late-stage shares.
  { name: 'Sequoia Capital Growth',            buyerType: 'vc',            sectorsActive: ['enterprise_saas','vertical_saas','ai_infra','developer_tools','fintech_payments'], modelsActive: ['saas','ai_platform','fintech'], checkSizeLowUsd: 30_000_000,  checkSizeHighUsd: 400_000_000, geographyPreferred: ['US','GB','IL','IN','SG'], recentActivityScore: 0.85, appetite: 'active', thesis: 'Late-stage growth with founder liquidity tranches in category-defining companies' },
  { name: 'Andreessen Horowitz LSV',           buyerType: 'vc',            sectorsActive: ['ai_infra','enterprise_saas','developer_tools','fintech_payments','consumer_marketplace'], modelsActive: ['saas','ai_platform','fintech','marketplace'], checkSizeLowUsd: 25_000_000, checkSizeHighUsd: 300_000_000, geographyPreferred: ['US','GB','IL'],     recentActivityScore: 0.86, appetite: 'active', thesis: 'AI-native, platform-shape companies; late-stage capital with secondary tender' },
  { name: 'Accel Late Stage',                  buyerType: 'vc',            sectorsActive: ['enterprise_saas','vertical_saas','fintech_payments','developer_tools'],                modelsActive: ['saas','fintech'],                  checkSizeLowUsd: 20_000_000,  checkSizeHighUsd: 250_000_000, geographyPreferred: ['US','GB','IN','IL'],         recentActivityScore: 0.78, appetite: 'active', thesis: 'Growth-stage rounds with disciplined valuation and partial founder liquidity' },
  { name: 'Index Ventures Growth',             buyerType: 'vc',            sectorsActive: ['enterprise_saas','consumer_marketplace','fintech_payments','ai_infra'],                modelsActive: ['saas','fintech','marketplace','ai_platform'], checkSizeLowUsd: 20_000_000, checkSizeHighUsd: 200_000_000, geographyPreferred: ['US','GB','DE','FR','IL'],  recentActivityScore: 0.74, appetite: 'active', thesis: 'Late-stage European + US growth; appetite for category leaders' },
  { name: 'Coatue Tech Growth',                buyerType: 'vc',            sectorsActive: ['enterprise_saas','ai_infra','fintech_payments','consumer_marketplace'],                 modelsActive: ['saas','ai_platform','fintech'],     checkSizeLowUsd: 50_000_000,  checkSizeHighUsd: 600_000_000, geographyPreferred: ['US','GB','SG','IN'],          recentActivityScore: 0.81, appetite: 'active', thesis: 'Cross-over investor; growth + late-stage primary + secondary blocks' },
  { name: 'Lightspeed Growth Capital',         buyerType: 'vc',            sectorsActive: ['enterprise_saas','vertical_saas','consumer_marketplace','b2b_marketplace'],              modelsActive: ['saas','marketplace'],               checkSizeLowUsd: 15_000_000,  checkSizeHighUsd: 200_000_000, geographyPreferred: ['US','IN','SG','IL'],          recentActivityScore: 0.69, appetite: 'active', thesis: 'Growth rounds across SaaS, marketplaces and consumer; geographically diversified' },
  { name: 'Bessemer Forge',                    buyerType: 'vc',            sectorsActive: ['enterprise_saas','vertical_saas','fintech_payments','developer_tools'],                  modelsActive: ['saas','fintech'],                   checkSizeLowUsd: 15_000_000,  checkSizeHighUsd: 150_000_000, geographyPreferred: ['US','GB','IL','IN'],          recentActivityScore: 0.71, appetite: 'active', thesis: 'Late-stage SaaS specialist with Rule-of-40 discipline' },
  { name: 'Tiger Global Late Stage',           buyerType: 'vc',            sectorsActive: ['enterprise_saas','consumer_marketplace','fintech_payments','ai_infra'],                  modelsActive: ['saas','marketplace','fintech','ai_platform'], checkSizeLowUsd: 25_000_000, checkSizeHighUsd: 500_000_000, geographyPreferred: ['US','GB','BR','IN','SG','CN'], recentActivityScore: 0.58, appetite: 'warm',   thesis: 'Late-stage global growth across consumer and enterprise software' },
];
