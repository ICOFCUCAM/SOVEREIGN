import React from 'react';
import { Server, Database, Cloud, Shield, Cpu, Network } from 'lucide-react';

const layers = [
  { icon: Network, name: 'Edge Layer', tech: 'Cloudflare · 47 nodes · Wildcard SSL', color: '#00D9FF' },
  { icon: Server, name: 'Routing Layer', tech: 'Next.js middleware · Tenant resolver · Redis cache', color: '#7C3AED' },
  { icon: Cpu, name: 'AI Intelligence Layer', tech: 'Gemini · Claude · Scoring kernels · Async workers', color: '#F59E0B' },
  { icon: Database, name: 'Data Layer', tech: 'PostgreSQL · Prisma · Multi-region replication', color: '#10B981' },
  { icon: Cloud, name: 'Deployment Layer', tech: 'Vercel · Kubernetes-ready · Sovereign clusters', color: '#EC4899' },
  { icon: Shield, name: 'Trust Layer', tech: 'RBAC · Audit logs · Anti-abuse · TXT verification', color: '#06B6D4' },
];

const ArchitectureSection: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full glass mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-300">System Architecture</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Six layers. <span className="text-gradient-cyan">One sovereign stack.</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Production-grade modular infrastructure engineered for sovereign-scale expansion. Every layer is independently scalable, observable, and extensible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-2xl overflow-hidden">
          {layers.map((l, i) => {
            const Icon = l.icon;
            return (
              <div key={l.name} className="bg-[#05071A]/80 backdrop-blur-xl p-6 hover:bg-white/[0.03] transition group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${l.color}25, ${l.color}05)`, border: `1px solid ${l.color}40` }}>
                    <Icon className="w-5 h-5" style={{ color: l.color }} />
                  </div>
                  <div className="text-[10px] font-mono text-white/30">L{i + 1}</div>
                </div>
                <div className="text-white font-semibold mb-1">{l.name}</div>
                <div className="text-xs text-white/40 font-mono leading-relaxed">{l.tech}</div>
                <div className="mt-4 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-300 font-mono uppercase tracking-wider">Operational</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Terminal-style status block */}
        <div className="mt-8 glass-strong rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between bg-black/30">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="ml-3 text-xs text-white/40 font-mono">platform.status — live telemetry</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">● STREAMING</span>
          </div>
          <div className="p-5 font-mono text-xs leading-relaxed">
            <div className="text-emerald-400">$ sovereign-os health --all-regions</div>
            <div className="text-white/60 mt-2">[✓] edge-routing            <span className="text-emerald-400">healthy</span>   <span className="text-white/30">  47ms p50 · 89ms p99</span></div>
            <div className="text-white/60">[✓] tenant-resolver         <span className="text-emerald-400">healthy</span>   <span className="text-white/30">  redis hit rate 94.7%</span></div>
            <div className="text-white/60">[✓] valuation-engine        <span className="text-emerald-400">healthy</span>   <span className="text-white/30">  queue depth 0</span></div>
            <div className="text-white/60">[✓] branding-engine         <span className="text-emerald-400">healthy</span>   <span className="text-white/30">  12.4k generations / 24h</span></div>
            <div className="text-white/60">[✓] negotiation-agent       <span className="text-emerald-400">healthy</span>   <span className="text-white/30">  847 active sessions</span></div>
            <div className="text-white/60">[✓] deployment-orchestrator <span className="text-emerald-400">healthy</span>   <span className="text-white/30">  3 jobs in pipeline</span></div>
            <div className="text-white/60">[✓] postgres-primary        <span className="text-emerald-400">healthy</span>   <span className="text-white/30">  replication lag 12ms</span></div>
            <div className="text-cyan-400 mt-2">→ all systems nominal · sovereign-mode engaged</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
