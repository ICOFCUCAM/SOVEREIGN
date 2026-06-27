// Pricing page copy catalog. Structural data (deployment glyph kinds, CTA routes,
// which tier is featured) stays in the page; every human-readable string lives
// here so the page is fully translatable. Prices keep their currency token
// (US$299) but word-prices (Free, Custom, From …) are translated.

export interface PricingTier {
  name: string; price: string; cadence?: string; purpose: string; carry?: string;
  audience: string; deployment: string[]; includes: string[]; ctaLabel: string;
}
export interface PricingApiTier { name: string; price: string; cadence?: string; lines: string[]; }

export interface PricingCopy {
  eyebrow: string; title: string; lead: string; ctaStart: string; ctaPackage: string; startNote: string;
  payForLabel: string; neverForLabel: string; chargeFor: string[]; neverFor: string[];
  usersTitle: string; usersBody: string;
  plansTitle: string; plansLead: string; mostChosen: string; deploymentLabel: string; plansFootnote: string;
  tiers: PricingTier[];
  includedTitle: string; includedLead: string; includedItems: string[];
  apiTitle: string; apiLead: string; apiTiers: PricingApiTier[]; apiDevLink: string; apiTalkLink: string;
  implTitle: string; implBody: string; implCta: string;
  closeTitle: string; closeBody: string; closeLaunch: string; closePackage: string;
  linkArchitecture: string; linkSecurity: string; linkDeployment: string;
}

export const PRICING_EN: PricingCopy = {
  eyebrow: "Pricing",
  title: "Priced like institutional infrastructure — never per seat.",
  lead: "Dispatch is not a document store or a signing tool, and it is not priced like one. You pay for governance, authority, compliance, sovereignty and deployment — the capabilities an institution cannot afford to get wrong. Add every relevant employee; the value is the infrastructure, not the login count.",
  ctaStart: "Start a free evaluation",
  ctaPackage: "Evaluation package",
  startNote: "No sales call to start · upgrade when you deploy",
  payForLabel: "You pay for",
  neverForLabel: "You never pay for",
  chargeFor: ["Governance", "Institutional authority", "Compliance", "Sovereignty", "Deployment model", "Support level", "API integration"],
  neverFor: ["Per seat", "Per user", "Storage", "PDFs", "Documents as files"],
  usersTitle: "Unlimited institutional users.",
  usersBody: "Dispatch is licensed to institutions — not individual employees. Add every official, reviewer, publisher and administrator without seat-based pricing. A ministry of 8,000 is never billed for 8,000 accounts that rarely log in. That is what sets Dispatch apart from Microsoft 365, Google Workspace and Atlassian: you are not taxed for letting people do their work.",
  plansTitle: "Plans",
  plansLead: "The path is the story: evaluate, run one institution, scale to many departments, integrate the enterprise, then own the platform under your own jurisdiction. Each step inherits everything below it.",
  mostChosen: "Most chosen",
  deploymentLabel: "Deployment",
  plansFootnote: "Every plan includes unlimited institutional users — you are never billed per seat. Plans differ by governance, deployment, identity integration, API throughput and support, not by headcount or storage. Enterprise and Sovereign are scoped per institution; “From” is a starting point, not a quote, and SLA, residency and engagement terms are agreed during evaluation.",
  tiers: [
    { name: "Evaluation", price: "Free", purpose: "Evaluate Dispatch end to end.", audience: "Product evaluation", deployment: ["Managed Cloud"], includes: ["Up to 5 users", "10 governed publications", "Watermarked — not an official record"], ctaLabel: "Start free" },
    { name: "Institutional", price: "US$299", cadence: "/month", purpose: "Run one institution with production governance.", audience: "NGOs · municipalities · schools · small companies", deployment: ["Managed Cloud"], includes: ["Unlimited institutional users", "500 governed publications / month", "Single institution", "SSO-ready", "Email support"], ctaLabel: "Start free" },
    { name: "Institutional Plus", price: "US$999", cadence: "/month", purpose: "Operate multiple departments with enterprise oversight and advanced governance.", carry: "Everything in Institutional, plus", audience: "Universities · hospitals · mid-market · agencies", deployment: ["Managed Cloud", "Private Cloud"], includes: ["Unlimited governed publications", "Multiple departments · office hierarchy", "Advanced governance policies", "Analytics & executive dashboard", "Priority support"], ctaLabel: "Start free" },
    { name: "Enterprise", price: "From US$3,500", cadence: "/month", purpose: "Connect Dispatch to your identity, infrastructure and compliance environment.", carry: "Everything in Institutional Plus, plus", audience: "Ministries · national agencies · large enterprises", deployment: ["Managed", "Private", "On-Premises"], includes: ["SSO — Azure AD · Okta", "Audit exports", "High availability & SLA", "Enterprise support", "Dedicated onboarding"], ctaLabel: "Talk to us" },
    { name: "Sovereign", price: "Custom", cadence: "engagement", purpose: "Own the entire platform under your jurisdiction.", carry: "Everything in Enterprise, plus", audience: "Governments · central banks · defence · supreme courts · election commissions", deployment: ["Sovereign Hosting", "Air-Gapped", "On-Premises"], includes: ["Source escrow (if negotiated)", "Custom integrations", "Migration & training", "Dedicated support", "White-glove deployment"], ctaLabel: "Talk to us" },
  ],
  includedTitle: "Every paid plan includes",
  includedLead: "The full governance platform is never an add-on. Every production plan carries the complete chain of trust — enforcement, evidence, certificates, integrity and audit.",
  includedItems: ["Governance enforcement", "Evidence chain", "Governance certificates", "Preservation certificates", "Cryptographic integrity", "Complete audit history", "Unlimited institutional users", "REST API", "Documentation"],
  apiTitle: "The API is its own product.",
  apiLead: "Governance, publication, certification and preservation as services — for the integration-first buyer who consumes the engine without licensing the console. Platform plans already include the API at fair use.",
  apiTiers: [
    { name: "Developer", price: "Free", lines: ["Sandbox", "500 API calls / month"] },
    { name: "API Professional", price: "US$199", cadence: "/month", lines: ["50,000 API calls", "OAuth · webhooks", "Support"] },
    { name: "API Enterprise", price: "Custom", lines: ["Unlimited calls", "Custom rate & terms"] },
  ],
  apiDevLink: "Developer platform",
  apiTalkLink: "Talk to us",
  implTitle: "Need deployment, migration or governance consulting?",
  implBody: "Our implementation team helps institutions design governance models, migrate existing publication workflows, integrate identity providers, and deploy Dispatch in managed, private, on-premises or sovereign environments.",
  implCta: "Talk to our implementation team",
  closeTitle: "Ready to evaluate Dispatch?",
  closeBody: "Download the complete procurement package, review the security architecture, explore deployment options, or launch an evaluation environment in minutes.",
  closeLaunch: "Launch Evaluation",
  closePackage: "Download Procurement Package",
  linkArchitecture: "Architecture",
  linkSecurity: "Security",
  linkDeployment: "Deployment options",
};
