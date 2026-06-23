import React, { useEffect, useRef } from "react";

// Atmospheric layer (canvas). The institutional "cords" — guitar-string-like
// strands — fan out from the five institution rows on the left and CONVERGE at
// the SUBMIT card; bright "code" particles travel along them toward that point.
// From Submit, the crisp SVG pipeline carries the flow right to the seal. Plus a
// dim gold dotted world map and a warm bloom on the right. Brand gold only.

// convergence point (matches SUBMIT in the SVG overlay: x≈0.28 of width, centre)
const CX = 0.28, CY = 0.5, SX0 = 0.086;
const BANDS = [0.28, 0.39, 0.5, 0.61, 0.72]; // institution rows (normalised y)

// continents → dotted map
const CONTS = [
  "M150,92 L243,82 L300,120 L286,168 L304,201 L250,242 L208,212 L188,160 L152,150 Z",
  "M283,268 L332,258 L352,300 L332,382 L300,432 L286,360 L300,320 Z",
  "M470,108 L542,104 L562,140 L520,176 L480,166 L464,134 Z",
  "M481,196 L592,190 L602,262 L560,342 L520,360 L500,300 L476,240 Z",
  "M566,94 L802,90 L822,160 L760,212 L680,202 L622,242 L582,182 L560,140 Z",
  "M772,330 L862,330 L877,376 L820,402 L776,376 Z",
];
const parse = (d: string): [number, number][] => {
  const n = (d.match(/-?\d+\.?\d*/g) || []).map(Number); const p: [number, number][] = [];
  for (let i = 0; i < n.length; i += 2) p.push([n[i], n[i + 1]]); return p;
};
const POLYS = CONTS.map(parse);
const inPoly = (x: number, y: number, poly: [number, number][]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const MAP_DOTS: { nx: number; ny: number }[] = [];
for (let x = 120; x < 900; x += 8.5) for (let y = 70; y < 450; y += 8.5)
  if (POLYS.some((p) => inPoly(x, y, p))) MAP_DOTS.push({ nx: (x - 120) / 780, ny: (y - 70) / 380 });

const smooth = (t: number) => t * t * (3 - 2 * t);
interface Cord { startY: number; off: number; amp: number; freq: number; phase: number }
const CORDS: Cord[] = [];
let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
// Each institution is a coherent RIBBON: its cords share frequency + phase and
// are merely offset in baseline, so they flow as ordered, parallel silk waves
// (not a tangle). Bands differ in phase/frequency → distinct layered wave groups.
BANDS.forEach((b, bi) => {
  const n = [13, 11, 9, 11, 13][bi];
  const freq = 1.5 + bi * 0.12;
  const phase = bi * 1.05 + 0.4;
  const bandAmp = 0.045 + Math.abs(bi - 2) * 0.012;
  for (let k = 0; k < n; k++) {
    const off = (k - (n - 1) / 2) * 0.011;
    CORDS.push({ startY: b, off, amp: bandAmp * (0.85 + rnd() * 0.3), freq, phase: phase + k * 0.05 });
  }
});
const pointOn = (c: Cord, t: number, W: number, H: number): [number, number] => {
  const x = SX0 + (CX - SX0) * t;
  const baseY = (c.startY + c.off) + (CY + c.off * 0.25 - (c.startY + c.off)) * smooth(t);
  const y = baseY + Math.sin(t * c.freq * 6.283 + c.phase) * c.amp * (1 - t * 0.7);
  return [x * W, y * H];
};

interface Code { c: number; t: number; sp: number; size: number; br: boolean }

export const HeroCanvas: React.FC<{ className?: string }> = ({ className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0, codes: Code[] = [], dots: { x: number; y: number }[] = [];

    const init = () => {
      dots = MAP_DOTS.map((d) => ({ x: (0.27 + d.nx * 0.68) * W, y: (0.1 + d.ny * 0.66) * H }));
      const per = 6;
      codes = [];
      for (let c = 0; c < CORDS.length; c++)
        for (let k = 0; k < per; k++) codes.push({ c, t: rnd(), sp: 0.0016 + rnd() * 0.0024, size: 0.6 + rnd() * 1.3, br: rnd() < 0.28 });
    };
    const resize = () => {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = Math.max(1, W * dpr); cv.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); init();
    };

    const tick = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(7,7,7,0.2)"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // dotted world map
      ctx.fillStyle = "rgba(233,200,120,0.13)";
      for (const d of dots) ctx.fillRect(d.x, d.y, 1.7, 1.7);

      // warm bloom on the right (seal side)
      const gx = 0.82 * W, gy = 0.5 * H;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 0.5 * W);
      g.addColorStop(0, "rgba(233,200,120,0.12)"); g.addColorStop(0.45, "rgba(233,200,120,0.03)"); g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

      // the cords — smooth, parallel silk-wave lines (the visible mesh)
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(233,200,120,0.12)";
      for (const c of CORDS) {
        ctx.beginPath();
        for (let i = 0; i <= 28; i++) { const [x, y] = pointOn(c, i / 28, W, H); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      }

      // travelling code particles converging on Submit
      for (const p of codes) {
        p.t += p.sp; if (p.t > 1) p.t -= 1;
        const [x, y] = pointOn(CORDS[p.c], p.t, W, H);
        const a = Math.min(1, p.t / 0.05) * Math.min(1, (1 - p.t) / 0.05 + 0.4);
        const col = p.br ? "255,231,173" : "233,200,120";
        ctx.fillStyle = `rgba(${col},${(0.5 * a).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, y, p.size, 0, 6.283); ctx.fill();
      }

      // convergence glow at Submit
      const cgx = CX * W, cgy = CY * H;
      const cg = ctx.createRadialGradient(cgx, cgy, 0, cgx, cgy, 0.08 * W);
      cg.addColorStop(0, "rgba(255,231,173,0.24)"); cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = cg; ctx.fillRect(cgx - 0.1 * W, cgy - 0.1 * W, 0.2 * W, 0.2 * W);

      raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(resize); ro.observe(cv); resize(); tick();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className={className} />;
};
