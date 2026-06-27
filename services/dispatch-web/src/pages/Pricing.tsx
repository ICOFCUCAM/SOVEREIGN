import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, Chevron, Dot, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { PROCUREMENT_ROUTE, DEVELOPERS_ROUTE, ARCHITECTURE_ROUTE, SECURITY_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";
import { usePricingCopy } from "../lib/messages";

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

// Structural meta — the bits that never translate (glyph kinds, CTA routes/kind,
// which tier is featured). Text comes from the locale catalog, zipped by index.
const TIER_META: { deployKinds: DeployKind[]; ctaTo: string; ctaKind: "primary" | "ghost"; featured?: boolean }[] = [
  { deployKinds: ["cloud"], ctaTo: "/signup", ctaKind: "ghost" },
  { deployKinds: ["cloud"], ctaTo: "/signup", ctaKind: "ghost" },
  { deployKinds: ["cloud", "private"], ctaTo: "/signup", ctaKind: "primary", featured: true },
  { deployKinds: ["cloud", "private", "onprem"], ctaTo: PROCUREMENT_ROUTE, ctaKind: "ghost" },
  { deployKinds: ["sovereign", "airgap", "onprem"], ctaTo: PROCUREMENT_ROUTE, ctaKind: "ghost" },
];
const API_META: { to: string }[] = [{ to: DEVELOPERS_ROUTE }, { to: DEVELOPERS_ROUTE }, { to: PROCUREMENT_ROUTE }];

const Pricing: React.FC = () => {
  const nav = useNavigate();
  const c = usePricingCopy();
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
          <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">{c.eyebrow}</span></div>
          <h1 className="mt-4 max-w-4xl font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#f4efe3] sm:text-6xl">{c.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">{c.lead}</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={() => nav("/signup")}
              className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              {c.ctaStart} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
            <a href={PROCUREMENT_ROUTE}
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              {c.ctaPackage}
            </a>
            <span className="text-[12px] text-white/40">{c.startNote}</span>
          </div>
        </div>
      </section>

      {/* philosophy band — charge for / never for */}
      <section id="philosophy" className="scroll-mt-24 border-b border-white/5 px-8 py-14 lg:px-12">
        <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-2">
          <div className={`${SURFACE} p-7`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-400">{c.payForLabel}</div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {c.chargeFor.map((x) => (
                <span key={x} className="rounded-md border border-gold-400/25 bg-gold-400/[0.06] px-3 py-1.5 text-[13px] font-semibold text-gold-200/90">{x}</span>
              ))}
            </div>
          </div>
          <div className={`${SURFACE} p-7`}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.neverForLabel}</div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {c.neverFor.map((x) => (
                <span key={x} className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-[13px] font-medium text-white/45 line-through decoration-white/25">{x}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* unlimited institutional users — explained, not just listed */}
      <section id="institutional-users" className="scroll-mt-24 border-b border-white/5 px-8 py-14 lg:px-12">
        <div className="mx-auto max-w-[1180px] rounded-2xl border border-gold-400/25 bg-gradient-to-b from-gold-400/[0.07] to-white/[0.01] p-9 text-center shadow-[0_30px_80px_-44px_rgba(202,164,90,0.5)]">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-[#f4efe3] sm:text-4xl">{c.usersTitle}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/65">{c.usersBody}</p>
        </div>
      </section>

      {/* tiers */}
      <section id="plans" className="scroll-mt-24 border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-9 flex items-baseline gap-4">
            <span className="font-mono text-[13px] font-bold text-gold-400">01</span>
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">{c.plansTitle}</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">{c.plansLead}</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-5 sm:grid-cols-2">
            {c.tiers.map((t, ti) => {
              const m = TIER_META[ti];
              return (
              <div key={t.name}
                className={`relative flex flex-col rounded-xl border p-6 transition duration-300 hover:-translate-y-1 ${m.featured ? "border-gold-400/40 bg-gradient-to-b from-gold-400/[0.07] to-white/[0.01] shadow-[0_24px_60px_-30px_rgba(202,164,90,0.45)]" : "border-white/8 bg-white/[0.015] hover:border-white/20"}`}>
                {m.featured && (
                  <div className="absolute -top-2.5 left-6 rounded-full border border-gold-400/40 bg-[#1c1407] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gold-300">{c.mostChosen}</div>
                )}
                <div className="text-[15px] font-bold text-white">{t.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-bold text-[#f4efe3]">{t.price}</span>
                  {t.cadence && <span className="text-[12px] text-white/45">{t.cadence}</span>}
                </div>
                <p className="mt-2 min-h-[3.75rem] text-[13px] leading-snug text-white/60">{t.purpose}</p>

                {/* deployment — a visible selling point; procurement filters on it first */}
                <div className="mt-3 rounded-md border border-gold-400/20 bg-gold-400/[0.05] px-3 py-2.5">
                  <div className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-gold-400/80">{c.deploymentLabel}</div>
                  <div className="mt-1.5 space-y-1">
                    {t.deployment.map((label, di) => (
                      <div key={label} className="flex items-center gap-2 text-[12px] font-medium text-gold-100/85">
                        <DeployGlyph kind={m.deployKinds[di]} className="h-3.5 w-3.5 shrink-0 text-gold-400/80" /> {label}
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
                <button onClick={() => nav(m.ctaTo)}
                  className={m.ctaKind === "primary"
                    ? "group mt-6 inline-flex items-center justify-center gap-2 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500"
                    : "group mt-6 inline-flex items-center justify-center gap-2 rounded border border-white/15 bg-white/[0.02] px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]"}>
                  {t.ctaLabel} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
              </div>
              );
            })}
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-white/35">{c.plansFootnote}</p>
        </div>
      </section>

      {/* procurement reassurance — the governance floor is in every paid plan */}
      <section id="included" className="scroll-mt-24 border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1180px]">
          <div className="mb-7 flex items-baseline gap-4">
            <span className="font-mono text-[13px] font-bold text-gold-400">02</span>
            <div>
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">{c.includedTitle}</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">{c.includedLead}</p>
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.includedItems.map((f) => (
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
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">{c.apiTitle}</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">{c.apiLead}</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {c.apiTiers.map((a, ai) => (
              <div key={a.name} className={`${SURFACE} flex flex-col p-6`}>
                <div className="text-[14.5px] font-bold text-white">{a.name}</div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-serif text-2xl font-bold text-[#f4efe3]">{a.price}</span>
                  {a.cadence && <span className="text-[12px] text-white/45">{a.cadence}</span>}
                </div>
                <ul className="mt-4 flex-1 space-y-2 text-[13px] text-white/60">
                  {a.lines.map((l) => <li key={l} className="flex gap-2"><Dot /> <span>{l}</span></li>)}
                </ul>
                <a href={API_META[ai].to} className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-gold-400 hover:underline">
                  {API_META[ai].to === DEVELOPERS_ROUTE ? c.apiDevLink : c.apiTalkLink} <Chevron className="h-3.5 w-3.5" />
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
              <h2 className="font-serif text-3xl font-bold tracking-tight text-white">{c.implTitle}</h2>
              <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">{c.implBody}</p>
            </div>
            <div className="lg:justify-self-end">
              <a href={PROCUREMENT_ROUTE}
                className="group inline-flex items-center gap-2.5 rounded border border-gold-400/40 bg-gold-400/[0.08] px-6 py-3.5 text-[13px] font-bold uppercase tracking-wide text-gold-200 transition active:translate-y-px hover:bg-gold-400/[0.14]">
                {c.implCta} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* close on confidence, not on price */}
      <section className="border-t border-white/5 bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">{c.closeTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">{c.closeBody}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => nav("/signup")}
              className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              {c.closeLaunch} <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a href={PROCUREMENT_ROUTE}
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              {c.closePackage}
            </a>
          </div>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[12px] font-semibold uppercase tracking-wide text-white/45">
            <a href={ARCHITECTURE_ROUTE} className="transition hover:text-gold-400">{c.linkArchitecture}</a>
            <span className="text-white/15">·</span>
            <a href={SECURITY_ROUTE} className="transition hover:text-gold-400">{c.linkSecurity}</a>
            <span className="text-white/15">·</span>
            <a href="#plans" className="transition hover:text-gold-400">{c.linkDeployment}</a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
};

export default Pricing;
