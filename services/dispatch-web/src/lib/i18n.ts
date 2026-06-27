// Internationalization foundation. Real localized content — one version per
// language, not browser translation. A page exists in a locale only when a real
// translation exists (so hreflang never lies and there is no duplicate content).
//
// Strategy: locale-prefixed paths with a stable slug (`/fr/learn/<slug>`), the
// English default served at the root. This file owns the locale registry, the
// path helpers, the chrome dictionary, and the hreflang builder. Content
// translations live in lib/translations.*.ts.

export interface Locale { code: string; name: string; native: string; dir: "ltr" | "rtl"; }

// The full target set (mirrors services/content-engine LOCALES).
export const LOCALES: Locale[] = [
  { code: "en", name: "English", native: "English", dir: "ltr" },
  { code: "fr", name: "French", native: "Français", dir: "ltr" },
  { code: "es", name: "Spanish", native: "Español", dir: "ltr" },
  { code: "de", name: "German", native: "Deutsch", dir: "ltr" },
  { code: "ar", name: "Arabic", native: "العربية", dir: "rtl" },
  { code: "pt", name: "Portuguese", native: "Português", dir: "ltr" },
  { code: "no", name: "Norwegian", native: "Norsk", dir: "ltr" },
  { code: "nl", name: "Dutch", native: "Nederlands", dir: "ltr" },
  { code: "it", name: "Italian", native: "Italiano", dir: "ltr" },
  { code: "ja", name: "Japanese", native: "日本語", dir: "ltr" },
  { code: "zh", name: "Chinese", native: "中文", dir: "ltr" },
];

export const DEFAULT_LOCALE = "en";
// Locales that are actually live (have real content). Activated as translations
// land — this is the only switch that exposes a language. hreflang & sitemaps
// derive from it, so nothing is advertised before it exists.
export const ACTIVE_LOCALES = ["en", "fr", "es", "de"];

// Derive the active locale from a path's first segment (en if none/inactive).
export const localeFromPath = (pathname: string): string => {
  const seg = pathname.split("/").filter(Boolean)[0];
  return seg && ACTIVE_LOCALES.includes(seg) && seg !== DEFAULT_LOCALE ? seg : DEFAULT_LOCALE;
};

export const isLocale = (c?: string): boolean => !!c && LOCALES.some((l) => l.code === c);
export const isActiveLocale = (c?: string): boolean => !!c && ACTIVE_LOCALES.includes(c);
export const localeOf = (code: string): Locale => LOCALES.find((l) => l.code === code) || LOCALES[0];

// Build a path for a locale: en stays at root, others are prefixed.
export const localePath = (locale: string, path: string): string => {
  const clean = "/" + path.replace(/^\/+/, "");
  return locale === DEFAULT_LOCALE ? clean : `/${locale}${clean === "/" ? "" : clean}`;
};

// hreflang alternates for a page given the set of locales it exists in.
export const hreflangAlternates = (path: string, availableLocales: string[]): { hreflang: string; href: string }[] => {
  const origin = "https://dispatch.sovereigndo.com";
  const alts = availableLocales.filter(isActiveLocale).map((code) => ({ hreflang: code, href: origin + localePath(code, path) }));
  if (availableLocales.includes(DEFAULT_LOCALE)) alts.push({ hreflang: "x-default", href: origin + localePath(DEFAULT_LOCALE, path) });
  return alts;
};

// --- chrome dictionary (UI strings) ------------------------------------------
type Dict = Record<string, string>;
const CHROME: Record<string, Dict> = {
  en: {
    "cta.evaluate": "Begin your evaluation", "cta.verify": "Verify a record", "cta.procurement": "Procurement materials", "cta.seeInAction": "See it in action",
    "concept.definition": "Definition", "concept.why": "Why it matters", "concept.how": "How Sovereign Dispatch handles it",
    "concept.faq": "Common questions", "concept.related": "Related concepts", "concept.applies": "Where this applies",
    "nav.learn": "Learn", "lang.label": "Language", "lang.readIn": "Read this in",
    "nav.platform": "Platform", "nav.standard": "Standard", "nav.trust": "Trust",
    "nav.developers": "Developers", "nav.pricing": "Pricing", "nav.verify": "Verify",
    "nav.outcomes": "Outcomes", "cta.launch": "Launch Dispatch", "cta.launchShort": "Launch", "nav.menu": "Menu", "nav.procurement": "Procurement",
  },
  fr: {
    "cta.evaluate": "Commencer votre évaluation", "cta.verify": "Vérifier un acte", "cta.procurement": "Documents d'achat", "cta.seeInAction": "Voir en action",
    "concept.definition": "Définition", "concept.why": "Pourquoi c'est important", "concept.how": "Comment Sovereign Dispatch le gère",
    "concept.faq": "Questions fréquentes", "concept.related": "Concepts liés", "concept.applies": "Où cela s'applique",
    "nav.learn": "Comprendre", "lang.label": "Langue", "lang.readIn": "Lire ceci en",
    "nav.platform": "Plateforme", "nav.standard": "Norme", "nav.trust": "Confiance",
    "nav.developers": "Développeurs", "nav.pricing": "Tarifs", "nav.verify": "Vérifier",
    "nav.outcomes": "Résultats", "cta.launch": "Lancer Dispatch", "cta.launchShort": "Lancer", "nav.menu": "Menu", "nav.procurement": "Achats",
  },
  es: {
    "cta.evaluate": "Comience su evaluación", "cta.verify": "Verificar un registro", "cta.procurement": "Documentación de adquisición", "cta.seeInAction": "Véalo en acción",
    "concept.definition": "Definición", "concept.why": "Por qué es importante", "concept.how": "Cómo lo gestiona Sovereign Dispatch",
    "concept.faq": "Preguntas frecuentes", "concept.related": "Conceptos relacionados", "concept.applies": "Dónde se aplica",
    "nav.learn": "Aprender", "lang.label": "Idioma", "lang.readIn": "Leer esto en",
    "nav.platform": "Plataforma", "nav.standard": "Norma", "nav.trust": "Confianza",
    "nav.developers": "Desarrolladores", "nav.pricing": "Precios", "nav.verify": "Verificar",
    "nav.outcomes": "Resultados", "cta.launch": "Iniciar Dispatch", "cta.launchShort": "Iniciar", "nav.menu": "Menú", "nav.procurement": "Adquisición",
  },
  de: {
    "cta.evaluate": "Bewertung beginnen", "cta.verify": "Datensatz prüfen", "cta.procurement": "Beschaffungsunterlagen", "cta.seeInAction": "In Aktion sehen",
    "concept.definition": "Definition", "concept.why": "Warum es wichtig ist", "concept.how": "Wie Sovereign Dispatch dies handhabt",
    "concept.faq": "Häufige Fragen", "concept.related": "Verwandte Begriffe", "concept.applies": "Wo dies gilt",
    "nav.learn": "Wissen", "lang.label": "Sprache", "lang.readIn": "Lesen Sie dies auf",
    "nav.platform": "Plattform", "nav.standard": "Standard", "nav.trust": "Vertrauen",
    "nav.developers": "Entwickler", "nav.pricing": "Preise", "nav.verify": "Verifizieren",
    "nav.outcomes": "Ergebnisse", "cta.launch": "Dispatch starten", "cta.launchShort": "Starten", "nav.menu": "Menü", "nav.procurement": "Beschaffung",
  },
};
export const t = (locale: string, key: string): string => (CHROME[locale] && CHROME[locale][key]) || CHROME.en[key] || key;
