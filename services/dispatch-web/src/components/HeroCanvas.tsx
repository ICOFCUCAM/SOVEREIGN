import React, { useEffect, useRef } from "react";

// Atmospheric layer (canvas). The institutional "cords" — guitar-string-like
// strands — fan out from the five institution rows on the left and CONVERGE at
// the SUBMIT card; bright "code" particles travel along them toward that point.
// From Submit, the crisp SVG pipeline carries the flow right to the seal. Plus a
// dim gold dotted world map and a warm bloom on the right. Brand gold only.

// convergence point (matches SUBMIT in the SVG overlay: x≈0.28 of width, centre)
const CX = 0.28, CY = 0.5, SX0 = 0.0;
// two silk bands flow from the far left, draw together near SUBMIT (CX) and
// stretch through cards 1→3, fading by APPROVE
const XEND = 0.40;
const TC = (CX - SX0) / (XEND - SX0); // path fraction at Submit (~0.61)

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
interface Cord { y0: number; y1: number; hump: number; sign: number; amp: number; freq: number; phase: number }
const CORDS: Cord[] = [];
let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
// Benchmark mesh = one big wave on the left in two halves funnelling into SUBMIT:
// an UPPER half that rises to a CREST (peak near x≈13%) then breaks down into the
// pipeline, and a larger LOWER half that dips into a TROUGH then sweeps up. Nested
// gold contour lines, densest at the crest/trough; fading by ~Govern.
const NB = 24;
for (let k = 0; k < NB; k++) {
  const u = k / (NB - 1);              // 0 = outer (bigger), 1 = inner
  const amp = 0.004 + rnd() * 0.008;
  const freq = 0.8 + rnd() * 1.2;
  CORDS.push({ y0: 0.30 + u * 0.10, y1: 0.44 + u * 0.05, hump: 0.22 - u * 0.12, sign: -1, amp, freq, phase: rnd() * 6.28 }); // upper crest
  CORDS.push({ y0: 0.70 - u * 0.10, y1: 0.56 - u * 0.05, hump: 0.30 - u * 0.16, sign: 1, amp, freq, phase: rnd() * 6.28 });  // lower trough
}
const pointOn = (c: Cord, t: number, W: number, H: number): [number, number] => {
  const x = SX0 + (XEND - SX0) * t;
  const base = c.y0 + (c.y1 - c.y0) * smooth(t);
  const crest = c.hump * Math.sin(Math.sqrt(t) * Math.PI); // peak near t≈0.25, zero at ends
  const wave = Math.sin(t * c.freq * 6.283 + c.phase) * c.amp * (1 - t * 0.5);
  return [x * W, (base + c.sign * crest + wave) * H];
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

      // the cords — S-waves converging at Submit then stretching through cards 1→3
      ctx.lineWidth = 1;
      for (const c of CORDS) {
        ctx.strokeStyle = "rgba(233,200,120,0.16)";          // phase 1: source → Submit
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) { const [x, y] = pointOn(c, (i / 20) * TC, W, H); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.strokeStyle = "rgba(233,200,120,0.08)";          // phase 2: Submit → Approve, fading
        ctx.beginPath();
        for (let i = 0; i <= 14; i++) { const [x, y] = pointOn(c, TC + (i / 14) * (1 - TC), W, H); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
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
