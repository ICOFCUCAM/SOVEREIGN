import React, { useEffect, useState } from 'react';
import { Globe, Sparkles, LayoutDashboard, Rocket } from 'lucide-react';

const DOMAIN = 'govmesh.ai';
const PRIMARY = '#6366F1';
const ACCENT = '#00D9FF';

const STAGES = [
  { key: 'domain', label: 'Domain', icon: Globe, caption: 'A premium asset enters the network.' },
  { key: 'identity', label: 'AI Identity', icon: Sparkles, caption: 'Brand, palette, and narrative — generated.' },
  { key: 'dashboard', label: 'Live Dashboard', icon: LayoutDashboard, caption: 'An operational product takes shape.' },
  { key: 'deploy', label: 'Global Deployment', icon: Rocket, caption: 'Live, sovereign, and scaling worldwide.' },
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
  if (stage === 'dashboard') {
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
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono uppercase tracking-widest text-emerald-300">Live · 14 regions</span>
      </div>
    </div>
  );
};

const TransformationFlow: React.FC = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center mb-14">
        <h2 className="text-3xl sm:text-5xl font-bold tracking-tighter text-white mb-4">A domain becomes a company.</h2>
        <p className="text-white/50 text-lg max-w-xl mx-auto">Watch one asset move from name to live institution.</p>
      </div>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-[280px_1fr] gap-8 items-center">
        {/* Stage rail */}
        <div className="space-y-2">
          {STAGES.map((s, i) => {
            const Icon = s.icon;
            const on = i === active;
            return (
              <button key={s.key} onClick={() => setActive(i)}
                className={`w-full text-left flex items-start gap-3 rounded-xl p-3.5 transition-all ${on ? 'glass-strong' : 'hover:bg-white/[0.03]'}`}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-all"
                  style={on ? { background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})` } : { background: 'rgba(255,255,255,0.05)' }}>
                  <Icon className={`w-4 h-4 ${on ? 'text-white' : 'text-white/40'}`} />
                </div>
                <div>
                  <div className={`text-sm font-semibold ${on ? 'text-white' : 'text-white/50'}`}>{s.label}</div>
                  <div className={`text-xs mt-0.5 leading-snug ${on ? 'text-white/55' : 'text-white/30'}`}>{s.caption}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Morphing preview */}
        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl blur-[80px] opacity-30 transition-all" style={{ background: `radial-gradient(circle, ${active >= 2 ? ACCENT : PRIMARY}, transparent 70%)` }} />
          <div className="relative glass-strong rounded-2xl aspect-[4/3] p-5 overflow-hidden">
            {/* faux window chrome */}
            <div className="flex items-center gap-1.5 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
              <div className="ml-3 text-[10px] font-mono text-white/30">{DOMAIN}</div>
            </div>
            <div className="h-[calc(100%-2rem)] transition-opacity duration-500">
              <StagePreview stage={STAGES[active].key} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TransformationFlow;
