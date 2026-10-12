import React from "react";
import { polar } from "../lib/insignia";
import { LAND_COAST, LAND_FILL, POLAR } from "../lib/polar-map";

// ── THE LIVING INSTRUMENT (HX6) ─────────────────────────────────────
// The hero's dial: the ExitOS insignia opened into a full instrument. It
// is composed at first paint (no entrance) and alive only in slow, quiet
// ways. Every motion is decorative and says so: nothing here is market
// data, nothing implies a live transaction, and nothing waits on a request.
//
// Built as a stack of SVG layers sharing one 500-unit view box. Each layer
// is its own HTML box, so the slow rotations and the pointer depth are
// transforms the compositor runs without repainting the dial; only the
// small signal elements animate inside their layer.
//
// Motion (all off under prefers-reduced-motion; paused while the page is
// hidden or the hero is off screen, see HeroExchange):
//   graduations      one turn per 600 s, clockwise
//   dotted bezels    one turn per 900 s, anticlockwise
//   inner dotted ring and its orbital point   one turn per 260 s, anticlockwise
//   market-ring bead one turn per 180 s, clockwise
//   capability points each orbits the core, 1.9 s per unit of radius (209–426 s
//                    per turn), clockwise; they hold while one is named
//   polar map        beneath the instrument, centred on the core (the North
//                    Pole), one turn per 360 s under a fixed light
//   light sweep      one turn per 48 s, very faint (hidden on phones)
//   signal sequence  every 16 s: a light runs from the core to each
//                    capability point in turn (01 → 05, 3.2 s apart); the
//                    point answers with one soft pulse, and the outcome
//                    indicator steps up one stage
//   aperture wedge   fixed; its light breathes over 10 s (edge 0.8 s behind)
//   core             breathes over 7 s

const C = 250; // the dial's centre in its 500-unit view box; bezel radius 245
const P = (deg: number, r: number): [number, number] => polar(deg, r, C);
const RING = "#C8B48F", BR = "#B49A75";

/** Signal sequence: the cycle, and the stagger between the five points. Kept in step with the CSS below. */
export const SIGNAL = { cycle: 16, stagger: 3.2 } as const;

// the five capability points on the dial, in strip order (01 discover … 05 execute): bearing, radius,
// and whether the point is drawn as a bronze orb or an ivory point (as the benchmark places them)
const CAPS: ReadonlyArray<readonly [number, number, "orb" | "dot", number]> = [[331, 224, "dot", 2.8], [270, 185, "orb", 0.85], [317, 110, "dot", 2.3], [206, 161, "orb", 1], [32, 160, "orb", 1]];

/** Orbit periods of the five points (seconds per turn, clockwise): the nearer the core, the faster. */
const ORBIT = CAPS.map(([, r]) => Math.round(r * 1.9));

/** The current bearing (degrees) of a turning layer, read from its computed transform. */
const bearing = (el: SVGSVGElement | null): number => {
  const m = el ? getComputedStyle(el).transform : "none";
  const v = m.startsWith("matrix(") ? m.slice(7, -1).split(",").map(Number) : null;
  return v ? (Math.atan2(v[1], v[0]) * 180) / Math.PI : 0;
};

const Orb: React.FC<{ at: [number, number]; s?: number }> = ({ at: [x, y], s = 1 }) => (
  <g>
    <circle cx={x} cy={y} r={21 * s} fill="url(#hx-orb)" />
    <circle cx={x} cy={y} r={8 * s} stroke="#C9AE82" strokeOpacity=".75" strokeWidth="1" />
    <circle cx={x} cy={y} r={4 * s} fill="#FFF8EC" />
  </g>
);
const Dot: React.FC<{ at: [number, number]; r?: number }> = ({ at: [x, y], r = 2.5 }) => (
  <g><circle cx={x} cy={y} r={r * 2.4} fill="url(#hx-pt)" /><circle cx={x} cy={y} r={r} fill="#FBF8F2" /></g>
);

/** One layer of the instrument: a full-size SVG in the shared view box. `z` is its depth on pointer;
 *  `spin` (seconds per turn, negative for anticlockwise) makes it a slowly turning ring. */
const Layer: React.FC<{ z?: number; spin?: number; className?: string; svgRef?: React.Ref<SVGSVGElement>; children: React.ReactNode }> = ({ z = 0, spin, className = "", svgRef, children }) => (
  <div className={`hx-z pointer-events-none absolute inset-0 ${className}`} style={{ ["--z" as string]: z }}>
    <svg ref={svgRef} viewBox="0 0 500 500" fill="none" shapeRendering="geometricPrecision"
      className={`hx-l absolute inset-0 h-full w-full overflow-visible ${spin ? "hx-spin" : ""}`}
      style={spin ? { ["--spin" as string]: `${Math.abs(spin)}s`, animationDirection: spin < 0 ? "reverse" : "normal" } : undefined}>
      {children}
    </svg>
  </div>
);

// the far field, measured from the benchmark: two lines leave the white page and open in a V towards the
// signature — the upper one faint, rising to the dial; the lower one a bright horizon curve with a flare
const HORIZON = "M-330 392 Q-120 470 -5 533 T 150 640";

export const Dial: React.FC<{ active: number | null; onPoint: (i: number | null) => void; labels: string[] }> = ({ active, onPoint, labels }) => {
  const [w1x, w1y] = P(28, 212), [w2x, w2y] = P(64, 212);
  // while a point is named (hover on it or on its item in the rail) the orbits hold, so its name stays beside it
  const orbit = React.useRef<Array<SVGSVGElement | null>>([]);
  const [hold, setHold] = React.useState(0);
  React.useLayoutEffect(() => { if (active !== null) setHold(bearing(orbit.current[active])); }, [active]);
  return (
    <div className="hx-dial relative h-full w-full" data-hold={active !== null ? "" : undefined}>
      {/* shared paints (gradients are referenced across the layers) */}
      <svg width="0" height="0" className="absolute" aria-hidden>
        <defs>
          <radialGradient id="hx-orb"><stop offset="0" stopColor="#F8EAD0" stopOpacity="1" /><stop offset=".3" stopColor="#C9AE82" stopOpacity=".55" /><stop offset="1" stopColor={BR} stopOpacity="0" /></radialGradient>
          <radialGradient id="hx-pt"><stop offset="0" stopColor="#F3E6CF" stopOpacity=".55" /><stop offset="1" stopColor="#F3E6CF" stopOpacity="0" /></radialGradient>
          <radialGradient id="hx-flare"><stop offset="0" stopColor="#F6E3BF" stopOpacity=".5" /><stop offset="1" stopColor="#F6E3BF" stopOpacity="0" /></radialGradient>
          <radialGradient id="hx-halo"><stop offset="0" stopColor="#5C7383" stopOpacity=".8" /><stop offset=".75" stopColor="#47596A" stopOpacity=".55" /><stop offset="1" stopColor="#47596A" stopOpacity="0" /></radialGradient>
          <radialGradient id="hx-glow"><stop offset="0" stopColor="#FFFFFF" stopOpacity=".7" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></radialGradient>
          <radialGradient id="hx-wedge" gradientUnits="userSpaceOnUse" cx={C} cy={C} r="212">
            <stop offset="0" stopColor="#C7A97C" stopOpacity=".03" /><stop offset=".55" stopColor="#C7A97C" stopOpacity=".15" /><stop offset=".9" stopColor="#D2B68A" stopOpacity=".33" /><stop offset="1" stopColor="#D2B68A" stopOpacity=".18" />
          </radialGradient>
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
      </svg>

      {/* far field: the V, the horizon with its flare (soft strokes, no blur filter), the occasional glint */}
      <Layer z={14} className="hx-far">
        <path d="M-300 268 Q-190 232 -100 186 T 46 92" stroke="url(#hx-v-up)" strokeWidth="1" />
        <path d={HORIZON} stroke="url(#hx-v-low)" strokeWidth="7" strokeOpacity=".07" strokeLinecap="round" />
        <path d={HORIZON} stroke="url(#hx-v-low)" strokeWidth="3" strokeOpacity=".2" strokeLinecap="round" />
        <path d={HORIZON} stroke="url(#hx-v-low)" strokeWidth="1.25" />
        <path className="hx-glint" pathLength={1} d={HORIZON} stroke="#FFF1D8" strokeWidth="5" strokeOpacity=".3" strokeLinecap="round" />
        <path className="hx-glint" pathLength={1} d={HORIZON} stroke="#FFF8EC" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="-5" y1="533" x2="-103" y2="360" stroke="#E8D7B8" strokeOpacity=".24" strokeWidth="1" />
        <line x1="-131" y1="326" x2="26" y2="326" stroke="#E8D7B8" strokeOpacity=".16" strokeWidth="1" />
        <line x1="9" y1="512" x2="81" y2="430" stroke="#E8D7B8" strokeOpacity=".18" strokeWidth="1" />
        <Orb at={[-5, 533]} s={0.55} />
        <Orb at={[-103, 360]} s={0.45} />
      </Layer>

      {/* crosshairs across the field, brighter inside the dial; the diagonal guides */}
      <Layer z={2}>
        <line x1="-560" y1={C} x2="1100" y2={C} stroke="url(#hx-axis)" strokeWidth="1" />
        <line x1={C} y1="-400" x2={C} y2="900" stroke={RING} strokeOpacity=".3" strokeWidth="1" />
        <line x1={C - 207} y1={C} x2={C + 207} y2={C} stroke={RING} strokeOpacity=".55" strokeWidth="1" />
        <line x1={C} y1={C - 207} x2={C} y2={C + 207} stroke={RING} strokeOpacity=".55" strokeWidth="1" />
        <g stroke={RING} strokeOpacity=".12" strokeWidth="1">
          {[45, 135, 225, 315].map((d) => { const [a, b] = P(d, 59), [c, e] = P(d, 207); return <line key={d} x1={a} y1={b} x2={c} y2={e} />; })}
        </g>
      </Layer>

      {/* the world beneath the instrument: the polar map centred on the core (the North Pole), its 60°S edge on
          the outer market ring; the dial's rings and crosshairs are its graticule */}
      <div className="hx-z pointer-events-none absolute inset-0" style={{ ["--z" as string]: 3 }}>
        <PolarMap className="inset-[7.3%]" />
      </div>

      {/* the light sweep: a faint trailing sector behind a hairline edge, one turn in 48 s */}
      <Layer z={3} spin={48} className="hx-sweep">
        {Array.from({ length: 14 }, (_, i) => {
          const a = -28 + i * 2, [x1, y1] = P(a, 204), [x2, y2] = P(a + 2.2, 204);
          return <path key={i} d={`M${C} ${C} L${x1} ${y1} A204 204 0 0 1 ${x2} ${y2} Z`} fill="#E2CDA6" fillOpacity={(0.028 * (i + 1)) / 14} />;
        })}
        {(() => { const [a, b] = P(0, 62), [c, d] = P(0, 204); return <line x1={a} y1={b} x2={c} y2={d} stroke="#F1E3C8" strokeOpacity=".14" strokeWidth="1" />; })()}
      </Layer>

      {/* the aperture: the lit wedge of the benchmark, fixed in place; its light breathes (10 s), and its bright
          leading edge answers a little behind */}
      <Layer z={3} className="hx-wedge">
        <path d={`M${C} ${C} L${w1x} ${w1y} A212 212 0 0 1 ${w2x} ${w2y} Z`} fill="url(#hx-wedge)" />
      </Layer>
      <Layer z={3}>
        <line x1={C} y1={C} x2={w1x} y2={w1y} stroke="#EFE2C9" strokeOpacity=".18" strokeWidth="1" />
      </Layer>
      <Layer z={3} className="hx-wedge-edge">
        <line x1={C} y1={C} x2={w2x} y2={w2y} stroke="#F4E8D2" strokeOpacity=".9" strokeWidth="1.5" />
      </Layer>

      {/* market rings */}
      <Layer z={4}>
        <circle cx={C} cy={C} r="205" stroke={RING} strokeOpacity=".38" strokeWidth="1" />
        <circle cx={C} cy={C} r="160" stroke="#C9B08A" strokeOpacity=".85" strokeWidth="1.25" />
        <circle cx={C} cy={C} r="118" stroke={RING} strokeOpacity=".24" strokeWidth="1" />
        <circle cx={C} cy={C} r="60" stroke="#D2BA92" strokeOpacity=".9" strokeWidth="1.25" />
      </Layer>
      {/* the inner dotted ring and its orbital point */}
      <Layer z={4} spin={-260}>
        <circle cx={C} cy={C} r="88" stroke={RING} strokeOpacity=".6" strokeWidth="1.3" strokeDasharray="0.1 4.4" strokeLinecap="round" />
        <circle cx={P(150, 88)[0]} cy={P(150, 88)[1]} r="1.9" fill="#F2E7D4" fillOpacity=".85" />
      </Layer>
      {/* a bead on the market ring, with a short lit arc behind it */}
      <Layer z={4} spin={180}>
        {(() => { const [a, b] = P(112, 160), [c, d] = P(130, 160), [x, y] = P(130, 160);
          return <><path d={`M${a} ${b} A160 160 0 0 1 ${c} ${d}`} stroke="#EAD7B3" strokeOpacity=".5" strokeWidth="1.5" /><circle cx={x} cy={y} r="2.4" fill="#F4E6CC" /></>; })()}
      </Layer>

      {/* graduated ring (turns, slowly) and the solid ring inside the bezel */}
      <Layer z={7}>
        <circle cx={C} cy={C} r="233" stroke={RING} strokeOpacity=".5" strokeWidth="1" />
      </Layer>
      <Layer z={7} spin={600}>
        <g stroke="#D9CCB4" strokeLinecap="round">
          {Array.from({ length: 180 }, (_, i) => i * 2).map((d) => {
            const major = d % 30 === 0 && d % 90 !== 0;
            const [x1, y1] = P(d, major ? 210 : 216), [x2, y2] = P(d, major ? 228 : 223);
            return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} strokeOpacity={major ? 0.8 : 0.26} strokeWidth={major ? 1.25 : 1} />;
          })}
        </g>
      </Layer>
      {/* the dotted bezels (turn the other way, slower) */}
      <Layer z={7} spin={-900}>
        <circle cx={C} cy={C} r="266" stroke="#E2D6BF" strokeOpacity=".28" strokeWidth="1.1" strokeDasharray="0.1 6" strokeLinecap="round" />
        <circle cx={C} cy={C} r="246" stroke="#E2D6BF" strokeOpacity=".5" strokeWidth="1.2" strokeDasharray="0.1 4.4" strokeLinecap="round" />
      </Layer>

      {/* registration marks, the connecting paths, and the five capability points */}
      <Layer z={5}>
        <g fill="#F2EBDD" fillOpacity=".7">
          {[0, 180].map((d) => { const [x, y] = P(d, 178); return <g key={d}><circle cx={x - 4} cy={y} r="1.3" /><circle cx={x + 4} cy={y} r="1.3" /></g>; })}
        </g>
        <Dot at={P(90, 170)} r={2.2} /><Dot at={P(90, 181)} r={2.2} />
        <Dot at={P(259, 59)} r={2.4} />
        <circle cx={P(121, 160)[0]} cy={P(121, 160)[1]} r="2" fill="#E8D7B8" fillOpacity=".6" />

        {/* the hovered point's bearing line and name, drawn where the point stands (orbits hold while one is named) */}
        {active !== null && (() => {
          const [d, r] = CAPS[active], [x, y] = P(d + hold, r), out = P(d + hold, r + 26);
          return <>
            <line x1={C} y1={C} x2={x} y2={y} stroke="#E9D7B4" strokeOpacity=".55" strokeWidth="1" strokeDasharray="2 3" />
            <text x={out[0]} y={out[1] + 3} textAnchor={out[0] < C - 8 ? "end" : out[0] > C + 8 ? "start" : "middle"} fill="#F1E9DC" fontSize="11" letterSpacing="1.6" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" style={{ textTransform: "uppercase" }}>{labels[active]}</text>
          </>;
        })()}
      </Layer>

      {/* the five capability points orbit the core, each on its own ring, the inner ones faster; each carries
          its connecting path, which is barely there until a light runs along it from the core */}
      {CAPS.map(([d, r, kind, s], i) => {
        const at = P(d, r), [a, b] = P(d, 17), [c, e] = P(d, r - (kind === "orb" ? 9 * s : 4 * s));
        return (
          <Layer key={d} z={5} spin={ORBIT[i]} className="hx-orbit" svgRef={(el) => { orbit.current[i] = el; }}>
            <g style={{ ["--i" as string]: i }}>
              <line x1={a} y1={b} x2={c} y2={e} stroke="#E9D7B4" strokeOpacity=".07" strokeWidth="1" />
              <line className="hx-light" pathLength={1} x1={a} y1={b} x2={c} y2={e} stroke="#F6E9D0" strokeWidth="1.2" strokeLinecap="round" />
            </g>
            <g className="hx-cap" style={{ ["--i" as string]: i }} onMouseEnter={() => onPoint(i)} onMouseLeave={() => onPoint(null)}>
              <circle cx={at[0]} cy={at[1]} r="24" fill="transparent" />
              <circle className="hx-flare" cx={at[0]} cy={at[1]} r={kind === "orb" ? 30 * s : 16} fill="url(#hx-flare)" />
              {kind === "orb" ? <Orb at={at} s={s} /> : <Dot at={at} r={s} />}
              <circle className="hx-pulse" cx={at[0]} cy={at[1]} r={kind === "orb" ? 9 * s : 5} stroke="#EAD8B6" strokeWidth="1" />
              <circle cx={at[0]} cy={at[1]} r="15" stroke="#E9D7B4" strokeWidth="1" className="transition-opacity duration-300" opacity={active === i ? 0.9 : 0} />
            </g>
          </Layer>
        );
      })}

      {/* the transaction node: ice-white in a blue-grey halo; the still point the layers move around */}
      <Layer>
        <circle className="hx-breath" cx={C} cy={C} r="32" fill="url(#hx-halo)" />
        <circle cx={C} cy={C} r="13" fill="url(#hx-glow)" />
        <circle cx={C} cy={C} r="14" stroke="#DCEAF3" strokeOpacity=".95" strokeWidth="1.25" />
        <circle cx={C} cy={C} r="6.5" fill="#FFFFFF" />
      </Layer>
    </div>
  );
};

/** The secondary outcome indicator: a vertical track of five stages, insight (bottom) to outcome (top).
 *  Its bead steps up one stage as each capability point answers — the sequence, not a measurement. */
export const OutcomeIndicator: React.FC = () => (
  <div aria-hidden className="relative w-3 self-stretch">
    <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-[#E3DCCF]/[0.16]" />
    <span className="hx-progress absolute inset-y-0 left-1/2 w-px -translate-x-1/2 origin-bottom bg-gradient-to-t from-[#B49A75]/10 to-[#D9C29B]/70" />
    {[0, 1, 2, 3, 4].map((k) => (
      <span key={k} className={`absolute left-1/2 h-px -translate-x-1/2 ${k === 4 ? "w-3 bg-[#D9C29B]/80" : "w-2 bg-[#E3DCCF]/35"}`} style={{ bottom: `${k * 25}%` }} />
    ))}
    <span className="hx-bead absolute inset-0">
      <span className="absolute bottom-0 left-1/2 h-[7px] w-[7px] -translate-x-1/2 translate-y-1/2 rounded-full bg-[#F1E2C6] shadow-[0_0_10px_2px_rgba(214,190,150,0.35)]" />
    </span>
  </div>
);

/** The world, seen from above the North Pole (azimuthal equidistant, Natural Earth land, cut at 60°S):
 *  champagne coastlines with a faint land tone, turning once in six minutes under a fixed light from the
 *  upper left. An original figure for the exchange's reach; not an emblem of any organisation. */
export const PolarMap: React.FC<{ className?: string }> = ({ className = "" }) => {
  const sheet = (lit: boolean) => (
    <svg viewBox={`0 0 ${POLAR.size} ${POLAR.size}`} fill="none" className="hx-spin absolute inset-0 h-full w-full" style={{ ["--spin" as string]: "360s" }}>
      {!lit && <path d={LAND_FILL} transform="scale(.1)" fill="#B49A75" fillOpacity=".045" />}
      <path d={LAND_COAST} transform="scale(.1)" stroke={lit ? "#F0DDB8" : "#C9AE82"} strokeWidth={lit ? 4.5 : 3.5} strokeOpacity={lit ? ".26" : ".17"} strokeLinejoin="round" />
    </svg>
  );
  return (
    <div aria-hidden className={`hx-map pointer-events-none ${className}`}>
      {sheet(false)}
      <div className="hx-map-lit absolute inset-0">{sheet(true)}</div>
    </div>
  );
};

/** The instrument's motion, as one stylesheet. Durations are set on each layer (--spin) or above (SIGNAL). */
export const INSTRUMENT_CSS = `
  /* every line a true hairline at any size: widths are screen pixels, not view-box units */
  .hx-l :is(line,path,circle){vector-effect:non-scaling-stroke}
  /* lines that measure their own length (pathLength) need view-box strokes; one unit is about one pixel */
  .hx-l :is(.hx-glint,.hx-light){vector-effect:none}
  .hx-cap{pointer-events:auto;cursor:default}
  .hx-glint,.hx-light,.hx-pulse,.hx-flare{opacity:0}
  .hx-pulse,.hx-flare{transform-box:fill-box;transform-origin:center}
  /* the still state (reduced motion): the outcome indicator rests at its last stage */
  .hx-bead{transform:translateY(-100%)}
  /* the map is a whole disc; only its outermost rim softens into the market ring */
  .hx-map{position:absolute;-webkit-mask-image:radial-gradient(circle,#000 60%,transparent 70.7%);mask-image:radial-gradient(circle,#000 60%,transparent 70.7%)}
  .hx-map-lit{-webkit-mask-image:radial-gradient(circle at 26% 30%,#000,transparent 52%);mask-image:radial-gradient(circle at 26% 30%,#000,transparent 52%)}
  /* depth on pointer: each layer moves by its own factor; the core does not move */
  @media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference){
    .hx-z{transform:translate(calc(var(--px,0) * var(--z) * 1px), calc(var(--py,0) * var(--z) * 1px));transition:transform 1.1s cubic-bezier(.2,.7,.2,1)}
  }
  @media (prefers-reduced-motion: no-preference){
    .hx-spin{animation:hxSpin var(--spin) linear infinite;will-change:transform}
    .hx-glint{stroke-dasharray:.07 .93;stroke-dashoffset:1;animation:hxGlint 11s cubic-bezier(.45,0,.55,1) 4s infinite}
    .hx-light{stroke-dasharray:.2 1;animation:hxLight ${SIGNAL.cycle}s cubic-bezier(.4,0,.3,1) calc(var(--i) * ${SIGNAL.stagger}s + 1.2s) infinite both}
    .hx-pulse{animation:hxPulse ${SIGNAL.cycle}s cubic-bezier(.2,.6,.3,1) calc(var(--i) * ${SIGNAL.stagger}s + 1.2s) infinite both}
    .hx-flare{animation:hxFlare ${SIGNAL.cycle}s ease-in-out calc(var(--i) * ${SIGNAL.stagger}s + 1.2s) infinite both}
    .hx-bead{animation:hxBead ${SIGNAL.cycle}s cubic-bezier(.5,0,.3,1) 1.2s infinite both}
    .hx-progress{animation:hxProgress ${SIGNAL.cycle}s cubic-bezier(.5,0,.3,1) 1.2s infinite both}
    .hx-breath{animation:hxBreath 7s ease-in-out infinite}
    .hx-wedge{animation:hxWedge 10s ease-in-out infinite}
    .hx-wedge-edge{animation:hxWedgeEdge 10s ease-in-out .8s infinite}
  }
  /* paused while the page is hidden or the hero is off screen */
  .hx-dial[data-hold] .hx-orbit .hx-spin{animation-play-state:paused}
  [data-hx-paused] :is(.hx-wedge,.hx-wedge-edge,.hx-spin,.hx-glint,.hx-light,.hx-pulse,.hx-flare,.hx-bead,.hx-progress,.hx-breath){animation-play-state:paused}
  /* phones: the essential instrument only */
  @media (max-width: 639px){ .hx-sweep,.hx-light{display:none} }
  @keyframes hxSpin{to{transform:rotate(360deg)}}
  @keyframes hxGlint{0%{stroke-dashoffset:1;opacity:0}8%{opacity:.85}48%{opacity:.85}58%{stroke-dashoffset:.34;opacity:0}100%{stroke-dashoffset:.34;opacity:0}}
  /* the light leaves the core, reaches its point at ~11% of the cycle (1.8 s), and is gone */
  @keyframes hxLight{0%{stroke-dashoffset:.2;opacity:0}2%{opacity:.7}10%{opacity:.7}12%{stroke-dashoffset:-1;opacity:0}100%{stroke-dashoffset:-1;opacity:0}}
  /* the point answers as the light arrives: one ring that opens and fades */
  @keyframes hxPulse{0%,10%{transform:scale(1);opacity:0}11%{opacity:.55}27%{transform:scale(2.6);opacity:0}100%{transform:scale(2.6);opacity:0}}
  @keyframes hxFlare{0%,9%{opacity:0}14%{opacity:.75}32%,100%{opacity:0}}
  /* the outcome indicator: each stage reached as its point answers (11% + n × 20% of the cycle) */
  @keyframes hxBead{0%{transform:translateY(0);opacity:0}6%{opacity:1}
    11%{transform:translateY(0)}27%{transform:translateY(0)}31%{transform:translateY(-25%)}47%{transform:translateY(-25%)}51%{transform:translateY(-50%)}
    67%{transform:translateY(-50%)}71%{transform:translateY(-75%)}87%{transform:translateY(-75%)}91%{transform:translateY(-100%);opacity:1}99%{transform:translateY(-100%);opacity:0}100%{transform:translateY(0);opacity:0}}
  @keyframes hxProgress{0%{transform:scaleY(0);opacity:0}6%{opacity:1}11%,27%{transform:scaleY(0)}31%,47%{transform:scaleY(.25)}51%,67%{transform:scaleY(.5)}
    71%,87%{transform:scaleY(.75)}91%{transform:scaleY(1);opacity:1}99%{transform:scaleY(1);opacity:0}100%{transform:scaleY(0);opacity:0}}
  /* the wedge's light: from a dimmer rest to its full benchmark brightness and back (opacity of its own layer) */
  @keyframes hxWedge{0%,100%{opacity:.55}50%{opacity:1}}
  @keyframes hxWedgeEdge{0%,100%{opacity:.7}50%{opacity:1}}
  @keyframes hxBreath{0%,100%{opacity:.78}50%{opacity:1}}
`;
