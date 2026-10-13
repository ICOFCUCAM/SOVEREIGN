// Engine codes as a reader sees them: "pe" → "PE", "private_full" → "Private · full detail",
// "seed_acquisition" → "Seed acquisition". Known codes are spelled out; anything else is sentence-cased
// with underscores as spaces, so a new code still reads as words.

const KNOWN: Record<string, string> = {
  pe: "PE", vc: "VC", loi: "LOI", nda: "NDA", cim: "CIM", spa: "SPA", arr: "ARR", ttm: "TTM", ebitda: "EBITDA",
  family_office: "Family office", sponsor: "Sponsor", strategic: "Strategic",
  private_full: "Private · full detail", public_anonymized: "Public · anonymized", unlisted: "Unlisted",
  not_ready: "Not ready", seed_acquisition: "Seed acquisition", growth_acquisition: "Growth acquisition", strategic_acquisition: "Strategic acquisition",
};

export const label = (code: string): string => {
  const k = code.trim().toLowerCase();
  if (KNOWN[k]) return KNOWN[k];
  const words = k.replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** A list of codes as one line: ["strategic", "pe", "vc"] → "Strategic · PE · VC". */
export const labels = (codes: readonly string[], sep = " · "): string => codes.map(label).join(sep);
