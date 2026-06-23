import React from "react";

// Engine-turned guilloché — the interwoven rosette engraving used on banknotes,
// passports and certificates. Drawn as faint gold line-work; the parent sets the
// (very low) opacity. Purely decorative, deterministic, no animation.
const rose = (k: number, R: number, A: number, phase: number, steps = 720): string => {
  const cx = 300, cy = 300; let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const r = R + A * Math.cos(k * t + phase);
    const x = cx + r * Math.cos(t), y = cy + r * Math.sin(t);
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return d + "Z";
};

const BANDS: [number, number, number, number][] = [
  [11, 130, 46, 0], [11, 130, 46, 0.28], [17, 158, 36, 0],
  [17, 158, 36, 0.18], [23, 184, 28, 0], [23, 184, 28, 0.13],
  [31, 208, 20, 0], [41, 230, 14, 0.1],
];

export const Guilloche: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 600 600" className={className} aria-hidden fill="none">
    {BANDS.map(([k, R, A, p], i) => (
      <path key={i} d={rose(k, R, A, p)} stroke="#e9c878" strokeWidth="0.5" strokeOpacity="0.55" />
    ))}
    <circle cx="300" cy="300" r="248" stroke="#e9c878" strokeWidth="0.5" strokeOpacity="0.35" />
    <circle cx="300" cy="300" r="92" stroke="#e9c878" strokeWidth="0.5" strokeOpacity="0.35" />
  </svg>
);
