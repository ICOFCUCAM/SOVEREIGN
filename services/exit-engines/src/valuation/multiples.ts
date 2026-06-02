import type { BusinessModel, SectorTag } from '../types.js';

// Benchmark multiples — institutional priors as of 2026. These are
// reference values; production deployments override via config.
// Format: [low, mid, high] applied to the relevant base (ARR, revenue,
// EBITDA, GMV) at trough-to-peak market conditions.

export interface MultiplesBand {
  readonly low: number;
  readonly mid: number;
  readonly high: number;
}

export interface SectorMultiples {
  readonly arr?: MultiplesBand;        // applied to ARR
  readonly revenue?: MultiplesBand;    // applied to TTM revenue
  readonly ebitda?: MultiplesBand;     // applied to EBITDA
  readonly gmv?: MultiplesBand;        // marketplace
  readonly rule40Premium?: number;     // pct premium when rule40 > 0.4
  readonly netRetentionPremium?: number; // pct premium when NRR > 1.2
}

export const MULTIPLES: Record<SectorTag, SectorMultiples> = {
  enterprise_saas:      { arr: { low: 4,   mid: 7,   high: 12 }, ebitda: { low: 12, mid: 18, high: 28 }, rule40Premium: 0.25, netRetentionPremium: 0.30 },
  vertical_saas:        { arr: { low: 3,   mid: 5,   high: 9  }, ebitda: { low: 10, mid: 14, high: 22 }, rule40Premium: 0.20, netRetentionPremium: 0.25 },
  b2b_marketplace:      { arr: { low: 2.5, mid: 4.5, high: 8  }, gmv:    { low: 0.4, mid: 0.8, high: 1.6 }, rule40Premium: 0.15 },
  consumer_marketplace: { revenue: { low: 2, mid: 3.5, high: 6 }, gmv: { low: 0.2, mid: 0.5, high: 1.2 } },
  fintech_payments:     { revenue: { low: 3, mid: 6, high: 10 }, ebitda: { low: 12, mid: 18, high: 26 } },
  logistics_freight:    { revenue: { low: 0.8, mid: 1.4, high: 2.5 }, ebitda: { low: 6, mid: 9, high: 13 } },
  mobility:             { revenue: { low: 1.5, mid: 2.5, high: 4.5 }, ebitda: { low: 8, mid: 11, high: 15 } },
  ai_infra:             { arr: { low: 8, mid: 14, high: 28 }, revenue: { low: 6, mid: 10, high: 20 }, rule40Premium: 0.40, netRetentionPremium: 0.40 },
  developer_tools:      { arr: { low: 5, mid: 8, high: 14 }, ebitda: { low: 14, mid: 20, high: 30 }, rule40Premium: 0.25 },
  media_content:        { revenue: { low: 1.5, mid: 2.5, high: 4 }, ebitda: { low: 7, mid: 10, high: 15 } },
  other:                { revenue: { low: 1, mid: 2, high: 4 }, ebitda: { low: 6, mid: 10, high: 15 } },
};

// Country-by-country valuation adjustment. Multiplier applied to the
// headline range to reflect jurisdictional currency, regulatory and
// liquidity premiums/discounts. Reference values; override per deal.
export const COUNTRY_ADJUSTMENT: Record<string, number> = {
  US: 1.00, CA: 0.95, GB: 0.92, IE: 0.92,
  DE: 0.92, FR: 0.90, NL: 0.92, ES: 0.85, IT: 0.83, PT: 0.85, SE: 0.95, NO: 0.95, FI: 0.93, DK: 0.95, CH: 1.02,
  AU: 0.93, NZ: 0.90, SG: 1.00, JP: 0.95, KR: 0.85, HK: 0.97, AE: 0.95, IL: 0.92,
  BR: 0.65, MX: 0.70, CL: 0.72, AR: 0.55, CO: 0.65,
  IN: 0.80, ID: 0.70, VN: 0.65, TH: 0.72, MY: 0.70, PH: 0.65,
  ZA: 0.65, NG: 0.55, KE: 0.60, EG: 0.55,
  TR: 0.55, RU: 0.40,
};

export function countryAdjustment(jurisdiction: string): number {
  const j = jurisdiction.toUpperCase();
  return COUNTRY_ADJUSTMENT[j] ?? 0.75;
}

// Business model → sector tag default. Used when callers pass only
// businessModel and we need a multiples lookup.
export function defaultSectorForModel(model: BusinessModel): SectorTag {
  switch (model) {
    case 'saas':        return 'vertical_saas';
    case 'marketplace': return 'b2b_marketplace';
    case 'logistics':   return 'logistics_freight';
    case 'mobility':    return 'mobility';
    case 'ai_platform': return 'ai_infra';
    case 'fintech':     return 'fintech_payments';
    case 'commerce':    return 'consumer_marketplace';
    case 'media':       return 'media_content';
    case 'services':    return 'other';
    case 'other':       return 'other';
  }
}
