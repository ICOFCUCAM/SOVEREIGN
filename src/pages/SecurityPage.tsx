import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, KeyRound, FileLock, Server, Network } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import ContactModal from '@/components/ContactModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const PILLARS = [
  { icon: Shield,    t: 'Tenant isolation',  d: 'Row-level security on every data table. Institutional plans available with dedicated databases and compute.' },
  { icon: Lock,      t: 'Encryption',        d: 'TLS 1.3 in transit, AES-256 at rest, signed URLs for generated media.' },
  { icon: KeyRound,  t: 'Secret handling',   d: 'Provider keys (Stripe, Runway, OpenAI, channels) live as edge-function secrets, never in the client bundle.' },
  { icon: FileLock,  t: 'Webhook integrity', d: 'Stripe HMAC verification with constant-time compare and strict timestamp tolerance.' },
  { icon: Server,    t: 'Audit logs',        d: 'Every billing event, subscription transition, and admin action is written to audit_logs with actor + diff.' },
  { icon: Network,   t: 'Sovereign deploys', d: 'Institutional tenants can run in their own region with isolated networking and bring-your-own provider keys.' },
];

const SecurityPage: React.FC = () => {
  useDocumentTitle('Security', 'Sovereign-grade security by default — isolation, encryption, audit logs, and institutional deployment options.');
  const [open, setOpen] = useState(false);
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 max-w-3xl">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Security</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-cinematic leading-[0.96] mb-5">
              Sovereign-grade <span className="text-gradient-cyan">by default.</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed">
              The defaults are institutional. Configure nothing and you still get isolation, audit trails, and signed media.
              What changes on the Institutional plan is who controls the keys and the topology.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map((p) => (
              <div key={p.t} className="rounded-2xl border border-white/10 bg-white/[0.015] p-6">
                <p.icon className="w-5 h-5 text-cyan-300" />
                <h2 className="mt-4 font-display text-xl font-bold tracking-tight">{p.t}</h2>
                <p className="mt-2 text-sm text-white/55 leading-relaxed">{p.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.015] p-8">
            <h2 className="font-display text-2xl font-bold">Vulnerability disclosure</h2>
            <p className="mt-3 text-sm text-white/55 leading-relaxed">
              Report security issues through the{' '}
              <button onClick={() => setOpen(true)} className="text-cyan-300 hover:text-white underline-offset-2 hover:underline">security disclosure desk</button>.
              We acknowledge within 48 hours; PGP key available on request.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-[13px]">
              <Link to="/developer" className="rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2 text-white/80 hover:bg-white/5 hover:text-white">Developer API</Link>
              <Link to="/pricing" className="rounded-lg border border-white/15 bg-white/[0.02] px-4 py-2 text-white/80 hover:bg-white/5 hover:text-white">See pricing</Link>
            </div>
          </div>
        </div>
      </main>
      <PlatformFooter />
      {open && <ContactModal purpose="security" onClose={() => setOpen(false)} />}
    </div>
  );
};

export default SecurityPage;
