import React, { useEffect, useRef } from "react";

// Hero atmosphere: a reverse river delta. Five institution lanes feed a layered
// thread mesh that TRAVELS as distributed rivers (preserving lane identity), then
// COMPRESSES — only late — into a restrained convergence that hands off to the
// brightest card, SUBMIT. The world map is part of the flow field; gold dust and
// micro-particles keep the whole canvas quietly active. Gold rises left→right to
// the Official Record. Governance is what merges the institutional streams.

const SEALX = 0.7465;                                // Official Record = light source on the right
const CARD_FX = [0.3264, 0.3819, 0.4375, 0.5014, 0.5653, 0.6292, SEALX]; // 6 cards + seal (tighter)

// institution origins (match HeroVisual circles, moved left): x≈0.028, 5 lanes
const INSTX = 0.028;
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
const FOCAL = { x: 0.305, y: 0.5 };                  // convergence sits INSIDE the Submit card (no gap)
const COMPRESS_X = 0.24;                              // compression begins late → long in-lane travel zone

interface Strand {
  x0: number; y0: number;       // birth around the institution (ecosystem of trajectories)
  c1x: number; c1y: number;     // control 1 — gentle, gradual narrowing begins
  c2x: number; c2y: number;     // control 2 — shared field, continuing to narrow
  ex: number; ey: number;       // mouth at the Submit gate, order preserved
  maxT: number;
  width: number;                // thickness by class
  bright: number;               // base opacity by class (10% bright · 20% medium · 70% faint)
  cls: number;                  // 0 primary · 1 secondary · 2 tertiary
  amp: number; freq: number; ph: number;  // flow-field wander
  amp2: number; freq2: number; ph2: number; // second harmonic → micro-turbulence (splits/merges)
}
const STRANDS: Strand[] = [];
// A continuous luminous FIELD — not countable strands. Hundreds of mostly near-invisible
// trajectories overlap into a glowing fabric; each institution feeds an ECOSYSTEM of
// neighbouring paths. The band narrows GRADUALLY over a wide area (a field that breathes),
// keeps its order (contour lines), and carries micro-turbulence so it never looks perfect.
const mkStrand = (laneY: number, cls: number, lanePos: number): Strand => {
  const rel = laneY - 0.5;                                     // signed offset — order preserved
  // ecosystem origin: a small cloud of birth points around the institution node
  const x0 = INSTX + (rnd() - 0.2) * 0.04;
  const y0 = laneY + lanePos * 0.055 + (rnd() - 0.5) * 0.02;
  // gradual narrowing: the band tapers smoothly across the whole width (≈300–400px),
  // not a late collapse. Each control keeps a decreasing share of the lane offset.
  const c1x = 0.11 + rnd() * 0.05;
  const c1y = 0.5 + rel * (0.74 + (rnd() - 0.5) * 0.12) + lanePos * 0.03;
  const c2x = 0.2 + rnd() * 0.05;
  const c2y = 0.5 + rel * (0.4 + (rnd() - 0.5) * 0.1);
  const ex = FOCAL.x + (rnd() - 0.5) * 0.006;
  const ey = FOCAL.y + rel * (0.08 + rnd() * 0.05) + (rnd() - 0.5) * 0.006;
  const width = cls === 0 ? 1.1 + rnd() * 0.4 : cls === 1 ? 0.6 + rnd() * 0.18 : 0.32 + rnd() * 0.14;
  const bright = cls === 0 ? 0.42 : cls === 1 ? 0.12 : 0.03;   // 10/20/70 hierarchy → depth, glowing fabric
  const maxT = cls === 2 ? 0.84 + rnd() * 0.16 : 0.98 + rnd() * 0.02;
  const amp = cls === 0 ? 0.002 + rnd() * 0.002 : 0.004 + rnd() * 0.007;
  // micro-turbulence: a faster, smaller secondary wander → tiny splits/merges (tertiary most)
  const amp2 = cls === 2 ? 0.003 + rnd() * 0.004 : 0.0015 + rnd() * 0.002;
  return { x0, y0, c1x, c1y, c2x, c2y, ex, ey, maxT, width, bright, cls,
    amp, freq: 0.6 + rnd() * 0.9, ph: rnd() * 6.28, amp2, freq2: 2.5 + rnd() * 2.5, ph2: rnd() * 6.28 };
};
for (let li = 0; li < INST_Y.length; li++) {
  const laneY = INST_Y[li];
  // ecosystem per institution, distribution ≈ 10% primary · 20% secondary · 70% tertiary
  for (let k = 0; k < 5; k++) STRANDS.push(mkStrand(laneY, 0, (k / 4 - 0.5) * 1.4));
  for (let k = 0; k < 10; k++) STRANDS.push(mkStrand(laneY, 1, (k / 9 - 0.5) * 2));
  for (let k = 0; k < 35; k++) STRANDS.push(mkStrand(laneY, 2, (k / 34 - 0.5) * 2.2));
}
const sPoint = (s: Strand, t: number, tm = 0): [number, number] => {
  const mt = 1 - t, a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
  const x = a * s.x0 + b * s.c1x + c * s.c2x + d * s.ex;
  let y = a * s.y0 + b * s.c1y + c * s.c2y + d * s.ey;
  // flow-field wander + micro-turbulence (second harmonic), windowed to 0 at both ends
  const window = Math.sin(Math.PI * t) * (1 - t * 0.7);
  y += s.amp * Math.sin(s.freq * t * 6.283 + s.ph + tm) * window;
  y += s.amp2 * Math.sin(s.freq2 * t * 6.283 + s.ph2 + tm * 1.7) * window;
  return [x, y];
};

interface Pp { g: number; t: number; sp: number; size: number }
interface Noise { x: number; y: number; vx: number; vy: number; size: number; a: number }

export const HeroCanvas: React.FC<{ className?: string }> = ({ className }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"); if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0, raf = 0;
    let dots: { x: number; y: number; a: number }[] = [], pps: Pp[] = [], noise: Noise[] = [];

    const init = () => {
      // map is part of the flow field: dots brighten inside the travel band (x<0.34, mid-height)
      const mk = (d: { nx: number; ny: number }, base: number) => {
        const x = (0.02 + d.nx * 0.94) * W, y = (0.07 + d.ny * 0.72) * H;
        const inFlow = x < 0.34 * W && Math.abs(y - FOCAL.y * H) < 0.26 * H;
        return { x, y, a: base * (inFlow ? 1.9 : 1) };
      };
      dots = [...MAP_DOTS.map((d) => mk(d, 0.1)), ...CLUSTER_DOTS.map((d) => mk(d, 0.18))];
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

      // world map: lat/long grid (a supporting actor — noticed only after several seconds)
      ctx.strokeStyle = "rgba(233,200,120,0.012)"; ctx.lineWidth = 1;
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

      // destination bloom behind the Official Record — a quiet presence, never a floodlight
      const bx = SEALX * W, by = 0.5 * H;
      const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, 0.28 * W);
      bloom.addColorStop(0, "rgba(233,200,120,0.08)"); bloom.addColorStop(0.4, "rgba(233,200,120,0.025)"); bloom.addColorStop(1, "rgba(0,0,0,0)");
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

      // the governance field: stable, ordered contour lines that compress through the shared
      // field and narrow into Submit. Motion is slow and inevitable; white→gold toward Submit.
      const tm = Date.now() / 6000;
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

      // map participates in the flow field: flow-band dots sit IN FRONT of the mesh,
      // so the strands read as travelling THROUGH the world map, not over it
      for (const d of dots)
        if (d.x < 0.34 * W && Math.abs(d.y - FOCAL.y * H) < 0.26 * H) {
          ctx.fillStyle = `rgba(233,200,120,${(d.a * 0.75).toFixed(3)})`; ctx.fillRect(d.x, d.y, 1.6, 1.6);
        }

      // convergence = an ACCUMULATION, not a flash. The light gathers where the dense field
      // arrives; the incoming density does the work, the bloom is a quiet pressure point.
      const mx = FOCAL.x * W, my = FOCAL.y * H;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 700);
      const merge = ctx.createRadialGradient(mx, my, 0, mx, my, 0.06 * W);
      merge.addColorStop(0, "rgba(255,236,190,0.055)"); merge.addColorStop(0.35, "rgba(233,200,120,0.022)");
      merge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = merge; ctx.fillRect(mx - 0.08 * W, my - 0.08 * W, 0.16 * W, 0.16 * W);
      const core = ctx.createRadialGradient(mx, my, 0, mx, my, 0.016 * W);
      core.addColorStop(0, `rgba(255,246,222,${(0.045 + 0.035 * pulse).toFixed(3)})`); core.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = core; ctx.fillRect(mx - 0.024 * W, my - 0.024 * W, 0.048 * W, 0.048 * W);

      // (no in-mesh particles: the mesh is a stable field, not a meteor shower. The only
      //  flowing particles live in the governed pipeline, to the right of Submit.)

      // governance pipeline = continuous transmission system: micro-nodes along every
      // connector + particles that accelerate stage→stage toward the Official Record
      for (let g = 0; g < CARD_FX.length - 1; g++) {
        const x0 = CARD_FX[g], x1 = CARD_FX[g + 1], lvl = g / (CARD_FX.length - 1);
        for (let s = 1; s <= 2; s++) {
          const nx = (x0 + (x1 - x0) * (s / 3)) * W;
          ctx.fillStyle = `rgba(255,231,173,${(0.16 + 0.18 * lvl).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(nx, 0.5 * H, 1.1, 0, 6.283); ctx.fill();
        }
      }
      for (const p of pps) {
        p.t += p.sp * (0.55 + 1.0 * p.t); if (p.t > 1) p.t -= 1;   // accelerate across each gap
        const x = (CARD_FX[p.g] + (CARD_FX[p.g + 1] - CARD_FX[p.g]) * p.t) * W;
        const a = 0.34 + 0.5 * (p.g / (CARD_FX.length - 1));
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
