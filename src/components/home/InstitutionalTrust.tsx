import React from 'react';
import { ShieldCheck, Landmark, Globe2, Activity, Lock, FileCheck, Database, ServerCog, Fingerprint } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import HudCorners from '@/components/HudCorners';

interface MetricDef { icon: React.ComponentType<{ className?: string }>; value: number; decimals?: number; prefix?: string; suffix?: string; label: string }
// Deliberately distinct from the deployment-network telemetry bar — these speak
// to governance, scale and institutional trust, not live network counts.
const METRICS: MetricDef[] = [
  { icon: Landmark, value: 11, label: 'Deployable institutions' },
  { icon: Activity, value: 2847, label: 'Verified deployments' },
  { icon: Globe2, value: 6, label: 'Continents operational' },
  { icon: ShieldCheck, value: 4.2, decimals: 1, prefix: '$', suffix: 'B', label: 'Assets under governance' },
];

const GOVERNANCE = [
  { icon: Database, label: 'Sovereign data residency' },
  { icon: Lock, label: 'Bank-grade encryption' },
  { icon: FileCheck, label: 'Audit-ready logging' },
  { icon: ServerCog, label: 'Tenant isolation (RLS)' },
  { icon: Fingerprint, label: 'Cryptographic provenance' },
];

const Metric: React.FC<{ m: MetricDef; i: number }> = ({ m, i }) => {
  const { ref, value } = useCountUp(m.value, 1700 + i * 140, m.decimals || 0);
  const Icon = m.icon;
  const shown = m.decimals ? value.toFixed(m.decimals) : Math.round(value).toLocaleString();
  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className="relative px-6 py-7 bg-white/[0.01]">
      <Icon className="w-4 h-4 text-cyan-400 mb-3" />
      <div className="text-3xl sm:text-4xl font-bold text-white tabular-nums leading-none mb-2 tracking-tight" style={{ textShadow: '0 0 28px rgba(0,217,255,0.22)' }}>
        {m.prefix}{shown}<span className="text-white/45 text-[0.55em] font-semibold ml-0.5">{m.suffix}</span>
      </div>
      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">{m.label}</div>
    </div>
  );
};

const InstitutionalTrust: React.FC = () => (
  <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-20 items-center">
        <div>
          <div className="kicker text-cyan-300/70 mb-6" style={{ letterSpacing: '0.3em' }}>Institutional trust</div>
          <h2 className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-cinematic text-white leading-[0.95] text-balance mb-6">
            Built for institutions<br />that cannot fail.
          </h2>
          <p className="text-lg text-white/55 leading-relaxed mb-8 max-w-md">
            Procurement-grade infrastructure with sovereign data residency, audited operations and governed deployment — engineered for governments, enterprises and institutional operators.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {GOVERNANCE.map((g) => {
              const Icon = g.icon;
              return (
                <span key={g.label} className="inline-flex items-center gap-2 text-xs text-white/70 px-3 py-2 rounded-lg border border-white/10 bg-white/[0.025] ease-cinematic transition-all duration-500 hover:border-cyan-400/30 hover:bg-white/[0.05] hover:-translate-y-0.5">
                  <Icon className="w-3.5 h-3.5 text-cyan-400" /> {g.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* institutional ledger — hairline-divided metric matrix */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/[0.012]">
          <span className="absolute inset-x-0 top-0 h-px z-10" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,217,255,0.5), transparent)' }} />
          <HudCorners color="#00D9FF" className="opacity-30 z-10" />
          <div className="absolute top-3 right-4 z-10 text-[9px] font-mono uppercase tracking-[0.2em] text-white/30">Governance ledger</div>
          <div className="grid grid-cols-2 gap-px bg-white/8">
            {METRICS.map((m, i) => <Metric key={m.label} m={m} i={i} />)}
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default InstitutionalTrust;
