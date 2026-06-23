import React from "react";

// Cinematic hero backdrop, recreated in code (no binary asset, no 404). Three
// layers, right-anchored behind the live flow:
//   1. a faint dotted world map (continents filled with a dot pattern)
//   2. luminous gold light streams flowing from the left, converging on the seal
//   3. a soft radial bloom behind the Official Record
// SMIL animation drives the travelling light — no JS, no decorative metrics.

// Rough continent silhouettes on a 1000×500 equirectangular field. Faint and
// dotted, they read as a world map without needing a pixel-accurate asset.
const CONTINENTS = [
  "M150,92 L243,82 L300,120 L286,168 L304,201 L250,242 L208,212 L188,160 L152,150 Z", // N. America
  "M283,268 L332,258 L352,300 L332,382 L300,432 L286,360 L300,320 Z",                  // S. America
  "M470,108 L542,104 L562,140 L520,176 L480,166 L464,134 Z",                            // Europe
  "M481,196 L592,190 L602,262 L560,342 L520,360 L500,300 L476,240 Z",                   // Africa
  "M566,94 L802,90 L822,160 L760,212 L680,202 L622,242 L582,182 L560,140 Z",            // Asia
  "M772,330 L862,330 L877,376 L820,402 L776,376 Z",                                     // Australia
];

// Light streams: from the institution feeders (left) converging on the seal.
const STREAM_Y = [128, 190, 250, 310, 372];

export const HeroBackdrop: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid slice" aria-hidden className={className}>
    <defs>
      <pattern id="hb-dots" width="11" height="11" patternUnits="userSpaceOnUse">
        <circle cx="1.6" cy="1.6" r="1.1" fill="#d9b46a" />
      </pattern>
      <linearGradient id="hb-stream" x1="120" y1="0" x2="880" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#e9c878" stopOpacity="0" />
        <stop offset="0.45" stopColor="#e9c878" stopOpacity="0.55" />
        <stop offset="1" stopColor="#f4d98a" stopOpacity="0.95" />
      </linearGradient>
      <radialGradient id="hb-bloom" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#e9c878" stopOpacity="0.30" />
        <stop offset="0.45" stopColor="#c99a6a" stopOpacity="0.10" />
        <stop offset="1" stopColor="#e9c878" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* world map — faint dotted continents */}
    <g opacity="0.16">
      {CONTINENTS.map((d, i) => <path key={i} d={d} fill="url(#hb-dots)" />)}
    </g>

    {/* bloom behind the seal */}
    <ellipse cx="882" cy="250" rx="180" ry="180" fill="url(#hb-bloom)" />

    {/* light streams */}
    <g fill="none">
      {STREAM_Y.map((y, i) => (
        <g key={y}>
          <path d={`M120,${y} C 380,${y} 600,250 880,250`} stroke="url(#hb-stream)" strokeWidth="1" opacity="0.35" />
          <path d={`M120,${y} C 380,${y} 600,250 880,250`} stroke="url(#hb-stream)" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="5 30">
            <animate attributeName="stroke-dashoffset" from="0" to="-70" dur={`${2.6 + i * 0.35}s`} repeatCount="indefinite" />
          </path>
        </g>
      ))}
    </g>
  </svg>
);
