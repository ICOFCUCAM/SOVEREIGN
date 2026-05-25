import React, { useEffect, useState } from 'react';
import { Globe, Sparkles, Server, LayoutDashboard, Rocket, Check } from 'lucide-react';

const DOMAIN = 'govmesh.ai';
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

const StagePreview: React.FC<{ stage: string }> = ({ stage }) => {
  if (stage === 'domain') {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-5xl sm:text-6xl font-bold tracking-tighter">
          <span className="text-white">govmesh</span><span style={{ color: ACCENT }}>.ai</span>
        </div>
        <div className="mt-3 text-white/40 font-mono text-xs uppercase tracking-widest">Intelligence score · 96/100</div>
      </div>
    );
  }
  if (stage === 'identity') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`, boxShadow: `0 0 50px ${PRIMARY}50` }}>GM</div>
        <div className="text-white text-lg font-medium">"Connecting the intelligence of nations."</div>
        <div className="flex gap-2">
          {[PRIMARY, ACCENT, '#070A1F'].map((c) => <div key={c} className="w-10 h-6 rounded-md border border-white/10" style={{ background: c }} />)}
        </div>
      </div>
    );
  }
  if (stage === 'infra') {
    const rows = [
      { l: 'DNS orchestration', v: 'govmesh.ai → live' },
      { l: 'Sovereign cloud', v: '14 regions' },
      { l: 'Database cluster', v: 'replicated' },
      { l: 'Edge network', v: '47 nodes' },
      { l: 'Trust & security', v: 'sovereign-grade' },
    ];
    return (
      <div className="h-full w-full flex flex-col justify-center gap-2 px-1">
        {rows.map((r, i) => (
          <div key={r.l} className="flex items-center gap-3 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 animate-stage-in" style={{ animationDelay: `${i * 0.12}s` }}>
            <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ background: `${ACCENT}22` }}>
              <Check className="w-3 h-3" style={{ color: ACCENT }} />
            </span>
            <span className="text-sm text-white/75 flex-1 truncate">{r.l}</span>
            <span className="text-[11px] font-mono text-white/45 tabular-nums">{r.v}</span>
            <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-300">OK</span>
          </div>
        ))}
      </div>
    );
  }
  if (stage === 'institution') {
    return (
      <div className="h-full w-full p-2">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {['Coordination', 'Throughput', 'Uptime'].map((l, i) => (
            <div key={l} className="rounded-lg bg-white/5 border border-white/10 p-2.5">
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/40">{l}</div>
              <div className="text-lg font-bold text-white tabular-nums">{[98, 1240, 99.99][i]}{i === 2 ? '%' : ''}</div>
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-white/5 border border-white/10 p-3 flex items-end gap-1.5 h-24">
          {[40, 55, 48, 70, 62, 84, 78, 92, 88, 100].map((h, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, ${PRIMARY}, ${ACCENT})` }} />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative w-28 h-28 rounded-full border border-white/10 flex items-center justify-center"
        style={{ boxShadow: `inset 0 0 40px ${ACCENT}20` }}>
        <Globe className="w-12 h-12" style={{ color: ACCENT }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ top: `${50 + 44 * Math.sin(i * 1.3)}%`, left: `${50 + 44 * Math.cos(i * 1.3)}%` }} />
        ))}
      </div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" />
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-300">Live · 14 regions</span>
      </div>
    </div>
  );
};

const TransformationFlow: React.FC = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 3200);
    return () => clearInterval(t);
  }, []);

  const progress = STAGES.length > 1 ? (active / (STAGES.length - 1)) * 100 : 0;

  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center mb-14">
        <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">System transformation</div>
        <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tighter text-white mb-4">One domain becomes a live institution.</h2>
        <p className="text-white/50 text-lg max-w-xl mx-auto">From name to AI identity to sovereign infrastructure — deployed at civilization scale.</p>
      </div>

      {/* ── Pipeline tracker ── */}
      <div className="max-w-5xl mx-auto mb-12">
        <div className="relative">
          {/* connector track */}
          <div className="absolute left-0 right-0 top-5 h-px bg-white/10 hidden sm:block" />
          <div className="absolute left-0 top-5 h-px hidden sm:block transition-all duration-700" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${PRIMARY}, ${ACCENT})`, boxShadow: `0 0 12px ${ACCENT}80` }} />
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {STAGES.map((s, i) => {
              const Icon = s.icon;
              const on = i === active;
              const done = i < active;
              return (
                <button key={s.key} onClick={() => setActive(i)} className="relative flex flex-col items-center text-center group">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 z-10"
                    style={on ? { background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`, boxShadow: `0 0 24px ${ACCENT}55` } : { background: done ? `${ACCENT}22` : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {done ? <Check className="w-4 h-4" style={{ color: ACCENT }} /> : <Icon className={`w-4 h-4 ${on ? 'text-white' : 'text-white/40'}`} />}
                  </span>
                  <span className={`mt-3 text-xs font-semibold transition-colors ${on ? 'text-white' : 'text-white/45 group-hover:text-white/70'}`}>{s.label}</span>
                  <span className={`mt-1 text-[10px] leading-snug max-w-[140px] transition-colors hidden sm:block ${on ? 'text-white/50' : 'text-white/25'}`}>{s.caption}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Morphing operations viewport ── */}
      <div className="max-w-2xl mx-auto relative">
        <div className="absolute -inset-6 rounded-3xl blur-[80px] opacity-30 transition-all duration-700" style={{ background: `radial-gradient(circle, ${active >= 2 ? ACCENT : PRIMARY}, transparent 70%)` }} />
        <div className="relative glass-strong rounded-2xl aspect-[4/3] p-5 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <div className="ml-3 text-[10px] font-mono text-white/30">{DOMAIN}</div>
            <div className="ml-auto text-[9px] font-mono uppercase tracking-widest text-white/30">{STAGES[active].label}</div>
          </div>
          <div key={active} className="h-[calc(100%-2rem)] animate-stage-in">
            <StagePreview stage={STAGES[active].key} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TransformationFlow;
