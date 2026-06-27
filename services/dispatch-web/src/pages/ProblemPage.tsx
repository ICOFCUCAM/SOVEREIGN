import React from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { PROBLEMS, PROBLEMS_BASE, problemBySlug, type ProblemDiagram } from "../lib/problems";
import { industryBySlug, INDUSTRIES_BASE } from "../lib/industries";
import { WALKTHROUGH_ROUTE, VERIFY_ROUTE, STANDARD_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";
import { DEFAULT_LOCALE, isActiveLocale, localePath, t } from "../lib/i18n";
import { conceptTranslation, conceptLocales } from "../lib/translations";

// Layer 3 — a single Problem / Concept page. Typographic hero (no photo) plus a
// reusable inline-SVG concept diagram. Rich definitional content + DefinedTerm,
// FAQPage, Article and BreadcrumbList schema, and dense internal links into the
// industry pages — engineered to win featured snippets and AI-answer citations.

const ConceptDiagram: React.FC<{ kind: ProblemDiagram }> = ({ kind }) => {
  const stroke = "rgba(212,178,90,0.85)";
  const faint = "rgba(212,178,90,0.28)";
  const common = { fill: "none", stroke, strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const box = "h-full w-full";
  switch (kind) {
    case "chain":
      return (
        <svg viewBox="0 0 240 160" className={box} aria-hidden>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${20 + i * 74},58)`}>
              <rect width="56" height="44" rx="7" {...common} />
              <path d="M12 22 L24 30 L44 14" {...common} />
              {i < 2 && <line x1="56" y1="22" x2="74" y2="22" {...common} strokeDasharray="3 4" />}
            </g>
          ))}
          <text x="120" y="135" textAnchor="middle" fill={faint} fontSize="11" fontFamily="sans-serif" letterSpacing="2">SEALED · ORDERED · INTACT</text>
        </svg>
      );
    case "seal":
      return (
        <svg viewBox="0 0 240 160" className={box} aria-hidden>
          <circle cx="120" cy="74" r="46" {...common} />
          <circle cx="120" cy="74" r="34" {...common} stroke={faint} />
          <path d="M102 74 L116 88 L140 60" {...common} strokeWidth={2} />
          {Array.from({ length: 24 }).map((_, i) => {
            const a = (i / 24) * Math.PI * 2;
            return <line key={i} x1={120 + Math.cos(a) * 46} y1={74 + Math.sin(a) * 46} x2={120 + Math.cos(a) * 51} y2={74 + Math.sin(a) * 51} {...common} stroke={faint} />;
          })}
        </svg>
      );
    case "lifecycle":
      return (
        <svg viewBox="0 0 240 160" className={box} aria-hidden>
          <path d="M24 80 H216" {...common} stroke={faint} />
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={i} transform={`translate(${24 + i * 27.4},80)`}>
              <circle r={i === 7 ? 7 : 4.5} {...common} fill={i === 7 ? "rgba(212,178,90,0.18)" : "none"} />
            </g>
          ))}
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 240 160" className={box} aria-hidden>
          <path d="M120 26 L168 44 V86 C168 112 146 128 120 138 C94 128 72 112 72 86 V44 Z" {...common} />
          <path d="M100 82 L114 96 L142 64" {...common} strokeWidth={2} />
        </svg>
      );
    case "ledger":
      return (
        <svg viewBox="0 0 240 160" className={box} aria-hidden>
          <rect x="64" y="30" width="112" height="100" rx="8" {...common} />
          {[50, 66, 82, 98, 114].map((y, i) => (
            <line key={y} x1="80" y1={y} x2={i % 2 ? 150 : 160} y2={y} {...common} stroke={faint} />
          ))}
          <circle cx="150" cy="112" r="12" {...common} />
          <path d="M145 112 L149 116 L156 108" {...common} />
        </svg>
      );
    case "workflow":
    default:
      return (
        <svg viewBox="0 0 240 160" className={box} aria-hidden>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${30 + i * 66},62)`}>
              <circle r="16" {...common} />
              <path d="M-6 0 L-1 5 L7 -5" {...common} />
              {i < 2 && <line x1="16" y1="0" x2="50" y2="0" {...common} stroke={faint} markerEnd="url(#a)" />}
            </g>
          ))}
          <rect x="22" y="38" width="180" height="48" rx="10" {...common} stroke={faint} />
        </svg>
      );
  }
};

const ProblemPage: React.FC = () => {
  const { slug, lang } = useParams<{ slug: string; lang: string }>();
  const nav = useNavigate();
  useReveal();
  const base = problemBySlug(slug);
  React.useEffect(() => { if (base) track("page.learn", { slug: base.slug, locale: lang || DEFAULT_LOCALE }); }, [base, lang]);
  if (!base) return <Navigate to={PROBLEMS_BASE} replace />;

  // Locale resolution. /en/... canonicalises to root; an unknown locale, or one
  // without a real translation, falls back to English (never fake content).
  const tr = lang && isActiveLocale(lang) && lang !== DEFAULT_LOCALE ? conceptTranslation(lang, base.slug) : undefined;
  if (lang === DEFAULT_LOCALE || (lang && !isActiveLocale(lang)) || (lang && lang !== DEFAULT_LOCALE && !tr)) return <Navigate to={`${PROBLEMS_BASE}/${base.slug}`} replace />;
  const locale = tr ? lang! : DEFAULT_LOCALE;
  const p = tr ? { ...base, ...tr } : base;
  const L = (key: string) => t(locale, key);
  // a concept link points at its localized URL when a translation exists
  const conceptHref = (s: string) => (locale !== DEFAULT_LOCALE && conceptTranslation(locale, s) ? localePath(locale, `${PROBLEMS_BASE}/${s}`) : `${PROBLEMS_BASE}/${s}`);

  const url = `https://dispatch.sovereigndo.com${localePath(locale, `${PROBLEMS_BASE}/${base.slug}`)}`;
  const related = p.relatedProblems.map(problemBySlug).filter(Boolean) as typeof PROBLEMS;
  const inds = p.relatedIndustries.map((s) => industryBySlug(s)).filter(Boolean) as NonNullable<ReturnType<typeof industryBySlug>>[];

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: p.headline,
        about: p.term,
        description: p.metaDescription,
        url,
        author: { "@type": "Organization", name: "Sovereign Dispatch" },
        publisher: { "@type": "Organization", name: "Sovereign Dispatch", url: "https://dispatch.sovereigndo.com/" },
        mainEntityOfPage: url,
      },
      { "@type": "DefinedTerm", name: p.term, description: p.definition, inDefinedTermSet: "https://dispatch.sovereigndo.com" + PROBLEMS_BASE },
      {
        "@type": "FAQPage",
        mainEntity: p.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Learn", item: `https://dispatch.sovereigndo.com${PROBLEMS_BASE}` },
          { "@type": "ListItem", position: 2, name: p.term, item: url },
        ],
      },
    ],
  };

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <FilmGrain />
      <PublicHeader />
      <main>
        {/* typographic hero + concept diagram */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden style={{ background: "radial-gradient(60% 60% at 78% 30%, rgba(212,178,90,0.10), transparent 70%)" }} />
          <div className="relative mx-auto grid max-w-[1080px] items-center gap-12 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <div className="flex items-center justify-between gap-3">
                <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35" aria-label="Breadcrumb">
                  <button onClick={() => nav(PROBLEMS_BASE)} className="transition hover:text-gold-300">{L("nav.learn")}</button>
                  <Chevron className="h-3 w-3" /><span className="text-gold-400/70">{p.term}</span>
                </nav>
                {conceptLocales(base.slug).length > 1 && (
                  <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-0.5 text-[11px] font-semibold" aria-label={t(locale, "lang.label")}>
                    {conceptLocales(base.slug).map((loc) => (
                      <button key={loc} onClick={() => nav(localePath(loc, `${PROBLEMS_BASE}/${base.slug}`))}
                        className={`rounded-full px-2.5 py-1 uppercase transition ${locale === loc ? "bg-gold-400/15 text-gold-200" : "text-white/50 hover:text-white"}`}>{loc}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-5 flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">{p.kicker}</span></div>
              <h1 className="mt-5 font-serif text-[2.2rem] font-bold leading-[1.1] tracking-tight text-[#f4efe3] sm:text-[2.9rem]">{p.headline}</h1>
              <p className="mt-6 max-w-xl text-[16.5px] leading-relaxed text-white/65">{p.lead}</p>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={() => nav(WALKTHROUGH_ROUTE)} className="btn-sheen group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">{L("cta.seeInAction")} <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
                <button onClick={() => nav(VERIFY_ROUTE)} className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-500/20">{L("cta.verify")}</button>
              </div>
            </div>
            <div className="relative aspect-[3/2] w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-6">
              <ConceptDiagram kind={p.diagram} />
            </div>
          </div>
        </section>

        {/* definition — the snippet target */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-[900px]">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{L("concept.definition")}</span></div>
            <p className="mt-5 font-serif text-[1.5rem] leading-snug text-[#f4efe3] sm:text-[1.85rem]"><span className="font-bold">{p.term}</span> — {p.definition}</p>
          </div>
        </section>

        {/* why it matters */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[900px]">
            <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-[#f4efe3] sm:text-[2.4rem]">{L("concept.why")}</h2>
            <div className="mt-8 space-y-5">
              {p.why.map((w, i) => (
                <div key={i} className="reveal flex gap-4">
                  <span className="mt-1 font-serif text-[1.1rem] font-bold text-gold-400/60">{String(i + 1).padStart(2, "0")}</span>
                  <p className="text-[16px] leading-relaxed text-white/70">{w}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* how Sovereign Dispatch handles it */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{L("concept.how")}</span></div>
            <div className="stagger mt-10 grid gap-5 lg:grid-cols-3">
              {p.how.map((h, i) => (
                <div key={h.t} className="reveal relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
                  <span className="pointer-events-none absolute right-5 top-3 font-serif text-[3.4rem] font-bold leading-none text-white/[0.05]">{String(i + 1).padStart(2, "0")}</span>
                  <div className="relative font-serif text-[1.25rem] font-bold leading-snug text-white">{h.t}</div>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/55">{h.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-9">
              <button onClick={() => nav(STANDARD_ROUTE)} className="group inline-flex items-center gap-2 text-[13.5px] font-semibold uppercase tracking-wide text-gold-300 transition hover:text-gold-200">The Official Record standard <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[900px]">
            <h2 className="font-serif text-[2rem] font-bold leading-tight tracking-tight text-[#f4efe3] sm:text-[2.4rem]">{L("concept.faq")}</h2>
            <div className="mt-8 divide-y divide-white/[0.08] border-y border-white/[0.08]">
              {p.faqs.map((f) => (
                <div key={f.q} className="py-6">
                  <h3 className="font-serif text-[1.2rem] font-bold leading-snug text-white">{f.q}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-white/60">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* where this applies — internal links into industries */}
        {inds.length > 0 && (
          <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-16 lg:px-12">
            <div className="mx-auto max-w-[1100px]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{L("concept.applies")}</div>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {inds.map((o) => (
                  <button key={o.slug} onClick={() => nav(`${INDUSTRIES_BASE}/${o.slug}`)}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-[13.5px] font-medium text-white/70 transition hover:border-gold-400/30 hover:text-white">
                    {o.name}<Chevron className="h-3 w-3 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* related concepts */}
        {related.length > 0 && (
          <section className="border-t border-white/[0.06] px-6 py-16 lg:px-12">
            <div className="mx-auto max-w-[1100px]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{L("concept.related")}</div>
              <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((o) => (
                  <button key={o.slug} onClick={() => nav(conceptHref(o.slug))}
                    className="group flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-[13.5px] font-medium text-white/70 transition hover:border-gold-400/30 hover:text-white">
                    {o.term}<Chevron className="h-3 w-3 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <PublicFooter />
    </div>
  );
};

export default ProblemPage;
