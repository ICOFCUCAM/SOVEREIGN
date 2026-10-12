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
    <circle cx={x} cy={y} r={21 * s} fill="url(#hx-orb)" />
    <circle cx={x} cy={y} r={8 * s} stroke="#C9AE82" strokeOpacity=".75" strokeWidth="1" />
    <circle cx={x} cy={y} r={4 * s} fill="#FFF8EC" />
  </g>
);
// the five capability points on the dial, in strip order (01 discover … 05 execute): bearing, radius,
// and whether the point is drawn as a bronze orb or an ivory point (as the benchmark places them)
const CAPS: ReadonlyArray<readonly [number, number, "orb" | "dot", number]> = [[331, 224, "dot", 2.8], [270, 185, "orb", 0.85], [317, 110, "dot", 2.3], [206, 161, "orb", 1], [32, 160, "orb", 1]];

const Dot: React.FC<{ at: [number, number]; r?: number }> = ({ at: [x, y], r = 2.5 }) => (
  <g><circle cx={x} cy={y} r={r * 2.4} fill="url(#hx-pt)" /><circle cx={x} cy={y} r={r} fill="#FBF8F2" /></g>
);

const Dial: React.FC<{ active: number | null; onPoint: (i: number | null) => void; labels: string[] }> = ({ active, onPoint, labels }) => {
  const [w1x, w1y] = P(28, 212), [w2x, w2y] = P(64, 212);
  return (
    <svg viewBox="0 0 500 500" className="hx-dial h-full w-full overflow-visible" fill="none" shapeRendering="geometricPrecision" aria-hidden>
      <defs>
        <radialGradient id="hx-orb"><stop offset="0" stopColor="#F8EAD0" stopOpacity="1" /><stop offset=".3" stopColor="#C9AE82" stopOpacity=".55" /><stop offset="1" stopColor={BR} stopOpacity="0" /></radialGradient>
        <radialGradient id="hx-pt"><stop offset="0" stopColor="#F3E6CF" stopOpacity=".55" /><stop offset="1" stopColor="#F3E6CF" stopOpacity="0" /></radialGradient>
        <radialGradient id="hx-halo"><stop offset="0" stopColor="#5C7383" stopOpacity=".8" /><stop offset=".75" stopColor="#47596A" stopOpacity=".55" /><stop offset="1" stopColor="#47596A" stopOpacity="0" /></radialGradient>
        <radialGradient id="hx-glow"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".7" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
        <radialGradient id="hx-wedge" gradientUnits="userSpaceOnUse" cx={C} cy={C} r="212">
          <stop offset="0" stopColor="#C7A97C" stopOpacity=".03" /><stop offset=".55" stopColor="#C7A97C" stopOpacity=".14" /><stop offset=".9" stopColor="#D2B68A" stopOpacity=".3" /><stop offset="1" stopColor="#D2B68A" stopOpacity=".16" />
        </radialGradient>
        <filter id="hx-bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" /></filter>
        <linearGradient id="hx-axis" gradientUnits="userSpaceOnUse" x1="-560" y1="0" x2="1100" y2="0">
          <stop offset="0" stopColor={RING} stopOpacity="0" /><stop offset=".3" stopColor={RING} stopOpacity=".42" /><stop offset="1" stopColor={RING} stopOpacity=".42" />
        </linearGradient>
        <linearGradient id="hx-v-up" gradientUnits="userSpaceOnUse" x1="-300" y1="268" x2="46" y2="92">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset=".25" stopColor="#F1E6D2" stopOpacity=".55" /><stop offset=".7" stopColor="#E3D3B6" stopOpacity=".4" /><stop offset="1" stopColor="#E3D3B6" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="hx-v-low" gradientUnits="userSpaceOnUse" x1="-330" y1="392" x2="150" y2="640">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><stop offset=".22" stopColor="#FFF6E6" stopOpacity=".9" /><stop offset=".68" stopColor="#F1DFC0" stopOpacity=".95" /><stop offset="1" stopColor="#E3D3B6" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g className="hx-z" style={{ ["--z" as string]: 14 }}>
      {/* far field, measured from the benchmark: two lines leave the white page and open in a V towards the
          signature — the upper one faint, rising to the dial; the lower one a bright horizon curve with a flare,
          running on under the wordmark — plus a faint ray from the flare to a small orb, a second faint
          horizontal under the axis and a short ray beside the wordmark */}
      <g className="hx-fade" style={{ ["--d" as string]: "1.25s" }}>
      <path d="M-300 268 Q-190 232 -100 186 T 46 92" stroke="url(#hx-v-up)" strokeWidth="1" />
      <path d="M-330 392 Q-120 470 -5 533 T 150 640" stroke="url(#hx-v-low)" strokeWidth="2.5" strokeOpacity=".55" filter="url(#hx-bloom)" />
      <path d="M-330 392 Q-120 470 -5 533 T 150 640" stroke="url(#hx-v-low)" strokeWidth="1.25" />
      {/* a glint that travels the horizon now and then */}
      <path className="hx-glint" pathLength={1} d="M-330 392 Q-120 470 -5 533 T 150 640" stroke="#FFF1D8" strokeWidth="5" strokeLinecap="round" filter="url(#hx-bloom)" />
      <path className="hx-glint" pathLength={1} d="M-330 392 Q-120 470 -5 533 T 150 640" stroke="#FFF8EC" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="-5" y1="533" x2="-103" y2="360" stroke="#E8D7B8" strokeOpacity=".24" strokeWidth="1" />
      <line x1="-131" y1="326" x2="26" y2="326" stroke="#E8D7B8" strokeOpacity=".16" strokeWidth="1" />
      <line x1="9" y1="512" x2="81" y2="430" stroke="#E8D7B8" strokeOpacity=".18" strokeWidth="1" />
      <Orb at={[-5, 533]} s={0.55} />
      <Orb at={[-103, 360]} s={0.45} />
      </g>

      </g>

      <g className="hx-z" style={{ ["--z" as string]: 2 }}>
      {/* axes across the field, brighter inside the dial */}
      <g className="hx-fade" style={{ ["--d" as string]: ".3s" }}>
      <line x1="-560" y1={C} x2="1100" y2={C} stroke="url(#hx-axis)" strokeWidth="1" />
      <line x1={C} y1="-400" x2={C} y2="900" stroke={RING} strokeOpacity=".3" strokeWidth="1" />
      <line x1={C - 207} y1={C} x2={C + 207} y2={C} stroke={RING} strokeOpacity=".55" strokeWidth="1" />
      <line x1={C} y1={C - 207} x2={C} y2={C + 207} stroke={RING} strokeOpacity=".55" strokeWidth="1" />
      <g stroke={RING} strokeOpacity=".12" strokeWidth="1">
        {[45, 135, 225, 315].map((d) => { const [a, b] = P(d, 59), [c, e] = P(d, 207); return <line key={d} x1={a} y1={b} x2={c} y2={e} />; })}
      </g>
      </g>

      </g>

      <g className="hx-z" style={{ ["--z" as string]: 7 }}>
      {/* bezel and graduated ring */}
      <circle className="hx-fade" style={{ ["--d" as string]: "1s" }} cx={C} cy={C} r="266" stroke="#E2D6BF" strokeOpacity=".28" strokeWidth="1.1" strokeDasharray="0.1 6" strokeLinecap="round" />
      <circle className="hx-fade" style={{ ["--d" as string]: ".95s" }} cx={C} cy={C} r="246" stroke="#E2D6BF" strokeOpacity=".5" strokeWidth="1.2" strokeDasharray="0.1 4.4" strokeLinecap="round" />
      <circle className="hx-draw" style={{ ["--d" as string]: ".8s" }} pathLength={1} cx={C} cy={C} r="233" stroke={RING} strokeOpacity=".5" strokeWidth="1" />
      <g className="hx-fade" style={{ ["--d" as string]: ".75s" }} stroke="#D9CCB4" strokeLinecap="round">
        {Array.from({ length: 180 }, (_, i) => i * 2).map((d) => {
          const major = d % 30 === 0 && d % 90 !== 0;
          const [x1, y1] = P(d, major ? 210 : 216), [x2, y2] = P(d, major ? 228 : 223);
          return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={major ? 0.8 : 0.26} strokeWidth={major ? 1.25 : 1} />;
        })}
      </g>

      </g>

      <g className="hx-z" style={{ ["--z" as string]: 4 }}>
      {/* market rings */}
      <circle className="hx-draw" style={{ ["--d" as string]: ".6s" }} pathLength={1} cx={C} cy={C} r="205" stroke={RING} strokeOpacity=".38" strokeWidth="1" />
      <circle className="hx-draw" style={{ ["--d" as string]: ".45s" }} pathLength={1} cx={C} cy={C} r="160" stroke="#C9B08A" strokeOpacity=".85" strokeWidth="1.25" />
      <circle className="hx-draw" style={{ ["--d" as string]: ".35s" }} pathLength={1} cx={C} cy={C} r="118" stroke={RING} strokeOpacity=".24" strokeWidth="1" />
      <circle className="hx-fade" style={{ ["--d" as string]: ".25s" }} cx={C} cy={C} r="88" stroke={RING} strokeOpacity=".6" strokeWidth="1.3" strokeDasharray="0.1 4.4" strokeLinecap="round" />
      <circle className="hx-draw" style={{ ["--d" as string]: ".1s" }} pathLength={1} cx={C} cy={C} r="60" stroke="#D2BA92" strokeOpacity=".9" strokeWidth="1.25" />

      </g>

      <g className="hx-z" style={{ ["--z" as string]: 3 }}>
      {/* the aperture: a lit wedge, its leading edge bright; it sways a few degrees, slowly */}
      <g className="hx-open" style={{ ["--d" as string]: "1.1s" }}>
      <g className="hx-drift">
      <path d={`M${C} ${C} L${w1x} ${w1y} A212 212 0 0 1 ${w2x} ${w2y} Z`} fill="url(#hx-wedge)" filter="url(#hx-bloom)" />
      <path d={`M${C} ${C} L${w1x} ${w1y} A212 212 0 0 1 ${w2x} ${w2y} Z`} fill="url(#hx-wedge)" />
      <line x1={C} y1={C} x2={w1x} y2={w1y} stroke="#EFE2C9" strokeOpacity=".18" strokeWidth="1" />
      <line x1={C} y1={C} x2={w2x} y2={w2y} stroke="#F4E8D2" strokeOpacity=".9" strokeWidth="1.5" />
      </g>
      </g>
      </g>


      <g className="hx-z" style={{ ["--z" as string]: 5 }}>
      {/* registration marks on the axes */}
      <g className="hx-fade" style={{ ["--d" as string]: "1.2s" }}>
      {[0, 180].map((d) => { const [x, y] = P(d, 178); return <g key={d} fill="#F2EBDD" fillOpacity=".7"><circle cx={x - 4} cy={y} r="1.3" /><circle cx={x + 4} cy={y} r="1.3" /></g>; })}
      <Dot at={P(90, 170)} r={2.2} /><Dot at={P(90, 181)} r={2.2} />
      <Dot at={P(259, 59)} r={2.4} />
      <circle cx={P(121, 160)[0]} cy={P(121, 160)[1]} r="2" fill="#E8D7B8" fillOpacity=".6" />
      </g>

      {/* the five capability points: each answers to its item in the strip below, and lights it in turn */}
      {active !== null && (() => { const [x, y] = P(CAPS[active][0], CAPS[active][1]); return <line x1={C} y1={C} x2={x} y2={y} stroke="#E9D7B4" strokeOpacity=".55" strokeWidth="1" strokeDasharray="2 3" />; })()}
      {CAPS.map(([d, r, kind, s], i) => {
        const at = P(d, r), on = active === i;
        const out = P(d, r + 26);
        return (
          <g key={d} className="hx-cap hx-fade" style={{ ["--d" as string]: `${1.35 + i * 0.09}s` }} onMouseEnter={() => onPoint(i)} onMouseLeave={() => onPoint(null)}>
            <circle cx={at[0]} cy={at[1]} r="24" fill="transparent" />
            {kind === "orb" ? <Orb at={at} s={s} /> : <Dot at={at} r={s} />}
            <circle cx={at[0]} cy={at[1]} r="15" stroke="#E9D7B4" strokeWidth="1" className="transition-opacity duration-300" opacity={on ? 0.9 : 0} />
            {on && <text x={out[0]} y={out[1] + 3} textAnchor={out[0] < C - 8 ? "end" : out[0] > C + 8 ? "start" : "middle"} fill="#F1E9DC" fontSize="11" letterSpacing="1.6" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" style={{ textTransform: "uppercase" }}>{labels[i]}</text>}
          </g>
        );
      })}

      </g>

      {/* the transaction node: ice-white in a blue-grey halo; the still point the layers move around */}
      <g className="hx-fade" style={{ ["--d" as string]: "0s" }}>
      <circle cx={C} cy={C} r="32" fill="url(#hx-halo)" />
      <circle cx={C} cy={C} r="13" fill="url(#hx-glow)" />
      <circle cx={C} cy={C} r="14" stroke="#DCEAF3" strokeOpacity=".95" strokeWidth="1.25" />
      <circle cx={C} cy={C} r="6.5" fill="#FFFFFF" />
      </g>
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
const FALL = "linear-gradient(90deg, #F8F4EE 0%, #F4EFE8 24%, #EDE6DD 31%, #DDD4CA 37%, #C9C0B6 40.5%, #B0A89F 43.5%, #958F86 46.9%, #7C7770 50%, #63605A 53%, #4E4C47 56%, #3F3D3A 59%, #33322F 62.5%, #2A2927 65.6%, #242422 68.75%, #1F1F1D 72%, #1A1A18 80%, #161614 100%)";
const FALL_Y = "radial-gradient(circle at 50% 42%, rgba(160,136,100,0.08), transparent 40%), linear-gradient(180deg, #F8F4EE 0, #E2D8CE 30px, #AEA59A 70px, #6D6964 110px, #2A2927 160px, #1C1C1A 220px, #161614 100%)";
// the warm haze around the dial and the light leak at lower left of the dark (desktop)
const HAZE = "radial-gradient(circle at 74.5% 41%, rgba(166,142,104,0.05), transparent 22%), radial-gradient(ellipse 18% 22% at 59% 82%, rgba(214,196,168,0.09), transparent 70%), radial-gradient(ellipse 60% 70% at 8% 10%, #FCFAF6, transparent 70%)";
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)'/%3E%3C/svg%3E\")";

const HeroExchange: React.FC = () => {
  const nav = useNavigate();
  const { t } = useI18n();
  const [cap, setCap] = React.useState<number | null>(null);
  // depth on pointer (HX4): the dial's layers shift a few pixels against each other as the pointer moves over
  // the hero — desktop pointers only, never under reduced motion; written as CSS variables, no re-render
  const hero = React.useRef<HTMLElement>(null);
  const raf = React.useRef(0);
  const depth = React.useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches, []);
  const onMove = (e: React.PointerEvent): void => {
    const el = hero.current; if (!depth || !el) return;
    const r = el.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width * 0.745)) / (r.width * 0.3)));
    const py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.4)) / (r.height * 0.5)));
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => { el.style.setProperty("--px", px.toFixed(3)); el.style.setProperty("--py", py.toFixed(3)); });
  };
  const onLeave = (): void => { const el = hero.current; if (!el) return; cancelAnimationFrame(raf.current); el.style.setProperty("--px", "0"); el.style.setProperty("--py", "0"); };
  const labels = [1, 2, 3, 4, 5].map((k) => t(`hx.s${k}`));
  return (
    <section ref={hero} onPointerMove={onMove} onPointerLeave={onLeave} id="ch-01" aria-labelledby="hx-h" className="relative isolate flex flex-col overflow-hidden bg-[#F8F4EE]">
      <div className="hx-grid relative grid lg:min-h-[max(560px,min(41.25vw,780px))] lg:grid-cols-[minmax(0,1.04fr)_minmax(0,1fr)]">
        {/* the field (desktop) is this grid's own background (.hx-grid): one fall-off across the hero, the
            dial's warm haze, a light leak at lower left; a fine grain over the dark */}
        <span aria-hidden className="absolute inset-0 -z-10 hidden opacity-[0.03] mix-blend-screen lg:block" style={{ backgroundImage: GRAIN, maskImage: "linear-gradient(90deg, transparent 45%, #000 62%)", WebkitMaskImage: "linear-gradient(90deg, transparent 45%, #000 62%)" }} />

        {/* the editorial page */}
        <div className="relative z-10 flex items-center">
          <div className="w-full px-5 py-12 sm:px-8 sm:py-20 lg:py-14 lg:pl-[max(4.5rem,calc((100vw-1480px)/2+3.5rem))] lg:pr-[clamp(1.5rem,3vw,3.5rem)]">
            <p className="flex items-center gap-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.22em] text-[#1F1F1E] sm:text-[11.5px] xl:tracking-[0.28em]">
              <span aria-hidden className="h-px w-10 bg-ex-bronze" />{t("hx.eyebrow")}
            </p>
            <h1 id="hx-h" className="mt-8 max-w-[9.4em] font-editorial text-[clamp(2.7rem,4.6vw,5.25rem)] font-medium leading-[1.02] tracking-[-0.032em] text-[#15171A] [font-feature-settings:'kern','liga','calt'] [font-kerning:normal] [text-wrap:balance] lg:-ml-[0.04em]">
              {t("hx.h1")}{" "}
              <em className="mt-[0.04em] block font-medium italic tracking-[-0.025em] text-[#9A7E56]">{t("hx.h1em")}</em>
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
          <div className="relative flex flex-col items-center">
            <div className="h-[min(78vw,330px)] w-[min(78vw,330px)] sm:h-[420px] sm:w-[420px] lg:h-[min(29.4vw,540px)] lg:w-[min(29.4vw,540px)]"><Dial active={cap} onPoint={setCap} labels={labels} /></div>
            <div className="hx-fade mt-[0.05em] font-editorial font-medium leading-none tracking-[-0.025em] text-transparent"
              style={{ ["--d" as string]: "1.7s", fontSize: "clamp(3rem, 5.4vw, 6rem)", backgroundImage: "linear-gradient(180deg, #F2E9DA 0%, #DCCDB3 50%, #B39E7E 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", filter: "drop-shadow(0 0 22px rgba(232,220,200,0.14))" }}>
              Exit<span className="italic">OS</span>
            </div>
            <div style={{ ["--d" as string]: "1.95s" }} className="hx-fade mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#ECE5D8] sm:text-[11px]">
              <span className="h-px w-12 bg-[#E3DCCF]/55 sm:w-16" />The acquisition exchange<span className="h-px w-12 bg-[#E3DCCF]/55 sm:w-16" />
            </div>
          </div>

          {/* the vertical note */}
          <div className="absolute bottom-[16%] right-[84px] hidden xl:block">
            <span className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#E3DCCF]/70" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{t("hx.note")}</span>
          </div>
        </div>
      </div>

      {/* the capability rail: charcoal, bronze-ringed icons */}
      <div className="relative border-t border-white/[0.06] text-[#EDE7DC]" style={{ backgroundImage: "linear-gradient(180deg, #1B1B19, #151614)" }}>
        <ul aria-label={t("hx.strip")} className="mx-auto grid w-full max-w-[1640px] px-5 sm:px-8 lg:grid-cols-5 lg:px-[max(1.5rem,calc((100vw-1640px)/2+1.5rem))] xl:px-[max(4.5rem,calc((100vw-1640px)/2+2rem))]">
          {[1, 2, 3, 4, 5].map((k, i) => (
            <li key={k} onMouseEnter={() => setCap(i)} onMouseLeave={() => setCap(null)} className={`group relative flex items-center gap-4 py-3.5 lg:items-start lg:py-7 lg:pr-4 ${i ? "border-t border-white/[0.07] lg:border-l lg:border-t-0 lg:pl-5 xl:pl-6" : "lg:pl-0"}`}>
              <span aria-hidden className={`absolute inset-x-0 top-0 hidden h-px origin-left bg-ex-bronze transition-transform duration-500 motion-reduce:transition-none lg:block ${cap === i ? "scale-x-100" : "scale-x-0"}`} />
              <span aria-hidden className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-ex-bronze transition-[border-color,box-shadow] duration-300 lg:h-14 lg:w-14 ${cap === i ? "border-ex-bronze shadow-[0_0_18px_rgba(180,154,117,0.35)]" : "border-ex-bronze/60"}`}>
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
        /* every line a true hairline at any size: widths are screen pixels, not view-box units */
        .hx-dial :is(line,path,circle){vector-effect:non-scaling-stroke}
        /* the tracing rings measure their own length (pathLength), which needs view-box strokes; at this scale
           one unit is about one pixel, so they stay hairlines */
        .hx-dial .hx-draw{vector-effect:none}
        /* the instrument draws itself in, once, from the centre outward: rings trace, the wedge opens, the
           points light, the wordmark resolves. Only when motion is allowed; the still design is the default. */
        .hx-cap{cursor:default}
        .hx-glint{opacity:0;vector-effect:none}
        /* depth (HX4): each layer moves by its own factor; the core does not move */
        @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference){
          .hx-z{transform:translate(calc(var(--px,0) * var(--z) * 1px), calc(var(--py,0) * var(--z) * 1px));transition:transform 1.1s cubic-bezier(.2,.7,.2,1)}
        }
        /* a slow sign of life (HX4): the wedge sways three degrees either way over 24 s; a glint runs the horizon every 9 s */
        @media (prefers-reduced-motion: no-preference){
          .hx-drift{transform-box:view-box;transform-origin:250px 250px;animation:hxDrift 24s ease-in-out 2.4s infinite}
          .hx-glint{stroke-dasharray:.07 .93;stroke-dashoffset:1;animation:hxGlint 9s cubic-bezier(.45,0,.55,1) 3.2s infinite}
        }
        @keyframes hxDrift{0%,100%{transform:rotate(0)}25%{transform:rotate(3deg)}75%{transform:rotate(-3deg)}}
        @keyframes hxGlint{0%{stroke-dashoffset:1;opacity:0}8%{opacity:.85}48%{opacity:.85}58%{stroke-dashoffset:.34;opacity:0}100%{stroke-dashoffset:.34;opacity:0}}
        @media (prefers-reduced-motion: no-preference){
          .hx-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:hxDraw 1.25s cubic-bezier(.55,.05,.25,1) var(--d,0s) forwards}
          .hx-fade{opacity:0;animation:hxFade .9s ease-out var(--d,0s) forwards}
          .hx-open{opacity:0;transform-box:view-box;transform-origin:250px 250px;animation:hxOpen 1.1s cubic-bezier(.2,.7,.2,1) var(--d,0s) forwards}
        }
        @keyframes hxDraw{to{stroke-dashoffset:0}}
        @keyframes hxFade{to{opacity:1}}
        @keyframes hxOpen{from{opacity:0;transform:rotate(-14deg)}to{opacity:1;transform:none}}
      `}</style>
    </section>
  );
};

export default HeroExchange;
