import React, { useEffect, useRef } from "react";

// Hero as a NETWORK visualization, not a workflow diagram. A wide gold dotted
// world map (with lat/long lines + node clusters) is the substrate; 50+ tapered
// strands enter off-screen-left, emerge from the map field, curve and MERGE
// (many dissipate) as they compress into a luminous SUBMIT nexus, then the SVG
// pipeline carries the flow to a dominant Official Record under a large bloom.
// Gold intensity rises left→right. Brand gold only.

const SUBMIT = { x: 0.264, y: 0.5 };                 // nexus (aligns with SVG Submit)
const SEALX = 0.83;                                  // Official Record (bloom centre)
const CARD_FX = [0.264, 0.339, 0.414, 0.500, 0.586, 0.672, SEALX]; // 6 cards + seal

// continents → map sample
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
let seed = 7;
const rnd = () => { seed = (seed * 1664525 + 1013904223) & 0x7fffffff; return seed / 0x7fffffff; };
// denser dotted map (≈4× density), normalised to continent bbox 120..900 × 70..450
const MAP_DOTS: { nx: number; ny: number }[] = [];
for (let x = 120; x < 900; x += 5) for (let y = 70; y < 450; y += 5)
  if (POLYS.some((p) => inPoly(x, y, p))) MAP_DOTS.push({ nx: (x - 120) / 780, ny: (y - 70) / 380 });
// node-density clusters (no labels) — rough city positions in the same space
const CLUSTERS: [number, number][] = [[210, 150], [470, 130], [560, 150], [690, 175], [770, 155], [560, 270], [800, 365], [300, 300]];
const CLUSTER_DOTS: { nx: number; ny: number }[] = [];
for (const [cx, cy] of CLUSTERS) for (let i = 0; i < 18; i++)
  CLUSTER_DOTS.push({ nx: (cx + (rnd() - 0.5) * 34 - 120) / 780, ny: (cy + (rnd() - 0.5) * 34 - 70) / 380 });

// ── strands: off-screen-left → curved/merging → SUBMIT nexus ────────────────
interface Strand { x0: number; y0: number; ex: number; ey: number; cx: number; cy: number; maxT: number; reach: boolean }
const STRANDS: Strand[] = [];
const NEXUSX = 0.238;                                                 // nexus band = Submit's left face
const NS = 60;
for (let k = 0; k < NS; k++) {
  const upper = k % 2 === 0;
  const x0 = -0.14 + rnd() * 0.20;                                    // off-screen-left
  const y0 = upper ? rnd() * 0.42 : 0.58 + rnd() * 0.42;
  const ey = 0.5 + (y0 - 0.5) * 0.14 + (rnd() - 0.5) * 0.03;          // compressed into a nexus BAND (nested, not a point)
  const ex = NEXUSX + rnd() * 0.02;
  const mx = x0 + (ex - x0) * (0.42 + rnd() * 0.16);
  const my = y0 + (ey - y0) * 0.5 + (rnd() - 0.5) * 0.04;
  const cx = mx - (0.05 + rnd() * 0.10);                              // bow LEFT → each strand a ")" arc convex toward the pipeline
  const r = rnd();
  const maxT = 0.42 + r * r * 0.58;                                   // skewed: many dissipate early (compression)
  STRANDS.push({ x0, y0, ex, ey, cx, cy: my, maxT, reach: maxT > 0.86 });
}
const sPoint = (s: Strand, t: number): [number, number] => {
  const mt = 1 - t;
  return [mt * mt * s.x0 + 2 * mt * t * s.cx + t * t * s.ex, mt * mt * s.y0 + 2 * mt * t * s.cy + t * t * s.ey];
};

interface Code { s: number; t: number; sp: number; size: number; br: boolean }
interface Pp { g: number; t: number; sp: number; size: number }

export const HeroCanvas: React.FC<{ className?: string }> = ({ className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0;
    let dots: { x: number; y: number; a: number }[] = [], codes: Code[] = [], pps: Pp[] = [];

    const init = () => {
      const mk = (d: { nx: number; ny: number }, a: number) => ({ x: (0.02 + d.nx * 0.94) * W, y: (0.07 + d.ny * 0.72) * H, a });
      dots = [...MAP_DOTS.map((d) => mk(d, 0.085)), ...CLUSTER_DOTS.map((d) => mk(d, 0.16))];
      codes = [];
      for (let s = 0; s < STRANDS.length; s++) { const n = 2 + Math.floor(STRANDS[s].maxT * 7); for (let k = 0; k < n; k++) codes.push({ s, t: rnd() * STRANDS[s].maxT, sp: 0.0016 + rnd() * 0.0026, size: 0.6 + rnd() * 1.2, br: rnd() < 0.3 }); }
      pps = [];
      for (let g = 0; g < CARD_FX.length - 1; g++) for (let k = 0; k < 4; k++) pps.push({ g, t: rnd(), sp: 0.004 + rnd() * 0.004, size: 0.8 + rnd() * 1.1 });
    };
    const resize = () => {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = Math.max(1, W * dpr); cv.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); init();
    };

    const tick = () => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(7,7,7,0.22)"; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";

      // world map: lat/long lines + dots + clusters
      ctx.strokeStyle = "rgba(233,200,120,0.035)"; ctx.lineWidth = 1;
      for (let i = 1; i < 6; i++) { const y = (0.1 + i * 0.13) * H; ctx.beginPath(); for (let x = 0.04; x < 0.96; x += 0.02) ctx.lineTo(x * W, y + Math.sin(x * 6) * 0.012 * H); ctx.stroke(); }
      for (let i = 1; i < 11; i++) { const x = (0.06 + i * 0.085) * W; ctx.beginPath(); ctx.moveTo(x, 0.08 * H); ctx.lineTo(x, 0.82 * H); ctx.stroke(); }
      for (const d of dots) { ctx.fillStyle = `rgba(233,200,120,${d.a})`; ctx.fillRect(d.x, d.y, 1.6, 1.6); }

      // giant destination bloom (sunrise behind the Official Record)
      const bx = SEALX * W, by = 0.5 * H;
      const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, 0.62 * W);
      bloom.addColorStop(0, "rgba(233,200,120,0.20)"); bloom.addColorStop(0.4, "rgba(233,200,120,0.05)"); bloom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bloom; ctx.fillRect(0, 0, W, H);

      // strands: curved, tapered, merging into the Submit nexus; brighter left→right
      for (const s of STRANDS) {
        const N = 20; let prev = sPoint(s, 0);
        for (let i = 1; i <= N; i++) {
          const tp = i / N, t = tp * s.maxT;
          const [x, y] = sPoint(s, t);
          const tipFade = (!s.reach && tp > 0.7) ? 1 - (tp - 0.7) / 0.3 : 1;   // short strands dissipate
          ctx.strokeStyle = `rgba(233,200,120,${((0.03 + 0.2 * t) * tipFade).toFixed(3)})`;
          ctx.lineWidth = 0.4 + 1.2 * t;
          ctx.beginPath(); ctx.moveTo(prev[0] * W, prev[1] * H); ctx.lineTo(x * W, y * H); ctx.stroke();
          prev = [x, y];
        }
      }

      // Submit nexus bloom (energy router)
      const nx = SUBMIT.x * W, ny = SUBMIT.y * H;
      const nexus = ctx.createRadialGradient(nx, ny, 0, nx, ny, 0.1 * W);
      nexus.addColorStop(0, "rgba(255,231,173,0.3)"); nexus.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = nexus; ctx.fillRect(nx - 0.13 * W, ny - 0.13 * W, 0.26 * W, 0.26 * W);

      // code particles flowing inward to the nexus (brighter as they arrive)
      for (const p of codes) {
        const s = STRANDS[p.s];
        p.t += p.sp; if (p.t > s.maxT) p.t -= s.maxT;
        const [x, y] = sPoint(s, p.t);
        const col = p.br ? "255,231,173" : "233,200,120";
        ctx.fillStyle = `rgba(${col},${(0.12 + 0.5 * p.t).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x * W, y * H, p.size, 0, 6.283); ctx.fill();
      }

      // pipeline momentum: particles between every stage, brighter toward the seal
      for (const p of pps) {
        p.t += p.sp; if (p.t > 1) p.t -= 1;
        const x = (CARD_FX[p.g] + (CARD_FX[p.g + 1] - CARD_FX[p.g]) * p.t) * W;
        const a = 0.3 + 0.5 * (p.g / (CARD_FX.length - 1));
        ctx.fillStyle = `rgba(255,231,173,${a.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x, 0.5 * H, p.size, 0, 6.283); ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    const ro = new ResizeObserver(resize); ro.observe(cv); resize(); tick();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className={className} />;
};
