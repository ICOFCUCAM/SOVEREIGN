// Sovereign Dispatch — clearance enforcement (activates the inert clearance
// fields; part of the classification story / R-P1-3 governance).
//
// Rule: a principal may read a classified artifact/job/document only if its
// clearance rank >= the document's classification level rank, within the
// document's classification SCHEME. Absent/unknown clearance = lowest tier.
// "none"/"corporate" non-sensitive levels are readable by anyone in-tenant
// (tenant RLS already isolates them). Enforcement is OFF by default and enabled
// with DISPATCH_ENFORCE_CLEARANCE=1 so existing single-clearance deployments are
// unaffected until they opt in.
//
// Levels are free-text per scheme (DDM keeps `level` open), so we rank by a
// per-scheme ladder and normalize case/spacing/`-`/`_`.

// Per-scheme ladders. Rank 0 == non-sensitive (no clearance needed). The
// non-sensitive synonyms none/unclassified/public all map to rank 0 regardless
// of scheme so an UNCLASSIFIED doc is always open in-tenant.
const LADDERS = {
  uk_gov:    ["official", "official_sensitive", "secret", "top_secret"],
  nato:      ["restricted", "confidential", "secret", "cosmic_top_secret"],
  corporate: ["internal", "confidential", "restricted"],
  none:      [],
};
const UNCLASSIFIED = new Set(["", "none", "unclassified", "public"]);

function norm(s) {
  return String(s ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

// Rank a level within a scheme. Non-sensitive synonyms → 0. A level in the
// scheme's ladder → 1..N (ascending sensitivity). Unknown level in a known
// scheme → most restrictive (fail-safe). Unknown scheme → 0 only if a
// non-sensitive synonym, else most restrictive.
function levelRank(scheme, level) {
  const lv = norm(level);
  if (UNCLASSIFIED.has(lv)) return 0;
  const lad = LADDERS[norm(scheme)];
  if (!lad) return 99; // unknown scheme + sensitive-looking level → most restrictive
  const i = lad.indexOf(lv);
  return i >= 0 ? i + 1 : 99; // +1 so rank 0 stays reserved for non-sensitive
}

export function clearanceEnforced() {
  return process.env.DISPATCH_ENFORCE_CLEARANCE === "1";
}

/** Is a level non-sensitive (no clearance needed)? */
export function isUnclassified(scheme, level) {
  return levelRank(scheme, level) === 0;
}

/**
 * Decide whether a principal clearance may read a document classification.
 * @param {string} clearance  principal clearance (e.g. "secret", "official", "none")
 * @param {{scheme?:string, level?:string}} classification  doc classification
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function clearanceAllows(clearance, classification = {}) {
  if (!clearanceEnforced()) return { allowed: true };
  const scheme = classification.scheme || "none";
  const docRank = levelRank(scheme, classification.level);
  if (docRank === 0) return { allowed: true }; // unclassified-equivalent: tenant RLS suffices
  // Principal clearance is ranked in the DOCUMENT's scheme (clearance values are
  // issued per scheme). Absent clearance → rank 0 (lowest).
  const princRank = clearance ? levelRank(scheme, clearance) : 0;
  if (princRank >= docRank) return { allowed: true };
  return { allowed: false, reason: `clearance '${clearance || "none"}' below '${classification.level}' (${scheme})` };
}

export const _ladders = LADDERS;
