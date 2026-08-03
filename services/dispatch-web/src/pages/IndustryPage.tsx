import React from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { INDUSTRIES, INDUSTRIES_BASE, industryBySlug } from "../lib/industries";
import { LIFECYCLE_ROUTE, WALKTHROUGH_ROUTE, PROCUREMENT_ROUTE, VERIFY_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// Layer 2 — a single Industry Landing Page. Renders any sector from lib/industries
// by slug. Substantive by construction (publications, authorities, sector failure
// modes, frameworks) so it earns citations from search AND AI answer engines, and
// emits JSON-LD structured data + dense internal links to the rest of the ecosystem.

const IndustryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const nav = useNavigate();
  useReveal();
  const ind = industryBySlug(slug);
  React.useEffect(() => { if (ind) track("page.industry", { slug: ind.slug }); }, [ind]);
  if (!ind) return <Navigate to={INDUSTRIES_BASE} replace />;

  const others = INDUSTRIES.filter((i) => i.slug !== ind.slug);

  // Structured data — a Service offered by the Organization, plus a breadcrumb.
  // Helps Google rich results and gives AI answer engines clean, citable facts.
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: `Sovereign Dispatch ${ind.forLabel}`,
        serviceType: "Institutional trust infrastructure",
        description: ind.metaDescription,
        areaServed: ind.name,
        provider: { "@type": "Organization", name: "Sovereign Dispatch", url: "https://dispatch.sovereigndo.com/" },
        url: `https://dispatch.sovereigndo.com${INDUSTRIES_BASE}/${ind.slug}`,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Industries", item: `https://dispatch.sovereigndo.com${INDUSTRIES_BASE}` },
          { "@type": "ListItem", position: 2, name: ind.name, item: `https://dispatch.sovereigndo.com${INDUSTRIES_BASE}/${ind.slug}` },
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
        {/* cinematic sector hero — the sector photograph behind the promise */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-24 lg:px-12">
          <img src={`/people/${ind.banner}.webp`} alt="" aria-hidden loading="lazy" decoding="async"
            className="sd-kenburns absolute inset-0 h-full w-full object-cover object-center opacity-[0.45]"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070707] via-[#070707]/82 to-[#070707]/55" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#070707] to-transparent" aria-hidden />
          <div className="relative mx-auto max-w-[1000px]">
            <nav className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/35" aria-label="Breadcrumb">
              <button onClick={() => nav(INDUSTRIES_BASE)} className="transition hover:text-gold-300">Industries</button>
              <Chevron className="h-3 w-3" /><span className="text-gold-400/70">{ind.name}</span>
            </nav>
            <div className="mt-5 flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">Sovereign Dispatch {ind.forLabel}</span></div>
            <h1 className="mt-5 max-w-3xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3.1rem]">{ind.headline}</h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-white/65">{ind.intro}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => nav("/console")} className="btn-sheen group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">Begin your evaluation <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
              <button onClick={() => nav(PROCUREMENT_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">Procurement materials</button>
            </div>
          </div>
        </section>

        {/* the publications */}
        <section id="publications" className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1000px]">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">What you govern</span></div>
            <h2 className="mt-4 max-w-2xl font-serif text-[2rem] font-bold leading-tight tracking-tight text-[#f4efe3] sm:text-[2.5rem]">The official publications {ind.name.toLowerCase()} produces.</h2>
            <div className="stagger mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ind.publications.map((p) => (
                <div key={p} className="reveal flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5 text-[14px] text-white/80 transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gold-400/12 text-[11px] text-gold-300">✓</span>{p}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* why governance matters here */}
        <section id="why" className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-400">Why it matters {ind.forLabel}</span></div>
            <h2 className="mt-4 max-w-2xl font-serif text-[2rem] font-bold leading-tight tracking-tight text-[#f4efe3] sm:text-[2.5rem]">The governance challenges this sector cannot get wrong.</h2>
            <div className="stagger mt-10 grid gap-5 lg:grid-cols-3">
              {ind.problems.map((p, i) => (
                <div key={p.t} className="reveal relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
                  <span className="pointer-events-none absolute right-5 top-3 font-serif text-[3.4rem] font-bold leading-none text-white/[0.05]">{String(i + 1).padStart(2, "0")}</span>
                  <div className="relative font-serif text-[1.3rem] font-bold leading-snug text-white">{p.t}</div>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/55">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* authorities + frameworks */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-20 lg:px-12">
          <div className="mx-auto grid max-w-[1000px] gap-12 lg:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">The authorities involved</div>
              <ul className="mt-5 space-y-2.5">
                {ind.authorities.map((a) => (
                  <li key={a} className="flex items-center gap-3 text-[15px] text-white/80"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400/70" />{a}</li>
                ))}
              </ul>
              <p className="mt-6 max-w-md text-[13.5px] leading-relaxed text-white/45">Every publication is issued under the authority of an office — durable, attributable, and impossible to forge by editing a file.</p>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Built around your frameworks</div>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {ind.frameworks.map((f) => (
                  <span key={f} className="rounded-full border border-white/12 bg-white/[0.03] px-4 py-2 text-[13px] text-white/70">{f}</span>
                ))}
              </div>
              <p className="mt-6 max-w-md text-[12px] leading-relaxed text-white/40">Framework names describe the controls the architecture is aligned to, not independent certifications. Scope, residency and retention are defined per deployment.</p>
            </div>
          </div>
        </section>

        {/* how it works — route into the shared proof surfaces */}
        <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-[2rem] font-bold leading-tight text-white sm:text-[2.4rem]">See a document become an Official Record.</h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">The governed lifecycle is the same across every institution — only the publications and authorities differ. Watch it happen, or verify a real record yourself.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav(WALKTHROUGH_ROUTE)} className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">Watch a record become official <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></button>
              <button onClick={() => nav(LIFECYCLE_ROUTE)} className="inline-flex items-center rounded border border-white/15 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">The governed lifecycle</button>
              <button onClick={() => nav(VERIFY_ROUTE)} className="inline-flex items-center rounded border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-emerald-300 transition hover:bg-emerald-500/20">Verify a record</button>
            </div>
          </div>
        </section>

        {/* other industries — internal linking */}
        <section className="border-t border-white/[0.06] bg-gradient-to-b from-white/[0.022] to-transparent px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-[1100px]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">Dispatch for every institution</div>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((o) => (
                <button key={o.slug} onClick={() => nav(`${INDUSTRIES_BASE}/${o.slug}`)}
                  className="group flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-[13.5px] font-medium text-white/70 transition hover:border-gold-400/30 hover:text-white">
                  {o.name}<Chevron className="h-3 w-3 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default IndustryPage;
