import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { PublicHeader, PublicFooter, FilmGrain, Chevron, useReveal } from "../components/brand";
import { LEARN_ROUTE, LIBRARY_ROUTE, INDUSTRIES_ROUTE, VERIFY_ROUTE } from "../lib/routes";
import { track } from "../lib/analytics";

// A branded 404. The catch-all used to redirect silently to the homepage,
// which hides the broken link and strands the visitor with no explanation.
// This page names what happened and routes them to the four places a lost
// visitor most often wants — the knowledge hub, the library, industries, and
// record verification.
const DESTS: { label: string; sub: string; route: string }[] = [
  { label: "Knowledge", sub: "Concepts behind governed publication", route: LEARN_ROUTE },
  { label: "Library", sub: "In-depth guides and references", route: LIBRARY_ROUTE },
  { label: "Industries", sub: "Who Sovereign Dispatch is built for", route: INDUSTRIES_ROUTE },
  { label: "Verify a record", sub: "Confirm an Official Record is genuine", route: VERIFY_ROUTE },
];

const NotFound: React.FC = () => {
  const nav = useNavigate();
  const { pathname } = useLocation();
  useReveal();
  React.useEffect(() => {
    track("page.not_found", { path: pathname });
    // Own the title and signal noindex — a 404 should never be indexed, and the
    // SPA's shared RouteMeta only knows mapped routes. Cleaned up on unmount so
    // a subsequent real route is indexable again.
    const prev = document.title;
    document.title = "Page not found — Sovereign Dispatch";
    let robots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const created = !robots;
    if (!robots) { robots = document.createElement("meta"); robots.setAttribute("name", "robots"); document.head.appendChild(robots); }
    const prevContent = robots.getAttribute("content");
    robots.setAttribute("content", "noindex, follow");
    return () => {
      document.title = prev;
      if (created) robots?.remove();
      else if (prevContent != null) robots?.setAttribute("content", prevContent);
    };
  }, [pathname]);

  return (
    <div className="relative min-h-full bg-[#070707] text-white">
      <FilmGrain />
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-28 lg:px-12">
          <div className="pointer-events-none absolute inset-0 opacity-[0.5]" aria-hidden style={{ background: "radial-gradient(55% 60% at 70% 25%, rgba(212,178,90,0.10), transparent 70%)" }} />
          <div className="relative mx-auto max-w-[1000px]">
            <div className="flex items-center gap-3"><span className="h-px w-7 bg-gold-500/55" aria-hidden /><span className="text-[12px] font-semibold uppercase tracking-[0.3em] text-gold-400">404 · Page not found</span></div>
            <h1 className="mt-5 max-w-2xl font-serif text-[2.4rem] font-bold leading-[1.08] tracking-tight text-[#f4efe3] sm:text-[3.1rem]">This record isn't here.</h1>
            <p className="mt-6 max-w-2xl text-[16.5px] leading-relaxed text-white/65">
              The page you followed has moved or never existed. Nothing was lost — every published Official Record keeps a
              permanent address. Here is where most people are heading.
            </p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {DESTS.map((d) => (
                <button key={d.route} onClick={() => nav(d.route)}
                  className="reveal group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 text-left transition duration-300 hover:-translate-y-0.5 hover:border-gold-400/25">
                  <span>
                    <span className="block font-serif text-[1.2rem] font-bold text-white">{d.label}</span>
                    <span className="mt-1 block text-[13.5px] text-white/55">{d.sub}</span>
                  </span>
                  <Chevron className="h-4 w-4 shrink-0 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-gold-400" />
                </button>
              ))}
            </div>

            <div className="mt-10">
              <button onClick={() => nav("/")} className="group inline-flex items-center gap-2 text-[13.5px] font-semibold uppercase tracking-wide text-gold-300 transition hover:text-gold-200">
                Return to the homepage <Chevron className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};

export default NotFound;
