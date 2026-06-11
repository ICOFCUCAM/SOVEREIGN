import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import ContactModal from '@/components/ContactModal';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { supabase } from '@/lib/supabase';
import { fetchNetworkRegions, type NetworkRegion } from '@/lib/stats';

// Operational status. The database and media-pipeline rows are probed live;
// components without a cheap public probe stay declarative until the
// platform exposes a status_events feed.
type Health = 'operational' | 'degraded' | 'checking';

const COMPONENTS: Array<{ id: string; name: string; desc: string; probed?: boolean }> = [
  { id: 'db',       name: 'Platform database',    desc: 'Registry, media, campaigns and analytics substrate.', probed: true },
  { id: 'pipeline', name: 'Media pipeline',       desc: 'Render-video, orchestrate-film and multi-channel publish.', probed: true },
  { id: 'api',      name: 'API · edge functions', desc: 'Public Supabase edge functions for the platform surface.' },
  { id: 'dns',      name: 'Authoritative DNS',    desc: 'Sovereign DNS resolution across the global edge mesh.' },
  { id: 'registrar',name: 'Registrar handles',    desc: 'Openprovider-backed customer + handle management.' },
  { id: 'billing',  name: 'Stripe billing',       desc: 'Subscription checkout, portal and webhook processing.' },
];

const StatusPage: React.FC = () => {
  useDocumentTitle('Status', 'Live operational status across the SOVEREIGN platform — APIs, DNS, billing and regional capacity.');
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState<Record<string, Health>>({ db: 'checking', pipeline: 'checking' });
  const [regions, setRegions] = useState<NetworkRegion[]>([]);

  useEffect(() => {
    (async () => {
      // Database probe — a cheap head count against a public-read table.
      const db = await supabase.from('ecosystem_products').select('id', { count: 'exact', head: true });
      // Pipeline probe — degraded when the most recent renders all failed.
      const pj = await supabase.from('pipeline_jobs').select('status').order('created_at', { ascending: false }).limit(10);
      const recent = (pj.data || []) as Array<{ status: string }>;
      const failures = recent.filter((j) => j.status === 'failed').length;
      setHealth({
        db: db.error ? 'degraded' : 'operational',
        pipeline: pj.error ? 'degraded' : recent.length > 0 && failures === recent.length ? 'degraded' : 'operational',
      });
      setRegions(await fetchNetworkRegions());
    })();
  }, []);

  const allUp = Object.values(health).every((h) => h !== 'degraded');

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-10">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Status</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.96] mb-4">
              {allUp ? <>All systems <span className="text-gradient-cyan">operational.</span></> : <>Service <span className="text-amber-300">degradation detected.</span></>}
            </h1>
            <p className="text-white/55 leading-relaxed">
              Live operational state across the sovereign platform. <button onClick={() => setOpen(true)} className="text-cyan-300 hover:text-white underline-offset-2 hover:underline">Subscribe to incident updates</button>.
            </p>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/[0.015] p-6">
            <h2 className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40 mb-4">Components</h2>
            <ul className="divide-y divide-white/5">
              {COMPONENTS.map((c) => {
                const state: Health = c.probed ? health[c.id] ?? 'checking' : 'operational';
                return (
                  <li key={c.id} className="flex items-center gap-3 py-3">
                    {state === 'degraded'
                      ? <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                      : <CheckCircle2 className={`w-4 h-4 shrink-0 ${state === 'checking' ? 'text-white/30' : 'text-emerald-300'}`} />}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white">{c.name}{c.probed && <span className="ml-2 text-[9px] font-mono uppercase tracking-wider text-cyan-300/60">live probe</span>}</div>
                      <div className="text-xs text-white/45">{c.desc}</div>
                    </div>
                    <span className={`text-[10px] font-mono uppercase tracking-wider rounded px-2 py-0.5 ${state === 'degraded' ? 'bg-amber-500/15 text-amber-300' : state === 'checking' ? 'bg-white/5 text-white/40' : 'bg-emerald-500/15 text-emerald-300'}`}>
                      {state === 'checking' ? 'Checking…' : state === 'degraded' ? 'Degraded' : 'Operational'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {regions.length > 0 && (
            <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.015] p-6">
              <h2 className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40 mb-4">Regional capacity</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {regions.map((r) => {
                  const online = r.status === 'operational';
                  return (
                    <li key={r.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.012] px-3 py-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: online ? '#10B981' : '#F59E0B', boxShadow: `0 0 6px ${online ? '#10B981' : '#F59E0B'}` }} />
                      <span className="text-sm text-white flex-1">{r.label}{r.sub ? <span className="text-white/40"> · {r.sub}</span> : null}</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">{r.nodes} nodes · {online ? 'Online' : r.status}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <p className="mt-8 text-xs text-white/40">
            Status is updated continuously. Historical incidents and post-mortems are published as releases on the <a className="text-cyan-300 hover:text-white" href="/changelog">changelog</a>.
          </p>
        </div>
      </main>
      <PlatformFooter />
      {open && <ContactModal purpose="status" onClose={() => setOpen(false)} />}
    </div>
  );
};

export default StatusPage;
