import React from "react";

// Hero visual — institutional infrastructure, not a diagram. One composed SVG
// with real bloom (feGaussianBlur) so the gold light streams and the Official
// Record seal read as illuminated fibre, sweeping from many institutions into a
// single governed system. Brand colours only (gold on ink).

const GOLD = "#e9c878";
const BRIGHT = "#ffe7ad";
const WHITE_DIM = "rgba(255,255,255,0.5)";

const CY = 390;
const INST = [
  { label: "MINISTRIES", y: 132 },
  { label: "UNIVERSITIES", y: 261 },
  { label: "HOSPITALS", y: 390 },
  { label: "AGENCIES", y: 519 },
  { label: "AUTHORITIES", y: 648 },
];
const INST_CX = 150;
const SX = [376, 488, 600, 712, 824, 936];
const TILE = 80;
const SEAL = { x: 1066, y: CY, r: 78 };
const BUNDLE = { x: 312, y: CY };
const STAGES = ["SUBMIT", "GOVERN", "APPROVE", "RENDER", "PUBLISH", "ARCHIVE"];

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

const CONTINENTS = [
  "M150,92 L243,82 L300,120 L286,168 L304,201 L250,242 L208,212 L188,160 L152,150 Z",
  "M283,268 L332,258 L352,300 L332,382 L300,432 L286,360 L300,320 Z",
  "M470,108 L542,104 L562,140 L520,176 L480,166 L464,134 Z",
  "M481,196 L592,190 L602,262 L560,342 L520,360 L500,300 L476,240 Z",
  "M566,94 L802,90 L822,160 L760,212 L680,202 L622,242 L582,182 L560,140 Z",
  "M772,330 L862,330 L877,376 L820,402 L776,376 Z",
];
const MESH = Array.from({ length: 54 }, (_, i) => ({ x: 300 + ((i * 149) % 880), y: 70 + ((i * 97) % 620), r: 1 + ((i * 7) % 3) * 0.6 }));

// stream sweeps — spread on the left, converging on the seal
const STREAMS = [110, 200, 300, CY, 480, 580, 670];
const streamPath = (sy: number) => `M150,${sy} C 470,${sy} 760,${CY} ${SEAL.x},${CY}`;

export const HeroVisual: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 1240 760" preserveAspectRatio="xMidYMid meet" aria-hidden className={className}>
    <defs>
      <filter id="hv-bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8" /></filter>
      <filter id="hv-bloom-s" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.2" /></filter>
      <pattern id="hv-dots" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="1.4" cy="1.4" r="1.2" fill={GOLD} /></pattern>
      <pattern id="hv-grid" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M46 0H0V46" fill="none" stroke={GOLD} strokeWidth="0.5" /></pattern>
      <radialGradient id="hv-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={GOLD} stopOpacity="0.5" />
        <stop offset="0.4" stopColor={GOLD} stopOpacity="0.17" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="hv-seal" cx="0.5" cy="0.42" r="0.62">
        <stop offset="0" stopColor={BRIGHT} stopOpacity="0.42" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0.05" />
      </radialGradient>
      <linearGradient id="hv-stream" x1="150" y1="0" x2={SEAL.x} y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={GOLD} stopOpacity="0.10" />
        <stop offset="0.5" stopColor={GOLD} stopOpacity="0.6" />
        <stop offset="1" stopColor={BRIGHT} stopOpacity="0.95" />
      </linearGradient>
    </defs>

    {/* L1 — faint dark grid + world map */}
    <rect x="280" y="60" width="940" height="640" fill="url(#hv-grid)" opacity="0.05" />
    <g opacity="0.2" transform="translate(280 120) scale(0.82 1)">
      {CONTINENTS.map((d, i) => <path key={i} d={d} fill="url(#hv-dots)" />)}
    </g>

    {/* L2 — gold node mesh */}
    <g opacity="0.6">
      {MESH.map((m, i) => {
        const n = MESH[(i + 4) % MESH.length];
        const near = Math.abs(m.x - n.x) < 190 && Math.abs(m.y - n.y) < 150;
        return (<g key={i}>{near && <line x1={m.x} y1={m.y} x2={n.x} y2={n.y} stroke={GOLD} strokeWidth="0.5" opacity="0.14" />}<circle cx={m.x} cy={m.y} r={m.r} fill={GOLD} opacity="0.32" /></g>);
      })}
    </g>

    {/* L3 — ambient illumination from the Official Record (the light source) */}
    <ellipse cx={SEAL.x} cy={SEAL.y} rx="440" ry="440" fill="url(#hv-glow)" />

    {/* L4 — luminous information streams (glow + core + travelling light) */}
    <g fill="none">
      <g filter="url(#hv-bloom-s)" opacity="0.7">
        {STREAMS.map((sy) => <path key={sy} d={streamPath(sy)} stroke={GOLD} strokeWidth="5" />)}
      </g>
      {STREAMS.map((sy, i) => (
        <g key={sy}>
          <path d={streamPath(sy)} stroke="url(#hv-stream)" strokeWidth="2.2" opacity="0.7" />
          <path d={streamPath(sy)} stroke={BRIGHT} strokeWidth="2.2" strokeLinecap="round" strokeDasharray="3 26" opacity="0.95">
            <animate attributeName="stroke-dashoffset" from="0" to="-58" dur={`${2.2 + i * 0.35}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}
      {/* institution feeders converging to a single point before Submit */}
      {INST.map((it) => (
        <path key={it.label} d={`M${INST_CX + 30},${it.y} C 250,${it.y} 270,${CY} ${BUNDLE.x},${CY}`} stroke={GOLD} strokeWidth="1.4" opacity="0.32" />
      ))}
      <circle cx={BUNDLE.x} cy={BUNDLE.y} r="4" fill={BRIGHT} opacity="0.8" />
    </g>

    {/* L5 — Official Record: bloom, authority rings, seal */}
    <g>
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="none" stroke={BRIGHT} strokeWidth="7" opacity="0.5" filter="url(#hv-bloom)" />
      {[158, 126, 96].map((r, i) => (
        <circle key={r} cx={SEAL.x} cy={SEAL.y} r={r} fill="none" stroke={GOLD} strokeWidth="1.1" opacity={0.12 + i * 0.08}>
          {i === 0 && <><animate attributeName="r" values="158;168;158" dur="4.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.12;0.26;0.12" dur="4.5s" repeatCount="indefinite" /></>}
        </circle>
      ))}
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="url(#hv-seal)" stroke={GOLD} strokeWidth="3" />
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r - 14} fill="none" stroke={BRIGHT} strokeWidth="1" opacity="0.45" />
      <Glyph name="SEAL" x={SEAL.x} y={SEAL.y} s={4.8} color={BRIGHT} sw={1.3} />
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 40} textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="2.5" fill={BRIGHT} style={{ fontFamily: "inherit" }}>OFFICIAL</text>
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 62} textAnchor="middle" fontSize="16" fontWeight="700" letterSpacing="2.5" fill={BRIGHT} style={{ fontFamily: "inherit" }}>RECORD</text>
    </g>

    {/* L6 — governed pipeline */}
    <g>
      <rect y={CY - TILE / 2} width={TILE} height={TILE} rx="15" fill={GOLD} opacity="0.12" stroke={GOLD} strokeOpacity="0.7" strokeWidth="1.5">
        <animate attributeName="x" values={SX.map((x) => x - TILE / 2).join(";") + ";" + (SX[0] - TILE / 2)} dur="9s" calcMode="discrete" repeatCount="indefinite" />
      </rect>
      {SX.map((x, i) => (
        <g key={i}>
          {i < SX.length - 1 && (
            <g stroke={GOLD} strokeWidth="1.5" opacity="0.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1={x + TILE / 2} y1={CY} x2={x + (SX[1] - SX[0]) - TILE / 2} y2={CY} />
              <path d={`M${x + (SX[1] - SX[0]) - TILE / 2 - 6},${CY - 4} l4,4 -4,4`} />
            </g>
          )}
          <rect x={x - TILE / 2} y={CY - TILE / 2} width={TILE} height={TILE} rx="15" fill="#0b0b0b" fillOpacity="0.78" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
          <Glyph name={STAGES[i]} x={x} y={CY - 4} s={1.6} color={GOLD} sw={1.5} />
          <text x={x} y={CY + TILE / 2 + 24} textAnchor="middle" fontSize="13" fontWeight="700" letterSpacing="1" fill={WHITE_DIM} style={{ fontFamily: "inherit" }}>{STAGES[i]}</text>
        </g>
      ))}
      <g stroke={GOLD} strokeWidth="1.6" opacity="0.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1={SX[5] + TILE / 2} y1={CY} x2={SEAL.x - SEAL.r - 8} y2={CY} />
        <path d={`M${SEAL.x - SEAL.r - 14},${CY - 5} l5,5 -5,5`} />
      </g>
    </g>

    {/* L7 — institutional inputs */}
    <g>
      {INST.map((it) => (
        <g key={it.label}>
          <text x={INST_CX - 44} y={it.y + 4} textAnchor="end" fontSize="13.5" fontWeight="600" letterSpacing="1.4" fill={WHITE_DIM} style={{ fontFamily: "inherit" }}>{it.label}</text>
          <circle cx={INST_CX} cy={it.y} r="28" fill="rgba(255,255,255,0.03)" stroke="rgba(233,200,120,0.32)" strokeWidth="1" />
          <Glyph name={it.label} x={INST_CX} y={it.y} s={1.2} color={GOLD} />
        </g>
      ))}
    </g>

    {/* L8 — drifting particles */}
    <g>
      {MESH.filter((_, i) => i % 2 === 0).map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={m.r + 0.5} fill={BRIGHT}>
          <animate attributeName="opacity" values="0.1;0.55;0.1" dur={`${3 + (i % 5)}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>

    <text x="656" y="730" textAnchor="middle" fontSize="11.5" letterSpacing="3.5" fill="rgba(255,255,255,0.3)" style={{ fontFamily: "inherit" }}>SUBMIT · GOVERN · APPROVE · RENDER · PUBLISH · ARCHIVE</text>
  </svg>
);
