// Value-page copy catalog. English stays in lib/value.ts (the structural source
// of truth); each locale file overrides only the human-readable text, keyed by
// slug, plus the page chrome. Missing locales or missing fields fall back to
// English, so a page never renders an empty string.
import { VALUE, type ValueItem } from "../value";
import { useUiLocale } from "../locale";

import { VALUE_FR } from "./value.fr";
import { VALUE_ES } from "./value.es";
import { VALUE_DE } from "./value.de";
import { VALUE_NO } from "./value.no";
import { VALUE_PT } from "./value.pt";
import { VALUE_IT } from "./value.it";
import { VALUE_NL } from "./value.nl";
import { VALUE_AR } from "./value.ar";
import { VALUE_JA } from "./value.ja";
import { VALUE_ZH } from "./value.zh";
import { VALUE_PL } from "./value.pl";
import { VALUE_SV } from "./value.sv";
import { VALUE_DA } from "./value.da";
import { VALUE_FI } from "./value.fi";
import { VALUE_EL } from "./value.el";

export interface ValueText {
  title: string; teaser: string; lead: string;
  listTitle?: string; list?: string[]; body: string[]; caveat?: string;
}
export interface ValueChrome { eyebrow: string; back: string; others: string }
export interface ValueLocale { chrome: ValueChrome; items: Record<string, ValueText> }

const EN_CHROME: ValueChrome = {
  eyebrow: "Financial value",
  back: "Back to overview",
  others: "The other ways Dispatch creates value",
};

const CATALOG: Record<string, ValueLocale> = {
  fr: VALUE_FR, es: VALUE_ES, de: VALUE_DE, no: VALUE_NO, pt: VALUE_PT,
  it: VALUE_IT, nl: VALUE_NL, ar: VALUE_AR, ja: VALUE_JA, zh: VALUE_ZH,
  pl: VALUE_PL, sv: VALUE_SV, da: VALUE_DA, fi: VALUE_FI, el: VALUE_EL,
};

/** Localized value items + page chrome for the active locale (EN fallback). */
export const useLocalizedValue = (): { chrome: ValueChrome; items: ValueItem[] } => {
  const locale = useUiLocale();
  const cat = CATALOG[locale];
  const items = VALUE.map((v) => ({ ...v, ...(cat?.items[v.slug] ?? {}) }));
  return { chrome: cat?.chrome ?? EN_CHROME, items };
};
