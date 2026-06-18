import type { Sector } from "./company-intake";

// ── SOVEREIGN — PRODUCT CATALOG ─────────────────────────────────────
// The Sovereign product estate (sovereigndo.com), transcribed verbatim from
// the published catalog: name, category, descriptor, description and the real
// deployment / infrastructure value each carries. These are seeded into the
// ExitOS exchange as acquisition listings owned by the admin account so buyers
// see the real estate immediately. Every figure here is published by the
// source — none is invented.

export interface SovereignProduct {
  readonly id: string;
  readonly name: string;
  readonly category: string;        // catalog section, e.g. "Governance"
  readonly label: string;           // the uppercase descriptor under the icon
  readonly description: string;
  readonly sector: Sector;          // mapped ExitOS sector
  readonly valueLabel?: string;     // "Deployment value" | "Est. infrastructure value"
  readonly valueText?: string;      // verbatim published value, e.g. "From $8M", "$300M–$500M", "$18M"
  readonly coverage?: readonly string[];
  readonly tags?: readonly string[];
  readonly acquisitionReadyText?: string; // featured acquisition-ready asking figure, e.g. "$5.9M"
}

export const SOVEREIGN_OWNER_ACCOUNT = "acct-admin-sovereign";

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// Relocation & logistics marketplaces — one per market, with published
// estimated infrastructure value and (where featured) an acquisition-ready ask.
const RELO: { country: string; cities: string[]; value: string; ack?: string }[] = [
  { country: "USA", cities: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix"], value: "$18M" },
  { country: "Canada", cities: ["Toronto", "Montréal", "Vancouver", "Calgary", "Ottawa"], value: "$12M" },
  { country: "UK", cities: ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"], value: "$16M" },
  { country: "France", cities: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"], value: "$14M" },
  { country: "Germany", cities: ["Berlin", "München", "Hamburg", "Frankfurt", "Köln"], value: "$18M" },
  { country: "Norway", cities: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen"], value: "$8M", ack: "$5.9M" },
  { country: "Sweden", cities: ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping"], value: "$9M" },
  { country: "Netherlands", cities: ["Amsterdam", "Rotterdam", "Den Haag", "Utrecht", "Eindhoven"], value: "$13M" },
  { country: "Denmark", cities: ["København", "Aarhus", "Odense", "Aalborg", "Esbjerg"], value: "$7M", ack: "$5M" },
  { country: "Belgium", cities: ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège"], value: "$7M", ack: "$5.5M" },
  { country: "Austria", cities: ["Wien", "Graz", "Linz", "Salzburg", "Innsbruck"], value: "$6M" },
  { country: "Switzerland", cities: ["Zürich", "Genève", "Basel", "Lausanne", "Bern"], value: "$15M" },
  { country: "Spain", cities: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Málaga"], value: "$13M" },
  { country: "Italy", cities: ["Milano", "Roma", "Torino", "Napoli", "Firenze"], value: "$14M" },
  { country: "Poland", cities: ["Warszawa", "Kraków", "Wrocław", "Łódź", "Poznań"], value: "$10M" },
  { country: "Czech Republic", cities: ["Praha", "Brno", "Ostrava", "Plzeň", "Liberec"], value: "$5M", ack: "$3.9M" },
];

const reloProducts: SovereignProduct[] = RELO.map((r) => ({
  id: slug(`${r.country}-relocation`),
  name: `${r.country} Relocation & Logistics Marketplace`,
  category: "Mobility, Transport & Logistics",
  label: "Transport & Logistics Infrastructure",
  description: `National relocation and logistics marketplace connecting ${r.country}'s residential, commercial and enterprise mobility sectors.`,
  sector: "logistics_freight",
  valueLabel: "Est. infrastructure value",
  valueText: r.value,
  coverage: r.cities,
  tags: ["Live market", "Enterprise ready", "Acquisition ready"],
  acquisitionReadyText: r.ack,
}));

const CORE: SovereignProduct[] = [
  // ── Governance ──
  { id: "civicos", name: "CivicOS", category: "Governance", label: "Sovereign Operating Infrastructure", description: "Sovereign operating infrastructure — a deployable national runtime for ministries, agencies and public services.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "From $8M" },
  { id: "national-shell", name: "National Shell", category: "Governance", label: "Sovereign Government Runtime", description: "The sovereign orchestration layer binding government into one runtime.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "$300M–$500M" },
  { id: "national-coordination-engine", name: "National Coordination Engine", category: "Governance", label: "Government Coordination Infrastructure", description: "Cross-government dependency and institutional coordination.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "From $30M" },
  { id: "treasuryos", name: "TreasuryOS", category: "Governance", label: "Sovereign Government Treasury", description: "Sovereign financial orchestration infrastructure.", sector: "fintech_payments", valueLabel: "Deployment value", valueText: "From $8M" },
  { id: "healthos", name: "HealthOS", category: "Governance", label: "Government Health Infrastructure", description: "National healthcare operational runtime.", sector: "vertical_saas", valueLabel: "Deployment value", valueText: "From $5M" },
  { id: "justiceos", name: "JusticeOS", category: "Governance", label: "Government Justice Infrastructure", description: "Judicial and constitutional operational infrastructure.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "From $5M" },
  { id: "educationos", name: "EducationOS", category: "Governance", label: "Government Education Infrastructure", description: "National education coordination infrastructure.", sector: "vertical_saas", valueLabel: "Deployment value", valueText: "From $5M" },
  { id: "transportos", name: "TransportOS", category: "Governance", label: "Government Transport Infrastructure", description: "National transport and mobility orchestration.", sector: "logistics_freight", valueLabel: "Deployment value", valueText: "From $8M" },
  { id: "emergencyos", name: "EmergencyOS", category: "Governance", label: "Government Emergency Infrastructure", description: "National emergency response and crisis coordination runtime.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "From $10M" },
  { id: "policeos", name: "PoliceOS", category: "Governance", label: "Government Public Safety Infrastructure", description: "National law enforcement operational infrastructure.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "From $8M" },
  { id: "anti-corruption-intelligence-os", name: "Anti-Corruption Intelligence OS", category: "Governance", label: "Government Anti-Corruption Intelligence", description: "AI-native anti-corruption operational intelligence.", sector: "ai_infra", valueLabel: "Deployment value", valueText: "From $10M" },
  { id: "act-anti-corruption-tower", name: "ACT — Anti-Corruption Tower", category: "Governance", label: "Governance Integrity", description: "Institutional integrity, instrumented.", sector: "ai_infra" },

  // ── Finance ──
  { id: "veritas-financial-sovereign-stack", name: "Veritas Financial Sovereign Stack", category: "Finance", label: "Financial Infrastructure for Civilisations", description: "Treasury, monetary, settlement, banking and reserve infrastructure operated at civilisation scale.", sector: "fintech_payments", valueLabel: "Deployment value", valueText: "$50M–$200M" },
  { id: "mobile-pay", name: "Mobile Pay", category: "Finance", label: "Sovereign Payments & Banking", description: "A national mobile-money network in a box.", sector: "fintech_payments" },

  // ── Mobility, Transport & Logistics (marquees) ──
  { id: "flytgo", name: "FlytGo", category: "Mobility, Transport & Logistics", label: "Global Logistics & Transport Marketplace", description: "The global logistics & transport marketplace.", sector: "logistics_freight" },
  { id: "flytgo-norway", name: "FlytGo Norway", category: "Mobility, Transport & Logistics", label: "Transport & Logistics Infrastructure", description: "Norway's moving & transport marketplace.", sector: "logistics_freight" },

  // ── Intelligence ──
  { id: "veritas-os", name: "Veritas OS", category: "Intelligence", label: "Knowledge & Organizational Intelligence Infrastructure", description: "Knowledge and organizational intelligence infrastructure — organisational memory, knowledge graph and institutional reasoning.", sector: "ai_infra", valueLabel: "Deployment value", valueText: "$5M–$12M" },
  { id: "emergency-ai", name: "Emergency AI", category: "Intelligence", label: "Strategic Intelligence Infrastructure", description: "Intelligence acquisition, strategic analysis and institutional intelligence generation. Briefings, narrative and decision support.", sector: "ai_infra", valueLabel: "Deployment value", valueText: "$8M–$15M" },

  // ── Elections ──
  { id: "elecpro", name: "ELECPRO", category: "Elections", label: "Sovereign Electoral Infrastructure", description: "Registration, ballot, tabulation, observation and electoral-cycle dispatch — operated under one runtime.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "$20M–$50M" },

  // ── Education ──
  { id: "edupro", name: "EduPro", category: "Education", label: "Education & Credentialing", description: "A nation's learning backbone.", sector: "vertical_saas" },
  { id: "futech", name: "FUTech", category: "Education", label: "Academic & Education Platform", description: "Transforming university administration.", sector: "vertical_saas", valueLabel: "Deployment value", valueText: "From $80K" },

  // ── Commerce ──
  { id: "marketplace-infrastructure", name: "Marketplace Infrastructure", category: "Commerce", label: "Commerce & Marketplace", description: "Multi-vendor commerce, ready to run.", sector: "b2b_marketplace" },

  // ── Operations ──
  { id: "exitos", name: "ExitOS", category: "Operations", label: "Founder Acquisition Infrastructure", description: "The operating system founders interact with to run an exit — from sourcing to closed deal, on one runtime.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "$4M–$8M" },
  { id: "veritas-operations", name: "Veritas Operations", category: "Operations", label: "Autonomous Company Operations Infrastructure", description: "Operational management, workflow orchestration, accounting intelligence and autonomous company operations.", sector: "enterprise_saas", valueLabel: "Deployment value", valueText: "$25M–$80M" },
  { id: "sovereign-dispatch", name: "Sovereign Dispatch", category: "Operations", label: "Institutional Publication Infrastructure", description: "Institutional publication infrastructure — PDF, DOCX, PPTX, briefing packages and board reports.", sector: "media_content", valueLabel: "Deployment value", valueText: "$6M–$15M" },
  { id: "deployment-engine", name: "Deployment Engine", category: "Operations", label: "Sovereign Deployment Infrastructure", description: "From acquisition to live, automatically.", sector: "developer_tools" },
];

export const SOVEREIGN_PRODUCTS: readonly SovereignProduct[] = [...CORE, ...reloProducts];
