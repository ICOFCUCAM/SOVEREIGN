import React from 'react';
import { Banknote, Activity, Server, ShieldCheck, Landmark, Globe2 } from 'lucide-react';

const STATS = [
  { icon: Banknote, value: '$184.6B', label: 'Settled · 24h' },
  { icon: Activity, value: '418,392', label: 'Transactions / sec' },
  { icon: Server, value: '147', label: 'Sovereign Nodes' },
  { icon: ShieldCheck, value: '99.99%', label: 'System Uptime' },
  { icon: Landmark, value: '256', label: 'Active Institutions' },
  { icon: Globe2, value: '23', label: 'Global Regions' },
];

const GlobalStatBar: React.FC = () => (
  <section className="border-t border-white/10 bg-black/30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8">
      {STATS.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-cyan-400 shrink-0" />
            <div className="leading-none">
              <div className="text-xl font-bold text-white tabular-nums">{s.value}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-white/40 mt-1.5">{s.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default GlobalStatBar;
