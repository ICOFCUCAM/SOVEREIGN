import React from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain, Chevron, useReveal, useScrollSpy } from "../components/brand";
import { ARTICLES, LIBRARY_BASE, articleBySlug } from "../lib/library";
import { problemBySlug, PROBLEMS_BASE } from "../lib/problems";
import { industryBySlug, INDUSTRIES_BASE } from "../lib/industries";
import { WALKTHROUGH_ROUTE, VERIFY_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Layer 4 — a single long-form Knowledge Library article. Table of contents,
// sectioned prose, key takeaways, FAQ, and deep internal links into concepts
// (/learn), industries and sibling articles. Emits Article + FAQPage +
// BreadcrumbList structured data.

const anchor = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  useReveal();
  const a = articleBySlug(slug);
  React.useEffect(() => { if (a) track("page.library", { slug: a.slug }); }, [a]);
  const tocIds = React.useMemo(() => a ? [...a.sections.map((s) => anchor(s.h)), "faq"] : [], [a]);
  const activeId = useScrollSpy(tocIds);
  if (!a) return <Navigate to={LIBRARY_BASE} replace />;

  const url = `https://dispatch.sovereigndo.com${LIBRARY_BASE}/${a.slug}`;
  const concepts = a.relatedConcepts.map(problemBySlug).filter(Boolean) as NonNullable<ReturnType<typeof problemBySlug>>[];
  const inds = a.relatedIndustries.map(industryBySlug).filter(Boolean) as NonNullable<ReturnType<typeof industryBySlug>>[];
  const articles = a.relatedArticles.map(articleBySlug).filter(Boolean) as typeof ARTICLES;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: a.title,
        description: a.metaDescription,
        articleSection: a.category,
        url,
        datePublished: a.updated,
        dateModified: a.updated,
        author: { "@type": "Organization", name: "Sovereign Dispatch" },
        publisher: { "@type": "Organization", name: "Sovereign Dispatch", url: "https://dispatch.sovereigndo.com/" },
        mainEntityOfPage: url,
      },
      { "@type": "FAQPage", mainEntity: a.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Library", item: `https://dispatch.sovereigndo.com${LIBRARY_BASE}` },
          { "@type": "ListItem", position: 2, name: a.title, item: url },
        ],
      },
    ],
  };

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth} .prose-sd p{margin-top:1rem}`}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <FilmGrain />
      <PublicHeader />
      <main>
        {/* header */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 pt-20 pb-12 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden style={{ background: "radial-gradient(60% 55% at 75% 20%, rgba(212,178,90,0.09), transparent 70%)" }} />
          <div className="relative mx-auto max-w-[820px]">
            <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35" aria-label="Breadcrumb">
              <button onClick={() => nav(LIBRARY_BASE)} className="transition hover:text-gold-300">Library</button>
              <Chevron className="h-3 w-3" /><span className="text-gold-400/70">{a.category}</span>
            </nav>
            <div className="mt-5 flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">{a.kicker}</span></div>
            <h1 className="mt-5 font-serif text-[2.3rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">{a.title}</h1>
            <p className="mt-6 text-[18px] leading-relaxed text-white/70">{a.dek}</p>
            <div className="mt-6 flex items-center gap-4 text-[12px] uppercase tracking-[0.16em] text-white/35">
              <span>Updated {a.updated}</span><span aria-hidden>·</span><span>{a.readingMinutes} min read</span>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-[1140px] gap-12 px-6 pb-8 lg:grid-cols-[220px_1fr] lg:px-12">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">On this page</div>
              <ul className="mt-4 space-y-2.5 border-l border-white/10">
                {a.sections.map((s) => {
                  const id = anchor(s.h);
                  const on = activeId === id;
                  return (
                    <li key={s.h}>
                      <a href={`#${id}`} aria-current={on ? "true" : undefined} className={`block border-l -ml-px pl-4 text-[13px] leading-snug transition hover:border-gold-400/60 hover:text-gold-200 ${on ? "border-gold-400 font-semibold text-gold-200" : "border-transparent text-white/50"}`}>{s.h}</a>
                    </li>
                  );
                })}
                <li><a href="#faq" aria-current={activeId === "faq" ? "true" : undefined} className={`block border-l -ml-px pl-4 text-[13px] leading-snug transition hover:border-gold-400/60 hover:text-gold-200 ${activeId === "faq" ? "border-gold-400 font-semibold text-gold-200" : "border-transparent text-white/50"}`}>Common questions</a></li>
              </ul>
            </div>
          </aside>

          {/* body */}
          <article className="prose-sd max-w-[760px]">
            <div className="border-y border-white/[0.08] py-6">
              {a.intro.map((p, i) => (
                <p key={i} className={`text-[17px] leading-relaxed text-white/75 ${i > 0 ? "mt-4" : ""}`}>{p}</p>
              ))}
            </div>

            {a.sections.map((s) => (
              <section key={s.h} id={anchor(s.h)} className="mt-12 scroll-mt-24">
                <h2 className="font-serif text-[1.7rem] font-bold leading-tight tracking-tight text-[#f4efe3] sm:text-[2rem]">{s.h}</h2>
                {s.p.map((p, i) => (
                  <p key={i} className="mt-4 text-[16.5px] leading-relaxed text-white/72">{p}</p>
                ))}
                {s.list && (
                  <ul className="mt-5 space-y-2.5">
                    {s.list.map((li) => (
                      <li key={li} className="flex gap-3 text-[15.5px] leading-relaxed text-white/72"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400/70" />{li}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {/* key takeaways */}
            <section className="mt-12 rounded-2xl border border-gold-500/20 bg-gradient-to-b from-gold-500/[0.06] to-transparent p-7">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Key takeaways</div>
              <ul className="mt-5 space-y-3">
                {a.keyPoints.map((k) => (
                  <li key={k} className="flex gap-3 text-[15.5px] leading-relaxed text-white/80"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold-400/15 text-[11px] text-gold-300">✓</span>{k}</li>
                ))}
              </ul>
            </section>

            {/* FAQ */}
            <section id="faq" className="mt-12 scroll-mt-24">
              <h2 className="font-serif text-[1.7rem] font-bold leading-tight tracking-tight text-[#f4efe3] sm:text-[2rem]">Common questions</h2>
              <div className="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">
                {a.faqs.map((f) => (
                  <div key={f.q} className="py-5">
                    <h3 className="font-serif text-[1.15rem] font-bold leading-snug text-white">{f.q}</h3>
                    <p className="mt-2.5 text-[15px] leading-relaxed text-white/60">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-3">
              <button onClick={() => nav(WALKTHROUGH_ROUTE)} className="btn-sheen group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">See it in action <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
              <button onClick={() => nav(VERIFY_ROUTE)} className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-500/20">Verify a record</button>
            </div>
          </article>
        </div>

        {/* related */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-16 lg:px-12">
          <div className="mx-auto grid max-w-[1140px] gap-10 lg:grid-cols-3">
            {articles.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Continue reading</div>
                <ul className="mt-5 space-y-2.5">
                  {articles.map((o) => (
                    <li key={o.slug}><button onClick={() => nav(`${LIBRARY_BASE}/${o.slug}`)} className="group flex w-full items-center justify-between gap-2 text-left text-[14px] font-medium text-white/70 transition hover:text-white">{o.title}<Chevron className="h-3 w-3 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-gold-400" /></button></li>
                  ))}
                </ul>
              </div>
            )}
            {concepts.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Related concepts</div>
                <ul className="mt-5 space-y-2.5">
                  {concepts.map((o) => (
                    <li key={o.slug}><button onClick={() => nav(`${PROBLEMS_BASE}/${o.slug}`)} className="group flex w-full items-center justify-between gap-2 text-left text-[14px] font-medium text-white/70 transition hover:text-white">{o.term}<Chevron className="h-3 w-3 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-gold-400" /></button></li>
                  ))}
                </ul>
              </div>
            )}
            {inds.length > 0 && (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Where it applies</div>
                <ul className="mt-5 space-y-2.5">
                  {inds.map((o) => (
                    <li key={o.slug}><button onClick={() => nav(`${INDUSTRIES_BASE}/${o.slug}`)} className="group flex w-full items-center justify-between gap-2 text-left text-[14px] font-medium text-white/70 transition hover:text-white">{o.name}<Chevron className="h-3 w-3 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-gold-400" /></button></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default ArticlePage;
