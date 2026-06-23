import React, { useEffect, useRef } from "react";

// Hero as a layered sovereignty visualization (not a diagram): continent dot
// mesh, particle field, ~50 tapered Bézier strands carrying travelling light,
// a glowing governed pipeline, and a large illuminated Official Record seal —
// composed across depth layers with subtle pointer parallax. Brand gold only.

const GOLD = "#e9c878";
const BRIGHT = "#ffe7ad";
const WHITE_DIM = "rgba(255,255,255,0.5)";

const CY = 450;
const INST_CX = 150;
const INST: { label: string; y: number; n: number }[] = [
  { label: "MINISTRIES", y: 150, n: 12 },
  { label: "UNIVERSITIES", y: 300, n: 10 },
  { label: "HOSPITALS", y: 450, n: 8 },
  { label: "AGENCIES", y: 600, n: 8 },
  { label: "AUTHORITIES", y: 750, n: 10 },
];
const SX = [360, 468, 576, 684, 792, 900];
const NODE = 96;
const SEAL = { x: 1150, y: CY, r: 112 };
const STAGES = ["SUBMIT", "GOVERN", "APPROVE", "RENDER", "PUBLISH", "ARCHIVE"];

// ── deterministic RNG (stable across renders/screenshots) ────────────────────
let _s = 20260623;
const rnd = () => { _s = (_s * 1664525 + 1013904223) & 0x7fffffff; return _s / 0x7fffffff; };

// ── continents → dense gold dot map (point-in-polygon fill) ──────────────────
const CONTINENTS = [
  "M150,92 L243,82 L300,120 L286,168 L304,201 L250,242 L208,212 L188,160 L152,150 Z",
  "M283,268 L332,258 L352,300 L332,382 L300,432 L286,360 L300,320 Z",
  "M470,108 L542,104 L562,140 L520,176 L480,166 L464,134 Z",
  "M481,196 L592,190 L602,262 L560,342 L520,360 L500,300 L476,240 Z",
  "M566,94 L802,90 L822,160 L760,212 L680,202 L622,242 L582,182 L560,140 Z",
  "M772,330 L862,330 L877,376 L820,402 L776,376 Z",
];
const MAP = { tx: 330, ty: 150, sx: 0.92, sy: 1.18 };
const mapPt = (x: number, y: number): [number, number] => [MAP.tx + x * MAP.sx, MAP.ty + y * MAP.sy];
const polys = CONTINENTS.map((d) => {
  const nums = (d.match(/-?\d+\.?\d*/g) || []).map(Number);
  const pts: [number, number][] = [];
  for (let i = 0; i < nums.length; i += 2) pts.push(mapPt(nums[i], nums[i + 1]));
  return pts;
});
const inPoly = (px: number, py: number, poly: [number, number][]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > py) !== (yj > py)) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const WORLD_DOTS: { x: number; y: number; r: number }[] = [];
for (let x = 320; x < 1130; x += 8) {
  for (let y = 140; y < 680; y += 8) {
    if (polys.some((p) => inPoly(x, y, p))) WORLD_DOTS.push({ x: x + (rnd() - 0.5) * 3, y: y + (rnd() - 0.5) * 3, r: 0.7 + rnd() * 0.7 });
  }
}

// ── particle field ──────────────────────────────────────────────────────────
const PARTICLES = Array.from({ length: 360 }, (_, i) => ({
  x: 250 + rnd() * 1100, y: 50 + rnd() * 840, r: 0.5 + rnd() * 1.2,
  o: 0.1 + rnd() * 0.35, anim: i % 3 === 0, dur: 3 + rnd() * 4,
}));

// ── flow strands: each institution emits 8–12 tapering Bézier coils ──────────
const STRANDS: { d: string; w: number; dur: number }[] = [];
INST.forEach((it) => {
  for (let k = 0; k < it.n; k++) {
    const sy = it.y + (rnd() - 0.5) * 24;
    // flat S-sweep: leave the institution horizontally (control1 holds source y),
    // then flatten into the seal (control2 near CY) → a gentle S, not a funnel.
    const c1x = INST_CX + 190 + rnd() * 170, c1y = sy + (rnd() - 0.5) * 18;
    const c2x = SEAL.x - 300 - rnd() * 150, c2y = CY + (rnd() - 0.5) * 44;
    STRANDS.push({ d: `M${INST_CX + 30},${sy} C ${c1x},${c1y} ${c2x},${c2y} ${SEAL.x},${CY}`, w: 0.7 + rnd() * 1.1, dur: 2 + rnd() * 2.6 });
  }
});

const RINGS = [120, 132, 144, 156, 168, 180, 192, 204];

const ICON: Record<string, React.ReactNode> = {
  MINISTRIES: <path d="M4 9l8-5 8 5M5 9v8m4-8v8m6-8v8m4-8v8M3 20h18" />,
  UNIVERSITIES: (<><path d="M2 8l10-4 10 4-10 4L2 8z" /><path d="M6 10v5c0 1 2.7 2.5 6 2.5s6-1.5 6-2.5v-5" /></>),
  HOSPITALS: (<><rect x="5" y="4" width="14" height="16" rx="1.5" /><path d="M12 8v6m-3-3h6" /></>),
  AGENCIES: <path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" />,
  AUTHORITIES: (<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14 0 17M12 3.5c-2.5 2.5-2.5 14 0 17" /></>),
  SUBMIT: (<><path d="M7 3h7l4 4v14H7V3z" /><path d="M14 3v4h4" /></>),
  GOVERN: (<><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0111 0M16 7a3 3 0 010 6m4.5 6a5.5 5.5 0 00-4-5.3" /></>),
  APPROVE: (<><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>),
  RENDER: (<><path d="M8 4H5v3m11-3h3v3M8 20H5v-3m11 3h3v-3" /><rect x="9" y="9" width="6" height="6" rx="1" /></>),
  PUBLISH: (<><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.5 2.5 14 0 17M12 3.5c-2.5 2.5-2.5 14 0 17" /></>),
  ARCHIVE: (<><rect x="4" y="6" width="16" height="4" rx="1" /><path d="M5 10v9h14v-9M10 14h4" /></>),
  SEAL: (<><path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.5C8 19 5 15.6 5 11V5.5L12 3z" /><path d="M9 12l2 2 4-4" /></>),
};
const Glyph: React.FC<{ name: string; x: number; y: number; s?: number; color?: string; sw?: number }> = ({ name, x, y, s = 1, color = GOLD, sw = 1.6 }) => (
  <g transform={`translate(${x - 12 * s} ${y - 12 * s}) scale(${s})`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{ICON[name]}</g>
);

export const HeroVisual: React.FC<{ className?: string }> = ({ className }) => {
  const far = useRef<SVGGElement>(null), mid = useRef<SVGGElement>(null), near = useRef<SVGGElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      far.current?.setAttribute("transform", `translate(${x * 6} ${y * 6})`);
      mid.current?.setAttribute("transform", `translate(${x * 15} ${y * 11})`);
      near.current?.setAttribute("transform", `translate(${x * 26} ${y * 18})`);
    };
    window.addEventListener("mousemove", h, { passive: true });
    return () => window.removeEventListener("mousemove", h);
  }, []);

  return (
    <svg viewBox="0 0 1360 940" preserveAspectRatio="xMidYMid meet" aria-hidden className={className}>
      <defs>
        <filter id="hv-bloom" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="10" /></filter>
        <filter id="hv-bloom-s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.4" /></filter>
        <pattern id="hv-grid" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke={GOLD} strokeWidth="0.5" /></pattern>
        <radialGradient id="hv-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={BRIGHT} stopOpacity="0.5" />
          <stop offset="0.38" stopColor={GOLD} stopOpacity="0.16" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hv-seal" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0" stopColor={BRIGHT} stopOpacity="0.5" />
          <stop offset="1" stopColor={GOLD} stopOpacity="0.06" />
        </radialGradient>
        <linearGradient id="hv-stream" x1="150" y1="0" x2={SEAL.x} y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={GOLD} stopOpacity="0.08" />
          <stop offset="0.5" stopColor={GOLD} stopOpacity="0.55" />
          <stop offset="1" stopColor={BRIGHT} stopOpacity="0.95" />
        </linearGradient>
      </defs>

      {/* L1 — geo grid */}
      <rect x="300" y="70" width="1020" height="720" fill="url(#hv-grid)" opacity="0.045" />

      {/* big ambient bloom — the light source */}
      <ellipse cx={SEAL.x} cy={SEAL.y} rx="560" ry="520" fill="url(#hv-glow)" />

      {/* L2/L3 — world dot mesh + latitude lines (parallax: far) */}
      <g ref={far}>
        <g opacity="0.5" stroke={GOLD} strokeWidth="0.5" fill="none">
          {[230, 320, 410, 500, 590].map((y) => <path key={y} d={`M320 ${y} Q 720 ${y - 24} 1120 ${y}`} opacity="0.06" />)}
        </g>
        <g fill={GOLD}>
          {WORLD_DOTS.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} opacity={0.22 + (i % 5) * 0.03} />)}
        </g>
      </g>

      {/* L5 — flow strands (parallax: mid) */}
      <g ref={mid} fill="none">
        <g filter="url(#hv-bloom-s)" opacity="0.6">
          {STRANDS.map((s, i) => <path key={i} d={s.d} stroke={GOLD} strokeWidth={s.w + 2.6} />)}
        </g>
        {STRANDS.map((s, i) => (
          <g key={i}>
            <path d={s.d} stroke="url(#hv-stream)" strokeWidth={s.w} opacity="0.7" />
            <path d={s.d} stroke={BRIGHT} strokeWidth={s.w + 0.4} strokeLinecap="round" strokeDasharray="2 22" opacity="0.9">
              <animate attributeName="stroke-dashoffset" from="0" to="-48" dur={`${s.dur}s`} repeatCount="indefinite" />
            </path>
          </g>
        ))}
      </g>

      {/* L4 — particle field (parallax: near) */}
      <g ref={near} fill={BRIGHT}>
        {PARTICLES.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={p.r} opacity={p.o}>
            {p.anim && <animate attributeName="opacity" values={`${p.o};${p.o + 0.4};${p.o}`} dur={`${p.dur}s`} repeatCount="indefinite" />}
          </circle>
        ))}
      </g>

      {/* L6 — governed pipeline (96px nodes, persistent glow, pulse beams) */}
      <g>
        <g filter="url(#hv-bloom-s)">
          {SX.map((x, i) => (
            i < SX.length - 1 && <line key={i} x1={x + NODE / 2} y1={CY} x2={SX[i + 1] - NODE / 2} y2={CY} stroke={GOLD} strokeWidth="2" opacity="0.5">
              <animate attributeName="opacity" values="0.25;0.6;0.25" dur="2.6s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </line>
          ))}
          <line x1={SX[5] + NODE / 2} y1={CY} x2={SEAL.x - SEAL.r} y2={CY} stroke={GOLD} strokeWidth="2.4" opacity="0.6" />
        </g>
        {SX.map((x, i) => (
          <g key={i}>
            <rect x={x - NODE / 2} y={CY - NODE / 2} width={NODE} height={NODE} rx="18" fill={GOLD} opacity="0.06" filter="url(#hv-bloom-s)" />
            <rect x={x - NODE / 2} y={CY - NODE / 2} width={NODE} height={NODE} rx="18" fill="#0b0b0b" fillOpacity="0.8" stroke="rgba(233,200,120,0.4)" strokeWidth="1.2" />
            <Glyph name={STAGES[i]} x={x} y={CY - 4} s={2} color={GOLD} sw={1.4} />
            <text x={x} y={CY + NODE / 2 + 26} textAnchor="middle" fontSize="13.5" fontWeight="700" letterSpacing="1.2" fill={WHITE_DIM} style={{ fontFamily: "inherit" }}>{STAGES[i]}</text>
          </g>
        ))}
        {/* travelling highlight */}
        <rect y={CY - NODE / 2} width={NODE} height={NODE} rx="18" fill={GOLD} opacity="0.14" stroke={BRIGHT} strokeOpacity="0.7" strokeWidth="1.6">
          <animate attributeName="x" values={SX.map((x) => x - NODE / 2).join(";") + ";" + (SX[0] - NODE / 2)} dur="9s" calcMode="discrete" repeatCount="indefinite" />
        </rect>
      </g>

      {/* L7 — institution nodes */}
      <g>
        {INST.map((it) => (
          <g key={it.label}>
            <text x={INST_CX - 46} y={it.y + 4} textAnchor="end" fontSize="14" fontWeight="600" letterSpacing="1.5" fill={WHITE_DIM} style={{ fontFamily: "inherit" }}>{it.label}</text>
            <circle cx={INST_CX} cy={it.y} r="30" fill="#0b0b0b" fillOpacity="0.7" stroke="rgba(233,200,120,0.4)" strokeWidth="1.2" />
            <Glyph name={it.label} x={INST_CX} y={it.y} s={1.25} color={GOLD} />
          </g>
        ))}
      </g>

      {/* L8 — Official Record: bloom, rings, seal */}
      <g>
        <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="none" stroke={BRIGHT} strokeWidth="9" opacity="0.45" filter="url(#hv-bloom)" />
        {RINGS.map((r, i) => (
          <circle key={r} cx={SEAL.x} cy={SEAL.y} r={r} fill="none" stroke={GOLD} strokeWidth="1.1" opacity={Math.max(0.06, 0.34 - i * 0.035)}>
            {i === 0 && <><animate attributeName="r" values={`${r};${r + 10};${r}`} dur="5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.34;0.5;0.34" dur="5s" repeatCount="indefinite" /></>}
          </circle>
        ))}
        <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="url(#hv-seal)" stroke={GOLD} strokeWidth="3.5" />
        <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r - 18} fill="none" stroke={BRIGHT} strokeWidth="1.2" opacity="0.5" />
        <Glyph name="SEAL" x={SEAL.x} y={SEAL.y} s={7} color={BRIGHT} sw={1.2} />
        <text x={SEAL.x} y={SEAL.y + SEAL.r + 44} textAnchor="middle" fontSize="18" fontWeight="700" letterSpacing="3" fill={BRIGHT} style={{ fontFamily: "inherit" }}>OFFICIAL</text>
        <text x={SEAL.x} y={SEAL.y + SEAL.r + 68} textAnchor="middle" fontSize="18" fontWeight="700" letterSpacing="3" fill={BRIGHT} style={{ fontFamily: "inherit" }}>RECORD</text>
      </g>

      <text x="640" y="900" textAnchor="middle" fontSize="12" letterSpacing="4" fill="rgba(255,255,255,0.3)" style={{ fontFamily: "inherit" }}>SUBMIT · GOVERN · APPROVE · RENDER · PUBLISH · ARCHIVE</text>
    </svg>
  );
};
