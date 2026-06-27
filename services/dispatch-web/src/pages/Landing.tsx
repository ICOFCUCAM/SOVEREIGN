import React from "react";
import { useNavigate } from "react-router-dom";
import { DispatchMark, Chevron, PublicHeader, PublicFooter, FilmGrain, useReveal, TrustStrip } from "../components/brand";
import { RecordArtifact } from "../components/RecordArtifact";
import { GovernedJourney } from "../components/GovernedJourney";
import { CountUp } from "../components/CountUp";
import {
  ARCHITECTURE_ROUTE, PROCUREMENT_ROUTE, OFFICIAL_RECORD_ROUTE, VERIFY_ROUTE,
  SECURITY_ROUTE, TRUST_ROUTE, COMPLIANCE_ROUTE, EVIDENCE_ROUTE, DEVELOPERS_ROUTE,
  COST_ROUTE, ROI_ROUTE,
} from "../lib/routes";
import { VALUE_BASE } from "../lib/value";
import { useHomeCopy } from "../lib/messages";

// The front door, ordered as an executive reads — each section answers the next
// question (see docs/homepage-narrative.md): what is this → why does it matter →
// why can't we continue → how does it work → why is it different → can I trust it
// → can it work for us → how do I evaluate. A white-paper / keynote, not a SaaS
// product page. All visible copy lives in lib/messages/home.ts so the front door
// is fully translatable; only icons, slugs and routes stay here.

// ── a small, consistent line-icon set ───────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  fingerprint: <><path d="M12 11a2.5 2.5 0 0 1 2.5 2.5V16" /><path d="M12 11a2.5 2.5 0 0 0-2.5 2.5V18" /><path d="M12 7.5a5.5 5.5 0 0 1 5.5 5.5V15" /><path d="M12 7.5A5.5 5.5 0 0 0 6.5 13v3" /></>,
  seal: <><circle cx="12" cy="9" r="5" /><path d="M9 13.5 8 21l4-2 4 2-1-7.5" /></>,
  shieldcheck: <><path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>,
  pen: <><path d="M4 20s3.5-.8 5.5-2.8l8-8-2.7-2.7-8 8C4.8 16.5 4 20 4 20z" /><path d="M14.5 6.5l3 3" /></>,
  branch: <><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="9" r="2" /><path d="M6 8v8M6 13h6a4 4 0 0 0 4-4" /></>,
  archive: <><rect x="4" y="4" width="16" height="16" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M12 8.5V8M12 16v-.5" /></>,
  coins: <><ellipse cx="12" cy="7" rx="7" ry="3" /><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7" /><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" /></>,
  network: <><circle cx="12" cy="12" r="2" /><circle cx="12" cy="4" r="1.6" /><circle cx="5" cy="18" r="1.6" /><circle cx="19" cy="18" r="1.6" /><path d="M12 5.6v4.4M10.5 13.3 6.2 16.6M13.5 13.3l4.3 3.3" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></>,
  scale: <><path d="M12 4v16M7 20h10M5 7h14" /><path d="M5 7l-2.5 5a2.5 2.5 0 0 0 5 0zM19 7l-2.5 5a2.5 2.5 0 0 0 5 0z" /></>,
  users: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 5.5M16.5 19a5.5 5.5 0 0 0-3-4.9" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
};
const Ico: React.FC<{ name: string; className?: string }> = ({ name, className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[name]}</svg>
);

// A unified section eyebrow — a short gold rule before the label.
const Kicker: React.FC<{ children: React.ReactNode; center?: boolean }> = ({ children, center }) => (
  <div className={`flex items-center gap-3 ${center ? "justify-center" : ""}`}>
    <span className="h-px w-7 bg-gold-500/55" aria-hidden />
    <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{children}</span>
  </div>
);

// Structural constants — icons / slugs / routes that never translate. Text comes
// from the locale copy catalog (lib/messages/home.ts), zipped by index.
const BADGE_ICONS = ["branch", "seal", "shieldcheck"];
const GOVERNANCE_ICONS = ["scale", "seal", "archive"];
const RESULT_ICONS = ["fingerprint", "seal", "shieldcheck"];
const SECURITY_ICONS = ["lock", "shieldcheck", "globe", "grid", "fingerprint", "archive"];
const COST_STAT_ICONS = ["users", "pen", "clock"];
const PROOF_STAT_NUMS = ["9", "3", "1", "∞"];
const OUTCOME_META = [
  { slug: "reduce-fragmentation", icon: "grid" }, { slug: "reduce-audit", icon: "shieldcheck" },
  { slug: "accelerate-execution", icon: "pen" }, { slug: "prevent-errors", icon: "branch" },
  { slug: "protect-knowledge", icon: "archive" }, { slug: "reduce-cost", icon: "coins" },
  { slug: "enable-services", icon: "network" },
];
const INDUSTRY_SLUGS = ["government", "justice", "healthcare", "universities", "enterprise", "regulators"];
const PROOF_LINK_ROUTES = [ARCHITECTURE_ROUTE, SECURITY_ROUTE, COMPLIANCE_ROUTE, EVIDENCE_ROUTE, DEVELOPERS_ROUTE, TRUST_ROUTE, PROCUREMENT_ROUTE];

const SectorImage: React.FC<{ slug: string; name: string }> = ({ slug, name }) => {
  const [failed, setFailed] = React.useState(false);
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[linear-gradient(160deg,#16140e,#090909)]">
      {!failed && <img src={`/people/${slug}.webp`} alt={name} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0b0b0b] to-transparent" />
      <div className="absolute bottom-0 left-0 p-4 font-serif text-[1.45rem] font-bold leading-none text-white">{name}</div>
    </div>
  );
};

const Landing: React.FC = () => {
  useReveal();
  const nav = useNavigate();
  const c = useHomeCopy();
  const heroRef = React.useRef<HTMLDivElement>(null);
  const artRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const hero = heroRef.current, art = artRef.current;
    if (!hero || !art) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        art.style.transform = `perspective(1600px) rotateY(${px * 3}deg) rotateX(${-py * 2.4}deg) translate3d(${px * 8}px, ${py * 6}px, 0)`;
      });
    };
    const onLeave = () => { cancelAnimationFrame(raf); art.style.transform = ""; };
    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => { hero.removeEventListener("pointermove", onMove); hero.removeEventListener("pointerleave", onLeave); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <main>
        {/* ── HERO — the approved two-column instrument ── */}
        <div id="top" className="relative overflow-hidden border-t border-white/[0.06]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_72%_32%,rgba(233,200,120,0.055),transparent_72%)]" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
          <div ref={heroRef} className="relative z-10 mx-auto grid min-h-0 max-w-[1540px] grid-cols-1 items-center gap-12 px-5 py-16 sm:min-h-[760px] sm:gap-14 sm:px-8 sm:py-20 lg:px-12 xl:min-h-[900px] xl:grid-cols-[40fr_60fr] xl:gap-12">
            <div className="hero-stagger max-w-xl">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-7 bg-gold-500/55" aria-hidden />
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.34em] text-gold-400">{c.hero.eyebrow}</p>
              </div>
              <h1 className="font-serif text-[2.55rem] font-bold leading-[1.04] tracking-[-0.022em] text-[#f4efe3] sm:text-[3.1rem] 2xl:text-[3.5rem]">
                {c.hero.titleLead}<span className="text-gold-400">{c.hero.titleAccent}</span>
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {c.hero.verbs.map((v, i) => (
                  <React.Fragment key={v}>
                    <span className="text-white/70">{v}</span>
                    {i < c.hero.verbs.length - 1 && <span className="text-gold-400/40" aria-hidden>·</span>}
                  </React.Fragment>
                ))}
              </div>
              <p className="lead-balance mt-7 max-w-[32rem] text-[16.5px] leading-[1.7] text-white/60">{c.hero.lead}</p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button onClick={() => nav("/console")}
                  className="btn-sheen group inline-flex items-center justify-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                  {c.hero.ctaLaunch}
                  <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
                <button onClick={() => nav(ARCHITECTURE_ROUTE)}
                  className="inline-flex items-center justify-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
                  {c.hero.ctaArchitecture}
                </button>
              </div>
              <p className="mt-5 flex items-center gap-2.5 text-[12.5px] text-white/45">
                <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-gold-400/80" aria-hidden />
                {c.hero.evalNote}
              </p>
            </div>
            <div className="relative flex justify-center xl:justify-end">
              <div ref={artRef} className="w-full max-w-[420px] transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform xl:max-w-[680px]">
                <RecordArtifact className="w-full" />
              </div>
            </div>
          </div>
          <a href="#stakes" aria-label="Scroll to content"
            className="group absolute inset-x-0 bottom-6 z-20 mx-auto hidden w-fit flex-col items-center gap-1 text-gold-400/45 transition hover:text-gold-300 sm:flex">
            <span className="text-[9px] font-semibold uppercase tracking-[0.3em]">Scroll</span>
            <Chevron className="scroll-cue h-4 w-4 rotate-90" />
          </a>
        </div>

        {/* ── HERO continued — cinematic statement + three proof statements ── */}
        <section id="stakes" className="relative flex min-h-[80vh] items-center overflow-hidden border-y border-white/[0.06]">
          <img src="/people/government.webp" alt="" aria-hidden loading="lazy" decoding="async" className="sd-kenburns absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#070707]/55" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/35 to-[#070707]/70" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
          <div className="relative mx-auto w-full max-w-[1300px] px-6 py-24 lg:px-12">
            <p className="text-[12px] font-semibold uppercase tracking-[0.34em] text-gold-400">{c.stakes.eyebrow}</p>
            <h2 className="mt-5 max-w-4xl font-serif text-[2.8rem] font-bold leading-[1.02] tracking-[-0.02em] text-[#f6f1e6] [text-shadow:0_2px_30px_rgba(0,0,0,0.55)] sm:text-[4.2rem] lg:text-[5rem]">{c.stakes.title}</h2>
            <p className="mt-7 max-w-xl text-[19px] leading-relaxed text-white/75 [text-shadow:0_1px_16px_rgba(0,0,0,0.5)]">{c.stakes.lead}</p>
            <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
              {c.stakes.badges.map((b, i) => (
                <div key={b.lead} className="rounded-xl border border-white/12 bg-white/[0.04] px-5 py-4 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/35 hover:bg-white/[0.07]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-400/30 bg-gold-400/[0.08] text-gold-300"><Ico name={BADGE_ICONS[i]} className="h-5 w-5" /></span>
                  <div className="mt-3 text-[14.5px] font-bold leading-snug text-white">{b.lead}</div>
                  <div className="mt-0.5 text-[12px] text-white/50">{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <TrustStrip />

        {/* ── 2 · THE PROBLEM — an executive cost-ledger ── */}
        <section id="cost" className="border-b border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto grid max-w-[1180px] items-center gap-12 lg:grid-cols-[1.04fr_0.96fr] lg:gap-16">
            <div>
              <Kicker>{c.cost.eyebrow}</Kicker>
              <h2 className="mt-6 font-serif font-bold tracking-tight text-[#f4efe3]">
                <span className="block text-[2.1rem] leading-[1.08] sm:text-[2.9rem]">{c.cost.titleA}</span>
                <span className="mt-4 block text-[1.9rem] leading-[1.1] text-white/65 sm:text-[2.4rem]">{c.cost.titleB}</span>
                <span className="mt-1 block font-serif text-[3.6rem] leading-[0.95] text-gold-300 sm:text-[5rem]">{c.cost.titleAccent}</span>
              </h2>
              <p className="mt-8 max-w-md text-[17px] leading-relaxed text-white/65">{c.cost.body}</p>
              <button onClick={() => nav(COST_ROUTE)}
                className="group mt-9 inline-flex items-center gap-2.5 rounded-md border border-gold-400/40 bg-gold-400/[0.06] px-6 py-3.5 text-[13px] font-bold uppercase tracking-[0.06em] text-gold-200 transition hover:bg-gold-400/[0.12] hover:text-gold-100">
                {c.cost.cta} <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            </div>
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.012] p-6 shadow-[0_40px_100px_-50px_rgba(0,0,0,0.9)] sm:p-7">
              <div className="absolute -inset-px -z-10 rounded-2xl bg-[radial-gradient(60%_60%_at_70%_0%,rgba(233,200,120,0.10),transparent_70%)]" aria-hidden />
              <div className="flex items-end justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-white/40">{c.cost.docLabel}</div>
                  <div className="mt-1 text-[14.5px] font-medium text-white/65">{c.cost.docSub}</div>
                </div>
                <div className="font-serif text-[1.5rem] font-bold leading-none text-white/45">≈ $0</div>
              </div>
              <div className="pt-5">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-400">{c.cost.officialLabel}</div>
                <ul className="mt-3.5 grid grid-cols-2 gap-x-5 gap-y-2">
                  {c.cost.items.map((s) => (
                    <li key={s} className="flex items-center gap-2.5 text-[13.5px] text-white/80">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold-400/15 text-[9px] text-gold-300">✓</span>{s}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-5">
                  {c.cost.stats.map((st, i) => (
                    <div key={st.label} className="text-center">
                      <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gold-400/80"><Ico name={COST_STAT_ICONS[i]} className="h-4 w-4" /></span>
                      <div className="mt-2 font-serif text-[1.5rem] font-bold leading-none text-white">{st.n}</div>
                      <div className="mt-1 text-[10.5px] uppercase tracking-wide text-white/40">{st.label}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-lg border border-gold-400/25 bg-gold-400/[0.06] px-4 py-3">
                  <span className="text-[13px] font-semibold text-gold-100">{c.cost.recordLabel}</span>
                  <span className="font-serif text-[1.05rem] font-bold text-gold-200">{c.cost.recordValue}</span>
                </div>
                <div className="mt-3 text-[11px] text-white/35">
                  {c.cost.illustrative}{" "}
                  <button onClick={() => nav(ROI_ROUTE)} className="font-semibold text-gold-300 hover:underline">{c.cost.modelLink}</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3 · THE JOURNEY ── */}
        <GovernedJourney />

        {/* ── 4 · THE RESULT — what makes an Official Record (light) ── */}
        <section id="difference" className="bg-[#f3eee3] px-6 py-20 text-[#11140f] lg:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9a7b27]">{c.result.eyebrow}</div>
              <h2 className="mt-5 font-serif text-[2.4rem] font-bold leading-[1.06] tracking-tight text-[#171712] sm:text-[3.1rem]">{c.result.title}</h2>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#3c3a31]">{c.result.body}</p>
              <div className="mt-9 grid gap-6 sm:grid-cols-3">
                {c.result.features.map((f, i) => (
                  <div key={f.t} className="group">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#171712]/12 bg-white/60 text-[#9a7b27] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[#9a7b27]/40 group-hover:bg-white"><Ico name={RESULT_ICONS[i]} className="h-6 w-6" /></span>
                    <div className="mt-3 text-[15px] font-bold text-[#171712]">{f.t}</div>
                    <div className="mt-1 text-[13px] leading-relaxed text-[#4a473d]">{f.d}</div>
                  </div>
                ))}
              </div>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={() => nav(OFFICIAL_RECORD_ROUTE)} className="rounded-md bg-[#171712] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#f3eee3] transition hover:bg-[#2a2a22]">{c.result.ctaWhat}</button>
                <button onClick={() => nav(VERIFY_ROUTE)} className="rounded-md border border-[#171712]/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-[#171712] transition hover:border-[#171712]/45">{c.result.ctaVerify}</button>
              </div>
            </div>
            <figure className="group relative">
              <div className="overflow-hidden rounded-2xl shadow-[0_50px_120px_-50px_rgba(0,0,0,0.55)] ring-1 ring-[#171712]/10">
                <img src="/people/officialpublication.webp" alt="An Official Publication — sealed, certified, verifiable"
                  loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.04] sm:aspect-[5/6]" />
              </div>
              <figcaption className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a7b27]">{c.result.caption}</figcaption>
            </figure>
          </div>
        </section>

        {/* ── 5 · WHY GOVERNANCE MATTERS ── */}
        <section id="governance" className="border-b border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="mx-auto max-w-3xl text-center">
              <Kicker center>{c.governance.eyebrow}</Kicker>
              <h2 className="mx-auto mt-5 font-serif text-[2.2rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[2.9rem]">{c.governance.title}</h2>
            </div>
            <div className="stagger mt-14 grid gap-5 lg:grid-cols-3">
              {c.governance.cards.map((g, i) => (
                <div key={g.t} className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
                  <span className="pointer-events-none absolute right-5 top-3 font-serif text-[3.4rem] font-bold leading-none text-white/[0.05]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-gold-400/25 bg-gold-400/[0.07] text-gold-300"><Ico name={GOVERNANCE_ICONS[i]} className="h-6 w-6" /></span>
                  <div className="mt-5 font-serif text-[1.4rem] font-bold leading-snug text-white">{g.t}</div>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/55">{g.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6 · BUSINESS VALUE ── */}
        <section id="outcomes" className="border-b border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <Kicker>{c.outcomes.eyebrow}</Kicker>
              <h2 className="mt-5 font-serif text-[2.3rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">{c.outcomes.title}</h2>
            </div>
            <button onClick={() => nav(`${VALUE_BASE}/${OUTCOME_META[0].slug}`)}
              className="group relative mt-12 flex w-full flex-col items-start gap-5 overflow-hidden rounded-2xl border border-gold-400/20 bg-gradient-to-br from-gold-400/[0.06] to-transparent p-8 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/40 sm:flex-row sm:items-center sm:gap-8">
              <span className="pointer-events-none absolute inset-y-7 left-0 w-1 rounded-r bg-gradient-to-b from-gold-300 to-gold-500/30" aria-hidden />
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold-400/30 bg-gold-400/[0.08] text-gold-300"><Ico name={OUTCOME_META[0].icon} className="h-7 w-7" /></span>
              <span className="flex-1">
                <span className="font-serif text-[1.6rem] font-bold leading-snug text-white sm:text-[2rem]">{c.outcomes.items[0].lead}</span>
                <span className="mt-2 block max-w-2xl text-[14.5px] leading-relaxed text-white/55">{c.outcomes.items[0].sub}</span>
              </span>
              <Chevron className="hidden h-5 w-5 shrink-0 text-gold-400/60 transition group-hover:translate-x-1 sm:block" />
            </button>
            <div className="stagger mt-5 grid gap-5 sm:grid-cols-2">
              {OUTCOME_META.slice(1).map((o, i) => (
                <button key={o.slug} onClick={() => nav(`${VALUE_BASE}/${o.slug}`)}
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.015] p-6 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/30 hover:bg-white/[0.03]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gold-400/80 transition group-hover:scale-105 group-hover:text-gold-300"><Ico name={o.icon} className="h-6 w-6" /></span>
                  <span>
                    <span className="font-serif text-[1.2rem] font-bold leading-snug text-white">{c.outcomes.items[i + 1].lead}</span>
                    <span className="mt-1.5 block text-[13.5px] leading-relaxed text-white/50">{c.outcomes.items[i + 1].sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-10">
              <button onClick={() => nav(ROI_ROUTE)} className="group inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">
                {c.outcomes.modelLink} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── 7 · TRUSTED EVERY DAY ── */}
        <section id="industries" className="border-b border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <Kicker>{c.industries.eyebrow}</Kicker>
              <h2 className="mt-5 font-serif text-[2.3rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">{c.industries.title}</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/55">{c.industries.sub}</p>
            </div>
            <div className="stagger mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {INDUSTRY_SLUGS.map((islug, idx) => {
                const name = c.industries.names[idx];
                const navSlug = ({ enterprise: "financial-institutions" } as Record<string, string>)[islug] || islug;
                return (
                  <button key={islug} onClick={() => nav(`/industries/${navSlug}`)}
                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/30">
                    <SectorImage slug={islug} name={name} />
                    <ul className="space-y-1.5 px-5 py-5">
                      {c.industries.types[idx].map((t) => (
                        <li key={t} className="flex items-center gap-2.5 text-[13.5px] text-white/70"><span className="h-1 w-1 shrink-0 rounded-full bg-gold-400/70" />{t}</li>
                      ))}
                      <li className="flex items-center gap-1.5 pt-1 text-[12px] font-semibold uppercase tracking-wide text-gold-400/80 transition group-hover:text-gold-300">{c.industries.forLabel} {name} <Chevron className="h-3 w-3 transition group-hover:translate-x-0.5" /></li>
                    </ul>
                  </button>
                );
              })}
            </div>
            <div className="mt-10">
              <button onClick={() => nav("/industries")} className="group inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">
                {c.industries.viewAll} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── monumental beat ── */}
        <section className="relative overflow-hidden border-b border-white/[0.06] bg-black px-6 py-28 lg:px-12">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]" aria-hidden>
            <DispatchMark className="h-[26rem] w-[26rem] text-gold-400" />
          </div>
          <blockquote className="relative mx-auto max-w-3xl text-center">
            <p className="font-serif text-[1.9rem] font-bold leading-[1.32] tracking-tight text-[#f4efe3] sm:text-[2.7rem]">{c.quote.text}</p>
          </blockquote>
        </section>

        {/* ── 8 · SOVEREIGN ARCHITECTURE ── */}
        <section id="sovereignty" className="relative overflow-hidden border-b border-white/[0.06] bg-black px-6 py-20 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(233,200,120,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(233,200,120,0.6)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(70%_70%_at_50%_30%,#000,transparent)]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(233,200,120,0.05),transparent_70%)]" aria-hidden />
          <div className="relative mx-auto max-w-[1000px] text-center">
            <Kicker center>{c.security.eyebrow}</Kicker>
            <h2 className="mx-auto mt-5 max-w-3xl font-serif text-[2.3rem] font-bold leading-[1.06] tracking-tight text-[#f4efe3] sm:text-[3rem]">{c.security.title}</h2>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/55">{c.security.sub}</p>
            <div className="stagger mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
              {c.security.labels.map((label, i) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold-400/25 bg-gold-400/[0.06] text-gold-300"><Ico name={SECURITY_ICONS[i]} className="h-5 w-5" /></span>
                  <span className="text-[13px] font-semibold text-white/80">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 9 · PROOF & PROCUREMENT ── */}
        <section id="proof" className="border-b border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-center">
              <Kicker center>{c.proof.eyebrow}</Kicker>
              <h2 className="mx-auto mt-4 max-w-2xl font-serif text-[2.2rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[2.9rem]">{c.proof.title}</h2>
            </div>
            <div className="mt-14 grid grid-cols-2 gap-y-10 border-y border-white/[0.08] py-12 sm:grid-cols-4 sm:divide-x sm:divide-white/[0.08]">
              {c.proof.statLabels.map((label, i) => (
                <div key={label} className="text-center">
                  <CountUp value={PROOF_STAT_NUMS[i]} className="tnum font-serif text-[3.4rem] font-bold leading-none text-gold-300 sm:text-[4rem]" />
                  <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">{label}</div>
                </div>
              ))}
            </div>
            <div className="stagger mt-14 grid gap-10 sm:grid-cols-3">
              {c.proof.columns.map((col) => (
                <div key={col.title}>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400/80">{col.title}</div>
                  <ul className="mt-4 space-y-2.5">
                    {col.items.map((it) => (
                      <li key={it} className="flex items-center gap-2.5 font-mono text-[13px] text-white/70"><span className="text-gold-400/70">▹</span>{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-14 flex flex-wrap justify-center gap-2.5">
              {c.proof.links.map((label, i) => (
                <button key={label} onClick={() => nav(PROOF_LINK_ROUTES[i])} className="rounded-md border border-white/15 px-4 py-2 text-[12.5px] font-semibold uppercase tracking-wide text-white/75 transition hover:border-white/35 hover:text-white">{label}</button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 10 · EVALUATE ── */}
        <section id="evaluate" className="relative overflow-hidden px-6 py-28 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_40%,rgba(233,200,120,0.07),transparent_72%)]" aria-hidden />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]" aria-hidden><DispatchMark className="h-[30rem] w-[30rem] text-gold-400" /></div>
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-[2.7rem] font-bold leading-[1.04] tracking-tight text-[#f4efe3] sm:text-[3.8rem]">{c.evaluate.title}</h2>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/55">{c.evaluate.body}</p>
            <div className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button onClick={() => nav("/console")}
                className="btn-sheen group inline-flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-b from-gold-300 to-gold-600 px-10 py-5 text-base font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_16px_40px_-12px_rgba(233,200,120,0.5)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500 sm:w-auto">
                {c.evaluate.ctaBegin} <Chevron className="h-5 w-5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(PROCUREMENT_ROUTE)}
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-10 py-5 text-base font-semibold uppercase tracking-[0.08em] text-white/85 transition hover:border-white/40 hover:bg-white/[0.05] sm:w-auto">
                {c.evaluate.ctaProcurement}
              </button>
            </div>
            <div className="mt-16 flex flex-col items-center gap-1 border-t border-white/[0.06] pt-10">
              <div className="flex items-center gap-2.5"><DispatchMark className="h-6 w-6 text-gold-400" /><span className="font-semibold tracking-tight text-white/85">Sovereign Dispatch</span></div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/40">{c.evaluate.tagline}</div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Landing;
