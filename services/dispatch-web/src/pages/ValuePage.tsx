import React from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { PublicHeader, PageBanner, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { VALUE, VALUE_BASE, valueBySlug } from "../lib/value";

// One template, seven pages. Each financial-value item (/value/:slug) gets its
// own URL and content, introduced on the homepage and expanded here.
const ValuePage: React.FC = () => {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  useReveal();
  const item = valueBySlug(slug);
  if (!item) return <Navigate to="/" replace />;

  const others = VALUE.filter((v) => v.slug !== item.slug);

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <FilmGrain />
      <PublicHeader />
      <PageBanner slug={item.banner} alt={item.title} />
      <main>
        <section className="border-t border-white/[0.06] px-8 py-20 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.25em] text-gold-400">
              <span className="font-mono text-gold-400/70">{String(item.n).padStart(2, "0")}</span>
              <span>Financial value</span>
            </div>
            <h1 className="mt-4 font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3rem]">{item.title}</h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-white/65">{item.lead}</p>

            {item.list && (
              <div className="mt-10">
                {item.listTitle && <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">{item.listTitle}</div>}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {item.list.map((p) => (
                    <div key={p} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[14px] text-white/80">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400/70" aria-hidden /> {p}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-9 space-y-4">
              {item.body.map((p, i) => (
                <p key={i} className="max-w-2xl text-[15.5px] leading-relaxed text-white/70">{p}</p>
              ))}
            </div>

            {item.caveat && (
              <p className="mt-7 max-w-2xl border-l-2 border-white/15 pl-4 text-[13px] leading-relaxed text-white/40">{item.caveat}</p>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button onClick={() => nav("/console")}
                className="group inline-flex items-center gap-2.5 rounded bg-gradient-to-b from-gold-300 to-gold-600 px-6 py-3 text-[13px] font-bold uppercase tracking-wide text-[#1c1407] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition active:translate-y-px hover:from-gold-200 hover:to-gold-500">
                Launch Dispatch <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
              <button onClick={() => nav("/")}
                className="inline-flex items-center rounded border border-white/15 bg-white/[0.02] px-6 py-3 text-[13px] font-semibold uppercase tracking-wide text-white/85 transition hover:border-white/35 hover:bg-white/[0.06]">
                Back to overview
              </button>
            </div>
          </div>
        </section>

        {/* the other six */}
        <section className="border-t border-white/[0.06] px-8 py-16 lg:px-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">The other ways Dispatch creates value</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((v) => (
                <button key={v.slug} onClick={() => nav(`${VALUE_BASE}/${v.slug}`)}
                  className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/30 hover:bg-white/[0.03]">
                  <div className="font-mono text-[12px] text-gold-400/70">{String(v.n).padStart(2, "0")}</div>
                  <div className="mt-1.5 font-serif text-[1.15rem] font-bold text-white">{v.title}</div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">{v.teaser}</p>
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

export default ValuePage;
