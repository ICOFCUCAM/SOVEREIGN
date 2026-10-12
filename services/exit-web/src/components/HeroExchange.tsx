import React from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { Arrow, BUTTON } from "./MarketingChrome";

// 01 · THE HERO (owner brief, HX1). Two panels with one deliberate seam: a
// porcelain editorial page on the left and a navy instrument field on the
// right, lit from the seam. The right panel carries one visual idea — the
// acquisition aperture: a graduated dial, three rings, a slow sweep, and five
// opportunity points that light as the sweep passes them. Decorative only:
// the points are not data. The sweep and the lighting stop under reduced
// motion; the instrument reads the same standing still. Phones stack the two
// panels, the instrument smaller beneath the message.

const C = 200; // the dial's centre in its 400-unit view box
const polar = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)];
};
const TICKS = Array.from({ length: 120 }, (_, i) => i * 3);
const NODES: ReadonlyArray<readonly [number, number]> = [[34, 140], [116, 96], [203, 140], [258, 52], [316, 96]];
const SWEEP_S = 16;
const WEDGE = 48;
const [tx, ty] = polar(-WEDGE, 184);

const Aperture: React.FC = () => (
  <svg viewBox="0 0 400 400" className="h-full w-full overflow-visible" fill="none" aria-hidden>
    <defs>
      <linearGradient id="hx-wedge" gradientUnits="userSpaceOnUse" x1={tx} y1={ty} x2={C} y2={16}>
        <stop offset="0" stopColor="#326BFA" stopOpacity="0" />
        <stop offset="1" stopColor="#326BFA" stopOpacity="0.28" />
      </linearGradient>
      <linearGradient id="hx-axis-h" gradientUnits="userSpaceOnUse" x1="-420" y1="0" x2="820" y2="0">
        <stop offset="0" stopColor="#91BFFF" stopOpacity="0" />
        <stop offset=".5" stopColor="#91BFFF" stopOpacity=".16" />
        <stop offset="1" stopColor="#91BFFF" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="hx-axis-v" gradientUnits="userSpaceOnUse" x1="0" y1="-320" x2="0" y2="720">
        <stop offset="0" stopColor="#91BFFF" stopOpacity="0" />
        <stop offset=".5" stopColor="#91BFFF" stopOpacity=".16" />
        <stop offset="1" stopColor="#91BFFF" stopOpacity="0" />
      </linearGradient>
      <radialGradient id="hx-core">
        <stop offset="0" stopColor="#326BFA" stopOpacity=".55" />
        <stop offset="1" stopColor="#326BFA" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* the coordinate axes, run out to the panel's edges */}
    <line x1="-420" y1={C} x2="820" y2={C} stroke="url(#hx-axis-h)" strokeWidth="0.75" />
    <line x1={C} y1="-320" x2={C} y2="720" stroke="url(#hx-axis-v)" strokeWidth="0.75" />

    {/* the graduated dial: every 3°, a longer mark every 30° */}
    <circle cx={C} cy={C} r="190" stroke="#91BFFF" strokeOpacity=".12" strokeWidth=".75" />
    <g stroke="#91BFFF" strokeLinecap="round">
      {TICKS.map((d) => {
        const major = d % 30 === 0;
        const [x1, y1] = polar(d, major ? 170 : 178);
        const [x2, y2] = polar(d, 184);
        return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={major ? 0.5 : 0.18} strokeWidth={major ? 1 : 0.6} />;
      })}
    </g>
    <g fill="#91BFFF" fillOpacity=".5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="8" letterSpacing="1.5" textAnchor="middle">
      {([[0, "000"], [90, "090"], [180, "180"], [270, "270"]] as const).map(([d, l]) => {
        const [x, y] = polar(d, 157);
        return <text key={d} x={x} y={y + 3}>{l}</text>;
      })}
    </g>

    {/* the rings */}
    <circle cx={C} cy={C} r="140" stroke="#91BFFF" strokeOpacity=".22" strokeWidth=".9" />
    <circle cx={C} cy={C} r="96" stroke="#91BFFF" strokeOpacity=".16" strokeWidth=".75" strokeDasharray="1 5" />
    <circle cx={C} cy={C} r="52" stroke="#91BFFF" strokeOpacity=".3" strokeWidth=".9" />

    {/* the sweep */}
    <g className="hx-sweep">
      <path d={`M${C} ${C} L${tx} ${ty} A184 184 0 0 1 ${C} 16 Z`} fill="url(#hx-wedge)" />
      <line x1={C} y1={C} x2={C} y2="16" stroke="#91BFFF" strokeOpacity=".6" strokeWidth=".9" />
    </g>

    {/* the reticle's inner marks */}
    <g stroke="#91BFFF" strokeOpacity=".45" strokeWidth=".9" strokeLinecap="round">
      <line x1={C} y1="62" x2={C} y2="128" /><line x1={C} y1="272" x2={C} y2="338" />
      <line x1="62" y1={C} x2="128" y2={C} /><line x1="272" y1={C} x2="338" y2={C} />
    </g>

    {/* five opportunity points, each lit as the sweep passes it */}
    {NODES.map(([d, r]) => {
      const [x, y] = polar(d, r);
      return (
        <g key={d} className="hx-node" style={{ animationDelay: `${(d / 360) * SWEEP_S}s` }}>
          <circle cx={x} cy={y} r="8" stroke="#91BFFF" strokeOpacity=".35" strokeWidth=".75" />
          <circle cx={x} cy={y} r="2.6" fill="#91BFFF" />
        </g>
      );
    })}

    {/* the aperture's core */}
    <circle cx={C} cy={C} r="30" fill="url(#hx-core)" />
    <circle cx={C} cy={C} r="13" stroke="#91BFFF" strokeOpacity=".55" strokeWidth=".9" />
    <circle cx={C} cy={C} r="4.5" fill="#F4F6FA" />
  </svg>
);

// line icons for the capability rail: one stroke weight, one grid
const ICONS: ReadonlyArray<React.ReactNode> = [
  <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
  <><circle cx="12" cy="6.5" r="2.5" /><circle cx="5.5" cy="17.5" r="2.5" /><circle cx="18.5" cy="17.5" r="2.5" /><path d="M10.8 8.7 6.8 15.3M13.2 8.7l4 6.6M8 17.5h8" /></>,
  <><path d="M5 3.5h10l4 4v13H5z" /><path d="M8.5 13.2 11 15.7l4.5-5" /></>,
  <><path d="M4 5h16v14H4z" /><path d="M7.5 9h9M7.5 12h9M7.5 15h5" /></>,
  <><path d="M6 21V3.5" /><path d="M6 4.5h12l-3 4 3 4H6" /></>,
];

const WRAP = "mx-auto w-full max-w-[1480px] px-5 sm:px-8 lg:px-12";

const HeroExchange: React.FC = () => {
  const nav = useNavigate();
  const { t } = useI18n();
  return (
    <section id="ch-01" aria-labelledby="hx-h" className="relative isolate flex flex-col overflow-hidden bg-ex-porcelain lg:min-h-[min(880px,calc(100svh-72px))]">
      <div className="relative grid flex-1 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,1fr)]">
        {/* the editorial panel */}
        <div className="relative flex items-center" style={{ background: "radial-gradient(ellipse 70% 60% at 0% 0%, #ffffff, transparent 70%), var(--hx-porcelain)" }}>
          <div className="w-full px-5 py-12 sm:px-8 sm:py-20 lg:py-16 lg:pl-[max(3rem,calc((100vw-1480px)/2+3rem))] lg:pr-[clamp(2rem,4vw,4.5rem)]">
            <p className="flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.28em] text-ink-900">
              <span aria-hidden className="h-px w-8 bg-ex-signal" />{t("hx.eyebrow")}
            </p>
            <h1 id="hx-h" className="mt-7 max-w-[9.6em] font-editorial text-[clamp(2.7rem,4.3vw,4.85rem)] font-semibold leading-[1] tracking-[-0.038em] text-ink-900 [font-feature-settings:'kern','liga','calt'] [font-kerning:normal] [text-wrap:balance] lg:-ml-[0.04em]">
              {t("hx.h1")}{" "}
              <em className="mt-[0.06em] block italic tracking-[-0.03em] text-ex-signal">{t("hx.h1em")}</em>
            </h1>
            <p className="mt-7 max-w-[36rem] text-[16px] leading-[1.75] text-ex-slate-ink">{t("hx.body")}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <button onClick={() => nav("/platform")} className={`${BUTTON.primary} px-6 py-4 text-[13px]`}>{t("hx.explore")} <Arrow /></button>
              <a href="#ch-04" className="group inline-flex items-center gap-3 border-b border-ink-900/25 pb-1.5 text-[13px] font-semibold text-ink-900 transition-colors duration-300 hover:border-ex-signal hover:text-ex-signal motion-reduce:transition-none">
                {t("bar.value")} <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5 motion-reduce:transition-none">↓</span>
              </a>
            </div>
          </div>
        </div>

        {/* the instrument panel, lit from the seam */}
        <div aria-hidden className="relative flex min-h-[320px] items-center justify-center overflow-hidden py-10 text-white sm:min-h-[440px] sm:py-12 lg:min-h-0 lg:py-16"
          style={{ background: "radial-gradient(ellipse 62% 52% at 50% 44%, rgba(50,107,250,0.15), transparent 72%), linear-gradient(160deg, var(--hx-navy) 0%, #0c2142 38%, var(--hx-midnight) 100%)" }}>
          {/* the seam: a hairline of light and the porcelain's last glow, no grey wash */}
          <span className="absolute inset-x-0 top-0 h-px lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-px" style={{ background: "linear-gradient(var(--hx-seam-dir,90deg), transparent, rgba(145,191,255,0.45) 25%, rgba(145,191,255,0.45) 75%, transparent)" }} />
          <span className="absolute inset-x-0 top-0 h-16 lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-28" style={{ background: "linear-gradient(var(--hx-bloom-dir,180deg), rgba(244,246,250,0.07), transparent)" }} />
          {/* a fine coordinate field gathered around the instrument */}
          <span className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(90deg, #91BFFF 0 1px, transparent 1px 64px), repeating-linear-gradient(0deg, #91BFFF 0 1px, transparent 1px 64px)", maskImage: "radial-gradient(ellipse 55% 55% at 50% 46%, #000, transparent 75%)", WebkitMaskImage: "radial-gradient(ellipse 55% 55% at 50% 46%, #000, transparent 75%)" }} />

          <div className="hx-mark relative flex flex-col items-center">
            <div className="h-[min(64vw,260px)] w-[min(64vw,260px)] sm:h-[340px] sm:w-[340px] lg:h-[min(28vw,430px)] lg:w-[min(28vw,430px)]"><Aperture /></div>
            <div className="mt-6 font-editorial font-semibold leading-none tracking-[-0.045em] text-transparent sm:mt-8"
              style={{ fontSize: "clamp(2.4rem, 4.4vw, 4.25rem)", backgroundImage: "linear-gradient(180deg, rgba(244,246,250,0.62), rgba(145,191,255,0.28))", WebkitBackgroundClip: "text", backgroundClip: "text" }}>
              Exit<span className="italic">OS</span>
            </div>
            <div className="mt-3 flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-[0.38em] text-ex-ice/55">
              <span className="h-px w-7 bg-ex-ice/30" />The acquisition exchange<span className="h-px w-7 bg-ex-ice/30" />
            </div>
          </div>

          {/* the vertical note, clear of the page's signature line */}
          <div className="absolute bottom-14 right-[84px] hidden xl:block">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-ex-ice/60" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t("hx.note")}</span>
          </div>
        </div>
      </div>

      {/* the capability rail: the bridge into chapter 02 */}
      <div className="relative bg-ex-midnight text-white">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg, rgba(145,191,255,0.08), rgba(145,191,255,0.4) 50%, rgba(145,191,255,0.08))" }} />
        <ul aria-label={t("hx.strip")} className={`${WRAP} grid lg:grid-cols-5`}>
          {[1, 2, 3, 4, 5].map((k, i) => (
            <li key={k} className={`group relative flex items-center gap-3.5 py-3.5 lg:items-start lg:py-7 lg:pr-4 ${i ? "border-t border-white/[0.08] lg:border-l lg:border-t-0 lg:pl-6" : "lg:pl-0"}`}>
              <span aria-hidden className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-ex-signal transition-transform duration-500 group-hover:scale-x-100 motion-reduce:transition-none" />
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-ex-ice lg:mt-0.5" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round">{ICONS[i]}</svg>
              <span className="flex min-w-0 items-baseline gap-3 lg:block">
                <span className="font-mono text-[10px] font-semibold tracking-[0.18em] text-ex-ice/80 lg:block">{String(k).padStart(2, "0")}</span>
                <span className="block font-editorial text-[15.5px] font-semibold leading-snug lg:mt-1.5 lg:text-[14.5px] min-[1360px]:text-[15.5px]">{t(`hx.s${k}`)}</span>
                <span className="sr-only max-w-[24ch] text-[12.5px] leading-relaxed text-[#a9b8d0] min-[1360px]:not-sr-only min-[1360px]:mt-1.5 min-[1360px]:block">{t(`hx.s${k}d`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        @media (min-width:1024px){#ch-01{--hx-seam-dir:180deg;--hx-bloom-dir:90deg}}
        .hx-sweep{transform-box:view-box;transform-origin:200px 200px;opacity:0}
        .hx-node{opacity:.55}
        @media (prefers-reduced-motion: no-preference){
          .hx-mark{animation:hxMark 1.8s cubic-bezier(.2,.7,.2,1) .2s both}
          .hx-sweep{opacity:1;animation:hxSweep ${SWEEP_S}s linear infinite}
          .hx-node{animation:hxNode ${SWEEP_S}s ease-out infinite}
        }
        @keyframes hxMark{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}
        @keyframes hxSweep{to{transform:rotate(360deg)}}
        @keyframes hxNode{0%{opacity:1}14%{opacity:.5}100%{opacity:.5}}
      `}</style>
    </section>
  );
};

export default HeroExchange;
