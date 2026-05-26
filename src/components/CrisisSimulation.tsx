import React, { useEffect, useState } from 'react';
import HudCorners from '@/components/HudCorners';
import { Play, Pause, RotateCcw } from 'lucide-react';

// ── scenario: national grid failure, contained by the sovereign operating layer ──
interface Phase { label: string; resilience: number; affected: number; clock: string; desc: string }
const PHASES: Phase[] = [
  { label: 'Nominal', resilience: 94, affected: 0, clock: '00:00', desc: 'All ministries operating within nominal parameters across the sovereign mesh.' },
  { label: 'Threat detected', resilience: 76, affected: 1, clock: '00:04', desc: 'Anomalous load on the national grid node — flagged by the intelligence fabric.' },
  { label: 'Cascade failure', resilience: 37, affected: 5, clock: '00:19', desc: 'Failure propagates across dependent ministries — power, transport, health, emergency.' },
  { label: 'Sovereign response', resilience: 64, affected: 3, clock: '00:31', desc: 'CIVICOS isolates the fault, reroutes load and activates continuity protocols.' },
  { label: 'Contained', resilience: 98, affected: 0, clock: '00:38', desc: 'National grid stabilized. Full operational posture restored in 38 minutes.' },
];

interface Node { x: number; y: number; label: string }
const CMD = { x: 150, y: 34 };
const NODES: Node[] = [
  { x: 78, y: 66, label: 'Power' },        // 0 — origin
  { x: 150, y: 58, label: 'Comms' },        // 1
  { x: 222, y: 66, label: 'Transport' },    // 2
  { x: 56, y: 116, label: 'Emergency' },    // 3
  { x: 124, y: 132, label: 'Health' },      // 4
  { x: 196, y: 132, label: 'Justice' },     // 5
  { x: 244, y: 116, label: 'Treasury' },    // 6
];
const LINKS: Array<[number, number]> = [[0, 1], [1, 2], [0, 3], [0, 4], [1, 4], [2, 5], [2, 6], [4, 5]];

type Status = 'ok' | 'threat' | 'down' | 'response';
const COLOR: Record<Status, string> = { ok: '#10E5A0', threat: '#FFB547', down: '#FF5470', response: '#22E0FF' };
const statusFor = (i: number, phase: number): Status => {
  if (phase <= 0) return 'ok';
  if (phase === 1) return i === 0 ? 'threat' : 'ok';
  if (phase === 2) return [0, 1, 2, 3, 4].includes(i) ? 'down' : 'ok';
  if (phase === 3) return [0, 1].includes(i) ? 'response' : 'ok';
  return 'ok';
};

const CrisisSimulation: React.FC = () => {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const p = PHASES[phase];

  useEffect(() => {
    if (!playing) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setPhase((x) => (x + 1) % PHASES.length), 2600);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <div className="relative rounded-[1.5rem] border border-white/10 overflow-hidden bg-[#04060f]" style={{ boxShadow: '0 40px 120px -50px rgba(0,0,0,0.9)' }}>
      <span className="absolute inset-x-0 top-0 h-px z-10" style={{ background: `linear-gradient(90deg, transparent, ${COLOR[statusFor(0, phase)]}, transparent)` }} />
      <HudCorners color="#FF5470" className="opacity-40 z-10" />
      <div className="grid lg:grid-cols-[1.4fr_1fr]">
        {/* the grid */}
        <div className="relative p-5 sm:p-7" style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 45%, rgba(0,40,80,0.25), transparent 70%)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/45">National grid · live simulation</span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: COLOR[phase === 0 || phase === 4 ? 'ok' : phase === 1 ? 'threat' : phase === 3 ? 'response' : 'down'] }}>
              <span className="w-1.5 h-1.5 rounded-full animate-node" style={{ background: COLOR[phase === 0 || phase === 4 ? 'ok' : phase === 1 ? 'threat' : phase === 3 ? 'response' : 'down'] }} /> {p.label}
            </span>
          </div>
          <svg viewBox="0 0 300 170" className="w-full" aria-hidden>
            <defs><filter id="cs-glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="2.2" /></filter></defs>
            {/* command spine */}
            {NODES.map((n, i) => (
              <line key={`cl${i}`} x1={CMD.x} y1={CMD.y} x2={n.x} y2={n.y} stroke="#5AA0FF" strokeOpacity="0.1" strokeWidth="0.6" />
            ))}
            {/* grid links */}
            {LINKS.map(([a, b], i) => {
              const sa = statusFor(a, phase), sb = statusFor(b, phase);
              const down = sa === 'down' || sb === 'down';
              const resp = sa === 'response' || sb === 'response';
              return <line key={`l${i}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y}
                stroke={down ? COLOR.down : resp ? COLOR.response : '#5AA0FF'} strokeOpacity={down || resp ? 0.5 : 0.16} strokeWidth={resp ? 1 : 0.7}
                style={{ transition: 'stroke 0.6s, stroke-opacity 0.6s' }} />;
            })}
            {/* command center */}
            <circle cx={CMD.x} cy={CMD.y} r="8" fill="#22E0FF" opacity="0.14" filter="url(#cs-glow)" />
            <circle cx={CMD.x} cy={CMD.y} r="3.2" fill="#22E0FF" className={phase === 3 ? 'animate-node' : ''} />
            <circle cx={CMD.x} cy={CMD.y} r="1.4" fill="#fff" />
            <text x={CMD.x} y={CMD.y - 11} textAnchor="middle" fontSize="5.5" fill="rgba(255,255,255,0.5)" fontFamily="monospace" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Command</text>
            {/* ministry nodes */}
            {NODES.map((n, i) => {
              const s = statusFor(i, phase); const c = COLOR[s];
              const active = s !== 'ok';
              return (
                <g key={`n${i}`}>
                  <circle cx={n.x} cy={n.y} r={active ? 9 : 6} fill={c} opacity={active ? 0.16 : 0.08} filter="url(#cs-glow)" style={{ transition: 'all 0.6s' }} />
                  {(s === 'response' || s === 'threat') && <circle cx={n.x} cy={n.y} r="3.5" fill="none" stroke={c} strokeWidth="0.5" className="animate-ring" style={{ transformOrigin: `${n.x}px ${n.y}px` }} />}
                  <circle cx={n.x} cy={n.y} r="2.6" fill={c} style={{ transition: 'fill 0.6s' }} className={s === 'down' ? 'animate-flicker' : ''} />
                  <circle cx={n.x} cy={n.y} r="1.1" fill="#fff" opacity="0.85" />
                  <text x={n.x} y={n.y + 12} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.42)" fontFamily="monospace" style={{ letterSpacing: '0.5px' }}>{n.label}</text>
                </g>
              );
            })}
          </svg>
          {/* controls */}
          <div className="flex items-center gap-2 mt-2">
            <button onClick={() => setPlaying((v) => !v)} aria-label={playing ? 'Pause' : 'Play'} className="w-9 h-9 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white transition">
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" fill="currentColor" />}
            </button>
            <button onClick={() => { setPhase(0); setPlaying(false); }} aria-label="Restart" className="w-9 h-9 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/10 flex items-center justify-center text-white transition">
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 ml-2">
              {PHASES.map((ph, i) => (
                <button key={ph.label} onClick={() => { setPhase(i); setPlaying(false); }} aria-label={ph.label}
                  className="h-1.5 rounded-full transition-all" style={{ width: i === phase ? 26 : 10, background: i === phase ? '#FF5470' : 'rgba(255,255,255,0.18)' }} />
              ))}
            </div>
          </div>
        </div>

        {/* telemetry readout */}
        <div className="relative border-t lg:border-t-0 lg:border-l border-white/8 bg-white/[0.012] p-7 sm:p-8 flex flex-col">
          <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-white/45 mb-5">Sovereign telemetry</div>
          <div className="grid grid-cols-3 gap-px bg-white/8 rounded-xl overflow-hidden border border-white/8 mb-6">
            <div className="bg-[#060b1a] px-3 py-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold tabular-nums leading-none" style={{ color: p.resilience >= 80 ? '#10E5A0' : p.resilience >= 50 ? '#FFB547' : '#FF5470', transition: 'color 0.5s' }}>{p.resilience}</div>
              <div className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/40 mt-2">Resilience</div>
            </div>
            <div className="bg-[#060b1a] px-3 py-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">{p.affected}</div>
              <div className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/40 mt-2">Affected</div>
            </div>
            <div className="bg-[#060b1a] px-3 py-5 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums leading-none">{p.clock}</div>
              <div className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/40 mt-2">Elapsed</div>
            </div>
          </div>
          {/* resilience bar */}
          <div className="mb-6">
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <span className="block h-full rounded-full" style={{ width: `${p.resilience}%`, background: p.resilience >= 80 ? '#10E5A0' : p.resilience >= 50 ? '#FFB547' : '#FF5470', transition: 'width 0.6s, background 0.5s' }} />
            </div>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2" style={{ color: '#FF5470' }}>Phase {phase + 1} / {PHASES.length} · {p.label}</div>
          <p className="text-sm text-white/60 leading-relaxed">{p.desc}</p>
          <div className="mt-auto pt-6 text-[10px] font-mono uppercase tracking-[0.18em] text-white/30">Scenario · sovereign continuity · simulated</div>
        </div>
      </div>
    </div>
  );
};

export default CrisisSimulation;
