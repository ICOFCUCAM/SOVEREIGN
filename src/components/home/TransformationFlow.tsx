import React, { useEffect, useState } from 'react';
import { Globe, Sparkles, Server, LayoutDashboard, Rocket, Check } from 'lucide-react';

const PRIMARY = '#6366F1';
const ACCENT = '#00D9FF';

interface Stage { key: string; label: string; icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; caption: string }
const STAGES: Stage[] = [
  { key: 'domain', label: 'Domain', icon: Globe, caption: 'A premium asset enters the network.' },
  { key: 'identity', label: 'AI Identity', icon: Sparkles, caption: 'Brand, palette and narrative — generated.' },
  { key: 'infra', label: 'Infrastructure', icon: Server, caption: 'Sovereign cloud, DNS and data — provisioned.' },
  { key: 'institution', label: 'Live Institution', icon: LayoutDashboard, caption: 'An operational system goes online.' },
  { key: 'civilization', label: 'Civilization-Scale', icon: Rocket, caption: 'Deployed sovereign, scaling worldwide.' },
];

const StageVisual: React.FC<{ stage: string; active: boolean }> = ({ stage, active }) => {
  if (stage === 'domain') return (
    <div className="flex items-center justify-center h-full">
      <div className="text-2xl sm:text-3xl font-bold tracking-tighter"><span className="text-white">govmesh</span><span style={{ color: ACCENT }}>.ai</span></div>
    </div>
  );
  if (stage === 'identity') return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`, boxShadow: active ? `0 0 30px ${PRIMARY}66` : 'none' }}>GM</div>
      <div className="flex gap-1.5">{[PRIMARY, ACCENT, '#070A1F'].map((c) => <div key={c} className="w-7 h-4 rounded border border-white/10" style={{ background: c }} />)}</div>
    </div>
  );
  if (stage === 'infra') return (
    <div className="flex flex-col justify-center h-full gap-1.5 px-2">
      {['DNS', 'Cloud', 'Data', 'Edge'].map((l, i) => (
        <div key={l} className="flex items-center gap-2 rounded-md bg-white/[0.04] border border-white/10 px-2 py-1 animate-stage-in" style={{ animationDelay: `${i * 0.1}s` }}>
          <Check className="w-2.5 h-2.5" style={{ color: ACCENT }} />
          <span className="text-[10px] text-white/70 flex-1">{l}</span>
          <span className="text-[8px] font-mono uppercase text-emerald-300">ok</span>
        </div>
      ))}
    </div>
  );
  if (stage === 'institution') return (
    <div className="flex flex-col justify-center h-full gap-2 px-1">
      <div className="grid grid-cols-3 gap-1.5">
        {[['Ops', '98'], ['Tx', '1.2K'], ['SLA', '99.9']].map(([l, v]) => (
          <div key={l} className="rounded-md bg-white/5 border border-white/10 px-1.5 py-1">
            <div className="text-[7px] font-mono uppercase text-white/40">{l}</div>
            <div className="text-[11px] font-bold text-white tabular-nums">{v}</div>
          </div>
        ))}
      </div>
      <div className="flex items-end gap-1 h-8">{[40, 62, 50, 78, 66, 90, 100].map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, ${PRIMARY}, ${ACCENT})` }} />)}</div>
    </div>
  );
  return (
    <div className="flex items-center justify-center h-full">
      <div className="relative w-16 h-16 rounded-full border border-white/10 flex items-center justify-center" style={{ boxShadow: `inset 0 0 24px ${ACCENT}26` }}>
        <Globe className="w-7 h-7" style={{ color: ACCENT }} />
        {active && [0, 1, 2, 3].map((i) => <span key={i} className="absolute w-1 h-1 rounded-full bg-emerald-400" style={{ top: `${50 + 46 * Math.sin(i * 1.6)}%`, left: `${50 + 46 * Math.cos(i * 1.6)}%` }} />)}
      </div>
    </div>
  );
};

const TransformationFlow: React.FC = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 2600);
    return () => clearInterval(t);
  }, []);
  const progress = (active / (STAGES.length - 1)) * 100;

  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">System transformation</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-white leading-[0.98] mb-4">One domain becomes a live institution.</h2>
          <p className="text-lg text-white/55 leading-relaxed">From name to AI identity to sovereign infrastructure — deployed at civilization scale.</p>
        </div>

        {/* full-width sequence */}
        <div className="relative">
          {/* connector beam */}
          <div className="absolute hidden lg:block left-[10%] right-[10%] top-8 h-px bg-white/10" />
          <div className="absolute hidden lg:block left-[10%] top-8 h-px transition-all duration-700" style={{ width: `${progress * 0.8}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`, boxShadow: `0 0 12px ${ACCENT}80` }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-4">
            {STAGES.map((s, i) => {
              const Icon = s.icon; const on = i === active; const done = i < active;
              return (
                <button key={s.key} onClick={() => setActive(i)} className="relative flex flex-col items-center text-center group">
                  {/* node */}
                  <span className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 mb-5"
                    style={on ? { background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`, boxShadow: `0 0 24px ${ACCENT}66` } : { background: done ? `${ACCENT}22` : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}>
                    {done ? <Check className="w-4 h-4" style={{ color: ACCENT }} /> : <Icon className={`w-4 h-4 ${on ? 'text-white' : 'text-white/45'}`} />}
                  </span>
                  {/* stage frame */}
                  <div className={`relative w-full rounded-2xl border overflow-hidden transition-all duration-500 ${on ? 'border-white/25 scale-[1.03]' : 'border-white/10'}`} style={{ aspectRatio: '4 / 3' }}>
                    <div className="absolute inset-0" style={{ background: on ? `radial-gradient(ellipse 90% 80% at 50% 0%, ${ACCENT}1f, transparent 60%), linear-gradient(160deg, #0A1024, #05070F)` : 'linear-gradient(160deg, #0A1024, #05070F)' }} />
                    {on && <div className="absolute -inset-6 blur-[40px] opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle, ${ACCENT}, transparent 70%)` }} />}
                    <div className="relative h-full p-3"><StageVisual stage={s.key} active={on} /></div>
                  </div>
                  <div className={`mt-4 text-sm font-semibold transition-colors ${on ? 'text-white' : 'text-white/50 group-hover:text-white/75'}`}>{s.label}</div>
                  <div className={`mt-1 text-[11px] leading-snug max-w-[180px] transition-colors ${on ? 'text-white/50' : 'text-white/25'}`}>{s.caption}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TransformationFlow;
