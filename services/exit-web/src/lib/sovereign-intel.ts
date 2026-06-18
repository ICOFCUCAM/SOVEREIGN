import type { Sector } from "./company-intake";

// ── SOVEREIGN INTELLIGENCE — PRODUCT CATALOG ────────────────────────
// The Strategic Intelligence Stack, imported verbatim from the Sovereign /
// Emergency AI product surface (sovereign-os/apps/web/components/
// IntelligenceStack.tsx). These are REAL product lines: name, capability and
// the question each answers are the source's own words. They are seeded into
// the ExitOS exchange as acquisition listings owned by the admin account.
//
// Note on honesty: these products have no published financials. The listings
// built from them therefore disclose NO revenue/EBITDA — they are marked
// "financials under NDA", which is standard for an anonymized teaser. No
// figure here is invented.

export interface IntelProduct {
  readonly id: string;
  readonly tier: string;       // tier number, e.g. "01"
  readonly posture: string;    // OBSERVE | UNDERSTAND | PREDICT | ADVISE | COORDINATE
  readonly layer: string;      // tier title, used as the listing category
  readonly name: string;       // the engine / product-line name
  readonly capability: string; // what it does (source body)
  readonly answers?: string;   // the question it answers (source)
  readonly sector: Sector;     // mapped ExitOS sector for matching
}

export const SOVEREIGN_INTEL_PRODUCTS: readonly IntelProduct[] = [
  { id: "osint", tier: "01", posture: "OBSERVE", layer: "Intelligence Acquisition Layer", name: "OSINT Engine", capability: "Continuous open-source acquisition across news, government, social, blogs, public databases, financial filings and competitor surfaces.", answers: "What just changed in the world?", sector: "ai_infra" },
  { id: "media-monitoring", tier: "01", posture: "OBSERVE", layer: "Intelligence Acquisition Layer", name: "Media Monitoring Engine", capability: "Tracks mentions, narratives, sentiment, propagation velocity and influence campaigns across every relevant channel.", answers: "Who is talking? What are they saying? How fast is it spreading?", sector: "media_content" },
  { id: "stakeholder-monitoring", tier: "01", posture: "OBSERVE", layer: "Intelligence Acquisition Layer", name: "Stakeholder Monitoring Engine", capability: "Tracks investors, regulators, partners, customers, journalists and ministers under one institutional view.", answers: "Who matters? Who shifted position? Who became hostile?", sector: "ai_infra" },
  { id: "narrative-intel", tier: "02", posture: "UNDERSTAND", layer: "Intelligence Processing Layer", name: "Narrative Intelligence Engine", capability: "Builds narrative maps, influence maps and conversation clusters across the public record.", answers: "Which narratives are growing? Which are dying? Who is driving them?", sector: "ai_infra" },
  { id: "competitive-intel", tier: "02", posture: "UNDERSTAND", layer: "Intelligence Processing Layer", name: "Competitive Intelligence Engine", capability: "Watches competitor products, acquisitions, hiring, patents and partnerships under one continuous feed.", answers: "What are competitors doing? What is changing?", sector: "ai_infra" },
  { id: "strategic-signal", tier: "02", posture: "UNDERSTAND", layer: "Intelligence Processing Layer", name: "Strategic Signal Engine", capability: "Surfaces weak signals, emerging threats and emerging opportunities before they reach the institutional eye.", answers: "What is forming that we have not yet noticed?", sector: "ai_infra" },
  { id: "executive-briefing", tier: "03", posture: "ADVISE", layer: "Executive Intelligence Layer", name: "Executive Briefing Engine", capability: "Every morning: what happened, why it matters, what leadership should know. Produces CEO, minister and executive briefings on schedule.", answers: "What does the principal need to know before the day begins?", sector: "enterprise_saas" },
  { id: "risk-intel", tier: "03", posture: "ADVISE", layer: "Executive Intelligence Layer", name: "Risk Intelligence Engine", capability: "Continuous monitoring of operational, financial, political and reputational risk — with score, impact forecast and response options.", answers: "Where is exposure changing? What is the impact? What are the response options?", sector: "enterprise_saas" },
  { id: "decision-support", tier: "03", posture: "ADVISE", layer: "Executive Intelligence Layer", name: "Decision Support Engine", capability: "Leadership asks: should we do X? The system returns Option A · Option B · Option C — each carrying benefits, risks, probability and cost.", answers: "Of the available options, which carries the institutional advantage?", sector: "enterprise_saas" },
  { id: "scenario-planning", tier: "04", posture: "PREDICT", layer: "Forecasting Layer", name: "Scenario Planning Engine", capability: "What if oil rises 40%? What if a critical supplier fails? What if a cyber-attack lands tomorrow? Returns projected outcomes and mitigation plans.", answers: "How does the institution behave under stress?", sector: "ai_infra" },
  { id: "strategic-forecasting", tier: "04", posture: "PREDICT", layer: "Forecasting Layer", name: "Strategic Forecasting Engine", capability: "Forecasts markets, public sentiment, regulatory direction and operational impact across the institutional horizon.", answers: "Where is the world heading and how does the institution position?", sector: "ai_infra" },
  { id: "knowledge-graph", tier: "05", posture: "UNDERSTAND", layer: "Institutional Memory Layer", name: "Institutional Knowledge Graph", capability: "Stores campaigns, crises, decisions and outcomes — every artefact addressable, every relationship preserved.", answers: "What happened last time? What worked? What failed?", sector: "enterprise_saas" },
  { id: "lessons-learned", tier: "05", posture: "UNDERSTAND", layer: "Institutional Memory Layer", name: "Lessons Learned Engine", capability: "Automatically composes postmortems and recommendations; carries institutional memory forward into the next campaign.", answers: "What lessons did the last cycle leave us with?", sector: "enterprise_saas" },
  { id: "crisis-detection", tier: "06", posture: "COORDINATE", layer: "Crisis Command Layer", name: "Crisis Detection Engine", capability: "Continuous detection of cyber attack, media attack, disinformation, operational incidents and reputational threats — each surfaced with provenance.", answers: "What is happening to us right now, and how do we know?", sector: "enterprise_saas" },
  { id: "crisis-response", tier: "06", posture: "COORDINATE", layer: "Crisis Command Layer", name: "Crisis Response Engine", capability: "Automatically prepares the executive briefing, the press response, the stakeholder update and the action plan — every artefact under audit.", answers: "What is the institutional response, and is it defensible?", sector: "enterprise_saas" },
  { id: "mission-control", tier: "07", posture: "COORDINATE", layer: "Strategic Coordination Layer", name: "Mission Control Dashboard", capability: "Leadership sees threats, opportunities, stakeholders, markets, operations and narratives in one defensible institutional view.", answers: "What is the institutional posture, right now, across every relevant axis?", sector: "enterprise_saas" },
];

/** The platform/admin account that owns the seeded Sovereign Intelligence listings. */
export const SOVEREIGN_OWNER_ACCOUNT = "acct-admin-sovereign";

// Real published pricing for the Sovereign platform, from the source
// (sovereign-os/apps/web/lib/plans.ts — the same data sovereigndo.com renders).
// This is PLATFORM-WIDE subscription pricing across all engines — NOT a
// per-engine acquisition price. Surfaced as context only; per-product
// acquisition value remains undisclosed (under NDA) because it is not published.
export const SOVEREIGN_PLATFORM_PRICING = { evaluatorUsdMo: 0, operatorUsdMo: 490, institutionalUsdMo: 4_900 } as const;
export const SOVEREIGN_PRICING_NOTE =
  `Sovereign platform pricing (all engines) · Operator $${SOVEREIGN_PLATFORM_PRICING.operatorUsdMo.toLocaleString()}/mo · Institutional $${SOVEREIGN_PLATFORM_PRICING.institutionalUsdMo.toLocaleString()}/mo`;

