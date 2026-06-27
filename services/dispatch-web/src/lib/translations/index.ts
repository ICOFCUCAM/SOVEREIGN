// Translation registry. Maps (locale, content-type, slug) → localized fields, and
// answers "which active locales is this page available in?" — the source of truth
// for locale-aware rendering, routing guards and hreflang.
import { ACTIVE_LOCALES, DEFAULT_LOCALE } from "../i18n";
import { CONCEPTS_FR, type ConceptTranslation } from "./concepts.fr";
import { CONCEPTS_ES } from "./concepts.es";
import { CONCEPTS_DE } from "./concepts.de";

const CONCEPTS: Record<string, Record<string, ConceptTranslation>> = { fr: CONCEPTS_FR, es: CONCEPTS_ES, de: CONCEPTS_DE };

export const conceptTranslation = (locale: string, slug: string): ConceptTranslation | undefined =>
  locale === DEFAULT_LOCALE ? undefined : CONCEPTS[locale]?.[slug];

// Active locales in which a given concept exists (always includes the default).
export const conceptLocales = (slug: string): string[] =>
  ACTIVE_LOCALES.filter((l) => l === DEFAULT_LOCALE || !!CONCEPTS[l]?.[slug]);
