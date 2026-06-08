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

// Continent outlines as coarse polygons of [lon, lat] vertices. Point-in-
// polygon (not axis-aligned boxes) gives true diagonal / tapered silhouettes —
// recognisable continents whose coastlines are NOT rectangular. Deliberately
// low-detail: just enough vertices that each landmass reads at a glance.
const CONTINENTS: [number, number][][] = [
  // North America
  [[-168,66],[-160,71],[-130,70],[-95,70],[-82,73],[-60,83],[-55,60],[-66,50],
   [-60,46],[-66,44],[-70,42],[-74,40],[-76,35],[-81,31],[-81,25],[-90,29],
   [-97,26],[-100,22],[-106,23],[-110,23],[-114,30],[-117,33],[-124,40],
   [-124,48],[-130,54],[-140,60],[-152,58],[-165,55],[-168,60]],
  // Greenland
  [[-46,60],[-30,60],[-20,70],[-22,76],[-32,83],[-50,82],[-58,76],[-54,68],[-46,60]],
  // South America
  [[-78,8],[-72,11],[-62,10],[-50,0],[-44,-3],[-40,-12],[-38,-23],[-48,-25],
   [-53,-34],[-58,-39],[-62,-41],[-66,-46],[-70,-52],[-73,-54],[-75,-46],
   [-71,-34],[-72,-24],[-76,-14],[-81,-6],[-80,2],[-78,8]],
  // Africa
  [[-16,15],[-10,21],[-2,30],[10,34],[20,33],[25,32],[32,31],[36,22],[43,12],
   [51,12],[42,-2],[40,-10],[35,-18],[32,-26],[26,-34],[18,-35],[12,-18],
   [9,-2],[8,5],[-8,5],[-12,8],[-16,15]],
  // Europe
  [[-10,43],[-9,38],[0,38],[8,44],[18,40],[24,40],[28,45],[40,46],[42,52],
   [30,60],[24,66],[10,64],[5,60],[8,54],[2,51],[-5,49],[-10,43]],
  // Asia
  [[26,40],[30,45],[40,48],[48,52],[44,60],[60,68],[80,73],[105,76],[140,73],
   [160,70],[180,66],[170,60],[160,58],[150,52],[140,46],[130,42],[122,40],
   [120,32],[110,21],[105,10],[95,6],[90,22],[80,8],[74,8],[70,20],[60,25],
   [56,26],[50,30],[44,38],[36,36],[28,36],[26,40]],
  // Australia
  [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-18],[150,-24],
   [153,-30],[148,-38],[140,-38],[130,-32],[118,-35],[114,-30],[114,-22]],
  // Japan / NZ / Madagascar / Indonesia (small)
  [[130,31],[136,34],[140,38],[142,44],[138,40],[134,35],[130,31]],
  [[166,-46],[172,-41],[178,-38],[174,-42],[170,-47],[166,-46]],
  [[43,-25],[46,-16],[50,-13],[50,-22],[46,-26],[43,-25]],
  [[95,2],[110,0],[120,-2],[130,-3],[120,-8],[105,-8],[98,-4],[95,2]],
];
function pointInPoly(lon: number, lat: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    if (((yi > lat) !== (yj > lat)) && (lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
function isLand(lat: number, lon: number): boolean {
  for (let i = 0; i < CONTINENTS.length; i++) {
    if (pointInPoly(lon, lat, CONTINENTS[i])) return true;
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
// Globe sits right-of-centre and high enough that its holographic base platform
// reads fully beneath it (as in the target). 6 small text labels in a clean
// 3-left / 3-right arrangement hugging the globe. Pure cyan, no amber. Each
// label is plain text (bold title + thin value line) wired to the globe by a
// hairline connector ending in a small hollow ring node on the inner orbit.
const GLOBE_CX = 0.635;
const GLOBE_CY = 0.43;
const PANELS: Panel[] = [
  // left column (between the headline and the globe)
  { id: "acq", title: "Acquisition Intelligence", value: "12.4K", delta: "active signals", x: 0.42, y: 0.17, side: "left", hue: 0 },
  { id: "flow", title: "Live Deal Flow", value: "$2.7T", delta: "in tracked value", x: 0.42, y: 0.40, side: "left", hue: 0 },
  { id: "net", title: "Global Buyer Network", value: "58,341", delta: "buyers", x: 0.42, y: 0.62, side: "left", hue: 0 },
  // right column (hugging the globe's right side, not the screen edge)
  { id: "pred", title: "Predictive Outcomes", value: "94.7%", delta: "model accuracy", x: 0.86, y: 0.21, side: "right", hue: 0 },
  { id: "closed", title: "Closed Deals", value: "$187.6B", delta: "realized", x: 0.875, y: 0.43, side: "right", hue: 0 },
  { id: "neg", title: "AI Negotiator", value: "17.3%", delta: "value uplift", x: 0.86, y: 0.63, side: "right", hue: 0 },
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

    // --- precompute the globe particle field ---------------------------------
    // ONE unified point cloud. Geography emerges from PARTICLE DENSITY alone —
    // no outlines, no coastlines, no strokes. Every point is a uniform random
    // sample on the sphere; land points simply occur at much higher density and
    // slightly higher brightness, so the brain reconstructs the continents from
    // distribution rather than from drawn borders. Land sits LOW-contrast,
    // embedded in the same field as the ocean (not painted on top).
    type P = { x: number; y: number; z: number; land: boolean; b: number };
    let field: P[] = [];
    let nodes: { x: number; y: number; z: number; phase: number }[] = [];
    const buildSphere = (count: number) => {
      const golden = Math.PI * (3 - Math.sqrt(5));
      field = [];
      // (1) uniform ocean lattice across the WHOLE sphere — the volume/base
      const oceanCount = Math.round(count * 0.5);
      for (let i = 0; i < oceanCount; i++) {
        const y = 1 - (i / (oceanCount - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const th = i * golden;
        field.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, land: false, b: 0.5 + Math.random() * 0.5 });
      }
      // (2) EXTRA points only where land is — this concentration (not a border)
      // is what makes continents legible. Many more land points than ocean so
      // the DENSITY difference reads clearly even at low per-point brightness.
      const landTarget = Math.round(count * 1.7);
      let tries = 0;
      const maxTries = landTarget * 12;
      while (tries < maxTries && field.length < oceanCount + landTarget) {
        tries++;
        const u = Math.random() * 2 - 1;
        const ph = Math.random() * TAU;
        const r = Math.sqrt(Math.max(0, 1 - u * u));
        const x = r * Math.cos(ph), y = u, z = r * Math.sin(ph);
        const lat = Math.asin(y) / DEG;
        const lon = Math.atan2(z, x) / DEG;
        // soft jitter so density fades at edges (no hard rim, no border line)
        const jLat = lat + (Math.random() - 0.5) * 4;
        const jLon = lon + (Math.random() - 0.5) * 4;
        if (!isLand(jLat, jLon)) continue;
        field.push({ x, y, z, land: true, b: 0.4 + Math.random() * 0.6 });
      }
      // surface intelligence nodes — distinct points that pulse + anchor data
      nodes = [];
      const NODES = 30;
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
    // hundreds of micro telemetry markers (kind: 0 dot · 1 tick · 2 ring · 3 cross)
    // placed in a ring of space AROUND the globe — institutional density, only
    // noticed on closer inspection.
    let micro: { ang: number; rad: number; kind: number; ph: number; sp: number; sz: number }[] = [];
    const buildMicro = () => {
      micro = [];
      const MN = 320;
      for (let i = 0; i < MN; i++) {
        micro.push({
          ang: Math.random() * TAU,
          rad: 0.55 + Math.random() * 1.7, // in units of R from globe centre
          kind: Math.floor(Math.random() * 4),
          ph: Math.random() * TAU,
          sp: 0.004 + Math.random() * 0.03,
          sz: Math.random() < 0.15 ? 1.8 : 1.0,
        });
      }
    };
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
    // The benchmark's orbits are nearly horizontal ellipses hugging the globe —
    // NOT steep 45° diagonals. Keep every normal close to vertical [0,1,0] so
    // each ring reads as a flat orbital band, with only slight tilt variation.
    type Ring = { n: [number, number, number]; rad: number; spin: number; seg: number; nodes: number };
    const RINGS: Ring[] = [
      { n: [0.05, 1, 0.05], rad: 1.12, spin: 0.0006, seg: 150, nodes: 2 },
      { n: [-0.06, 1, 0.07], rad: 1.26, spin: -0.0008, seg: 160, nodes: 1 },
      { n: [0.09, 1, -0.04], rad: 1.40, spin: 0.0010, seg: 170, nodes: 2 },
      { n: [-0.04, 1, -0.09], rad: 1.55, spin: -0.0007, seg: 170, nodes: 1 },
      { n: [0.12, 1, 0.03], rad: 1.70, spin: 0.0009, seg: 180, nodes: 2 },
      { n: [-0.10, 1, 0.06], rad: 1.86, spin: -0.0006, seg: 190, nodes: 1 },
      { n: [0.03, 1, 0.11], rad: 2.04, spin: 0.0005, seg: 200, nodes: 1 },
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
      // dense computational point cloud — individual points near-indistinguishable
      const count = Math.max(45000, Math.min(110000, Math.round((w * h) / 9)));
      buildSphere(count);
      buildAmbient();
      buildMicro();
    };

    // camera tilt (look slightly down on the globe)
    const TILT = -0.34;
    const cosT = Math.cos(TILT), sinT = Math.sin(TILT);

    const draw = () => {
      const cx = w * GLOBE_CX;
      const cy = h * GLOBE_CY;
      const R = Math.min(w, h) * 0.205;

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

      // volumetric atmospheric bloom — a broad, soft haze behind the globe that
      // gives the scene depth (signal-haze layer between dust and the sphere).
      const bloom = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 2.1);
      bloom.addColorStop(0, "rgba(40,150,205,0.10)");
      bloom.addColorStop(0.5, "rgba(28,110,170,0.05)");
      bloom.addColorStop(1, "rgba(12,44,78,0)");
      ctx.fillStyle = bloom;
      ctx.beginPath(); ctx.arc(cx, cy, R * 2.1, 0, TAU); ctx.fill();
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
          // a small bright marker glides around each ring; the band itself stays
          // thin and even — elegant orbital line, not a heavy energy streak.
          const seg01 = (s / rg.seg + spin / TAU) % 1;
          const crest = (reduce ? 0.3 : (t * 0.004 + ri * 0.2) % 1);
          let pulse = Math.abs(((seg01 - crest + 1) % 1) - 0);
          pulse = Math.max(0, 1 - pulse * 10); // tighter, subtler highlight
          const baseA = front ? 0.10 + 0.32 * df : 0.04 + 0.08 * df;
          const a = Math.min(1, baseA + pulse * (front ? 0.5 : 0.18));
          const bright = pulse > 0.25;
          ctx.strokeStyle = bright
            ? `rgba(200,248,255,${a.toFixed(3)})`
            : `rgba(110,210,250,${a.toFixed(3)})`;
          ctx.lineWidth = front ? 0.8 : 0.6; // thin, even line
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

      // ---- graticule: faint longitude / latitude lines on the sphere -------
      // The benchmark shows a subtle wireframe grid under the dot field. Draw
      // meridians + parallels as projected great/small circles, front-brighter.
      ctx.globalCompositeOperation = "lighter";
      const gridSeg = 64;
      // meridians (lines of constant longitude)
      for (let lon = 0; lon < 180; lon += 30) {
        const lonR = lon * DEG;
        ctx.beginPath();
        let pen = false;
        for (let s = 0; s <= gridSeg; s++) {
          const latA = -Math.PI / 2 + (s / gridSeg) * Math.PI;
          const x = Math.cos(latA) * Math.cos(lonR);
          const y = Math.sin(latA);
          const z = Math.cos(latA) * Math.sin(lonR);
          const q = project(x, y, z);
          if (q.depth < -0.04) { pen = false; continue; }
          if (!pen) { ctx.moveTo(q.sx, q.sy); pen = true; } else ctx.lineTo(q.sx, q.sy);
        }
        ctx.strokeStyle = "rgba(90,180,225,0.14)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      // parallels (lines of constant latitude)
      for (let lat = -60; lat <= 60; lat += 30) {
        const latR = lat * DEG;
        ctx.beginPath();
        let pen = false;
        for (let s = 0; s <= gridSeg; s++) {
          const lonA = -Math.PI + (s / gridSeg) * TAU;
          const x = Math.cos(latR) * Math.cos(lonA);
          const y = Math.sin(latR);
          const z = Math.cos(latR) * Math.sin(lonA);
          const q = project(x, y, z);
          if (q.depth < -0.04) { pen = false; continue; }
          if (!pen) { ctx.moveTo(q.sx, q.sy); pen = true; } else ctx.lineTo(q.sx, q.sy);
        }
        ctx.strokeStyle = "rgba(90,180,225,0.13)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 3: unified particle globe ---------------------------------
      // One field. Geography emerges from DENSITY, never from outlines. Land
      // points are slightly brighter than ocean but LOW-contrast, so continents
      // are embedded in the data field rather than drawn on top of it.
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < field.length; i++) {
        const p = field[i];
        const q = project(p.x, p.y, p.z);
        if (q.depth <= -0.05) continue;
        const df = (q.depth + 1) / 2;
        if (p.land) {
          // low per-point alpha — legibility comes from DENSITY, not contrast
          const a = (0.04 + 0.14 * df * df) * p.b;
          ctx.fillStyle = `rgba(125,216,251,${a.toFixed(3)})`;
          ctx.fillRect(q.sx - 0.4, q.sy - 0.4, 0.78, 0.78);
        } else {
          const a = (0.018 + 0.06 * df * df) * p.b;
          if (a < 0.011) continue;
          ctx.fillStyle = `rgba(76,170,214,${a.toFixed(3)})`;
          ctx.fillRect(q.sx - 0.33, q.sy - 0.33, 0.62, 0.62);
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

      // ====================================================================
      // 12-LAYER HOLOGRAPHIC QUANTUM PROJECTION ARRAY (the foundation)
      // Not rings under a globe — a machine that GENERATES the globe in real
      // time. 30+ unique circular elements, every layer independent motion,
      // strict blue→cyan→white palette. Drawn back→front.
      //   11 ambient rings · 8 scan wave · 5 segmented mech · 3 tracking rings
      //   · 4 data rails · 7 circuit geometry · 6 orbit nodes · 2 aperture
      //   · 9 beam · 10 distortion · 1 core · 12 reflection.
      // ====================================================================
      ctx.globalCompositeOperation = "lighter";
      const py = cy + R * 1.16;       // reactor centre, low so it fans out
      const FLAT = 0.22;               // ellipse foreshortening (viewed at angle)
      const rt = reduce ? 0 : t;       // reactor clock (frozen if reduced-motion)
      // helper: a point on the foundation plane at radius (×R) and angle
      const fx = (rr: number, a: number) => cx + Math.cos(a) * rr * R;
      const fy = (rr: number, a: number) => py + Math.sin(a) * rr * R * FLAT;
      const ering = (rr: number, lw: number, style: string, a0 = 0, a1 = TAU) => {
        ctx.lineWidth = lw; ctx.strokeStyle = style;
        ctx.beginPath(); ctx.ellipse(cx, py, rr * R, rr * R * FLAT, 0, a0, a1); ctx.stroke();
      };
      const pulse = 0.85 + 0.15 * Math.sin(rt * 0.06);

      // ── LAYER 12 · Environmental reflection ─ broad cast light on the scene ─
      const refl = ctx.createRadialGradient(cx, py, 0, cx, py, R * 3.4);
      refl.addColorStop(0, "rgba(0,229,255,0.18)");
      refl.addColorStop(0.4, "rgba(20,140,200,0.07)");
      refl.addColorStop(1, "rgba(2,8,18,0)");
      ctx.fillStyle = refl;
      ctx.beginPath(); ctx.ellipse(cx, py, R * 3.4, R * 3.4 * FLAT * 1.25, 0, 0, TAU); ctx.fill();

      // ── LAYER 11 · Ambient energy rings ─ huge, ~5% opacity, create scale ───
      for (let k = 0; k < 4; k++) {
        const rr = 2.6 + k * 0.55;
        const spin = rt * (k % 2 ? -0.0003 : 0.0004);
        ering(rr, 0.8, `rgba(51,240,255,${(0.06 - k * 0.01).toFixed(3)})`);
        // a faint long arc drifting around it
        ering(rr, 1.0, "rgba(168,255,255,0.07)", spin, spin + 1.2);
      }

      // ── LAYER 8 · Scanning wave ─ slow radar pulse expanding from centre ────
      for (let s = 0; s < 2; s++) {
        const phase = ((rt * 0.0016 + s * 0.5) % 1);
        const rr = 0.2 + phase * 2.4;
        const a = (1 - phase) * 0.5;
        ering(rr, 1.4, `rgba(120,236,255,${a.toFixed(3)})`);
      }

      // ── LAYER 5 · Segmented mechanical rings ─ broken arcs, satellite arrays ─
      const segRings = [
        { rr: 0.62, sp: -0.0014, segs: [[0, 0.7], [1.1, 0.5], [2.0, 0.9], [3.4, 0.6], [4.6, 0.8]] },
        { rr: 1.18, sp: 0.0010, segs: [[0.2, 1.0], [1.8, 0.6], [3.0, 1.3], [4.9, 0.7]] },
        { rr: 1.78, sp: -0.0008, segs: [[0, 0.5], [0.9, 1.4], [2.7, 0.6], [3.7, 1.1], [5.3, 0.5]] },
      ];
      for (const sr of segRings) {
        const base = rt * sr.sp;
        for (const [a0, len] of sr.segs) {
          ering(sr.rr, 2.2, "rgba(0,229,255,0.30)", base + a0, base + a0 + len);
          // a brighter highlight sliver inside the segment
          ering(sr.rr, 1.0, "rgba(168,255,255,0.5)", base + a0, base + a0 + Math.min(0.18, len));
        }
      }

      // ── LAYER 3 · Inner tracking rings ─ 7 UNIQUE rings, varied everything ──
      const trackRings = [
        { rr: 0.30, lw: 1.6, a: 0.85, sp: 0.0050 },
        { rr: 0.40, lw: 0.8, a: 0.34, sp: -0.0034 },
        { rr: 0.52, lw: 2.2, a: 0.55, sp: 0.0022 }, // a thick bright ring
        { rr: 0.78, lw: 0.7, a: 0.26, sp: -0.0018 },
        { rr: 0.94, lw: 1.3, a: 0.62, sp: 0.0014 },
        { rr: 1.42, lw: 0.9, a: 0.30, sp: -0.0010 },
        { rr: 2.05, lw: 1.1, a: 0.40, sp: 0.0007 },
      ];
      for (const tr of trackRings) {
        ering(tr.rr, tr.lw, `rgba(51,240,255,${tr.a})`);
        // unique rotating bright segment per ring (independent motion)
        const seg = rt * tr.sp;
        ering(tr.rr, tr.lw + 0.8, `rgba(200,250,255,${Math.min(1, tr.a + 0.3).toFixed(3)})`, seg, seg + 0.5 + tr.rr * 0.2);
      }

      // ── LAYER 4 · Data-rail rings ─ ultra-thin tracks carrying moving dots ──
      const rails = [0.36, 0.46, 0.68, 0.86, 1.10, 1.30, 1.60, 1.90];
      for (let k = 0; k < rails.length; k++) {
        const rr = rails[k];
        ering(rr, 0.5, "rgba(0,229,255,0.12)");
        const cnt = 6 + (k % 3) * 3;
        const dir = k % 2 ? -1 : 1;
        for (let d = 0; d < cnt; d++) {
          const a = (d / cnt) * TAU + dir * rt * (0.004 + k * 0.0005);
          const x = fx(rr, a), y = fy(rr, a);
          ctx.fillStyle = "rgba(168,255,255,0.85)";
          ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
        }
      }

      // ── LAYER 7 · Circuit geometry ─ tiny digital traces inside the array ───
      for (let k = 0; k < 28; k++) {
        const a = (k / 28) * TAU + rt * 0.0003;
        const r0 = 0.34 + (k % 4) * 0.02;
        const r1 = r0 + 0.12 + (k % 3) * 0.05;
        const ca = Math.cos(a), sa = Math.sin(a) * FLAT;
        ctx.strokeStyle = "rgba(80,210,245,0.10)"; ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx + ca * r0 * R, py + sa * r0 * R);
        ctx.lineTo(cx + ca * r1 * R, py + sa * r1 * R);
        // small right-angle elbow → motherboard trace
        const a2 = a + 0.05;
        ctx.lineTo(cx + Math.cos(a2) * r1 * R, py + Math.sin(a2) * FLAT * r1 * R);
        ctx.stroke();
        // tiny node rectangle at the end
        const ex = cx + Math.cos(a2) * r1 * R, ey = py + Math.sin(a2) * FLAT * r1 * R;
        ctx.fillStyle = "rgba(120,225,255,0.18)";
        ctx.fillRect(ex - 1, ey - 0.7, 2, 1.4);
      }

      // ── LAYER 6 · Orbiting light nodes ─ bright particles processing data ───
      for (let k = 0; k < 18; k++) {
        const rr = 0.4 + (k % 6) * 0.28;
        const dir = k % 2 ? -1 : 1;
        const a = (k / 18) * TAU + dir * rt * (0.003 + (k % 4) * 0.001);
        const x = fx(rr, a), y = fy(rr, a);
        const sz = 1.4 + (k % 3);
        const g = ctx.createRadialGradient(x, y, 0, x, y, sz * 3);
        g.addColorStop(0, "rgba(220,252,255,0.95)");
        g.addColorStop(0.4, "rgba(51,240,255,0.5)");
        g.addColorStop(1, "rgba(0,229,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, sz * 3, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(240,255,255,0.95)";
        ctx.beginPath(); ctx.arc(x, y, sz * 0.5, 0, TAU); ctx.fill();
      }

      // ── LAYER 2 · Energy aperture ─ segmented reactor opening around core ───
      const apR = 0.24;
      const apSpin = rt * 0.012;
      for (let s = 0; s < 8; s++) {
        const a0 = apSpin + s * (TAU / 8);
        ering(apR, 3.0, "rgba(0,229,255,0.40)", a0, a0 + 0.5);
        ering(apR * 0.78, 2.0, "rgba(168,255,255,0.55)", -apSpin * 1.4 + s * (TAU / 8), -apSpin * 1.4 + s * (TAU / 8) + 0.32);
      }
      // calibration ticks around the aperture
      for (let m = 0; m < 48; m++) {
        const a = (m / 48) * TAU - apSpin;
        const big = m % 6 === 0;
        const r0 = apR * (big ? 1.10 : 1.04), r1 = apR * 1.18;
        ctx.strokeStyle = `rgba(200,250,255,${big ? 0.7 : 0.28})`;
        ctx.lineWidth = big ? 1.0 : 0.5;
        ctx.beginPath();
        ctx.moveTo(fx(r0, a), fy(r0, a)); ctx.lineTo(fx(r1, a), fy(r1, a)); ctx.stroke();
      }

      // ── LAYER 9 · Holographic projection beam ─ volumetric light column ─────
      const beamTop = cy - R * 0.15;
      const beam = ctx.createLinearGradient(0, py, 0, beamTop);
      beam.addColorStop(0, "rgba(120,236,255,0.32)");
      beam.addColorStop(0.5, "rgba(60,200,245,0.12)");
      beam.addColorStop(1, "rgba(60,200,245,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.12, py); ctx.lineTo(cx + R * 0.12, py);
      ctx.lineTo(cx + R * 0.44, beamTop); ctx.lineTo(cx - R * 0.44, beamTop);
      ctx.closePath(); ctx.fill();
      // bright inner column (white→cyan)
      const beam2 = ctx.createLinearGradient(0, py, 0, beamTop);
      beam2.addColorStop(0, "rgba(240,255,255,0.5)");
      beam2.addColorStop(0.6, "rgba(168,255,255,0.14)");
      beam2.addColorStop(1, "rgba(168,255,255,0)");
      ctx.fillStyle = beam2;
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.04, py); ctx.lineTo(cx + R * 0.04, py);
      ctx.lineTo(cx + R * 0.14, beamTop); ctx.lineTo(cx - R * 0.14, beamTop);
      ctx.closePath(); ctx.fill();
      // particle dust + noise rising inside the beam
      for (let mIdx = 0; mIdx < 26; mIdx++) {
        const fp = ((rt * 0.005 + mIdx * 0.038) % 1);
        const yy = py + (beamTop - py) * fp;
        const spread = R * (0.06 + 0.38 * fp);
        const xx = cx + Math.sin(mIdx * 1.7 + rt * 0.02) * spread * (0.4 + 0.6 * Math.random());
        ctx.fillStyle = `rgba(220,252,255,${(0.5 * (1 - fp)).toFixed(3)})`;
        ctx.fillRect(xx - 0.6, yy - 0.6, 1.2, 1.2);
      }

      // ── LAYER 10 · Projection distortion ─ where beam meets globe (render) ──
      const dyc = cy + R * 0.2; // just below globe centre, where beam enters
      const dist = ctx.createRadialGradient(cx, dyc, 0, cx, dyc, R * 0.5);
      dist.addColorStop(0, `rgba(180,245,255,${(0.18 * pulse).toFixed(3)})`);
      dist.addColorStop(1, "rgba(120,230,255,0)");
      ctx.fillStyle = dist;
      ctx.beginPath(); ctx.arc(cx, dyc, R * 0.5, 0, TAU); ctx.fill();
      for (let k = 0; k < 14; k++) {
        const a = Math.random() * TAU, rr = Math.random() * R * 0.4;
        const x = cx + Math.cos(a) * rr, y = dyc + Math.sin(a) * rr * 0.7;
        ctx.fillStyle = `rgba(220,252,255,${(0.4 * Math.random()).toFixed(3)})`;
        ctx.fillRect(x - 0.6, y - 0.6, 1.2, 1.2);
      }

      // ── LAYER 1 · Core energy source ─ brightest object; artificial sun ─────
      const halo2 = ctx.createRadialGradient(cx, py, 0, cx, py, R * 0.95);
      halo2.addColorStop(0, `rgba(235,255,255,${(0.85 * pulse).toFixed(3)})`);
      halo2.addColorStop(0.3, "rgba(120,236,255,0.28)");
      halo2.addColorStop(1, "rgba(0,229,255,0)");
      ctx.fillStyle = halo2;
      ctx.beginPath(); ctx.ellipse(cx, py, R * 0.95, R * 0.26, 0, 0, TAU); ctx.fill();
      // radial emission spikes thrown outward
      for (let s = 0; s < 16; s++) {
        const a = (s / 16) * TAU + rt * 0.008;
        const len = R * (0.36 + 0.14 * Math.sin(rt * 0.05 + s));
        const ex = fx(len / R, a), ey = fy(len / R, a);
        const g = ctx.createLinearGradient(cx, py, ex, ey);
        g.addColorStop(0, "rgba(235,255,255,0.5)");
        g.addColorStop(1, "rgba(168,255,255,0)");
        ctx.strokeStyle = g; ctx.lineWidth = 1.0;
        ctx.beginPath(); ctx.moveTo(cx, py); ctx.lineTo(ex, ey); ctx.stroke();
      }
      const dot = ctx.createRadialGradient(cx, py, 0, cx, py, R * 0.22);
      dot.addColorStop(0, `rgba(255,255,255,${pulse.toFixed(3)})`);
      dot.addColorStop(0.45, "rgba(200,250,255,0.55)");
      dot.addColorStop(1, "rgba(168,255,255,0)");
      ctx.fillStyle = dot;
      ctx.beginPath(); ctx.ellipse(cx, py, R * 0.22, R * 0.10, 0, 0, TAU); ctx.fill();
      // white-hot plasma nucleus
      ctx.fillStyle = `rgba(255,255,255,${pulse.toFixed(3)})`;
      ctx.beginPath(); ctx.ellipse(cx, py, R * 0.055, R * 0.028, 0, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // ---- micro telemetry field — hundreds of faint markers around the core,
      // each blinking on its own clock. Reads as institutional data density;
      // mostly noticed on closer inspection.
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < micro.length; i++) {
        const m = micro[i];
        const drift = reduce ? 0 : t * m.sp * 0.04;
        const ang = m.ang + drift;
        const mx = cx + Math.cos(ang) * m.rad * R;
        const my = cy + Math.sin(ang) * m.rad * R * 0.96;
        const blink = 0.35 + 0.65 * Math.abs(Math.sin((reduce ? 0 : t) * m.sp + m.ph));
        const a = blink * 0.4;
        if (a < 0.05) continue;
        ctx.strokeStyle = `rgba(150,228,255,${a.toFixed(3)})`;
        ctx.fillStyle = `rgba(170,240,255,${a.toFixed(3)})`;
        ctx.lineWidth = 0.6;
        const z = m.sz;
        if (m.kind === 0) {
          ctx.fillRect(mx - 0.5 * z, my - 0.5 * z, z, z);
        } else if (m.kind === 1) {
          ctx.fillRect(mx - 0.4, my - 1.2 * z, 0.8, 2.4 * z); // tick
        } else if (m.kind === 2) {
          ctx.beginPath(); ctx.arc(mx, my, 1.6 * z, 0, TAU); ctx.stroke(); // ring
        } else {
          ctx.beginPath(); // cross
          ctx.moveTo(mx - 1.6 * z, my); ctx.lineTo(mx + 1.6 * z, my);
          ctx.moveTo(mx, my - 1.6 * z); ctx.lineTo(mx, my + 1.6 * z);
          ctx.stroke();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      // ---- layer 5: label connectors (benchmark style) --------------------
      // Each label gets a thin cyan leader: a short horizontal stub from the
      // label, then a line to a small hollow ring node sitting just outside the
      // globe rim, with a faint pulse running inward to the globe.
      ctx.globalCompositeOperation = "lighter";
      const col = "130,228,255";
      for (let i = 0; i < PANELS.length; i++) {
        const pn = PANELS[i];
        const edge = pn.side === "right";
        // label anchor (inner edge of the panel, facing the globe)
        const ax = pn.x * w + (edge ? -176 : 176);
        const ay = pn.y * h;
        // node sits just outside the globe rim, on the line from centre to label
        let dx = ax - cx, dy = ay - cy;
        const dl = Math.hypot(dx, dy) || 1;
        dx /= dl; dy /= dl;
        const nodeX = cx + dx * (R + Math.min(46, (dl - R) * 0.5));
        const nodeY = cy + dy * (R + Math.min(46, (dl - R) * 0.5));
        // short horizontal stub from the label
        const stubX = ax + (edge ? 14 : -14);

        ctx.strokeStyle = `rgba(${col},0.30)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(stubX, ay);
        ctx.lineTo(nodeX, nodeY);
        ctx.stroke();

        // small hollow ring node (the benchmark's signature marker)
        const pulse = 0.6 + 0.4 * Math.sin(t * 0.05 + i * 1.5);
        ctx.strokeStyle = `rgba(${col},${(0.85 * pulse).toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.arc(nodeX, nodeY, 3.4, 0, TAU); ctx.stroke();
        ctx.fillStyle = `rgba(225,250,255,${(0.5 * pulse).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(nodeX, nodeY, 1.0, 0, TAU); ctx.fill();

        // SIGNAL TRAFFIC: several staggered packets stream from the panel along
        // the leader, through the node, and into the globe rim — data flowing in.
        const rimX = cx + dx * R;
        const rimY = cy + dy * R;
        // path waypoints: panel(ax,ay) → stub(stubX,ay) → node → rim
        const seg = (s: number): [number, number] => {
          if (s < 0.30) { const u = s / 0.30; return [ax + (stubX - ax) * u, ay]; }
          if (s < 0.72) { const u = (s - 0.30) / 0.42; return [stubX + (nodeX - stubX) * u, ay + (nodeY - ay) * u]; }
          const u = (s - 0.72) / 0.28; return [nodeX + (rimX - nodeX) * u, nodeY + (rimY - nodeY) * u];
        };
        for (let pk = 0; pk < 3; pk++) {
          const prog = reduce ? (0.2 + pk * 0.3) : ((t * 0.008 + i * 0.19 + pk * 0.333) % 1);
          const [ppx, ppy] = seg(prog);
          const fade = 0.5 + 0.5 * Math.sin(prog * Math.PI); // bright mid-path
          ctx.fillStyle = `rgba(225,251,255,${(0.85 * fade).toFixed(3)})`;
          ctx.beginPath(); ctx.arc(ppx, ppy, 1.4, 0, TAU); ctx.fill();
          const pg = ctx.createRadialGradient(ppx, ppy, 0, ppx, ppy, 4.5);
          pg.addColorStop(0, `rgba(${col},${(0.5 * fade).toFixed(3)})`);
          pg.addColorStop(1, `rgba(${col},0)`);
          ctx.fillStyle = pg;
          ctx.beginPath(); ctx.arc(ppx, ppy, 4.5, 0, TAU); ctx.fill();
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

// A single intelligence panel — a translucent HUD glass container (subtle
// border, blur, glow, corner ticks + status dot) with internal hierarchy:
// status row, big mono value, label. Reads as a live data readout, not text.
const IntelPanel: React.FC<{ panel: Panel }> = ({ panel }) => {
  const edge = panel.side === "right";
  return (
    <div
      className={`absolute z-10 w-[176px] -translate-y-1/2 ${edge ? "-translate-x-full" : ""}`}
      style={{ left: `${panel.x * 100}%`, top: `${panel.y * 100}%` }}
    >
      <div
        className={`relative overflow-hidden rounded-[4px] border border-cyan-300/25 px-3 py-2 ${edge ? "text-right" : "text-left"}`}
        style={{
          background: "linear-gradient(135deg, rgba(12,34,52,0.62), rgba(8,22,38,0.40))",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          boxShadow: "0 0 22px rgba(70,200,255,0.12), inset 0 0 14px rgba(70,190,255,0.06)",
        }}
      >
        {/* HUD corner ticks */}
        <span className="pointer-events-none absolute left-0 top-0 h-2 w-2 border-l border-t border-cyan-300/70" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-2 w-2 border-b border-r border-cyan-300/70" />
        {/* left accent bar */}
        <span className={`pointer-events-none absolute inset-y-1.5 ${edge ? "right-0" : "left-0"} w-[2px] bg-gradient-to-b from-cyan-300/80 to-cyan-400/10`} />
        {/* status row */}
        <div className={`flex items-center gap-1.5 ${edge ? "flex-row-reverse" : ""}`}>
          <span className="inline-block h-1 w-1 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_5px_1px_rgba(120,232,255,0.8)]" />
          <div className="text-[8.5px] font-semibold uppercase tracking-[0.16em] text-cyan-200/80">{panel.title}</div>
        </div>
        {/* value */}
        <div className="mt-0.5 font-mono text-[17px] font-semibold leading-none text-cyan-50">{panel.value}</div>
        {/* delta / unit */}
        <div className="mt-0.5 text-[8.5px] uppercase tracking-wider text-cyan-100/40">{panel.delta}</div>
      </div>
    </div>
  );
};

export default GlobeScene;
