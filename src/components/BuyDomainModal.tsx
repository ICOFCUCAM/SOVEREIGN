import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { X, Loader2, CreditCard, FileText, BadgeCheck, ArrowRight, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { listRegistrants, type RegistrantProfile } from '@/lib/registrant';
import { startCheckout, type PaymentMethod } from '@/lib/orders';
import { formatPrice } from '@/lib/registrar';

interface Props {
  domain: string;
  price: number | null;
  currency: string | null;
  onClose: () => void;
  onAuth: () => void;
}

const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none';

export const BuyDomainModal: React.FC<Props> = ({ domain, price, currency, onClose, onAuth }) => {
  const { user } = useAuth();
  const [identities, setIdentities] = useState<RegistrantProfile[]>([]);
  const [registrantId, setRegistrantId] = useState<string>('');
  const [years, setYears] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>('stripe');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    listRegistrants().then((rs) => {
      setIdentities(rs);
      const verified = rs.find((r) => r.op_handle);
      if (verified) setRegistrantId(verified.id);
      else if (rs[0]) setRegistrantId(rs[0].id);
    }).catch(() => {});
  }, [user]);

  const selected = identities.find((r) => r.id === registrantId);
  const total = (price ?? 0) * years;

  const submit = async () => {
    if (!user) { onAuth(); return; }
    if (!registrantId) { toast.error('Pick a registrant identity.'); return; }
    if (!selected?.op_handle && method === 'stripe') { toast.error('Verify this registrant identity with the registry before card checkout.'); return; }
    setBusy(true);
    try {
      const { order, checkout_url } = await startCheckout({
        domain, years, registrant_profile_id: registrantId,
        payment_method: method, company_name: company || undefined, notes: notes || undefined,
      });
      if (method === 'stripe' && checkout_url) { window.location.href = checkout_url; return; }
      toast.success('Registration request received', { description: `Order #${order.id.slice(0, 8)} is awaiting institutional review.` });
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
    setBusy(false);
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0d18] p-7 text-white">
          <button aria-label="Close" onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
          <div className="kicker text-cyan-300/70 mb-3">Authenticate</div>
          <h2 className="font-display text-2xl font-bold mb-2">Sign in to acquire {domain}</h2>
          <p className="text-sm text-white/55 mb-5">Registration is owner-scoped — sign in to bind the domain to your account.</p>
          <button onClick={onAuth} className="px-5 py-2.5 rounded-lg text-white font-semibold transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 10px 30px -12px rgba(0,194,255,0.5)' }}>Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-10 overflow-y-auto" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0d18] p-7 text-white">
        <button aria-label="Close" onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white"><X className="w-4 h-4" /></button>

        <div className="kicker text-cyan-300/70 mb-2 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Acquire</div>
        <h2 className="font-display text-2xl font-bold tracking-cinematic">{domain}</h2>
        <p className="text-sm text-white/55 mt-1">Choose how the registration is settled. All paths route through the sovereign pipeline.</p>

        {/* Payment method toggle */}
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={() => setMethod('stripe')} aria-pressed={method === 'stripe'}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${method === 'stripe' ? 'border-cyan-400/50 bg-cyan-400/[0.06]' : 'border-white/8 bg-white/[0.015] hover:border-white/20'}`}>
            <CreditCard className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">Card · Stripe</div>
              <div className="text-[11px] text-white/45 mt-1 leading-snug">Auth-hold now, captured on register success.</div>
            </div>
          </button>
          <button onClick={() => setMethod('invoice')} aria-pressed={method === 'invoice'}
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${method === 'invoice' ? 'border-cyan-400/50 bg-cyan-400/[0.06]' : 'border-white/8 bg-white/[0.015] hover:border-white/20'}`}>
            <FileText className="w-4 h-4 text-cyan-300 mt-0.5 shrink-0" />
            <div>
              <div className="text-sm font-semibold">Invoice · Institutional</div>
              <div className="text-[11px] text-white/45 mt-1 leading-snug">Request review, invoice via PO, admin approves.</div>
            </div>
          </button>
        </div>

        {/* Form fields */}
        <div className="mt-5 grid gap-3">
          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 mb-1.5 block">Registrant identity *</span>
            {identities.length === 0 ? (
              <Link to="/registrants" className="block rounded-lg border border-amber-400/30 bg-amber-500/[0.06] px-3 py-2.5 text-sm text-amber-200/90">Create a registrant identity first →</Link>
            ) : (
              <select value={registrantId} onChange={(e) => setRegistrantId(e.target.value)} className={inputCls}>
                {identities.map((r) => (
                  <option key={r.id} value={r.id}>
                    {(r.company_name || `${r.first_name} ${r.last_name}`)} {r.op_handle ? '· verified' : '· unverified'}
                  </option>
                ))}
              </select>
            )}
            {selected && !selected.op_handle && (
              <div className="mt-1.5 text-[11px] text-amber-300/80">
                <Link to="/registrants" className="underline">Verify this identity</Link> with the registry to enable card checkout.
              </div>
            )}
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 mb-1.5 block">Term</span>
              <select value={years} onChange={(e) => setYears(Number(e.target.value))} className={inputCls}>
                {[1, 2, 3, 5, 10].map((y) => <option key={y} value={y}>{y} year{y > 1 ? 's' : ''}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 mb-1.5 block">Company (optional)</span>
              <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Sovereign Holdings" className={inputCls} />
            </label>
          </div>

          {method === 'invoice' && (
            <label className="block">
              <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/40 mb-1.5 block">PO / billing notes (optional)</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="PO number, billing contact, special terms…" className={inputCls + ' resize-none'} />
            </label>
          )}
        </div>

        {/* Total */}
        <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5">
          <div className="text-sm text-white/55">Indicative total <span className="text-white/35">· {years} year{years > 1 ? 's' : ''}</span></div>
          <div className="font-mono text-white text-lg">{formatPrice(total, currency)}</div>
        </div>

        <button disabled={busy || !registrantId} onClick={submit} aria-busy={busy}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#00C2FF,#7C4DFF)', boxShadow: '0 14px 40px -12px rgba(0,194,255,0.5)' }}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : method === 'stripe' ? <CreditCard className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
          {method === 'stripe' ? 'Continue to secure card checkout' : 'Submit registration request'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="mt-4 text-[10px] font-mono uppercase tracking-widest text-white/35 flex items-center gap-1.5">
          <BadgeCheck className="w-3 h-3 text-emerald-400/70" />
          Auth-hold · capture only on registry success · queued · audited
        </div>
      </div>
    </div>
  );
};
