import { countries as FLAG_CODES } from "country-flag-icons";

// ── COUNTRIES AND TERRITORIES ───────────────────────────────────────
// Every ISO 3166-1 country and territory for which a flag exists (the country-flag-icons set:
// 249 ISO codes plus a few commonly listed territories such as Kosovo), named in English by the
// browser's own CLDR data (Intl.DisplayNames). Supranational and sub-national entries (EU, England,
// Catalonia…) are left out: a seller is based in a country or territory.

const NOT_COUNTRIES = new Set(["EU"]);
const display = ((): ((code: string) => string) => {
  try { const d = new Intl.DisplayNames(["en"], { type: "region" }); return (c) => d.of(c) ?? c; } catch { return (c) => c; }
})();

export interface Country { readonly code: string; readonly name: string }

export const COUNTRIES: readonly Country[] = FLAG_CODES
  .filter((c) => /^[A-Z]{2}$/.test(c) && !NOT_COUNTRIES.has(c))
  .map((code) => ({ code, name: display(code) }))
  .filter((c) => c.name !== c.code)
  .sort((a, b) => a.name.localeCompare(b.name, "en"));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
const fold = (s: string): string => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const ALIASES: Record<string, string> = { uk: "GB", "great britain": "GB", england: "GB", usa: "US", america: "US", holland: "NL", norge: "NO", sverige: "SE", danmark: "DK", suomi: "FI", deutschland: "DE", "ivory coast": "CI", "czech republic": "CZ", burma: "MM", "south korea": "KR", "north korea": "KP", russia: "RU", uae: "AE" };

export const countryByCode = (code: string | undefined): Country | undefined => (code ? BY_CODE.get(code.toUpperCase()) : undefined);

/** A stored country (a name like "Norway", an alias like "UK", or a code like "NO") → its entry. */
export function findCountry(value: string | undefined): Country | undefined {
  const v = fold(value ?? ""); if (!v) return undefined;
  if (v.length === 2 && BY_CODE.has(v.toUpperCase())) return BY_CODE.get(v.toUpperCase());
  if (ALIASES[v]) return BY_CODE.get(ALIASES[v]);
  return COUNTRIES.find((c) => fold(c.name) === v);
}

/** Countries matching a search: names that start with it first, then names containing it, then codes. */
export function searchCountries(query: string): Country[] {
  const q = fold(query); if (!q) return [...COUNTRIES];
  const alias = ALIASES[q] ? BY_CODE.get(ALIASES[q]) : undefined;
  // the name starts with the search (shortest first: "nor" finds Norway before Norfolk Island), then a later word does, then anywhere
  const prefix = COUNTRIES.filter((c) => fold(c.name).startsWith(q)).sort((a, b) => a.name.length - b.name.length || a.name.localeCompare(b.name, "en"));
  const word = COUNTRIES.filter((c) => !prefix.includes(c) && fold(c.name).split(/[\s\-’']+/).some((w) => w.startsWith(q)));
  const seen = new Set([...prefix, ...word]);
  const contains = COUNTRIES.filter((c) => !seen.has(c) && fold(c.name).includes(q));
  contains.forEach((c) => seen.add(c));
  const code = q.length === 2 ? COUNTRIES.filter((c) => c.code === q.toUpperCase() && !seen.has(c)) : [];
  const out = [...prefix, ...word, ...contains, ...code];
  return alias ? [alias, ...out.filter((c) => c !== alias)] : out;
}

// flag files, one small SVG per country, fetched only when shown
const FLAG_URLS = import.meta.glob("/node_modules/country-flag-icons/3x2/*.svg", { query: "?url", import: "default", eager: true }) as Record<string, string>;
export const flagUrl = (code: string): string | undefined => FLAG_URLS[`/node_modules/country-flag-icons/3x2/${code.toUpperCase()}.svg`];
