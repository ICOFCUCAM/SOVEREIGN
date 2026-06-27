import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { ARTICLES, LIBRARY_BASE, LIBRARY_CATEGORIES } from "../lib/library";
import { LEARN_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Layer 4 index — the Knowledge Library hub. Featured article + every guide
// grouped by category, with an ItemList for search and AI answer engines.

const KnowledgeLibrary: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  React.useEffect(() => { track("page.library_index", {}); }, []);

  const featured = ARTICLES[0];
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Sovereign Dispatch — Knowledge Library",
    itemListElement: ARTICLES.map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.title, url: `https://dispatch.sovereigndo.com${LIBRARY_BASE}/${a.slug}` })),
  };

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <FilmGrain />
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden style={{ background: "radial-gradient(55% 60% at 72% 25%, rgba(212,178,90,0.10), transparent 70%)" }} />
          <div className="relative mx-auto max-w-[1000px]">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Knowledge Library</span></div>
            <h1 className="mt-5 max-w-2xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3.1rem]">The reference for governed, verifiable institutional publication.</h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-white/65">In-depth guides on official records, document governance, evidence, preservation and compliance — written to be the authoritative answer, for the people who have to get this right.</p>
          </div>
        </section>

        {featured && (
          <section className="border-t border-white/[0.06] px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-[1000px]">
              <button onClick={() => nav(`${LIBRARY_BASE}/${featured.slug}`)} className="group block w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.01] p-9 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
                <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Start here · {featured.category}</div>
                <div className="mt-4 font-serif text-[2rem] font-bold leading-tight text-white sm:text-[2.4rem]">{featured.title}</div>
                <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-white/60">{featured.dek}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-gold-300 transition group-hover:text-gold-200">Read the guide · {featured.readingMinutes} min <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
              </button>
            </div>
          </section>
        )}

        {LIBRARY_CATEGORIES.map((cat) => (
          <section key={cat} className="border-t border-white/[0.06] px-6 py-14 lg:px-12 even:bg-gradient-to-b even:from-white/[0.022] even:to-transparent">
            <div className="mx-auto max-w-[1100px]">
              <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{cat}</span></div>
              <div className="stagger mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ARTICLES.filter((a) => a.category === cat).map((a) => (
                  <button key={a.slug} onClick={() => nav(`${LIBRARY_BASE}/${a.slug}`)} className="reveal group flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
                    <div className="font-serif text-[1.2rem] font-bold leading-snug text-white">{a.title}</div>
                    <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-white/55 line-clamp-3">{a.dek}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-gold-300/80 transition group-hover:text-gold-200">{a.readingMinutes} min read <Chevron className="h-3 w-3 transition group-hover:translate-x-0.5" /></span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="border-t border-white/[0.06] px-6 py-16 lg:px-12">
          <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-[1.7rem] font-bold text-white">Looking for a quick definition?</h2>
              <p className="mt-2 max-w-md text-[14px] text-white/55">The concept glossary covers 300 terms across publication, governance and proof.</p>
            </div>
            <button onClick={() => nav(LEARN_ROUTE)} className="group inline-flex items-center gap-2.5 rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-gold-400/35 hover:text-white">Browse concepts <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default KnowledgeLibrary;
