import React, { useEffect, useRef } from "react";

// Hero atmosphere: a reverse river delta. Five institution lanes feed a layered
// thread mesh that TRAVELS as distributed rivers (preserving lane identity), then
// COMPRESSES — only late — into a restrained convergence that hands off to the
// brightest card, SUBMIT. The world map is part of the flow field; gold dust and
// micro-particles keep the whole canvas quietly active. Gold rises left→right to
// the Official Record. Governance is what merges the institutional streams.

const SEALX = 0.832;                                 // Official Record = light source on the right
const CARD_FX = [0.2986, 0.3736, 0.4486, 0.5347, 0.6208, 0.7069, SEALX]; // 6 cards + seal

// institution origins (match HeroVisual circles, moved left): x≈0.044, 5 lanes
const INSTX = 0.044;
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
const FOCAL = { x: 0.262, y: 0.5 };                  // restrained convergence — leads INTO the Submit card
const COMPRESS_X = 0.205;                             // compression zone begins here; left of it = travel zone

interface Strand {
  x0: number; y0: number;       // birth at the institution lane
  c1x: number; c1y: number;     // control 1 — long horizontal travel at lane height (identity preserved)
  c2x: number; c2y: number;     // control 2 — late compression toward the centre line
  ex: number; ey: number;       // mouth at the convergence, just left of Submit
  maxT: number;                 // length (tertiary threads fall short)
  width: number;                // thickness by class
  bright: number;               // base opacity by class
  cls: number;                  // 0 primary · 1 secondary · 2 tertiary
  amp: number; freq: number; ph: number;  // river meander (perpendicular wander, fades on compression)
}
const STRANDS: Strand[] = [];
// Per-lane BUNDLES travel as distinct rivers, keeping institutional identity through
// the travel zone, then compress late. Plus a few inter-lane threads weave the mesh.
const mkStrand = (laneY: number, neighbourY: number, identity: number): Strand => {
  const x0 = INSTX + 0.03 + rnd() * 0.03;                     // leaves from its lane, right of the icon
  const y0 = laneY + (rnd() - 0.5) * 0.03;
  // travel zone: stay near lane height (blend slightly toward a neighbour for the mesh weave)
  const travelY = laneY + (neighbourY - laneY) * (1 - identity) * rnd();
  const c1x = 0.11 + rnd() * 0.07;
  const c1y = travelY + (rnd() - 0.5) * 0.03;
  // late compression toward the centre line — only in the last stretch
  const c2x = COMPRESS_X + rnd() * 0.03;
  const c2y = FOCAL.y + (travelY - FOCAL.y) * (0.18 + rnd() * 0.12) + (rnd() - 0.5) * 0.02;
  const ex = FOCAL.x + (rnd() - 0.5) * 0.008;
  const ey = FOCAL.y + (laneY - FOCAL.y) * 0.04 + (rnd() - 0.5) * 0.014;
  const r = rnd();
  const cls = r < 0.16 ? 0 : r < 0.52 ? 1 : 2;
  const width = cls === 0 ? 1.3 + rnd() * 0.5 : cls === 1 ? 0.75 + rnd() * 0.25 : 0.4 + rnd() * 0.2;
  const bright = cls === 0 ? 0.4 : cls === 1 ? 0.2 : 0.08;
  const maxT = cls === 2 ? 0.72 + rnd() * 0.28 : 0.95 + rnd() * 0.05;
  return { x0, y0, c1x, c1y, c2x, c2y, ex, ey, maxT, width, bright, cls,
    amp: 0.006 + rnd() * 0.014, freq: 1.4 + rnd() * 1.8, ph: rnd() * 6.28 };
};
for (let li = 0; li < INST_Y.length; li++) {
  const laneY = INST_Y[li];
  const above = INST_Y[Math.max(0, li - 1)], below = INST_Y[Math.min(INST_Y.length - 1, li + 1)];
  // dense bundle that keeps this lane's identity (high identity = stays in its lane)
  for (let k = 0; k < 13; k++) STRANDS.push(mkStrand(laneY, rnd() < 0.5 ? above : below, 0.78 + rnd() * 0.18));
  // a few inter-lane weave threads (lower identity → blend toward neighbour) for the mesh
  for (let k = 0; k < 4; k++) STRANDS.push(mkStrand(laneY, rnd() < 0.5 ? above : below, 0.35 + rnd() * 0.25));
}
const sPoint = (s: Strand, t: number, tm = 0): [number, number] => {
  const mt = 1 - t, a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
  const x = a * s.x0 + b * s.c1x + c * s.c2x + d * s.ex;
  let y = a * s.y0 + b * s.c1y + c * s.c2y + d * s.ey;
  // river meander: perpendicular wander, windowed to 0 at both ends, fading as it compresses
  const window = Math.sin(Math.PI * t) * (1 - t * 0.7);
  y += s.amp * Math.sin(s.freq * t * 6.283 + s.ph + tm) * window;
  return [x, y];
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
      // map is part of the flow field: dots brighten inside the travel band (x<0.34, mid-height)
      const mk = (d: { nx: number; ny: number }, base: number) => {
        const x = (0.02 + d.nx * 0.94) * W, y = (0.07 + d.ny * 0.72) * H;
        const inFlow = x < 0.34 * W && Math.abs(y - FOCAL.y * H) < 0.26 * H;
        return { x, y, a: base * (inFlow ? 1.9 : 1) };
      };
      dots = [...MAP_DOTS.map((d) => mk(d, 0.1)), ...CLUSTER_DOTS.map((d) => mk(d, 0.18))];
      codes = [];
      for (let s = 0; s < STRANDS.length; s++) { const n = 2 + Math.floor(STRANDS[s].maxT * 6); for (let k = 0; k < n; k++) codes.push({ s, t: rnd() * STRANDS[s].maxT, sp: 0.0018 + rnd() * 0.003, size: 0.6 + rnd() * 1.2, br: rnd() < 0.3 }); }
      pps = [];
      for (let g = 0; g < CARD_FX.length - 1; g++) for (let k = 0; k < 4; k++) pps.push({ g, t: rnd(), sp: 0.004 + rnd() * 0.004, size: 0.8 + rnd() * 1.1 });
      // ambient particle noise — micro-particles everywhere so the whole canvas is quietly active
      noise = [];
      for (let i = 0; i < 150; i++) noise.push({ x: rnd() * W, y: rnd() * H, vx: (rnd() - 0.5) * 0.08, vy: (rnd() - 0.5) * 0.06, size: rnd() * 0.85 + 0.25, a: 0.03 + rnd() * 0.1 });
      // gold dust concentrated around the travel zone, drifting rightward into the convergence
      for (let i = 0; i < 70; i++) noise.push({ x: (0.07 + rnd() * 0.18) * W, y: (FOCAL.y + (rnd() - 0.5) * 0.36) * H, vx: 0.05 + rnd() * 0.13, vy: (rnd() - 0.5) * 0.05, size: rnd() * 0.75 + 0.2, a: 0.04 + rnd() * 0.12 });
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

      // faint atmospheric gold haze — the whole canvas is active, never dead black
      const haze = ctx.createLinearGradient(0, 0, W, 0);
      haze.addColorStop(0, "rgba(233,200,120,0.012)"); haze.addColorStop(0.5, "rgba(233,200,120,0.022)"); haze.addColorStop(1, "rgba(233,200,120,0.01)");
      ctx.fillStyle = haze; ctx.fillRect(0, 0, W, H);

      // world map: lat/long grid (kept well below the flow) + dots + clusters
      ctx.strokeStyle = "rgba(233,200,120,0.02)"; ctx.lineWidth = 1;
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
      ctx.strokeStyle = "rgba(233,200,120,0.06)"; ctx.lineWidth = 1;
      for (const oy of INST_Y) {
        ctx.beginPath();
        ctx.moveTo(INSTX * W, oy * H);
        ctx.bezierCurveTo(0.14 * W, oy * H, COMPRESS_X * W, FOCAL.y * H, FOCAL.x * W, FOCAL.y * H);
        ctx.stroke();
      }

      // restrained volumetric bloom along the travel zone (compression, not explosion)
      const vg = ctx.createRadialGradient(0.17 * W, FOCAL.y * H, 0, 0.17 * W, FOCAL.y * H, 0.18 * W);
      vg.addColorStop(0, "rgba(233,200,120,0.04)"); vg.addColorStop(0.5, "rgba(233,200,120,0.016)"); vg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save(); ctx.translate(0.17 * W, FOCAL.y * H); ctx.scale(1, 0.5); ctx.translate(-0.17 * W, -FOCAL.y * H);
      ctx.fillStyle = vg; ctx.fillRect(0.02 * W, FOCAL.y * H - 0.22 * W, 0.36 * W, 0.44 * W); ctx.restore();

      // the river mesh: lane bundles travel (identity preserved) then compress; meander makes
      // them read as rivers, not beams; white→gold as they approach governance
      const tm = Date.now() / 2600;
      for (const s of STRANDS) {
        const N = 32; let prev = sPoint(s, 0, tm);
        for (let i = 1; i <= N; i++) {
          const tp = i / N, t = tp * s.maxT;
          const [x, y] = sPoint(s, t, tm);
          const tipFade = (s.cls === 2 && tp > 0.7) ? 1 - (tp - 0.7) / 0.3 : 1;  // tertiary threads fade out
          const a = (0.04 + 0.28 * t + 0.2 * t * t) * s.bright * tipFade;        // energy rises toward governance
          const g = (255 - 55 * t) | 0, b = (255 - 135 * t) | 0;                 // white at source → warm gold near Submit
          ctx.strokeStyle = `rgba(255,${g},${b},${a.toFixed(3)})`;
          ctx.lineWidth = s.width * (0.5 + 0.7 * t);
          ctx.beginPath(); ctx.moveTo(prev[0] * W, prev[1] * H); ctx.lineTo(x * W, y * H); ctx.stroke();
          prev = [x, y];
        }
      }

      // convergence — restrained (dimmer than Submit): a gentle compression that hands off,
      // not a flashbang. Submit (drawn in the SVG overlay) is the true focal node.
      const mx = FOCAL.x * W, my = FOCAL.y * H;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 600);
      const merge = ctx.createRadialGradient(mx, my, 0, mx, my, 0.085 * W);
      merge.addColorStop(0, "rgba(255,236,190,0.18)"); merge.addColorStop(0.3, "rgba(233,200,120,0.07)");
      merge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = merge; ctx.fillRect(mx - 0.11 * W, my - 0.11 * W, 0.22 * W, 0.22 * W);
      const core = ctx.createRadialGradient(mx, my, 0, mx, my, 0.026 * W);
      core.addColorStop(0, `rgba(255,246,222,${(0.16 + 0.1 * pulse).toFixed(3)})`); core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core; ctx.fillRect(mx - 0.04 * W, my - 0.04 * W, 0.08 * W, 0.08 * W);

      // particles travelling INSIDE the rivers toward governance (white→gold, brighter on arrival)
      for (const p of codes) {
        const s = STRANDS[p.s];
        p.t += p.sp; if (p.t > s.maxT) p.t -= s.maxT;
        const [x, y] = sPoint(s, p.t, tm);
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
