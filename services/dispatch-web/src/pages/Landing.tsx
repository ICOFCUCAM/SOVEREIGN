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

// The front door. Re-cut for rhythm and authority rather than completeness: each
// section has a different shape and weight — a cinematic statement, a tightened
// problem, the signature governed journey, a LIGHT counterpoint, risk-led
// outcomes, a sovereignty band, one closing action. Detail lives on dedicated
// pages; the homepage exists to make the value land and to feel monumental.

const VERBS = ["Create", "Review", "Approve", "Authorize", "Publish", "Certify", "Verify", "Preserve"];

// The institutional process behind one official publication — a slim spine, not a
// card grid. The eye follows it down; it does not scan it.
const SPINE = ["Policy Draft", "Legal Review", "Compliance", "Executive Approval", "Publishing Office", "Official Publication", "Evidence Chain", "Permanent Preservation"];

// Risk-/outcome-led, not category-led. Each leads with what changes, and links to
// the full case. Presented as an editorial list — no rectangles.
const OUTCOMES: { slug: string; lead: string; sub: string }[] = [
  { slug: "reduce-fragmentation", lead: "One governed platform — not seven disconnected systems.", sub: "Drafting, review, approval, publication, evidence and archive stop living in separate tools." },
  { slug: "reduce-audit", lead: "Every audit already has its evidence.", sub: "The proof is produced as the record is made, not reconstructed when someone asks." },
  { slug: "accelerate-execution", lead: "Every approval is already attributable.", sub: "Who decided, on what version, in what order — settled at the moment it happens." },
  { slug: "prevent-errors", lead: "The wrong version can never go out.", sub: "One authoritative record; superseded and unapproved copies cannot pass as official." },
  { slug: "protect-knowledge", lead: "Institutional memory that doesn't walk out the door.", sub: "Provenance and authority survive the people who created them." },
  { slug: "reduce-cost", lead: "Stop paying for the same publication twice.", sub: "The duplicated handling between offices collapses into one governed flow." },
  { slug: "enable-services", lead: "Govern publication for others — as a service.", sub: "Become the authority that issues and verifies records for the institutions you serve." },
];

const SECTORS = ["Government", "Regulators", "Universities", "Healthcare", "Justice", "Enterprise"];

const Landing: React.FC = () => {
  useReveal();
  const nav = useNavigate();
  // Whisper-subtle pointer parallax on the instrument — a few degrees of physical
  // presence on fine pointers only, fully disabled under reduced-motion.
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
        {/* ── Hero — the approved two-column instrument: narrative left, Record right ── */}
        <div id="top" className="relative overflow-hidden border-t border-white/[0.06]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_72%_32%,rgba(233,200,120,0.055),transparent_72%)]" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
          <div ref={heroRef} className="relative z-10 mx-auto grid min-h-0 max-w-[1540px] grid-cols-1 items-center gap-12 px-5 py-16 sm:min-h-[760px] sm:gap-14 sm:px-8 sm:py-20 lg:px-12 xl:min-h-[900px] xl:grid-cols-[40fr_60fr] xl:gap-12">
            {/* narrative — the Vanguard positioning */}
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
            {/* the instrument — the dominant visual object */}
            <div className="relative flex justify-center xl:justify-end">
              <div ref={artRef} className="w-full max-w-[420px] transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform xl:max-w-[680px]">
                <RecordArtifact className="w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Monumental cinematic statement — feel the scale ── */}
        <section className="relative flex min-h-[78vh] items-center overflow-hidden border-y border-white/[0.06]">
          <img src="/people/government.webp" alt="" aria-hidden loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-[#070707]/55" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/35 to-[#070707]/70" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
          <div className="relative mx-auto w-full max-w-[1300px] px-6 py-28 lg:px-12">
            <p className="text-[12px] font-semibold uppercase tracking-[0.34em] text-gold-400">The stakes</p>
            <h2 className="mt-5 max-w-4xl font-serif text-[2.8rem] font-bold leading-[1.02] tracking-[-0.02em] text-[#f6f1e6] sm:text-[4.2rem] lg:text-[5rem]">
              Governing the world's most important decisions.
            </h2>
            <p className="mt-7 max-w-xl text-[18px] leading-relaxed text-white/65">
              Documents inform. Official publications <span className="text-gold-300">govern</span>. Sovereign Dispatch is
              the infrastructure beneath the records that nations, courts, regulators and institutions cannot get wrong.
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/15 pt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-white/45">
              {SECTORS.map((s, i) => (
                <React.Fragment key={s}>
                  <span className="text-white/70">{s}</span>
                  {i < SECTORS.length - 1 && <span className="text-gold-400/40" aria-hidden>·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* ── The hidden cost — the problem, tightened to a spine ── */}
        <section id="cost" className="border-b border-white/[0.06] px-6 py-28 lg:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-16 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">The hidden cost</div>
              <h2 className="mt-5 max-w-xl font-serif text-[2.3rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">
                Institutions don't pay to create documents.<br className="hidden sm:block" /> They pay to make them official.
              </h2>
              <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-white/60">
                Before a policy, ruling, directive or resolution becomes official, it passes through office after office —
                each in a different system, with the trail between them reconstructed, not recorded. The cost was never
                the document. It was everything around it.
              </p>
              <button onClick={() => nav(COST_ROUTE)} className="group mt-8 inline-flex items-center gap-2.5 text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">
                Read the full cost breakdown <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
            {/* the spine — a quiet vertical chain, the one place the eye reads top to bottom */}
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
                    {!last && <div className="ml-[13px] h-5 w-px bg-gradient-to-b from-white/15 to-white/5" aria-hidden />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── THE SIGNATURE MOMENT — the governed journey ── */}
        <GovernedJourney />

        {/* ── LIGHT counterpoint — what makes an official publication different ── */}
        <section id="difference" className="bg-[#f3eee3] px-6 py-28 text-[#11140f] lg:px-12">
          <div className="mx-auto grid max-w-[1200px] gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#9a7b27]">The distinction</div>
              <h2 className="mt-5 font-serif text-[2.4rem] font-bold leading-[1.06] tracking-tight text-[#171712] sm:text-[3.1rem]">
                A copy informs.<br /> An official record governs.
              </h2>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[#3c3a31]">
                An ordinary document can be copied, edited, renamed or questioned. An Official Record is the institution's
                authoritative version of a decision — and it can always prove it. Information is temporary.
                <span className="font-semibold text-[#171712]"> Institutional authority is permanent.</span>
              </p>
              <ul className="mt-8 space-y-3.5">
                {[
                  ["A permanent identity", "A Record ID, never reused — every copy points back to one record."],
                  ["Provable provenance", "Governance and Preservation certificates, sealed at publication."],
                  ["Independent verification", "Anyone can confirm it is genuine, unrevoked and untampered."],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1d6b43]/12 text-[12px] font-bold text-[#1d6b43]">✓</span>
                    <span><span className="font-semibold text-[#171712]">{t}.</span> <span className="text-[#4a473d]">{d}</span></span>
                  </li>
                ))}
              </ul>
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

        {/* ── Outcomes — risk-led, editorial list (not cards) ── */}
        <section id="outcomes" className="border-b border-white/[0.06] px-6 py-28 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="max-w-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Why institutions adopt it</div>
              <h2 className="mt-5 font-serif text-[2.3rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">
                Institutions don't become trusted by publishing.<br className="hidden sm:block" /> They become trusted by governing publication.
              </h2>
            </div>
            <div className="mt-14 border-t border-white/[0.08]">
              {OUTCOMES.map((o, i) => (
                <button key={o.slug} onClick={() => nav(`${VALUE_BASE}/${o.slug}`)}
                  className="group flex w-full items-baseline gap-5 border-b border-white/[0.08] py-7 text-left transition hover:bg-white/[0.015] sm:gap-8">
                  <span className="font-mono text-[13px] text-gold-400/50 transition group-hover:text-gold-400">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    <span className="font-serif text-[1.4rem] font-bold leading-snug text-white transition group-hover:text-gold-100 sm:text-[1.7rem]">{o.lead}</span>
                    <span className="mt-1.5 block max-w-2xl text-[14px] leading-relaxed text-white/45">{o.sub}</span>
                  </span>
                  <Chevron className="mt-2 h-4 w-4 shrink-0 text-white/20 transition group-hover:translate-x-1 group-hover:text-gold-400" />
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

        {/* ── Security & sovereignty — a dark, restrained band ── */}
        <section id="sovereignty" className="relative overflow-hidden border-b border-white/[0.06] bg-black px-6 py-28 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_50%_0%,rgba(233,200,120,0.05),transparent_70%)]" aria-hidden />
          <div className="relative mx-auto max-w-[1000px] text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Security & sovereignty</div>
            <h2 className="mx-auto mt-5 max-w-3xl font-serif text-[2.3rem] font-bold leading-[1.06] tracking-tight text-[#f4efe3] sm:text-[3rem]">
              Sovereign by construction.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-white/55">
              Tenant-isolated, residency-aware, append-only. Built for institutions whose information cannot leak, cannot
              be lost, and cannot be repudiated.
            </p>
            <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {["Tenant isolation", "Data residency", "Append-only audit", "Classification handling"].map((t, i, a) => (
                <React.Fragment key={t}>
                  <span>{t}</span>
                  {i < a.length - 1 && <span className="text-gold-400/30" aria-hidden>·</span>}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(SECURITY_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40">Security</button>
              <button onClick={() => nav(TRUST_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40">Trust Centre</button>
              <button onClick={() => nav(COMPLIANCE_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:border-white/40">Compliance</button>
            </div>
          </div>
        </section>

        {/* ── Final CTA — one dominant action ── */}
        <section id="evaluate" className="relative overflow-hidden px-6 py-32 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_70%_at_50%_40%,rgba(233,200,120,0.07),transparent_72%)]" aria-hidden />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-[2.5rem] font-bold leading-[1.05] tracking-tight text-[#f4efe3] sm:text-[3.4rem]">
              Evaluate it in your own environment.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/55">
              No sales call. No gate. Open the console and put a real document through the governed pipeline — or take the
              procurement materials into your own process.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <button onClick={() => nav("/console")}
                className="group inline-flex items-center justify-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-8 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_12px_30px_-10px_rgba(0,0,0,0.7)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                Begin your evaluation <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(PROCUREMENT_ROUTE)}
                className="inline-flex items-center justify-center rounded border border-white/15 px-7 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                Procurement Center
              </button>
            </div>
            <div className="mt-16 flex flex-col items-center gap-1 border-t border-white/[0.06] pt-10">
              <div className="flex items-center gap-2.5"><DispatchMark className="h-6 w-6 text-gold-400" /><span className="font-semibold tracking-tight text-white/85">Sovereign Dispatch</span></div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Sovereign by design · Auditable by default · Institution ready</div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Landing;
