import React, { useEffect, useRef } from "react";

// Hero atmosphere: a reverse river delta. Five institution lanes feed a layered
// thread mesh that TRAVELS as distributed rivers (preserving lane identity), then
// COMPRESSES — only late — into a restrained convergence that hands off to the
// brightest card, SUBMIT. The world map is part of the flow field; gold dust and
// micro-particles keep the whole canvas quietly active. Gold rises left→right to
// the Official Record. Governance is what merges the institutional streams.

const SEALX = 0.9028;                                // Official Record = the destination (largest object)
const CARD_FX = [0.2986, 0.384, 0.4694, 0.5549, 0.6403, 0.7257, SEALX]; // 6 equal cards + seal
const GOVERN_X = 0.384;                              // fibers stay a visible band under Submit, on toward here

// institution sources (match HeroVisual circles). MAG = nested-funnel hierarchy: the outer
// institutions (Ministries, Authorities) generate the LARGEST envelope; Hospitals medium;
// Universities/Agencies the smallest inner field → funnel inside funnel inside funnel.
const INSTX = 0.104;                                 // clear of the headline column, still a long journey
const INST_Y = [0.275, 0.388, 0.5, 0.613, 0.725];
const MAG = [1.0, 0.4, 0.68, 0.4, 1.0];              // Ministries/Authorities DOMINATE the field


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
// The mesh is a FABRIC entering from the upper-left (above/behind the institutions,
// implying offscreen systems) that drapes into the TOP of the pipeline near Submit.
// Large faint LOWER ARCS sweep beneath from the lower-left toward the record, balancing
// the upper mesh. Submit is NOT a focal point — the field simply arrives.
const ENTRY = { x: 0.29, y: 0.5 };                   // where the field meets the pipeline (soft, not a flash)

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
// NESTED FUNNELS (horns), all sharing the apex at Submit. Each institution is one tight
// funnel WALL: the strands leave the node nearly horizontally (the flared mouth) then curve
// — concave — into the apex. Ministries(top)+Authorities(bottom) are the OUTER funnel walls;
// Universities(top)+Agencies(bottom) the INNER funnel; Hospitals the axis. Walls never cross
// above their node, and the cones nest: small funnel inside medium inside large.
const mkStrand = (instIdx: number, cls: number): Strand => {
  const instY = INST_Y[instIdx], mag = MAG[instIdx];
  const rel = instY - 0.5;                                    // signed distance from the apex line
  // ORGANIC band: wider for dominant institutions, randomly (not evenly) populated
  const bandT = 0.014 + 0.06 * mag;
  const u = rnd();                                            // random position in the band (not parallel)
  const wallY = instY + (u - 0.5) * bandT * (0.6 + rnd() * 0.8);
  const x0 = INSTX - mag * 0.04 + (rnd() - 0.5) * 0.03;       // dominant walls start furthest left → longest
  const y0 = wallY;
  // LONG flared mouth (varied hold distance per strand → irregular, not a wireframe)
  const c1x = 0.17 + rnd() * 0.08;
  const c1y = wallY - rel * (0.04 + rnd() * 0.1);
  // a BROAD governance VOLUME, not a choke point: the band stays tall across the field zone
  // and only gathers near Submit, then passes under the pipeline as a visible band
  const c2x = 0.27 + rnd() * 0.04;
  const c2y = 0.5 + rel * (0.52 + rnd() * 0.14) + (rnd() - 0.5) * 0.025;
  const ex = GOVERN_X + (rnd() - 0.5) * 0.04;
  const ey = 0.5 + rel * (0.13 + rnd() * 0.08) + (rnd() - 0.5) * 0.014;
  // hierarchy but VERY quiet — opacity roughly halved again; the eye should discover the field
  const width = (cls === 0 ? 0.8 : cls === 1 ? 0.42 : 0.22) * (0.65 + 0.7 * mag) + rnd() * 0.2;
  const bright = (cls === 0 ? 0.15 : cls === 1 ? 0.045 : 0.01) * (0.35 + 0.95 * mag);
  const maxT = cls === 2 ? 0.55 + rnd() * 0.45 : 0.92 + rnd() * 0.08;  // varied length → organic edges
  // organic currents: larger, more varied wander so the coils read as rivers, not Bézier strokes
  const amp = (cls === 0 ? 0.004 : 0.01) * (0.4 + rnd() * 1.7);
  const amp2 = (cls === 2 ? 0.009 : 0.004) * (0.3 + rnd() * 1.5);
  return { x0, y0, c1x, c1y, c2x, c2y, ex, ey, maxT, width, bright, cls,
    amp, freq: 0.5 + rnd() * 1.3, ph: rnd() * 6.28, amp2, freq2: 2 + rnd() * 3.5, ph2: rnd() * 6.28 };
};
for (let i = 0; i < INST_Y.length; i++) {
  const m = MAG[i];                                          // ~40% fewer strands than before
  const nP = Math.round(1 + m * m * 5), nS = Math.round(2 + m * m * 8), nT = Math.round(4 + m * m * 25);
  for (let k = 0; k < nP; k++) STRANDS.push(mkStrand(i, 0));
  for (let k = 0; k < nS; k++) STRANDS.push(mkStrand(i, 1));
  for (let k = 0; k < nT; k++) STRANDS.push(mkStrand(i, 2));
}

// Lower arcs: continuation of the SAME governance field — they originate from the lower
// institutions, sweep beneath the pipeline and rise into the record (not random decoration).
interface Arc { sx: number; sy: number; cx: number; cy: number; ex: number; ey: number; w: number; a: number }
const ARCS: Arc[] = [];
// orbital paths — varied radius, elevation, length and brightness (not parallel rails)
for (let k = 0; k < 11; k++) {
  const elev = rnd();                                         // how low the arc dips
  const short = k % 3 === 0;                                  // a third stop short of the record
  const ex = short ? 0.45 + rnd() * 0.18 : SEALX - 0.1 + rnd() * 0.16;
  ARCS.push({
    sx: INSTX - 0.02 + (rnd() - 0.5) * 0.09, sy: 0.58 + rnd() * 0.34,
    cx: 0.3 + rnd() * 0.36, cy: 0.7 + elev * 0.27,
    ex, ey: 0.46 + (rnd() - 0.3) * 0.17,
    w: 0.4 + rnd() * 1.3, a: (k < 4 ? 0.019 + rnd() * 0.019 : 0.006 + rnd() * 0.01) * (0.6 + rnd() * 0.85),
  });
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
    let sparks: { s: number; t: number; ph: number; sz: number }[] = [];   // micro-points of light along the field
    // offscreen layer for the governance field: drawn sharp, composited back BLURRED so the
    // hundreds of trajectories fuse into one continuous luminous fabric (not countable wires)
    const off = document.createElement("canvas");
    const mctx = off.getContext("2d");

    const init = () => {
      // world map: a subtle, uniform dotted stage behind the whole process (10–15% feel)
      const mk = (d: { nx: number; ny: number }, base: number) =>
        ({ x: (0.04 + d.nx * 0.92) * W, y: (0.07 + d.ny * 0.72) * H, a: base });
      dots = [...MAP_DOTS.map((d) => mk(d, 0.019)), ...CLUSTER_DOTS.map((d) => mk(d, 0.034))];
      pps = [];
      for (let g = 0; g < CARD_FX.length - 1; g++) for (let k = 0; k < 4; k++) pps.push({ g, t: rnd(), sp: 0.004 + rnd() * 0.004, size: 0.8 + rnd() * 1.1 });
      // ambient particle noise — micro-particles everywhere so the whole canvas is quietly active
      noise = [];
      for (let i = 0; i < 150; i++) noise.push({ x: rnd() * W, y: rnd() * H, vx: (rnd() - 0.5) * 0.08, vy: (rnd() - 0.5) * 0.06, size: rnd() * 0.85 + 0.25, a: 0.03 + rnd() * 0.1 });
      // gold dust drifting in the upper-left fabric region
      for (let i = 0; i < 60; i++) noise.push({ x: (0.04 + rnd() * 0.18) * W, y: (0.06 + rnd() * 0.4) * H, vx: 0.04 + rnd() * 0.1, vy: 0.01 + rnd() * 0.03, size: rnd() * 0.7 + 0.2, a: 0.03 + rnd() * 0.1 });
      // micro-points of light riding the strands — subtle perceived complexity (not streaks)
      sparks = [];
      for (let i = 0; i < 28; i++) { const s = Math.floor(rnd() * STRANDS.length); sparks.push({ s, t: 0.2 + rnd() * 0.78, ph: rnd() * 6.28, sz: 0.45 + rnd() * 0.9 }); }
    };
    const resize = () => {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = Math.max(1, W * dpr); cv.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      off.width = cv.width; off.height = cv.height;
      if (mctx) mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
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

      // ENVIRONMENTAL illumination behind the Official Record — a large, soft physical light the
      // whole right half is immersed in (not a tight spotlight)
      const bx = SEALX * W, by = 0.5 * H;
      const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, 0.5 * W);
      bloom.addColorStop(0, "rgba(233,200,120,0.1)"); bloom.addColorStop(0.35, "rgba(233,200,120,0.035)"); bloom.addColorStop(0.7, "rgba(233,200,120,0.012)"); bloom.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = bloom; ctx.fillRect(0, 0, W, H);

      // the governance field: the upper FABRIC + the lower ARCS, drawn SHARP on an offscreen
      // layer then composited back BLURRED → one continuous luminous surface. Slow, inevitable.
      const tm = Date.now() / 6000;
      if (mctx) {
        mctx.clearRect(0, 0, W, H);
        mctx.globalCompositeOperation = "lighter";
        // lower arcs first (they sit beneath), large faint gold sweeps toward the record
        for (const arc of ARCS) {
          mctx.strokeStyle = `rgba(233,200,120,${arc.a.toFixed(3)})`;
          mctx.lineWidth = arc.w;
          mctx.beginPath(); mctx.moveTo(arc.sx * W, arc.sy * H);
          mctx.quadraticCurveTo(arc.cx * W, arc.cy * H, arc.ex * W, arc.ey * H); mctx.stroke();
        }
        // upper fabric — ordered contour lines, white→gold as they drape into the pipeline
        for (const s of STRANDS) {
          const N = 30; let prev = sPoint(s, 0, tm);
          for (let i = 1; i <= N; i++) {
            const tp = i / N, t = tp * s.maxT;
            const [x, y] = sPoint(s, t, tm);
            const tipFade = (s.cls === 2 && tp > 0.7) ? 1 - (tp - 0.7) / 0.3 : 1;
            const a = (0.05 + 0.12 * t + 0.06 * t * t) * s.bright * tipFade;  // softer core so the Record is the single focus
            const g = (255 - 80 * t) | 0, b = (255 - 170 * t) | 0;            // warm gold, never white-hot
            mctx.strokeStyle = `rgba(255,${g},${b},${a.toFixed(3)})`;
            mctx.lineWidth = s.width * (0.5 + 0.7 * t);
            mctx.beginPath(); mctx.moveTo(prev[0] * W, prev[1] * H); mctx.lineTo(x * W, y * H); mctx.stroke();
            prev = [x, y];
          }
        }
        // composite with DEPTH but LOW weight: faint far atmosphere, soft mid, restrained near
        ctx.save();
        ctx.filter = "blur(3.4px)"; ctx.globalAlpha = 0.32; ctx.drawImage(off, 0, 0, W, H);
        ctx.filter = "blur(1px)"; ctx.globalAlpha = 0.55; ctx.drawImage(off, 0, 0, W, H);
        ctx.filter = "none"; ctx.globalAlpha = 0.4; ctx.drawImage(off, 0, 0, W, H);
        ctx.globalAlpha = 1; ctx.restore();

        // micro-points of light riding the strands (very subtle twinkle)
        for (const sp of sparks) {
          const st = STRANDS[sp.s]; const [x, y] = sPoint(st, sp.t * st.maxT, tm);
          const tw = 0.5 + 0.5 * Math.sin(tm * 6 + sp.ph);
          ctx.fillStyle = `rgba(255,240,205,${(0.03 + 0.08 * tw).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(x * W, y * H, sp.sz, 0, 6.283); ctx.fill();
        }
      }

      // map weaves with the field: a few dots sit IN FRONT of the fabric so it reads as flowing
      // through the world map (kept subtle)
      for (const d of dots)
        if (d.x < 0.5 * W && d.y < 0.55 * H && d.y > 0.1 * H) {
          ctx.fillStyle = `rgba(233,200,120,${(d.a * 0.7).toFixed(3)})`; ctx.fillRect(d.x, d.y, 1.6, 1.6);
        }

      // where the field meets the pipeline — a SOFT, quiet glow (Submit is not a focal flash)
      const mx = ENTRY.x * W, my = ENTRY.y * H;
      const merge = ctx.createRadialGradient(mx, my, 0, mx, my, 0.055 * W);
      merge.addColorStop(0, "rgba(255,236,190,0.006)"); merge.addColorStop(0.4, "rgba(233,200,120,0.003)");
      merge.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = merge; ctx.fillRect(mx - 0.07 * W, my - 0.07 * W, 0.14 * W, 0.14 * W);

      // (no in-mesh particles: the mesh is a stable field, not a meteor shower. The only
      //  flowing particles live in the governed pipeline, to the right of Submit.)

      // governance pipeline = continuous transmission system: micro-nodes along every
      // connector + particles that accelerate stage→stage toward the Official Record
      for (let g = 0; g < CARD_FX.length - 1; g++) {
        const x0 = CARD_FX[g], x1 = CARD_FX[g + 1], lvl = g / (CARD_FX.length - 1);
        for (let s = 1; s <= 2; s++) {
          const nx = (x0 + (x1 - x0) * (s / 3)) * W;
          ctx.fillStyle = `rgba(255,231,173,${(0.2 + 0.2 * lvl).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(nx, 0.5 * H, 1.2, 0, 6.283); ctx.fill();
        }
      }
      for (const p of pps) {
        p.t += p.sp * (0.55 + 1.0 * p.t); if (p.t > 1) p.t -= 1;   // accelerate across each gap
        const x = (CARD_FX[p.g] + (CARD_FX[p.g + 1] - CARD_FX[p.g]) * p.t) * W;
        const a = 0.4 + 0.45 * (p.g / (CARD_FX.length - 1));
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
