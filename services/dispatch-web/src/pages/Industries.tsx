import React from "react";
import { useNavigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { INDUSTRIES, INDUSTRIES_BASE } from "../lib/industries";
import { track } from "../lib/analytics";

// The Industries index — the hub of the Layer 2 ecosystem. Links to every sector
// page and gives search/AI a single authoritative list of who Dispatch is for.
const Industries: React.FC = () => {
  const nav = useNavigate();
  useReveal();
  const [q, setQ] = React.useState("");
  React.useEffect(() => track("page.industries"), []);
  const query = q.trim().toLowerCase();
  const shown = query
    ? INDUSTRIES.filter((i) => i.name.toLowerCase().includes(query) || i.publications.some((p) => p.toLowerCase().includes(query)))
    : INDUSTRIES;

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Sovereign Dispatch — institutions served",
    itemListElement: INDUSTRIES.map((i, n) => ({
      "@type": "ListItem", position: n + 1, name: i.name,
      url: `https://dispatch.sovereigndo.com${INDUSTRIES_BASE}/${i.slug}`,
    })),
  };

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug="default" alt="Institutions Sovereign Dispatch serves" />
      <main>
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Industries</span></div>
            <h1 className="mt-5 max-w-3xl font-serif text-[2.5rem] font-bold leading-[1.06] tracking-tight text-[#f4efe3] sm:text-[3.3rem]">Built for every institution that governs information.</h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-white/65">
              The governed lifecycle is the same everywhere — only the publications and authorities change. Find your
              institution, and see Sovereign Dispatch in your own language.
            </p>
            <div className="relative mt-8 max-w-xl">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Search industries"
                placeholder={`Search ${INDUSTRIES.length} institutions — courts, universities, agencies…`}
                className="w-full rounded-xl border border-white/12 bg-white/[0.03] py-3.5 pl-11 pr-4 text-[15px] text-white placeholder:text-white/35 outline-none transition focus:border-gold-400/40 focus:bg-white/[0.05]" />
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-6 pb-24 pt-10 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            {query && (
              <div className="mb-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">{shown.length} institution{shown.length === 1 ? "" : "s"}</div>
            )}
            {shown.length === 0 ? (
              <p className="text-[15px] text-white/55">No institution matches “{q}”. The model is universal — <button onClick={() => setQ("")} className="text-gold-300 underline-offset-2 hover:underline">browse all {INDUSTRIES.length}</button>.</p>
            ) : (
            <div className="stagger grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((i) => (
                <button key={i.slug} onClick={() => nav(`${INDUSTRIES_BASE}/${i.slug}`)}
                  className="reveal group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/30">
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[linear-gradient(160deg,#16140e,#090909)]">
                    <img src={`/people/${i.banner}.webp`} alt={i.name} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-90 transition duration-700 group-hover:scale-[1.04]" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#0b0b0b] to-transparent" />
                    <div className="absolute bottom-0 left-0 p-4 font-serif text-[1.35rem] font-bold leading-none text-white">{i.name}</div>
                  </div>
                  <div className="flex items-start justify-between gap-3 p-5">
                    <p className="text-[13px] leading-relaxed text-white/55">{i.publications.slice(0, 3).join(" · ")}</p>
                    <Chevron className="mt-1 h-4 w-4 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
                  </div>
                </button>
              ))}
            </div>
            )}
            <p className="mt-10 max-w-2xl text-[13px] leading-relaxed text-white/40">
              Don't see your institution? The model is universal — any body that issues records under institutional
              authority can govern, certify and preserve them with Sovereign Dispatch.
            </p>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default Industries;
