import React, { useEffect, useState } from 'react';
import type { Domain } from '@/lib/types';
import { institutionBlueprint } from '@/lib/institution';
import {
  Landmark, Users, FileCheck, Activity, Vote, Scale, Lock, Banknote, Coins, Shield,
  Network, Cpu, Server, Database, Gauge, Truck, Radar, Globe, ChevronRight, Layers,
  DollarSign, MessageCircle, Cctv,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  landmark: Landmark, users: Users, fileCheck: FileCheck, activity: Activity, vote: Vote,
  scale: Scale, lock: Lock, banknote: Banknote, coins: Coins, shield: Shield, network: Network,
  cpu: Cpu, server: Server, database: Database, gauge: Gauge, truck: Truck, radar: Radar, cctv: Cctv,
};

const STATUS_COLOR: Record<string, string> = { live: '#10B981', arming: '#F59E0B', staged: '#00D9FF' };

interface Props {
  domain: Domain;
  onAcquire: (intent: 'inquiry' | 'offer' | 'buy_now') => void;
}

const InstitutionPreview: React.FC<Props> = ({ domain, onAcquire }) => {
  const bp = institutionBlueprint(domain.domain_name, domain.category);
  const primary = domain.brand_color || '#00D9FF';
  const accent = domain.accent_color || '#7C3AED';
  const [deployStage, setDeployStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setDeployStage((s) => (s + 1) % (bp.zones.length + 1)), 1100);
    return () => clearInterval(t);
  }, [bp.zones.length]);

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        {/* Reframe band */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-white/45 text-[11px] font-mono uppercase tracking-[0.25em] mb-5">
            Deployable institution · preview build
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tighter text-white mb-4">{bp.type}</h2>
          <p className="text-white/55 text-lg max-w-2xl mx-auto leading-relaxed">{bp.thesis}</p>
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-14">
          {bp.capabilities.map((c) => {
            const Icon = ICONS[c.icon] || Layers;
            return (
              <div key={c.label} className="glass rounded-xl p-4 flex items-center gap-3 hover:glass-strong transition">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${primary}30, ${accent}20)`, border: `1px solid ${primary}40` }}>
                  <Icon className="w-4 h-4" style={{ color: primary }} />
                </div>
                <span className="text-sm text-white/85 font-medium leading-tight">{c.label}</span>
              </div>
            );
          })}
        </div>

        {/* Operational command preview */}
        <div className="glass-strong rounded-2xl overflow-hidden mb-8">
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" style={{ color: primary }} />
              <span className="text-white font-semibold text-sm">{domain.domain_name.split('.')[0]} · Command Plane</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300/80 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Operational preview · simulated
            </span>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {bp.kpis.map((k) => (
                <div key={k.label} className="rounded-xl bg-white/5 border border-white/10 p-4">
                  <div className="text-2xl font-bold text-white tabular-nums" style={{ color: primary }}>{k.value}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mt-1">{k.label}</div>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-[1fr_360px] gap-4">
              {/* Throughput chart */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">Operational throughput · 24h</div>
                <div className="flex items-end gap-1.5 h-32">
                  {[42, 55, 48, 62, 70, 58, 75, 82, 71, 88, 79, 94, 86, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, ${primary}, ${accent})`, opacity: 0.55 + (i / 28) }} />
                  ))}
                </div>
              </div>
              {/* Systems */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-3">Systems online</div>
                <div className="space-y-2.5">
                  {bp.systems.map((s) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLOR[s.status], boxShadow: `0 0 6px ${STATUS_COLOR[s.status]}` }} />
                        <span className="text-sm text-white/80 truncate">{s.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-white font-mono tabular-nums">{s.metricValue}</span>
                        <span className="text-[9px] text-white/35 font-mono ml-1.5 uppercase">{s.metricLabel}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-12">
          {/* Deployment simulation */}
          <div className="glass-strong rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4"><Globe className="w-4 h-4" style={{ color: primary }} /><span className="text-white font-semibold text-sm">Deployment simulation</span></div>
            <div className="space-y-2.5">
              {bp.zones.map((z, i) => {
                const done = i < deployStage;
                const activeZone = i === deployStage;
                return (
                  <div key={z} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full transition-all" style={{ background: done ? '#10B981' : activeZone ? primary : 'rgba(255,255,255,0.15)', boxShadow: (done || activeZone) ? `0 0 8px ${done ? '#10B981' : primary}` : 'none' }} />
                    <span className={`text-sm transition-colors ${done || activeZone ? 'text-white' : 'text-white/40'}`}>{z}</span>
                    <div className="flex-1 h-px bg-white/5" />
                    <span className="text-[10px] font-mono uppercase" style={{ color: done ? '#10B981' : activeZone ? primary : 'rgba(255,255,255,0.3)' }}>
                      {done ? 'live' : activeZone ? 'deploying' : 'queued'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Architecture preview */}
          <div className="glass-strong rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4"><Layers className="w-4 h-4" style={{ color: primary }} /><span className="text-white font-semibold text-sm">Architecture preview</span></div>
            <div className="space-y-2">
              {bp.architecture.map((layer, i) => (
                <div key={layer} className="rounded-lg border border-white/10 px-4 py-2.5 flex items-center gap-3"
                  style={{ background: `linear-gradient(90deg, ${primary}${(18 - i * 3).toString(16).padStart(2, '0')}, transparent)` }}>
                  <span className="text-[10px] font-mono text-white/30">L{bp.architecture.length - i}</span>
                  <span className="text-sm text-white/80">{layer}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reframe CTA */}
        <div className="glass-strong rounded-2xl p-8 text-center relative overflow-hidden">
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[120px] opacity-25" style={{ background: primary }} />
          <div className="relative">
            <p className="text-white/60 text-lg mb-1">You're not acquiring a domain.</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              You're acquiring <span style={{ color: primary }}>{bp.type.toLowerCase()}</span>.
            </h3>
            <p className="text-white/50 mb-6">Listed at ${domain.price_usd.toLocaleString()} — a deployable preview today; it ships in full on acquisition, for a fraction of what the institution becomes.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={() => onAcquire('buy_now')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold transition-all"
                style={{ background: `linear-gradient(135deg, ${primary}, ${accent})`, boxShadow: `0 0 40px ${primary}30` }}>
                <DollarSign className="w-4 h-4" /> Acquire the institution
              </button>
              <button onClick={() => onAcquire('inquiry')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass hover:glass-strong text-white font-semibold transition">
                <MessageCircle className="w-4 h-4 text-cyan-400" /> Brief the AI Broker
                <ChevronRight className="w-4 h-4 text-white/40" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstitutionPreview;
