import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DispatchMark, Chevron, SectionHead, PublicHeader, PublicFooter, FilmGrain, useReveal } from "../components/brand";
import { RecordArtifact } from "../components/RecordArtifact";
import {
  ARCHITECTURE_ROUTE, DEVELOPERS_ROUTE, PROCUREMENT_ROUTE,
  OFFICIAL_RECORD_ROUTE, VERIFY_ROUTE, WALKTHROUGH_ROUTE, SECURITY_ROUTE, TRUST_ROUTE, COMPLIANCE_ROUTE, EVIDENCE_ROUTE,
  COST_ROUTE, LIFECYCLE_ROUTE, ROI_ROUTE,
} from "../lib/routes";
import { VALUE, VALUE_BASE } from "../lib/value";

// The front door. Narrative order for procurement teams and executives:
//   Who is it for? → Why does it exist? → How does it work? → Why can I trust it?
//   → How do I evaluate it? The hero is the approved two-column instrument — the
//   narrative on the left, the Record artifact dominant on the right; design below.

const VERBS = ["Create", "Review", "Approve", "Authorize", "Publish", "Certify", "Verify", "Preserve"];

// The institutional reality behind every official publication.
const HIDDEN_LAYERS = ["Departments", "Committees", "Reviewers", "Legal offices", "Approving authorities", "Publishing offices", "Records management", "Archives", "Compliance teams"];
const PUB_FLOW = ["Policy Draft", "Policy Team", "Legal Review", "Compliance", "Executive Approval", "Publishing Office", "Official Publication", "Evidence Chain", "Permanent Preservation"];
// The experts an institution already employs — connected, not replaced.
const EXPERTS: { slug: string; name: string }[] = [
  { slug: "role-analyst", name: "Policy Analyst" },
  { slug: "role-legal", name: "Legal Counsel" },
  { slug: "role-director", name: "Department Director" },
  { slug: "role-secretary", name: "Permanent Secretary" },
  { slug: "role-publishing", name: "Publishing Authority" },
  { slug: "role-archive", name: "National Archive" },
];

const GUARANTEES = [
  "A permanent institutional identity", "A governed approval process", "Named institutional authority",
  "A Governance Certificate", "A Preservation Certificate", "Cryptographic integrity verification",
  "A complete evidence chain", "Permanent authenticity verification",
];

const LIFECYCLE: [string, string][] = [
  ["01", "Submission"], ["02", "Governance"], ["03", "Review"], ["04", "Approval"], ["05", "Authorization"],
  ["06", "Publication"], ["07", "Certification"], ["08", "Verification"], ["09", "Preservation"],
];

// Institution-type cards — large editorial photography of leadership at work.
// `scene` documents the photograph to supply (see public/people/README.md); the
// card shows a per-sector editorial placeholder until the image is dropped in.
const INSTITUTIONS: { slug: string; name: string; scene: string; copy: string }[] = [
  { slug: "government", name: "Government", scene: "A minister signing legislation", copy: "Publish policies, executive orders, regulations and official notices with complete governance and permanent verification." },
  { slug: "universities", name: "Universities", scene: "A vice chancellor with senate members", copy: "Govern academic resolutions, research publications and institutional records." },
  { slug: "healthcare", name: "Healthcare", scene: "A hospital executive board", copy: "Issue clinical directives, safety notices and health authority publications." },
  { slug: "justice", name: "Justice", scene: "A judge or court administrator", copy: "Create authenticated judicial publications with permanent evidence." },
  { slug: "enterprise", name: "Enterprise", scene: "A corporate boardroom", copy: "Transform board resolutions into certified institutional publications." },
  { slug: "regulators", name: "Regulators", scene: "A financial regulator", copy: "Publish enforceable regulatory decisions with cryptographic integrity." },
];

// Elegant line glyphs per sector — used in the editorial placeholder so each card
// is visually distinct and institutional even before its photograph is supplied.
const SECTOR_GLYPH: Record<string, React.ReactNode> = {
  government: <><path d="M32 8 L56 20 H8 Z" /><path d="M16 20 V46 M26 20 V46 M38 20 V46 M48 20 V46" /><path d="M8 50 H56 M12 46 H52" /></>,
  universities: <><path d="M6 24 L32 14 L58 24 L32 34 Z" /><path d="M18 29 V42 c0 4 28 4 28 0 V29" /><path d="M58 24 V38" /></>,
  healthcare: <><circle cx="32" cy="32" r="22" /><path d="M32 20 V44 M20 32 H44" /></>,
  justice: <><path d="M32 10 V52 M18 52 H46 M10 22 H54" /><path d="M10 22 L4 36 a8 8 0 0 0 12 0 Z M54 22 L48 36 a8 8 0 0 0 12 0 Z" /></>,
  enterprise: <><rect x="18" y="8" width="28" height="48" /><path d="M25 16h4 M35 16h4 M25 24h4 M35 24h4 M25 32h4 M35 32h4 M25 40h4 M35 40h4" /></>,
  regulators: <><path d="M32 8 L52 16 V32 c0 13 -10 20 -20 24 c-10 -4 -20 -11 -20 -24 V16 Z" /><path d="M23 32 l6 6 l12 -13" /></>,
};

const ROSTER: [string, string[]][] = [
  ["Government", ["Minister", "Permanent Secretary", "Director General", "Policy Officer", "Communications Officer", "Records Manager"]],
  ["Universities", ["Vice Chancellor", "Registrar", "Academic Secretary", "Senate Administrator", "Research Administrator"]],
  ["Healthcare", ["Hospital Director", "Medical Administrator", "Clinical Governance Officer", "Health Authority Official"]],
  ["Regulators", ["Regulatory Commissioner", "Compliance Officer", "Licensing Officer", "Inspector"]],
  ["Enterprise", ["CEO", "Corporate Secretary", "Board Administrator", "Compliance Director", "Legal Counsel"]],
  ["Justice", ["Court Administrator", "Clerk", "Judicial Officer"]],
  ["Archives", ["National Archivist", "Records Preservation Officer"]],
];

// A large editorial image that prefers a real photograph (the scene of leadership
// at work) and falls back to a per-sector glyph treatment — never a broken image.
const SectorImage: React.FC<{ slug: string; alt: string }> = ({ slug, alt }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden bg-[radial-gradient(75%_70%_at_50%_22%,rgba(202,164,90,0.14),transparent),linear-gradient(160deg,#16140e,#090909)]">
      {!failed ? (
        <img src={`/people/${slug}.webp`} alt={alt} loading="lazy" onError={() => setFailed(true)}
          className="h-full w-full object-cover grayscale-[0.12] contrast-[1.04]" />
      ) : (
        <svg viewBox="0 0 64 64" className="absolute inset-0 m-auto h-[44%] w-auto" fill="none"
          stroke="rgba(202,164,90,0.45)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {SECTOR_GLYPH[slug]}
        </svg>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[#070707] via-[#070707]/55 to-transparent" />
    </div>
  );
};

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

        {/* ── The Hidden Cost of Institutional Publication ── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Begin with reality</div>
              <h2 className="mx-auto mt-3 max-w-3xl font-serif text-[2.1rem] font-bold leading-tight tracking-tight sm:text-[2.7rem]">The hidden cost of institutional publication.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-white/55">
                Every official publication represents hundreds of hours of institutional work. Before a policy, regulation, executive order, board resolution, healthcare directive, senate decision or regulatory notice becomes official, it passes through layer upon layer of governance.
              </p>
            </div>
            <div className="mx-auto mt-12 flex max-w-4xl flex-wrap justify-center gap-2.5">
              {HIDDEN_LAYERS.map((l) => (
                <span key={l} className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-[13px] font-medium text-white/70">{l}</span>
              ))}
            </div>
            <p className="mx-auto mt-11 max-w-xl text-center font-serif text-[1.35rem] leading-snug text-white/80">
              Those people already exist. Dispatch doesn't replace them — <span className="text-gold-300">Dispatch governs how they work together.</span>
            </p>
            <div className="mx-auto mt-14 max-w-sm">
              {PUB_FLOW.map((step, i) => (
                <React.Fragment key={step}>
                  <div className={`rounded-lg border px-5 py-3 text-center text-[14px] font-semibold ${step === "Official Publication" || i === PUB_FLOW.length - 1 ? "border-gold-400/40 bg-gold-400/[0.07] text-gold-200" : "border-white/10 bg-white/[0.02] text-white/80"}`}>{step}</div>
                  {i < PUB_FLOW.length - 1 && <div className="mx-auto h-5 w-px bg-gradient-to-b from-gold-400/45 to-white/10" />}
                </React.Fragment>
              ))}
            </div>
            <div className="mx-auto mt-14 grid max-w-3xl gap-4 text-center sm:grid-cols-3">
              {[["Every step", "becomes governed."], ["Every approval", "becomes attributable."], ["Every publication", "becomes verifiable."]].map(([a, b]) => (
                <div key={a} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="text-[12px] uppercase tracking-wide text-white/40">{a}</div>
                  <div className="mt-1 font-serif text-[1.15rem] font-bold text-white">{b}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button onClick={() => nav(COST_ROUTE)} className="group inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gold-400 transition hover:text-gold-300">
                Read the full cost breakdown <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Your Institution Already Has the Experts ── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.02] to-transparent px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Connect, don't replace</div>
              <h2 className="mx-auto mt-3 max-w-3xl font-serif text-[2.1rem] font-bold leading-tight tracking-tight sm:text-[2.7rem]">Your institution already has the experts. Dispatch connects them.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[14.5px] leading-relaxed text-white/55">
                Not another document-management team. Not another approval platform. Not another compliance system. Not another archive. Dispatch connects the people you already employ into one governed publication workflow.
              </p>
            </div>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {EXPERTS.map((e, i) => (
                <article key={e.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-gold-400/30">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[linear-gradient(160deg,#16140e,#090909)]">
                    <img src={`/people/${e.slug}.webp`} alt={e.name} loading="lazy" className="h-full w-full object-cover" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0b0b0b] to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4">
                      <div className="font-mono text-[11px] text-gold-400/80">{String(i + 1).padStart(2, "0")}</div>
                      <div className="font-serif text-[1.2rem] font-bold leading-tight text-white">{e.name}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <p className="mx-auto mt-11 max-w-md text-center font-serif text-[1.25rem] text-white/75">Instead of showing software — <span className="text-gold-300">show the institution.</span></p>
          </div>
        </section>

        {/* ── Dispatch creates financial value (1–7) → detail pages ── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">The case for adoption</div>
              <h2 className="mx-auto mt-3 max-w-3xl font-serif text-[2.1rem] font-bold leading-tight tracking-tight sm:text-[2.7rem]">Dispatch creates financial value in multiple ways.</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[14.5px] leading-relaxed text-white/55">Seven ways governed publication pays for itself — explore each in detail.</p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {VALUE.map((v) => (
                <button key={v.slug} onClick={() => nav(`${VALUE_BASE}/${v.slug}`)}
                  className="group rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left transition hover:border-gold-400/30 hover:bg-white/[0.03]">
                  <div className="font-mono text-[12px] font-bold text-gold-400/70">{String(v.n).padStart(2, "0")}</div>
                  <div className="mt-2 font-serif text-[1.25rem] font-bold leading-tight text-white">{v.title}</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{v.teaser}</p>
                  <div className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-gold-400 opacity-60 transition group-hover:opacity-100">Read more <Chevron className="h-3 w-3 transition group-hover:translate-x-0.5" /></div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── 1 · WHO IS IT FOR — Built for the world's leading institutions ── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Designed for institutions that cannot fail</div>
              <h2 className="mx-auto mt-3 max-w-3xl font-serif text-[2.1rem] font-bold leading-tight tracking-tight sm:text-[2.7rem]">Built for the world's leading institutions.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/55">For governments, regulators, universities, healthcare, courts and enterprise — every institution that governs information. Find where yours fits.</p>
            </div>
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {INSTITUTIONS.map((it) => (
                <article key={it.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-gold-400/30 hover:bg-white/[0.03]">
                  <div className="relative">
                    <SectorImage slug={it.slug} alt={`${it.name} — ${it.scene}`} />
                    <div className="absolute inset-x-0 bottom-0 p-5"><div className="font-serif text-[1.55rem] font-bold leading-none text-white">{it.name}</div></div>
                  </div>
                  <p className="px-5 pb-5 pt-4 text-[14px] leading-relaxed text-white/65">{it.copy}</p>
                </article>
              ))}
            </div>
            <div className="mt-16">
              <div className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Across every institution</div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {ROSTER.map(([sector, roles]) => (
                  <div key={sector} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-400/80">{sector}</div>
                    <ul className="mt-3 space-y-1.5">
                      {roles.map((r) => <li key={r} className="flex items-center gap-2.5 text-[13.5px] text-white/70"><span className="h-1 w-1 shrink-0 rounded-full bg-gold-400/60" />{r}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2 · WHY DOES IT EXIST — the problem ──────────────────── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <SectionHead index="01" kicker="Why Dispatch exists" title="The challenge is not writing documents."
              sub="Governments, universities, hospitals, regulators and enterprises make decisions every day. The challenge is proving that those documents became the institution's official publication — governed, authorized and permanent. Information is not authority. Authority must be earned." />
            <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {["Governance before publication", "Institutional authority", "Complete provenance", "Cryptographic integrity", "Permanent preservation", "Independent verification"].map((t) => (
                <div key={t} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 text-[14px] font-medium text-white/80">{t}</div>
              ))}
            </div>
            <p className="mt-8 text-center text-[14px] text-white/45">Every publication proves itself.</p>
          </div>
        </section>

        {/* ── 3 · WHAT MAKES IT DIFFERENT — the value ──────────────── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <SectionHead index="02" kicker="The distinction" title="What makes an official publication different."
              sub="An ordinary document can be copied, edited, renamed, replaced or questioned. A Dispatch publication is the institution's authoritative version of a decision — and a copied PDF is still only a copy, while a Dispatch publication can always prove its authenticity." />
            <figure className="mx-auto mt-12 max-w-2xl">
              <div className="overflow-hidden rounded-2xl border border-white/10 shadow-[0_40px_100px_-50px_rgba(0,0,0,0.9)] ring-1 ring-gold-400/10">
                <img src="/people/officialpublication.webp" alt="An Official Publication — the sealed, branded institutional record"
                  loading="lazy" className="aspect-[16/10] w-full object-cover" />
              </div>
              <figcaption className="mt-3 text-center text-[11.5px] uppercase tracking-[0.18em] text-white/40">The Official Publication — sealed, certified, verifiable</figcaption>
            </figure>
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2">
              {GUARANTEES.map((g) => (
                <div key={g} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[14px] text-white/85">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] text-emerald-300">✓</span>{g}
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(WALKTHROUGH_ROUTE)} className="rounded-md bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition hover:from-gold-200 hover:to-gold-500">Watch a record become official →</button>
              <button onClick={() => nav(OFFICIAL_RECORD_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-white/40">See the difference →</button>
              <button onClick={() => nav(VERIFY_ROUTE)} className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-[13px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20">Verify a record →</button>
            </div>
          </div>
        </section>

        {/* ── 4 · HOW IT WORKS — the governed lifecycle ────────────── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <SectionHead index="03" kicker="The governed lifecycle" title="Every publication follows the same institutional path."
              sub="Nothing bypasses governance. Nothing reaches publication without institutional authority." />
            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3">
              {LIFECYCLE.map(([n, t]) => (
                <div key={n} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="font-mono text-[12px] text-gold-400/70">{n}</div>
                  <div className="mt-1 text-[15px] font-semibold text-white/85">{t}</div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(LIFECYCLE_ROUTE)} className="group inline-flex items-center gap-2 rounded border border-white/15 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                Explore each stage <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(ROI_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                Model the operational case
              </button>
            </div>
          </div>
        </section>

        {/* ── 5 · WHY CAN I TRUST IT — certificates & evidence ─────── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <SectionHead index="04" kicker="Governance certificates & evidence chain" title="The proof a copy can never carry."
              sub="Every published record carries the institutional proof of how it came to be — independently verifiable, years later, by anyone with permission." />
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 lg:grid-cols-3">
              {[
                ["Governance Certificate", "Proof the approval chain was satisfied — the offices, in order, that reviewed and authorized the publication."],
                ["Preservation Certificate", "Proof the record was sealed for permanence, with its retention horizon and a tamper-evident integrity hash."],
                ["Evidence Chain", "Every action — submitted, reviewed, returned, approved, rendered, published, preserved — timestamped and append-only."],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="font-serif text-[1.25rem] font-bold text-white">{t}</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{d}</p>
                </div>
              ))}
            </div>
            <div className="mx-auto mt-8 max-w-4xl rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-5 py-4 text-center text-[13.5px] text-white/60">
              Each record receives a permanent identifier and a SHA-256 integrity proof. <span className="text-white/85">Anyone can confirm a file is exactly the one the institution issued.</span>
              <button onClick={() => nav(VERIFY_ROUTE)} className="ml-3 font-semibold text-emerald-300 hover:text-emerald-200">Verify a record →</button>
            </div>
          </div>
        </section>

        {/* ── 6 · SECURITY & SOVEREIGNTY ───────────────────────────── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <SectionHead index="05" kicker="Security & sovereignty" title="Sovereign by construction."
              sub="Tenant-isolated, residency-aware, append-only. Built for institutions whose information cannot leak, cannot be lost, and cannot be repudiated." />
            <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["Tenant isolation", "Data residency", "Append-only audit", "Classification handling"].map((t) => (
                <div key={t} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 text-center text-[13.5px] font-medium text-white/80">{t}</div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(SECURITY_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-white/40">Security →</button>
              <button onClick={() => nav(TRUST_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-white/40">Trust Centre →</button>
              <button onClick={() => nav(COMPLIANCE_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-white/40">Compliance →</button>
            </div>
          </div>
        </section>

        {/* ── 7 · HOW DO I EVALUATE — procurement + launch ─────────── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Evaluate Dispatch</div>
            <h2 className="mx-auto mt-3 max-w-2xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.5rem]">Evaluate in your own environment. No sales call required.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/55">Security, procurement, compliance, trust and deployment resources are available before adoption — and your existing ERP, case-management or document systems can integrate through the Dispatch API.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(PROCUREMENT_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-white/40">Procurement dossier</button>
              <button onClick={() => nav(EVIDENCE_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-white/40">Evidence package</button>
              <button onClick={() => nav(DEVELOPERS_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-white/40">For developers</button>
            </div>
            <div className="mt-10">
              <button onClick={() => nav("/console")} className="group inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_-8px_rgba(0,0,0,0.6)] transition hover:from-gold-200 hover:to-gold-500">
                Launch Dispatch <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
            <div className="mt-14 flex flex-col items-center gap-1 border-t border-white/[0.06] pt-10">
              <div className="flex items-center gap-2.5"><DispatchMark className="h-6 w-6 text-gold-400" /><span className="font-semibold tracking-tight text-white/85">Sovereign Dispatch</span></div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/40">Sovereign by design · Auditable by default · Institution ready</div>
              <div className="mt-1 text-[13px] text-white/30">The Vanguard of Institutional Governance.</div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Landing;
