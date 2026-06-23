import React, { useEffect, useRef } from "react";

// Hero atmosphere: many information SOURCES becoming one governed PROCESS.
// A faint gold dotted world map is the substrate. Each of the 5 institution
// nodes (visible, on-screen, left) is the origin of a RIBBON — 8–15 strands
// that emerge from around the node, interweave organically, and COMPRESS
// toward Submit. Strands vary in curvature, thickness, brightness and length;
// particles travel inside them. A bright convergence field sits immediately
// before Submit, where every ribbon merges into one controlled stream that the
// SVG pipeline carries to a dominant Official Record. Gold rises left→right.

const SEALX = 0.832;                                 // Official Record = light source on the right
const CARD_FX = [0.264, 0.339, 0.414, 0.500, 0.586, 0.672, SEALX]; // 6 cards + seal
const MERGEX = 0.232;                                // convergence field — just left of Submit

// institution origins (match HeroVisual circles): x≈0.082, 5 lanes
const INSTX = 0.082;
const INST_Y = [0.275, 0.388, 0.5, 0.613, 0.725];

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

// ── ribbons: each institution → 8–15 interweaving strands → Submit merge ─────
interface Strand {
  x0: number; y0: number;       // origin around the institution node
  c1x: number; c1y: number;     // control 1 — fan out around the node
  c2x: number; c2y: number;     // control 2 — interweave + start compressing
  ex: number; ey: number;       // end inside the merge field before Submit
  maxT: number;                 // length (some strands fall short → dissipate)
  width: number;                // thickness
  bright: number;               // brightness multiplier
  reach: boolean;               // reaches the merge field
}
const STRANDS: Strand[] = [];
for (let inst = 0; inst < INST_Y.length; inst++) {
  const oy = INST_Y[inst];
  const n = 9 + Math.floor(rnd() * 7);                         // 9–15 strands per ribbon
  for (let k = 0; k < n; k++) {
    const spread = (k / (n - 1) - 0.5);                        // -0.5..0.5 across the ribbon
    // origin: a FOCUSED point just right of the node that spreads into many fine lines
    const x0 = INSTX + 0.016 + (rnd() - 0.5) * 0.006;
    const y0 = oy + spread * 0.020 + (rnd() - 0.5) * 0.006;
    // control 1: water-like spread mid-flight (flows rightward, gentle wave — not a high fan)
    const c1x = INSTX + 0.08 + rnd() * 0.07;
    const c1y = oy + spread * (0.05 + rnd() * 0.08) + (rnd() - 0.5) * 0.03;
    // control 2: interweave and compress toward the lane centre
    const c2x = 0.158 + rnd() * 0.045;
    const c2y = 0.5 + (oy - 0.5) * (0.28 + rnd() * 0.2) + (rnd() - 0.5) * 0.05;
    // end: nested band inside the merge field (not a single point)
    const ex = MERGEX + (rnd() - 0.5) * 0.016;
    const ey = 0.5 + (oy - 0.5) * 0.06 + (rnd() - 0.5) * 0.03;
    const r = rnd();
    const maxT = 0.6 + r * r * 0.4;                            // varied length, skewed long
    STRANDS.push({
      x0, y0, c1x, c1y, c2x, c2y, ex, ey, maxT,
      width: 0.3 + rnd() * 0.9,                                // fine strands
      bright: 0.55 + rnd() * 0.85,                             // varied brightness
      reach: maxT > 0.92,
    });
  }
}
const sPoint = (s: Strand, t: number): [number, number] => {
  const mt = 1 - t, a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
  return [a * s.x0 + b * s.c1x + c * s.c2x + d * s.ex, a * s.y0 + b * s.c1y + c * s.c2y + d * s.ey];
};

interface Code { s: number; t: number; sp: number; size: number; br: boolean }
interface Pp { g: number; t: number; sp: number; size: number }
interface Noise { x: number; y: number; vx: number; vy: number; size: number; a: number }

export const HeroCanvas: React.FC<{ className?: string }> = ({ className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0;
    let dots: { x: number; y: number; a: number }[] = [], codes: Code[] = [], pps: Pp[] = [], noise: Noise[] = [];

    const init = () => {
      const mk = (d: { nx: number; ny: number }, a: number) => ({ x: (0.02 + d.nx * 0.94) * W, y: (0.07 + d.ny * 0.72) * H, a });
      dots = [...MAP_DOTS.map((d) => mk(d, 0.085)), ...CLUSTER_DOTS.map((d) => mk(d, 0.16))];
      codes = [];
      for (let s = 0; s < STRANDS.length; s++) { const n = 2 + Math.floor(STRANDS[s].maxT * 6); for (let k = 0; k < n; k++) codes.push({ s, t: rnd() * STRANDS[s].maxT, sp: 0.0018 + rnd() * 0.003, size: 0.6 + rnd() * 1.2, br: rnd() < 0.3 }); }
      pps = [];
      for (let g = 0; g < CARD_FX.length - 1; g++) for (let k = 0; k < 4; k++) pps.push({ g, t: rnd(), sp: 0.004 + rnd() * 0.004, size: 0.8 + rnd() * 1.1 });
      // ambient particle noise — tiny floating motes drifting throughout, makes the field alive
      noise = [];
      for (let i = 0; i < 90; i++) noise.push({ x: rnd() * W, y: rnd() * H, vx: (rnd() - 0.5) * 0.08, vy: (rnd() - 0.5) * 0.06, size: rnd() * 0.9 + 0.3, a: 0.04 + rnd() * 0.12 });
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

      // ambient particle noise — slow floating motes throughout the field
      for (const m of noise) {
        m.x += m.vx; m.y += m.vy;
        if (m.x < 0) m.x += W; else if (m.x > W) m.x -= W;
        if (m.y < 0) m.y += H; else if (m.y > H) m.y -= H;
        ctx.fillStyle = `rgba(233,200,120,${m.a})`;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.size, 0, 6.283); ctx.fill();
      }

      // giant destination bloom (sunrise behind the Official Record)
      const bx = SEALX * W, by = 0.5 * H;
      const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, 0.62 * W);
      bloom.addColorStop(0, "rgba(233,200,120,0.20)"); bloom.addColorStop(0.4, "rgba(233,200,120,0.05)"); bloom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bloom; ctx.fillRect(0, 0, W, H);

      // soft glow at each institution node (the ribbon's source)
      for (const oy of INST_Y) {
        const gx = INSTX * W, gy = oy * H;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 0.06 * W);
        g.addColorStop(0, "rgba(233,200,120,0.10)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(gx - 0.07 * W, gy - 0.07 * W, 0.14 * W, 0.14 * W);
      }

      // ribbons: fine WHITE strands from each institution that flow like water, interweave
      // and compress into the merge; colour shifts white→gold as they converge (govern)
      for (const s of STRANDS) {
        const N = 28; let prev = sPoint(s, 0);
        for (let i = 1; i <= N; i++) {
          const tp = i / N, t = tp * s.maxT;
          const [x, y] = sPoint(s, t);
          const tipFade = (!s.reach && tp > 0.74) ? 1 - (tp - 0.74) / 0.26 : 1;  // short strands dissipate
          const a = (0.03 + 0.17 * t) * s.bright * tipFade;
          const g = (255 - 55 * t) | 0, b = (255 - 135 * t) | 0;                 // white at source → warm gold at merge
          ctx.strokeStyle = `rgba(255,${g},${b},${a.toFixed(3)})`;
          ctx.lineWidth = s.width * (0.5 + 0.8 * t);                             // taper: thin at source, full at merge
          ctx.beginPath(); ctx.moveTo(prev[0] * W, prev[1] * H); ctx.lineTo(x * W, y * H); ctx.stroke();
          prev = [x, y];
        }
      }

      // bright convergence field — where all ribbons merge into one governed stream
      const mx = MERGEX * W, my = 0.5 * H;
      const merge = ctx.createRadialGradient(mx, my, 0, mx, my, 0.11 * W);
      merge.addColorStop(0, "rgba(255,231,173,0.42)"); merge.addColorStop(0.35, "rgba(233,200,120,0.16)"); merge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = merge; ctx.fillRect(mx - 0.16 * W, my - 0.16 * W, 0.32 * W, 0.32 * W);
      // hot core pulsing into Submit
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 520);
      const core = ctx.createRadialGradient((MERGEX + 0.012) * W, my, 0, (MERGEX + 0.012) * W, my, 0.045 * W);
      core.addColorStop(0, `rgba(255,240,200,${(0.35 + 0.25 * pulse).toFixed(3)})`); core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core; ctx.fillRect((MERGEX - 0.04) * W, my - 0.06 * W, 0.12 * W, 0.12 * W);

      // particles travelling INSIDE the strands toward the merge (white→gold, brighter on arrival)
      for (const p of codes) {
        const s = STRANDS[p.s];
        p.t += p.sp; if (p.t > s.maxT) p.t -= s.maxT;
        const [x, y] = sPoint(s, p.t);
        const norm = p.t / s.maxT;
        const g = (255 - 50 * norm) | 0, b = (255 - 130 * norm) | 0;
        ctx.fillStyle = `rgba(255,${g},${b},${(0.12 + 0.5 * norm).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(x * W, y * H, p.size * (p.br ? 1.3 : 1), 0, 6.283); ctx.fill();
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
