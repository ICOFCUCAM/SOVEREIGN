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

// ── reverse river delta: a layered thread mesh born BETWEEN institution lanes,
// compressing through a funnel into one bright convergence node at Submit ──────
const FOCAL = { x: 0.236, y: 0.5 };                  // convergence node — touches the Submit card
// Layer 1 — five institution lanes (the only true source paths). Each lane runs
// from its node toward the focal; threads are generated in the space BETWEEN them.
const LANES = INST_Y.map((oy) => ({ sx: 0.10, sy: oy }));

interface Strand {
  x0: number; y0: number;       // birth point between two adjacent lanes
  c1x: number; c1y: number;     // control 1 — long large-radius curve, weaving between lanes
  c2x: number; c2y: number;     // control 2 — funnel compression toward the focal
  ex: number; ey: number;       // mouth of the funnel at the convergence node
  maxT: number;                 // length (tertiary threads fall short)
  width: number;                // thickness by class
  bright: number;               // base opacity by class (stacked 10/20/35/60/100%)
  cls: number;                  // 0 primary · 1 secondary · 2 tertiary
}
const STRANDS: Strand[] = [];
const NS = 80;
for (let k = 0; k < NS; k++) {
  // birth BETWEEN adjacent lanes: pick a lane pair and a position between them
  const li = Math.min(LANES.length - 2, Math.floor(rnd() * (LANES.length - 1)));
  const f = rnd();                                            // 0..1 between lane li and li+1
  const baseY = LANES[li].sy + (LANES[li + 1].sy - LANES[li].sy) * f;
  const x0 = 0.06 + rnd() * 0.06;                             // around/right of the icons → long horizontal run
  const y0 = baseY + (rnd() - 0.5) * 0.02;
  // control 1: long horizontal lead-out, weaving toward a neighbouring lane (stays near birth height)
  const weave = (rnd() < 0.5 ? -1 : 1) * (0.01 + rnd() * 0.028);
  const c1x = x0 + 0.05 + rnd() * 0.05;
  const c1y = baseY + weave;
  // control 2: y-compression is mostly DONE here (large-radius S), so the final approach
  // into the focal is nearly horizontal — a long flat delta, not a radial burst
  const c2x = 0.205 + rnd() * 0.022;
  const c2y = FOCAL.y + (baseY - FOCAL.y) * (0.06 + rnd() * 0.06) + (rnd() - 0.5) * 0.014;
  // mouth: very tight nested band at the convergence node (the narrow end of the funnel)
  const ex = FOCAL.x + (rnd() - 0.5) * 0.006;
  const ey = FOCAL.y + (baseY - FOCAL.y) * 0.03 + (rnd() - 0.5) * 0.01;
  const r = rnd();
  const cls = r < 0.15 ? 0 : r < 0.5 ? 1 : 2;                 // primary / secondary / tertiary
  const width = cls === 0 ? 1.4 + rnd() * 0.5 : cls === 1 ? 0.8 + rnd() * 0.25 : 0.4 + rnd() * 0.2;
  const bright = cls === 0 ? 0.4 : cls === 1 ? 0.2 : 0.08;    // stacked opacity hierarchy (soft, not spiky)
  const maxT = cls === 2 ? 0.7 + rnd() * 0.3 : 0.94 + rnd() * 0.06;
  STRANDS.push({ x0, y0, c1x, c1y, c2x, c2y, ex, ey, maxT, width, bright, cls });
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
      for (let i = 0; i < 80; i++) noise.push({ x: rnd() * W, y: rnd() * H, vx: (rnd() - 0.5) * 0.08, vy: (rnd() - 0.5) * 0.06, size: rnd() * 0.9 + 0.3, a: 0.04 + rnd() * 0.12 });
      // gold dust concentrated around the funnel, drifting rightward into the convergence node
      for (let i = 0; i < 55; i++) noise.push({ x: (0.10 + rnd() * 0.14) * W, y: (FOCAL.y + (rnd() - 0.5) * 0.34) * H, vx: 0.05 + rnd() * 0.14, vy: (rnd() - 0.5) * 0.05, size: rnd() * 0.8 + 0.25, a: 0.05 + rnd() * 0.14 });
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

      // soft glow at each institution node + Layer 1: the five institution lanes
      for (const oy of INST_Y) {
        const gx = INSTX * W, gy = oy * H;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 0.055 * W);
        g.addColorStop(0, "rgba(233,200,120,0.10)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(gx - 0.07 * W, gy - 0.07 * W, 0.14 * W, 0.14 * W);
      }
      ctx.strokeStyle = "rgba(233,200,120,0.07)"; ctx.lineWidth = 1;
      for (const ln of LANES) {
        ctx.beginPath();
        ctx.moveTo(ln.sx * W, ln.sy * H);
        ctx.bezierCurveTo(0.17 * W, ln.sy * H, 0.20 * W, FOCAL.y * H, FOCAL.x * W, FOCAL.y * H);
        ctx.stroke();
      }

      // volumetric funnel bloom — luminous atmosphere collapsing toward the focal
      const vg = ctx.createRadialGradient(0.185 * W, FOCAL.y * H, 0, 0.185 * W, FOCAL.y * H, 0.17 * W);
      vg.addColorStop(0, "rgba(233,200,120,0.07)"); vg.addColorStop(0.5, "rgba(233,200,120,0.025)"); vg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.translate(0.185 * W, FOCAL.y * H); ctx.scale(1, 0.42); ctx.translate(-0.185 * W, -FOCAL.y * H);
      ctx.fillStyle = vg; ctx.fillRect(0.02 * W, FOCAL.y * H - 0.2 * W, 0.34 * W, 0.4 * W); ctx.restore();

      // the delta mesh: layered Bézier threads (primary/secondary/tertiary), white→gold,
      // brightness ramping toward the focal so density/energy rises into governance
      for (const s of STRANDS) {
        const N = 30; let prev = sPoint(s, 0);
        for (let i = 1; i <= N; i++) {
          const tp = i / N, t = tp * s.maxT;
          const [x, y] = sPoint(s, t);
          const tipFade = (s.cls === 2 && tp > 0.7) ? 1 - (tp - 0.7) / 0.3 : 1;  // tertiary threads fade out
          const a = (0.04 + 0.3 * t + 0.22 * t * t) * s.bright * tipFade;        // visible along length, energy rises toward focal
          const g = (255 - 55 * t) | 0, b = (255 - 135 * t) | 0;                 // white at source → warm gold at the mouth
          ctx.strokeStyle = `rgba(255,${g},${b},${a.toFixed(3)})`;
          ctx.lineWidth = s.width * (0.5 + 0.7 * t);
          ctx.beginPath(); ctx.moveTo(prev[0] * W, prev[1] * H); ctx.lineTo(x * W, y * H); ctx.stroke();
          prev = [x, y];
        }
      }

      // convergence node — the single brightest object on the left half, touching Submit
      const mx = FOCAL.x * W, my = FOCAL.y * H;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 520);
      const merge = ctx.createRadialGradient(mx, my, 0, mx, my, 0.12 * W);
      merge.addColorStop(0, "rgba(255,242,205,0.5)"); merge.addColorStop(0.22, "rgba(255,224,150,0.22)");
      merge.addColorStop(0.55, "rgba(233,200,120,0.07)"); merge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = merge; ctx.fillRect(mx - 0.17 * W, my - 0.17 * W, 0.34 * W, 0.34 * W);
      const core = ctx.createRadialGradient(mx, my, 0, mx, my, 0.042 * W);
      core.addColorStop(0, `rgba(255,250,232,${(0.4 + 0.2 * pulse).toFixed(3)})`); core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core; ctx.fillRect(mx - 0.06 * W, my - 0.06 * W, 0.12 * W, 0.12 * W);

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
