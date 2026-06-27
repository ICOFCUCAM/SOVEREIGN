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
