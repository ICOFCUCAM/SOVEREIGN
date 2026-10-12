import React from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { polar } from "../lib/insignia";
import { Arrow } from "./MarketingChrome";

// 01 · THE HERO (owner brief HX1; final colour, signature and benchmark HX2).
// Built to the owner's benchmark image: warm porcelain on the left falling
// through neutral warm greys into mineral graphite on the right, with no
// seam; the ExitOS insignia opened into a full instrument — dotted bezel,
// graduated ring, market rings, a lit aperture wedge, registration orbs and
// the ice-white transaction node — centred at three-quarters across; the
// ivory wordmark beneath it; a charcoal capability rail with bronze-ringed
// icons. Geometry is measured from the benchmark (outer bezel = 245 units).
// The orbs and points are decoration, not data. Phones stack the two halves.

const C = 250; // the dial's centre in a 500-unit view box; bezel radius 245
const P = (deg: number, r: number): [number, number] => polar(deg, r, C);
const RING = "#C8B48F", BR = "#B49A75";

const Orb: React.FC<{ at: [number, number]; s?: number }> = ({ at: [x, y], s = 1 }) => (
  <g>
    <circle cx={x} cy={y} r={26 * s} fill="url(#hx-orb)" />
    <circle cx={x} cy={y} r={4 * s} fill="#FFF8EC" />
  </g>
);
const Dot: React.FC<{ at: [number, number]; r?: number }> = ({ at: [x, y], r = 2.5 }) => (
  <g><circle cx={x} cy={y} r={r * 3.5} fill="#FFFFFF" fillOpacity=".16" /><circle cx={x} cy={y} r={r * 1.2} fill="#F6F4F2" /></g>
);
const arc = (r: number, a: number, b: number): string => {
  const [x1, y1] = P(a, r), [x2, y2] = P(b, r);
  return `M${x1} ${y1}A${r} ${r} 0 0 1 ${x2} ${y2}`;
};

const Dial: React.FC = () => {
  const [w1x, w1y] = P(28, 212), [w2x, w2y] = P(64, 212);
  const [mx, my] = P(46, 212);
  return (
    <svg viewBox="0 0 500 500" className="h-full w-full overflow-visible" fill="none" aria-hidden>
      <defs>
        <radialGradient id="hx-orb"><stop offset="0" stopColor="#F8EAD0" stopOpacity="1" /><stop offset=".3" stopColor="#C9AE82" stopOpacity=".55" /><stop offset="1" stopColor={BR} stopOpacity="0" /></radialGradient>
        <radialGradient id="hx-halo"><stop offset="0" stopColor="#6E8796" stopOpacity=".75" /><stop offset=".7" stopColor="#4C5F6D" stopOpacity=".45" /><stop offset="1" stopColor="#4C5F6D" stopOpacity="0" /></radialGradient>
        <radialGradient id="hx-glow"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".7" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
        <linearGradient id="hx-wedge" gradientUnits="userSpaceOnUse" x1={C} y1={C} x2={mx} y2={my}>
          <stop offset="0" stopColor="#EADBBF" stopOpacity=".08" /><stop offset=".55" stopColor="#EADBBF" stopOpacity=".24" /><stop offset="1" stopColor="#EADBBF" stopOpacity=".5" />
        </linearGradient>
        <filter id="hx-bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
        <filter id="hx-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="hx-axis" gradientUnits="userSpaceOnUse" x1="-560" y1="0" x2="1100" y2="0">
          <stop offset="0" stopColor={RING} stopOpacity="0" /><stop offset=".3" stopColor={RING} stopOpacity=".42" /><stop offset="1" stopColor={RING} stopOpacity=".42" />
        </linearGradient>
        <linearGradient id="hx-arc" gradientUnits="userSpaceOnUse" x1="-200" y1="700" x2="250" y2="250">
          <stop offset="0" stopColor="#EADBC0" stopOpacity="0" /><stop offset=".5" stopColor="#EADBC0" stopOpacity=".85" /><stop offset="1" stopColor="#EADBC0" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* far field: the long orbits at lower left, two faint rays */}
      <path d={arc(372, 202, 254)} stroke="url(#hx-arc)" strokeWidth="3" filter="url(#hx-bloom)" />
      <path d={arc(372, 202, 254)} stroke="url(#hx-arc)" strokeWidth="1.3" />
      <path d={arc(394, 210, 248)} stroke="url(#hx-arc)" strokeOpacity=".6" strokeWidth=".8" />
      <Orb at={P(223, 372)} s={0.75} />
      <line x1="-460" y1="300" x2="70" y2="70" stroke="#E3D3B6" strokeOpacity=".12" strokeWidth=".8" />
      <line x1="-520" y1="250" x2="-30" y2="-40" stroke="#E3D3B6" strokeOpacity=".08" strokeWidth=".7" />
      {([[-150, 40, 1.2], [-60, 470, 1], [520, 120, 1.1], [470, 430, 1], [30, -10, 0.9]] as const).map(([x, y, r]) => <circle key={`${x}${y}`} cx={x} cy={y} r={r} fill="#F2EBDD" fillOpacity=".55" />)}

      {/* axes across the field, brighter inside the dial */}
      <line x1="-560" y1={C} x2="1100" y2={C} stroke="url(#hx-axis)" strokeWidth=".7" />
      <line x1={C} y1="-400" x2={C} y2="900" stroke={RING} strokeOpacity=".4" strokeWidth=".8" />
      <line x1={C - 207} y1={C} x2={C + 207} y2={C} stroke={RING} strokeOpacity=".7" strokeWidth="1" />
      <line x1={C} y1={C - 207} x2={C} y2={C + 207} stroke={RING} strokeOpacity=".7" strokeWidth="1" />
      <g stroke={RING} strokeOpacity=".16" strokeWidth=".7">
        {[45, 135, 225, 315].map((d) => { const [a, b] = P(d, 59), [c, e] = P(d, 207); return <line key={d} x1={a} y1={b} x2={c} y2={e} />; })}
      </g>

      {/* bezel and graduated ring */}
      <circle cx={C} cy={C} r="245" stroke="#E2D6BF" strokeOpacity=".8" strokeWidth="1.7" strokeDasharray="0.1 4.2" strokeLinecap="round" />
      <g stroke="#D9CCB4" strokeLinecap="round">
        {Array.from({ length: 180 }, (_, i) => i * 2).map((d) => {
          const major = d % 10 === 0;
          const [x1, y1] = P(d, major ? 217 : 221), [x2, y2] = P(d, major ? 231 : 228);
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={major ? 0.7 : 0.36} strokeWidth={major ? 1.1 : 0.8} />;
        })}
      </g>

      {/* market rings */}
      <circle cx={C} cy={C} r="207" stroke={RING} strokeOpacity=".55" strokeWidth="1.1" />
      <circle cx={C} cy={C} r="160" stroke="#C9B08A" strokeOpacity=".95" strokeWidth="1.4" />
      <circle cx={C} cy={C} r="110" stroke={RING} strokeOpacity=".7" strokeWidth="1.5" strokeDasharray="0.1 4.5" strokeLinecap="round" />
      <circle cx={C} cy={C} r="80" stroke={RING} strokeOpacity=".4" strokeWidth="1.2" strokeDasharray="0.1 5" strokeLinecap="round" />
      <circle cx={C} cy={C} r="59" stroke="#D2BA92" strokeOpacity="1" strokeWidth="1.6" />

      {/* the aperture: a lit wedge, its leading edge bright */}
      <path d={`M${C} ${C} L${w1x} ${w1y} A212 212 0 0 1 ${w2x} ${w2y} Z`} fill="url(#hx-wedge)" filter="url(#hx-bloom)" />
      <path d={`M${C} ${C} L${w1x} ${w1y} A212 212 0 0 1 ${w2x} ${w2y} Z`} fill="url(#hx-wedge)" />
      <line x1={C} y1={C} x2={w1x} y2={w1y} stroke="#EFE2C9" strokeOpacity=".2" strokeWidth=".8" />
      <line x1={C} y1={C} x2={w2x} y2={w2y} stroke="#F4E8D2" strokeOpacity=".95" strokeWidth="1.8" filter="url(#hx-soft)" />

      {/* registration marks on the axes */}
      {[0, 180].map((d) => { const [x, y] = P(d, 178); return <g key={d} fill="#F2EBDD" fillOpacity=".7"><circle cx={x - 4} cy={y} r="1.3" /><circle cx={x + 4} cy={y} r="1.3" /></g>; })}
      <Dot at={P(90, 170)} r={2.2} /><Dot at={P(90, 181)} r={2.2} />

      {/* registration orbs and points */}
      <Orb at={P(32, 160)} />
      <Orb at={P(206, 161)} />
      <Orb at={P(270, 185)} s={0.85} />
      <Dot at={P(331, 224)} r={2.8} />
      <Dot at={P(317, 110)} r={2.3} />
      <Dot at={P(259, 59)} r={2.4} />
      <circle cx={P(121, 160)[0]} cy={P(121, 160)[1]} r="2" fill="#E8D7B8" fillOpacity=".6" />

      {/* the transaction node: ice-white in a blue-grey halo */}
      <circle cx={C} cy={C} r="44" fill="url(#hx-halo)" />
      <circle cx={C} cy={C} r="30" fill="url(#hx-glow)" />
      <circle cx={C} cy={C} r="15" stroke="#E4EFF7" strokeWidth="2.2" />
      <circle cx={C} cy={C} r="7.5" fill="#FFFFFF" />
    </svg>
  );
};

// line icons for the capability rail, drawn inside bronze rings (benchmark)
const ICONS: ReadonlyArray<React.ReactNode> = [
  <><circle cx="12" cy="12" r="7.5" /><circle cx="12" cy="12" r="3.5" /><circle cx="12" cy="12" r=".9" fill="currentColor" /><path d="M12 2.5v3.5M12 18v3.5M2.5 12H6M18 12h3.5" /></>,
  <><circle cx="12" cy="6.5" r="2.4" /><circle cx="6" cy="17" r="2.4" /><circle cx="18" cy="17" r="2.4" /><path d="M10.9 8.6 7.2 14.9M13.1 8.6l3.7 6.3M8.4 17h7.2" /></>,
  <><path d="M6 3h8.5L18 6.5V21H6z" /><path d="M14 3v4h4M8.5 11h7M8.5 14h7M8.5 17h4.5" /></>,
  <><path d="M5 20h14" /><path d="M6.5 19v-5h3v5zM10.5 19v-8h3v8zM14.5 19V6h3v13z" /></>,
  <><path d="M6.5 21V3.5" /><path d="M6.5 4.5h11l-2.8 3.8 2.8 3.8h-11" /></>,
];

// porcelain → graphite, measured from the benchmark: neutral warm greys, no tan, no seam
const FALL = "linear-gradient(90deg, #F8F4EE 0%, #F4EFE8 26%, #EDE6DD 33%, #E2D8CE 39.5%, #CDC3B7 43.5%, #AEA59A 46.5%, #8D867C 49.5%, #6D6964 52.5%, #4E4C48 56%, #373734 60%, #2A2A28 65%, #222321 72%, #1E1F1C 100%)";
const FALL_Y = "radial-gradient(circle at 50% 42%, rgba(160,136,100,0.2), transparent 45%), linear-gradient(180deg, #F8F4EE 0, #E2D8CE 30px, #AEA59A 70px, #6D6964 110px, #373734 160px, #222321 220px, #1E1F1C 100%)";
// the warm haze around the dial and the light leak at lower left of the dark (desktop)
const HAZE = "radial-gradient(circle at 74.5% 41%, rgba(166,142,104,0.24), transparent 27%), radial-gradient(ellipse 26% 34% at 58% 84%, rgba(214,196,168,0.18), transparent 70%), radial-gradient(ellipse 60% 70% at 8% 10%, #FCFAF6, transparent 70%)";
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

const HeroExchange: React.FC = () => {
  const nav = useNavigate();
  const { t } = useI18n();
  return (
    <section id="ch-01" aria-labelledby="hx-h" className="relative isolate flex flex-col overflow-hidden bg-[#F8F4EE]">
      <div className="hx-grid relative grid lg:min-h-[max(560px,min(41.25vw,780px))] lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)]">
        {/* the field (desktop) is this grid's own background (.hx-grid): one fall-off across the hero, the
            dial's warm haze, a light leak at lower left; a fine grain over the dark */}
        <span aria-hidden className="absolute inset-0 -z-10 hidden opacity-[0.06] mix-blend-screen lg:block" style={{ backgroundImage: GRAIN, maskImage: "linear-gradient(90deg, transparent 45%, #000 62%)", WebkitMaskImage: "linear-gradient(90deg, transparent 45%, #000 62%)" }} />

        {/* the editorial page */}
        <div className="relative z-10 flex items-center">
          <div className="w-full px-5 py-12 sm:px-8 sm:py-20 lg:py-14 lg:pl-[max(4.5rem,calc((100vw-1480px)/2+3.5rem))] lg:pr-[clamp(1.5rem,3vw,3.5rem)]">
            <p className="flex items-center gap-4 font-mono text-[10.5px] font-medium uppercase tracking-[0.24em] text-[#2B2B2A] sm:text-[11px] xl:tracking-[0.32em]">
              <span aria-hidden className="h-px w-10 bg-ex-bronze" />{t("hx.eyebrow")}
            </p>
            <h1 id="hx-h" className="mt-8 max-w-[9.4em] font-editorial text-[clamp(2.7rem,4.6vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.032em] text-[#15171A] [font-feature-settings:'kern','liga','calt'] [font-kerning:normal] [text-wrap:balance] lg:-ml-[0.04em]">
              {t("hx.h1")}{" "}
              <em className="mt-[0.04em] block font-normal italic tracking-[-0.025em] text-[#9C8058]">{t("hx.h1em")}</em>
            </h1>
            <p className="mt-8 max-w-[36rem] text-[16px] leading-[1.65] text-[#3D3F41] sm:text-[17px]">{t("hx.body")}</p>
            <div className="mt-10 flex flex-wrap items-center gap-3.5">
              <button onClick={() => nav("/platform")}
                className="group inline-flex items-center gap-6 rounded-[3px] bg-[#15181C] px-7 py-[17px] text-[14.5px] font-medium text-white transition duration-300 hover:bg-[#2A2D30] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F4EE] motion-reduce:transition-none">
                {t("hx.explore")} <Arrow />
              </button>
              <a href="#ch-04" className="group inline-flex items-center gap-6 rounded-[3px] border border-[#CFC8BD] bg-white/40 px-6 py-[16px] text-[14.5px] font-medium text-[#1B1B1B] transition-colors duration-300 hover:border-[#9C8058] hover:bg-white/70 motion-reduce:transition-none">
                {t("bar.value")} <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-0.5 motion-reduce:transition-none">↓</span>
              </a>
            </div>
          </div>
        </div>

        {/* the signature: the insignia's instrument and the wordmark */}
        <div aria-hidden className="hx-sig relative flex flex-col items-center justify-center pb-12 pt-20 sm:pb-16 lg:pb-[3.5%] lg:pt-[1.5%]">
          <div className="hx-mark relative flex flex-col items-center">
            <div className="h-[min(78vw,330px)] w-[min(78vw,330px)] sm:h-[420px] sm:w-[420px] lg:h-[min(30.6vw,560px)] lg:w-[min(30.6vw,560px)]"><Dial /></div>
            <div className="mt-[0.05em] font-editorial font-medium leading-none tracking-[-0.025em] text-transparent"
              style={{ fontSize: "clamp(3rem, 5.4vw, 6rem)", backgroundImage: "linear-gradient(180deg, #F2E9DA 0%, #DCCDB3 50%, #B39E7E 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", filter: "drop-shadow(0 0 22px rgba(232,220,200,0.14))" }}>
              ExitOS
            </div>
            <div className="mt-4 flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.36em] text-[#ECE5D8] sm:text-[11.5px]">
              <span className="h-px w-10 bg-[#E3DCCF]/55 sm:w-12" />The acquisition exchange<span className="h-px w-10 bg-[#E3DCCF]/55 sm:w-12" />
            </div>
          </div>

          {/* the vertical note */}
          <div className="absolute bottom-[16%] right-[84px] hidden xl:block">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#E3DCCF]/70" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t("hx.note")}</span>
          </div>
        </div>
      </div>

      {/* the capability rail: charcoal, bronze-ringed icons */}
      <div className="relative border-t border-white/[0.06] text-[#EDE7DC]" style={{ backgroundImage: "linear-gradient(180deg, #1E1F1C, #181917)" }}>
        <ul aria-label={t("hx.strip")} className="mx-auto grid w-full max-w-[1640px] px-5 sm:px-8 lg:grid-cols-5 lg:px-[max(1.5rem,calc((100vw-1640px)/2+1.5rem))] xl:px-[max(4.5rem,calc((100vw-1640px)/2+2rem))]">
          {[1, 2, 3, 4, 5].map((k, i) => (
            <li key={k} className={`group relative flex items-center gap-4 py-3.5 lg:items-start lg:py-7 lg:pr-4 ${i ? "border-t border-white/[0.07] lg:border-l lg:border-t-0 lg:pl-5 xl:pl-6" : "lg:pl-0"}`}>
              <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ex-bronze/60 text-ex-bronze transition-colors duration-300 group-hover:border-ex-bronze lg:h-14 lg:w-14">
                <svg viewBox="0 0 24 24" className="h-5 w-5 lg:h-7 lg:w-7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">{ICONS[i]}</svg>
              </span>
              <span className="flex min-w-0 items-baseline gap-3 lg:block">
                <span className="font-mono text-[10.5px] tracking-[0.45em] text-[#EDE7DC]/75 lg:block">{String(k).padStart(2, "0")}</span>
                <span className="block font-editorial text-[16.5px] font-medium leading-snug lg:mt-1.5 lg:text-[16px] min-[1500px]:text-[18.5px]">{t(`hx.s${k}`)}</span>
                <span className="sr-only max-w-[26ch] text-[13.5px] leading-[1.5] text-[#B3ADA4] xl:not-sr-only xl:mt-2 xl:block">{t(`hx.s${k}d`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <style>{`
        .hx-sig{background:${FALL_Y}}
        @media (min-width:1024px){
          .hx-grid{background:${HAZE}, ${FALL}}
          .hx-sig{background:none}
        }
        @media (prefers-reduced-motion: no-preference){ .hx-mark{animation:hxMark 1.8s cubic-bezier(.2,.7,.2,1) .2s both} }
        @keyframes hxMark{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}
      `}</style>
    </section>
  );
};

export default HeroExchange;
