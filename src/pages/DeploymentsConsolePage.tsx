import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import {
  Lock, Rocket, Boxes, Archive, RotateCcw, ArrowRight, Link2, ShieldCheck, Loader2, Copy, Trash2, Server, Globe, Plus,
} from 'lucide-react';
import { listAllDeployments, archiveDeployment, restoreDeployment, type Deployment } from '@/lib/deployments';
import { listConnections, initConnection, verifyConnection, deleteConnection, attachConnectionZone, type DomainConnection, type ChallengeRecord } from '@/lib/connections';
import { createZone } from '@/lib/dns';

const statusChip = (s: string) => {
  const map: Record<string, string> = {
    live: 'bg-emerald-500/15 text-emerald-300', connected: 'bg-emerald-500/15 text-emerald-300', verified: 'bg-emerald-500/15 text-emerald-300',
    provisioning: 'bg-cyan-500/15 text-cyan-300', draft: 'bg-white/10 text-white/60', pending: 'bg-amber-500/15 text-amber-300',
    archived: 'bg-white/5 text-white/35', failed: 'bg-rose-500/15 text-rose-300',
  };
  return map[s] || 'bg-white/5 text-white/50';
};

const ConnectionsManager: React.FC = () => {
  const [conns, setConns] = useState<DomainConnection[]>([]);
  const [domain, setDomain] = useState('');
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState<{ id: string; record: ChallengeRecord } | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const refresh = useCallback(() => { listConnections().then(setConns).catch(() => {}); }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const init = async () => {
    setBusy(true);
    try {
      const { connection, record } = await initConnection(domain);
      setChallenge({ id: connection.id, record });
      setDomain('');
      refresh();
      toast.success('Challenge issued', { description: 'Add the TXT record, then verify.' });
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };

  const verify = async (id: string) => {
    setVerifying(id);
    try {
      const { verified } = await verifyConnection(id);
      if (verified) { toast.success('Domain verified'); setChallenge((c) => (c?.id === id ? null : c)); }
      else toast.error('TXT record not found yet — DNS may take a few minutes to propagate.');
      refresh();
    } catch (e) { toast.error((e as Error).message); }
    setVerifying(null);
  };

  const provision = async (c: DomainConnection) => {
    try {
      const { zone_id } = await createZone({ name: c.domain });
      await attachConnectionZone(c.id, zone_id);
      toast.success('DNS zone provisioning', { description: 'Point your nameservers, then operate in the DNS console.' });
      refresh();
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this connection?')) return;
    try { await deleteConnection(id); refresh(); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <section>
      <div className="flex items-center gap-2 kicker text-cyan-300/70 mb-5"><Link2 className="w-3.5 h-3.5" /> Connect an existing domain</div>
      <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5 mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={domain} onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && domain.includes('.') && init()}
            placeholder="gov.country" autoCapitalize="off" autoCorrect="off" spellCheck={false}
            aria-label="Domain to connect"
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-mono placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none"
          />
          <button disabled={busy || !domain.includes('.')} onClick={init} aria-busy={busy} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />} Issue challenge
          </button>
        </div>
        {challenge && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-2">Add this DNS TXT record, then verify</div>
            <div className="grid sm:grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm font-mono">
              <span className="text-white/40">Type</span><span className="text-white">TXT</span>
              <span className="text-white/40">Name</span><span className="text-white break-all">{challenge.record.name}</span>
              <span className="text-white/40">Value</span>
              <span className="text-white break-all flex items-center gap-2">
                {challenge.record.value}
                <button aria-label="Copy TXT value" onClick={() => navigator.clipboard?.writeText(challenge.record.value).then(() => toast.success('Copied'))} className="text-white/30 hover:text-cyan-300"><Copy className="w-3.5 h-3.5" /></button>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
        {conns.map((c) => (
          <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
            <Globe className="w-4 h-4 text-cyan-300/60 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-sm text-white font-mono truncate">{c.domain}</div>
              <div className="text-[11px] text-white/40 font-mono">{c.verified ? 'control verified' : 'awaiting TXT verification'}</div>
            </div>
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${statusChip(c.status)}`}>{c.status}</span>
            {!c.verified && (
              <button onClick={() => verify(c.id)} disabled={verifying === c.id} aria-busy={verifying === c.id} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10 shrink-0 disabled:opacity-50">
                {verifying === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Verify
              </button>
            )}
            {c.verified && !c.zone_id && (
              <button onClick={() => provision(c)} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 shrink-0"><Server className="w-3.5 h-3.5" /> Provision DNS</button>
            )}
            {c.zone_id && <Link to="/dns" className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-white/15 text-white/70 hover:text-white shrink-0">Operate <ArrowRight className="w-3 h-3" /></Link>}
            <button aria-label={`Remove connection ${c.domain}`} onClick={() => remove(c.id)} className="text-white/25 hover:text-rose-300 shrink-0"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {conns.length === 0 && <div className="px-5 py-10 text-center text-white/40">No connected domains yet.</div>}
      </div>
    </section>
  );
};

const DeploymentsConsolePage: React.FC = () => {
  useDocumentTitle('Deployments Console', 'Manage sovereign deployments and connected domains.');
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [deps, setDeps] = useState<Deployment[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    if (user) listAllDeployments().then(setDeps).catch(() => {}).finally(() => setLoaded(true));
  }, [user]);
  useEffect(() => { refresh(); }, [refresh]);

  const archive = async (id: string) => { try { await archiveDeployment(id); refresh(); } catch (e) { toast.error((e as Error).message); } };
  const restore = async (id: string) => { try { await restoreDeployment(id); refresh(); } catch (e) { toast.error((e as Error).message); } };

  if (!loading && !user) {
    return (
      <div className="relative min-h-screen text-white">
        <AnimatedBackground intensity="low" /><PlatformNav />
        <main className="pt-40 pb-32 px-4 text-center max-w-lg mx-auto">
          <span className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-cyan-500/10 border border-cyan-400/20"><Lock className="w-6 h-6 text-cyan-300" /></span>
          <h1 className="font-display text-3xl font-bold tracking-cinematic mb-3">Authenticate to view your console</h1>
          <p className="text-white/55 mb-7">Deployments and connected domains are scoped to your account.</p>
          <button onClick={() => setAuthOpen(true)} className="px-6 py-3 rounded-xl text-white font-semibold transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>Sign in</button>
        </main>
        <PlatformFooter />
        {authOpen && <AuthModal initialMode="signin" onClose={() => setAuthOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" /><PlatformNav />
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 kicker text-cyan-300/70 mb-3"><Boxes className="w-3.5 h-3.5" /> Sovereign deployments console</div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.98]">Your deployments.</h1>
              <p className="text-white/55 mt-3 max-w-xl">Resume blueprints, manage connected domains, and route into the operate layer.</p>
            </div>
            <Link to="/deploy" className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> New deployment</Link>
          </div>

          {/* Deployments */}
          <section className="mb-14">
            <div className="flex items-center gap-2 kicker text-white/40 mb-5"><Rocket className="w-3.5 h-3.5" /> Deployments</div>
            <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
              {!loaded && <div className="px-5 py-12 flex justify-center text-white/40"><Loader2 className="w-4 h-4 animate-spin" /></div>}
              {loaded && deps.map((d) => (
                <div key={d.id} className={`px-5 py-4 ${d.status === 'archived' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white truncate">{d.name || d.deployment_type}</div>
                      <div className="text-[11px] font-mono text-white/40 truncate">{d.domain || d.subdomain || d.domain_strategy}</div>
                    </div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${statusChip(d.status)}`}>{d.status}</span>
                    {d.status === 'archived'
                      ? <button onClick={() => restore(d.id)} aria-label="Restore deployment" className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-white/15 text-white/70 hover:text-white shrink-0"><RotateCcw className="w-3.5 h-3.5" /> Restore</button>
                      : <button onClick={() => archive(d.id)} aria-label="Archive deployment" className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-white/15 text-white/50 hover:text-rose-300 shrink-0"><Archive className="w-3.5 h-3.5" /> Archive</button>}
                  </div>
                  {d.lifecycle?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {d.lifecycle.map((stage) => <span key={stage} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/45">{stage}</span>)}
                    </div>
                  )}
                </div>
              ))}
              {loaded && deps.length === 0 && <div className="px-5 py-12 text-center text-white/40">No deployments yet — <Link to="/deploy" className="text-cyan-300 hover:underline">start one</Link>.</div>}
            </div>
          </section>

          <ConnectionsManager />
        </div>
      </main>
      <PlatformFooter />
    </div>
  );
};

export default DeploymentsConsolePage;
