import React from "react";
import { useI18n } from "../lib/i18n";
import { Note } from "./SourceNotes";

// THE LIFECYCLE BAND — the original acquisition lifecycle rail (owner, DD6),
// set as the close of the board's ink chapter (DD7, EE11): a serif heading, eight
// stations on one rail from signal to closing with their typical week, and the
// travelling light. The light runs only when motion is allowed. A vertical
// route on phones. Weeks are the typical timeline of note 6, not live data.

const LIFECYCLE: ReadonlyArray<readonly [string, string]> = [["lc.signal", "day 0"], ["lc.discovery", "wk 1"], ["lc.nda", "wk 1–2"], ["lc.cim", "wk 2"], ["lc.meetings", "wk 2–3"], ["lc.loi", "wk 4–6"], ["lc.diligence", "wk 6–9"], ["lc.closing", "wk 10+"]];
const WRAP = "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12";

const LifecycleBand: React.FC = () => {
  const { t } = useI18n();
  const [eyebrow, heading = ""] = t("lifecycle.title").split(" · ");
  const last = LIFECYCLE.length - 1;
  return (
    <section data-ink aria-labelledby="lc-h" className="relative isolate overflow-hidden text-white" style={{ background: "linear-gradient(180deg, var(--ex-0) 0%, var(--ex-1) 55%, var(--ex-0) 100%)" }}>
      {/* the board and the band are one ink chapter (EE11): the board's floor runs on into the band, marked
          only by a short centred rule with a node, the instrument's own punctuation */}
      <div aria-hidden className="absolute left-1/2 top-0 flex -translate-x-1/2 items-center gap-3">
        <span className="h-px w-24 bg-gradient-to-r from-transparent to-[#C9B08A]/40" />
        <span className="h-1.5 w-1.5 rotate-45 border border-[#C9B08A]/50" />
        <span className="h-px w-24 bg-gradient-to-l from-transparent to-[#C9B08A]/40" />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "repeating-linear-gradient(90deg, #a0bee6 0 1px, transparent 1px 120px)", maskImage: "radial-gradient(ellipse 60% 80% at 50% 60%, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse 60% 80% at 50% 60%, #000, transparent 75%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse 55% 60% at 50% 72%, rgba(180,154,117,0.16), transparent 70%)" }} />

      <div className={`${WRAP} relative py-16 lg:py-20`}>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div>
            <div className="flex items-center gap-3 font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C9B08A]"><span aria-hidden className="h-px w-7 bg-[#C9B08A]/70" />{eyebrow}</div>
            <h2 id="lc-h" className="mt-4 font-editorial text-[clamp(1.9rem,3.4vw,3rem)] font-semibold leading-[1.02] tracking-[-0.03em] first-letter:uppercase">{heading || eyebrow}</h2>
          </div>
          <p className="flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]" />{t("lifecycle.live")}<Note n={6} dark />
          </p>
        </div>

        <div className="relative mt-12 lg:mt-16">
          {/* the rail, from the first station's centre to the last */}
          <div aria-hidden className="absolute bottom-6 left-[17px] top-4 w-px lg:bottom-auto lg:left-[6.25%] lg:right-[6.25%] lg:top-[18px] lg:h-px lg:w-auto"
            style={{ background: "linear-gradient(var(--lc-dir,180deg), rgba(201,176,138,0.15), rgba(201,176,138,0.6) 55%, rgba(110,231,183,0.7))" }} />
          <div aria-hidden className="pointer-events-none absolute left-[6.25%] right-[6.25%] top-[18px] hidden lg:block">
            <span className="lc-travel absolute -top-px block h-[3px] w-20 -translate-x-full rounded-full" style={{ background: "linear-gradient(90deg, transparent, rgba(124,255,159,0.9))" }}>
              <span className="absolute -right-1 -top-[3px] h-2.5 w-2.5 rounded-full" style={{ background: "#7CFF9F", boxShadow: "0 0 10px 3px rgba(124,255,159,.75)" }} />
            </span>
          </div>
          <ol className="relative grid gap-7 lg:grid-cols-8 lg:gap-0">
            {LIFECYCLE.map(([s, w], i) => (
              <li key={s} className="group flex items-center gap-5 lg:flex-col lg:gap-0 lg:text-center">
                <span aria-hidden className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ring-1 transition duration-300 group-hover:scale-110 ${i === last ? "bg-[#06261f] text-emerald-200 ring-emerald-300/70 shadow-[0_0_0_6px_rgba(16,185,129,0.08),0_0_24px_rgba(52,211,153,0.35)]" : "bg-ex-1 text-[#E8E0D2] ring-blue-300/40 shadow-[0_0_0_6px_rgba(180,154,117,0.07)] group-hover:ring-blue-200"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="lg:mt-5 lg:px-2">
                  <span className="block font-editorial text-[16px] font-semibold leading-snug text-white lg:text-[15px]">{t(s)}</span>
                  <span className={`mt-1 block font-mono text-[10px] uppercase tracking-[0.16em] ${i === last ? "text-emerald-300/85" : "text-[#C9B08A]/75"}`}>{w}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <style>{`
        @media (min-width:1024px){[aria-labelledby="lc-h"]{--lc-dir:90deg}}
        @keyframes lcTravel{0%{left:0;opacity:0}6%{opacity:1}94%{opacity:1}100%{left:100%;opacity:0}}
        .lc-travel{left:0;opacity:0}
        @media (prefers-reduced-motion: no-preference){.lc-travel{animation:lcTravel 7s linear infinite}}
      `}</style>
    </section>
  );
};

export default LifecycleBand;
