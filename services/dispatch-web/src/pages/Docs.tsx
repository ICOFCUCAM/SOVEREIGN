import React from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { DOCS, DOCS_BASE, DOC_GROUPS, docBySlug, type DocBlock } from "../lib/docs";
import { track } from "../lib/analytics";

// Layer 5 — Developer Documentation. One layout for /docs and /docs/:slug: a
// persistent grouped sidebar, a typed-block renderer, and prev/next. Emits
// TechArticle + BreadcrumbList structured data.

const methodColor: Record<string, string> = {
  GET: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  POST: "text-gold-300 border-gold-400/30 bg-gold-400/10",
  DELETE: "text-rose-300 border-rose-400/30 bg-rose-400/10",
  PUT: "text-sky-300 border-sky-400/30 bg-sky-400/10",
};

const Block: React.FC<{ b: DocBlock }> = ({ b }) => {
  switch (b.t) {
    case "p": return <p className="mt-4 text-[15.5px] leading-relaxed text-white/72">{b.s}</p>;
    case "h": return <h2 className="mt-10 font-serif text-[1.5rem] font-bold leading-tight text-[#f4efe3]">{b.s}</h2>;
    case "code": return (
      <pre className="mt-5 overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-5 text-[13px] leading-relaxed text-white/85"><code className={`language-${b.lang}`}>{b.s}</code></pre>
    );
    case "list": return (
      <ul className="mt-4 space-y-2.5">{b.items.map((i) => (<li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/72"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400/70" />{i}</li>))}</ul>
    );
    case "note": return (
      <div className="mt-5 rounded-xl border border-gold-500/20 bg-gold-500/[0.06] p-4 text-[14px] leading-relaxed text-white/75"><span className="font-semibold text-gold-300">Note · </span>{b.s}</div>
    );
    case "endpoint": return (
      <div className="mt-4 flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
        <span className={`shrink-0 rounded border px-2 py-1 text-[11px] font-bold tracking-wide ${methodColor[b.method] || "text-white/70 border-white/20 bg-white/5"}`}>{b.method}</span>
        <code className="text-[13.5px] text-white/85">{b.path}</code>
        <span className="ml-auto hidden text-[12.5px] text-white/45 sm:block">{b.s}</span>
      </div>
    );
    case "table": return (
      <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-[13.5px]">
          <thead><tr className="border-b border-white/10 bg-white/[0.03]">{b.head.map((h) => (<th key={h} className="px-4 py-2.5 font-semibold text-white/70">{h}</th>))}</tr></thead>
          <tbody>{b.rows.map((r, i) => (<tr key={i} className="border-b border-white/[0.06] last:border-0">{r.map((c, j) => (<td key={j} className={`px-4 py-2.5 align-top ${j === 0 ? "font-mono text-gold-200/90" : "text-white/65"}`}>{c}</td>))}</tr>))}</tbody>
        </table>
      </div>
    );
  }
};

const Docs: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  useReveal();
  const current = slug ? docBySlug(slug) : DOCS[0];
  React.useEffect(() => { if (current) track("page.docs", { slug: current.slug }); }, [current]);
  if (slug && !current) return <Navigate to={DOCS_BASE} replace />;
  const doc = current!;
  const idx = DOCS.findIndex((d) => d.slug === doc.slug);
  const prev = DOCS[idx - 1];
  const next = DOCS[idx + 1];
  const url = `https://dispatch.sovereigndo.com${DOCS_BASE}/${doc.slug}`;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "TechArticle", headline: doc.title, description: doc.summary, url, author: { "@type": "Organization", name: "Sovereign Dispatch" }, publisher: { "@type": "Organization", name: "Sovereign Dispatch", url: "https://dispatch.sovereigndo.com/" }, mainEntityOfPage: url },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Docs", item: `https://dispatch.sovereigndo.com${DOCS_BASE}` },
        { "@type": "ListItem", position: 2, name: doc.title, item: url },
      ] },
    ],
  };

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <FilmGrain />
      <PublicHeader />
      <main className="mx-auto grid max-w-[1240px] gap-10 px-6 py-12 lg:grid-cols-[240px_1fr] lg:px-12">
        {/* sidebar */}
        <aside className="lg:border-r lg:border-white/[0.06] lg:pr-6">
          <div className="lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Developer Docs</div>
            <nav className="mt-6 space-y-7">
              {DOC_GROUPS.map((g) => (
                <div key={g}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35">{g}</div>
                  <ul className="mt-3 space-y-1">
                    {DOCS.filter((d) => d.group === g).map((d) => {
                      const active = d.slug === doc.slug;
                      return (
                        <li key={d.slug}>
                          <button onClick={() => nav(`${DOCS_BASE}/${d.slug}`)} className={`block w-full rounded-md px-3 py-1.5 text-left text-[14px] transition ${active ? "bg-gold-400/10 font-semibold text-gold-200" : "text-white/60 hover:bg-white/[0.04] hover:text-white"}`}>{d.title}</button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* content */}
        <article className="min-w-0 max-w-[760px]">
          <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35" aria-label="Breadcrumb">
            <button onClick={() => nav(DOCS_BASE)} className="transition hover:text-gold-300">Docs</button>
            <Chevron className="h-3 w-3" /><span className="text-gold-400/70">{doc.group}</span>
          </nav>
          <h1 className="mt-4 font-serif text-[2.2rem] font-bold leading-tight tracking-tight text-[#f4efe3] sm:text-[2.7rem]">{doc.title}</h1>
          <p className="mt-3 text-[16.5px] leading-relaxed text-white/60">{doc.summary}</p>
          <div className="mt-6 border-t border-white/[0.08] pt-2">
            {doc.blocks.map((b, i) => (<Block key={i} b={b} />))}
          </div>

          <div className="mt-12 flex items-stretch justify-between gap-4 border-t border-white/[0.08] pt-6">
            {prev ? (
              <button onClick={() => nav(`${DOCS_BASE}/${prev.slug}`)} className="group flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:border-gold-400/30">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Previous</div>
                <div className="mt-1 text-[14.5px] font-semibold text-white/80 group-hover:text-white">{prev.title}</div>
              </button>
            ) : <div className="flex-1" />}
            {next ? (
              <button onClick={() => nav(`${DOCS_BASE}/${next.slug}`)} className="group flex-1 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-right transition hover:border-gold-400/30">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">Next</div>
                <div className="mt-1 text-[14.5px] font-semibold text-white/80 group-hover:text-white">{next.title}</div>
              </button>
            ) : <div className="flex-1" />}
          </div>
        </article>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Docs;
