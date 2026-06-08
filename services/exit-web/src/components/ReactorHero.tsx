import React, { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { isLand } from "../lib3d/landmask";

// ---------------------------------------------------------------------------
// ReactorHero — a real WebGL holographic acquisition-intelligence reactor.
// React-Three-Fiber + custom shaders + bloom post-processing. The globe is a
// 50k+ particle Earth computed above a 12-subsystem reactor that projects it
// via a volumetric beam. Everything animates independently. Strict cyan/white.
//
// Subsystems (each its own component, own motion):
//   ParticleGlobe   — dot-matrix Earth from particle density (no outlines)
//   Atmosphere      — additive shell + edge glow around the globe
//   Reactor         — core, aperture, 8 unique rings, data rails, segmented
//                     arcs, orbit nodes, radar pulses, ambient mega-rings
//   ProjectionBeam  — multi-layer volumetric column materialising the globe
//   OrbitSystem     — 10 inclined trajectories with travelling light packets
//   StarField       — deep spatial background dust
// DOM intelligence panels sit above the canvas (in ReactorHero).
// ---------------------------------------------------------------------------

const CYAN = new THREE.Color("#00E5FF");
const CYAN2 = new THREE.Color("#33F0FF");
const WHITE = new THREE.Color("#A8FFFF");

// shared additive point shader: round soft sprites, size attenuated by depth
const POINT_VERT = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;
  uniform float uTime;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.6 + 0.4 * sin(uTime * 1.5 + aPhase);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const POINT_FRAG = /* glsl */ `
  precision mediump float;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * vTwinkle, a * a);
  }
`;

// ---- Particle globe : continents from density, no outlines -----------------
const ParticleGlobe: React.FC<{ radius: number }> = ({ radius }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);

  const geo = useMemo(() => {
    const ocean = 26000; // uniform lattice (the volume)
    const landTarget = 34000; // dense scatter where land is → density legibility
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    const phases: number[] = [];
    const push = (x: number, y: number, z: number, c: THREE.Color, s: number) => {
      positions.push(x, y, z); colors.push(c.r, c.g, c.b);
      sizes.push(s); phases.push(Math.random() * 6.28);
    };
    const golden = Math.PI * (3 - Math.sqrt(5));
    // ocean — faint, full sphere
    for (let i = 0; i < ocean; i++) {
      const y = 1 - (i / (ocean - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = i * golden;
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      push(x * radius, y * radius, z * radius, CYAN.clone().multiplyScalar(0.16), 0.9);
    }
    // land — accept/reject random samples, soft jitter → density not borders
    let placed = 0, tries = 0;
    while (placed < landTarget && tries < landTarget * 10) {
      tries++;
      const u = Math.random() * 2 - 1, ph = Math.random() * 6.2831853;
      const r = Math.sqrt(Math.max(0, 1 - u * u));
      const x = r * Math.cos(ph), y = u, z = r * Math.sin(ph);
      const lat = Math.asin(y) * 57.2958;
      const lon = Math.atan2(z, x) * 57.2958;
      const jLat = lat + (Math.random() - 0.5) * 4;
      const jLon = lon + (Math.random() - 0.5) * 4;
      if (!isLand(jLat, jLon)) continue;
      const c = CYAN2.clone().lerp(WHITE, Math.random() * 0.5).multiplyScalar(0.85);
      push(x * radius, y * radius, z * radius, c, 1.5 + Math.random());
      placed++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("aColor", new THREE.Float32BufferAttribute(colors, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
    return g;
  }, [radius]);

  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.06;
    if (matRef.current) matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group ref={groupRef} rotation={[0.34, 0, 0.12]}>
      <points geometry={geo}>
        <shaderMaterial
          ref={matRef}
          vertexShader={POINT_VERT}
          fragmentShader={POINT_FRAG}
          uniforms={{ uTime: { value: 0 } }}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
};

// ---- Atmosphere : additive fresnel shell + soft edge glow ------------------
const Atmosphere: React.FC<{ radius: number }> = ({ radius }) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color("#33F0FF") } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vP;
          void main(){ vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(position,1.0); vP = mv.xyz;
            gl_Position = projectionMatrix * mv; }
        `,
        fragmentShader: /* glsl */ `
          precision mediump float; varying vec3 vN; varying vec3 vP;
          uniform vec3 uColor;
          void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(-vP))), 4.0);
            gl_FragColor = vec4(uColor, f * 0.45); }
        `,
      }),
    []
  );
  return (
    <mesh material={mat} scale={1.06}>
      <sphereGeometry args={[radius, 48, 48]} />
    </mesh>
  );
};

// ---- Volumetric projection beam : layered cones + rising particles ---------
const ProjectionBeam: React.FC<{ from: number; to: number }> = ({ from, to }) => {
  const partRef = useRef<THREE.Points>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const height = to - from;

  const beamMat = (op: number) =>
    new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      uniforms: { uOp: { value: op }, uTime: { value: 0 } },
      vertexShader: `varying float vY; void main(){ vY = uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
      fragmentShader: `precision mediump float; varying float vY; uniform float uOp;
        void main(){ float a = (1.0 - vY) * uOp;
          vec3 col = mix(vec3(0.66,1.0,1.0), vec3(0.0,0.9,1.0), vY);
          gl_FragColor = vec4(col, a); }`,
    });
  const outerMat = useMemo(() => beamMat(0.30), []);
  const innerMat = useMemo(() => beamMat(0.55), []);

  const particles = useMemo(() => {
    const n = 260; const pos: number[] = [];
    for (let i = 0; i < n; i++) pos.push((Math.random() - 0.5) * 2, Math.random(), (Math.random() - 0.5) * 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((s) => {
    const f = 0.9 + 0.1 * Math.sin(s.clock.elapsedTime * 4);
    outerMat.uniforms.uOp.value = 0.30 * f;
    innerMat.uniforms.uOp.value = 0.55 * f;
    if (partRef.current) {
      const arr = (partRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        arr[i + 1] += 0.004;
        if (arr[i + 1] > 1) arr[i + 1] = 0;
      }
      partRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const midY = (from + to) / 2;
  return (
    <group position={[0, midY, 0]}>
      <mesh material={outerMat}>
        <cylinderGeometry args={[0.42, 0.12, height, 32, 1, true]} />
      </mesh>
      <mesh ref={coreRef} material={innerMat}>
        <cylinderGeometry args={[0.13, 0.04, height, 24, 1, true]} />
      </mesh>
      <points ref={partRef} geometry={particles} scale={[0.7, height, 0.7]} position={[0, -height / 2, 0]}>
        <pointsMaterial color="#bfffff" size={0.04} transparent opacity={0.7}
          depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  );
};

// ---- one reactor ring (ellipse in the XZ plane) ----------------------------
const Ring: React.FC<{ r: number; color: THREE.Color; opacity: number; lw?: number; segments?: number; arc?: [number, number] }>
  = ({ r, color, opacity, segments = 128, arc }) => {
  const geo = useMemo(() => {
    const a0 = arc ? arc[0] : 0, a1 = arc ? arc[1] : Math.PI * 2;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = a0 + (a1 - a0) * (i / segments);
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [r, segments, arc]);
  return (
    <line>
      <primitive object={geo} attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={opacity}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </line>
  );
};

// ---- Reactor foundation : the 12-subsystem machine -------------------------
const Reactor: React.FC<{ y: number; baseR: number }> = ({ y, baseR }) => {
  const coreRef = useRef<THREE.Mesh>(null);
  const cwRef = useRef<THREE.Group>(null);
  const ccwRef = useRef<THREE.Group>(null);
  const railsRef = useRef<THREE.Points>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const radar1 = useRef<THREE.Group>(null);
  const radar2 = useRef<THREE.Group>(null);

  // 8 UNIQUE tracking rings (varied radius / opacity)
  const trackRings = useMemo(
    () => [0.30, 0.42, 0.55, 0.74, 0.93, 1.18, 1.5, 1.9].map((m, i) => ({
      r: m * baseR, opacity: [0.85, 0.3, 0.6, 0.26, 0.5, 0.22, 0.4, 0.18][i],
      color: i % 3 === 0 ? WHITE : CYAN,
    })),
    [baseR]
  );
  // segmented mechanical arcs (broken)
  const segArcs = useMemo(() => {
    const out: { r: number; arc: [number, number]; o: number }[] = [];
    const defs: [number, number[][]][] = [
      [0.62, [[0, 0.7], [1.1, 0.5], [2.0, 0.9], [3.4, 0.6], [4.6, 0.8]]],
      [1.18, [[0.2, 1.0], [1.8, 0.6], [3.0, 1.3], [4.9, 0.7]]],
      [1.78, [[0, 0.5], [0.9, 1.4], [2.7, 0.6], [3.7, 1.1], [5.3, 0.5]]],
    ];
    defs.forEach(([rr, segs]) => (segs as number[][]).forEach(([a0, len]) =>
      out.push({ r: rr * baseR, arc: [a0, a0 + len], o: 0.34 })));
    return out;
  }, [baseR]);

  // data-rail particles (circulating dots on thin tracks)
  const rails = useMemo(() => {
    const radii = [0.36, 0.46, 0.68, 0.86, 1.1, 1.3, 1.6, 1.9, 0.5, 0.78, 1.0, 1.4];
    const pos: number[] = []; const meta: number[] = [];
    radii.forEach((rr, k) => {
      const cnt = 8 + (k % 3) * 4;
      for (let d = 0; d < cnt; d++) {
        const a = (d / cnt) * Math.PI * 2;
        pos.push(Math.cos(a) * rr * baseR, 0, Math.sin(a) * rr * baseR);
        meta.push(rr * baseR, a, k % 2 ? -1 : 1);
      }
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return { geo: g, meta };
  }, [baseR]);

  // orbiting glow nodes
  const nodes = useMemo(() => {
    const pos: number[] = []; const meta: number[] = [];
    for (let k = 0; k < 20; k++) {
      const rr = (0.4 + (k % 6) * 0.28) * baseR;
      const a = (k / 20) * Math.PI * 2;
      pos.push(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      meta.push(rr, a, k % 2 ? -1 : 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return { geo: g, meta };
  }, [baseR]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const p = 0.85 + 0.15 * Math.sin(t * 2.5);
    if (coreRef.current) { coreRef.current.scale.setScalar(p); (coreRef.current.material as THREE.MeshBasicMaterial).opacity = p; }
    if (cwRef.current) cwRef.current.rotation.y = t * 0.25;
    if (ccwRef.current) ccwRef.current.rotation.y = -t * 0.18;
    // rails circulate
    if (railsRef.current) {
      const arr = (railsRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0, m = 0; i < arr.length; i += 3, m += 3) {
        const rr = rails.meta[m], dir = rails.meta[m + 2];
        const a = rails.meta[m + 1] + dir * t * 0.25;
        arr[i] = Math.cos(a) * rr; arr[i + 2] = Math.sin(a) * rr;
      }
      railsRef.current.geometry.attributes.position.needsUpdate = true;
    }
    if (nodesRef.current) {
      const arr = (nodesRef.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      for (let i = 0, m = 0; i < arr.length; i += 3, m += 3) {
        const rr = nodes.meta[m], dir = nodes.meta[m + 2];
        const a = nodes.meta[m + 1] + dir * t * 0.4;
        arr[i] = Math.cos(a) * rr; arr[i + 2] = Math.sin(a) * rr;
      }
      nodesRef.current.geometry.attributes.position.needsUpdate = true;
    }
    // radar pulses expand outward, fading
    const setRadar = (g: THREE.Group | null, ex: number) => {
      if (!g) return;
      g.scale.setScalar(0.2 + ex);
      const child = g.children[0] as THREE.Line | undefined;
      const mat = child?.material as THREE.LineBasicMaterial | undefined;
      if (mat) mat.opacity = (1 - ex / 2.2) * 0.5;
    };
    setRadar(radar1.current, (t * 0.35) % 2.2);
    setRadar(radar2.current, ((t * 0.35) + 1.1) % 2.2);
  });

  return (
    <group position={[0, y, 0]}>
      {/* ambient mega-rings (huge, faint) */}
      {[2.6, 3.2, 3.9, 4.7].map((m, i) => (
        <Ring key={`amb${i}`} r={m * baseR} color={CYAN} opacity={0.05} />
      ))}

      {/* clockwise group : tracking rings + aperture */}
      <group ref={cwRef}>
        {trackRings.map((r, i) => (
          <Ring key={`tr${i}`} r={r.r} color={r.color} opacity={r.opacity} />
        ))}
        {/* aperture : segmented arcs near the core */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((s) => (
          <Ring key={`ap${s}`} r={0.24 * baseR} color={CYAN2} opacity={0.5}
            arc={[s * 0.785, s * 0.785 + 0.45]} segments={20} />
        ))}
      </group>

      {/* counter-clockwise group : segmented mechanical arcs */}
      <group ref={ccwRef}>
        {segArcs.map((a, i) => (
          <Ring key={`seg${i}`} r={a.r} color={CYAN} opacity={a.o} arc={a.arc} segments={48} />
        ))}
      </group>

      {/* radar pulse rings */}
      <group ref={radar1}><Ring r={baseR} color={WHITE} opacity={0.5} /></group>
      <group ref={radar2}><Ring r={baseR} color={WHITE} opacity={0.5} /></group>

      {/* data-rail circulating particles */}
      <points ref={railsRef} geometry={rails.geo}>
        <pointsMaterial color="#a8ffff" size={baseR * 0.018} transparent opacity={0.9}
          depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
      {/* orbiting glow nodes */}
      <points ref={nodesRef} geometry={nodes.geo}>
        <pointsMaterial color="#e6ffff" size={baseR * 0.05} transparent opacity={0.95}
          depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>

      {/* core energy source : bright sprite (bloom turns it into a sun) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[baseR * 0.09, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.95}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

// ---- Orbit system : inclined trajectories with light packets ---------------
const OrbitSystem: React.FC<{ radius: number }> = ({ radius }) => {
  const groupRef = useRef<THREE.Group>(null);
  const orbits = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        r: radius * (1.15 + i * 0.075),
        inc: (i / 10) * 0.8 - 0.1,
        rot: Math.random() * Math.PI,
        speed: 0.1 + (i % 4) * 0.04 * (i % 2 ? -1 : 1),
        op: 0.10 + (i % 3) * 0.05,
      })),
    [radius]
  );
  const packets = useRef<THREE.Points>(null);
  const packetGeo = useMemo(() => {
    const pos: number[] = [];
    orbits.forEach(() => pos.push(0, 0, 0));
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, [orbits]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (packets.current) {
      const arr = (packets.current.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
      orbits.forEach((o, i) => {
        const a = t * o.speed + i;
        const x = Math.cos(a) * o.r, z = Math.sin(a) * o.r;
        // apply inclination + rotation
        const y = z * Math.sin(o.inc);
        const z2 = z * Math.cos(o.inc);
        const xr = x * Math.cos(o.rot) - z2 * Math.sin(o.rot);
        const zr = x * Math.sin(o.rot) + z2 * Math.cos(o.rot);
        arr[i * 3] = xr; arr[i * 3 + 1] = y; arr[i * 3 + 2] = zr;
      });
      packets.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      {orbits.map((o, i) => (
        <group key={i} rotation={[o.inc, o.rot, 0]}>
          <Ring r={o.r} color={CYAN} opacity={o.op} segments={160} />
        </group>
      ))}
      <points ref={packets} geometry={packetGeo}>
        <pointsMaterial color="#bfffff" size={radius * 0.05} transparent opacity={1}
          depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>
    </group>
  );
};

// ---- Star / dust field -----------------------------------------------------
const StarField: React.FC = () => {
  const geo = useMemo(() => {
    const n = 1200; const pos: number[] = [];
    for (let i = 0; i < n; i++) {
      const r = 8 + Math.random() * 14;
      const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 2 - 1);
      pos.push(r * Math.sin(b) * Math.cos(a), r * Math.cos(b) * 0.5, r * Math.sin(b) * Math.sin(a));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#5fbfe0" size={0.03} transparent opacity={0.5}
        depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  );
};

// ---- Scene assembly --------------------------------------------------------
const Scene: React.FC = () => {
  const { camera } = useThree();
  const R = 2.0;            // globe radius
  const reactorY = -R * 1.18; // reactor centre below globe
  const baseR = R * 1.5;   // reactor visually larger than globe
  React.useEffect(() => {
    camera.position.set(0, R * 0.55, R * 4.5);
    camera.lookAt(0, -R * 0.25, 0);
  }, [camera]);

  return (
    <>
      <StarField />
      <OrbitSystem radius={R} />
      <ParticleGlobe radius={R} />
      <Atmosphere radius={R} />
      <ProjectionBeam from={reactorY} to={-R * 0.2} />
      <Reactor y={reactorY} baseR={baseR} />
      <EffectComposer>
        {/* high threshold → ONLY the bright core / nodes / packets bloom; the
            dim particle field stays crisp instead of washing into a haze. */}
        <Bloom intensity={0.7} luminanceThreshold={0.72} luminanceSmoothing={0.2} mipmapBlur radius={0.5} />
        <Vignette eskil={false} offset={0.32} darkness={0.7} />
      </EffectComposer>
    </>
  );
};

// ---- DOM intelligence panels (HUD glass modules) ---------------------------
type Panel = { id: string; title: string; value: string; delta: string; x: number; y: number; side: "l" | "r" };
const PANELS: Panel[] = [
  { id: "acq", title: "Acquisition Intelligence", value: "12.4K", delta: "active signals", x: 0.43, y: 0.15, side: "l" },
  { id: "flow", title: "Live Deal Flow", value: "$2.7T", delta: "in tracked value", x: 0.41, y: 0.40, side: "l" },
  { id: "net", title: "Global Buyer Network", value: "58,341", delta: "verified buyers", x: 0.43, y: 0.64, side: "l" },
  { id: "pred", title: "Predictive Outcomes", value: "94.7%", delta: "model accuracy", x: 0.875, y: 0.18, side: "r" },
  { id: "closed", title: "Closed Transactions", value: "$187.6B", delta: "realized", x: 0.89, y: 0.40, side: "r" },
  { id: "neg", title: "AI Negotiator", value: "17.3%", delta: "value uplift", x: 0.875, y: 0.62, side: "r" },
];

const HudPanel: React.FC<{ p: Panel; i: number }> = ({ p, i }) => {
  const right = p.side === "r";
  return (
    <div
      className={`absolute z-10 w-[178px] ${right ? "-translate-x-full" : ""}`}
      style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%`, animation: `hudFloat 6s ease-in-out ${i * 0.7}s infinite` }}
    >
      <div className="relative overflow-hidden rounded-[5px] px-3 py-2"
        style={{
          background: "linear-gradient(135deg, rgba(8,30,48,0.66), rgba(4,16,30,0.42))",
          border: "1px solid rgba(51,240,255,0.30)",
          backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)",
          boxShadow: "0 0 26px rgba(0,229,255,0.16), inset 0 0 16px rgba(0,229,255,0.07)",
        }}>
        {/* corner brackets */}
        <span className="pointer-events-none absolute left-0 top-0 h-2.5 w-2.5 border-l border-t border-cyan-300/80" />
        <span className="pointer-events-none absolute right-0 top-0 h-2.5 w-2.5 border-r border-t border-cyan-300/50" />
        <span className="pointer-events-none absolute bottom-0 left-0 h-2.5 w-2.5 border-b border-l border-cyan-300/50" />
        <span className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-2.5 border-b border-r border-cyan-300/80" />
        {/* scan line */}
        <span className="pointer-events-none absolute inset-x-0 h-px bg-cyan-200/40" style={{ animation: `hudScan 3.5s linear ${i * 0.5}s infinite` }} />
        <div className={`flex items-center gap-1.5 ${right ? "flex-row-reverse text-right" : ""}`}>
          <span className="inline-block h-1 w-1 rounded-full bg-cyan-300" style={{ boxShadow: "0 0 6px 1px rgba(120,232,255,0.9)" }} />
          <div className="text-[8.5px] font-semibold uppercase tracking-[0.18em] text-cyan-200/85">{p.title}</div>
        </div>
        <div className={`mt-0.5 font-mono text-[18px] font-semibold leading-none text-cyan-50 ${right ? "text-right" : ""}`}>{p.value}</div>
        <div className={`mt-0.5 text-[8.5px] uppercase tracking-wider text-cyan-100/45 ${right ? "text-right" : ""}`}>{p.delta}</div>
      </div>
    </div>
  );
};

const ReactorHero: React.FC<{ className?: string }> = ({ className = "" }) => {
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return (
    <div className={`relative ${className}`} style={{ background: "#020812" }}>
      <Canvas
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        frameloop={reduce ? "demand" : "always"}
        camera={{ fov: 42, near: 0.1, far: 100 }}
        aria-hidden
      >
        <Scene />
      </Canvas>
      {/* HUD panels (hidden on small screens) */}
      <div className="hidden lg:block">
        {PANELS.map((p, i) => <HudPanel key={p.id} p={p} i={i} />)}
        {/* system status chrome */}
        <div className="absolute right-5 top-[14%] z-10 text-right">
          <div className="text-[9px] font-semibold uppercase tracking-[0.22em] text-cyan-200/60">System Status</div>
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-wider text-emerald-300">OPERATIONAL</span>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes hudFloat { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-5px); } }
        @keyframes hudScan { 0%{ top: 0; opacity: 0; } 10%{ opacity: 1; } 90%{ opacity: 1; } 100%{ top: 100%; opacity: 0; } }
      `}</style>
    </div>
  );
};

export default ReactorHero;
