// Message catalog registry. Maps locale → page copy and exposes hooks the pages
// use. English is always the fallback, so a page never shows an empty string.
import { HOME_EN, type HomeCopy } from "./home";
import { useUiLocale } from "../locale";

// Locale homepage copy. Each entry is a complete translation of HOME_EN.
import { HOME_FR } from "./home.fr";
import { HOME_ES } from "./home.es";
import { HOME_DE } from "./home.de";
import { HOME_NO } from "./home.no";
import { HOME_PT } from "./home.pt";
import { HOME_IT } from "./home.it";
import { HOME_NL } from "./home.nl";
import { HOME_AR } from "./home.ar";
import { HOME_JA } from "./home.ja";
import { HOME_ZH } from "./home.zh";
import { HOME_PL } from "./home.pl";
import { HOME_SV } from "./home.sv";
import { HOME_DA } from "./home.da";
import { HOME_FI } from "./home.fi";
import { HOME_EL } from "./home.el";

const HOME: Record<string, HomeCopy> = {
  en: HOME_EN, fr: HOME_FR, es: HOME_ES, de: HOME_DE, no: HOME_NO,
  pt: HOME_PT, it: HOME_IT, nl: HOME_NL, ar: HOME_AR, ja: HOME_JA, zh: HOME_ZH,
  pl: HOME_PL, sv: HOME_SV, da: HOME_DA, fi: HOME_FI, el: HOME_EL,
};

export const useHomeCopy = (): HomeCopy => HOME[useUiLocale()] || HOME_EN;
export type { HomeCopy };

// ── Pricing page ─────────────────────────────────────────────────────────────
import { PRICING_EN, type PricingCopy } from "./pricing";
import { PRICING_FR } from "./pricing.fr";
import { PRICING_ES } from "./pricing.es";
import { PRICING_DE } from "./pricing.de";
import { PRICING_NO } from "./pricing.no";
import { PRICING_PT } from "./pricing.pt";
import { PRICING_IT } from "./pricing.it";
import { PRICING_NL } from "./pricing.nl";
import { PRICING_AR } from "./pricing.ar";
import { PRICING_JA } from "./pricing.ja";
import { PRICING_ZH } from "./pricing.zh";
import { PRICING_PL } from "./pricing.pl";
import { PRICING_SV } from "./pricing.sv";
import { PRICING_DA } from "./pricing.da";
import { PRICING_FI } from "./pricing.fi";
import { PRICING_EL } from "./pricing.el";

const PRICING: Record<string, PricingCopy> = {
  en: PRICING_EN, fr: PRICING_FR, es: PRICING_ES, de: PRICING_DE, no: PRICING_NO,
  pt: PRICING_PT, it: PRICING_IT, nl: PRICING_NL, ar: PRICING_AR, ja: PRICING_JA, zh: PRICING_ZH,
  pl: PRICING_PL, sv: PRICING_SV, da: PRICING_DA, fi: PRICING_FI, el: PRICING_EL,
};
export const usePricingCopy = (): PricingCopy => PRICING[useUiLocale()] || PRICING_EN;
export type { PricingCopy };

// ── Marketing pages (Trust, Platform, Standard) ──────────────────────────────
import { MARKETING_EN, type MarketingCopy } from "./marketing";
import { MARKETING_FR } from "./marketing.fr";
import { MARKETING_ES } from "./marketing.es";
import { MARKETING_DE } from "./marketing.de";
import { MARKETING_NO } from "./marketing.no";
import { MARKETING_PT } from "./marketing.pt";
import { MARKETING_IT } from "./marketing.it";
import { MARKETING_NL } from "./marketing.nl";
import { MARKETING_AR } from "./marketing.ar";
import { MARKETING_JA } from "./marketing.ja";
import { MARKETING_ZH } from "./marketing.zh";
import { MARKETING_PL } from "./marketing.pl";
import { MARKETING_SV } from "./marketing.sv";
import { MARKETING_DA } from "./marketing.da";
import { MARKETING_FI } from "./marketing.fi";
import { MARKETING_EL } from "./marketing.el";

const MARKETING: Record<string, MarketingCopy> = {
  en: MARKETING_EN, fr: MARKETING_FR, es: MARKETING_ES, de: MARKETING_DE, no: MARKETING_NO,
  pt: MARKETING_PT, it: MARKETING_IT, nl: MARKETING_NL, ar: MARKETING_AR, ja: MARKETING_JA, zh: MARKETING_ZH,
  pl: MARKETING_PL, sv: MARKETING_SV, da: MARKETING_DA, fi: MARKETING_FI, el: MARKETING_EL,
};
export const useMarketingCopy = (): MarketingCopy => MARKETING[useUiLocale()] || MARKETING_EN;
export type { MarketingCopy };

// ── Marketing batch 2 (Outcomes, Security, Compliance) ───────────────────────
import { MARKETING2_EN, type Marketing2Copy } from "./marketing2";
import { MARKETING2_FR } from "./marketing2.fr";
import { MARKETING2_ES } from "./marketing2.es";
import { MARKETING2_DE } from "./marketing2.de";
import { MARKETING2_NO } from "./marketing2.no";
import { MARKETING2_PT } from "./marketing2.pt";
import { MARKETING2_IT } from "./marketing2.it";
import { MARKETING2_NL } from "./marketing2.nl";
import { MARKETING2_AR } from "./marketing2.ar";
import { MARKETING2_JA } from "./marketing2.ja";
import { MARKETING2_ZH } from "./marketing2.zh";
import { MARKETING2_PL } from "./marketing2.pl";
import { MARKETING2_SV } from "./marketing2.sv";
import { MARKETING2_DA } from "./marketing2.da";
import { MARKETING2_FI } from "./marketing2.fi";
import { MARKETING2_EL } from "./marketing2.el";

const MARKETING2: Record<string, Marketing2Copy> = {
  en: MARKETING2_EN, fr: MARKETING2_FR, es: MARKETING2_ES, de: MARKETING2_DE, no: MARKETING2_NO,
  pt: MARKETING2_PT, it: MARKETING2_IT, nl: MARKETING2_NL, ar: MARKETING2_AR, ja: MARKETING2_JA, zh: MARKETING2_ZH,
  pl: MARKETING2_PL, sv: MARKETING2_SV, da: MARKETING2_DA, fi: MARKETING2_FI, el: MARKETING2_EL,
};
export const useMarketing2Copy = (): Marketing2Copy => MARKETING2[useUiLocale()] || MARKETING2_EN;
export type { Marketing2Copy };

// ── Marketing batch 3 (Architecture, Developers, Official Record) ────────────
import { MARKETING3_EN, type Marketing3Copy } from "./marketing3";
import { MARKETING3_FR } from "./marketing3.fr";
import { MARKETING3_ES } from "./marketing3.es";
import { MARKETING3_DE } from "./marketing3.de";
import { MARKETING3_NO } from "./marketing3.no";
import { MARKETING3_PT } from "./marketing3.pt";
import { MARKETING3_IT } from "./marketing3.it";
import { MARKETING3_NL } from "./marketing3.nl";
import { MARKETING3_AR } from "./marketing3.ar";
import { MARKETING3_JA } from "./marketing3.ja";
import { MARKETING3_ZH } from "./marketing3.zh";
import { MARKETING3_PL } from "./marketing3.pl";
import { MARKETING3_SV } from "./marketing3.sv";
import { MARKETING3_DA } from "./marketing3.da";
import { MARKETING3_FI } from "./marketing3.fi";
import { MARKETING3_EL } from "./marketing3.el";

const MARKETING3: Record<string, Marketing3Copy> = {
  en: MARKETING3_EN, fr: MARKETING3_FR, es: MARKETING3_ES, de: MARKETING3_DE, no: MARKETING3_NO,
  pt: MARKETING3_PT, it: MARKETING3_IT, nl: MARKETING3_NL, ar: MARKETING3_AR, ja: MARKETING3_JA, zh: MARKETING3_ZH,
  pl: MARKETING3_PL, sv: MARKETING3_SV, da: MARKETING3_DA, fi: MARKETING3_FI, el: MARKETING3_EL,
};
export const useMarketing3Copy = (): Marketing3Copy => MARKETING3[useUiLocale()] || MARKETING3_EN;
export type { Marketing3Copy };

// ── Marketing batch 4 (Cost-of-Publication, Verify) ──────────────────────────
import { MARKETING4_EN, type Marketing4Copy } from "./marketing4";
import { MARKETING4_FR } from "./marketing4.fr";
import { MARKETING4_ES } from "./marketing4.es";
import { MARKETING4_DE } from "./marketing4.de";
import { MARKETING4_NO } from "./marketing4.no";
import { MARKETING4_PT } from "./marketing4.pt";
import { MARKETING4_IT } from "./marketing4.it";
import { MARKETING4_NL } from "./marketing4.nl";
import { MARKETING4_AR } from "./marketing4.ar";
import { MARKETING4_JA } from "./marketing4.ja";
import { MARKETING4_ZH } from "./marketing4.zh";
import { MARKETING4_PL } from "./marketing4.pl";
import { MARKETING4_SV } from "./marketing4.sv";
import { MARKETING4_DA } from "./marketing4.da";
import { MARKETING4_FI } from "./marketing4.fi";
import { MARKETING4_EL } from "./marketing4.el";

const MARKETING4: Record<string, Marketing4Copy> = {
  en: MARKETING4_EN, fr: MARKETING4_FR, es: MARKETING4_ES, de: MARKETING4_DE, no: MARKETING4_NO,
  pt: MARKETING4_PT, it: MARKETING4_IT, nl: MARKETING4_NL, ar: MARKETING4_AR, ja: MARKETING4_JA, zh: MARKETING4_ZH,
  pl: MARKETING4_PL, sv: MARKETING4_SV, da: MARKETING4_DA, fi: MARKETING4_FI, el: MARKETING4_EL,
};
export const useMarketing4Copy = (): Marketing4Copy => MARKETING4[useUiLocale()] || MARKETING4_EN;
export type { Marketing4Copy };

// ── Marketing batch 5 (Procurement Center) ───────────────────────────────────
import { MARKETING5_EN, type ProcurementCopy } from "./marketing5";
import { MARKETING5_FR } from "./marketing5.fr";
import { MARKETING5_ES } from "./marketing5.es";
import { MARKETING5_DE } from "./marketing5.de";
import { MARKETING5_NO } from "./marketing5.no";
import { MARKETING5_PT } from "./marketing5.pt";
import { MARKETING5_IT } from "./marketing5.it";
import { MARKETING5_NL } from "./marketing5.nl";
import { MARKETING5_AR } from "./marketing5.ar";
import { MARKETING5_JA } from "./marketing5.ja";
import { MARKETING5_ZH } from "./marketing5.zh";
import { MARKETING5_PL } from "./marketing5.pl";
import { MARKETING5_SV } from "./marketing5.sv";
import { MARKETING5_DA } from "./marketing5.da";
import { MARKETING5_FI } from "./marketing5.fi";
import { MARKETING5_EL } from "./marketing5.el";

const MARKETING5: Record<string, ProcurementCopy> = {
  en: MARKETING5_EN, fr: MARKETING5_FR, es: MARKETING5_ES, de: MARKETING5_DE, no: MARKETING5_NO,
  pt: MARKETING5_PT, it: MARKETING5_IT, nl: MARKETING5_NL, ar: MARKETING5_AR, ja: MARKETING5_JA, zh: MARKETING5_ZH,
  pl: MARKETING5_PL, sv: MARKETING5_SV, da: MARKETING5_DA, fi: MARKETING5_FI, el: MARKETING5_EL,
};
export const useProcurementCopy = (): ProcurementCopy => MARKETING5[useUiLocale()] || MARKETING5_EN;
export type { ProcurementCopy };

// ── Marketing batch 6 (Lifecycle, ROI, Evidence) ─────────────────────────────
import { MARKETING6_EN, type Marketing6Copy } from "./marketing6";
import { MARKETING6_FR } from "./marketing6.fr";
import { MARKETING6_ES } from "./marketing6.es";
import { MARKETING6_DE } from "./marketing6.de";
import { MARKETING6_NO } from "./marketing6.no";
import { MARKETING6_PT } from "./marketing6.pt";
import { MARKETING6_IT } from "./marketing6.it";
import { MARKETING6_NL } from "./marketing6.nl";
import { MARKETING6_AR } from "./marketing6.ar";
import { MARKETING6_JA } from "./marketing6.ja";
import { MARKETING6_ZH } from "./marketing6.zh";
import { MARKETING6_PL } from "./marketing6.pl";
import { MARKETING6_SV } from "./marketing6.sv";
import { MARKETING6_DA } from "./marketing6.da";
import { MARKETING6_FI } from "./marketing6.fi";
import { MARKETING6_EL } from "./marketing6.el";

const MARKETING6: Record<string, Marketing6Copy> = {
  en: MARKETING6_EN, fr: MARKETING6_FR, es: MARKETING6_ES, de: MARKETING6_DE, no: MARKETING6_NO,
  pt: MARKETING6_PT, it: MARKETING6_IT, nl: MARKETING6_NL, ar: MARKETING6_AR, ja: MARKETING6_JA, zh: MARKETING6_ZH,
  pl: MARKETING6_PL, sv: MARKETING6_SV, da: MARKETING6_DA, fi: MARKETING6_FI, el: MARKETING6_EL,
};
export const useMarketing6Copy = (): Marketing6Copy => MARKETING6[useUiLocale()] || MARKETING6_EN;
export type { Marketing6Copy };
