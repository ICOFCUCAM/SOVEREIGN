import React, { useEffect, useState } from 'react';
import { Globe, Sparkles, Server, Rocket, Landmark, Check } from 'lucide-react';

interface Stage { label: string; caption: string; icon: React.ComponentType<{ className?: string }> }
const STAGES: Stage[] = [
  { label: 'Domain', caption: 'A premium asset', icon: Globe },
  { label: 'Identity', caption: 'AI brand & narrative', icon: Sparkles },
  { label: 'Infrastructure', caption: 'Sovereign cloud', icon: Server },
  { label: 'Deployment', caption: 'Provisioned in seconds', icon: Rocket },
  { label: 'Live Institution', caption: 'Operating at scale', icon: Landmark },
];

const TransformationFlow: React.FC = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 2400);
    return () => clearInterval(t);
  }, []);
  const progress = (active / (STAGES.length - 1)) * 100;

  return (
    <section className="py-32 sm:py-44 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-24">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">The deployment story</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-[0.98]">
            A domain becomes a living institution.
          </h2>
        </div>

        <div className="relative">
          {/* flowing connector (md+) */}
          <div className="absolute hidden md:block left-[10%] right-[10%] top-7 h-px bg-white/10" />
          <div className="absolute hidden md:block left-[10%] top-7 h-px transition-all duration-700" style={{ width: `${progress * 0.8}%`, background: 'linear-gradient(90deg, #6366F1, #00D9FF)', boxShadow: '0 0 14px #00D9FF88' }} />

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-y-10 gap-x-4">
            {STAGES.map((s, i) => {
              const Icon = s.icon; const on = i === active; const done = i < active;
              return (
                <button key={s.label} onClick={() => setActive(i)} className="relative flex flex-col items-center text-center group">
                  <span className={`absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[0.2em] transition-colors ${on ? 'text-cyan-300' : 'text-white/25'}`}>{String(i + 1).padStart(2, '0')}</span>
                  <span className="relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500"
                    style={on ? { background: 'linear-gradient(135deg, #6366F1, #00D9FF)', boxShadow: '0 0 28px rgba(0,217,255,0.5)' } : { background: done ? 'rgba(0,217,255,0.14)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {done ? <Check className="w-5 h-5 text-cyan-300" /> : <Icon className={`w-5 h-5 ${on ? 'text-white' : 'text-white/45'}`} />}
                  </span>
                  <div className={`mt-5 text-base font-semibold transition-colors ${on ? 'text-white' : 'text-white/55 group-hover:text-white/80'}`}>{s.label}</div>
                  <div className={`mt-1.5 text-[13px] transition-colors ${on ? 'text-white/50' : 'text-white/30'}`}>{s.caption}</div>
                  {/* arrow between stages on mobile */}
                  {i < STAGES.length - 1 && <div className="sm:hidden mt-6 w-px h-6 bg-white/10" />}
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
