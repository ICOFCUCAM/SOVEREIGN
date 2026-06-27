import React from "react";
import { useNavigate } from "react-router-dom";
import { DispatchMark, Chevron, PublicHeader, PublicFooter, FilmGrain, useReveal } from "../components/brand";
import { RecordArtifact } from "../components/RecordArtifact";
import { GovernedJourney } from "../components/GovernedJourney";
import {
  ARCHITECTURE_ROUTE, PROCUREMENT_ROUTE, OFFICIAL_RECORD_ROUTE, VERIFY_ROUTE,
  SECURITY_ROUTE, TRUST_ROUTE, COMPLIANCE_ROUTE, COST_ROUTE, ROI_ROUTE,
} from "../lib/routes";
import { VALUE_BASE } from "../lib/value";

// The front door. Cut for rhythm and PROOF, not completeness. Each section has a
// different shape and weight; detail lives on dedicated pages. The homepage exists
// to make the value land, feel monumental, and answer a CIO's silent question —
// "why should I believe you?" — with evidence, not paragraphs.

const VERBS = ["Create", "Review", "Approve", "Authorize", "Publish", "Certify", "Verify", "Preserve"];

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
};
const Ico: React.FC<{ name: string; className?: string }> = ({ name, className = "h-6 w-6" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[name]}</svg>
);

// Proof badges under the cinematic statement — evidence, not navigation.
const PROOF_BADGES: { icon: string; lead: string; sub: string }[] = [
  { icon: "branch", lead: "Permanent evidence chains", sub: "Recorded as the record is made" },
  { icon: "lock", lead: "Cryptographic integrity", sub: "SHA-256 sealed · tamper-evident" },
  { icon: "shieldcheck", lead: "Independent verification", sub: "By anyone, with no account" },
];

const SPINE = ["Policy Draft", "Legal Review", "Compliance", "Executive Approval", "Publishing Office", "Official Publication", "Evidence Chain", "Permanent Preservation"];

// Risk-/outcome-led value — visual story blocks, not an accordion. A featured
// block leads; the rest follow in a two-column spread.
const OUTCOMES: { slug: string; icon: string; lead: string; sub: string }[] = [
  { slug: "reduce-fragmentation", icon: "grid", lead: "One governed platform — not seven disconnected systems.", sub: "Drafting, review, approval, publication, evidence and archive stop living in separate tools." },
  { slug: "reduce-audit", icon: "shieldcheck", lead: "Every audit already has its evidence.", sub: "The proof is produced as the record is made, not reconstructed when someone asks." },
  { slug: "accelerate-execution", icon: "pen", lead: "Every approval is already attributable.", sub: "Who decided, on what version, in what order — settled at the moment it happens." },
  { slug: "prevent-errors", icon: "branch", lead: "The wrong version can never go out.", sub: "One authoritative record; superseded and unapproved copies cannot pass as official." },
  { slug: "protect-knowledge", icon: "archive", lead: "Institutional memory that doesn't walk out the door.", sub: "Provenance and authority survive the people who created them." },
  { slug: "reduce-cost", icon: "coins", lead: "Stop paying for the same publication twice.", sub: "The duplicated handling between offices collapses into one governed flow." },
  { slug: "enable-services", icon: "network", lead: "Govern publication for others — as a service.", sub: "Become the authority that issues and verifies records for the institutions you serve." },
];

// The proof section — answer "why should I believe you?" with figures and a spec
// sheet, not adjectives.
const PROOF_STATS: [string, string][] = [
  ["9", "Governed stages"],
  ["3", "Permanent certificates"],
  ["1", "Authoritative publication"],
  ["∞", "Independent verifications"],
];
const PROOF_COLUMNS: { title: string; items: string[] }[] = [
  { title: "Technical proof", items: ["SHA-256 sealing", "Append-only architecture", "Immutable audit chain", "Tamper-evident integrity"] },
  { title: "Governance proof", items: ["Every action attributable", "Every approval recorded", "Every version preserved", "Separation of duties enforced"] },
  { title: "Operational proof", items: ["One governed pipeline", "End-to-end provenance", "Permanent preservation", "Unlimited verification"] },
];

const SECURITY: { icon: string; label: string }[] = [
  { icon: "lock", label: "Cryptographic sealing" },
  { icon: "shieldcheck", label: "Immutable audit evidence" },
  { icon: "globe", label: "Residency controls" },
  { icon: "grid", label: "Tenant isolation" },
  { icon: "fingerprint", label: "Independent verification" },
  { icon: "archive", label: "Long-term preservation" },
];

const Landing: React.FC = () => {
  useReveal();
  const nav = useNavigate();
  // Whisper-subtle pointer parallax on the instrument — fine pointers only, off under reduced-motion.
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
        {/* ── Hero — the approved two-column instrument (unchanged) ── */}
        <div id="top" className="relative overflow-hidden border-t border-white/[0.06]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_72%_32%,rgba(233,200,120,0.055),transparent_72%)]" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
          <div ref={heroRef} className="relative z-10 mx-auto grid min-h-0 max-w-[1540px] grid-cols-1 items-center gap-12 px-5 py-16 sm:min-h-[760px] sm:gap-14 sm:px-8 sm:py-20 lg:px-12 xl:min-h-[900px] xl:grid-cols-[40fr_60fr] xl:gap-12">
            <div className="hero-stagger max-w-xl">
              <div className="mb-8 flex items-center gap-3">
                <span className="h-px w-7 bg-gold-500/55" aria-hidden />
                <p className="text-[12.5px] font-semibold uppercase tracking-[0.34em] text-gold-400">Institutional Publication Infrastructure</p>
              </div>
              <h1 className="font-serif text-[2.55rem] font-bold leading-[1.04] tracking-[-0.022em] text-[#f4efe3] sm:text-[3.1rem] 2xl:text-[3.5rem]">
                The Vanguard of <span className="text-gold-400">Institutional Governance.</span>
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] font-semibold uppercase tracking-[0.16em] text-white/45">
                {VERBS.map((v, i) => (
                  <React.Fragment key={v}>
                    <span className="text-white/70">{v}</span>
                    {i < VERBS.length - 1 && <span className="text-gold-400/40" aria-hidden>·</span>}
                  </React.Fragment>
                ))}
              </div>
              <p className="lead-balance mt-7 max-w-[32rem] text-[16.5px] leading-[1.7] text-white/60">
                Institutions don't pay millions to create documents. They invest millions in the people, governance,
                approvals and authority that make those documents <span className="text-white/85">official</span>.
                Sovereign Dispatch is the infrastructure that unifies, governs, certifies and preserves that entire
                process.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <button onClick={() => nav("/console")}
                  className="group inline-flex items-center justify-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                  Launch Dispatch
                  <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </button>
                <button onClick={() => nav(ARCHITECTURE_ROUTE)}
                  className="inline-flex items-center justify-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
                  View Architecture
                </button>
              </div>
              <p className="mt-5 flex items-center gap-2.5 text-[12.5px] text-white/45">
                <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-gold-400/80" aria-hidden />
                Evaluate in your own environment — no sales call required.
              </p>
            </div>
            <div className="relative flex justify-center xl:justify-end">
              <div ref={artRef} className="w-full max-w-[420px] transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform xl:max-w-[680px]">
                <RecordArtifact className="w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Monumental cinematic statement + proof badges ── */}
        <section className="relative flex min-h-[80vh] items-center overflow-hidden border-y border-white/[0.06]">
          <img src="/people/government.webp" alt="" aria-hidden loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#070707]/55" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/35 to-[#070707]/70" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
          <div className="relative mx-auto w-full max-w-[1300px] px-6 py-24 lg:px-12">
            <p className="text-[12px] font-semibold uppercase tracking-[0.34em] text-gold-400">The stakes</p>
            <h2 className="mt-5 max-w-4xl font-serif text-[2.8rem] font-bold leading-[1.02] tracking-[-0.02em] text-[#f6f1e6] sm:text-[4.2rem] lg:text-[5rem]">
              Governing the world's most important decisions.
            </h2>
            <p className="mt-7 max-w-xl text-[19px] leading-relaxed text-white/70">
              Documents inform. Institutions govern. Official publications <span className="text-gold-300">prove it</span>.
            </p>
            {/* proof badges — premium, not navigation */}
            <div className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
              {PROOF_BADGES.map((b) => (
                <div key={b.lead} className="rounded-xl border border-white/12 bg-white/[0.04] px-5 py-4 backdrop-blur-sm">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gold-400/30 bg-gold-400/[0.08] text-gold-300"><Ico name={b.icon} className="h-5 w-5" /></span>
                  <div className="mt-3 text-[14.5px] font-bold leading-snug text-white">{b.lead}</div>
                  <div className="mt-0.5 text-[12px] text-white/50">{b.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The hidden cost — tightened ── */}
        <section id="cost" className="border-b border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">The hidden cost</div>
              <h2 className="mt-5 max-w-xl font-serif text-[2.3rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">
                Institutions don't pay to create documents.<br className="hidden sm:block" /> They pay to make them official.
              </h2>
              <p className="mt-6 max-w-lg text-[16.5px] leading-relaxed text-white/60">
                Every official publication passes through legal review, executive approval, publication and preservation.
                The cost is never writing the document. <span className="text-white/85">It is governing every decision around it.</span>
              </p>
              <button onClick={() => nav(COST_ROUTE)} className="group mt-8 inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">
                Read the full cost breakdown <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
            <div className="mx-auto w-full max-w-sm">
              {SPINE.map((step, i) => {
                const last = i === SPINE.length - 1;
                const official = step === "Official Publication";
                return (
                  <React.Fragment key={step}>
                    <div className={`flex items-center gap-3.5 ${official || last ? "text-gold-200" : "text-white/70"}`}>
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] ${official || last ? "border-gold-400/45 bg-gold-400/[0.08] text-gold-300" : "border-white/12 text-white/40"}`}>{i + 1}</span>
                      <span className={`text-[15px] ${official ? "font-bold" : "font-medium"}`}>{step}</span>
                    </div>
                    {!last && <div className="ml-[13px] h-4 w-px bg-gradient-to-b from-white/15 to-white/5" aria-hidden />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── THE SIGNATURE MOMENT — the governed journey ── */}
        <GovernedJourney />

        {/* ── LIGHT counterpoint — the distinction, as icon blocks ── */}
        <section id="difference" className="bg-[#f3eee3] px-6 py-20 text-[#11140f] lg:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9a7b27]">The distinction</div>
              <h2 className="mt-5 font-serif text-[2.4rem] font-bold leading-[1.06] tracking-tight text-[#171712] sm:text-[3.1rem]">
                A copy informs.<br /> An official record governs.
              </h2>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#3c3a31]">
                An ordinary document can be copied, edited or questioned. An Official Record is the institution's
                authoritative version of a decision — and it can always prove it.
                <span className="font-semibold text-[#171712]"> Institutional authority is permanent.</span>
              </p>
              <div className="mt-9 grid gap-6 sm:grid-cols-3">
                {[
                  ["fingerprint", "Permanent identity", "A Record ID, never reused."],
                  ["seal", "Provable provenance", "Certificates sealed at publication."],
                  ["shieldcheck", "Independent verification", "Confirmed genuine by anyone."],
                ].map(([icon, t, d]) => (
                  <div key={t}>
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#171712]/12 bg-white/60 text-[#9a7b27]"><Ico name={icon} className="h-6 w-6" /></span>
                    <div className="mt-3 text-[15px] font-bold text-[#171712]">{t}</div>
                    <div className="mt-1 text-[13px] leading-relaxed text-[#4a473d]">{d}</div>
                  </div>
                ))}
              </div>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={() => nav(OFFICIAL_RECORD_ROUTE)} className="rounded-md bg-[#171712] px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#f3eee3] transition hover:bg-[#2a2a22]">What is an Official Record?</button>
                <button onClick={() => nav(VERIFY_ROUTE)} className="rounded-md border border-[#171712]/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-[#171712] transition hover:border-[#171712]/45">Verify a record</button>
              </div>
            </div>
            <figure className="relative">
              <div className="overflow-hidden rounded-2xl shadow-[0_50px_120px_-50px_rgba(0,0,0,0.55)] ring-1 ring-[#171712]/10">
                <img src="/people/officialpublication.webp" alt="An Official Publication — sealed, certified, verifiable"
                  loading="lazy" className="aspect-[4/5] w-full object-cover sm:aspect-[5/6]" />
              </div>
              <figcaption className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9a7b27]">Sealed · Certified · Permanently verifiable</figcaption>
            </figure>
          </div>
        </section>

        {/* ── PROOF — answer "why should I believe you?" with figures, not adjectives ── */}
        <section id="proof" className="relative overflow-hidden border-b border-white/[0.06] bg-black px-6 py-20 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_55%_at_50%_0%,rgba(233,200,120,0.06),transparent_70%)]" aria-hidden />
          <div className="relative mx-auto max-w-[1100px]">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">The proof</div>
              <h2 className="mx-auto mt-4 max-w-2xl font-serif text-[2.2rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[2.9rem]">
                Built to be believed — not taken on trust.
              </h2>
            </div>
            {/* the figures */}
            <div className="mt-14 grid grid-cols-2 gap-y-10 border-y border-white/[0.08] py-12 sm:grid-cols-4">
              {PROOF_STATS.map(([n, label]) => (
                <div key={label} className="text-center">
                  <div className="tnum font-serif text-[3.4rem] font-bold leading-none text-gold-300 sm:text-[4rem]">{n}</div>
                  <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-white/50">{label}</div>
                </div>
              ))}
            </div>
            {/* the spec sheet */}
            <div className="mt-14 grid gap-10 sm:grid-cols-3">
              {PROOF_COLUMNS.map((col) => (
                <div key={col.title}>
                  <div className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gold-400/80">{col.title}</div>
                  <ul className="mt-4 space-y-2.5">
                    {col.items.map((it) => (
                      <li key={it} className="flex items-center gap-2.5 font-mono text-[13px] text-white/70">
                        <span className="text-gold-400/70">▹</span>{it}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Outcomes — visual story blocks ── */}
        <section id="outcomes" className="border-b border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Why institutions adopt it</div>
              <h2 className="mt-5 font-serif text-[2.3rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">
                Institutions don't become trusted by publishing.<br className="hidden sm:block" /> They become trusted by governing publication.
              </h2>
            </div>
            {/* featured block */}
            <button onClick={() => nav(`${VALUE_BASE}/${OUTCOMES[0].slug}`)}
              className="group mt-12 flex w-full flex-col items-start gap-5 rounded-2xl border border-gold-400/20 bg-gradient-to-br from-gold-400/[0.06] to-transparent p-8 text-left transition hover:border-gold-400/40 sm:flex-row sm:items-center sm:gap-8">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold-400/30 bg-gold-400/[0.08] text-gold-300"><Ico name={OUTCOMES[0].icon} className="h-7 w-7" /></span>
              <span className="flex-1">
                <span className="font-serif text-[1.6rem] font-bold leading-snug text-white sm:text-[2rem]">{OUTCOMES[0].lead}</span>
                <span className="mt-2 block max-w-2xl text-[14.5px] leading-relaxed text-white/55">{OUTCOMES[0].sub}</span>
              </span>
              <Chevron className="hidden h-5 w-5 shrink-0 text-gold-400/60 transition group-hover:translate-x-1 sm:block" />
            </button>
            {/* the rest */}
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              {OUTCOMES.slice(1).map((o) => (
                <button key={o.slug} onClick={() => nav(`${VALUE_BASE}/${o.slug}`)}
                  className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.015] p-6 text-left transition hover:border-gold-400/30 hover:bg-white/[0.03]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gold-400/80 transition group-hover:text-gold-300"><Ico name={o.icon} className="h-6 w-6" /></span>
                  <span>
                    <span className="font-serif text-[1.2rem] font-bold leading-snug text-white">{o.lead}</span>
                    <span className="mt-1.5 block text-[13.5px] leading-relaxed text-white/50">{o.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-10">
              <button onClick={() => nav(ROI_ROUTE)} className="group inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">
                Model the operational case for your institution <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Security & sovereignty — specifics, not adjectives ── */}
        <section id="sovereignty" className="relative overflow-hidden border-b border-white/[0.06] bg-black px-6 py-20 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(233,200,120,0.05),transparent_70%)]" aria-hidden />
          <div className="relative mx-auto max-w-[1000px] text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Security & sovereignty</div>
            <h2 className="mx-auto mt-5 max-w-3xl font-serif text-[2.3rem] font-bold leading-[1.06] tracking-tight text-[#f4efe3] sm:text-[3rem]">
              Sovereign by design. Verifiable by default.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/55">
              Built for institutions whose information cannot leak, cannot be lost, and cannot be repudiated.
            </p>
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3">
              {SECURITY.map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-left">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold-400/25 bg-gold-400/[0.06] text-gold-300"><Ico name={s.icon} className="h-5 w-5" /></span>
                  <span className="text-[13px] font-semibold text-white/80">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(SECURITY_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40">Security</button>
              <button onClick={() => nav(TRUST_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40">Trust Centre</button>
              <button onClick={() => nav(COMPLIANCE_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40">Compliance</button>
            </div>
          </div>
        </section>

        {/* ── Final CTA — one dominant action, Apple-scale ── */}
        <section id="evaluate" className="relative overflow-hidden px-6 py-28 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_40%,rgba(233,200,120,0.07),transparent_72%)]" aria-hidden />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-[2.7rem] font-bold leading-[1.04] tracking-tight text-[#f4efe3] sm:text-[3.8rem]">
              Prove it using your own documents.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/55">
              No sales call. No gate. Put a real document through the governed pipeline — or take the procurement
              materials into your own process.
            </p>
            <div className="mt-11 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button onClick={() => nav("/console")}
                className="group inline-flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-b from-gold-300 to-gold-600 px-10 py-5 text-base font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_16px_40px_-12px_rgba(233,200,120,0.5)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500 sm:w-auto">
                Begin your evaluation <Chevron className="h-5 w-5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(PROCUREMENT_ROUTE)}
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 px-10 py-5 text-base font-semibold uppercase tracking-[0.08em] text-white/85 transition hover:border-white/40 hover:bg-white/[0.05] sm:w-auto">
                Procurement Center
              </button>
            </div>
            <div className="mt-16 flex flex-col items-center gap-1 border-t border-white/[0.06] pt-10">
              <div className="flex items-center gap-2.5"><DispatchMark className="h-6 w-6 text-gold-400" /><span className="font-semibold tracking-tight text-white/85">Sovereign Dispatch</span></div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Sovereign by design · Verifiable by default · Institution ready</div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Landing;
