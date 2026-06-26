import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DispatchMark, Chevron, SectionHead, PublicHeader, PublicFooter, FilmGrain, useReveal } from "../components/brand";
import {
  ARCHITECTURE_ROUTE, DEVELOPERS_ROUTE, PROCUREMENT_ROUTE,
  OFFICIAL_RECORD_ROUTE, VERIFY_ROUTE,
} from "../lib/routes";

// The front door — Sovereign Dispatch, the Vanguard of Institutional Governance.
// One governed path from information to a Trusted Institutional Publication. Every
// claim here is something the platform actually does (governance, certificates,
// integrity, verification, preservation); the CTAs reach the real surfaces.

const VERBS = ["Create", "Review", "Approve", "Authorize", "Publish", "Certify", "Verify", "Preserve"];

const GUARANTEES = [
  "A permanent institutional identity",
  "A governed approval process",
  "Named institutional authority",
  "A Governance Certificate",
  "A Preservation Certificate",
  "Cryptographic integrity verification",
  "A complete evidence chain",
  "Permanent authenticity verification",
];

const TRANSFORM = [
  "Information", "Draft", "Governance", "Review", "Approval", "Authorization",
  "Publication", "Certification", "Verification", "Preservation",
];

const LIFECYCLE: [string, string][] = [
  ["01", "Submission"], ["02", "Governance"], ["03", "Review"], ["04", "Approval"], ["05", "Authorization"],
  ["06", "Publication"], ["07", "Certification"], ["08", "Verification"], ["09", "Preservation"],
];

// WHO USES DISPATCH — the people who hold office inside institutions worldwide.
// Each card's photograph drops into /public/people/<slug>.webp (see the manifest
// in that folder). Until a real image is supplied, a dignified portrait
// placeholder shows — never a broken image. Region tags signal international
// representation; the roster spans men and women in equal measure.
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
// at work) and falls back to a per-sector glyph treatment — never a broken image —
// so the section is premium and institutional with or without supplied photography.
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

const SECTORS: [string, string][] = [
  ["Government", "Issue legislation, policies, directives and official notices with permanent authenticity."],
  ["Healthcare", "Publish clinical guidance, safety directives and regulatory publications with complete traceability."],
  ["Education", "Publish senate resolutions, research outputs, credentials and institutional publications."],
  ["Enterprise", "Govern board resolutions, compliance publications and corporate authority through one trusted platform."],
];

const Landing: React.FC = () => {
  useReveal();
  const nav = useNavigate();
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <main>
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 pb-24 pt-24 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(202,164,90,0.10),transparent_70%)]" />
          <div className="relative mx-auto max-w-5xl text-center">
            <div className="mx-auto mb-7 flex h-12 w-12 items-center justify-center"><DispatchMark className="h-12 w-12 text-gold-400" /></div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.34em] text-gold-400">Sovereign Dispatch</div>
            <h1 className="mx-auto mt-4 max-w-4xl font-serif text-[2.7rem] font-bold leading-[1.04] tracking-tight sm:text-[3.6rem]">The Vanguard of Institutional Governance.</h1>
            <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[12.5px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {VERBS.map((v, i) => (
                <React.Fragment key={v}>
                  <span className="text-white/70">{v}</span>
                  {i < VERBS.length - 1 && <span className="text-gold-400/40" aria-hidden>·</span>}
                </React.Fragment>
              ))}
            </div>
            <p className="mx-auto mt-7 max-w-2xl text-[16px] leading-relaxed text-white/60">
              Sovereign Dispatch governs every stage of publication — from creation to permanent preservation. Every publication carries institutional authority, cryptographic integrity, a complete evidence chain, and permanent verification.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <button onClick={() => nav("/console")} className="group inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_8px_20px_-8px_rgba(0,0,0,0.6)] transition hover:from-gold-200 hover:to-gold-500">
                Launch Dispatch <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav(ARCHITECTURE_ROUTE)} className="rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white/85 transition hover:border-white/40">View Architecture</button>
            </div>
            <p className="mt-5 text-[12.5px] italic text-white/35">Evaluate in your own environment. No sales call required.</p>
          </div>
        </section>

        {/* ── Trusted by institutions worldwide — the big visual section ── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Who leads with Dispatch</div>
              <h2 className="mx-auto mt-3 max-w-3xl font-serif text-[2.1rem] font-bold leading-tight tracking-tight sm:text-[2.7rem]">Trusted by institutions worldwide.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/55">Governments, universities, hospitals, courts, enterprises and regulators turn their decisions into governed, certified, permanently verifiable publications. Find your institution.</p>
            </div>

            {/* institution-type cards — large editorial imagery of leadership at work */}
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {INSTITUTIONS.map((it) => (
                <article key={it.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-gold-400/30 hover:bg-white/[0.03]">
                  <div className="relative">
                    <SectorImage slug={it.slug} alt={`${it.name} — ${it.scene}`} />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="font-serif text-[1.55rem] font-bold leading-none text-white">{it.name}</div>
                    </div>
                  </div>
                  <p className="px-5 pb-5 pt-4 text-[14px] leading-relaxed text-white/65">{it.copy}</p>
                </article>
              ))}
            </div>

            {/* the full roster — every office within each institution */}
            <div className="mt-16">
              <div className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Across every institution</div>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {ROSTER.map(([sector, roles]) => (
                  <div key={sector} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-400/80">{sector}</div>
                    <ul className="mt-3 space-y-1.5">
                      {roles.map((r) => (
                        <li key={r} className="flex items-center gap-2.5 text-[13.5px] text-white/70">
                          <span className="h-1 w-1 shrink-0 rounded-full bg-gold-400/60" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-center text-[12px] text-white/35">International representation across Africa, Europe, Asia, the Middle East and the Americas — every office, every institution that cannot fail.</p>
            </div>
          </div>
        </section>

        {/* ── What makes Dispatch different ────────────────────────── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <SectionHead index="01" kicker="The distinction" title="Most platforms create documents. Dispatch creates trusted institutional publications."
              sub="An ordinary document can be copied, edited, renamed, replaced or questioned. A Dispatch publication is fundamentally different — a copied PDF is still only a copy; a Dispatch publication can always prove its authenticity." />
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-2.5 sm:grid-cols-2">
              {GUARANTEES.map((g) => (
                <div key={g} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[14px] text-white/85">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[11px] text-emerald-300">✓</span>{g}
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(OFFICIAL_RECORD_ROUTE)} className="rounded-md border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-white/40">See the difference →</button>
              <button onClick={() => nav(VERIFY_ROUTE)} className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-5 py-2.5 text-[13px] font-semibold text-emerald-300 transition hover:bg-emerald-500/20">Verify a record →</button>
            </div>
          </div>
        </section>

        {/* ── The Dispatch transformation ──────────────────────────── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <SectionHead index="02" kicker="The transformation" title="Information is not authority. Authority must be earned."
              sub="Dispatch transforms institutional information through one governed path." />
            <ol className="mx-auto mt-12 max-w-md">
              {TRANSFORM.map((t, i) => (
                <li key={t} className="relative flex items-center gap-4 pb-4 last:pb-0">
                  {i < TRANSFORM.length && <span aria-hidden className="absolute left-[15px] top-7 h-[calc(100%-1.25rem)] w-px bg-white/10 last:hidden" />}
                  <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#0c0c0c] font-mono text-[11px] text-white/45">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-[15px] font-medium text-white/80">{t}</span>
                </li>
              ))}
              <li className="relative flex items-center gap-4 pt-1">
                <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/20 text-gold-300 ring-1 ring-gold-400/40">★</span>
                <span className="font-serif text-[1.15rem] font-bold text-white">Trusted Institutional Publication</span>
              </li>
            </ol>
          </div>
        </section>

        {/* ── Why institutions choose Dispatch ─────────────────────── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <SectionHead index="03" kicker="Why institutions choose Dispatch" title="The challenge is not writing documents."
              sub="Governments, universities, hospitals, regulators and enterprises make decisions every day. The challenge is proving that those documents became the institution's official publication." />
            <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {["Governance before publication", "Institutional authority", "Complete provenance", "Cryptographic integrity", "Permanent preservation", "Independent verification"].map((t) => (
                <div key={t} className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-4 text-[14px] font-medium text-white/80">{t}</div>
              ))}
            </div>
            <p className="mt-8 text-center text-[14px] text-white/45">Every publication proves itself.</p>
          </div>
        </section>

        {/* ── What is a trusted institutional publication ──────────── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <SectionHead index="04" kicker="Definition" title="What is a trusted institutional publication?"
              sub="The institution's authoritative version of a decision. Unlike an ordinary document, it carries the proof that it was governed, authorized and issued — and, years later, anyone with permission can verify it is genuine, complete and officially issued." />
            <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-2">
              {["institutional authority", "approval history", "publication authority", "governance certificate", "preservation certificate", "integrity proof", "permanent evidence"].map((t) => (
                <span key={t} className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[12.5px] text-white/70">{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── The governed lifecycle ───────────────────────────────── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <SectionHead index="05" kicker="The governed lifecycle" title="Every publication follows the same institutional path."
              sub="Nothing bypasses governance. Nothing reaches publication without institutional authority." />
            <div className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              {LIFECYCLE.map(([n, t]) => (
                <div key={n} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="font-mono text-[12px] text-gold-400/70">{n}</div>
                  <div className="mt-1 text-[15px] font-semibold text-white/85">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Built for institutions that cannot fail ──────────────── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <SectionHead index="06" kicker="Built for institutions that cannot fail" title="One platform for the institutions decisions depend on." />
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 sm:grid-cols-2">
              {SECTORS.map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="font-serif text-[1.3rem] font-bold text-white">{k}</div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-white/55">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── One platform, three ways ─────────────────────────────── */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-transparent px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <SectionHead index="07" kicker="One platform" title="Three ways to use Dispatch." />
            <div className="mx-auto mt-12 grid max-w-4xl gap-5 lg:grid-cols-3">
              {[
                { t: "Operations", d: "Daily institutional work through the Dispatch console.", cta: "Launch the console", to: "/console" },
                { t: "Integration", d: "Connect existing ERP, SharePoint, case management, HR or document systems through the Dispatch API.", cta: "For developers", to: DEVELOPERS_ROUTE },
                { t: "Evaluation", d: "Security, procurement, compliance, trust and deployment resources — available before adoption.", cta: "Evaluate Dispatch", to: PROCUREMENT_ROUTE },
              ].map((c) => (
                <div key={c.t} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                  <div className="font-serif text-[1.3rem] font-bold text-white">{c.t}</div>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-white/55">{c.d}</p>
                  <button onClick={() => nav(c.to)} className="mt-4 self-start text-[13px] font-semibold text-gold-400 transition hover:text-gold-300">{c.cta} →</button>
                </div>
              ))}
            </div>
            <div className="mt-14 flex flex-col items-center gap-1 border-t border-white/[0.06] pt-10 text-center">
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
