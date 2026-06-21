// Single source of truth for the Polished Pages plan ladder. Prices, image-credit
// allowances, target audiences and the headline feature list all live here so the
// pricing page, Account screen and checkout stay in sync. Self-serve tiers map to
// a Stripe price via STRIPE_PRICE_<ID> on the checkout function; "contact" tiers
// are sales-led.
export type PlanId = "free" | "creator" | "professional" | "publisher" | "business" | "school" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;     // display string, e.g. "$19" or "Custom"
  cadence: string;        // "/ month", "/ year", ""
  priceMonthly: number | null; // numeric monthly price for sorting/compare; null for contact tiers
  target: string;
  imageCredits: number | null; // monthly image credits; null = not metered the usual way
  textLabel: string;      // "20 / month" or "Unlimited"
  checkout: "subscription" | "contact"; // self-serve vs sales-led
  highlight?: boolean;    // visually featured
  features: string[];
}

// Marketplace commission on PAID sales (creator keeps the rest). Starts low to
// attract creators; revisit upward once the marketplace has demand.
export const MARKETPLACE_FEE_PCT = 15;

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceLabel: "$0",
    cadence: "",
    priceMonthly: 0,
    target: "Try the platform",
    imageCredits: 15,
    textLabel: "20 / month",
    checkout: "subscription",
    features: [
      "20 text generations / month",
      "15 image credits / month",
      "1 published project",
      "“Made with Polished Pages” footer",
      "Community support",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    priceLabel: "$19",
    cadence: "/ month",
    priceMonthly: 19,
    target: "Parents, hobbyists & individual authors",
    imageCredits: 250,
    textLabel: "Unlimited",
    checkout: "subscription",
    features: [
      "Unlimited CVs, letters & storybooks",
      "Children’s storybooks & coloring books",
      "250 image credits / month",
      "Full commercial rights — KDP & IngramSpark export",
      "Library, version history & collections",
      "Publish and sell on the marketplace",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    priceLabel: "$39",
    cadence: "/ month",
    priceMonthly: 39,
    target: "Educators, consultants & serious authors",
    imageCredits: 800,
    textLabel: "Unlimited",
    checkout: "subscription",
    highlight: true,
    features: [
      "Everything in Creator, plus:",
      "Educational Studio, Curriculum Builder & Assessments",
      "Primary School Book Factory & Teacher Resources",
      "Multi-language localization & translation",
      "800 image credits / month",
      "Priority generation & premium templates",
    ],
  },
  {
    id: "publisher",
    name: "Publisher Pro",
    priceLabel: "$59",
    cadence: "/ month",
    priceMonthly: 59,
    target: "Independent publishers & content studios",
    imageCredits: 1500,
    textLabel: "Unlimited",
    checkout: "subscription",
    features: [
      "Everything in Professional, plus:",
      "Bulk translation & multi-language editions",
      "Series management & marketplace storefront",
      "KDP & IngramSpark publishing bundles",
      "Author profile & storefront page",
      "1,500 image credits / month",
    ],
  },
  {
    id: "business",
    name: "Business",
    priceLabel: "$99",
    cadence: "/ month",
    priceMonthly: 99,
    target: "Agencies & educational organizations",
    imageCredits: 4000,
    textLabel: "Unlimited",
    checkout: "subscription",
    features: [
      "Everything in Publisher Pro, plus:",
      "Team collaboration & shared libraries",
      "Brand kits & approval workflows",
      "Marketplace analytics",
      "4,000 image credits / month",
    ],
  },
  {
    id: "school",
    name: "School / NGO",
    priceLabel: "Custom",
    cadence: "/ year",
    priceMonthly: null,
    target: "Schools, NGOs & homeschool groups",
    imageCredits: null,
    textLabel: "Unlimited",
    checkout: "contact",
    features: [
      "Teacher accounts & student content",
      "Classroom publishing",
      "Curriculum generation",
      "Shared repositories",
      "Annual licensing",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom",
    cadence: "",
    priceMonthly: null,
    target: "Ministries, publishers & government programmes",
    imageCredits: null,
    textLabel: "Unlimited",
    checkout: "contact",
    features: [
      "Dedicated deployments",
      "Custom models & curriculum support",
      "White-label options",
      "Priority SLA & onboarding",
    ],
  },
];

// Tier ranking, mirroring polished.plan_rank in the database. Used to decide
// whether a plan unlocks a Professional+ studio.
export const PLAN_RANK: Record<string, number> = {
  free: 0, creator: 1, professional: 2, pro: 2, publisher: 3, business: 4, school: 5, enterprise: 6,
};

// Studios reserved to a minimum tier. Keep in sync with the server-side gate
// (requirePlanOrThrow) in the generation functions.
export type StudioFeature = "children-studio" | "educational-studio" | "multilingual";
export const FEATURE_MIN_PLAN: Record<StudioFeature, PlanId> = {
  "children-studio": "creator",       // emotional hook — available early
  "educational-studio": "professional",
  "multilingual": "professional",
};

export function planAllows(plan: string | undefined, feature: StudioFeature): boolean {
  return (PLAN_RANK[plan ?? "free"] ?? 0) >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

// How many ADDITIONAL language editions a project may have (the original
// language is always free). -1 = unlimited. Mirrors polished.localization_limit
// in the database, which enforces this server-side in polished_save_edition.
export const LOCALIZATION_LIMIT: Record<string, number> = {
  free: 0, creator: 1, professional: 2, pro: 2, publisher: 5, business: 10, school: -1, enterprise: -1,
};

export function localizationLimit(plan: string | undefined): number {
  const v = LOCALIZATION_LIMIT[plan ?? "free"];
  return v === undefined ? 0 : v;
}

export const isUnlimitedLocalization = (limit: number): boolean => limit < 0;

export const planById = (id: string): Plan | undefined => PLANS.find((p) => p.id === id);

// Display name for whatever plan string the backend returns ('pro' is legacy).
export const planDisplayName = (plan: string | undefined): string => {
  if (plan === "pro") return "Professional";
  return planById(plan ?? "free")?.name ?? "Free";
};
