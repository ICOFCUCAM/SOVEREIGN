import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Cloud, Server, ShieldCheck, ArrowRight, Globe2 } from 'lucide-react';

const ACCENT = '#00D9FF';
const VIOLET = '#7C4DFF';

// Edge nodes across a coarse world map (viewBox 0 0 200 100).
const NODES: Array<[number, number, boolean]> = [
  [38, 40, true], [30, 55, false], [48, 32, false], [52, 70, false],
  [96, 30, true], [100, 42, false], [104, 56, false], [92, 44, false],
  [150, 38, true], [162, 50, false], [140, 64, false], [170, 72, false], [120, 36, false],
];
const ARCS: Array<[number, number, number]> = [[0, 4, 0], [4, 8, 0.6], [0, 8, 1.2], [4, 12, 0.3], [8, 9, 0.9], [0, 3, 1.5], [8, 11, 0.5]];

// Coarse continent dot field for context.
const CONTINENTS: Array<[number, number]> = [
  [34, 38], [30, 46], [38, 44], [28, 56], [36, 58], [44, 66], [50, 72],
  [94, 28], [98, 34], [92, 40], [100, 46], [96, 52], [104, 58], [90, 60],
  [144, 34], [152, 40], [148, 48], [160, 46], [156, 56], [138, 60], [168, 68], [128, 38], [120, 34],
];

const RegionMap: React.FC = () => (
  <div className="relative w-full rounded-2xl border border-white/10 overflow-hidden glass-strong" style={{ aspectRatio: '2 / 1' }}>
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 0%, rgba(0,194,255,0.1), transparent 60%), linear-gradient(160deg, #0A1024, #05070F)' }} />
    <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2.5 border-b border-white/5">
      <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/45">Sovereign cloud · global mesh</span>
      <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> 23 regions online
      </span>
    </div>
    <svg viewBox="0 0 200 100" className="absolute inset-x-0 bottom-0 top-8 w-full h-full" preserveAspectRatio="xMidYMid meet">
      {CONTINENTS.map(([x, y], i) => <circle key={`c${i}`} cx={x} cy={y} r="1" fill="#3a5a9a" opacity="0.45" />)}
      {ARCS.map(([a, b, d], i) => {
        const [x1, y1] = NODES[a]; const [x2, y2] = NODES[b];
        const mx = (x1 + x2) / 2; const my = Math.min(y1, y2) - 14;
        const path = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
        return (
          <g key={`a${i}`}>
            <path d={path} fill="none" stroke={ACCENT} strokeOpacity="0.25" strokeWidth="0.5" />
            <path d={path} fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" className="animate-travel" style={{ animationDelay: `${d}s` }} />
          </g>
        );
      })}
      {NODES.map(([x, y, hub], i) => (
        <g key={`n${i}`}>
          {hub && <circle cx={x} cy={y} r="5" fill="none" stroke={ACCENT} strokeWidth="0.7" className="animate-ring" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.5}s` }} />}
          <circle cx={x} cy={y} r={hub ? 2.4 : 1.5} fill={hub ? ACCENT : VIOLET} className={hub ? 'animate-node' : 'animate-flicker'} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 0.3}s` }} />
        </g>
      ))}
    </svg>
  </div>
);

const FEED = [
  { sys: 'govmesh.ai', region: 'us-east', state: 'live' },
  { sys: 'mobilepay.io', region: 'eu-west', state: 'live' },
  { sys: 'flyttgo.com', region: 'ap-south', state: 'deploying' },
  { sys: 'elecpro.gov', region: 'af-north', state: 'live' },
  { sys: 'edupro.app', region: 'sa-east', state: 'live' },
];

const STATS = [
  { icon: Cloud, label: 'Edge nodes', value: '47' },
  { icon: Globe2, label: 'Regions', value: '23' },
  { icon: Rocket, label: 'Avg deploy', value: '87s' },
  { icon: ShieldCheck, label: 'Uptime', value: '99.99%' },
];

const GlobalInfrastructure: React.FC = () => {
  const [pct, setPct] = useState(42);
  useEffect(() => {
    const t = setInterval(() => setPct((p) => (p >= 96 ? 28 : p + 6)), 700);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-2xl mb-16">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Global infrastructure</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.98] mb-5">
            Sovereign cloud. Planetary reach.
          </h2>
          <p className="text-lg text-white/55 leading-relaxed">
            Institutions provision across a global edge mesh — DNS orchestration, sovereign data residency and AI provisioning, deployed in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6 items-stretch">
          <RegionMap />

          <div className="flex flex-col gap-5">
            {/* deployment stats */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="glass-strong rounded-xl border border-white/10 px-4 py-3.5">
                    <Icon className="w-4 h-4 text-cyan-400 mb-2" />
                    <div className="text-2xl font-bold text-white tabular-nums leading-none">{s.value}</div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1.5">{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* live deployment feed */}
            <div className="glass-strong rounded-xl border border-white/10 p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <span className="inline-flex items-center gap-2 text-white font-semibold text-sm"><Server className="w-4 h-4 text-cyan-400" /> Deployment feed</span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live</span>
              </div>
              <div className="space-y-2">
                {FEED.map((f) => (
                  <div key={f.sys} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-white/70 flex-1 truncate">{f.sys}</span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/35">{f.region}</span>
                    {f.state === 'live' ? (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-300 w-16 text-right">Live</span>
                    ) : (
                      <span className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                        <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${VIOLET}, ${ACCENT})` }} />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Link to="/deploy" className="group inline-flex items-center gap-2 text-white font-semibold">
              Open the deployment engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-cyan-400" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GlobalInfrastructure;
