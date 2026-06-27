// Automatic locale detection + the UI-locale context.
//
// Priority (per the product rule): an explicit choice the visitor made always
// wins; otherwise the BROWSER language leads; then COUNTRY (inferred from the
// timezone, since the browser exposes no country directly); finally English.
// So a visitor in China gets Chinese — unless their browser language says
// otherwise, which takes precedence.
//
// Honest by design: detection only ever selects an ACTIVE locale (one with real
// content). It localises the chrome everywhere and auto-serves a localized page
// where one exists; it never fabricates a localized URL for untranslated content.
import React from "react";
import { useLocation } from "react-router-dom";
import { ACTIVE_LOCALES, DEFAULT_LOCALE, localeFromPath, localeOf } from "./i18n";

const STORAGE_KEY = "sd.locale";

// Normalise a BCP-47 browser tag to one of our locale codes (or null).
// Handles the cases where the language code differs from ours (Norwegian
// Bokmål/Nynorsk → no; any Chinese/Portuguese/… regional variant → base code).
const LANG_ALIAS: Record<string, string> = { nb: "no", nn: "no", nob: "no", nno: "no" };
export const normalizeLang = (tag?: string): string | null => {
  if (!tag) return null;
  const base = tag.toLowerCase().split("-")[0];
  const code = LANG_ALIAS[base] || base;
  return ACTIVE_LOCALES.includes(code) ? code : null;
};

// Representative timezone → locale, used only as a COUNTRY fallback when the
// browser language doesn't resolve to an active locale.
const TZ_LOCALE: Record<string, string> = {
  "Asia/Shanghai": "zh", "Asia/Urumqi": "zh", "Asia/Chongqing": "zh", "Asia/Harbin": "zh", "Asia/Hong_Kong": "zh", "Asia/Macau": "zh", "Asia/Taipei": "zh",
  "Asia/Tokyo": "ja",
  "Europe/Oslo": "no",
  "Europe/Berlin": "de", "Europe/Vienna": "de", "Europe/Zurich": "de",
  "Europe/Paris": "fr",
  "Europe/Madrid": "es", "America/Mexico_City": "es", "America/Bogota": "es", "America/Lima": "es", "America/Argentina/Buenos_Aires": "es", "America/Santiago": "es",
  "Europe/Lisbon": "pt", "America/Sao_Paulo": "pt",
  "Europe/Rome": "it",
  "Europe/Amsterdam": "nl",
  "Asia/Riyadh": "ar", "Asia/Dubai": "ar", "Africa/Cairo": "ar", "Asia/Baghdad": "ar", "Asia/Qatar": "ar", "Asia/Kuwait": "ar", "Africa/Casablanca": "ar", "Asia/Amman": "ar", "Asia/Beirut": "ar",
};

const detectBrowserLocale = (): string | null => {
  if (typeof navigator === "undefined") return null;
  const tags = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean) as string[];
  for (const tag of tags) { const c = normalizeLang(tag); if (c) return c; }
  return null;
};

const detectCountryLocale = (): string | null => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const c = tz && TZ_LOCALE[tz];
    return c && ACTIVE_LOCALES.includes(c) ? c : null;
  } catch { return null; }
};

const getStored = (): string | null => {
  try { const v = localStorage.getItem(STORAGE_KEY); return v && ACTIVE_LOCALES.includes(v) ? v : null; } catch { return null; }
};
const setStored = (code: string) => { try { localStorage.setItem(STORAGE_KEY, code); } catch { /* ignore */ } };

// The visitor's preferred locale: explicit choice → browser → country → English.
export const detectPreferredLocale = (): string =>
  getStored() || detectBrowserLocale() || detectCountryLocale() || DEFAULT_LOCALE;

// Why a locale was chosen — surfaced for transparency / debugging.
export const localeSource = (): "chosen" | "browser" | "country" | "default" => {
  if (getStored()) return "chosen";
  if (detectBrowserLocale()) return "browser";
  if (detectCountryLocale()) return "country";
  return "default";
};

interface LocaleCtx { uiLocale: string; preferred: string; setLocale: (code: string) => void; }
const Ctx = React.createContext<LocaleCtx>({ uiLocale: DEFAULT_LOCALE, preferred: DEFAULT_LOCALE, setLocale: () => {} });

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  const [preferred, setPreferred] = React.useState<string>(() => detectPreferredLocale());
  const setLocale = React.useCallback((code: string) => { if (ACTIVE_LOCALES.includes(code)) { setStored(code); setPreferred(code); } }, []);
  // When the URL carries an explicit locale prefix, that IS the content locale
  // and wins for the chrome too; otherwise the chrome follows the preference.
  const pathLocale = localeFromPath(pathname);
  const uiLocale = pathLocale !== DEFAULT_LOCALE ? pathLocale : preferred;
  // The document language/direction follows the rendered locale, so screen
  // readers and the layout (RTL for Arabic) match what the visitor actually sees.
  React.useEffect(() => {
    document.documentElement.lang = uiLocale;
    document.documentElement.dir = localeOf(uiLocale).dir;
  }, [uiLocale]);
  const value = React.useMemo(() => ({ uiLocale, preferred, setLocale }), [uiLocale, preferred, setLocale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

// The locale to render chrome in (header, footer, CTAs, language menu).
export const useUiLocale = (): string => React.useContext(Ctx).uiLocale;
// The persisted preference + setter (the language menu writes through this).
export const usePreferredLocale = (): { preferred: string; setLocale: (c: string) => void } => {
  const { preferred, setLocale } = React.useContext(Ctx);
  return { preferred, setLocale };
};
