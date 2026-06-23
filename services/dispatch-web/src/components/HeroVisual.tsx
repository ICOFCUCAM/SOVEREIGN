import React from "react";

// Crisp overlay (institutions, governed pipeline, Official Record) drawn over the
// canvas atmosphere. Clean and spacious to match the benchmark: institution
// labels sit to the RIGHT of their nodes, the cords converge at SUBMIT, gold
// arrows carry the flow rightward to a tile-scale, ringed Official Record seal.
// viewBox aspect (1360×960) is wide enough that it fits-to-width, so SUBMIT lands
// at x≈0.28 of the panel — aligned with the canvas convergence point.

const GOLD = "#e9c878";
const BRIGHT = "#ffe7ad";
const WHITE_DIM = "rgba(255,255,255,0.55)";
const CY = 480;
const INST_CX = 118;
const INST: { label: string; y: number }[] = [
  { label: "MINISTRIES", y: 270 }, { label: "UNIVERSITIES", y: 375 }, { label: "HOSPITALS", y: 480 },
  { label: "AGENCIES", y: 585 }, { label: "AUTHORITIES", y: 690 },
];
const SX = [381, 497, 613, 729, 845, 961];
const TILE = 78;
const SEAL = { x: 1140, y: CY, r: 46 };
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
const Arrow: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g stroke={GOLD} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
    <line x1={x} y1={y} x2={x + 16} y2={y} /><path d={`M${x + 11},${y - 4} l5,4 -5,4`} />
  </g>
);

export const HeroVisual: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 1360 960" preserveAspectRatio="xMidYMid meet" aria-hidden className={className}>
    <defs>
      <filter id="hv-bloom" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="9" /></filter>
      <radialGradient id="hv-seal" cx="0.5" cy="0.4" r="0.62">
        <stop offset="0" stopColor={BRIGHT} stopOpacity="0.95" />
        <stop offset="0.7" stopColor={GOLD} stopOpacity="0.85" />
        <stop offset="1" stopColor="#b6873a" stopOpacity="0.8" />
      </radialGradient>
    </defs>

    {/* institutions */}
    {INST.map((it) => (
      <g key={it.label}>
        <circle cx={INST_CX} cy={it.y} r="29" fill="#0c0c0c" fillOpacity="0.7" stroke="rgba(233,200,120,0.6)" strokeWidth="1.3" />
        <Glyph name={it.label} x={INST_CX} y={it.y} s={1.2} color={BRIGHT} />
        <text x={INST_CX + 46} y={it.y + 5} fontSize="15" fontWeight="600" letterSpacing="1.5" fill="rgba(255,255,255,0.95)" style={{ fontFamily: "inherit" }}>{it.label}</text>
      </g>
    ))}

    {/* arrow into Submit (cords converge here on the canvas) */}
    <Arrow x={SX[0] - TILE / 2 - 22} y={CY} />

    {/* governed pipeline */}
    {SX.map((x, i) => (
      <g key={i}>
        <rect x={x - TILE / 2} y={CY - TILE / 2} width={TILE} height={TILE} rx="16" fill={GOLD} opacity="0.05" filter="url(#hv-bloom)" />
        <rect x={x - TILE / 2} y={CY - TILE / 2} width={TILE} height={TILE} rx="16" fill="#0c0c0c" fillOpacity="0.82" stroke="rgba(233,200,120,0.42)" strokeWidth="1.2" />
        <Glyph name={STAGES[i]} x={x} y={CY - 3} s={1.7} color={GOLD} sw={1.5} />
        <text x={x} y={CY + TILE / 2 + 24} textAnchor="middle" fontSize="12.5" fontWeight="700" letterSpacing="1.2" fill={WHITE_DIM} style={{ fontFamily: "inherit" }}>{STAGES[i]}</text>
        {i < SX.length - 1 && <Arrow x={x + TILE / 2 + 8} y={CY} />}
      </g>
    ))}

    {/* arrow archive → seal */}
    <Arrow x={SX[5] + TILE / 2 + 8} y={CY} />

    {/* Official Record — tile-scale gold seal, clean rings, glow */}
    <g>
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r + 6} fill={BRIGHT} opacity="0.4" filter="url(#hv-bloom)" />
      {[64, 86, 108].map((r, i) => (
        <circle key={r} cx={SEAL.x} cy={SEAL.y} r={r} fill="none" stroke={GOLD} strokeWidth="1.1" opacity={0.34 - i * 0.1}>
          {i === 0 && <><animate attributeName="r" values="64;70;64" dur="4.5s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.34;0.5;0.34" dur="4.5s" repeatCount="indefinite" /></>}
        </circle>
      ))}
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="url(#hv-seal)" stroke={BRIGHT} strokeWidth="1.5" />
      <Glyph name="SEAL" x={SEAL.x} y={SEAL.y} s={2.7} color="#171008" sw={1.5} />
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 34} textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="2" fill={BRIGHT} style={{ fontFamily: "inherit" }}>OFFICIAL</text>
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 54} textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="2" fill={BRIGHT} style={{ fontFamily: "inherit" }}>RECORD</text>
    </g>
  </svg>
);
