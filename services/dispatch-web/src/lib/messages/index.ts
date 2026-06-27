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
