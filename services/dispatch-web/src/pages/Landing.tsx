import React from "react";
import { useNavigate } from "react-router-dom";
import { RecordArtifact } from "../components/RecordArtifact";
import { Guilloche } from "../components/Guilloche";
import { DispatchMark, Chevron, PublicFooter, TrustStrip, FilmGrain, useReveal } from "../components/brand";
import {
  PROCUREMENT_ROUTE, ARCHITECTURE_ROUTE,
  PLATFORM_ROUTE, SECURITY_ROUTE, COMPLIANCE_ROUTE, EVIDENCE_ROUTE,
} from "../lib/routes";

// The governed lifecycle, presented as a formal charter of articles (Concept B).
const ARTICLES: [string, string][] = [
  ["I", "Submission"], ["II", "Governance"], ["III", "Authorization"],
  ["IV", "Rendering"], ["V", "Publication"], ["VI", "Preservation"],
];

// Public marketing landing — the front door to Dispatch. A cinematic hero over a
// lean positioning story; the technical depth lives on dedicated pages. The sticky
// top nav mixes in-page anchors (Why, Pillars, Lifecycle, Institutions) with the
// relocated section pages (Platform, Security, Compliance, Procurement).
const NAV: { label: string; href: string }[] = [
  { label: "Why", href: "#why" },
  { label: "Pillars", href: "#pillars" },
  { label: "Lifecycle", href: "#lifecycle" },
  { label: "Institutions", href: "#institutions" },
  { label: "Platform", href: PLATFORM_ROUTE },
  { label: "Security", href: SECURITY_ROUTE },
  { label: "Compliance", href: COMPLIANCE_ROUTE },
  { label: "Procurement", href: PROCUREMENT_ROUTE },
];

const Landing: React.FC = () => {
  const nav = useNavigate();
  // Restrained reveal — content sections rise gently into view once, then settle.
  useReveal();
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
    <div className="relative bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      {/* film grain — fine tactile texture over the dark field (no flat-black banding) */}
      <FilmGrain />

      {/* keyboard skip link — first focusable element, bypasses the nav */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-gold-400 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-[#1c1407]">Skip to content</a>

      {/* ── sticky top nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#070707]/80 backdrop-blur-md shadow-[0_10px_30px_-22px_rgba(0,0,0,0.85)]">
        <div className="mx-auto flex max-w-[1640px] items-center justify-between gap-3 px-5 py-3.5 sm:px-8 lg:px-12">
          <a href="#top" className="flex shrink-0 items-center gap-2.5">
            <DispatchMark className="h-7 w-7 text-gold-400" />
            <span className="whitespace-nowrap text-[15px] font-bold tracking-tight sm:text-base">SOVEREIGN <span className="text-gold-400">DISPATCH</span></span>
          </a>
          <nav className="hidden items-center gap-x-6 xl:flex">
            {NAV.map(({ label, href }) => (
              <a key={label} href={href} className="relative text-[12px] font-medium uppercase tracking-wide text-white/70 transition after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold-400/70 after:transition-all after:duration-300 hover:text-white hover:after:w-full">{label}</a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <button onClick={() => nav("/console")} className="hidden text-[13px] font-semibold uppercase tracking-wide text-white/80 transition hover:text-white sm:inline-block">Log in</button>
            <button onClick={() => nav("/console")}
              className="group inline-flex items-center gap-2 whitespace-nowrap rounded bg-gradient-to-b from-gold-300 to-gold-600 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500 sm:px-5">
              <span className="sm:hidden">Launch</span><span className="hidden sm:inline">Launch Dispatch</span>
              <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="outline-none">
      {/* ── hero — THE RECORD: a sealed official instrument beside a formal charter ── */}
      <div id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_72%_32%,rgba(233,200,120,0.055),transparent_72%)]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
        <div ref={heroRef} className="relative z-10 mx-auto grid min-h-0 max-w-[1540px] grid-cols-1 items-center gap-12 px-5 py-16 sm:min-h-[760px] sm:gap-14 sm:px-8 sm:py-20 lg:px-12 xl:min-h-[980px] xl:grid-cols-[38fr_62fr] xl:gap-12">
          {/* narrative + charter */}
          <div className="hero-stagger max-w-xl">
            <div className="mb-8 flex items-center gap-3">
              <span className="h-px w-7 bg-gold-500/55" aria-hidden />
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.34em] text-gold-400">Institutional Publication Infrastructure</p>
            </div>
            <h1 className="font-serif text-[2.65rem] font-bold leading-[1.03] tracking-[-0.022em] text-[#f4efe3] sm:text-[3.25rem] 2xl:text-[3.6rem]">
              From Information<br />to <span className="text-gold-400">Official Record.</span>
            </h1>
            <p className="lead-balance mt-7 max-w-[27rem] text-[17px] leading-[1.7] text-white/60">
              The operating system for institutional publication — where information becomes a
              sealed, governed, permanent record.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <button onClick={() => nav("/console")}
                className="group inline-flex items-center justify-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                Launch Dispatch
                <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
              <a href={ARCHITECTURE_ROUTE}
                className="inline-flex items-center justify-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
                View Architecture
              </a>
            </div>
            <p className="mt-5 flex items-center gap-2.5 text-[12.5px] text-white/45">
              <span className="inline-block h-1 w-1 shrink-0 rounded-full bg-gold-400/80" aria-hidden />
              Evaluate in your own environment — no sales call required.
            </p>
            {/* the charter — quieted so the instrument dominates */}
            <div className="mt-11 border-t border-white/[0.08] pt-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-white/45">The Governed Lifecycle</p>
              <dl className="mt-4 grid max-w-md grid-cols-2 gap-x-8 gap-y-0">
                {ARTICLES.map(([num, label]) => (
                  <div key={num} className="flex items-baseline gap-2.5 border-b border-white/[0.06] py-2">
                    <dt className="w-6 font-serif text-[12px] text-gold-400/70">{num}</dt>
                    <dd className="text-[12px] font-medium uppercase tracking-[0.1em] text-white/65">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          {/* the instrument — the dominant visual object */}
          <div className="relative flex justify-center xl:justify-end">
            <div ref={artRef} className="w-full max-w-[420px] transition-transform duration-200 ease-out [transform-style:preserve-3d] will-change-transform xl:max-w-[700px]">
              <RecordArtifact className="w-full" />
            </div>
          </div>
        </div>
        {/* scroll cue — a quiet invitation to read on */}
        <a href="#why" aria-label="Scroll to read more"
          className="group absolute inset-x-0 bottom-7 z-10 mx-auto hidden w-fit flex-col items-center gap-2 xl:flex">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.34em] text-white/50 transition group-hover:text-white/75">Scroll</span>
          <Chevron className="scroll-cue h-3.5 w-3.5 rotate-90 text-gold-400/70 transition group-hover:text-gold-300" />
        </a>
      </div>

      {/* ── Why Dispatch Exists — strategic context + outcomes ─────── */}
      <section id="why" className="edge-rule scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400"><span className="tnum font-mono tracking-normal text-gold-400/55">01</span><span className="mx-2 font-normal text-gold-400/30">·</span>Why Dispatch Exists</p>
          <h2 className="mt-5 font-serif text-4xl font-bold leading-[1.08] text-[#f4efe3] sm:text-5xl">
            Most systems manage documents.<br />Dispatch governs the path to official record.
          </h2>
          <p className="lead-balance mx-auto mt-7 max-w-[42rem] text-lg leading-[1.7] text-white/55">
            Institutions produce decisions every day — briefings, policies, resolutions, regulatory filings. Most tools
            store and share those files. None govern the moment one becomes the official record.
          </p>
        </div>
        <div className="mx-auto mt-16 grid stagger max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Enforce governance before publication", "Nothing is published until it clears its approval policy."],
            ["Eliminate unofficial records", "One governed path — no shadow copies or unverified files."],
            ["Maintain evidentiary chains", "Every action hash-stamped to an append-only audit trail."],
            ["Preserve institutional memory", "Every version retained and retrievable, by policy."],
            ["Reduce publication risk", "Classification, clearance and review enforced by the system."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold-500/30 p-6">
              <div className="text-[14px] font-bold leading-snug text-white">{t}</div>
              <p className="mt-2 text-[12.5px] leading-snug text-white/50">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Category-owning Pillars ────────────────────────────────── */}
      <section id="pillars" className="edge-rule scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400"><span className="tnum font-mono tracking-normal text-gold-400/55">02</span><span className="mx-2 font-normal text-gold-400/30">·</span>What Dispatch Is</p>
        </div>
        <div className="mx-auto grid stagger max-w-6xl gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.07] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] sm:grid-cols-3">
          {[
            ["I", "The System of Record", "Not document management. The authority that decides when information becomes official — and seals it."],
            ["II", "The Governance Layer", "The institutional layer between a decision and its published record. Nothing reaches the record ungoverned."],
            ["III", "The Sovereign Standard", "Infrastructure that runs under your jurisdiction — never a vendor's cloud. The standard institutions adopt for decades."],
          ].map(([n, t, b]) => (
            <div key={t} className="group/p relative bg-[#070707] p-9 transition duration-300 hover:bg-[#0b0a07] sm:p-10">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent transition duration-300 group-hover/p:via-gold-500/45" aria-hidden />
              <div className="font-serif text-[2.3rem] font-semibold leading-none text-gold-400/45 transition duration-300 group-hover/p:text-gold-400/80">{n}</div>
              <h3 className="mt-6 font-serif text-[1.7rem] font-bold leading-[1.12] tracking-[-0.01em] text-[#f4efe3]">{t}</h3>
              <p className="mt-4 text-[14px] leading-relaxed text-white/55">{b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Record Lifecycle — quieted to a compact inline strip (−30%) ── */}
      <section id="lifecycle" className="edge-rule scroll-mt-24 bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-5 py-14 sm:px-8 sm:py-16 lg:px-12">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/50"><span className="tnum font-mono tracking-normal text-gold-400/55">03</span><span className="mx-2 font-normal text-white/25">·</span>The Record Lifecycle</p>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-white/55">One governed path — every official document travels the same controlled route.</p>
        </div>
        <div className="mx-auto mt-9 flex max-w-3xl flex-wrap items-center justify-center gap-y-4">
          {["Submit", "Govern", "Approve", "Render", "Publish", "Preserve"].map((n, i, a) => (
            <React.Fragment key={n}>
              <div className="flex items-center gap-2.5">
                <span className="tnum font-mono text-[10px] text-gold-400/75">{`0${i + 1}`}</span>
                <span className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-white/70">{n}</span>
              </div>
              {i < a.length - 1 && <div className="lc-connector mx-3 h-px w-6 bg-gradient-to-r from-gold-500/40 to-gold-500/10 sm:w-9" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* ── A Record That Proves Itself — provenance positioning ─────── */}
      <section id="proof" className="edge-rule relative scroll-mt-24 overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <Guilloche className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 opacity-[0.05]" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400"><span className="tnum font-mono tracking-normal text-gold-400/55">04</span><span className="mx-2 font-normal text-gold-400/30">·</span>Provenance</p>
          <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.08] text-[#f4efe3] sm:text-5xl">A Record That Proves Itself.</h2>
          <p className="lead-balance mx-auto mt-6 max-w-[44rem] text-lg leading-[1.7] text-white/55">
            Every Dispatch record carries its own evidence — sealed, attributed and verifiable long after the people who
            created it have moved on. The institution doesn't ask you to trust the record.{" "}
            <span className="font-medium text-white/90">The record proves itself.</span>
          </p>
        </div>
        <div className="relative z-10 mx-auto mt-16 grid stagger max-w-4xl gap-6 sm:grid-cols-3">
          {[
            ["Sealed provenance", "Who issued it, under what authority, and when — bound into the record itself."],
            ["Append-only history", "Every action preserved in order. Nothing is quietly edited or removed."],
            ["Verifiable integrity", "A cryptographic seal anyone authorized can check, for the life of the record."],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold-500/30 p-6 text-center">
              <div className="text-[14px] font-bold text-white">{t}</div>
              <p className="mt-2 text-[12.5px] leading-relaxed text-white/50">{b}</p>
            </div>
          ))}
        </div>
        <div className="relative z-10 mt-12 text-center">
          <a href={EVIDENCE_ROUTE} className="group inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">
            See the evidence
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </a>
        </div>
      </section>

      {/* ── Procurement CTA (above institutions) ───────────────────── */}
      <section id="procurement" className="edge-rule scroll-mt-24 bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400"><span className="tnum font-mono tracking-normal text-gold-400/55">05</span><span className="mx-2 font-normal text-gold-400/30">·</span>Procurement</p>
          <h2 className="mt-4 font-serif text-4xl font-bold leading-[1.08] text-[#f4efe3] sm:text-5xl">Ready for institutional evaluation.</h2>
          <p className="lead-balance mx-auto mt-5 max-w-[40rem] text-lg leading-[1.7] text-white/55">Architecture, security and procurement materials — self-serve, before any human contact.</p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => nav(PROCUREMENT_ROUTE)}
              className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-8 py-4 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              Download Evaluation Package
              <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <a href={ARCHITECTURE_ROUTE}
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              View Architecture
            </a>
          </div>
        </div>
      </section>

      {/* ── Institutions — outcome-driven narratives ───────────────── */}
      <section id="institutions" className="edge-rule scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 h-px w-10 bg-gold-500/45" aria-hidden />
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400"><span className="tnum font-mono tracking-normal text-gold-400/55">06</span><span className="mx-2 font-normal text-gold-400/30">·</span>Built for institutions that cannot fail</p>
          <h2 className="mt-5 max-w-[20ch] font-serif text-4xl font-bold leading-[1.08] text-[#f4efe3] sm:text-5xl">What each institution turns into a record.</h2>
        </div>
        <div className="mx-auto mt-14 grid stagger max-w-5xl gap-6 sm:grid-cols-2">
          {[
            ["Government", "Ministries · Regulators · Authorities", "Publish policy, legislation and official notices as sealed records — full provenance, no shadow copies."],
            ["Healthcare", "Hospitals · Health authorities", "Issue clinical, safety and regulatory records that withstand audit and time — every version preserved, every release attributable."],
            ["Education", "Universities · Research bodies", "Confer and preserve official records — credentials, resolutions and research outputs — under the institution's own seal."],
            ["Enterprise", "Regulated industries · Critical infrastructure", "Turn board and compliance decisions into permanent, defensible records a regulator can trust."],
          ].map(([cat, who, story]) => (
            <div key={cat} className="group/i relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-b from-white/[0.045] to-white/[0.012] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition duration-300 hover:-translate-y-0.5 hover:border-gold-500/30">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent transition duration-500 group-hover/i:via-gold-500/40" aria-hidden />
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="text-[13px] font-bold uppercase tracking-[0.16em] text-gold-400/90">{cat}</div>
                <div className="text-[11px] uppercase tracking-[0.1em] text-white/50">{who}</div>
              </div>
              <div className="mt-4 h-px w-full bg-white/[0.07]" aria-hidden />
              <p className="mt-4 text-[14px] leading-relaxed text-white/60">{story}</p>
            </div>
          ))}
        </div>
      </section>

      </main>

      {/* closing seal — the page opens with the record and is closed under the mark */}
      <div className="flex items-center justify-center gap-4 pb-2 pt-4" aria-hidden>
        <span className="h-px w-16 bg-gradient-to-r from-transparent to-gold-500/30 sm:w-24" />
        <DispatchMark className="h-5 w-5 text-gold-400/55" />
        <span className="h-px w-16 bg-gradient-to-l from-transparent to-gold-500/30 sm:w-24" />
      </div>

      {/* ── trust strip + footer ───────────────────────────────────── */}
      <TrustStrip />
      <PublicFooter />
    </div>
  );
};

export default Landing;
