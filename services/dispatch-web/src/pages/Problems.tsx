import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { PROBLEMS, PROBLEMS_BASE, PROBLEM_CATEGORIES } from "../lib/problems";
import { INDUSTRIES_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Layer 3 index — the knowledge hub. Groups every concept page by category and
// emits an ItemList so search and AI answer engines can enumerate the library.

const Problems: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  const [q, setQ] = React.useState("");
  React.useEffect(() => { track("page.learn_index", {}); }, []);
  const query = q.trim().toLowerCase();
  const matches = query ? PROBLEMS.filter((p) => p.term.toLowerCase().includes(query) || p.definition.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)) : [];

  const ConceptCard: React.FC<{ p: typeof PROBLEMS[number] }> = ({ p }) => (
    <button onClick={() => nav(`${PROBLEMS_BASE}/${p.slug}`)}
      className="reveal group flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
      <div className="font-serif text-[1.25rem] font-bold leading-snug text-white">{p.term}</div>
      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-white/55 line-clamp-3">{p.definition}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-gold-300/80 transition group-hover:text-gold-200">Read <Chevron className="h-3 w-3 transition group-hover:translate-x-0.5" /></span>
    </button>
  );

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Sovereign Dispatch — Knowledge",
    itemListElement: PROBLEMS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.term,
      url: `https://dispatch.sovereigndo.com${PROBLEMS_BASE}/${p.slug}`,
    })),
  };

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <FilmGrain />
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden style={{ background: "radial-gradient(55% 60% at 70% 25%, rgba(212,178,90,0.10), transparent 70%)" }} />
          <div className="relative mx-auto max-w-[1000px]">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Knowledge</span></div>
            <h1 className="mt-5 max-w-2xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3.1rem]">The language of official publication, governance and proof.</h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-white/65">Clear, authoritative references on the concepts behind governed publication — what they mean, why they matter, and how an institution proves them.</p>
            <div className="relative mt-8 max-w-xl">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Search concepts"
                placeholder={`Search ${PROBLEMS.length} concepts — evidence chain, retention, sealing…`}
                className="w-full rounded-xl border border-white/12 bg-white/[0.03] py-3.5 pl-11 pr-4 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-gold-400/40 focus:bg-white/[0.05]" />
            </div>
          </div>
        </section>

        {query ? (
          <section className="border-t border-white/[0.06] px-6 py-12 lg:px-12">
            <div className="mx-auto max-w-[1100px]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{matches.length} result{matches.length === 1 ? "" : "s"}</div>
              {matches.length > 0 ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{matches.map((p) => <ConceptCard key={p.slug} p={p} />)}</div>
              ) : (
                <p className="mt-6 text-[15px] text-white/55">No concept matches “{q}”. Try a broader term — or <button onClick={() => setQ("")} className="text-gold-300 underline-offset-2 hover:underline">browse all</button>.</p>
              )}
            </div>
          </section>
        ) : PROBLEM_CATEGORIES.map((cat) => (
          <section key={cat} className="border-t border-white/[0.06] px-6 py-16 lg:px-12 even:bg-gradient-to-b even:from-white/[0.022] even:to-transparent">
            <div className="mx-auto max-w-[1100px]">
              <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{cat}</span></div>
              <div className="stagger mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {PROBLEMS.filter((p) => p.category === cat).map((p) => <ConceptCard key={p.slug} p={p} />)}
              </div>
            </div>
          </section>
        ))}

        <section className="border-t border-white/[0.06] px-6 py-16 lg:px-12">
          <div className="mx-auto flex max-w-[1000px] flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="font-serif text-[1.7rem] font-bold text-white">See which institutions this is built for.</h2>
              <p className="mt-2 max-w-md text-[14px] text-white/55">The same governed lifecycle, in seventy institutions' own language.</p>
            </div>
            <button onClick={() => nav(INDUSTRIES_ROUTE)} className="group inline-flex items-center gap-2.5 rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-gold-400/35 hover:text-white">Browse industries <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Problems;
