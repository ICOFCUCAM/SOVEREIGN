import React, { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";

// The chapter index: a slim rail at the left edge on wide screens. The chapter
// in view is marked; each number jumps to its chapter, and its name shows on
// hover or focus. Reads the sections by id (ch-01 … ch-09).

const CHAPTERS: ReadonlyArray<[string, string]> = [
  ["01", "hx.eyebrow"], ["02", "s2.kicker"], ["03", "hall.eyebrow"], ["04", "qv.eyebrow"], ["05", "loss.eyebrow"],
  ["06", "rec.eyebrow"], ["07", "mods.eyebrow"], ["08", "faq.eyebrow"], ["09", "cta.eyebrow"],
];

const ChapterRail: React.FC = () => {
  const { t } = useI18n();
  const [active, setActive] = useState("01");
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) setActive(e.target.id.slice(3));
    }, { rootMargin: "-45% 0px -50% 0px" });
    for (const [n] of CHAPTERS) { const el = document.getElementById(`ch-${n}`); if (el) io.observe(el); }
    return () => io.disconnect();
  }, []);
  // reading progress through the page, for the bar at the top and the rail's line
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const read = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const h = document.documentElement; setProgress(Math.min(1, h.scrollTop / Math.max(1, h.scrollHeight - innerHeight))); }); };
    read(); addEventListener("scroll", read, { passive: true }); addEventListener("resize", read);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", read); removeEventListener("resize", read); };
  }, []);
  return (
    <>
      {/* reading progress across the top of the window */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent">
        <div className="h-full origin-left bg-ex-bronze" style={{ transform: `scaleX(${progress})` }} />
      </div>
      <nav aria-label="Chapters" className="fixed left-1 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
        <div className="relative rounded-ex-sm border border-white/15 bg-[#1C1D1B]/95 p-1 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.55)] backdrop-blur">
          {/* the line the chapters hang on, filled as you read */}
          <span aria-hidden className="absolute bottom-3 left-1/2 top-3 w-px -translate-x-1/2 bg-white/15" />
          <span aria-hidden className="absolute left-1/2 top-3 w-px -translate-x-1/2 bg-ex-bronze/70" style={{ height: `calc((100% - 1.5rem) * ${progress})` }} />
          <ol className="relative flex flex-col gap-1">
            {CHAPTERS.map(([n, key]) => (
              <li key={n} className="group relative">
                <a href={`#ch-${n}`} aria-current={active === n ? "true" : undefined} aria-label={`${n} · ${t(key)}`}
                  className={`grid h-7 w-8 place-items-center rounded-ex-xs font-mono text-[11px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${active === n ? "bg-ex-bronze text-[#15171A] shadow-[0_0_0_3px_rgba(180,154,117,0.3)]" : "bg-[#1C1D1B] text-[#E8E0D2]/75 hover:text-white"}`}>{n}</a>
                <span aria-hidden className={`pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-ex-xs bg-[#1C1D1B] px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white shadow-lg transition-opacity ${"opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}>{t(key)}</span>
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
};

export default ChapterRail;
