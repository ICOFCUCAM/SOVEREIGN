import React, { useEffect, useState, useCallback } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import AnimatedBackground from '@/components/AnimatedBackground';
import AuthModal from '@/components/AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toast } from 'sonner';
import { Lock, UserSquare2, Plus, Trash2, ShieldCheck, BadgeCheck, Loader2, X } from 'lucide-react';
import {
  listRegistrants, createRegistrant, deleteRegistrant, verifyRegistrantHandle,
  type RegistrantProfile, type RegistrantInput,
} from '@/lib/registrant';

const EMPTY: RegistrantInput = {
  label: '', company_name: '', first_name: '', last_name: '', email: '',
  phone_country_code: '+1', phone_area_code: '', phone_subscriber: '',
  street: '', city: '', state: '', zipcode: '', country: 'US',
};

const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none';
const Label: React.FC<{ t: string; children: React.ReactNode }> = ({ t, children }) => (
  <label className="block"><span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 mb-1.5 block">{t}</span>{children}</label>
);

const RegistrantsPage: React.FC = () => {
  useDocumentTitle('Registrant Identities', 'Sovereign registrant identities — reusable WHOIS profiles for domain registration.');
  const { user, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [rows, setRows] = useState<RegistrantProfile[]>([]);
  const [form, setForm] = useState<RegistrantInput>(EMPTY);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => { if (user) listRegistrants().then(setRows).catch(() => {}).finally(() => setLoaded(true)); }, [user]);
  useEffect(() => { refresh(); }, [refresh]);

  const set = (k: keyof RegistrantInput, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
  const valid = !!(form.first_name && form.last_name && emailOk && form.phone_country_code && form.phone_subscriber && form.street && form.city && form.zipcode && form.country.length === 2);

  const save = async () => {
    if (!valid) { toast.error('Complete the required fields.'); return; }
    setBusy(true);
    try {
      const norm = (s: string | null | undefined) => (s && s.trim() ? s.trim() : null);
      await createRegistrant({
        ...form,
        label: norm(form.label),
        company_name: norm(form.company_name),
        state: norm(form.state),
        phone_area_code: norm(form.phone_area_code),
      });
      toast.success('Registrant identity saved');
      setForm(EMPTY); setOpen(false); refresh();
    } catch (e) { toast.error((e as Error).message); }
    setBusy(false);
  };

  const verify = async (id: string) => {
    setVerifying(id);
    try {
      const handle = await verifyRegistrantHandle(id);
      toast.success('Verified with registry', { description: `Customer handle ${handle}` });
      refresh();
    } catch (e) { toast.error((e as Error).message); }
    setVerifying(null);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this registrant identity?')) return;
    try { await deleteRegistrant(id); refresh(); } catch (e) { toast.error((e as Error).message); }
  };

  if (!loading && !user) {
    return (
      <div className="relative min-h-screen text-white">
        <AnimatedBackground intensity="low" /><PlatformNav />
        <main className="pt-40 pb-32 px-4 text-center max-w-lg mx-auto">
          <span className="inline-flex w-14 h-14 rounded-2xl items-center justify-center mb-6 bg-cyan-500/10 border border-cyan-400/20"><Lock className="w-6 h-6 text-cyan-300" /></span>
          <h1 className="font-display text-3xl font-bold tracking-cinematic mb-3">Authenticate to manage identities</h1>
          <p className="text-white/55 mb-7">Registrant identities are scoped to your account and used to register domains.</p>
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
              <div className="flex items-center gap-2 kicker text-cyan-300/70 mb-3"><UserSquare2 className="w-3.5 h-3.5" /> Sovereign registrant identities</div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-cinematic leading-[0.98]">Registrant identities.</h1>
              <p className="text-white/55 mt-3 max-w-xl">Reusable, verified WHOIS identities used to register domains. Verify once with the registry to mint a customer handle.</p>
            </div>
            {!open && <button onClick={() => setOpen(true)} className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> New identity</button>}
          </div>

          {open && (
            <div className="relative rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.04] p-6 mb-8">
              <button aria-label="Close form" onClick={() => setOpen(false)} className="absolute top-4 right-4 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
              <div className="kicker text-cyan-300/80 mb-5">New registrant identity</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Label t="Label (optional)"><input value={form.label ?? ''} onChange={(e) => set('label', e.target.value)} placeholder="HQ contact" className={inputCls} /></Label>
                <Label t="Company (optional)"><input value={form.company_name ?? ''} onChange={(e) => set('company_name', e.target.value)} placeholder="Sovereign Holdings" className={inputCls} /></Label>
                <Label t="First name *"><input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} className={inputCls} /></Label>
                <Label t="Last name *"><input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className={inputCls} /></Label>
                <Label t="Email *"><input value={form.email} onChange={(e) => set('email', e.target.value)} type="email" className={inputCls} /></Label>
                <div className="grid grid-cols-3 gap-2">
                  <Label t="Ctry code *"><input value={form.phone_country_code} onChange={(e) => set('phone_country_code', e.target.value)} placeholder="+1" className={inputCls} /></Label>
                  <Label t="Area *"><input inputMode="numeric" value={form.phone_area_code ?? ''} onChange={(e) => set('phone_area_code', e.target.value)} placeholder="212" className={inputCls} /></Label>
                  <Label t="Number *"><input inputMode="numeric" value={form.phone_subscriber} onChange={(e) => set('phone_subscriber', e.target.value)} placeholder="7364000" className={inputCls} /></Label>
                </div>
                <Label t="Street *"><input value={form.street} onChange={(e) => set('street', e.target.value)} placeholder="350 Fifth Avenue" className={inputCls} /></Label>
                <Label t="City *"><input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} /></Label>
                <Label t="State / region"><input value={form.state ?? ''} onChange={(e) => set('state', e.target.value)} placeholder="NY" className={inputCls} /></Label>
                <Label t="Postal code *"><input value={form.zipcode} onChange={(e) => set('zipcode', e.target.value)} className={inputCls} /></Label>
                <Label t="Country (ISO-2) *"><input value={form.country} onChange={(e) => set('country', e.target.value.toUpperCase().slice(0, 2))} placeholder="US" className={inputCls} /></Label>
              </div>
              <button disabled={busy || !valid} onClick={save} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-sm font-semibold disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save identity
              </button>
            </div>
          )}

          <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
            {rows.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                <UserSquare2 className="w-5 h-5 text-cyan-300/60 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{r.company_name || `${r.first_name} ${r.last_name}`} {r.label && <span className="text-white/35">· {r.label}</span>}</div>
                  <div className="text-[11px] font-mono text-white/40 truncate">{r.email} · {r.city}, {r.country}</div>
                </div>
                {r.op_handle ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 shrink-0"><BadgeCheck className="w-3.5 h-3.5" /> {r.op_handle}</span>
                ) : (
                  <button onClick={() => verify(r.id)} disabled={verifying === r.id} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/10 shrink-0 disabled:opacity-50">
                    {verifying === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />} Verify with registry
                  </button>
                )}
                <button aria-label={`Delete identity ${r.company_name || r.first_name + ' ' + r.last_name}`} onClick={() => remove(r.id)} className="text-white/30 hover:text-rose-300 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {!loaded && <div className="px-5 py-14 flex items-center justify-center text-white/40"><Loader2 className="w-4 h-4 animate-spin" /></div>}
            {loaded && rows.length === 0 && <div className="px-5 py-14 text-center text-white/40">No registrant identities yet.</div>}
          </div>
        </div>
      </main>
      <PlatformFooter />
      {authOpen && <AuthModal initialMode="signin" onClose={() => setAuthOpen(false)} />}
    </div>
  );
};

export default RegistrantsPage;
