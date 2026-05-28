import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import HudCorners from '@/components/HudCorners';
import AuthModal from '@/components/AuthModal';
import Reveal from '@/components/Reveal';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  Lock, LayoutDashboard, Network, Server, Globe, UserSquare2, Boxes, Activity, ShieldCheck, ArrowRight, Loader2, Plus,
  Compass, Link2, Rocket, Cpu,
} from 'lucide-react';
import { listZones, listDnsJobs, listNameservers } from '@/lib/dns';
import { listDeployments } from '@/lib/deployments';
import { listConnections } from '@/lib/connections';
import { listRegistrants } from '@/lib/registrant';

interface Stats {
  zones: number; nameservers: number;
  records_pending: number; records_failed: number;
  deployments: number;
  connections_total: number; connections_verified: number;
  identities_total: number; identities_verified: number;
  jobs_active: number;
}

const ZERO: Stats = { zones: 0, nameservers: 0, records_pending: 0, records_failed: 0, deployments: 0, connections_total: 0, connections_verified: 0, identities_total: 0, identities_verified: 0, jobs_active: 0 };

const Stat: React.FC<{ label: string; value: number; sub?: string; icon: React.ElementType; tone?: 'cyan' | 'amber' | 'emerald' | 'rose' }> = ({ label, value, sub, icon: Icon, tone = 'cyan' }) => {
  const color = tone === 'amber' ? 'text-amber-300' : tone === 'emerald' ? 'text-emerald-300' : tone === 'rose' ? 'text-rose-300' : 'text-cyan-300';
  return (
    <div className="relative glass-strong rounded-2xl p-5 overflow-hidden">
      <HudCorners color="#00D9FF" className="opacity-25" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">{label}</span>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="font-display text-3xl font-bold text-white tabular-nums">{value}</div>
        {sub && <div className="text-[11px] font-mono text-white/40 mt-1">{sub}</div>}
      </div>
    </div>
  );
};

const QUICK_ACTIONS = [
  { icon: Compass, label: 'Search the namespace', to: '/search', sub: 'Literal search, AI advisor, connect, temporary' },
  { icon: Rocket, label: 'New deployment', to: '/deploy', sub: 'Open the deployment orchestrator' },
  { icon: Server, label: 'DNS console', to: '/dns', sub: 'Zones · nameservers · records · queue' },
  { icon: UserSquare2, label: 'Registrant identities', to: '/registrants', sub: 'Verified WHOIS contacts' },
  { icon: Link2, label: 'Connections & deployments', to: '/deployments', sub: 'Track active sovereign deployments' },
  { icon: Cpu, label: 'Developer portal', to: '/developer', sub: 'API surface, auth model, samples' },
];

const RegistrarCommandCenter: React.FC = () => {
  useDocumentTitle('Command Center', 'Sovereign domain operations — zones, identities, deployments, connections, queue.');
  const { user, loading } = useAuth();
  const [auth, setAuth] = useState<null | 'signin' | 'signup'>(null);
  const [stats, setStats] = useState<Stats>(ZERO);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [zones, jobs, ns, deps, conns, regs] = await Promise.all([
        listZones().catch(() => []),
        listDnsJobs().catch(() => []),
        listNameservers().catch(() => []),
        listDeployments().catch(() => []),
        listConnections().catch(() => []),
        listRegistrants().catch(() => []),
      ]);
      setStats({
        zones: zones.length, nameservers: ns.length,
        records_pending: jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length,
        records_failed: jobs.filter((j) => j.status === 'failed').length,
        deployments: deps.length,
        connections_total: conns.length,
        connections_verified: conns.filter((c) => c.verified).length,
        identities_total: regs.length,
        identities_verified: regs.filter((r) => !!r.op_handle).length,
        jobs_active: jobs.filter((j) => j.status === 'queued' || j.status === 'processing').length,
      });
    } finally { setReady(true); }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!loading && !user) {
    return (
      <div className="relative min-h-screen text-white">
        <AnimatedBackground intensity="low" /><PlatformNav />
        <main className="pt-40 pb-32 px-4 text-center max-w-lg mx-auto">
          <span className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-cyan-500/10 border border-cyan-400/20"><Lock className="w-6 h-6 text-cyan-300" /></span>
          <h1 className="font-display text-3xl font-bold tracking-cinematic mb-3">Sovereign access required</h1>
          <p className="text-white/55 mb-7">The Command Center is reserved for subscribed institutional operators.</p>
          <button onClick={() => setAuth('signin')} className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>Sign in</button>
        </main>
        <PlatformFooter />
        {auth && <AuthModal initialMode={auth} onClose={() => setAuth(null)} />}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* ── Hero ── */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/[0.05] text-cyan-300/80 kicker mb-5" style={{ letterSpacing: '0.28em' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-node" /> Sovereign command surface
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.96] mb-3">Command Center.</h1>
            <p className="text-white/55 max-w-2xl">Unified operations across the sovereign domain layer — zones, nameservers, identities, deployments, connections and the async pipeline. Every operation queued, audited and retried.</p>
          </div>

          {/* ── Stat grid ── */}
          {!ready ? (
            <div className="flex items-center justify-center py-16 text-white/40"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <Reveal>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
                <Stat label="Authoritative zones" value={stats.zones} icon={Globe} />
                <Stat label="Sovereign nameservers" value={stats.nameservers} icon={Network} />
                <Stat label="Registrant identities" value={stats.identities_total} sub={`${stats.identities_verified} verified`} icon={UserSquare2} tone="emerald" />
                <Stat label="Deployments" value={stats.deployments} icon={Boxes} tone="cyan" />
                <Stat label="Connected domains" value={stats.connections_total} sub={`${stats.connections_verified} verified`} icon={Link2} tone="emerald" />
                <Stat label="Operations in-flight" value={stats.jobs_active} icon={Activity} tone={stats.jobs_active ? 'amber' : 'cyan'} />
                <Stat label="Failed operations" value={stats.records_failed} icon={ShieldCheck} tone={stats.records_failed ? 'rose' : 'emerald'} />
                <Stat label="Operational regions" value={23} sub="sovereign edge mesh" icon={LayoutDashboard} />
              </div>
            </Reveal>
          )}

          {/* ── Quick actions ── */}
          <Reveal>
            <div className="mb-10">
              <div className="kicker text-white/40 mb-4" style={{ letterSpacing: '0.22em' }}>Quick actions</div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {QUICK_ACTIONS.map((a) => (
                  <Link key={a.label} to={a.to} className="group relative rounded-2xl border border-white/8 bg-white/[0.015] p-5 transition-all duration-500 ease-cinematic hover:-translate-y-0.5 hover:border-cyan-400/30">
                    <a.icon className="w-5 h-5 text-cyan-300/80 mb-3" />
                    <div className="font-display font-semibold text-white flex items-center gap-2">{a.label}<ArrowRight className="w-3.5 h-3.5 text-cyan-300/50 group-hover:translate-x-0.5 transition-transform" /></div>
                    <div className="text-xs text-white/45 mt-1 leading-relaxed">{a.sub}</div>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          {/* ── Pipeline health ── */}
          <Reveal>
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-5">
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-cyan-300/80" />
                <div className="flex-1 text-sm text-white/65">
                  Async pipeline: <span className="text-white font-semibold">{stats.jobs_active}</span> in flight · <span className={stats.records_failed ? 'text-rose-300' : 'text-emerald-300'}>{stats.records_failed}</span> failed · queued · audited · rate-limited with exponential backoff.
                </div>
                <Link to="/dns#jobs" className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300">Open queue <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </Reveal>
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default RegistrarCommandCenter;
