// ── SECTOR TAXONOMY ─────────────────────────────────────────────────
// ExitOS does not invent an industry classification. Buyers carry BOTH:
//   industry_official — the classification the source states (GICS
//     sector/sub-industry from the S&P constituent table, or the listed
//     industry text), kept verbatim;
//   sector_exitos     — the simplified ExitOS taxonomy, derived from the
//     official label by keyword rules below.
// The official label is the record; the ExitOS taxonomy is the lens.

export const EXITOS_TAXONOMY = {
  Technology: ['Software', 'AI', 'Cybersecurity', 'Developer Tools', 'Cloud Infrastructure'],
  'Financial Services': ['Fintech', 'Insurtech', 'Payments'],
  Healthcare: ['Healthcare', 'Biotech', 'Health IT'],
  Logistics: ['Logistics', 'Supply Chain', 'Transportation'],
  Industrial: ['Manufacturing', 'Industrial Tech'],
  Energy: ['Energy', 'Climate'],
  Government: ['Defense', 'GovTech'],
  Media: ['Media', 'Gaming'],
  Consumer: ['Consumer', 'Marketplace', 'Ecommerce'],
} as const;

export type ExitOsSector =
  (typeof EXITOS_TAXONOMY)[keyof typeof EXITOS_TAXONOMY][number];

export const EXITOS_SECTORS: readonly ExitOsSector[] =
  Object.values(EXITOS_TAXONOMY).flat();

// Keyword rules from official labels (GICS sectors + sub-industries,
// NAICS-style titles, Wikipedia industry text) to ExitOS sectors.
// Ordered specific → general; a label can map to several sectors.
const RULES: ReadonlyArray<readonly [ExitOsSector, RegExp]> = [
  ['Cybersecurity',        /cyber|security software|network security|identity/i],
  ['AI',                   /artificial intelligence|\bai\b|machine learning|deep learning/i],
  ['Developer Tools',      /developer|devops|software development platform|version control/i],
  ['Cloud Infrastructure', /cloud|data center|datacenter|hosting|infrastructure as a service|iaas|cdn/i],
  ['Software',             /software|saas|information technology|it services|it consulting|interactive media|internet services|search engine|operating system|enterprise/i],
  ['Payments',             /payment|transaction processing|card network|merchant/i],
  ['Insurtech',            /insurance/i],
  ['Fintech',              /fintech|financial exchanges|capital markets|bank|asset management|consumer finance|investment|lending|brokerage/i],
  ['Biotech',              /biotech|pharmaceutical|life sciences|genomics|drug/i],
  ['Health IT',            /health care technology|health information|telehealth|electronic health/i],
  ['Healthcare',           /health|hospital|medical|managed care/i],
  ['Supply Chain',         /supply chain|warehouse|fulfillment|procurement/i],
  ['Logistics',            /logistic|freight|cargo|parcel|courier|shipping/i],
  ['Transportation',       /transport|railroad|airline|trucking|maritime|automobile|automotive|mobility/i],
  ['Industrial Tech',      /industrial (tech|automation|software)|robotics|electrical equipment|machinery|semiconductors?/i],
  ['Manufacturing',        /manufactur|industrial conglomerate|aerospace components|building products|construction|chemicals|materials|steel|packaging/i],
  ['Climate',              /climate|renewable|solar|wind power|clean energy|carbon|electric vehicle/i],
  ['Energy',               /energy|oil|gas|petroleum|utilities|power generation|pipeline/i],
  ['Defense',              /defense|defence|aerospace|military|weapons/i],
  ['GovTech',              /government|public sector|civic/i],
  ['Gaming',               /gaming|video game|casino|esports/i],
  ['Media',                /media|entertainment|broadcast|publishing|streaming|advertis|telecom|movies|music|film/i],
  ['Ecommerce',            /e-?commerce|online retail|internet retail/i],
  ['Marketplace',          /marketplace|platform economy|ride.?(hail|shar)|delivery platform/i],
  ['Consumer',             /consumer|retail|restaurant|food|beverage|apparel|household|hotel|leisure|travel/i],
];

/** Map an official industry label to the ExitOS taxonomy (possibly several sectors, possibly none). */
export function mapToExitOs(official: string | undefined): ExitOsSector[] {
  if (!official) return [];
  const out: ExitOsSector[] = [];
  for (const [sector, re] of RULES) {
    if (re.test(official) && !out.includes(sector)) out.push(sector);
  }
  return out.slice(0, 3);
}
