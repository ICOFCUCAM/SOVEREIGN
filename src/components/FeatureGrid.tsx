import React from 'react';
import { Brain, Network, Lock, Rocket, BarChart3, Bot, Globe2, Layers, ShieldCheck } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Domain Intelligence', desc: 'Multi-factor scoring engine analyzing brandability, SEO, market alignment, and sovereign potential across 12 dimensions.', color: '#00D9FF' },
  { icon: Bot, title: 'AI Negotiation Broker', desc: 'Autonomous deal progression with intelligent pricing, buyer intent scoring, and multi-round negotiation memory.', color: '#7C3AED' },
  { icon: Rocket, title: 'Instant Startup Foundry', desc: 'One-click provisioning: app, branding, auth, database, billing, analytics, and deployment pipeline.', color: '#F59E0B' },
  { icon: Network, title: 'Multi-Tenant Edge Routing', desc: 'Sub-50ms hostname resolution at the edge with Redis caching, wildcard SSL, and tenant isolation.', color: '#10B981' },
  { icon: ShieldCheck, title: 'Sovereign Trust Layer', desc: 'Cloudflare-grade DNS, automated SSL, TXT verification, ownership validation, and anti-abuse protection.', color: '#EC4899' },
  { icon: Layers, title: 'Branding Engine', desc: 'Cinematic AI-generated identity systems: concepts, slogans, color palettes, typography, and pitch decks.', color: '#06B6D4' },
  { icon: BarChart3, title: 'Operational Telemetry', desc: 'Real-time analytics on traffic origin, engagement scoring, conversion events, and buyer behavior modeling.', color: '#A855F7' },
  { icon: Globe2, title: 'African Edge Network', desc: 'Regional edge nodes designed for continent-scale digital infrastructure and sovereign hosting zones.', color: '#22D3EE' },
  { icon: Lock, title: 'Institutional Mode', desc: 'Compliance isolation, RBAC, audit logs, sovereign cloud segmentation, and infrastructure sovereignty controls.', color: '#FBBF24' },
];

const FeatureGrid: React.FC = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 rounded-full glass mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-cyan-300">Platform Capabilities</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
            Infrastructure for <span className="text-gradient-cyan">deployable institutions.</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Nine integrated modules orchestrating domain intelligence, autonomous branding, deployment automation, and sovereign-scale operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="group relative glass rounded-2xl p-6 hover:glass-strong transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-30 blur-3xl transition-opacity"
                  style={{ background: f.color }} />
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${f.color}30, ${f.color}10)`, border: `1px solid ${f.color}40` }}>
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2 tracking-tight">{f.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureGrid;
