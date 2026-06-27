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

const HOME: Record<string, HomeCopy> = {
  en: HOME_EN, fr: HOME_FR, es: HOME_ES, de: HOME_DE, no: HOME_NO,
  pt: HOME_PT, it: HOME_IT, nl: HOME_NL, ar: HOME_AR, ja: HOME_JA, zh: HOME_ZH,
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

const PRICING: Record<string, PricingCopy> = {
  en: PRICING_EN, fr: PRICING_FR, es: PRICING_ES, de: PRICING_DE, no: PRICING_NO,
  pt: PRICING_PT, it: PRICING_IT, nl: PRICING_NL, ar: PRICING_AR, ja: PRICING_JA, zh: PRICING_ZH,
};
export const usePricingCopy = (): PricingCopy => PRICING[useUiLocale()] || PRICING_EN;
export type { PricingCopy };
