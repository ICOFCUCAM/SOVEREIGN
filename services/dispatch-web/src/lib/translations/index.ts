// Translation registry. Maps (locale, content-type, slug) → localized fields, and
// answers "which active locales is this page available in?" — the source of truth
// for locale-aware rendering, routing guards and hreflang.
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from "../i18n";
import { CONCEPTS_FR, type ConceptTranslation } from "./concepts.fr";
import { CONCEPTS_ES } from "./concepts.es";
import { CONCEPTS_DE } from "./concepts.de";
import { CONCEPTS_NO } from "./concepts.no";
import { CONCEPTS_PT } from "./concepts.pt";
import { CONCEPTS_IT } from "./concepts.it";
import { CONCEPTS_NL } from "./concepts.nl";
import { CONCEPTS_AR } from "./concepts.ar";
import { CONCEPTS_JA } from "./concepts.ja";
import { CONCEPTS_ZH } from "./concepts.zh";
import { CONCEPTS_PL } from "./concepts.pl";
import { CONCEPTS_SV } from "./concepts.sv";
import { CONCEPTS_DA } from "./concepts.da";
import { CONCEPTS_FI } from "./concepts.fi";
import { CONCEPTS_EL } from "./concepts.el";

const CONCEPTS: Record<string, Record<string, ConceptTranslation>> = {
  fr: CONCEPTS_FR, es: CONCEPTS_ES, de: CONCEPTS_DE, no: CONCEPTS_NO,
  pt: CONCEPTS_PT, it: CONCEPTS_IT, nl: CONCEPTS_NL, ar: CONCEPTS_AR,
  ja: CONCEPTS_JA, zh: CONCEPTS_ZH, pl: CONCEPTS_PL, sv: CONCEPTS_SV,
  da: CONCEPTS_DA, fi: CONCEPTS_FI, el: CONCEPTS_EL,
};

export const conceptTranslation = (locale: string, slug: string): ConceptTranslation | undefined =>
  locale === DEFAULT_LOCALE ? undefined : CONCEPTS[locale]?.[slug];

// Active locales in which a given concept exists (always includes the default).
export const conceptLocales = (slug: string): string[] =>
  ACTIVE_LOCALES.filter((l) => l === DEFAULT_LOCALE || !!CONCEPTS[l]?.[slug]);
