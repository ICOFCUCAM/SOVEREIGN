import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// Lightweight, dependency-free UI localization for the marketing surfaces.
// English is the source; Spanish and French are provided as accurate
// translations. The structure supports adding locales (including RTL) without
// touching components. Authenticated app strings remain English for now and can
// be migrated key-by-key.
export type Locale = "en" | "es" | "fr";
export const LOCALES: { code: Locale; label: string; dir: "ltr" | "rtl" }[] = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "nav.home": "Home",
  "nav.career": "Career",
  "nav.publishing": "Publishing",
  "nav.education": "Education",
  "nav.marketplace": "Marketplace",
  "nav.forSchools": "For Schools",
  "nav.pricing": "Pricing",
  "nav.resources": "Resources",
  "nav.signIn": "Sign In",
  "nav.getStarted": "Get Started",
  "hero.headlineA": "The operating system for",
  "hero.headlineB": "publishing & educational creation",
  "hero.sub": "Create CVs, books, storybooks, workbooks and curricula with AI — then localize into any language, publish to KDP and IngramSpark, and sell in a global marketplace. One platform, the whole journey.",
  "hero.tagline": "Create. Localize. Publish. Sell. One platform, every language.",
  "hero.ctaPrimary": "Start creating free",
  "hero.ctaSecondary": "Explore the marketplace",
  "hero.trust": "No card required · You own what you create · Cancel anytime",
  "cta.heading": "Run your whole publishing operation from one place",
  "cta.sub": "Create, localize, publish, distribute and sell — the entire journey in a single platform. Start free, own everything you make, and scale when you’re ready.",
  "cta.seePricing": "See pricing",
  "footer.tagline": "Create, publish and distribute professional documents, books and educational content — all in one platform.",
};

const es: Dict = {
  "nav.home": "Inicio",
  "nav.career": "Carrera",
  "nav.publishing": "Publicación",
  "nav.education": "Educación",
  "nav.marketplace": "Mercado",
  "nav.forSchools": "Para Escuelas",
  "nav.pricing": "Precios",
  "nav.resources": "Recursos",
  "nav.signIn": "Iniciar sesión",
  "nav.getStarted": "Comenzar",
  "hero.headlineA": "El sistema operativo para la",
  "hero.headlineB": "creación editorial y educativa",
  "hero.sub": "Crea CV, libros, cuentos, cuadernos y planes de estudio con IA; luego tradúcelos a cualquier idioma, publícalos en KDP e IngramSpark y véndelos en un mercado global. Una plataforma, todo el recorrido.",
  "hero.tagline": "Crea. Localiza. Publica. Vende. Una plataforma, todos los idiomas.",
  "hero.ctaPrimary": "Empieza gratis",
  "hero.ctaSecondary": "Explorar el mercado",
  "hero.trust": "Sin tarjeta · Eres dueño de lo que creas · Cancela cuando quieras",
  "cta.heading": "Gestiona toda tu operación editorial desde un solo lugar",
  "cta.sub": "Crea, traduce, publica, distribuye y vende: todo el recorrido en una sola plataforma. Empieza gratis, conserva todo lo que creas y crece cuando estés listo.",
  "cta.seePricing": "Ver precios",
  "footer.tagline": "Crea, publica y distribuye documentos profesionales, libros y contenido educativo, todo en una sola plataforma.",
};

const fr: Dict = {
  "nav.home": "Accueil",
  "nav.career": "Carrière",
  "nav.publishing": "Édition",
  "nav.education": "Éducation",
  "nav.marketplace": "Marché",
  "nav.forSchools": "Pour les écoles",
  "nav.pricing": "Tarifs",
  "nav.resources": "Ressources",
  "nav.signIn": "Se connecter",
  "nav.getStarted": "Commencer",
  "hero.headlineA": "Le système d’exploitation pour la",
  "hero.headlineB": "création éditoriale et éducative",
  "hero.sub": "Créez des CV, des livres, des albums, des cahiers et des programmes avec l’IA, puis traduisez-les dans n’importe quelle langue, publiez sur KDP et IngramSpark, et vendez sur un marché mondial. Une plateforme, tout le parcours.",
  "hero.tagline": "Créez. Localisez. Publiez. Vendez. Une plateforme, toutes les langues.",
  "hero.ctaPrimary": "Commencer gratuitement",
  "hero.ctaSecondary": "Explorer le marché",
  "hero.trust": "Sans carte · Vous possédez vos créations · Annulez à tout moment",
  "cta.heading": "Gérez toute votre activité éditoriale au même endroit",
  "cta.sub": "Créez, traduisez, publiez, distribuez et vendez — tout le parcours sur une seule plateforme. Commencez gratuitement, gardez tout ce que vous créez et développez-vous à votre rythme.",
  "cta.seePricing": "Voir les tarifs",
  "footer.tagline": "Créez, publiez et distribuez des documents professionnels, des livres et du contenu éducatif — le tout sur une seule plateforme.",
};

const DICTS: Record<Locale, Dict> = { en, es, fr };
const KEY = "pp_locale";

function detect(): Locale {
  try {
    const stored = localStorage.getItem(KEY) as Locale | null;
    if (stored && DICTS[stored]) return stored;
    const nav = (navigator.language || "en").slice(0, 2) as Locale;
    return DICTS[nav] ? nav : "en";
  } catch {
    return "en";
  }
}

interface Ctx { locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string }
const I18nContext = createContext<Ctx>({ locale: "en", setLocale: () => {}, t: (k) => k });

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => detect());

  useEffect(() => {
    const dir = LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
    setLocaleState(l);
  }, []);

  const t = useCallback((key: string) => DICTS[locale][key] ?? DICTS.en[key] ?? key, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
