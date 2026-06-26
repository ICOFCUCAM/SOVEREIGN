// Public marketing routes in one place. Repoint PROCUREMENT_ROUTE (e.g. to an
// external procurement portal, a form, or a mailto) without touching any
// component — the CTA reads this constant. No human contact is required to reach
// the procurement dossier today; a role-based address can be added later.
export const PROCUREMENT_ROUTE = "/procurement";
// Public pricing — packaged by institution and capability, never by seat.
// Concrete prices for the self-serve tiers; the top two route to evaluation/contact.
export const PRICING_ROUTE = "/pricing";
export const TRUST_ROUTE = "/trust";
export const ARCHITECTURE_ROUTE = "/architecture";
export const PLATFORM_ROUTE = "/platform";
export const SECURITY_ROUTE = "/security";
export const COMPLIANCE_ROUTE = "/compliance";
export const EVIDENCE_ROUTE = "/evidence";

// Category-narrative surfaces — the "why adopt" story (outcomes, the standard,
// the artifacts, the readiness path). Named here so every header and footer
// links them consistently instead of leaving them reachable only via in-body CTAs.
export const OUTCOMES_ROUTE = "/outcomes";
export const STANDARD_ROUTE = "/standard";
export const RECORDS_ROUTE = "/records";
export const JOURNEY_ROUTE = "/journey";

// Developer Platform — the public docs surface for the Dispatch Platform API
// (the engine): quickstart, SDKs, webhooks, and the live endpoint reference.
export const DEVELOPERS_ROUTE = "/developers";

// The institutional distinction, made public: what an Official Record IS, and the
// portal where anyone can verify one is genuine.
export const OFFICIAL_RECORD_ROUTE = "/official-record";
export const VERIFY_ROUTE = "/verify";
// Interactive "see a governed record" walkthrough — draft → approval → certificates → verify.
export const WALKTHROUGH_ROUTE = "/walkthrough";

// Institutional Value & Procurement Experience — the surfaces that convince an
// institution, in evaluator reading order: understand the problem (cost of an
// official publication) → understand what they're buying (the governed lifecycle)
// → model the operational case (ROI) → procure (the Procurement Center).
export const COST_ROUTE = "/cost-of-publication";
export const LIFECYCLE_ROUTE = "/lifecycle";
export const ROI_ROUTE = "/roi";
