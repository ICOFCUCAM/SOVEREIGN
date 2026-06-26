import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PublicFooter, Chevron, Dot, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { PROCUREMENT_ROUTE, DEVELOPERS_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Public pricing — the artefact of ADR-012. Dispatch is priced like institutional
// infrastructure, not like a collaboration tool: never per seat, never per file.
// The tier differentiator is institution size + capability (departments, policies,
// deployment, support, integrations). Concrete prices for the self-serve tiers;
// "From / Custom + Contact" for the two qualified ones, to protect the high end.

type Cta = { label: string; to: string; kind: "primary" | "ghost" };

type Tier = {
  name: string;
  price: string;
  cadence?: string;
  tagline: string;
  audience: string;
  deployment: string;
  featured?: boolean;
  includes: string[];
  cta: Cta;
};

const TIERS: Tier[] = [
  {
    name: "Evaluation",
    price: "Free",
    tagline: "Prove the governance for yourself.",
    audience: "Product evaluation",
    deployment: "Managed Cloud · evaluation environment",
    includes: [
      "Up to 5 users",
      "10 governed publications",
      "Full governance engine",
      "Certificates & preservation",
      "Limited API access",
      "Watermarked — not an official record",
    ],
    cta: { label: "Start free", to: "/signup", kind: "ghost" },
  },
  {
    name: "Institutional",
    price: "US$299",
    cadence: "/month",
    tagline: "Govern publication for a small institution.",
    audience: "NGOs · municipalities · schools · small companies",
    deployment: "Managed Cloud",
    includes: [
      "Unlimited institutional users",
      "500 governed publications / month",
      "Governance & preservation",
      "API access",
      "SSO-ready",
      "Email support",
    ],
    cta: { label: "Start free", to: "/signup", kind: "ghost" },
  },
  {
    name: "Organization",
    price: "US$999",
    cadence: "/month",
    tagline: "The full governance estate, unlimited.",
    audience: "Universities · hospitals · mid-market · agencies",
    deployment: "Managed Cloud or Private Cloud",
    featured: true,
    includes: [
      "Unlimited institutional users & publications",
      "Multiple departments · office hierarchy",
      "Governance policies & evidence chain",
      "Analytics & executive dashboard",
      "Full API throughput",
      "Priority support",
    ],
    cta: { label: "Start free", to: "/signup", kind: "primary" },
  },
  {
    name: "Enterprise",
    price: "From US$3,500",
    cadence: "/month",
    tagline: "Identity, deployment and assurance at scale.",
    audience: "Ministries · national agencies · large enterprises",
    deployment: "Managed, Private, or On-Premises",
    includes: [
      "Everything unlimited",
      "SSO — Azure AD · Okta",
      "Advanced governance & audit exports",
      "High availability & SLA",
      "Enterprise support",
      "Dedicated onboarding",
    ],
    cta: { label: "Talk to us", to: PROCUREMENT_ROUTE, kind: "ghost" },
  },
  {
    name: "Sovereign",
    price: "Custom",
    cadence: "engagement",
    tagline: "Run it inside your own sovereignty.",
    audience: "Governments · central banks · defence · supreme courts · election commissions",
    deployment: "Sovereign / Air-Gapped / On-Premises",
    includes: [
      "Sovereign hosting & private cloud",
      "Source escrow (if negotiated)",
      "Custom integrations",
      "Migration & training",
      "Dedicated support",
      "White-glove deployment",
    ],
    cta: { label: "Talk to us", to: PROCUREMENT_ROUTE, kind: "ghost" },
  },
];

const CHARGE_FOR = [
  "Governance",
  "Institutional authority",
  "Compliance",
  "Sovereignty",
  "Deployment model",
  "Support level",
  "API integration",
];

const NEVER_FOR = ["Per seat", "Per user", "Storage", "PDFs", "Documents as files"];

const API_TIERS: { name: string; price: string; cadence?: string; lines: string[]; to: string }[] = [
  { name: "Developer", price: "Free", lines: ["Sandbox", "500 API calls / month"], to: DEVELOPERS_ROUTE },
  { name: "API Professional", price: "US$199", cadence: "/month", lines: ["50,000 API calls", "OAuth · webhooks", "Support"], to: DEVELOPERS_ROUTE },
  { name: "API Enterprise", price: "Custom", lines: ["Unlimited calls", "Custom rate & terms"], to: PROCUREMENT_ROUTE },
];

const SERVICES = [
  ["Deployment & migration", "Stand up the institution and move existing records under governance."],
  ["Policy & governance design", "Approval policies, office hierarchy and separation-of-duties to your mandate."],
  ["Identity integration", "Azure AD, Okta and SSO wired to your offices and clearances."],
  ["Training & record templates", "Onboarding for staff and custom record types for your publications."],
];

const Pricing: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  React.useEffect(() => track("page.pricing"), []);

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />

      {/* hero */}
      <section className="border-b border-white/5 px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Pricing</p>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#f4efe3] sm:text-6xl">
            Priced like institutional infrastructure — never per seat.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            Dispatch is not a document store or a signing tool, and it is not priced like one.
            You pay for governance, authority, compliance, sovereignty and deployment — the capabilities an
            institution cannot afford to get wrong. Add every relevant employee; the value is the infrastructure,
            not the login count.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={() => nav("/signup")}
              className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              Start a free evaluation <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
            <a href={PROCUREMENT_ROUTE}
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              Evaluation package
            </a>
            <span className="text-[12px] text-white/40">No sales call to start · upgrade when you deploy</span>
          </div>
        </div>
      </section>

      {/* philosophy band — charge for / never for */}
      <section id="philosophy" className="scroll-mt-24 border-b border-white/5 px-8 py-14 lg:px-12">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-2">
          <div className={`${SURFACE} p-7`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">You pay for</div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {CHARGE_FOR.map((c) => (
                <span key={c} className="rounded-md border border-gold-400/25 bg-gold-400/[0.06] px-3 py-1.5 text-[13px] font-semibold text-gold-200/90">{c}</span>
              ))}
            </div>
          </div>
          <div className={`${SURFACE} p-7`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">You never pay for</div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {NEVER_FOR.map((c) => (
                <span key={c} className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[13px] font-medium text-white/45 line-through decoration-white/25">{c}</span>
              ))}
            </div>
            <p className="mt-5 text-[13px] leading-relaxed text-white/50">
              A ministry of 8,000 should never be billed for 8,000 accounts that rarely log in. Where volume is
              metered it is the <span className="text-white/75">governed publication</span> — the act of placing
              authority, an evidence chain and a permanent Record ID behind a document — never the file or the seat.
            </p>
          </div>
        </div>
      </section>

      {/* tiers */}
      <section id="plans" className="scroll-mt-24 border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-9 flex items-baseline gap-4">
            <span className="font-mono text-[13px] font-bold text-gold-400">01</span>
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">Plans</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">
                The tier scales with the institution and its governance estate — departments, policies, deployment and
                support — not with the number of people who sign in.
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-5 sm:grid-cols-2">
            {TIERS.map((t) => (
              <div key={t.name}
                className={`relative flex flex-col rounded-xl border p-6 ${t.featured ? "border-gold-400/40 bg-gradient-to-b from-gold-400/[0.07] to-white/[0.01] shadow-[0_24px_60px_-30px_rgba(202,164,90,0.45)]" : "border-white/8 bg-white/[0.015]"}`}>
                {t.featured && (
                  <div className="absolute -top-2.5 left-6 rounded-full border border-gold-400/40 bg-[#1c1407] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gold-300">Most chosen</div>
                )}
                <div className="text-[15px] font-bold text-white">{t.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-bold text-[#f4efe3]">{t.price}</span>
                  {t.cadence && <span className="text-[12px] text-white/45">{t.cadence}</span>}
                </div>
                <p className="mt-2 min-h-[2.5rem] text-[13px] leading-snug text-white/60">{t.tagline}</p>
                {/* deployment answers the procurement officer's first question: can we own this ourselves? */}
                <div className="mt-3 rounded-md border border-gold-400/20 bg-gold-400/[0.05] px-3 py-2">
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-gold-400/80">Deployment</div>
                  <div className="mt-0.5 text-[12px] font-medium leading-snug text-gold-100/85">{t.deployment}</div>
                </div>
                <div className="mt-3 border-t border-white/5 pt-3 text-[11.5px] font-medium uppercase tracking-wide text-white/35">{t.audience}</div>
                <ul className="mt-4 flex-1 space-y-2 text-[13px] text-white/65">
                  {t.includes.map((line) => (
                    <li key={line} className="flex gap-2"><Dot /> <span>{line}</span></li>
                  ))}
                </ul>
                <button onClick={() => nav(t.cta.to)}
                  className={t.cta.kind === "primary"
                    ? "group mt-6 inline-flex items-center justify-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500"
                    : "group mt-6 inline-flex items-center justify-center gap-2 rounded border border-white/15 bg-white/[0.02] px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]"}>
                  {t.cta.label} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-white/35">
            Every plan includes <span className="text-white/55">unlimited institutional users</span> — you are never
            billed per seat. Plans differ by governance, deployment, identity integration, API throughput and support,
            not by headcount or storage. Enterprise and Sovereign are scoped per institution; "From" is a starting
            point, not a quote, and SLA, residency and engagement terms are agreed during evaluation.
          </p>
        </div>
      </section>

      {/* API as its own product */}
      <section id="api" className="scroll-mt-24 border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-9 flex items-baseline gap-4">
            <span className="font-mono text-[13px] font-bold text-gold-400">02</span>
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">The API is its own product.</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">
                Governance, publication, certification and preservation as services — for the integration-first buyer
                who consumes the engine without licensing the console. Platform plans already include the API at fair use.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {API_TIERS.map((a) => (
              <div key={a.name} className={`${SURFACE} flex flex-col p-6`}>
                <div className="text-[14.5px] font-bold text-white">{a.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-[#f4efe3]">{a.price}</span>
                  {a.cadence && <span className="text-[12px] text-white/45">{a.cadence}</span>}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-[13px] text-white/60">
                  {a.lines.map((l) => <li key={l} className="flex gap-2"><Dot /> <span>{l}</span></li>)}
                </ul>
                <a href={a.to} className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-gold-400 hover:underline">
                  {a.to === DEVELOPERS_ROUTE ? "Developer platform" : "Talk to us"} <Chevron className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* professional services */}
      <section id="services" className="scroll-mt-24 border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-9 flex items-baseline gap-4">
            <span className="font-mono text-[13px] font-bold text-gold-400">03</span>
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">Professional services.</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">
                Standing up institutional governance is an engagement, not a download. We deploy, migrate and design the
                governance to your mandate.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {SERVICES.map(([t, b]) => (
              <div key={t} className={`${SURFACE} p-6`}>
                <div className="text-[14.5px] font-bold text-white">{t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-white/35">
            Indicative rates: consulting US$2,000–5,000/day; fixed-price implementations from US$20,000. Scoped per
            engagement.
          </p>
        </div>
      </section>

      {/* closing */}
      <section className="border-t border-white/5 bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-white">Add everyone. Pay for the governance.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
            Start free, prove the governed pipeline against your own documents, and move to a plan when you deploy.
            No per-seat surprise — ever.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href={PROCUREMENT_ROUTE}
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              Evaluation package
            </a>
            <button onClick={() => nav("/signup")}
              className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              Start free <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Pricing;
