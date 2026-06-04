import React, { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// GlobeScene — a faithful, dependency-free reproduction of the cinematic
// "intelligence globe" hero: a rotating dot-matrix Earth (continents picked
// out in brighter cyan over a faint full-sphere grid), tilted orbital rings
// with traveling nodes, a luminous base platform, and six floating data
// labels with connectors. Pure <canvas> + SVG + CSS — no WebGL, no libraries.
//
// The globe is drawn on a canvas (thousands of depth-shaded dots per frame);
// the rings, platform glow and labels are SVG/HTML layered on top, all sharing
// the same centre so everything stays registered as the scene scales.
// ---------------------------------------------------------------------------

// Coarse land mask as lat/lon bounding boxes [latMin, latMax, lonMin, lonMax].
// Not survey-grade — just enough boxes that the rotating sphere reads as Earth
// (the Americas, Europe/Africa, Asia, Australia all swing past recognisably).
const LAND: [number, number, number, number][] = [
  // North America
  [48, 72, -168, -52], [30, 49, -126, -64], [16, 30, -112, -83], [8, 18, -92, -77],
  [60, 83, -55, -18], // Greenland
  // South America
  [-4, 12, -80, -50], [-20, -4, -73, -38], [-35, -20, -72, -52], [-52, -35, -75, -64],
  // Europe
  [40, 60, -10, 40], [54, 71, 5, 42], [36, 44, -8, 28],
  // Africa
  [18, 35, -14, 32], [4, 18, -16, 44], [-18, 4, 9, 42], [-35, -18, 14, 33],
  [-25, -12, 43, 50], // Madagascar
  // Middle East + Asia
  [12, 42, 34, 60], [38, 72, 44, 180], [20, 40, 60, 122],
  [6, 22, 73, 100], // India
  [-10, 8, 95, 141], // Indonesia / SE Asia
  // Australia + NZ + Japan
  [-39, -11, 113, 154], [-47, -34, 166, 179], [31, 45, 130, 146],
];

function isLand(lat: number, lon: number): boolean {
  for (const [a, b, c, d] of LAND) {
    if (lat >= a && lat <= b && lon >= c && lon <= d) return true;
  }
  return false;
}

const TAU = Math.PI * 2;

const GlobeCanvas: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let rot = 0; // current rotation (degrees) about the polar axis
    let w = 0, h = 0, dpr = 1;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.round(r.width));
      h = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    const draw = () => {
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.42;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // soft inner atmosphere (filled disc) — gives the sphere body its depth
      const glow = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.05);
      glow.addColorStop(0, "rgba(28,120,165,0.22)");
      glow.addColorStop(0.65, "rgba(18,80,125,0.10)");
      glow.addColorStop(1, "rgba(6,30,52,0.0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.fill();

      // outer atmospheric halo — a brighter band hugging the limb, as in the brief
      const halo = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.18);
      halo.addColorStop(0, "rgba(90,200,240,0.0)");
      halo.addColorStop(0.55, "rgba(96,206,245,0.16)");
      halo.addColorStop(1, "rgba(96,206,245,0.0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, TAU);
      ctx.fill();

      // faint great-circle grid (parallels + meridians) under the dot field
      ctx.strokeStyle = "rgba(70,160,200,0.10)";
      ctx.lineWidth = 0.6;
      for (let lat = -60; lat <= 60; lat += 30) {
        const latR = (lat * Math.PI) / 180;
        ctx.beginPath();
        let started = false;
        for (let lon = -180; lon <= 180; lon += 6) {
          const lonR = ((lon + rot) * Math.PI) / 180;
          const z = Math.cos(latR) * Math.cos(lonR);
          if (z <= 0) { started = false; continue; }
          const sx = cx + R * Math.cos(latR) * Math.sin(lonR);
          const sy = cy - R * Math.sin(latR);
          if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      for (let lon = -150; lon <= 180; lon += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 4) {
          const latR = (lat * Math.PI) / 180;
          const lonR = ((lon + rot) * Math.PI) / 180;
          const z = Math.cos(latR) * Math.cos(lonR);
          if (z <= 0) { started = false; continue; }
          const sx = cx + R * Math.cos(latR) * Math.sin(lonR);
          const sy = cy - R * Math.sin(latR);
          if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // Two passes: a fine faint ocean grid for the sphere read, then a denser,
      // much brighter land pass so the continents clearly pop as on the brief.
      const oceanStep = 3.4;
      for (let lat = -86; lat <= 86; lat += oceanStep) {
        const latR = (lat * Math.PI) / 180;
        const cosLat = Math.cos(latR);
        const y = Math.sin(latR);
        for (let lon = -180; lon < 180; lon += oceanStep) {
          if (isLand(lat, lon)) continue;
          const lonR = ((lon + rot) * Math.PI) / 180;
          const z = cosLat * Math.cos(lonR);
          if (z <= 0.02) continue; // front hemisphere only
          const x = cosLat * Math.sin(lonR);
          const sx = cx + R * x;
          const sy = cy - R * y;
          const a = 0.05 + 0.11 * z;
          ctx.fillStyle = `rgba(82,176,214,${a.toFixed(3)})`;
          ctx.fillRect(sx - 0.55, sy - 0.55, 1.1, 1.1);
        }
      }

      // land pass — fine grid, bright cyan, depth-shaded dots
      const landStep = 1.9;
      for (let lat = -86; lat <= 86; lat += landStep) {
        const latR = (lat * Math.PI) / 180;
        const cosLat = Math.cos(latR);
        const y = Math.sin(latR);
        for (let lon = -180; lon < 180; lon += landStep) {
          if (!isLand(lat, lon)) continue;
          const lonR = ((lon + rot) * Math.PI) / 180;
          const z = cosLat * Math.cos(lonR);
          if (z <= 0.02) continue;
          const x = cosLat * Math.sin(lonR);
          const sx = cx + R * x;
          const sy = cy - R * y;
          const a = 0.5 + 0.48 * z;
          ctx.fillStyle = `rgba(130,236,255,${a.toFixed(3)})`;
          const s = 1.5 + 1.0 * z;
          ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
        }
      }

      // crisp limb highlight
      ctx.strokeStyle = "rgba(125,228,255,0.35)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, TAU);
      ctx.stroke();
    };

    const tick = () => {
      rot = (rot + 0.18) % 360;
      draw();
      raf = requestAnimationFrame(tick);
    };

    resize();
    if (reduce) {
      draw();
    } else {
      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw();
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
};

// One floating data label with a glowing connector node + short leader line
// on the side facing the globe — matching the reference's annotation style.
const Label: React.FC<{
  title: string;
  value: string;
  pos: string; // tailwind positioning classes
  align?: "left" | "right";
}> = ({ title, value, pos, align = "left" }) => {
  const node = (
    <span className="flex shrink-0 items-center" aria-hidden>
      <span className="relative inline-flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300/70" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-200 shadow-[0_0_6px_2px_rgba(120,232,255,0.7)]" />
      </span>
      <span className={`h-px w-7 bg-gradient-to-r from-cyan-300/70 to-transparent ${align === "right" ? "rotate-180" : ""}`} />
    </span>
  );
  return (
    <div className={`absolute ${pos} flex items-center gap-2 ${align === "right" ? "flex-row-reverse" : ""}`}>
      {node}
      <div className={align === "right" ? "text-right" : "text-left"}>
        <div className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/95 sm:text-xs">
          {title}
        </div>
        <div className="mt-0.5 whitespace-nowrap text-[13px] font-medium text-cyan-200/70 sm:text-sm">{value}</div>
      </div>
    </div>
  );
};

const GlobeScene: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* centred globe + rings + platform, sized to the shorter axis */}
      <div className="absolute left-1/2 top-1/2 aspect-square w-[min(78vmin,820px)] -translate-x-1/2 -translate-y-1/2">
        <GlobeCanvas />

        {/* orbital rings + traveling nodes + base platform (SVG overlay) */}
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full overflow-visible"
          aria-hidden
        >
          <defs>
            <path id="orbitA" d="M50,50 m-48,0 a48,15 0 1,0 96,0 a48,15 0 1,0 -96,0" />
            <path id="orbitB" d="M50,50 m-45,0 a45,11 0 1,0 90,0 a45,11 0 1,0 -90,0" />
            <path id="orbitC" d="M50,50 m-49,0 a49,19 0 1,0 98,0 a49,19 0 1,0 -98,0" />
            <radialGradient id="platform" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(150,240,255,0.70)" />
              <stop offset="40%" stopColor="rgba(70,180,230,0.26)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(150,240,255,0.45)" />
              <stop offset="100%" stopColor="rgba(150,240,255,0)" />
            </linearGradient>
          </defs>

          {/* tilted orbital rings */}
          <g
            stroke="rgba(110,210,245,0.40)"
            strokeWidth="0.35"
            fill="none"
            style={{ filter: "drop-shadow(0 0 1px rgba(120,232,255,0.5))" }}
          >
            <use href="#orbitA" transform="rotate(-12 50 50)" />
            <use href="#orbitB" transform="rotate(8 50 50)" />
            <use href="#orbitC" transform="rotate(-26 50 50)" />
          </g>

          {/* nodes traveling along the orbits */}
          <g fill="#bdf3ff">
            <circle r="0.9" transform="rotate(-12 50 50)">
              <animateMotion dur="14s" repeatCount="indefinite">
                <mpath href="#orbitA" />
              </animateMotion>
            </circle>
            <circle r="0.7" transform="rotate(8 50 50)">
              <animateMotion dur="11s" repeatCount="indefinite" keyPoints="0.4;1.4" keyTimes="0;1" calcMode="linear">
                <mpath href="#orbitB" />
              </animateMotion>
            </circle>
            <circle r="0.8" transform="rotate(-26 50 50)">
              <animateMotion dur="18s" repeatCount="indefinite" keyPoints="0.7;1.7" keyTimes="0;1" calcMode="linear">
                <mpath href="#orbitC" />
              </animateMotion>
            </circle>
          </g>

          {/* soft vertical light beam rising from the platform */}
          <rect x="46.5" y="58" width="7" height="28" fill="url(#beam)" opacity="0.5" />

          {/* luminous base platform: stacked concentric ellipses + glow */}
          <g transform="translate(50 86)">
            <ellipse cx="0" cy="0" rx="42" ry="9.5" fill="url(#platform)" />
            <ellipse cx="0" cy="0" rx="34" ry="7.6" fill="none" stroke="rgba(140,238,255,0.65)" strokeWidth="0.45" />
            <ellipse cx="0" cy="0" rx="26" ry="5.8" fill="none" stroke="rgba(135,236,255,0.48)" strokeWidth="0.38" />
            <ellipse cx="0" cy="0" rx="18" ry="4.0" fill="none" stroke="rgba(130,234,255,0.34)" strokeWidth="0.32" />
            <ellipse cx="0" cy="0" rx="10" ry="2.2" fill="none" stroke="rgba(125,232,255,0.24)" strokeWidth="0.3" />
          </g>
        </svg>
      </div>

      {/* six floating data labels — all six readings from the brief, arranged
          around the top / right / bottom-right arc so they stay clear of the
          headline (left column) and the top nav. */}
      <Label pos="left-[34%] top-[19%]" title="Acquisition Intelligence" value="12.4K active signals" />
      <Label pos="right-[2%] top-[23%]" align="right" title="Predictive Outcomes" value="94.7% model accuracy" />
      <Label pos="right-[1%] top-[42%]" align="right" title="Live Deal Flow" value="$2.7T in tracked value" />
      <Label pos="right-[2%] top-[56%]" align="right" title="Closed Deals" value="$187.6B realized" />
      <Label pos="right-[6%] top-[79%]" align="right" title="AI Negotiator" value="17.3% value uplift" />
      <Label pos="left-[35%] top-[86%]" title="Global Buyer Network" value="58,341 buyers" />
    </div>
  );
};

export default GlobeScene;
