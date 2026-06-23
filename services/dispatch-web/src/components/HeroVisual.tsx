import React from "react";

// Hero visual — the workflow IS the product. One composed, layered SVG (no
// binary asset) built to read like national infrastructure rather than a SaaS
// diagram: world map + sovereignty mesh, institutional streams converging on a
// large, illuminated Official Record seal with concentric authority rings, and a
// governed pipeline running across the middle. Brand colours only (gold on ink).

const GOLD = "#e9c878";
const GOLD_DIM = "rgba(233,200,120,0.55)";
const WHITE_DIM = "rgba(255,255,255,0.5)";

// ── geometry ────────────────────────────────────────────────────────────────
const CY = 390;
const INST = [
  { label: "MINISTRIES", y: 150 },
  { label: "UNIVERSITIES", y: 270 },
  { label: "HOSPITALS", y: 390 },
  { label: "AGENCIES", y: 510 },
  { label: "AUTHORITIES", y: 630 },
];
const INST_CX = 150;
const SX = [372, 480, 588, 696, 804, 912]; // pipeline tile centres
const TILE = 74;
const SEAL = { x: 1040, y: CY, r: 74 };
const STAGES = ["SUBMIT", "GOVERN", "APPROVE", "RENDER", "PUBLISH", "ARCHIVE"];

// ── icon path fragments (24×24, stroke=currentColor via parent <g>) ──────────
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

// rough continent silhouettes (0..1000 × 0..500) for the dotted world map
const CONTINENTS = [
  "M150,92 L243,82 L300,120 L286,168 L304,201 L250,242 L208,212 L188,160 L152,150 Z",
  "M283,268 L332,258 L352,300 L332,382 L300,432 L286,360 L300,320 Z",
  "M470,108 L542,104 L562,140 L520,176 L480,166 L464,134 Z",
  "M481,196 L592,190 L602,262 L560,342 L520,360 L500,300 L476,240 Z",
  "M566,94 L802,90 L822,160 L760,212 L680,202 L622,242 L582,182 L560,140 Z",
  "M772,330 L862,330 L877,376 L820,402 L776,376 Z",
];

// deterministic scatter for the sovereignty mesh + particles
const MESH = Array.from({ length: 46 }, (_, i) => ({
  x: 250 + ((i * 137) % 760),
  y: 90 + ((i * 89) % 560),
  r: 1 + ((i * 7) % 3) * 0.5,
}));

export const HeroVisual: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 1200 760" preserveAspectRatio="xMidYMid meet" aria-hidden className={className}>
    <defs>
      <pattern id="hv-dots" width="13" height="13" patternUnits="userSpaceOnUse"><circle cx="1.4" cy="1.4" r="1.1" fill={GOLD} /></pattern>
      <radialGradient id="hv-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={GOLD} stopOpacity="0.42" />
        <stop offset="0.4" stopColor={GOLD} stopOpacity="0.14" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="hv-seal" cx="0.5" cy="0.42" r="0.6">
        <stop offset="0" stopColor={GOLD} stopOpacity="0.30" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0.04" />
      </radialGradient>
      <linearGradient id="hv-stream" x1="120" y1="0" x2="1040" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={GOLD} stopOpacity="0" />
        <stop offset="0.5" stopColor={GOLD} stopOpacity="0.5" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0.95" />
      </linearGradient>
    </defs>

    {/* L1 — world map */}
    <g opacity="0.13" transform="translate(250 120) scale(0.78 1)">
      {CONTINENTS.map((d, i) => <path key={i} d={d} fill="url(#hv-dots)" />)}
    </g>

    {/* L2 — sovereignty mesh: faint links + nodes */}
    <g opacity="0.5">
      {MESH.map((m, i) => {
        const n = MESH[(i + 3) % MESH.length];
        const near = Math.abs(m.x - n.x) < 200 && Math.abs(m.y - n.y) < 160;
        return (
          <g key={i}>
            {near && <line x1={m.x} y1={m.y} x2={n.x} y2={n.y} stroke={GOLD} strokeWidth="0.5" opacity="0.12" />}
            <circle cx={m.x} cy={m.y} r={m.r} fill={GOLD} opacity="0.28" />
          </g>
        );
      })}
    </g>

    {/* L3 — ambient illumination from the Official Record */}
    <ellipse cx={SEAL.x} cy={SEAL.y} rx="360" ry="360" fill="url(#hv-glow)" />

    {/* L4 — sweeping information streams (left → seal) */}
    <g fill="none">
      {[120, 250, CY, 530, 660].map((sy, i) => (
        <g key={sy}>
          <path d={`M180,${sy} C 520,${sy} 760,${CY} ${SEAL.x},${CY}`} stroke="url(#hv-stream)" strokeWidth="1" opacity="0.28" />
          <path d={`M180,${sy} C 520,${sy} 760,${CY} ${SEAL.x},${CY}`} stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="4 34" opacity="0.8">
            <animate attributeName="stroke-dashoffset" from="0" to="-76" dur={`${2.4 + i * 0.4}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}
      {/* institution feed lines into the pipeline */}
      {INST.map((it) => (
        <path key={it.label} d={`M${INST_CX + 30},${it.y} C 280,${it.y} 300,${CY} ${SX[0] - 46},${CY}`} stroke={GOLD} strokeWidth="0.9" opacity="0.22" />
      ))}
    </g>

    {/* L5 — authority rings + Official Record seal */}
    <g>
      {[150, 120, 94].map((r, i) => (
        <circle key={r} cx={SEAL.x} cy={SEAL.y} r={r} fill="none" stroke={GOLD} strokeWidth="1" opacity={0.1 + i * 0.07}>
          {i === 0 && <animate attributeName="r" values="150;158;150" dur="4s" repeatCount="indefinite" />}
          {i === 0 && <animate attributeName="opacity" values="0.1;0.2;0.1" dur="4s" repeatCount="indefinite" />}
        </circle>
      ))}
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="url(#hv-seal)" stroke={GOLD} strokeWidth="2.5" />
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r - 13} fill="none" stroke={GOLD} strokeWidth="1" opacity="0.4" />
      <Glyph name="SEAL" x={SEAL.x} y={SEAL.y} s={4.4} color="#f4d98a" sw={1.4} />
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 36} textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="2" fill={GOLD} style={{ fontFamily: "inherit" }}>OFFICIAL</text>
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 56} textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="2" fill={GOLD} style={{ fontFamily: "inherit" }}>RECORD</text>
    </g>

    {/* L6 — governed pipeline */}
    <g>
      {/* travelling highlight */}
      <rect y={CY - TILE / 2} width={TILE} height={TILE} rx="14" fill={GOLD} opacity="0.10" stroke={GOLD} strokeOpacity="0.6" strokeWidth="1.5">
        <animate attributeName="x" values={SX.map((x) => x - TILE / 2).join(";") + ";" + (SX[0] - TILE / 2)} dur="9s" calcMode="discrete" repeatCount="indefinite" />
      </rect>
      {SX.map((x, i) => (
        <g key={i}>
          {i < SX.length - 1 && (
            <g stroke={GOLD} strokeWidth="1.4" opacity="0.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1={x + TILE / 2} y1={CY} x2={x + (SX[1] - SX[0]) - TILE / 2} y2={CY} />
              <path d={`M${x + (SX[1] - SX[0]) - TILE / 2 - 6},${CY - 4} l4,4 -4,4`} />
            </g>
          )}
          <rect x={x - TILE / 2} y={CY - TILE / 2} width={TILE} height={TILE} rx="14" fill="#0c0c0c" fillOpacity="0.7" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
          <Glyph name={STAGES[i]} x={x} y={CY - 4} s={1.5} color={GOLD_DIM} />
          <text x={x} y={CY + TILE / 2 + 22} textAnchor="middle" fontSize="12.5" fontWeight="700" letterSpacing="1" fill={WHITE_DIM} style={{ fontFamily: "inherit" }}>{STAGES[i]}</text>
        </g>
      ))}
      {/* pipeline → seal connector */}
      <g stroke={GOLD} strokeWidth="1.4" opacity="0.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <line x1={SX[5] + TILE / 2} y1={CY} x2={SEAL.x - SEAL.r - 8} y2={CY} />
        <path d={`M${SEAL.x - SEAL.r - 14},${CY - 4} l4,4 -4,4`} />
      </g>
    </g>

    {/* L7 — institutional inputs */}
    <g>
      {INST.map((it) => (
        <g key={it.label}>
          <text x={INST_CX - 42} y={it.y + 4} textAnchor="end" fontSize="13" fontWeight="600" letterSpacing="1.2" fill={WHITE_DIM} style={{ fontFamily: "inherit" }}>{it.label}</text>
          <circle cx={INST_CX} cy={it.y} r="27" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
          <Glyph name={it.label} x={INST_CX} y={it.y} s={1.15} color={GOLD_DIM} />
        </g>
      ))}
    </g>

    {/* L8 — particles */}
    <g>
      {MESH.filter((_, i) => i % 3 === 0).map((m, i) => (
        <circle key={i} cx={m.x} cy={m.y} r={m.r + 0.4} fill={GOLD}>
          <animate attributeName="opacity" values="0.15;0.6;0.15" dur={`${3 + (i % 4)}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </g>

    <text x="640" y="724" textAnchor="middle" fontSize="11" letterSpacing="3" fill="rgba(255,255,255,0.28)" style={{ fontFamily: "inherit" }}>SUBMIT · GOVERN · APPROVE · RENDER · PUBLISH · ARCHIVE</text>
  </svg>
);
