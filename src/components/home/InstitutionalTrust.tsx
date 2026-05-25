import React from 'react';
import { ShieldCheck, Landmark, Globe2, Activity, Lock, FileCheck, Database, ServerCog } from 'lucide-react';

const METRICS = [
  { icon: Landmark, value: '11', label: 'Deployable institutions' },
  { icon: Activity, value: '2,847', label: 'Verified deployments' },
  { icon: Globe2, value: '23', label: 'Operational regions' },
  { icon: ShieldCheck, value: '99.99%', label: 'Uptime SLA' },
];

const GOVERNANCE = [
  { icon: Database, label: 'Sovereign data residency' },
  { icon: Lock, label: 'Bank-grade encryption' },
  { icon: FileCheck, label: 'Audit-ready logging' },
  { icon: ServerCog, label: 'Tenant isolation (RLS)' },
];

const InstitutionalTrust: React.FC = () => (
  <section className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-16 items-center">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-cyan-300/70 mb-5">Institutional trust</div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tighter text-white leading-[0.98] mb-5">
            Built for institutions that cannot fail.
          </h2>
          <p className="text-lg text-white/55 leading-relaxed mb-7">
            Procurement-grade infrastructure with sovereign data residency, audited operations and governed deployment — trusted by governments, enterprises and institutional operators.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {GOVERNANCE.map((g) => {
              const Icon = g.icon;
              return (
                <span key={g.label} className="inline-flex items-center gap-2 text-xs text-white/70 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.03]">
                  <Icon className="w-3.5 h-3.5 text-cyan-400" /> {g.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.label} className="px-6 py-7 bg-white/[0.01]">
                <Icon className="w-4 h-4 text-cyan-400 mb-3" />
                <div className="text-3xl font-bold text-white tabular-nums leading-none mb-2">{m.value}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">{m.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default InstitutionalTrust;
