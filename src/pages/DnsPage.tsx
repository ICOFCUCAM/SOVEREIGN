import React, { useEffect, useState, useCallback } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import PageSubNav from '@/components/PageSubNav';
import AuthModal from '@/components/AuthModal';
import HudCorners from '@/components/HudCorners';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { Server, Globe, ListTree, Activity, Plus, Trash2, RefreshCw, ShieldCheck, Lock } from 'lucide-react';
import {
  listNameservers, createNameserver, updateNameservers,
  listZones, createZone, deleteZone, listRecords, modifyRecords, listDnsJobs,
  type Nameserver, type DnsZone, type DnsRecordRow, type DnsJob,
} from '@/lib/dns';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA'];
const TTLS = [900, 3600, 10800, 21600, 43200, 86400];

const statusChip = (s: string) => {
  const map: Record<string, string> = { active: 'bg-emerald-500/15 text-emerald-300', done: 'bg-emerald-500/15 text-emerald-300', pending: 'bg-amber-500/15 text-amber-300', queued: 'bg-amber-500/15 text-amber-300', processing: 'bg-cyan-500/15 text-cyan-300', failed: 'bg-rose-500/15 text-rose-300', deleting: 'bg-rose-500/10 text-rose-300/80', deleted: 'bg-white/5 text-white/35' };
  return map[s] || 'bg-white/5 text-white/50';
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block"><span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 mb-1.5 block">{label}</span>{children}</label>
);
const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none';

const SectionHead: React.FC<{ icon: React.ElementType; kicker: string; title: string; right?: React.ReactNode }> = ({ icon: Icon, kicker, title, right }) => (
  <div className="flex items-end justify-between gap-4 mb-6">
    <div>
      <div className="flex items-center gap-2 kicker text-cyan-300/70 mb-2"><Icon className="w-3.5 h-3.5" /> {kicker}</div>
      <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-cinematic text-white">{title}</h2>
    </div>
    {right}
  </div>
);

const DnsPage: React.FC = () => {
  useDocumentTitle('DNS', 'Sovereign DNS infrastructure — nameservers, zones and records on resilient anycast infrastructure.');
  const { user, loading: authLoading } = useAuth();
  const [authModal, setAuthModal] = useState<null | 'signin' | 'signup'>(null);

  const [nameservers, setNameservers] = useState<Nameserver[]>([]);
  const [zones, setZones] = useState<DnsZone[]>([]);
  const [jobs, setJobs] = useState<DnsJob[]>([]);
  const [selectedZone, setSelectedZone] = useState<DnsZone | null>(null);
  const [records, setRecords] = useState<DnsRecordRow[]>([]);
  const [busy, setBusy] = useState(false);

  const [ns, setNs] = useState({ name: '', ip: '', ip6: '' });
  const [zone, setZone] = useState({ name: '', type: 'master' });
  const [rec, setRec] = useState({ type: 'A', name: '', value: '', ttl: 3600, prio: '' });

  const refresh = useCallback(async () => {
    if (!user) return;
    const [n, z, j] = await Promise.all([listNameservers(), listZones(), listDnsJobs()]);
    setNameservers(n); setZones(z); setJobs(j);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { if (selectedZone) listRecords(selectedZone.id).then(setRecords); else setRecords([]); }, [selectedZone]);

  // Light auto-poll while jobs are in flight.
  useEffect(() => {
    if (!jobs.some((j) => j.status === 'queued' || j.status === 'processing')) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [jobs, refresh]);

  const guard = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); await refresh(); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };

  if (!authLoading && !user) {
    return (
      <div className="relative min-h-screen text-white">
        <AnimatedBackground intensity="low" />
        <PlatformNav />
        <main className="pt-40 pb-32 px-4 text-center max-w-lg mx-auto">
          <span className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-cyan-500/10 border border-cyan-400/20"><Lock className="w-6 h-6 text-cyan-300" /></span>
          <h1 className="font-display text-3xl font-bold tracking-cinematic mb-3">Authenticate to manage DNS</h1>
          <p className="text-white/55 mb-7">Sovereign DNS infrastructure is scoped to your account. Sign in to provision nameservers, zones and records.</p>
          <button onClick={() => setAuthModal('signin')} className="px-6 py-3 rounded-xl text-white font-semibold ease-cinematic transition-all duration-500 hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>Sign in</button>
        </main>
        <PlatformFooter />
        {authModal && <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-white">
      <AnimatedBackground intensity="low" />
      <PlatformNav />
      <PageSubNav label="DNS" items={[{ id: 'nameservers', label: 'Nameservers' }, { id: 'zones', label: 'Zones' }, { id: 'records', label: 'Records' }, { id: 'jobs', label: 'Queue' }]} />

      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-14 max-w-2xl">
            <div className="kicker text-cyan-300/70 mb-4" style={{ letterSpacing: '0.3em' }}>Sovereign DNS infrastructure</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic text-balance leading-[0.98] mb-4">Authoritative DNS, orchestrated.</h1>
            <p className="text-white/55 text-lg leading-relaxed">Provision nameservers, author zones and modify records on resilient anycast infrastructure. Every mutation is queued, audited, rate-limited and retried.</p>
          </div>

          {/* ── Nameservers ── */}
          <section id="nameservers" className="scroll-mt-28 mb-16">
            <SectionHead icon={Server} kicker="Host objects" title="Nameservers"
              right={<button onClick={refresh} className="text-[11px] font-mono uppercase tracking-wider glass px-3 py-1.5 rounded text-white/60 hover:text-white inline-flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Refresh</button>} />
            <div className="grid lg:grid-cols-[1fr_340px] gap-6">
              <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                {nameservers.map((n) => (
                  <div key={n.id} className="flex items-center gap-4 px-5 py-3.5">
                    <Server className="w-4 h-4 text-cyan-300/60 shrink-0" />
                    <div className="min-w-0 flex-1"><div className="text-sm text-white font-mono truncate">{n.name}</div><div className="text-[11px] text-white/40 font-mono">{n.ip || '—'}{n.ip6 ? ` · ${n.ip6}` : ''}</div></div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${statusChip(n.status)}`}>{n.status}</span>
                  </div>
                ))}
                {nameservers.length === 0 && <div className="px-5 py-12 text-center text-white/40">No nameservers yet.</div>}
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5 space-y-3 h-fit">
                <div className="kicker text-cyan-300/80 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Create nameserver</div>
                <Field label="Hostname"><input value={ns.name} onChange={(e) => setNs({ ...ns, name: e.target.value })} placeholder="ns1.example.com" className={inputCls} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="IPv4"><input value={ns.ip} onChange={(e) => setNs({ ...ns, ip: e.target.value })} placeholder="1.2.3.4" className={inputCls} /></Field>
                  <Field label="IPv6"><input value={ns.ip6} onChange={(e) => setNs({ ...ns, ip6: e.target.value })} placeholder="optional" className={inputCls} /></Field>
                </div>
                <button disabled={busy || !ns.name} onClick={() => guard(() => createNameserver({ name: ns.name, ip: ns.ip || undefined, ip6: ns.ip6 || undefined }).then(() => setNs({ name: '', ip: '', ip6: '' })), 'Nameserver queued')}
                  className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50">Create nameserver</button>
              </div>
            </div>
          </section>

          {/* ── Zones ── */}
          <section id="zones" className="scroll-mt-28 mb-16">
            <SectionHead icon={Globe} kicker="Authoritative zones" title="DNS zones" />
            <div className="grid lg:grid-cols-[1fr_340px] gap-6">
              <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                {zones.map((z) => (
                  <div key={z.id} className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${selectedZone?.id === z.id ? 'bg-cyan-500/[0.06]' : 'hover:bg-white/[0.02]'}`}>
                    <button onClick={() => { setSelectedZone(z); document.getElementById('records')?.scrollIntoView({ behavior: 'smooth' }); }} className="flex items-center gap-4 min-w-0 flex-1 text-left">
                      <Globe className="w-4 h-4 text-cyan-300/60 shrink-0" />
                      <span className="min-w-0 flex-1"><span className="block text-sm text-white font-mono truncate">{z.name}</span><span className="block text-[11px] text-white/40 font-mono uppercase">{z.type}{z.dnssec ? ' · dnssec' : ''}</span></span>
                    </button>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${statusChip(z.status)}`}>{z.status}</span>
                    {z.status !== 'deleted' && <button aria-label={`Delete zone ${z.name}`} onClick={() => { if (confirm(`Delete zone ${z.name}? This is irreversible.`)) guard(() => deleteZone(z.id), 'Zone deletion queued'); }} className="text-white/30 hover:text-rose-300 shrink-0"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                ))}
                {zones.length === 0 && <div className="px-5 py-12 text-center text-white/40">No zones yet — create your first.</div>}
              </div>
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5 space-y-3 h-fit">
                <div className="kicker text-cyan-300/80 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Create zone</div>
                <Field label="Domain"><input value={zone.name} onChange={(e) => setZone({ ...zone, name: e.target.value })} placeholder="example.com" className={inputCls} /></Field>
                <Field label="Type">
                  <select value={zone.type} onChange={(e) => setZone({ ...zone, type: e.target.value })} className={inputCls}>
                    <option value="master">master</option><option value="slave">slave</option>
                  </select>
                </Field>
                <button disabled={busy || !zone.name} onClick={() => guard(() => createZone({ name: zone.name, type: zone.type }).then(() => setZone({ name: '', type: 'master' })), 'Zone creation queued')}
                  className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50">Create zone</button>
              </div>
            </div>
          </section>

          {/* ── Records ── */}
          <section id="records" className="scroll-mt-28 mb-16">
            <SectionHead icon={ListTree} kicker="Resource records" title={selectedZone ? `Records · ${selectedZone.name}` : 'Records'} />
            {!selectedZone ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.012] px-5 py-12 text-center text-white/40">Select a zone above to manage its records.</div>
            ) : (
              <div className="grid lg:grid-cols-[1fr_340px] gap-6">
                <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-cyan-300/70 w-14 text-center shrink-0">{r.type}</span>
                      <div className="min-w-0 flex-1"><div className="text-sm text-white font-mono truncate">{r.name || '@'}<span className="text-white/30"> → </span>{r.value}</div><div className="text-[10px] text-white/35 font-mono">ttl {r.ttl}{r.prio != null ? ` · prio ${r.prio}` : ''}</div></div>
                      <button aria-label={`Remove ${r.type} record ${r.name || '@'}`} onClick={() => guard(() => modifyRecords({ zone_id: selectedZone.id, remove: [{ type: r.type, name: r.name, value: r.value, ttl: r.ttl, prio: r.prio ?? undefined }] }), 'Record removal queued')} className="text-white/30 hover:text-rose-300 shrink-0"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {records.length === 0 && <div className="px-5 py-12 text-center text-white/40">No records — add one.</div>}
                </div>
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5 space-y-3 h-fit">
                  <div className="kicker text-cyan-300/80 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add record</div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type"><select value={rec.type} onChange={(e) => setRec({ ...rec, type: e.target.value })} className={inputCls}>{RECORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
                    <Field label="TTL"><select value={rec.ttl} onChange={(e) => setRec({ ...rec, ttl: Number(e.target.value) })} className={inputCls}>{TTLS.map((t) => <option key={t} value={t}>{t}</option>)}</select></Field>
                  </div>
                  <Field label="Name"><input value={rec.name} onChange={(e) => setRec({ ...rec, name: e.target.value })} placeholder="www  ·  @ for apex" className={inputCls} /></Field>
                  <Field label="Value"><input value={rec.value} onChange={(e) => setRec({ ...rec, value: e.target.value })} placeholder="1.2.3.4" className={inputCls} /></Field>
                  {rec.type === 'MX' && <Field label="Priority"><input value={rec.prio} onChange={(e) => setRec({ ...rec, prio: e.target.value })} placeholder="10" className={inputCls} /></Field>}
                  <button disabled={busy || !rec.value} onClick={() => guard(() => modifyRecords({ zone_id: selectedZone.id, add: [{ type: rec.type, name: rec.name === '@' ? '' : rec.name, value: rec.value, ttl: rec.ttl, prio: rec.prio ? Number(rec.prio) : undefined }] }).then(() => setRec({ type: 'A', name: '', value: '', ttl: 3600, prio: '' })), 'Record addition queued')}
                    className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50">Add record</button>
                </div>
              </div>
            )}
          </section>

          {/* ── Queue ── */}
          <section id="jobs" className="scroll-mt-28">
            <SectionHead icon={Activity} kicker="Async operations" title="Operation queue" />
            <div className="relative glass-strong rounded-2xl overflow-hidden">
              <HudCorners color="#00D9FF" className="opacity-20" />
              <div className="divide-y divide-white/5">
                {jobs.map((j) => (
                  <div key={j.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/50 w-36 shrink-0">{j.action}</span>
                    <div className="min-w-0 flex-1">{j.error && <div className="text-[11px] text-rose-300/70 truncate">{j.error}</div>}{j.attempts > 0 && !j.error && <div className="text-[10px] text-white/30">attempt {j.attempts}</div>}</div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${statusChip(j.status)}`}>{j.status}</span>
                    <span className="text-white/30 text-xs font-mono whitespace-nowrap shrink-0">{new Date(j.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
                {jobs.length === 0 && <div className="px-5 py-12 text-center text-white/40">No operations yet.</div>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 text-[11px] font-mono uppercase tracking-wider text-white/35"><ShieldCheck className="w-3.5 h-3.5 text-cyan-400/60" /> Queued · audited · rate-limited · retried with backoff</div>
          </section>
        </div>
      </main>
      <PlatformFooter />
      {authModal && <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />}
    </div>
  );
};

export default DnsPage;
