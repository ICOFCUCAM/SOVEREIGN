// ── GEOGRAPHY → REGION ──────────────────────────────────────────────
// Maps the free-text country names the registries carry ("United States",
// "United Kingdom", …) to coarse regions so the Knowledge Graph can answer
// "… in Europe …" and the Market Map can cluster by region. Pure data, no
// invention — an unmapped country falls to "Other", never a guess.

export type Region =
  | 'North America' | 'Europe' | 'Asia' | 'Middle East'
  | 'Oceania' | 'Latin America' | 'Africa' | 'Other';

const REGION_OF: Record<string, Region> = {
  'united states': 'North America', usa: 'North America', us: 'North America', canada: 'North America',
  'united kingdom': 'Europe', uk: 'Europe', england: 'Europe', germany: 'Europe', france: 'Europe',
  netherlands: 'Europe', ireland: 'Europe', sweden: 'Europe', switzerland: 'Europe', spain: 'Europe',
  italy: 'Europe', finland: 'Europe', denmark: 'Europe', norway: 'Europe', belgium: 'Europe',
  austria: 'Europe', poland: 'Europe', portugal: 'Europe', luxembourg: 'Europe', estonia: 'Europe',
  china: 'Asia', japan: 'Asia', india: 'Asia', singapore: 'Asia', 'south korea': 'Asia', korea: 'Asia',
  'hong kong': 'Asia', taiwan: 'Asia', indonesia: 'Asia', vietnam: 'Asia', thailand: 'Asia', malaysia: 'Asia',
  israel: 'Middle East', 'united arab emirates': 'Middle East', uae: 'Middle East', 'saudi arabia': 'Middle East', qatar: 'Middle East',
  australia: 'Oceania', 'new zealand': 'Oceania',
  brazil: 'Latin America', mexico: 'Latin America', argentina: 'Latin America', chile: 'Latin America', colombia: 'Latin America',
  'south africa': 'Africa', nigeria: 'Africa', kenya: 'Africa', egypt: 'Africa',
  // ISO 3166 alpha-2 codes (company jurisdictions are stored as codes)
  ca: 'North America', mx: 'Latin America',
  gb: 'Europe', de: 'Europe', fr: 'Europe', nl: 'Europe', ie: 'Europe', se: 'Europe',
  ch: 'Europe', es: 'Europe', it: 'Europe', dk: 'Europe', no: 'Europe', fi: 'Europe',
  be: 'Europe', at: 'Europe', pl: 'Europe', pt: 'Europe',
  cn: 'Asia', jp: 'Asia', in: 'Asia', sg: 'Asia', kr: 'Asia', hk: 'Asia', tw: 'Asia',
  id: 'Asia', vn: 'Asia', th: 'Asia', my: 'Asia',
  il: 'Middle East', ae: 'Middle East', sa: 'Middle East', qa: 'Middle East',
  au: 'Oceania', nz: 'Oceania',
  br: 'Latin America', ar: 'Latin America', cl: 'Latin America', co: 'Latin America',
  za: 'Africa', ng: 'Africa', ke: 'Africa', eg: 'Africa',
};

export function regionOf(country: string | null | undefined): Region {
  if (!country) return 'Other';
  const k = country.toLowerCase().trim();
  if (REGION_OF[k]) return REGION_OF[k];
  // tolerate "X, United States" style cells — match the last segment
  const tail = k.split(',').pop()!.trim();
  return REGION_OF[tail] ?? 'Other';
}

export const ALL_REGIONS: readonly Region[] = [
  'North America', 'Europe', 'Asia', 'Middle East', 'Oceania', 'Latin America', 'Africa', 'Other',
];
