import React, { useEffect, useState } from "react";

// Concept A — THE RECORD. The hero is the artifact itself: a sealed, numbered
// official instrument on bone paper, struck with a gold foil seal, lit in the
// dark like a record pulled from a national archive. Behind it, the edges of
// further records imply an archive of millions. Motion is near-still: a single
// minting reveal and a slow foil catch of light. No maps, networks or flows.

const INK = "#1d1810";
const MUTED = "#6f6453";
const META: [string, string][] = [
  ["AUTHORITY", "Issuing institution"],
  ["JURISDICTION", "Sovereign · on-premise"],
  ["STATUS", "Governed · approved"],
  ["INTEGRITY", "Immutable · sealed"],
];

export const RecordArtifact: React.FC<{ className?: string }> = ({ className }) => {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setShown(true)); return () => cancelAnimationFrame(t); }, []);

  return (
    <div
      className={className}
      style={{
        transition: "opacity 1100ms cubic-bezier(.16,1,.3,1), transform 1100ms cubic-bezier(.16,1,.3,1)",
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : "translateY(18px) scale(.985)",
      }}
    >
      <svg viewBox="0 0 600 720" className="h-full w-full" role="img" aria-label="A sealed official record issued by Sovereign Dispatch">
        <defs>
          <linearGradient id="ra-paper" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor="#f6f1e6" />
            <stop offset="1" stopColor="#e7decb" />
          </linearGradient>
          <linearGradient id="ra-foil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#b6873a" />
            <stop offset="0.42" stopColor="#f4d98a" />
            <stop offset="0.5" stopColor="#fff4d6" />
            <stop offset="0.58" stopColor="#e9c878" />
            <stop offset="1" stopColor="#a9772f" />
            <animateTransform attributeName="gradientTransform" type="translate" values="-0.35 0;0.35 0;-0.35 0" dur="9s" repeatCount="indefinite" />
          </linearGradient>
          <radialGradient id="ra-light" cx="0.5" cy="0.42" r="0.62">
            <stop offset="0" stopColor="#e9c878" stopOpacity="0.16" />
            <stop offset="0.5" stopColor="#e9c878" stopOpacity="0.04" />
            <stop offset="1" stopColor="#e9c878" stopOpacity="0" />
          </radialGradient>
          <filter id="ra-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="26" floodColor="#000000" floodOpacity="0.55" />
          </filter>
          <filter id="ra-emboss" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.35" />
          </filter>
          <path id="ra-rim" d="M300 470 m-66 0 a66 66 0 1 1 132 0 a66 66 0 1 1 -132 0" />
        </defs>

        {/* archival depth — edges of further records behind the instrument */}
        <rect x="118" y="58" width="372" height="588" rx="6" fill="#cdc4b0" opacity="0.28" />
        <rect x="104" y="74" width="392" height="588" rx="6" fill="#ddd4c0" opacity="0.5" />

        {/* environmental light the record sits in */}
        <ellipse cx="300" cy="320" rx="320" ry="360" fill="url(#ra-light)" />

        {/* the instrument */}
        <g filter="url(#ra-shadow)">
          <rect x="88" y="92" width="424" height="568" rx="7" fill="url(#ra-paper)" stroke="#1d1810" strokeOpacity="0.12" strokeWidth="1" />
          <rect x="100" y="104" width="400" height="544" rx="3" fill="none" stroke={INK} strokeOpacity="0.16" strokeWidth="1" />

          {/* header */}
          <text x="124" y="142" fontFamily="ui-monospace, monospace" fontSize="11.5" letterSpacing="1.5" fill={MUTED}>RECORD No. SD-2036-000001</text>
          <g transform="translate(476 134)" textAnchor="end">
            <circle cx="-66" cy="-4" r="3" fill="#b6873a" />
            <text x="0" y="0" fontFamily="ui-monospace, monospace" fontSize="11.5" letterSpacing="2.5" fill="#9a6a22">SEALED</text>
          </g>
          <line x1="124" y1="158" x2="476" y2="158" stroke={INK} strokeOpacity="0.2" strokeWidth="1" />

          <text x="124" y="214" fontFamily="Georgia, 'Times New Roman', serif" fontSize="40" fontWeight="700" letterSpacing="0.5" fill={INK}>Official Record</text>
          <text x="126" y="240" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="3" fill={MUTED}>INSTRUMENT OF PUBLICATION</text>

          {/* metadata ledger */}
          {META.map(([k, v], i) => {
            const y = 286 + i * 40;
            return (
              <g key={k}>
                <text x="124" y={y} fontFamily="ui-monospace, monospace" fontSize="10.5" letterSpacing="2" fill={MUTED}>{k}</text>
                <text x="476" y={y} textAnchor="end" fontFamily="Georgia, serif" fontSize="14.5" fill={INK}>{v}</text>
                <line x1="124" y1={y + 14} x2="476" y2={y + 14} stroke={INK} strokeOpacity="0.1" strokeWidth="1" />
              </g>
            );
          })}

          {/* the struck gold seal */}
          <g filter="url(#ra-emboss)">
            <circle cx="300" cy="470" r="62" fill="url(#ra-foil)" stroke="#7c531c" strokeWidth="1" />
            <circle cx="300" cy="470" r="54" fill="none" stroke="#7c531c" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="300" cy="470" r="50" fill="none" stroke="#fff4d6" strokeOpacity="0.4" strokeWidth="0.8" />
            {/* shield + check, embossed into the foil */}
            <g transform="translate(300 470) scale(1.5)" fill="none" stroke="#5e3f15" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M0 -12l9 3.2V0c0 6-4 10.4-9 12.4C-5 10.4 -9 6 -9 0V-8.8L0 -12z" />
              <path d="M-4.2 0l3 3 5.4-6" />
            </g>
            <text fontFamily="Georgia, serif" fontSize="9.5" letterSpacing="3.4" fill="#5e3f15" fillOpacity="0.92">
              <textPath href="#ra-rim" startOffset="2%">SOVEREIGN&nbsp;DISPATCH&nbsp;·&nbsp;OFFICIAL&nbsp;RECORD&nbsp;·&nbsp;</textPath>
            </text>
          </g>

          {/* integrity footer */}
          <line x1="124" y1="588" x2="476" y2="588" stroke={INK} strokeOpacity="0.2" strokeWidth="1" />
          <text x="124" y="612" fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="1.2" fill={MUTED}>INTEGRITY  9f1a · c7d4 · 8e02 · 5b6f</text>
          <text x="476" y="612" textAnchor="end" fontFamily="ui-monospace, monospace" fontSize="10" letterSpacing="2" fill={MUTED}>SEALED MMXXXVI</text>
        </g>
      </svg>
    </div>
  );
};
