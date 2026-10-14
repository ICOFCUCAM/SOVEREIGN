import type { Sector } from "./company-intake";
import type { ListingFacts, Stage, ForSale, Model, AskingMode } from "./listing-facts";
import type { Region } from "@exit/engines";

// ── SOVEREIGN — PRODUCT CATALOG ─────────────────────────────────────
// The Sovereign product estate (sovereigndo.com), transcribed verbatim from
// the published catalog: name, category, descriptor, description and the real
// deployment / infrastructure value each carries. These are seeded into the
// ExitOS exchange as acquisition listings owned by the admin account so buyers
// see the real estate immediately. Every figure here is published by the
// source — none is invented. The portfolio companies at the end come from
// each product's own repository and carry no value.

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
  readonly facts?: ListingFacts;          // the buyer-facing facts every listing card carries
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
  { id: "sovereign-dispatch", name: "Sovereign Dispatch", category: "Operations", label: "Institutional Trust Infrastructure", description: "Institutional trust infrastructure — governed, certified and permanently verifiable official records.", sector: "media_content", valueLabel: "Deployment value", valueText: "$6M–$15M" },
  { id: "deployment-engine", name: "Deployment Engine", category: "Operations", label: "Sovereign Deployment Infrastructure", description: "From acquisition to live, automatically.", sector: "developer_tools" },

  // ── Strategic Intelligence Stack (restored) ──
  // The 16 engines of the Emergency AI intelligence stack, from sovereign-os (apps/web/components/
  // IntelligenceStack.tsx), as first listed on the exchange in June 2026: name, capability and the
  // question each answers are the source's own words.
  { id: "osint", name: "OSINT Engine", category: "Strategic Intelligence", label: "Tier 01 · Observe · Intelligence Acquisition Layer", description: "Continuous open-source acquisition across news, government, social, blogs, public databases, financial filings and competitor surfaces. It answers: What just changed in the world?", sector: "ai_infra" },
  { id: "media-monitoring", name: "Media Monitoring Engine", category: "Strategic Intelligence", label: "Tier 01 · Observe · Intelligence Acquisition Layer", description: "Tracks mentions, narratives, sentiment, propagation velocity and influence campaigns across every relevant channel. It answers: Who is talking? What are they saying? How fast is it spreading?", sector: "media_content" },
  { id: "stakeholder-monitoring", name: "Stakeholder Monitoring Engine", category: "Strategic Intelligence", label: "Tier 01 · Observe · Intelligence Acquisition Layer", description: "Tracks investors, regulators, partners, customers, journalists and ministers under one institutional view. It answers: Who matters? Who shifted position? Who became hostile?", sector: "ai_infra" },
  { id: "narrative-intel", name: "Narrative Intelligence Engine", category: "Strategic Intelligence", label: "Tier 02 · Understand · Intelligence Processing Layer", description: "Builds narrative maps, influence maps and conversation clusters across the public record. It answers: Which narratives are growing? Which are dying? Who is driving them?", sector: "ai_infra" },
  { id: "competitive-intel", name: "Competitive Intelligence Engine", category: "Strategic Intelligence", label: "Tier 02 · Understand · Intelligence Processing Layer", description: "Watches competitor products, acquisitions, hiring, patents and partnerships under one continuous feed. It answers: What are competitors doing? What is changing?", sector: "ai_infra" },
  { id: "strategic-signal", name: "Strategic Signal Engine", category: "Strategic Intelligence", label: "Tier 02 · Understand · Intelligence Processing Layer", description: "Surfaces weak signals, emerging threats and emerging opportunities before they reach the institutional eye. It answers: What is forming that we have not yet noticed?", sector: "ai_infra" },
  { id: "executive-briefing", name: "Executive Briefing Engine", category: "Strategic Intelligence", label: "Tier 03 · Advise · Executive Intelligence Layer", description: "Every morning: what happened, why it matters, what leadership should know. Produces CEO, minister and executive briefings on schedule. It answers: What does the principal need to know before the day begins?", sector: "enterprise_saas" },
  { id: "risk-intel", name: "Risk Intelligence Engine", category: "Strategic Intelligence", label: "Tier 03 · Advise · Executive Intelligence Layer", description: "Continuous monitoring of operational, financial, political and reputational risk — with score, impact forecast and response options. It answers: Where is exposure changing? What is the impact? What are the response options?", sector: "enterprise_saas" },
  { id: "decision-support", name: "Decision Support Engine", category: "Strategic Intelligence", label: "Tier 03 · Advise · Executive Intelligence Layer", description: "Leadership asks: should we do X? The system returns Option A · Option B · Option C — each carrying benefits, risks, probability and cost. It answers: Of the available options, which carries the institutional advantage?", sector: "enterprise_saas" },
  { id: "scenario-planning", name: "Scenario Planning Engine", category: "Strategic Intelligence", label: "Tier 04 · Predict · Forecasting Layer", description: "What if oil rises 40%? What if a critical supplier fails? What if a cyber-attack lands tomorrow? Returns projected outcomes and mitigation plans. It answers: How does the institution behave under stress?", sector: "ai_infra" },
  { id: "strategic-forecasting", name: "Strategic Forecasting Engine", category: "Strategic Intelligence", label: "Tier 04 · Predict · Forecasting Layer", description: "Forecasts markets, public sentiment, regulatory direction and operational impact across the institutional horizon. It answers: Where is the world heading and how does the institution position?", sector: "ai_infra" },
  { id: "knowledge-graph", name: "Institutional Knowledge Graph", category: "Strategic Intelligence", label: "Tier 05 · Understand · Institutional Memory Layer", description: "Stores campaigns, crises, decisions and outcomes — every artefact addressable, every relationship preserved. It answers: What happened last time? What worked? What failed?", sector: "enterprise_saas" },
  { id: "lessons-learned", name: "Lessons Learned Engine", category: "Strategic Intelligence", label: "Tier 05 · Understand · Institutional Memory Layer", description: "Automatically composes postmortems and recommendations; carries institutional memory forward into the next campaign. It answers: What lessons did the last cycle leave us with?", sector: "enterprise_saas" },
  { id: "crisis-detection", name: "Crisis Detection Engine", category: "Strategic Intelligence", label: "Tier 06 · Coordinate · Crisis Command Layer", description: "Continuous detection of cyber attack, media attack, disinformation, operational incidents and reputational threats — each surfaced with provenance. It answers: What is happening to us right now, and how do we know?", sector: "enterprise_saas" },
  { id: "crisis-response", name: "Crisis Response Engine", category: "Strategic Intelligence", label: "Tier 06 · Coordinate · Crisis Command Layer", description: "Automatically prepares the executive briefing, the press response, the stakeholder update and the action plan — every artefact under audit. It answers: What is the institutional response, and is it defensible?", sector: "enterprise_saas" },
  { id: "mission-control", name: "Mission Control Dashboard", category: "Strategic Intelligence", label: "Tier 07 · Coordinate · Strategic Coordination Layer", description: "Leadership sees threats, opportunities, stakeholders, markets, operations and narratives in one defensible institutional view. It answers: What is the institutional posture, right now, across every relevant axis?", sector: "enterprise_saas" },

  // ── Portfolio companies ──
  // Further companies built by the owner, taken from each product's own repository (name and what it
  // does). No published value exists for these, so none is shown.
  { id: "deploypro", name: "DeployPro", category: "Operations", label: "Self-Hosted Deployment Platform",
    description: "A self-hosted deployment platform: push to a branch and a container is built, started, health-checked and routed on hardware the customer owns. Every deployment keeps its own permanent URL and production is a pointer that moves in a second. Built for what usage-billed hosts charge for: long-running servers, background workers and APIs on a fixed monthly cost. Covered by a 113-check end-to-end suite on real Docker, Traefik and Postgres.",
    sector: "developer_tools", coverage: ["Docker", "Traefik", "PostgreSQL", "GitHub App", "SSH deploy keys"],
    tags: ["Git-push deploys", "Instant rollback", "Preview isolation", "Cron & workers", "Backups & restore", "Alerting"] },
  { id: "cineforge", name: "Cineforge", category: "Media", label: "AI Film Generation Platform",
    description: "Generates long-form films, from five minutes to more than two hours, from a single prompt. The platform writes the screenplay, locks characters and locations, plans every shot, generates video, voice, music and effects, enforces continuity and assembles the finished cut. It runs open-source video models on autoscaled GPU workers, which gives it a cost advantage over clip-only competitors such as Runway, Kling, Pika and Luma. In production with a five-plan Stripe business layer, credit ledger and admin console.",
    sector: "media_content", coverage: ["20 dubbing languages incl. Igbo, Lingala, Luganda, Zulu, Nigerian Pidgin", "YouTube", "TikTok", "Instagram", "Facebook"],
    tags: ["Live in production", "Prompt-to-film", "Voice Lab", "Talking avatars", "Social Launchpad", "Stripe billing"] },
  { id: "balancevid", name: "BalanceVid", category: "Media", label: "Video Conversation Platform",
    description: "A conversation editor for recorded media. A user interrupts a video at any moment, records a response and resumes the source at the same frame, as often as needed, with an always-on buffer so no response is clipped. The resulting conversation is the master record, published as a rendered video, an article or an interactive manifest. Built for commentary, education, interviews and analysis around existing video.",
    sector: "media_content", tags: ["Interrupt-and-respond", "Video, article & manifest output", "Frame-accurate resume", "Built-in rendering"] },
  { id: "website-visibility-platform", name: "Website Visibility Platform", category: "Marketing", label: "AI Website Growth Platform",
    description: "An AI-powered visibility platform that goes beyond audits and closes the loop for website owners: discover, diagnose, recommend, fix, measure, repeat. It connects to Google Search Console and GA4 through a guided wizard, crawls and scores the site, and delivers a weekly action plan and report with an AI strategist. Version 1 is complete and self-serve, including customer self-cancellation.",
    sector: "vertical_saas", coverage: ["Google Search Console", "Google Analytics 4", "Google OAuth"],
    tags: ["V1 complete", "Self-serve onboarding", "Crawler & scoring", "Weekly plan", "AI strategist"] },
  { id: "docuforge", name: "DocuForge", category: "Productivity", label: "AI Professional Documents",
    description: "An AI document studio for professionals. It produces ATS-optimised CVs with achievement-focused bullet points tailored to any role, personalised cover letters aligned to a specific job description, and full-length books with structured chapters ready for EPUB, PDF or print.",
    sector: "vertical_saas", tags: ["CV Builder", "Cover Letters", "Book Creator", "EPUB / PDF / print"] },
  { id: "docuai", name: "DocuAI", category: "Productivity", label: "Career & Publishing Suite",
    description: "An all-in-one career and publishing workspace: CV builder, cover letters, job matching, a book creator, a digital newspaper and newsletter system, content repurposing and translation. It includes a template gallery, an export centre and a personal library, with free and paid plans.",
    sector: "vertical_saas", tags: ["CV & cover letters", "Job matching", "Book creator", "Newsroom", "Translation", "Freemium"] },
  { id: "architect-os", name: "Architect OS", category: "Intelligence", label: "AI Company-Building Platform",
    description: "A platform that builds and continuously improves whole digital businesses. One sentence produces the company: feasibility, stack, strategy, brand, design system, software, marketing, legal and investor materials. A Live Company Twin tracks business health, and autonomous evolution ships safe improvements overnight while holding the rest for human approval. Products include Venture Builder, Studio, Vision, Deploy (10+ targets), Data and an asset Marketplace.",
    sector: "ai_infra", coverage: ["Vercel", "Render", "Cloudflare", "Netlify", "Docker", "Kubernetes", "AWS", "Azure", "GCP"],
    tags: ["Venture Builder", "Live Company Twin", "Autonomous evolution", "Human approval gate", "Asset marketplace"] },
  { id: "wankongos", name: "WankongOS", category: "Intelligence", label: "AI Workforce Operating System",
    description: "The operating system businesses use to hire, manage, supervise and scale AI employees. It models an organisation the way a company works (departments, teams, AI employees, tasks and outcomes) and gives every AI employee an identity, role, goals, KPIs, memory, permissions, tools and governance rules. It ships with a provider-agnostic AI runtime, a workflow engine with approvals, a REST API with streaming chat and a web console with a CEO dashboard and org chart.",
    sector: "ai_infra", coverage: ["Anthropic", "OpenAI", "Google"],
    tags: ["AI employees", "KPIs & governance", "Workflow engine", "CEO dashboard", "Tested monorepo"] },
  { id: "wankong", name: "Wankong", category: "Commerce", label: "Global Creator Marketplace",
    description: "A global marketplace where creators publish and earn: an eBook marketplace with reader, a music store with albums, charts, pre-saves and distribution, podcasts, and a Talent Arena for competitions. It provides artist and author profiles, vendor dashboards, subscriptions, checkout and a complete policy set covering licensing, creator monetisation, DMCA and distribution agreements.",
    sector: "consumer_marketplace", tags: ["eBooks", "Music distribution", "Podcasts", "Talent competitions", "Creator monetisation"] },
  { id: "smartkong", name: "SmartKong", category: "Commerce", label: "Smart Product Discovery & Affiliate Marketplace",
    description: "A global affiliate marketplace that aggregates products from more than 30 affiliate networks across many industries into one search and discovery experience. Shoppers find and buy from worldwide merchants, and the platform earns affiliate commission on every referred sale.",
    sector: "consumer_marketplace", tags: ["30+ affiliate networks", "Product discovery", "Commission revenue", "Global catalogue"] },
  { id: "afrinkong", name: "Afrinkong", category: "Travel & Tourism", label: "Pan-African Travel Gateway",
    description: "A travel group's gateway to journeys across Africa. Kamerun is the hand-built Cameroon operator site, and each country has its own home page and a full 27-category tourism index. Partner operator brands Pearl Trails Uganda and Namib Skyline link in from their own sites.",
    sector: "consumer_marketplace", coverage: ["Cameroon", "Kenya", "Rwanda", "Tanzania", "South Africa", "Zambia", "Uganda", "Namibia"],
    tags: ["Multi-country", "27-category tourism index", "Operator network"] },
  { id: "privacyos", name: "PrivacyOS", category: "Security", label: "AI Digital Protection Platform",
    description: "The antivirus for personal information: an AI-powered privacy, reputation, identity-protection and digital-risk platform. Autonomous agents discover, monitor, analyse and defend a person's or organisation's digital presence across search engines, data brokers, social media, the dark web, breach databases and AI-generated content. A proprietary five-axis risk score and a one-click \"Protect me\" flow return prioritised actions. Built on Next.js and multi-tenant Supabase with row-level security.",
    sector: "ai_infra", coverage: ["Individuals", "Executives", "Public figures", "Families", "Organisations"],
    tags: ["Digital Identity OS", "ReputationOS", "Executive Protection OS", "Family Protection OS", "Travel Security OS", "Brand Protection OS"] },
  { id: "flyttgo-real-estate", name: "FlyttGo Real Estate", category: "Property", label: "Enterprise PropTech Operating System",
    description: "An enterprise PropTech operating system covering the whole property journey on one platform: listings, search, valuation, offers, transactions, documents, inspection, verification, payments and the move itself through FlyttGo relocation. It is built domain by domain (14 bounded contexts) with pluggable country modules and a governed AI layer, so a new market is added by configuration rather than a rebuild.",
    sector: "vertical_saas", coverage: ["Norway", "Sweden"],
    tags: ["Listings & search", "Valuation engine", "Offers & transactions", "Relocation built in", "Multi-country"] },
  { id: "europedoor", name: "EuropeDoor", category: "Travel & Tourism", label: "European Discovery & Journey Planning",
    description: "Open the door to Europe: a discovery, cultural-knowledge and journey-planning platform. It offers an atlas of every country, travel region and destination, a planner that turns days, budget and interests into a costed itinerary, curated cross-border journeys, local experiences and stories. It serves the part of a trip that happens before booking, which few platforms do well. It generates 988 pages and 4 public APIs with no database or runtime dependencies, behind seven CI quality gates including WCAG 2.2 AA browser checks.",
    sector: "consumer_marketplace", coverage: ["50 countries", "130 travel regions", "319 destinations", "197 experiences", "17 journeys"],
    tags: ["Itinerary planner", "Cross-border journeys", "Public APIs", "WCAG 2.2 AA", "Live at europedoor.vercel.app"] },
  { id: "fast-man-and-van", name: "FAST MAN & VAN", category: "Mobility, Transport & Logistics", label: "UK Man & Van Network",
    description: "A UK man-and-van network offering reliable, simply booked van transport for goods, house moves and deliveries.",
    sector: "logistics_freight", coverage: ["United Kingdom"], tags: ["Man & van", "Home moves", "Goods transport"] },
];

// ── Buyer-facing facts ──────────────────────────────────────────────
// The same questions a founder answers when listing: what it is (a fuller description), stage,
// what is for sale, how it makes money, what it is built with, where it sells, and the price.
// Stage and stack are given only where the product's own repository shows them; otherwise the
// card leaves them out rather than guess.

interface FactsIn {
  readonly summary?: string; readonly stage?: Stage; readonly forSale?: readonly ForSale[]; readonly models: readonly Model[];
  readonly builtWith?: readonly string[]; readonly basedIn?: string; readonly region: Region; readonly markets: readonly string[];
  readonly askingMode?: AskingMode; readonly askingLowUsd?: number;
}
const PRODUCT_SALE: readonly ForSale[] = ["source_code_ip", "brand_domain", "infrastructure"];
const GOV: Omit<FactsIn, "summary"> = { models: ["government_contract", "licence"], region: "Other", markets: ["National governments", "Ministries & agencies", "Public institutions"] };
const WEB_STACK = ["React", "TypeScript", "Supabase", "PostgreSQL"];
// the intelligence engines sell with the Sovereign platform subscription (Operator $490/mo, Institutional $4,900/mo, published)
const INTEL: FactsIn = { models: ["subscription", "licence"], region: "Other", markets: ["Governments", "Ministries", "Enterprises", "Executives"] };

const FACTS: Readonly<Record<string, FactsIn>> = {
  // ── Governance ──
  civicos: { ...GOV, stage: "concept", builtWith: ["AI-native DPI blueprint (92 documents)"],
    summary: "A deployable government operating system for the modern state: a national runtime that binds ministries, treasury, justice, health, emergency services and oversight into one AI-governed operating system. Delivered as sovereign state capability, with modules and tiers for ministries, agencies, councils and public administration, and a 30-year evolution path toward sovereign intelligence infrastructure." },
  "national-shell": { ...GOV, summary: "The sovereign orchestration layer that binds a government into one runtime: identity, services, data exchange and policy enforcement shared across every ministry, so a state runs as one coordinated system rather than disconnected departments." },
  "national-coordination-engine": { ...GOV, summary: "Cross-government dependency and institutional coordination. It maps which institutions depend on which, tracks shared programmes and deadlines, and surfaces conflicts and bottlenecks between ministries before they stall delivery." },
  treasuryos: { ...GOV, markets: ["Ministries of finance", "National treasuries", "Central banks"], summary: "Sovereign financial orchestration for government treasuries: budget execution, cash management, payments to and from the state, and real-time visibility of public funds across ministries, with full audit trails." },
  healthos: { ...GOV, markets: ["Ministries of health", "Public health agencies", "Hospital networks"], summary: "A national healthcare operational runtime: facility and workforce coordination, patient flow, supply chains and public-health reporting run on one system, giving a ministry a live view of national health capacity." },
  justiceos: { ...GOV, markets: ["Ministries of justice", "Courts", "Prosecution services"], summary: "Judicial and constitutional operational infrastructure: case management, court scheduling, records and constitutional workflows on one runtime, cutting backlogs and making the justice system auditable end to end." },
  educationos: { ...GOV, markets: ["Ministries of education", "School systems", "Universities"], summary: "National education coordination infrastructure: enrolment, staffing, curriculum delivery, examinations and outcomes reporting across a country's schools and institutions, in one operational system." },
  transportos: { ...GOV, markets: ["Ministries of transport", "Transit authorities", "Road and rail agencies"], summary: "National transport and mobility orchestration: networks, fleets, licensing and infrastructure programmes coordinated in one runtime, with live operational data for planning and incident response." },
  emergencyos: { ...GOV, markets: ["Emergency services", "Civil protection agencies", "Disaster management"], summary: "A national emergency-response and crisis-coordination runtime: incident intake, resource dispatch, inter-agency command and public alerting in one system, built for the moments when coordination decides outcomes." },
  policeos: { ...GOV, markets: ["Police services", "Ministries of interior", "Public safety agencies"], summary: "National law-enforcement operational infrastructure: incident and case records, deployment, evidence handling and oversight on one platform, with accountability built into every action." },
  "anti-corruption-intelligence-os": { ...GOV, models: ["government_contract", "licence"], markets: ["Anti-corruption agencies", "Audit institutions", "Regulators"], summary: "AI-native anti-corruption operational intelligence: it analyses procurement, payments, assets and relationships to flag risk patterns, prioritises cases for investigators and keeps a defensible evidence trail." },
  "act-anti-corruption-tower": { ...GOV, markets: ["Anti-corruption agencies", "Governments", "Development partners"], summary: "Institutional integrity, instrumented: a command tower that gives integrity bodies one live view of risk indicators, investigations and reforms across institutions, so integrity becomes measurable and reportable." },
  // ── Finance ──
  "veritas-financial-sovereign-stack": { models: ["government_contract", "licence"], region: "Other", markets: ["Central banks", "Ministries of finance", "National banks"],
    summary: "Treasury, monetary, settlement, banking and reserve infrastructure operated at civilisation scale. A sovereign financial stack for states and their institutions, with financial integrity end to end: from reserve management and settlement to national banking rails." },
  "mobile-pay": { models: ["transaction_fees", "licence"], region: "Other", markets: ["Telecom operators", "Banks", "Emerging markets"],
    summary: "A national mobile-money network in a box: wallets, agent networks, merchant payments, transfers and settlement, ready to launch for an operator, bank or state that wants financial inclusion at national scale." },
  // ── Mobility ──
  flytgo: { models: ["commission"], region: "Europe", markets: ["Movers & transport companies", "Households", "Businesses"],
    summary: "The global logistics and transport marketplace: customers post moves and shipments, vetted transport providers quote and deliver, and the platform handles matching, booking and payment, earning a commission on every job." },
  "flytgo-norway": { stage: "live", models: ["commission"], basedIn: "Norway", region: "Europe", markets: ["Norway"],
    summary: "Norway's moving and transport marketplace: households and businesses book moves, van transport and deliveries from local providers across Oslo, Bergen, Trondheim, Stavanger and beyond, with quotes, booking and payment in one place." },
  // ── Intelligence ──
  "veritas-os": { models: ["licence", "subscription"], region: "Other", markets: ["Governments", "Enterprises", "Institutions"],
    summary: "Knowledge and organisational intelligence infrastructure: organisational memory, institutional knowledge, search, reference and knowledge governance for institutions at any scale, so what an organisation knows survives staff changes and is findable when it matters." },
  "emergency-ai": { models: ["subscription", "licence"], region: "Other", markets: ["Governments", "Security agencies", "Enterprises"],
    summary: "Intelligence acquisition, strategic analysis and institutional intelligence generation: briefings, assessments, narrative and decision support for the principals who must decide, produced continuously from monitored sources." },
  // ── Elections ──
  elecpro: { ...GOV, markets: ["Electoral commissions", "Governments", "Election observers"],
    summary: "Sovereign electoral infrastructure: voter registration, ballots, tabulation, observation and the whole electoral cycle operated under one runtime, under sovereign jurisdiction and continuous audit." },
  // ── Education ──
  edupro: { models: ["licence", "subscription"], region: "Other", markets: ["Ministries of education", "Schools", "Universities"],
    summary: "A nation's learning backbone: learning delivery, credentials and progress records for schools and institutions, with verifiable certificates a country can trust." },
  futech: { models: ["licence", "subscription"], region: "Other", markets: ["Universities", "Colleges"],
    summary: "Transforming university administration: admissions, registration, student records, fees, timetabling and academic workflows on one platform, sold in tiers from $80K." },
  // ── Commerce ──
  "marketplace-infrastructure": { models: ["licence", "commission"], region: "Other", markets: ["Marketplace operators", "Retailers", "Enterprises"],
    summary: "Multi-vendor commerce, ready to run: vendor onboarding, catalogue, orders, payments and payouts, so an operator can launch a marketplace without building the platform." },
  // ── Operations ──
  exitos: { stage: "beta", models: ["subscription", "commission"], builtWith: ["React", "TypeScript", "Supabase", "PostgreSQL", "Edge Functions"], region: "Other", markets: ["Founders", "Acquirers", "Advisers"],
    summary: "The operating system founders use to run an exit, from sourcing to closed deal: valuation, readiness, data room, buyer matching, NDAs, offers, transactions and closing on one runtime, with subscriptions for founders and buyers and a success fee on closed deals." },
  "veritas-operations": { models: ["subscription"], region: "Other", markets: ["Enterprises", "SMBs"],
    summary: "Autonomous company operations: operational management, workflow orchestration, accounting intelligence and compliance as a digital operations layer for enterprises." },
  "sovereign-dispatch": { models: ["subscription", "licence"], builtWith: ["Node.js", "TypeScript", "PostgreSQL"], region: "Other", markets: ["Governments", "Regulated enterprises", "Boards"],
    summary: "Institutional publication infrastructure: PDF, DOCX and PPTX rendering for board reports, policy documents, regulatory submissions and briefing packages, with every artifact carrying chain-of-custody through one defensible audit log." },
  "deployment-engine": { models: ["licence"], region: "Other", markets: ["Acquirers", "Enterprises"],
    summary: "From acquisition to live, automatically: takes an acquired product and stands it up on the buyer's own infrastructure, with environments, domains and configuration provisioned for them." },
  // ── Strategic Intelligence Stack ──
  "osint": INTEL,
  "media-monitoring": INTEL,
  "stakeholder-monitoring": INTEL,
  "narrative-intel": INTEL,
  "competitive-intel": INTEL,
  "strategic-signal": INTEL,
  "executive-briefing": INTEL,
  "risk-intel": INTEL,
  "decision-support": INTEL,
  "scenario-planning": INTEL,
  "strategic-forecasting": INTEL,
  "knowledge-graph": INTEL,
  "lessons-learned": INTEL,
  "crisis-detection": INTEL,
  "crisis-response": INTEL,
  "mission-control": INTEL,
  // ── Portfolio companies ──
  deploypro: { stage: "beta", models: ["subscription", "licence"], builtWith: ["Docker", "Traefik", "PostgreSQL", "Node.js"], region: "Other", markets: ["Developers", "Agencies", "SMBs"] },
  cineforge: { stage: "live", models: ["subscription"], builtWith: ["TypeScript", "Supabase", "Stripe", "RunPod GPUs", "Wan 2.1 / Hunyuan Video", "FFmpeg"], region: "Other", markets: ["Creators", "Studios", "Educators", "Marketers"] },
  balancevid: { stage: "prototype", models: ["subscription"], builtWith: ["Node.js", "FFmpeg"], region: "Other", markets: ["Creators", "Educators", "Media"] },
  "website-visibility-platform": { stage: "live", models: ["subscription"], builtWith: ["TypeScript", "PostgreSQL", "Google APIs"], region: "Other", markets: ["SMBs", "Agencies", "Website owners"] },
  docuforge: { models: ["subscription"], builtWith: WEB_STACK, region: "Other", markets: ["Job seekers", "Professionals", "Authors"] },
  docuai: { models: ["subscription"], builtWith: WEB_STACK, region: "Other", markets: ["Job seekers", "Professionals", "Publishers"] },
  "architect-os": { stage: "prototype", models: ["subscription"], builtWith: ["TypeScript", "OpenAI", "Claude"], region: "Other", markets: ["Founders", "Agencies", "Enterprises"] },
  wankongos: { stage: "prototype", models: ["subscription"], builtWith: ["TypeScript", "Next.js", "Hono"], region: "Other", markets: ["SMBs", "Enterprises"] },
  wankong: { models: ["commission", "subscription"], builtWith: WEB_STACK, region: "Other", markets: ["Authors", "Musicians", "Creators", "Readers & listeners"] },
  smartkong: { models: ["commission"], builtWith: ["React", "TypeScript", "Express", "PostgreSQL"], region: "Other", markets: ["Online shoppers", "Global"] },
  afrinkong: { models: ["commission"], basedIn: "Cameroon", region: "Africa", markets: ["Travellers to Africa", "Tour operators"] },
  privacyos: { stage: "prototype", models: ["subscription"], builtWith: ["Next.js", "TypeScript", "Supabase", "Claude / OpenAI"], region: "Other", markets: ["Individuals", "Executives", "Families", "Organisations"] },
  "flyttgo-real-estate": { stage: "prototype", models: ["subscription", "commission"], builtWith: ["Next.js", "TypeScript", "PostgreSQL / PostGIS", "Supabase"], basedIn: "Norway", region: "Europe", markets: ["Norway", "Sweden"] },
  europedoor: { stage: "live", models: ["not_monetised"], builtWith: ["Python", "Static site", "Vercel"], region: "Europe", markets: ["Travellers to Europe"] },
  "fast-man-and-van": { stage: "live", models: ["services", "commission"], builtWith: ["React", "TypeScript"], basedIn: "United Kingdom", region: "Europe", markets: ["United Kingdom"] },
};

const usdOf = (t?: string): number | undefined => { const m = t?.match(/^\$([\d.]+)M$/); return m ? +m[1] * 1e6 : undefined; };

function factsFor(p: SovereignProduct): ListingFacts {
  const f = FACTS[p.id];
  const relo = p.id.endsWith("-relocation");
  const country = relo ? p.name.replace(/ Relocation & Logistics Marketplace$/, "") : undefined;
  const ack = usdOf(p.acquisitionReadyText);
  return {
    summary: f?.summary ?? (relo
      ? `${p.description} Households, businesses and relocating employees book moves, van transport, storage and delivery from vetted local providers in ${p.coverage?.join(", ")}, with quotes, booking and payment on one platform. The operator earns a commission on every job, and the market is ready for a new owner to run.`
      : p.description),
    ...(f?.stage ?? (relo ? "live" : undefined) ? { stage: (f?.stage ?? "live") as Stage } : {}),
    forSale: f?.forSale ?? PRODUCT_SALE,
    models: f?.models ?? (relo ? ["commission"] : []),
    builtWith: f?.builtWith ?? [],
    basedIn: f?.basedIn ?? (relo && country ? (country === "USA" ? "United States" : country === "UK" ? "United Kingdom" : country) : ""),
    region: f?.region ?? (country === "USA" || country === "Canada" ? "North America" : "Europe"),
    markets: f?.markets ?? (relo && country ? [country, ...(p.coverage ?? [])] : []),
    askingMode: ack ? "price" : "on_request",
    ...(ack ? { askingLowUsd: ack } : {}),
  };
}

export const SOVEREIGN_PRODUCTS: readonly SovereignProduct[] = [...CORE, ...reloProducts].map((p) => ({ ...p, facts: factsFor(p) }));
