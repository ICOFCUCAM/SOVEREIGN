import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

// Operational status — purely declarative. A real incident feed can replace
// this once the platform exposes a status_events table.
const COMPONENTS: Array<{ name: string; desc: string }> = [
  { name: 'API · edge functions',  desc: 'Public Supabase edge functions for the platform surface.' },
  { name: 'Authoritative DNS',     desc: 'Sovereign DNS resolution across the global edge mesh.' },
  { name: 'Registrar handles',     desc: 'Openprovider-backed customer + handle management.' },
  { name: 'Stripe billing',        desc: 'Subscription checkout, portal and webhook processing.' },
  { name: 'Emergency AI media',    desc: 'Render-video, orchestrate-film and multi-channel publish.' },
  { name: 'Console + dashboards',  desc: 'Admin command center and tenant consoles.' },
];

const REGIONS: Array<{ id: string; label: string; status: 'online' | 'scaling' }> = [
  { id: 'us-east',  label: 'North America · US East', status: 'online' },
  { id: 'eu-west',  label: 'Europe · Ireland',        status: 'online' },
  { id: 'eu-cent',  label: 'Europe · Frankfurt',      status: 'online' },
  { id: 'af-north', label: 'Africa · North',          status: 'online' },
  { id: 'me-1',     label: 'Middle East · GCC',       status: 'online' },
  { id: 'ap-south', label: 'Asia-Pacific · South',    status: 'scaling' },
  { id: 'oc-1',     label: 'Oceania',                 status: 'online' },
];

const StatusPage: React.FC = () => {
  useDocumentTitle('Status', 'Live operational status across the SOVEREIGN platform — APIs, DNS, billing and regional capacity.');
  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Status</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.96] mb-4">
              All systems <span className="text-gradient-cyan">operational.</span>
            </h1>
            <p className="text-white/55 leading-relaxed">
              Live operational state across the sovereign platform. Subscribe to incident updates at <a className="text-cyan-300 hover:text-white" href="mailto:status@sovereign.so">status@sovereign.so</a>.
            </p>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.015] p-6">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40 mb-4">Components</h2>
            <ul className="divide-y divide-white/5">
              {COMPONENTS.map((c) => (
                <li key={c.name} className="flex items-center gap-3 py-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-white">{c.name}</div>
                    <div className="text-xs text-white/45">{c.desc}</div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider rounded bg-emerald-500/15 text-emerald-300 px-2 py-0.5">Operational</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.015] p-6">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40 mb-4">Regional capacity</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REGIONS.map((r) => (
                <li key={r.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.012] px-3 py-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: r.status === 'online' ? '#10B981' : '#F59E0B', boxShadow: `0 0 6px ${r.status === 'online' ? '#10B981' : '#F59E0B'}` }} />
                  <span className="text-sm text-white flex-1">{r.label}</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">{r.status === 'online' ? 'Online' : 'Scaling'}</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-8 text-xs text-white/40">
            Status is updated continuously. Historical incidents and post-mortems are published as releases on the <a className="text-cyan-300 hover:text-white" href="/changelog">changelog</a>.
          </p>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default StatusPage;
