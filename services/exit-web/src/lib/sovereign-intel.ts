import type { Sector } from "./company-intake";

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
  { id: "fast-man-and-van", name: "FAST MAN & VAN", category: "Mobility, Transport & Logistics", label: "UK Man & Van Network",
    description: "A UK man-and-van network offering reliable, simply booked van transport for goods, house moves and deliveries.",
    sector: "logistics_freight", coverage: ["United Kingdom"], tags: ["Man & van", "Home moves", "Goods transport"] },
];

export const SOVEREIGN_PRODUCTS: readonly SovereignProduct[] = [...CORE, ...reloProducts];
