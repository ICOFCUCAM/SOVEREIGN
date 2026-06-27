import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, Chevron, Dot, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { PROCUREMENT_ROUTE, DEVELOPERS_ROUTE, ARCHITECTURE_ROUTE, SECURITY_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Public pricing — the artefact of ADR-012. Dispatch is priced like institutional
// infrastructure, not a collaboration tool: never per seat, never per file. Each
// tier tells a one-line story of who it is for; deployment is a visible selling
// point (procurement filters on it first); and the page ends on evaluation
// confidence, not on a price.

type DeployKind = "cloud" | "private" | "onprem" | "sovereign" | "airgap";

const DeployGlyph: React.FC<{ kind: DeployKind; className?: string }> = ({ kind, className = "h-3.5 w-3.5" }) => {
  const p: Record<DeployKind, React.ReactNode> = {
    cloud: <path d="M6.5 13.5a3 3 0 0 1 .4-5.96A4 4 0 0 1 14.5 8.2a2.75 2.75 0 0 1-.2 5.3H6.5z" />,
    private: <><rect x="4" y="3.5" width="8" height="11" rx="0.5" /><path d="M6 6h1.5M6 8.5h1.5M6 11h1.5M9 6h1.5M9 8.5h1.5M9 11h1.5" /></>,
    onprem: <><rect x="3.5" y="4" width="9" height="3.2" rx="0.6" /><rect x="3.5" y="8.8" width="9" height="3.2" rx="0.6" /><path d="M5.4 5.6h.01M5.4 10.4h.01" /></>,
    sovereign: <path d="M8 2.2l5 1.8v4c0 3.2-2.1 5.6-5 6.8-2.9-1.2-5-3.6-5-6.8v-4l5-1.8z" />,
    airgap: <><rect x="4" y="7.2" width="8" height="6.3" rx="1" /><path d="M5.8 7.2V5.6a2.2 2.2 0 0 1 4.4 0v1.6" /></>,
  };
  return <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{p[kind]}</svg>;
};

type Cta = { label: string; to: string; kind: "primary" | "ghost" };
type Deploy = { kind: DeployKind; label: string };

type Tier = {
  name: string;
  price: string;
  cadence?: string;
  purpose: string;          // the one-line "who it is for" story
  carry?: string;           // "Everything in X, plus" — the upgrade ladder
  audience: string;
  deployment: Deploy[];
  featured?: boolean;
  includes: string[];       // differentiators only — the universal floor lives in INCLUDED_EVERYWHERE
  cta: Cta;
};

const TIERS: Tier[] = [
  {
    name: "Evaluation",
    price: "Free",
    purpose: "Evaluate Dispatch end to end.",
    audience: "Product evaluation",
    deployment: [{ kind: "cloud", label: "Managed Cloud" }],
    includes: ["Up to 5 users", "10 governed publications", "Watermarked — not an official record"],
    cta: { label: "Start free", to: "/signup", kind: "ghost" },
  },
  {
    name: "Institutional",
    price: "US$299",
    cadence: "/month",
    purpose: "Run one institution with production governance.",
    audience: "NGOs · municipalities · schools · small companies",
    deployment: [{ kind: "cloud", label: "Managed Cloud" }],
    includes: ["Unlimited institutional users", "500 governed publications / month", "Single institution", "SSO-ready", "Email support"],
    cta: { label: "Start free", to: "/signup", kind: "ghost" },
  },
  {
    name: "Institutional Plus",
    price: "US$999",
    cadence: "/month",
    purpose: "Operate multiple departments with enterprise oversight and advanced governance.",
    carry: "Everything in Institutional, plus",
    audience: "Universities · hospitals · mid-market · agencies",
    deployment: [{ kind: "cloud", label: "Managed Cloud" }, { kind: "private", label: "Private Cloud" }],
    featured: true,
    includes: ["Unlimited governed publications", "Multiple departments · office hierarchy", "Advanced governance policies", "Analytics & executive dashboard", "Priority support"],
    cta: { label: "Start free", to: "/signup", kind: "primary" },
  },
  {
    name: "Enterprise",
    price: "From US$3,500",
    cadence: "/month",
    purpose: "Connect Dispatch to your identity, infrastructure and compliance environment.",
    carry: "Everything in Institutional Plus, plus",
    audience: "Ministries · national agencies · large enterprises",
    deployment: [{ kind: "cloud", label: "Managed" }, { kind: "private", label: "Private" }, { kind: "onprem", label: "On-Premises" }],
    includes: ["SSO — Azure AD · Okta", "Audit exports", "High availability & SLA", "Enterprise support", "Dedicated onboarding"],
    cta: { label: "Talk to us", to: PROCUREMENT_ROUTE, kind: "ghost" },
  },
  {
    name: "Sovereign",
    price: "Custom",
    cadence: "engagement",
    purpose: "Own the entire platform under your jurisdiction.",
    carry: "Everything in Enterprise, plus",
    audience: "Governments · central banks · defence · supreme courts · election commissions",
    deployment: [{ kind: "sovereign", label: "Sovereign Hosting" }, { kind: "airgap", label: "Air-Gapped" }, { kind: "onprem", label: "On-Premises" }],
    includes: ["Source escrow (if negotiated)", "Custom integrations", "Migration & training", "Dedicated support", "White-glove deployment"],
    cta: { label: "Talk to us", to: PROCUREMENT_ROUTE, kind: "ghost" },
  },
];

const CHARGE_FOR = ["Governance", "Institutional authority", "Compliance", "Sovereignty", "Deployment model", "Support level", "API integration"];
const NEVER_FOR = ["Per seat", "Per user", "Storage", "PDFs", "Documents as files"];

// The universal governance floor — included in every paid plan. Listing it once,
// loudly, reassures procurement that the core platform is never an add-on.
const INCLUDED_EVERYWHERE = [
  "Governance enforcement", "Evidence chain", "Governance certificates",
  "Preservation certificates", "Cryptographic integrity", "Complete audit history",
  "Unlimited institutional users", "REST API", "Documentation",
];

const API_TIERS: { name: string; price: string; cadence?: string; lines: string[]; to: string }[] = [
  { name: "Developer", price: "Free", lines: ["Sandbox", "500 API calls / month"], to: DEVELOPERS_ROUTE },
  { name: "API Professional", price: "US$199", cadence: "/month", lines: ["50,000 API calls", "OAuth · webhooks", "Support"], to: DEVELOPERS_ROUTE },
  { name: "API Enterprise", price: "Custom", lines: ["Unlimited calls", "Custom rate & terms"], to: PROCUREMENT_ROUTE },
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
      <PageBanner slug="default" alt="" />

      {/* hero */}
      <section className="border-b border-white/5 px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">Pricing</span></div>
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
          </div>
        </div>
      </section>

      {/* unlimited institutional users — explained, not just listed */}
      <section id="institutional-users" className="scroll-mt-24 border-b border-white/5 px-8 py-14 lg:px-12">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.07] to-white/[0.01] p-9 text-center shadow-[0_30px_80px_-44px_rgba(202,164,90,0.5)]">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#f4efe3] sm:text-4xl">Unlimited institutional users.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/65">
            Dispatch is licensed to <span className="text-white/90">institutions — not individual employees</span>.
            Add every official, reviewer, publisher and administrator without seat-based pricing. A ministry of
            8,000 is never billed for 8,000 accounts that rarely log in. That is what sets Dispatch apart from
            Microsoft 365, Google Workspace and Atlassian: you are not taxed for letting people do their work.
          </p>
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
                The path is the story: evaluate, run one institution, scale to many departments, integrate the
                enterprise, then own the platform under your own jurisdiction. Each step inherits everything below it.
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
                <p className="mt-2 min-h-[3.75rem] text-[13px] leading-snug text-white/60">{t.purpose}</p>

                {/* deployment — a visible selling point; procurement filters on it first */}
                <div className="mt-3 rounded-md border border-gold-400/20 bg-gold-400/[0.05] px-3 py-2.5">
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-gold-400/80">Deployment</div>
                  <div className="mt-1.5 space-y-1">
                    {t.deployment.map((d) => (
                      <div key={d.label} className="flex items-center gap-2 text-[12px] font-medium text-gold-100/85">
                        <DeployGlyph kind={d.kind} className="h-3.5 w-3.5 shrink-0 text-gold-400/80" /> {d.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 border-t border-white/5 pt-3 text-[11.5px] font-medium uppercase tracking-wide text-white/35">{t.audience}</div>

                {t.carry && <div className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.12em] text-gold-400/75">{t.carry}</div>}
                <ul className={`${t.carry ? "mt-2" : "mt-4"} flex-1 space-y-2 text-[13px] text-white/65`}>
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

      {/* procurement reassurance — the governance floor is in every paid plan */}
      <section id="included" className="scroll-mt-24 border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-7 flex items-baseline gap-4">
            <span className="font-mono text-[13px] font-bold text-gold-400">02</span>
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">Every paid plan includes</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">
                The full governance platform is never an add-on. Every production plan carries the complete
                chain of trust — enforcement, evidence, certificates, integrity and audit.
              </p>
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED_EVERYWHERE.map((f) => (
              <div key={f} className="flex items-center gap-3 border-b border-white/5 py-2.5">
                <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-gold-400"><path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span className="text-[14px] text-white/75">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API as its own product */}
      <section id="api" className="scroll-mt-24 border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-9 flex items-baseline gap-4">
            <span className="font-mono text-[13px] font-bold text-gold-400">03</span>
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

      {/* implementation team — services exist, but never compete with the subscription plans */}
      <section id="implementation" className="scroll-mt-24 border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-white/10 bg-white/[0.02] p-9 sm:p-11">
          <div className="grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">Need deployment, migration or governance consulting?</h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">
                Our implementation team helps institutions design governance models, migrate existing publication
                workflows, integrate identity providers, and deploy Dispatch in managed, private, on-premises or
                sovereign environments.
              </p>
            </div>
            <div className="lg:justify-self-end">
              <a href={PROCUREMENT_ROUTE}
                className="group inline-flex items-center gap-2.5 rounded border border-gold-400/40 bg-gold-400/[0.08] px-6 py-3.5 text-[13px] font-bold uppercase tracking-wide text-gold-200 transition active:translate-y-px hover:bg-gold-400/[0.14]">
                Talk to our implementation team <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* close on confidence, not on price */}
      <section className="border-t border-white/5 bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">Ready to evaluate Dispatch?</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
            Download the complete procurement package, review the security architecture, explore deployment options,
            or launch an evaluation environment in minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => nav("/signup")}
              className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              Launch Evaluation <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a href={PROCUREMENT_ROUTE}
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              Download Procurement Package
            </a>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-semibold uppercase tracking-wide text-white/45">
            <a href={ARCHITECTURE_ROUTE} className="transition hover:text-gold-400">Architecture</a>
            <span className="text-white/15">·</span>
            <a href={SECURITY_ROUTE} className="transition hover:text-gold-400">Security</a>
            <span className="text-white/15">·</span>
            <a href="#plans" className="transition hover:text-gold-400">Deployment options</a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Pricing;
