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
const FEATURED: { slug: string; inst: string; role: string; use: string; region: string }[] = [
  { slug: "minister-health", inst: "Government", role: "Minister of Health", use: "Approves national policies and authorizes official publications.", region: "Africa" },
  { slug: "university-registrar", inst: "University", role: "University Registrar", use: "Publishes senate resolutions and preserves institutional authority.", region: "Europe" },
  { slug: "corporate-secretary", inst: "Enterprise", role: "Corporate Secretary", use: "Governs board resolutions and compliance publications.", region: "Asia" },
  { slug: "hospital-director", inst: "Healthcare", role: "Hospital Director", use: "Authorizes clinical directives and permanent institutional publications.", region: "Middle East" },
  { slug: "regulatory-commissioner", inst: "Regulator", role: "Regulatory Commissioner", use: "Issues official determinations with complete governance evidence.", region: "Americas" },
  { slug: "national-archivist", inst: "Archives", role: "National Archivist", use: "Preserves authenticated publications for decades.", region: "Africa" },
];

const ROSTER: [string, string[]][] = [
  ["Government", ["Minister", "Permanent Secretary", "Director General", "Policy Officer", "Communications Officer", "Records Manager"]],
  ["Universities", ["Vice Chancellor", "Registrar", "Academic Secretary", "Senate Administrator", "Research Administrator"]],
  ["Healthcare", ["Hospital Director", "Medical Administrator", "Clinical Governance Officer", "Health Authority Official"]],
  ["Regulators", ["Regulatory Commissioner", "Compliance Officer", "Licensing Officer", "Inspector"]],
  ["Enterprise", ["CEO", "Corporate Secretary", "Board Administrator", "Compliance Director", "Legal Counsel"]],
  ["Justice", ["Court Administrator", "Clerk", "Judicial Officer"]],
  ["Archives", ["National Archivist", "Records Preservation Officer"]],
];

// A portrait that prefers a real photograph and falls back to a dignified
// editorial silhouette (no gradient ids → safe to repeat) rather than a broken
// image, so the section is premium with or without supplied photography.
const Portrait: React.FC<{ slug: string; alt: string }> = ({ slug, alt }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden bg-[radial-gradient(70%_60%_at_50%_28%,rgba(202,164,90,0.16),transparent),linear-gradient(160deg,#15130d,#0a0a0a)]">
      {!failed ? (
        <img src={`/people/${slug}.webp`} alt={alt} loading="lazy" onError={() => setFailed(true)}
          className="h-full w-full object-cover object-top grayscale-[0.15] contrast-[1.03]" />
      ) : (
        <svg viewBox="0 0 120 150" className="absolute inset-0 m-auto h-[78%] w-auto" aria-hidden>
          <circle cx="60" cy="50" r="26" fill="rgba(255,255,255,0.09)" stroke="rgba(202,164,90,0.30)" strokeWidth="1" />
          <path d="M16 150 c0-32 20-54 44-54 s44 22 44 54 z" fill="rgba(255,255,255,0.09)" stroke="rgba(202,164,90,0.18)" strokeWidth="1" />
        </svg>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#070707] via-[#070707]/55 to-transparent" />
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

        {/* ── Who uses Sovereign Dispatch — the people, across institutions ── */}
        <section className="border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Who uses Sovereign Dispatch</div>
              <h2 className="mx-auto mt-3 max-w-3xl font-serif text-[2rem] font-bold leading-tight tracking-tight sm:text-[2.6rem]">Operated by the people who hold office.</h2>
              <p className="mx-auto mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/55">Dispatch governs the work of institutions worldwide — governments, universities, hospitals, regulators, courts and enterprises. People, not software, operate it. Find where your institution fits.</p>
            </div>

            {/* featured roles, with portraits */}
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURED.map((p) => (
                <article key={p.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] transition hover:border-gold-400/30">
                  <div className="relative">
                    <Portrait slug={p.slug} alt={`${p.role}, ${p.inst}`} />
                    <span className="absolute right-3 top-3 rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/75 backdrop-blur">{p.region}</span>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gold-400/90">{p.inst}</div>
                      <div className="mt-0.5 font-serif text-[1.3rem] font-bold leading-tight text-white">{p.role}</div>
                    </div>
                  </div>
                  <p className="px-5 pb-5 pt-4 text-[13.5px] leading-relaxed text-white/60">{p.use}</p>
                </article>
              ))}
            </div>

            {/* the full roster — every role, every institution type */}
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
