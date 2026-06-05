import React, { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// GlobeScene — a 2036 acquisition-intelligence command core, not a marketing
// illustration. Everything is rendered in real time on a single full-bleed
// <canvas> (tens of thousands of depth-shaded particles per frame), with the
// intelligence panels as crisp DOM overlaid on top and wired back into the
// globe with luminous telemetry connectors drawn on the canvas.
//
// Reference language: Palantir Gotham / Anduril Lattice / a Bloomberg terminal
// imagined for 2036 — volumetric, holographic, alive.
//
// Render layers (back → front):
//   0. background telemetry grid + far particle dust
//   1. atmospheric volumetric glow
//   2. orbital rings (3D, depth-shaded) + nodes that pass front & behind
//   3. the particle globe (see-through holographic sphere, ~14k points)
//   4. surface intelligence nodes (pulsing) + scan sweep
//   5. telemetry connectors from each panel to the globe + traveling pulses
//   6. foreground bokeh particles
// DOM panels sit above all of it.
// ---------------------------------------------------------------------------

// Coarse land mask (lat/lon boxes) — used only to brighten continent particles
// so the sphere still reads as *global*, without becoming a literal map.
const LAND: [number, number, number, number][] = [
  [60, 72, -165, -95], [55, 68, -140, -60], [49, 60, -128, -58], [42, 50, -124, -66],
  [34, 44, -122, -75], [28, 36, -116, -80], [22, 30, -110, -82], [12, 18, -94, -83],
  [60, 83, -55, -20],
  [4, 12, -78, -60], [-2, 7, -80, -50], [-10, 0, -79, -40], [-18, -8, -74, -38],
  [-26, -17, -71, -44], [-34, -25, -72, -52], [-43, -33, -74, -58], [-52, -42, -75, -66],
  [54, 66, -8, 30], [46, 58, -6, 30], [40, 50, -8, 28], [58, 70, 8, 42], [38, 46, 18, 42],
  [50, 60, 30, 60],
  [24, 36, -10, 32], [16, 28, -16, 36], [8, 18, -16, 42], [0, 10, -10, 44],
  [-10, 2, 9, 42], [-20, -8, 12, 40], [-30, -20, 15, 36], [-35, -28, 17, 30],
  [12, 30, 34, 60], [30, 45, 44, 78], [45, 65, 44, 120], [55, 72, 60, 178],
  [35, 50, 78, 122], [20, 36, 70, 120], [8, 22, 73, 90], [10, 24, 95, 110],
  [-8, 6, 96, 120], [-10, 0, 118, 141],
  [-30, -12, 114, 148], [-39, -28, 116, 154], [-47, -38, 166, 179], [31, 46, 129, 146],
];
function isLand(lat: number, lon: number): boolean {
  for (let i = 0; i < LAND.length; i++) {
    const b = LAND[i];
    if (lat >= b[0] && lat <= b[1] && lon >= b[2] && lon <= b[3]) return true;
  }
  return false;
}

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// Intelligence panels — each anchored at a fraction of the scene and wired to
// the globe. `side` controls which edge the card text/marker hangs off.
type Panel = {
  id: string;
  title: string;
  value: string;
  delta: string;
  x: number; // fraction of scene width
  y: number; // fraction of scene height
  side: "left" | "right";
  hue: number; // 0 = cyan, 1 = amber accent (for variety)
};
// Globe is the centre of a radial intelligence constellation. The headline
// owns the far left, so the 8 panels arc around the globe's top → right →
// bottom (~245°) rather than sitting in a vertical stack. Each is wired back
// into the core through a multi-stage signal path (card → relay node → globe).
const GLOBE_CX = 0.64;
const GLOBE_CY = 0.5;
const PANELS: Panel[] = [
  { id: "acq", title: "Acquisition Intelligence", value: "12,438", delta: "active signals", x: 0.44, y: 0.20, side: "left", hue: 0 },
  { id: "pred", title: "Predictive Outcomes", value: "94.7%", delta: "model accuracy", x: 0.985, y: 0.26, side: "right", hue: 0 },
  { id: "flow", title: "Live Deal Flow", value: "$2.7T", delta: "in tracked value", x: 0.985, y: 0.43, side: "right", hue: 1 },
  { id: "closed", title: "Closed Transactions", value: "$187.6B", delta: "realized", x: 0.985, y: 0.60, side: "right", hue: 0 },
  { id: "resp", title: "Buyer Response Analytics", value: "61.2%", delta: "engagement rate", x: 0.965, y: 0.78, side: "right", hue: 0 },
  { id: "neg", title: "AI Negotiator", value: "+17.3%", delta: "value uplift", x: 0.875, y: 0.92, side: "right", hue: 1 },
  { id: "exp", title: "Expected Outcome Engine", value: "0.91", delta: "confidence index", x: 0.60, y: 0.93, side: "left", hue: 0 },
  { id: "net", title: "Global Buyer Network", value: "58,341", delta: "verified buyers", x: 0.47, y: 0.86, side: "left", hue: 0 },
];

const GlobeScene: React.FC<{ className?: string }> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let w = 0, h = 0, dpr = 1;
    let t = 0; // frame time

    // --- precompute the globe particle field (Fibonacci sphere) --------------
    type P = { x: number; y: number; z: number; land: boolean };
    let sphere: P[] = [];
    let nodes: { x: number; y: number; z: number; phase: number }[] = [];
    const buildSphere = (count: number) => {
      sphere = new Array(count);
      const golden = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const th = i * golden;
        const x = Math.cos(th) * r;
        const z = Math.sin(th) * r;
        const lat = Math.asin(y) / DEG;
        const lon = Math.atan2(z, x) / DEG;
        sphere[i] = { x, y, z, land: isLand(lat, lon) };
      }
      // surface intelligence nodes — distinct points that pulse + anchor data
      nodes = [];
      const NODES = 26;
      for (let i = 0; i < NODES; i++) {
        const y = 1 - (i / (NODES - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const th = i * golden * 2.1;
        nodes.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, phase: i * 0.7 });
      }
    };

    // --- background signal dust + distant telemetry lights + fg bokeh --------
    let dust: { x: number; y: number; z: number; s: number }[] = [];
    let farLights: { x: number; y: number; ph: number; sp: number; s: number }[] = [];
    let bokeh: { x: number; y: number; r: number; vx: number; vy: number; a: number }[] = [];
    const buildAmbient = () => {
      // denser signal dust → computational texture
      dust = [];
      const DN = Math.round((w * h) / 3200);
      for (let i = 0; i < DN; i++) {
        dust.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), s: Math.random() * 1.1 + 0.25 });
      }
      // distant telemetry lights — tiny points that blink at their own rate
      farLights = [];
      const FL = Math.round((w * h) / 26000);
      for (let i = 0; i < FL; i++) {
        farLights.push({
          x: Math.random() * w, y: Math.random() * h,
          ph: Math.random() * TAU, sp: 0.01 + Math.random() * 0.05,
          s: Math.random() < 0.2 ? 1.6 : 1.0,
        });
      }
      bokeh = [];
      for (let i = 0; i < 46; i++) {
        bokeh.push({
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 26 + 8,
          vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.08,
          a: Math.random() * 0.05 + 0.015,
        });
      }
    };

    // --- orbital rings (3D planes, each its own normal + spin) ---------------
    type Ring = { n: [number, number, number]; rad: number; spin: number; seg: number; nodes: number };
    const RINGS: Ring[] = [
      { n: [0.05, 1, 0.08], rad: 1.20, spin: 0.0006, seg: 140, nodes: 2 },
      { n: [0.55, 0.80, 0.0], rad: 1.34, spin: -0.0009, seg: 140, nodes: 2 },
      { n: [-0.40, 0.72, 0.35], rad: 1.48, spin: 0.0011, seg: 150, nodes: 1 },
      { n: [0.25, 0.86, -0.45], rad: 1.27, spin: -0.0007, seg: 140, nodes: 2 },
    ];
    // build an orthonormal basis (u, v) for each ring plane
    const ringBasis = RINGS.map((rg) => {
      const n = rg.n;
      const nl = Math.hypot(n[0], n[1], n[2]);
      const nn: [number, number, number] = [n[0] / nl, n[1] / nl, n[2] / nl];
      const ax: [number, number, number] = Math.abs(nn[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0];
      // u = normalize(cross(ax, nn)); v = cross(nn, u)
      const u: [number, number, number] = [
        ax[1] * nn[2] - ax[2] * nn[1],
        ax[2] * nn[0] - ax[0] * nn[2],
        ax[0] * nn[1] - ax[1] * nn[0],
      ];
      const ul = Math.hypot(u[0], u[1], u[2]);
      const uu: [number, number, number] = [u[0] / ul, u[1] / ul, u[2] / ul];
      const v: [number, number, number] = [
        nn[1] * uu[2] - nn[2] * uu[1],
        nn[2] * uu[0] - nn[0] * uu[2],
        nn[0] * uu[1] - nn[1] * uu[0],
      ];
      return { u: uu, v };
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      // particle budget scales with area, capped for perf
      const count = Math.max(5000, Math.min(15000, Math.round((w * h) / 70)));
      buildSphere(count);
      buildAmbient();
    };

    // camera tilt (look slightly down on the globe)
    const TILT = -0.34;
    const cosT = Math.cos(TILT), sinT = Math.sin(TILT);

    const draw = () => {
      const cx = w * GLOBE_CX;
      const cy = h * GLOBE_CY;
      const R = Math.min(w, h) * 0.245;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const rot = reduce ? 0.6 : t * 0.0022; // globe spin (radians)
      const cosR = Math.cos(rot), sinR = Math.sin(rot);

      // ---- layer 0: background telemetry grid + far dust -------------------
      ctx.save();
      ctx.strokeStyle = "rgba(40,110,150,0.045)";
      ctx.lineWidth = 1;
      const gridStep = Math.max(48, Math.min(w, h) / 12);
      for (let gx = (cx % gridStep); gx < w; gx += gridStep) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let gy = (cy % gridStep); gy < h; gy += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }
      ctx.restore();

      ctx.globalCompositeOperation = "lighter";
      // signal dust — faint, fades toward the bright core so it stays subtle
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.01 + i));
        ctx.fillStyle = `rgba(95,165,205,${(0.03 + d.z * 0.07) * tw})`;
        ctx.fillRect(d.x, d.y, d.s, d.s);
      }
      // distant telemetry lights — blink independently like a far data field
      for (let i = 0; i < farLights.length; i++) {
        const f = farLights[i];
        const blink = 0.5 + 0.5 * Math.sin((reduce ? 0 : t) * f.sp + f.ph);
        const a = blink * blink * 0.55;
        if (a < 0.04) continue;
        ctx.fillStyle = `rgba(150,225,255,${a.toFixed(3)})`;
        ctx.fillRect(f.x, f.y, f.s, f.s);
      }
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 1: sharp volumetric light (not foggy atmosphere) ----------
      // A tight, defined limb ring of light — the projection's edge — rather
      // than a broad soft wash. Keeps the background dark for high contrast.
      ctx.globalCompositeOperation = "lighter";
      const halo = ctx.createRadialGradient(cx, cy, R * 0.86, cx, cy, R * 1.06);
      halo.addColorStop(0, "rgba(120,228,255,0)");
      halo.addColorStop(0.72, "rgba(150,238,255,0.10)");
      halo.addColorStop(0.92, "rgba(170,244,255,0.28)");
      halo.addColorStop(1, "rgba(120,228,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.06, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // helper: rotate a unit point by globe spin (Y) then camera tilt (X)
      const project = (x: number, y: number, z: number) => {
        // spin about Y
        const xr = x * cosR + z * sinR;
        const zr = -x * sinR + z * cosR;
        // tilt about X
        const yr = y * cosT - zr * sinT;
        const zt = y * sinT + zr * cosT;
        return { sx: cx + xr * R, sy: cy - yr * R, depth: zt };
      };
      // project without globe spin (for rings, which spin independently)
      const projectStatic = (x: number, y: number, z: number) => {
        const yr = y * cosT - z * sinT;
        const zt = y * sinT + z * cosT;
        return { sx: cx + x * R, sy: cy - yr * R, depth: zt };
      };

      // ---- layer 2: orbital rings (behind half) ----------------------------
      const drawRing = (ri: number, frontPass: boolean) => {
        const rg = RINGS[ri];
        const { u, v } = ringBasis[ri];
        const spin = reduce ? 0.8 : t * rg.spin;
        ctx.globalCompositeOperation = "lighter";
        for (let s = 0; s < rg.seg; s++) {
          const a0 = (s / rg.seg) * TAU + spin;
          const a1 = ((s + 1) / rg.seg) * TAU + spin;
          const p0x = (Math.cos(a0) * u[0] + Math.sin(a0) * v[0]) * rg.rad;
          const p0y = (Math.cos(a0) * u[1] + Math.sin(a0) * v[1]) * rg.rad;
          const p0z = (Math.cos(a0) * u[2] + Math.sin(a0) * v[2]) * rg.rad;
          const p1x = (Math.cos(a1) * u[0] + Math.sin(a1) * v[0]) * rg.rad;
          const p1y = (Math.cos(a1) * u[1] + Math.sin(a1) * v[1]) * rg.rad;
          const p1z = (Math.cos(a1) * u[2] + Math.sin(a1) * v[2]) * rg.rad;
          const q0 = projectStatic(p0x, p0y, p0z);
          const q1 = projectStatic(p1x, p1y, p1z);
          const front = q0.depth >= 0;
          if (front !== frontPass) continue;
          const df = (q0.depth + 1) / 2;
          // energy trajectory: a moving hot crest races around each ring so the
          // line reads as flowing energy, not a static decorative curve.
          const seg01 = (s / rg.seg + spin / TAU) % 1;
          const crest = (reduce ? 0.3 : (t * 0.004 + ri * 0.2) % 1);
          let pulse = Math.abs(((seg01 - crest + 1) % 1) - 0); // 0 at crest
          pulse = Math.max(0, 1 - pulse * 6); // sharp comet head
          const baseA = front ? 0.14 + 0.5 * df : 0.05 + 0.12 * df;
          const a = Math.min(1, baseA + pulse * (front ? 0.85 : 0.3));
          const bright = pulse > 0.15;
          ctx.strokeStyle = bright
            ? `rgba(210,250,255,${a.toFixed(3)})`
            : `rgba(120,222,255,${a.toFixed(3)})`;
          ctx.lineWidth = front ? (bright ? 1.7 : 1.0) : 0.7;
          ctx.beginPath(); ctx.moveTo(q0.sx, q0.sy); ctx.lineTo(q1.sx, q1.sy); ctx.stroke();
        }
        // traveling nodes on this ring
        for (let nidx = 0; nidx < rg.nodes; nidx++) {
          const a = (reduce ? 0.3 : t * (0.0009 + ri * 0.0004)) + (nidx / rg.nodes) * TAU + ri;
          const px = (Math.cos(a) * u[0] + Math.sin(a) * v[0]) * rg.rad;
          const py = (Math.cos(a) * u[1] + Math.sin(a) * v[1]) * rg.rad;
          const pz = (Math.cos(a) * u[2] + Math.sin(a) * v[2]) * rg.rad;
          const q = projectStatic(px, py, pz);
          const front = q.depth >= 0;
          if (front !== frontPass) continue;
          const df = (q.depth + 1) / 2;
          const rr = 1.6 + 2.2 * df;
          const g = ctx.createRadialGradient(q.sx, q.sy, 0, q.sx, q.sy, rr * 3);
          g.addColorStop(0, `rgba(210,250,255,${0.9 * df})`);
          g.addColorStop(0.4, `rgba(120,225,255,${0.45 * df})`);
          g.addColorStop(1, "rgba(120,225,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(q.sx, q.sy, rr * 3, 0, TAU); ctx.fill();
          ctx.fillStyle = `rgba(235,253,255,${0.85 * df})`;
          ctx.beginPath(); ctx.arc(q.sx, q.sy, rr * 0.5, 0, TAU); ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
      };
      for (let ri = 0; ri < RINGS.length; ri++) drawRing(ri, false); // back halves

      // ---- layer 3: the particle globe -------------------------------------
      // NO solid body fill — the sphere exists only as suspended light. The
      // continents are dense bright particles; the ocean is a barely-there
      // dust so there is no visible surface, only data hanging in space.
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < sphere.length; i++) {
        const p = sphere[i];
        const q = project(p.x, p.y, p.z);
        const df = (q.depth + 1) / 2; // 0 back → 1 front
        if (p.land) {
          // crisp, bright illuminated points — front face reads strongly,
          // back face still glints through (holographic, not occluded).
          const a = Math.min(1, 0.30 + 1.15 * df * df); // brighter core (+~40%)
          ctx.fillStyle = `rgba(165,246,255,${a.toFixed(3)})`;
          const s = 0.65 + 1.6 * df;
          ctx.fillRect(q.sx - s / 2, q.sy - s / 2, s, s);
        } else {
          // ocean dust — almost invisible; just enough to imply the volume
          const a = 0.015 + 0.09 * df * df;
          if (a < 0.02) continue;
          ctx.fillStyle = `rgba(70,170,215,${a.toFixed(3)})`;
          ctx.fillRect(q.sx - 0.5, q.sy - 0.5, 1, 1);
        }
      }
      // bright core bloom at the centre — the projection's energy source
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.55);
      core.addColorStop(0, "rgba(170,244,255,0.32)");
      core.addColorStop(0.5, "rgba(100,210,250,0.10)");
      core.addColorStop(1, "rgba(60,170,220,0)");
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.5, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 4: surface intelligence nodes + network traffic + scan ----
      ctx.globalCompositeOperation = "lighter";
      const litNodes: { sx: number; sy: number; df: number }[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const q = project(n.x, n.y, n.z);
        const df = (q.depth + 1) / 2;
        if (q.depth <= 0.04) continue; // front face only
        const pulse = 0.55 + 0.45 * Math.sin(t * 0.05 + n.phase * 3);
        const a = Math.min(1, (0.7 + 0.55 * df) * pulse); // ~+40% brighter
        const rr = 8 * df;
        const g = ctx.createRadialGradient(q.sx, q.sy, 0, q.sx, q.sy, rr);
        g.addColorStop(0, `rgba(225,252,255,${a})`);
        g.addColorStop(0.35, `rgba(140,235,255,${a * 0.55})`);
        g.addColorStop(1, "rgba(120,225,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(q.sx, q.sy, rr, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(248,255,255,${Math.min(1, a + 0.1)})`;
        ctx.beginPath(); ctx.arc(q.sx, q.sy, 1.4 * df, 0, TAU); ctx.fill();
        litNodes.push({ sx: q.sx, sy: q.sy, df });
      }
      // network traffic: faint bright links between nearby front-face nodes
      const linkMax = R * 0.6;
      for (let i = 0; i < litNodes.length; i++) {
        for (let j = i + 1; j < litNodes.length; j++) {
          const dx = litNodes[i].sx - litNodes[j].sx;
          const dy = litNodes[i].sy - litNodes[j].sy;
          const d = Math.hypot(dx, dy);
          if (d > linkMax) continue;
          const a = (1 - d / linkMax) * 0.22 * Math.min(litNodes[i].df, litNodes[j].df);
          ctx.strokeStyle = `rgba(150,235,255,${a.toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(litNodes[i].sx, litNodes[i].sy); ctx.lineTo(litNodes[j].sx, litNodes[j].sy); ctx.stroke();
        }
      }

      // holographic scan — a sharp bright line + thin trailing glow sweeping
      // through the projection (two passes, offset, for a CRT-hologram feel)
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      for (let pass = 0; pass < 2; pass++) {
        const period = R * 2;
        const off = pass * period * 0.5;
        const scanY = cy - R + (reduce ? period * 0.4 : ((t * 0.7 + off) % period));
        const sg = ctx.createLinearGradient(0, scanY - 10, 0, scanY + 10);
        sg.addColorStop(0, "rgba(150,240,255,0)");
        sg.addColorStop(0.5, `rgba(180,248,255,${pass === 0 ? 0.16 : 0.08})`);
        sg.addColorStop(1, "rgba(150,240,255,0)");
        ctx.fillStyle = sg;
        ctx.fillRect(cx - R, scanY - 10, R * 2, 20);
        // the crisp leading edge
        ctx.fillStyle = `rgba(205,250,255,${pass === 0 ? 0.5 : 0.22})`;
        ctx.fillRect(cx - R, scanY, R * 2, 1);
      }
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";

      // NO solid limb stroke — the edge is defined by light (halo) + particles
      // only, so the sphere never reads as a hard rendered ball.

      // ---- rings: front halves (over the globe) ----------------------------
      for (let ri = 0; ri < RINGS.length; ri++) drawRing(ri, true);

      // ---- bright node intersections where orbital paths cross -------------
      // Sample each ring's front-facing screen points, then flare wherever two
      // different rings nearly coincide — energy crossing energy.
      ctx.globalCompositeOperation = "lighter";
      const SAMP = 90;
      const pts: { sx: number; sy: number; ri: number }[] = [];
      for (let ri = 0; ri < RINGS.length; ri++) {
        const rg = RINGS[ri];
        const { u, v } = ringBasis[ri];
        const spin = reduce ? 0.8 : t * rg.spin;
        for (let s = 0; s < SAMP; s++) {
          const a = (s / SAMP) * TAU + spin;
          const px = (Math.cos(a) * u[0] + Math.sin(a) * v[0]) * rg.rad;
          const py2 = (Math.cos(a) * u[1] + Math.sin(a) * v[1]) * rg.rad;
          const pz = (Math.cos(a) * u[2] + Math.sin(a) * v[2]) * rg.rad;
          const q = projectStatic(px, py2, pz);
          if (q.depth < 0) continue; // front crossings only
          pts.push({ sx: q.sx, sy: q.sy, ri });
        }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          if (pts[i].ri === pts[j].ri) continue;
          const dx = pts[i].sx - pts[j].sx;
          const dy = pts[i].sy - pts[j].sy;
          if (dx * dx + dy * dy > 9) continue; // within ~3px = a crossing
          const mx = (pts[i].sx + pts[j].sx) / 2;
          const my = (pts[i].sy + pts[j].sy) / 2;
          const tw = 0.6 + 0.4 * Math.sin(t * 0.06 + i);
          const g = ctx.createRadialGradient(mx, my, 0, mx, my, 9);
          g.addColorStop(0, `rgba(225,252,255,${0.95 * tw})`);
          g.addColorStop(0.35, `rgba(150,235,255,${0.5 * tw})`);
          g.addColorStop(1, "rgba(150,235,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(mx, my, 9, 0, TAU); ctx.fill();
          ctx.fillStyle = `rgba(245,254,255,${0.9 * tw})`;
          ctx.beginPath(); ctx.arc(mx, my, 1.3, 0, TAU); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ---- intelligence reactor base (the globe is generated from here) ----
      // The benchmark relationship: platform → concentric rings → projection →
      // globe. Strong, computational, alive.
      ctx.globalCompositeOperation = "lighter";
      const py = cy + R * 1.10;
      const FLAT = 0.205; // ellipse foreshortening
      // emanation: light strands rising from the reactor into the core
      for (let k = -3; k <= 3; k++) {
        const sx0 = cx + k * R * 0.05;
        const strand = ctx.createLinearGradient(0, py, 0, cy - R * 0.1);
        const sa = 0.34 - Math.abs(k) * 0.045;
        strand.addColorStop(0, `rgba(180,246,255,${sa})`);
        strand.addColorStop(1, "rgba(180,246,255,0)");
        ctx.strokeStyle = strand;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx0, py);
        ctx.lineTo(cx + k * R * 0.012, cy - R * 0.1);
        ctx.stroke();
      }
      // concentric command rings (some rotating w/ tick marks → reactor feel)
      const baseRings = [0.30, 0.50, 0.72, 0.96, 1.18];
      for (let k = 0; k < baseRings.length; k++) {
        const rad = R * baseRings[k];
        const a = 0.44 - k * 0.06;
        ctx.strokeStyle = `rgba(150,238,255,${a})`;
        ctx.lineWidth = k === 0 ? 1.5 : (k % 2 ? 0.7 : 1.0);
        ctx.beginPath();
        ctx.ellipse(cx, py, rad, rad * FLAT, 0, 0, TAU);
        ctx.stroke();
        // tick markers riding the ring (alternate rings spin opposite ways)
        if (k > 0) {
          const ticks = 24 + k * 8;
          const spin = reduce ? 0.4 : t * (k % 2 ? 0.004 : -0.004);
          for (let m = 0; m < ticks; m++) {
            const ang = (m / ticks) * TAU + spin;
            const mx = cx + Math.cos(ang) * rad;
            const my = py + Math.sin(ang) * rad * FLAT;
            const bright = (m % 6 === 0);
            ctx.fillStyle = `rgba(190,246,255,${(bright ? 0.6 : 0.22) * a * 2.2})`;
            ctx.fillRect(mx - 0.6, my - 0.6, bright ? 1.6 : 1.0, bright ? 1.6 : 1.0);
          }
        }
      }
      // orbiting markers on the outer command ring
      for (let m = 0; m < 3; m++) {
        const ang = (reduce ? 0.5 : t * 0.006) + (m / 3) * TAU;
        const rad = R * 1.18;
        const mx = cx + Math.cos(ang) * rad;
        const my = py + Math.sin(ang) * rad * FLAT;
        const g = ctx.createRadialGradient(mx, my, 0, mx, my, 6);
        g.addColorStop(0, "rgba(220,250,255,0.9)");
        g.addColorStop(1, "rgba(150,235,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(mx, my, 6, 0, TAU); ctx.fill();
      }
      // tight bright reactor core where the projection ignites
      const focus = ctx.createRadialGradient(cx, py, 0, cx, py, R * 0.55);
      focus.addColorStop(0, "rgba(190,248,255,0.42)");
      focus.addColorStop(0.5, "rgba(120,220,255,0.12)");
      focus.addColorStop(1, "rgba(120,220,255,0)");
      ctx.fillStyle = focus;
      ctx.beginPath(); ctx.ellipse(cx, py, R * 0.55, R * 0.14, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 5: telemetry connectors panel → globe ---------------------
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < PANELS.length; i++) {
        const pn = PANELS[i];
        const ax = pn.x * w;
        const ay = pn.y * h;
        const col = pn.hue === 1 ? "212,175,82" : "120,225,255";
        // direction from globe centre out to the card
        let dx = ax - cx, dy = ay - cy;
        const dl = Math.hypot(dx, dy) || 1;
        dx /= dl; dy /= dl;
        // STAGE 1: globe rim node (where the signal leaves the core)
        const rimX = cx + dx * (R + 3);
        const rimY = cy + dy * (R + 3);
        // STAGE 2: a relay node out on an intermediate orbit between rim & card
        const relayDist = R + (dl - R) * 0.52;
        const relayX = cx + dx * relayDist;
        const relayY = cy + dy * relayDist;
        // STAGE 3: card anchor (the side of the card facing the globe)
        const anchorX = ax;
        const anchorY = ay;

        // signal path drawn as two gently-curved segments: rim → relay → card,
        // each bowed slightly tangentially so it reads as an orbital trajectory
        // rather than a straight wire.
        const tnx = -dy, tny = dx; // tangent
        const bow1 = (dl - R) * 0.10;
        const c1x = (rimX + relayX) / 2 + tnx * bow1;
        const c1y = (rimY + relayY) / 2 + tny * bow1;
        const bow2 = (dl - R) * 0.08;
        const c2x = (relayX + anchorX) / 2 - tnx * bow2;
        const c2y = (relayY + anchorY) / 2 - tny * bow2;

        ctx.strokeStyle = `rgba(${col},0.30)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rimX, rimY);
        ctx.quadraticCurveTo(c1x, c1y, relayX, relayY);
        ctx.quadraticCurveTo(c2x, c2y, anchorX, anchorY);
        ctx.stroke();
        // brighter inner core of the path near the globe
        ctx.strokeStyle = `rgba(${col},0.5)`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(rimX, rimY);
        ctx.quadraticCurveTo(c1x, c1y, relayX, relayY);
        ctx.stroke();

        // rim node (emission point on the core)
        const rg = ctx.createRadialGradient(rimX, rimY, 0, rimX, rimY, 8);
        rg.addColorStop(0, `rgba(235,253,255,0.95)`);
        rg.addColorStop(0.4, `rgba(${col},0.5)`);
        rg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(rimX, rimY, 8, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(245,254,255,0.95)`;
        ctx.beginPath(); ctx.arc(rimX, rimY, 1.7, 0, TAU); ctx.fill();

        // relay node (a small hollow ring waypoint)
        const relayPulse = 0.6 + 0.4 * Math.sin(t * 0.05 + i * 1.3);
        ctx.strokeStyle = `rgba(${col},${0.7 * relayPulse})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(relayX, relayY, 3.2, 0, TAU); ctx.stroke();
        ctx.fillStyle = `rgba(235,253,255,${0.85 * relayPulse})`;
        ctx.beginPath(); ctx.arc(relayX, relayY, 1.1, 0, TAU); ctx.fill();

        // traveling telemetry packets along the full path (multiple, staggered)
        const segPath = (s: number) => {
          // s in [0,1] over the whole two-quad path; first half rim→relay
          if (s < 0.5) {
            const u = s / 0.5;
            const mx = (1 - u) * (1 - u) * rimX + 2 * (1 - u) * u * c1x + u * u * relayX;
            const my = (1 - u) * (1 - u) * rimY + 2 * (1 - u) * u * c1y + u * u * relayY;
            return [mx, my];
          }
          const u = (s - 0.5) / 0.5;
          const mx = (1 - u) * (1 - u) * relayX + 2 * (1 - u) * u * c2x + u * u * anchorX;
          const my = (1 - u) * (1 - u) * relayY + 2 * (1 - u) * u * c2y + u * u * anchorY;
          return [mx, my];
        };
        for (let pk = 0; pk < 2; pk++) {
          const prog = reduce ? 0.4 + pk * 0.3 : ((t * 0.006 + i * 0.21 + pk * 0.5) % 1);
          const [pxp, pyp] = segPath(prog);
          const fade = 1 - Math.abs(prog - 0.5) * 0.8;
          ctx.fillStyle = `rgba(235,253,255,${(0.9 * fade).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(pxp, pyp, 1.5, 0, TAU); ctx.fill();
          const pg = ctx.createRadialGradient(pxp, pyp, 0, pxp, pyp, 5);
          pg.addColorStop(0, `rgba(${col},${0.6 * fade})`);
          pg.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = pg;
          ctx.beginPath(); ctx.arc(pxp, pyp, 5, 0, TAU); ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 6: foreground bokeh particles -----------------------------
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < bokeh.length; i++) {
        const b = bokeh[i];
        if (!reduce) { b.x += b.vx; b.y += b.vy; }
        if (b.x < -40) b.x = w + 40; if (b.x > w + 40) b.x = -40;
        if (b.y < -40) b.y = h + 40; if (b.y > h + 40) b.y = -40;
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, `rgba(140,220,255,${b.a})`);
        g.addColorStop(1, "rgba(140,220,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const tick = () => {
      t += 1;
      draw();
      raf = requestAnimationFrame(tick);
    };

    resize();
    if (reduce) { draw(); } else { raf = requestAnimationFrame(tick); }
    const ro = new ResizeObserver(() => { resize(); if (reduce) draw(); });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      {/* peripheral system-status readout (top-right) — AI-OS chrome */}
      <div className="absolute right-5 top-[15%] z-10 hidden text-right lg:block">
        <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-200/60">System Status</div>
        <div className="mt-1 flex items-center justify-end gap-1.5">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-wider text-emerald-300">OPERATIONAL</span>
        </div>
        <div className="mt-1.5 flex items-center justify-end gap-1">
          {[3, 6, 4, 8, 5, 7].map((hgt, k) => (
            <span key={k} className="inline-block w-[3px] bg-cyan-300/40" style={{ height: `${hgt}px` }} />
          ))}
        </div>
      </div>
      {/* intelligence panels — crisp DOM holographic cards over the canvas */}
      <div className="hidden lg:block">
        {PANELS.map((p) => (
          <IntelPanel key={p.id} panel={p} />
        ))}
      </div>
    </div>
  );
};

// A single holographic intelligence panel.
const IntelPanel: React.FC<{ panel: Panel }> = ({ panel }) => {
  const accent = panel.hue === 1 ? "text-gold-300" : "text-cyan-200";
  const valueCol = panel.hue === 1 ? "text-gold-200" : "text-cyan-50";
  const edge = panel.side === "right";
  return (
    <div
      className={`absolute z-10 w-[172px] -translate-y-1/2 ${edge ? "-translate-x-full text-right" : "text-left"}`}
      style={{ left: `${panel.x * 100}%`, top: `${panel.y * 100}%` }}
    >
      <div
        className={`relative rounded-[3px] border px-3 py-2 backdrop-blur-[2px] ${
          panel.hue === 1 ? "border-gold-400/25" : "border-cyan-300/20"
        }`}
        style={{
          background: "linear-gradient(180deg, rgba(10,28,46,0.55), rgba(8,20,36,0.32))",
          boxShadow: panel.hue === 1
            ? "0 0 18px rgba(212,175,82,0.10), inset 0 0 12px rgba(212,175,82,0.05)"
            : "0 0 18px rgba(80,200,255,0.10), inset 0 0 12px rgba(80,200,255,0.05)",
        }}
      >
        {/* corner ticks */}
        <span className={`pointer-events-none absolute left-0 top-0 h-1.5 w-1.5 border-l border-t ${panel.hue === 1 ? "border-gold-300/60" : "border-cyan-300/60"}`} />
        <span className={`pointer-events-none absolute bottom-0 right-0 h-1.5 w-1.5 border-b border-r ${panel.hue === 1 ? "border-gold-300/60" : "border-cyan-300/60"}`} />
        <div className={`flex items-center gap-1.5 ${edge ? "flex-row-reverse" : ""}`}>
          <span className={`inline-block h-1 w-1 rounded-full ${panel.hue === 1 ? "bg-gold-300" : "bg-cyan-300"} animate-pulse`} />
          <div className={`text-[9.5px] font-semibold uppercase tracking-[0.16em] ${accent}`}>{panel.title}</div>
        </div>
        <div className={`mt-0.5 font-mono text-[19px] font-semibold leading-none ${valueCol}`}>{panel.value}</div>
        <div className="mt-0.5 text-[9.5px] uppercase tracking-wider text-white/35">{panel.delta}</div>
      </div>
    </div>
  );
};

export default GlobeScene;
