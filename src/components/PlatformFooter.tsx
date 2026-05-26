import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Globe, Mail, Send, CheckCircle2 } from 'lucide-react';

const COLUMNS: Array<{ title: string; links: Array<{ label: string; to: string }> }> = [
  {
    title: 'Platform layers',
    links: [
      { label: 'Ecosystem', to: '/ecosystem' },
      { label: 'Marketplace', to: '/marketplace' },
      { label: 'AI Valuation', to: '/valuation' },
      { label: 'Branding Studio', to: '/studio' },
      { label: 'Command Center', to: '/admin' },
    ],
  },
  {
    title: 'Systems',
    links: [
      { label: 'CIVICOS', to: '/systems/civicos' },
      { label: 'VeritasOS', to: '/systems/veritas-os' },
      { label: 'Veritas Financial', to: '/systems/veritas-banking' },
      { label: 'ELECPRO', to: '/systems/elecpro' },
      { label: 'FlyttGo', to: '/systems/flyttgo' },
      { label: 'Mobile Pay', to: '/systems/mobile-pay' },
    ],
  },
  {
    title: 'Sectors',
    links: [
      { label: 'Governance & Integrity', to: '/ecosystem' },
      { label: 'Finance & Banking', to: '/ecosystem' },
      { label: 'Knowledge & Intelligence', to: '/ecosystem' },
      { label: 'Logistics & Mobility', to: '/ecosystem' },
      { label: 'Commerce & Deployment', to: '/ecosystem' },
    ],
  },
];

const REGIONS: Array<[string, 'online' | 'scaling']> = [
  ['us-east', 'online'], ['eu-west', 'online'], ['af-north', 'online'],
  ['ap-south', 'scaling'], ['sa-east', 'online'], ['oc-1', 'online'],
];

const OpsTerminal: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const utc = now.toISOString().replace('T', ' ').slice(0, 19);

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden mb-12">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="w-2.5 h-2.5 rounded-full bg-white/15" />
        <span className="ml-2 text-[10px] font-mono text-white/40 tracking-wider">sovereign://operations</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[9px] font-mono uppercase tracking-wider text-emerald-300/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Live
        </span>
      </div>
      <div className="p-4 font-mono text-xs leading-relaxed space-y-2.5">
        <div className="text-white/65 flex flex-wrap gap-x-6 gap-y-1">
          <span><span className="text-white/35">regions</span> 23</span>
          <span><span className="text-white/35">edge</span> 47 nodes</span>
          <span><span className="text-white/35">deploy</span> 87s</span>
          <span><span className="text-white/35">uptime</span> 99.99%</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {REGIONS.map(([r, s]) => (
            <span key={r} className="inline-flex items-center gap-1.5 text-white/50">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s === 'online' ? '#10B981' : '#F59E0B' }} />
              {r}
            </span>
          ))}
        </div>
        <div className="text-white/35 pt-0.5">
          utc {utc} · all systems operational
          <span className="inline-block ml-1 text-cyan-300/80 animate-pulse">▮</span>
        </div>
      </div>
    </div>
  );
};

const PlatformFooter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch('https://famous.ai/api/crm/6a122e7fba2cb2e96599de96/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer-signup', tags: ['platform-newsletter', 'sovereign-os'] }),
      });
    } catch { /* best-effort */ }
    setSent(true);
    setEmail('');
    setLoading(false);
  };

  return (
    <footer className="relative border-t border-white/5 bg-gradient-to-b from-transparent to-black/40 mt-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <OpsTerminal />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-display text-white font-bold tracking-tight">SOVEREIGN</div>
                <div className="text-[10px] text-cyan-400/60 font-mono tracking-[0.2em]">DIGITAL CIVILIZATION INFRASTRUCTURE</div>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed max-w-md mb-6">
              The operating layer for digital civilization — sovereign domain intelligence, AI-native deployment infrastructure, and deployable institutions, engineered for the next century.
            </p>
            <form onSubmit={submit} className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email address"
                  placeholder="operations@yourorg.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
              </div>
              <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
                {sent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {sent ? 'Joined' : 'Join'}
              </button>
            </form>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-white text-sm font-semibold mb-4">{col.title}</div>
              <ul className="space-y-2.5 text-sm text-white/50">
                {col.links.map((l) => (
                  <li key={l.label}><Link to={l.to} className="hover:text-cyan-400 transition">{l.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
            <span>© {new Date().getFullYear()} SOVEREIGN</span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" />
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Globe className="w-3.5 h-3.5" />
            <span>Multi-region · Wildcard SSL · Sovereign-grade</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PlatformFooter;
