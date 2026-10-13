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
  // the chapter in view is the last one whose top has passed the middle of the window — read from positions
  // on scroll (once a frame at most), so a jump of any length (a link, Home/End, the scrollbar) marks the right
  // chapter; React re-renders only when the chapter changes
  useEffect(() => {
    let raf = 0;
    const read = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => {
      let cur = "01";
      for (const [n] of CHAPTERS) { const el = document.getElementById(`ch-${n}`); if (el && el.getBoundingClientRect().top <= innerHeight * 0.5) cur = n; }
      setActive(cur);
    }); };
    read(); addEventListener("scroll", read, { passive: true }); addEventListener("resize", read);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", read); removeEventListener("resize", read); };
  }, []);
  // reading progress through the page, for the bar at the top and the rail's line: written to a CSS variable
  // on the root (no re-render while scrolling)
  useEffect(() => {
    let raf = 0;
    const root = document.documentElement;
    const read = (): void => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => root.style.setProperty("--ex-read", Math.min(1, root.scrollTop / Math.max(1, root.scrollHeight - innerHeight)).toFixed(4))); };
    read(); addEventListener("scroll", read, { passive: true }); addEventListener("resize", read);
    return () => { cancelAnimationFrame(raf); removeEventListener("scroll", read); removeEventListener("resize", read); root.style.removeProperty("--ex-read"); };
  }, []);
  return (
    <>
      {/* reading progress across the top of the window */}
      <div aria-hidden className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent">
        <div className="h-full origin-left bg-ex-bronze" style={{ transform: "scaleX(var(--ex-read, 0))" }} />
      </div>
      <nav aria-label="Chapters" className="fixed left-1.5 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
        <div className="relative rounded-ex-sm border border-white/10 bg-[#1C1D1B]/90 p-[3px] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] backdrop-blur">
          {/* the line the chapters hang on, filled as you read */}
          <span aria-hidden className="absolute bottom-3 left-1/2 top-3 w-px -translate-x-1/2 bg-white/15" />
          <span aria-hidden className="absolute bottom-3 left-1/2 top-3 w-px -translate-x-1/2 origin-top bg-ex-bronze/70" style={{ transform: "scaleY(var(--ex-read, 0))" }} />
          <ol className="relative flex flex-col gap-[3px]">
            {CHAPTERS.map(([n, key]) => (
              <li key={n} className="group relative">
                <a href={`#ch-${n}`} aria-current={active === n ? "true" : undefined} aria-label={`${n} · ${t(key)}`}
                  className={`grid h-[26px] w-[26px] place-items-center rounded-ex-xs font-mono text-[10px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${active === n ? "bg-ex-bronze text-[#15171A] shadow-[0_0_0_3px_rgba(180,154,117,0.3)]" : "bg-[#1C1D1B] text-[#E8E0D2]/75 hover:text-white"}`}>{n}</a>
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
