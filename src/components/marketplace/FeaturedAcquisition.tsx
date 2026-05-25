import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, Gauge, ShieldCheck, DollarSign } from 'lucide-react';
import type { Domain } from '@/lib/types';
import SystemTelemetry from '@/components/SystemTelemetry';

const ACCENT: Record<string, string> = {
  govtech: '#6366F1', fintech: '#10B981', ai: '#7C4DFF', infra: '#00D9FF',
  logistics: '#F59E0B', saas: '#22D3EE',
};
const APPLICATIONS: Record<string, string[]> = {
  govtech: ['Ministry dashboards', 'Citizen identity', 'Procurement oversight', 'Policy intelligence'],
  fintech: ['Payment rails', 'Settlement & clearing', 'Compliance engine', 'Treasury operations'],
  ai: ['Reasoning core', 'Document intelligence', 'Autonomous agents', 'Knowledge graph'],
  infra: ['Edge orchestration', 'Sovereign cloud', 'DNS & provisioning', 'Observability'],
  logistics: ['Fleet routing', 'Shipment tracking', 'Transport marketplace', 'Coordination mesh'],
  saas: ['Operational console', 'Multi-tenant control', 'Workflow automation', 'Analytics'],
};
const DEFAULT_APPS = ['Sovereign deployment', 'AI provisioning', 'Global edge', 'Institutional console'];

const price = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}k` : `$${n}`);

const FeaturedAcquisition: React.FC<{ domain: Domain; opportunity: number; confidence: { score: number; level: string } }> = ({ domain, opportunity, confidence }) => {
  const accent = ACCENT[domain.category] || '#00C2FF';
  const apps = APPLICATIONS[domain.category] || DEFAULT_APPS;
  const [name, ...rest] = domain.domain_name.split('.');
  const tld = rest.length ? `.${rest.join('.')}` : '';
  const to = `/d/${encodeURIComponent(domain.domain_name)}`;

  const stats = [
    { icon: Gauge, label: 'Intelligence', value: `${domain.valuation_score}/100` },
    { icon: Rocket, label: 'Opportunity', value: `${opportunity}/100` },
    { icon: ShieldCheck, label: confidence.level, value: `${confidence.score}%` },
    { icon: DollarSign, label: 'Acquisition', value: price(Number(domain.price_usd || 0)) },
  ];

  return (
    <div className="relative rounded-3xl border border-white/10 overflow-hidden mb-8">
      <div className="absolute -inset-10 blur-[80px] opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 30% 20%, ${accent}, transparent 60%)` }} />
      <div className="relative grid lg:grid-cols-2 gap-0">
        {/* institutional simulation */}
        <div className="relative p-5 sm:p-7 min-h-[300px]">
          <div className="h-full" style={{ minHeight: 260 }}>
            <SystemTelemetry category={domain.category} accent={accent} className="h-full" />
          </div>
        </div>
        {/* institutional positioning */}
        <div className="relative p-6 sm:p-9 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/10">
          <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.24em] mb-5" style={{ color: accent }}>
            <span className="w-1.5 h-1.5 rounded-full animate-node" style={{ background: accent }} /> Featured acquisition · {domain.category}
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-bold tracking-tight leading-none mb-4">
            <span className="text-white">{name}</span><span style={{ color: accent }}>{tld}</span>
          </h2>
          {domain.tagline && <p className="text-base text-white/55 max-w-md leading-relaxed mb-6">{domain.tagline}</p>}

          <div className="flex flex-wrap rounded-xl overflow-hidden border border-white/10 bg-white/[0.02] mb-6">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex-1 min-w-[120px] px-4 py-3 border-r border-white/5 last:border-r-0">
                  <Icon className="w-3.5 h-3.5 mb-1.5" style={{ color: accent }} />
                  <div className="text-lg font-mono font-semibold text-white tabular-nums leading-none">{s.value}</div>
                  <div className="text-[8px] font-mono uppercase tracking-[0.18em] text-white/40 mt-1.5">{s.label}</div>
                </div>
              );
            })}
          </div>

          <div className="mb-7">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 mb-2.5">Sovereign applications</div>
            <div className="flex flex-wrap gap-2">
              {apps.map((a) => (
                <span key={a} className="text-xs text-white/70 px-2.5 py-1 rounded-md border border-white/10 bg-white/[0.03]">{a}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={to} className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all"
              style={{ background: `linear-gradient(135deg, ${accent}, #7C4DFF)`, boxShadow: `0 0 36px ${accent}44` }}>
              Acquire institution <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to={to} className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-white/15 bg-white/[0.03] text-white font-semibold hover:bg-white/5 transition-all">
              Deployment preview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedAcquisition;
