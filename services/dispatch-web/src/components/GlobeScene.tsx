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
// Globe is centred right-of-centre (GLOBE_CX) so the headline owns the left
// column. Panels ring the globe strictly OUTSIDE its disc and clear of the
// text: two across the top, four down the right edge, two along the bottom.
const GLOBE_CX = 0.605;
const GLOBE_CY = 0.52;
const PANELS: Panel[] = [
  // top (below the nav)
  { id: "acq", title: "Acquisition Intelligence", value: "12,438", delta: "active signals", x: 0.52, y: 0.20, side: "left", hue: 0 },
  // right edge stack
  { id: "pred", title: "Predictive Outcomes", value: "94.7%", delta: "model accuracy", x: 0.985, y: 0.27, side: "right", hue: 0 },
  { id: "flow", title: "Live Deal Flow", value: "$2.7T", delta: "in tracked value", x: 0.985, y: 0.42, side: "right", hue: 1 },
  { id: "closed", title: "Closed Transactions", value: "$187.6B", delta: "realized", x: 0.985, y: 0.57, side: "right", hue: 0 },
  { id: "resp", title: "Buyer Response Analytics", value: "61.2%", delta: "engagement rate", x: 0.985, y: 0.72, side: "right", hue: 0 },
  { id: "neg", title: "AI Negotiator", value: "+17.3%", delta: "value uplift", x: 0.93, y: 0.88, side: "right", hue: 1 },
  // bottom
  { id: "net", title: "Global Buyer Network", value: "58,341", delta: "verified buyers", x: 0.54, y: 0.90, side: "left", hue: 0 },
  { id: "exp", title: "Expected Outcome Engine", value: "0.91", delta: "confidence index", x: 0.73, y: 0.90, side: "left", hue: 0 },
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

    // --- background far dust + foreground bokeh ------------------------------
    let dust: { x: number; y: number; z: number; s: number }[] = [];
    let bokeh: { x: number; y: number; r: number; vx: number; vy: number; a: number }[] = [];
    const buildAmbient = () => {
      dust = [];
      const DN = Math.round((w * h) / 7000);
      for (let i = 0; i < DN; i++) {
        dust.push({ x: Math.random() * w, y: Math.random() * h, z: Math.random(), s: Math.random() * 1.2 + 0.3 });
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
      const R = Math.min(w, h) * 0.30;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const rot = reduce ? 0.6 : t * 0.0022; // globe spin (radians)
      const cosR = Math.cos(rot), sinR = Math.sin(rot);

      // ---- layer 0: background telemetry grid + far dust -------------------
      ctx.save();
      ctx.strokeStyle = "rgba(40,110,150,0.06)";
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
      for (let i = 0; i < dust.length; i++) {
        const d = dust[i];
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.01 + i));
        ctx.fillStyle = `rgba(110,180,220,${(0.05 + d.z * 0.10) * tw})`;
        ctx.fillRect(d.x, d.y, d.s, d.s);
      }
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 1: atmospheric volumetric glow ----------------------------
      ctx.globalCompositeOperation = "lighter";
      const atmo = ctx.createRadialGradient(cx, cy, R * 0.55, cx, cy, R * 1.7);
      atmo.addColorStop(0, "rgba(40,150,205,0.20)");
      atmo.addColorStop(0.45, "rgba(30,120,180,0.10)");
      atmo.addColorStop(1, "rgba(10,40,70,0)");
      ctx.fillStyle = atmo;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.7, 0, TAU); ctx.fill();
      // bright limb halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.16);
      halo.addColorStop(0, "rgba(120,225,255,0)");
      halo.addColorStop(0.6, "rgba(120,225,255,0.16)");
      halo.addColorStop(1, "rgba(120,225,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.16, 0, TAU); ctx.fill();
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
          const a = front ? 0.10 + 0.42 * df : 0.05 + 0.10 * df;
          ctx.strokeStyle = `rgba(125,220,255,${a.toFixed(3)})`;
          ctx.lineWidth = front ? 1.1 : 0.7;
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
      // inner body fill so the back particles read through a tinted sphere
      const body = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.1, cx, cy, R);
      body.addColorStop(0, "rgba(18,70,110,0.35)");
      body.addColorStop(1, "rgba(6,24,44,0.55)");
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();

      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < sphere.length; i++) {
        const p = sphere[i];
        const q = project(p.x, p.y, p.z);
        const df = (q.depth + 1) / 2; // 0 back → 1 front
        if (p.land) {
          const a = 0.10 + 0.85 * df;
          ctx.fillStyle = `rgba(130,236,255,${a.toFixed(3)})`;
          const s = 0.7 + 1.5 * df;
          ctx.fillRect(q.sx - s / 2, q.sy - s / 2, s, s);
        } else {
          // ocean/grid particles — faint, see-through on the back face
          const a = 0.03 + 0.18 * df;
          ctx.fillStyle = `rgba(70,165,210,${a.toFixed(3)})`;
          ctx.fillRect(q.sx - 0.5, q.sy - 0.5, 1, 1);
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 4: surface intelligence nodes + scan sweep ----------------
      ctx.globalCompositeOperation = "lighter";
      const litNodes: { sx: number; sy: number; df: number }[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const q = project(n.x, n.y, n.z);
        const df = (q.depth + 1) / 2;
        if (q.depth <= 0.04) continue; // front face only
        const pulse = 0.55 + 0.45 * Math.sin(t * 0.05 + n.phase * 3);
        const a = (0.5 + 0.5 * df) * pulse;
        const rr = 7 * df;
        const g = ctx.createRadialGradient(q.sx, q.sy, 0, q.sx, q.sy, rr);
        g.addColorStop(0, `rgba(215,250,255,${a})`);
        g.addColorStop(0.4, `rgba(120,225,255,${a * 0.5})`);
        g.addColorStop(1, "rgba(120,225,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(q.sx, q.sy, rr, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(240,254,255,${a})`;
        ctx.beginPath(); ctx.arc(q.sx, q.sy, 1.2 * df, 0, TAU); ctx.fill();
        litNodes.push({ sx: q.sx, sy: q.sy, df });
      }

      // scan sweep — a bright horizontal band travelling down the globe
      const scanY = cy - R + ((reduce ? 0.5 : (t * 0.6) % (R * 2)) );
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
      const sg = ctx.createLinearGradient(0, scanY - 14, 0, scanY + 14);
      sg.addColorStop(0, "rgba(120,225,255,0)");
      sg.addColorStop(0.5, "rgba(150,240,255,0.22)");
      sg.addColorStop(1, "rgba(120,225,255,0)");
      ctx.fillStyle = sg;
      ctx.fillRect(cx - R, scanY - 14, R * 2, 28);
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";

      // crisp limb
      ctx.strokeStyle = "rgba(130,232,255,0.40)";
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();

      // ---- rings: front halves (over the globe) ----------------------------
      for (let ri = 0; ri < RINGS.length; ri++) drawRing(ri, true);

      // ---- holographic projection platform beneath -------------------------
      ctx.globalCompositeOperation = "lighter";
      const py = cy + R * 1.18;
      // light beam
      const beam = ctx.createLinearGradient(0, py, 0, cy);
      beam.addColorStop(0, "rgba(150,240,255,0.30)");
      beam.addColorStop(1, "rgba(150,240,255,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.16, py); ctx.lineTo(cx + R * 0.16, py);
      ctx.lineTo(cx + R * 0.05, cy); ctx.lineTo(cx - R * 0.05, cy); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 5; k++) {
        const rad = R * (0.35 + k * 0.22);
        const a = 0.32 - k * 0.05;
        ctx.strokeStyle = `rgba(135,235,255,${a})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, py, rad, rad * 0.22, 0, 0, TAU);
        ctx.stroke();
      }
      const plat = ctx.createRadialGradient(cx, py, 0, cx, py, R * 1.1);
      plat.addColorStop(0, "rgba(120,225,255,0.22)");
      plat.addColorStop(1, "rgba(120,225,255,0)");
      ctx.fillStyle = plat;
      ctx.beginPath(); ctx.ellipse(cx, py, R * 1.1, R * 0.26, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 5: telemetry connectors panel → globe ---------------------
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < PANELS.length; i++) {
        const pn = PANELS[i];
        const ax = pn.x * w;
        const ay = pn.y * h;
        // connect to the globe rim point in the panel's direction
        let dx = ax - cx, dy = ay - cy;
        const dl = Math.hypot(dx, dy) || 1;
        dx /= dl; dy /= dl;
        const rimX = cx + dx * (R + 4);
        const rimY = cy + dy * (R + 4);
        // start the line a touch inside the card toward the globe
        const startX = ax - dx * 6;
        const startY = ay - dy * 6;
        const col = pn.hue === 1 ? "212,175,82" : "120,225,255";
        const grad = ctx.createLinearGradient(startX, startY, rimX, rimY);
        grad.addColorStop(0, `rgba(${col},0.05)`);
        grad.addColorStop(0.5, `rgba(${col},0.32)`);
        grad.addColorStop(1, `rgba(${col},0.55)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(startX, startY); ctx.lineTo(rimX, rimY); ctx.stroke();
        // rim node
        ctx.fillStyle = `rgba(${col},0.9)`;
        ctx.beginPath(); ctx.arc(rimX, rimY, 1.8, 0, TAU); ctx.fill();
        const rg = ctx.createRadialGradient(rimX, rimY, 0, rimX, rimY, 7);
        rg.addColorStop(0, `rgba(${col},0.6)`);
        rg.addColorStop(1, `rgba(${col},0)`);
        ctx.fillStyle = rg;
        ctx.beginPath(); ctx.arc(rimX, rimY, 7, 0, TAU); ctx.fill();
        // traveling telemetry pulse along the connector
        const prog = reduce ? 0.5 : ((t * 0.012 + i * 0.37) % 1);
        const px2 = startX + (rimX - startX) * prog;
        const py2 = startY + (rimY - startY) * prog;
        ctx.fillStyle = `rgba(${col},${0.85 * (1 - Math.abs(prog - 0.5) * 1.2)})`;
        ctx.beginPath(); ctx.arc(px2, py2, 1.6, 0, TAU); ctx.fill();
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
      className={`absolute z-10 w-[190px] -translate-y-1/2 ${edge ? "-translate-x-full text-right" : "text-left"}`}
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
