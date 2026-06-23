import React from "react";

// Crisp overlay over the canvas network. Institution labels sit ON TOP of the
// incoming mesh; the pipeline uses phase-based spacing (Submit·Govern·Approve
// tight = governance, then wider = production/publication); gold intensity rises
// left→right; the Official Record is a dominant seal in concentric authority
// rings. viewBox is wide enough to fit-to-width, so Submit lands at the canvas
// nexus (x≈0.264 of the panel).

const GOLD = "#e9c878";
const BRIGHT = "#ffe7ad";
const WHITE_DIM = "rgba(255,255,255,0.55)";
const CY = 480;
const INST_CX = 150;                         // institutions clear of the headline column, still a long journey
const INST: { label: string; y: number }[] = [
  { label: "MINISTRIES", y: 264 }, { label: "UNIVERSITIES", y: 372 }, { label: "HOSPITALS", y: 480 },
  { label: "AGENCIES", y: 588 }, { label: "AUTHORITIES", y: 696 },
];
// equal-spaced pipeline — six stages of one family, none larger or brighter than another
const SX = [430, 553, 676, 799, 922, 1045];
const TILE = 84;
const SEAL = { x: 1262, y: CY, r: 48 };      // Official Record — smaller; authority via space, rings, glow
const STAGES = ["SUBMIT", "GOVERN", "APPROVE", "RENDER", "PUBLISH", "ARCHIVE"];
// a few subtle ripple rings (not a radar screen)
const RINGS = [62, 78, 98, 122];

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
// small gold connector arrow between stages
const Arrow: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <path d={`M${x - 5},${y} h8 m-3.5,-3.5 l3.5,3.5 -3.5,3.5`} fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
);

export const HeroVisual: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 1440 960" preserveAspectRatio="xMidYMid meet" aria-hidden className={className}>
    <defs>
      <filter id="hv-bloom" x="-90%" y="-90%" width="280%" height="280%"><feGaussianBlur stdDeviation="11" /></filter>
      <filter id="hv-soft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" /></filter>
      <radialGradient id="hv-seal" cx="0.5" cy="0.4" r="0.62">
        <stop offset="0" stopColor={BRIGHT} stopOpacity="0.95" />
        <stop offset="0.7" stopColor={GOLD} stopOpacity="0.85" />
        <stop offset="1" stopColor="#b6873a" stopOpacity="0.8" />
      </radialGradient>
      <radialGradient id="hv-glow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor={GOLD} stopOpacity="0.5" />
        <stop offset="0.45" stopColor={GOLD} stopOpacity="0.12" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* institutions — always clearly readable: solid node + bright icon + bright label */}
    {INST.map((it) => (
      <g key={it.label}>
        <line x1={INST_CX + 26} y1={it.y} x2={INST_CX + 92} y2={it.y} stroke="rgba(233,200,120,0.22)" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx={INST_CX} cy={it.y} r="24" fill="#070707" fillOpacity="0.96" stroke="rgba(233,200,120,0.8)" strokeWidth="1.3" />
        <Glyph name={it.label} x={INST_CX} y={it.y} s={1.0} color={BRIGHT} />
        <text x={INST_CX + 40} y={it.y + 5} fontSize="14" fontWeight="700" letterSpacing="1.5" fill="#ffffff" style={{ fontFamily: "inherit" }}>{it.label}</text>
      </g>
    ))}

    {/* connector arrows — one family, equal rhythm */}
    <Arrow x={SX[0] - TILE / 2 - 14} y={CY} />
    {SX.slice(0, -1).map((x, i) => <Arrow key={`a${i}`} x={(x + TILE / 2 + SX[i + 1] - TILE / 2) / 2} y={CY} />)}
    <Arrow x={(SX[5] + TILE / 2 + SEAL.x - SEAL.r) / 2} y={CY} />

    {/* governed pipeline — six EQUAL cards, white icons, restrained */}
    {SX.map((x, i) => (
      <g key={i}>
        <rect x={x - TILE / 2 - 3} y={CY - TILE / 2 - 3} width={TILE + 6} height={TILE + 6} rx="18" fill={GOLD} opacity={(0.06 + i * 0.012).toFixed(3)} filter="url(#hv-bloom)" />
        <rect x={x - TILE / 2} y={CY - TILE / 2} width={TILE} height={TILE} rx="16" fill="#0d0d0d" fillOpacity="0.9" stroke="rgba(233,200,120,0.42)" strokeWidth="1.2" />
        <Glyph name={STAGES[i]} x={x} y={CY - 2} s={1.7} color="#ffffff" sw={1.5} />
        <text x={x} y={CY + TILE / 2 + 24} textAnchor="middle" fontSize="12.5" fontWeight="700" letterSpacing="1.2" fill={WHITE_DIM} style={{ fontFamily: "inherit" }}>{STAGES[i]}</text>
      </g>
    ))}

    {/* Official Record — small seal, the BRIGHTEST element (glow + ripples + negative space) */}
    <g>
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r * 3.4} fill="url(#hv-glow)" />
      <g filter="url(#hv-soft)">
        {RINGS.map((r, i) => (
          <circle key={r} cx={SEAL.x} cy={SEAL.y} r={r} fill="none" stroke={GOLD} strokeWidth="1" opacity={Math.max(0.05, 0.34 - i * 0.07)}>
            {i === 0 && <><animate attributeName="r" values={`${r};${r + 6};${r}`} dur="6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.34;0.5;0.34" dur="6s" repeatCount="indefinite" /></>}
          </circle>
        ))}
      </g>
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r + 4} fill={BRIGHT} opacity="0.3" filter="url(#hv-bloom)" />
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r} fill="url(#hv-seal)" stroke={BRIGHT} strokeWidth="1.6" />
      <circle cx={SEAL.x} cy={SEAL.y} r={SEAL.r - 9} fill="none" stroke="#171008" strokeWidth="1" opacity="0.5" />
      <Glyph name="SEAL" x={SEAL.x} y={SEAL.y} s={2.4} color="#171008" sw={1.6} />
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 32} textAnchor="middle" fontSize="15.5" fontWeight="700" letterSpacing="2.5" fill={BRIGHT} style={{ fontFamily: "inherit" }}>OFFICIAL</text>
      <text x={SEAL.x} y={SEAL.y + SEAL.r + 53} textAnchor="middle" fontSize="15.5" fontWeight="700" letterSpacing="2.5" fill={BRIGHT} style={{ fontFamily: "inherit" }}>RECORD</text>
    </g>
  </svg>
);
