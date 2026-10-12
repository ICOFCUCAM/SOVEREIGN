import React, { useEffect, useState } from "react";
import { useI18n } from "../lib/i18n";

// The chapter index: a slim rail at the left edge on wide screens. The chapter
// in view is marked; each number jumps to its chapter, and its name shows on
// hover or focus. Reads the sections by id (ch-01 … ch-08).

const CHAPTERS: ReadonlyArray<[string, string]> = [
  ["01", "hero.eyebrow"], ["02", "hall.eyebrow"], ["03", "qv.eyebrow"], ["04", "loss.eyebrow"],
  ["05", "rec.eyebrow"], ["06", "mods.eyebrow"], ["07", "faq.eyebrow"], ["08", "cta.eyebrow"],
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
  return (
    <nav aria-label="Chapters" className="fixed left-1 top-1/2 z-30 hidden -translate-y-1/2 lg:block">
      <ol className="flex flex-col gap-0.5 rounded-[3px] border border-slate-300/70 bg-white/85 p-0.5 shadow-[0_6px_20px_-8px_rgba(0,0,0,0.35)] backdrop-blur">
        {CHAPTERS.map(([n, key]) => (
          <li key={n} className="group relative">
            <a href={`#ch-${n}`} aria-current={active === n ? "true" : undefined} aria-label={`${n} · ${t(key)}`}
              className={`grid h-6 w-6 place-items-center rounded-[2px] font-mono text-[10px] font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${active === n ? "bg-ink-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-ink-900"}`}>{n}</a>
            <span aria-hidden className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-[2px] bg-ink-900 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{t(key)}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default ChapterRail;
