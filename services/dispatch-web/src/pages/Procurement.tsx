import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, Chevron, Dot, FilmGrain, useReveal, SURFACE } from "../components/brand";
import { DeploymentMatrix } from "../components/DeploymentMatrix";
import {
  ARCHITECTURE_ROUTE, SECURITY_ROUTE, COMPLIANCE_ROUTE, PRICING_ROUTE,
  DEVELOPERS_ROUTE, EVIDENCE_ROUTE, TRUST_ROUTE, VERIFY_ROUTE,
  COST_ROUTE, LIFECYCLE_ROUTE, ROI_ROUTE,
} from "../lib/routes";
import { track } from "../lib/analytics";
import { useProcurementCopy } from "../lib/messages";

// Procurement Package — a self-serve dossier so technical and procurement
// reviewers can assess Sovereign Dispatch before any human contact. Every claim
// uses verifiable language; no certifications, SLAs or guarantees are asserted.
// No email is exposed: the closing action routes into the console / evaluation.
// All copy is localized via lib/messages/marketing5.ts; the structural maps
// below (section ids, routes, file names, FAQ hrefs) stay in the page.

const SECTION_IDS = [
  "architecture", "deployment", "governance", "security", "residency",
  "readiness", "evaluation", "support", "faq", "roi", "downloads",
];

// Real, self-contained PDFs (generated from the same source as this dossier),
// served from /public. No gate, no NDA. Order matches `docs` in the catalog.
const DOC_FILES = [
  "sovereign-dispatch-procurement-overview.pdf",
  "sovereign-dispatch-evaluation-guide.pdf",
  "sovereign-dispatch-security-architecture-summary.pdf",
];

// Evaluator's index targets — `to` is a route (new tab) or an in-page #anchor.
// Order matches `index` in the catalog.
const INDEX_META: { to: string; ext?: boolean }[] = [
  { to: COST_ROUTE, ext: true },
  { to: LIFECYCLE_ROUTE, ext: true },
  { to: "#roi" },
  { to: "#downloads" },
  { to: ARCHITECTURE_ROUTE, ext: true },
  { to: SECURITY_ROUTE, ext: true },
  { to: COMPLIANCE_ROUTE, ext: true },
  { to: "#deployment" },
  { to: "#security" },
  { to: DEVELOPERS_ROUTE, ext: true },
  { to: PRICING_ROUTE, ext: true },
  { to: EVIDENCE_ROUTE, ext: true },
  { to: VERIFY_ROUTE, ext: true },
  { to: TRUST_ROUTE, ext: true },
];

// Per-FAQ link href (null = no inline link). Order matches `faq` in the catalog.
const FAQ_HREFS: (string | null)[] = [
  null, "#deployment", PRICING_ROUTE, "#residency", null, DEVELOPERS_ROUTE, VERIFY_ROUTE, "#downloads",
];

// Render an FAQ answer, splitting at the {link} placeholder (if any) so the
// catalog supplies the prose and the page supplies the href.
const FaqAnswer: React.FC<{ a: string; linkLabel?: string; href: string | null }> = ({ a, linkLabel, href }) => {
  if (!linkLabel || !href || !a.includes("{link}")) return <>{a}</>;
  const [before, after] = a.split("{link}");
  return (
    <>
      {before}
      <a href={href} className="text-gold-300 hover:underline">{linkLabel}</a>
      {after}
    </>
  );
};

const Procurement: React.FC = () => {
  const nav = useNavigate();
  const c = useProcurementCopy();
  useReveal();
  React.useEffect(() => track("page.procurement"), []);
  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader actions={
        <button onClick={() => window.print()}
          className="no-print hidden items-center gap-2 rounded border border-white/15 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-wide text-white/75 transition hover:border-white/35 hover:text-white sm:inline-flex">
          {c.printPdf}
        </button>
      } />
      <PageBanner slug="procurement" alt="An evaluation meeting" />

      {/* hero */}
      <section className="border-b border-white/5 px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">{c.heroEyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-bold leading-[1.05] tracking-tight text-[#f4efe3] sm:text-6xl">{c.heroTitle}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            {c.heroLead}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={() => nav("/signup")}
              className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_7px_18px_-8px_rgba(0,0,0,0.55)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              {c.ctaStartEval} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </button>
            <a href={ARCHITECTURE_ROUTE} target="_blank" rel="noopener"
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              {c.ctaViewArch}
            </a>
            <span className="text-[12px] text-white/40">{c.heroNote}</span>
          </div>
          {/* package contents — every section is instantly readable below, no gate */}
          <div className="mt-12 border-t border-white/5 pt-6">
            <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">{c.inThisPackage}</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {SECTION_IDS.map((id, i) => (
                <a key={id} href={`#${id}`} className="text-[12px] font-medium uppercase tracking-wide text-white/55 transition hover:text-gold-400">{c.blocks[i].title}</a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Evaluator's index — the single destination linking every assessment surface */}
      <section className="border-b border-white/5 px-8 py-16 lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{c.indexKicker}</div>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl">{c.indexTitle}</h2>
          <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-white/55">{c.indexLead}</p>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.index.map((it, i) => (
              <a key={it.label} href={INDEX_META[i].to} {...(INDEX_META[i].ext ? { target: "_blank", rel: "noopener" } : {})}
                className={`${SURFACE} group flex items-start justify-between gap-3 p-5`}>
                <span>
                  <span className="text-[14.5px] font-bold text-white">{it.label}</span>
                  <span className="mt-1 block text-[12.5px] leading-snug text-white/50">{it.blurb}</span>
                </span>
                <Chevron className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-400/50 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
              </a>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-8 lg:px-12">
        {/* Architecture Overview */}
        <Block id={SECTION_IDS[0]} n="01" title={c.blocks[0].title} lead={c.blocks[0].lead}>
          <p className="text-[14px] leading-relaxed text-white/60">
            {c.archBody}
          </p>
          <a href={ARCHITECTURE_ROUTE} className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-gold-400 hover:underline">
            {c.archCta} <Chevron className="h-3.5 w-3.5" />
          </a>
        </Block>

        {/* Deployment Models */}
        <Block id={SECTION_IDS[1]} n="02" title={c.blocks[1].title} lead={c.blocks[1].lead}>
          <div className="grid gap-4 sm:grid-cols-2">
            {c.deployment.map((d) => (
              <div key={d.t} className={`${SURFACE} p-5`}>
                <div className="text-[15px] font-bold text-white">{d.t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{d.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.deploymentMatrixLabel}</p>
            <DeploymentMatrix />
          </div>
        </Block>

        {/* Governance Model */}
        <Block id={SECTION_IDS[2]} n="03" title={c.blocks[2].title} lead={c.blocks[2].lead}>
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {c.governanceFlow.map((s, i, a) => (
              <React.Fragment key={s}>
                <span className="rounded-md border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-[12.5px] font-semibold text-white/80">{s}</span>
                {i < a.length - 1 && <Chevron className="h-3 w-3 text-gold-400/50" />}
              </React.Fragment>
            ))}
          </div>
          <ul className="space-y-2.5 text-[14px] text-white/65">
            {c.governanceBullets.map((b) => (
              <li key={b} className="flex gap-2.5"><Dot /> {b}</li>
            ))}
          </ul>
        </Block>

        {/* Security Overview */}
        <Block id={SECTION_IDS[3]} n="04" title={c.blocks[3].title} lead={c.blocks[3].lead}>
          <div className="grid gap-4 sm:grid-cols-2">
            {c.security.map((s) => (
              <div key={s.t} className={`${SURFACE} p-5`}>
                <div className="text-[14.5px] font-bold text-white">{s.t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{s.b}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* Data Residency Options */}
        <Block id={SECTION_IDS[4]} n="05" title={c.blocks[4].title} lead={c.blocks[4].lead}>
          <p className="text-[14px] leading-relaxed text-white/60">
            {c.residencyBody}
          </p>
        </Block>

        {/* Procurement Readiness */}
        <Block id={SECTION_IDS[5]} n="06" title={c.blocks[5].title} lead={c.blocks[5].lead}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.readiness.map((r) => (
              <div key={r.t} className={`${SURFACE} p-5`}>
                <div className="text-[14.5px] font-bold text-white">{r.t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{r.b}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* Evaluation Process */}
        <Block id={SECTION_IDS[6]} n="07" title={c.blocks[6].title} lead={c.blocks[6].lead}>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {c.evaluation.map((e, i) => (
              <li key={e.t} className={`${SURFACE} p-5`}>
                <div className="font-mono text-[12px] font-bold text-gold-400">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-[14px] font-bold text-white">{e.t}</div>
                <p className="mt-1 text-[12.5px] leading-snug text-white/50">{e.b}</p>
              </li>
            ))}
          </ol>
        </Block>

        {/* Support Models */}
        <Block id={SECTION_IDS[7]} n="08" title={c.blocks[7].title} lead={c.blocks[7].lead}>
          <div className="grid gap-4 sm:grid-cols-3">
            {c.support.map((s) => (
              <div key={s.t} className={`${SURFACE} p-5`}>
                <div className="text-[14.5px] font-bold text-white">{s.t}</div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{s.b}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-white/35">{c.supportNote}</p>
        </Block>

        {/* Procurement FAQ */}
        <Block id={SECTION_IDS[8]} n="09" title={c.blocks[8].title} lead={c.blocks[8].lead}>
          <div className="grid gap-4 sm:grid-cols-2">
            {c.faq.map((f, i) => (
              <div key={f.q} className={`${SURFACE} p-5`}>
                <div className="text-[14.5px] font-bold text-white">{f.q}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/60"><FaqAnswer a={f.a} linkLabel={f.linkLabel} href={FAQ_HREFS[i]} /></p>
              </div>
            ))}
          </div>
        </Block>

        {/* ROI & Operational Model — part of the Procurement Center */}
        <Block id={SECTION_IDS[9]} n="10" title={c.blocks[9].title} lead={c.blocks[9].lead}>
          <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div>
              <p className="text-[14px] leading-relaxed text-white/60">
                {c.roiBody}
              </p>
              <ul className="mt-4 space-y-2 text-[13.5px] text-white/65">
                {c.roiBullets.map((b) => (
                  <li key={b} className="flex gap-2.5"><Dot /> {b}</li>
                ))}
              </ul>
              <a href={ROI_ROUTE} target="_blank" rel="noopener"
                className="mt-6 inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-5 py-2.5 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                {c.roiCta} <Chevron className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className={`${SURFACE} p-6`}>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{c.roiReflectsLabel}</div>
              <div className="mt-4 space-y-3">
                {c.roiReflects.map((r) => (
                  <div key={r.t} className="border-b border-white/[0.06] pb-2.5 last:border-0">
                    <div className="text-[13.5px] font-semibold text-white">{r.t}</div>
                    <div className="text-[12px] text-white/45">{r.b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Block>

        {/* Downloadable procurement documents — real PDFs from /public */}
        <Block id={SECTION_IDS[10]} n="11" title={c.blocks[10].title} lead={c.blocks[10].lead}>
          <div className="grid gap-4 sm:grid-cols-3">
            {c.docs.map((d, i) => (
              <a key={DOC_FILES[i]} href={`/procurement/${DOC_FILES[i]}`} download
                className={`${SURFACE} group flex flex-col p-6`}>
                <div className="flex items-center justify-between">
                  <span className="rounded border border-white/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-gold-400/80">PDF</span>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-gold-400/60 transition group-hover:text-gold-400" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" />
                  </svg>
                </div>
                <div className="mt-4 font-serif text-[1.15rem] font-bold leading-tight text-white">{d.title}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">{d.blurb}</p>
                <span className="mt-4 text-[12px] font-semibold uppercase tracking-wide text-gold-400/80 group-hover:text-gold-300">{c.downloadLabel}</span>
              </a>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-white/35">{c.downloadsNote}</p>
        </Block>
      </div>

      {/* closing CTA — no email; routes into the console / evaluation */}
      <section className="border-t border-white/5 bg-gradient-to-b from-white/[0.025] to-white/[0.008] px-8 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-bold text-white">{c.closeTitle}</h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
            {c.closeLead}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a href={ARCHITECTURE_ROUTE}
              className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] px-7 py-3.5 text-sm font-semibold uppercase tracking-wide text-white/85 transition active:translate-y-px hover:border-white/35 hover:bg-white/[0.06]">
              {c.ctaCloseArch}
            </a>
            <button onClick={() => nav("/console")}
              className="group inline-flex items-center gap-3 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_10px_26px_-10px_rgba(0,0,0,0.65)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
              {c.ctaBegin} <Chevron className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 px-8 py-10 lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-3 text-[12px] text-white/40 sm:flex-row">
          <div className="flex items-center gap-2"><DispatchMarkInline /> Sovereign Dispatch · {c.footerTag}</div>
          <div>{c.footerMotto}</div>
        </div>
      </footer>
    </div>
  );
};

const Block: React.FC<{ id: string; n: string; title: string; lead: string; children: React.ReactNode }> = ({ id, n, title, lead, children }) => (
  <section id={id} className="scroll-mt-24 border-b border-white/5 py-14">
    <div className="mb-6 flex items-baseline gap-4">
      <span className="font-mono text-[13px] font-bold text-gold-400">{n}</span>
      <div>
        <h2 className="font-serif text-3xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/55">{lead}</p>
      </div>
    </div>
    {children}
  </section>
);

const DispatchMarkInline: React.FC = () => (
  <svg viewBox="0 0 32 32" fill="none" className="h-5 w-5 text-gold-400"><path d="M16 2l11 4v9c0 7-4.7 12.4-11 15-6.3-2.6-11-8-11-15V6l11-4z" stroke="currentColor" strokeWidth="1.6" /></svg>
);

export default Procurement;
