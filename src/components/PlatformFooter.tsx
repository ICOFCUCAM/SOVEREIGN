import React, { useState } from 'react';
import { Shield, Globe, Mail, Send, CheckCircle2 } from 'lucide-react';

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
        body: JSON.stringify({ email, source: 'footer-signup', tags: ['platform-newsletter', 'sovereign-os'] })
      });
      setSent(true);
      setEmail('');
    } catch {}
    setLoading(false);
  };

  return (
    <footer className="relative border-t border-white/5 bg-gradient-to-b from-transparent to-black/40 mt-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-white font-bold tracking-tight">SOVEREIGN DOMAIN.OS</div>
                <div className="text-[10px] text-cyan-400/60 font-mono tracking-widest">DIGITAL CIVILIZATION INFRASTRUCTURE</div>
              </div>
            </div>
            <p className="text-white/50 text-sm leading-relaxed max-w-md mb-6">
              The operating system for digital civilization. Sovereign domain intelligence, AI-native deployment infrastructure, and autonomous venture creation — engineered for the next century of digital institutions.
            </p>
            <form onSubmit={submit} className="flex gap-2 max-w-sm">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="operations@yourorg.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none" />
              </div>
              <button type="submit" disabled={loading} className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5">
                {sent ? <CheckCircle2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                {sent ? 'Joined' : 'Join'}
              </button>
            </form>
          </div>

          <div>
            <div className="text-white text-sm font-semibold mb-4">Platform</div>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="/marketplace" className="hover:text-cyan-400 transition">Marketplace</a></li>
              <li><a href="/valuation" className="hover:text-cyan-400 transition">AI Valuation</a></li>
              <li><a href="/admin" className="hover:text-cyan-400 transition">Command Center</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Deployment Engine</a></li>
            </ul>
          </div>

          <div>
            <div className="text-white text-sm font-semibold mb-4">Infrastructure</div>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#" className="hover:text-cyan-400 transition">Sovereign Cloud</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Edge Network</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">DNS & SSL</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Registrar API</a></li>
            </ul>
          </div>

          <div>
            <div className="text-white text-sm font-semibold mb-4">Governance</div>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><a href="#" className="hover:text-cyan-400 transition">Security</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Compliance</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Status</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition">Trust Center</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
            <span>© 2026 SOVEREIGN.OS</span>
            <span className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ALL SYSTEMS OPERATIONAL
            </span>
            <span className="hidden sm:inline">EDGE NODES: 47</span>
            <span className="hidden md:inline">PROPAGATION: 99.99%</span>
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
