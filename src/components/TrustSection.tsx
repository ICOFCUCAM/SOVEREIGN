import React from 'react';
import { ShieldCheck, Lock, FileCheck, KeyRound, Eye, AlertTriangle } from 'lucide-react';

const TrustSection: React.FC = () => {
  const trust = [
    { icon: ShieldCheck, title: 'Wildcard SSL', value: 'Cloudflare-managed', detail: 'TLS 1.3 · HSTS · auto-renew' },
    { icon: KeyRound, title: 'Ownership Verification', value: 'TXT + DNS', detail: 'Multi-factor domain proof' },
    { icon: Lock, title: 'Tenant Isolation', value: 'Row-level security', detail: 'Per-org data segmentation' },
    { icon: Eye, title: 'Audit Telemetry', value: 'Full event log', detail: 'Immutable action history' },
    { icon: AlertTriangle, title: 'Anti-abuse', value: 'Rate-limited', detail: 'Bot + fraud protection' },
    { icon: FileCheck, title: 'Compliance', value: 'SOC2-ready', detail: 'GDPR · sovereign zones' },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full glass mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-300">Trust Layer</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Sovereign-grade <span className="text-gradient-cyan">security primitives.</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {trust.map(t => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="glass rounded-xl p-5 hover:glass-strong transition group">
                <Icon className="w-5 h-5 text-emerald-400 mb-3" />
                <div className="text-white font-semibold text-sm mb-0.5">{t.title}</div>
                <div className="text-emerald-300 text-xs font-mono mb-1.5">{t.value}</div>
                <div className="text-white/40 text-[11px]">{t.detail}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
