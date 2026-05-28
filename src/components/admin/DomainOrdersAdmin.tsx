import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Loader2, ShoppingBag, FileText, CreditCard, BadgeCheck, X as XIcon, RotateCcw, RefreshCw, Mail, Receipt } from 'lucide-react';
import { listAllOrders, updateOrder, approveAndRegister, type DomainOrder, type OrderStatus } from '@/lib/orders';

const statusChip = (s: OrderStatus) => {
  const map: Partial<Record<OrderStatus, string>> = {
    draft: 'bg-white/10 text-white/55',
    requested: 'bg-amber-500/15 text-amber-300',
    quoted: 'bg-amber-500/15 text-amber-300',
    invoiced: 'bg-cyan-500/15 text-cyan-300',
    paid: 'bg-cyan-500/15 text-cyan-300',
    awaiting_payment: 'bg-amber-500/15 text-amber-300',
    payment_authorized: 'bg-emerald-500/15 text-emerald-300',
    registering: 'bg-cyan-500/15 text-cyan-300',
    registered: 'bg-emerald-500/15 text-emerald-300',
    failed: 'bg-rose-500/15 text-rose-300',
    voided: 'bg-white/5 text-white/40',
    refunded: 'bg-white/5 text-white/40',
  };
  return map[s] || 'bg-white/5 text-white/50';
};

const fmt = (amt: number | null, cur: string | null) => {
  if (amt == null) return '—';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur || 'USD' }).format(amt); } catch { return `${amt} ${cur ?? ''}`; }
};

const methodChip = (m: DomainOrder['payment_method']) => {
  const cls = m === 'stripe' ? 'bg-purple-500/15 text-purple-200' : m === 'invoice' ? 'bg-amber-500/15 text-amber-200' : 'bg-white/5 text-white/50';
  const Icon = m === 'stripe' ? CreditCard : m === 'invoice' ? FileText : ShoppingBag;
  return <span className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded ${cls}`}><Icon className="w-3 h-3" /> {m}</span>;
};

export const DomainOrdersAdmin: React.FC = () => {
  const [orders, setOrders] = useState<DomainOrder[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'invoice' | 'stripe' | 'open' | 'registered' | 'failed'>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listAllOrders().then(setOrders).catch((e) => toast.error((e as Error).message)).finally(() => setLoaded(true));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const visible = orders.filter((o) => {
    if (filter === 'all') return true;
    if (filter === 'invoice' || filter === 'stripe') return o.payment_method === filter;
    if (filter === 'open') return !['registered', 'failed', 'voided', 'refunded'].includes(o.status);
    return o.status === filter;
  });

  const guard = async (id: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(id);
    try { await fn(); toast.success(ok); refresh(); }
    catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  };

  const mailtoInvoice = (o: DomainOrder) => {
    const subject = encodeURIComponent(`Invoice · ${o.domain} · order ${o.id.slice(0, 8)}`);
    const body = encodeURIComponent(`Dear ${o.company_name || 'institutional team'},\n\nPlease find attached the invoice for the registration of ${o.domain} (${o.years} year${o.years > 1 ? 's' : ''}).\n\nAmount: ${fmt(o.retail_amount, o.currency)}\nOrder ID: ${o.id}\n\nKindly proceed with payment via wire / SEPA / bank transfer. Once payment is received we will activate registration on the sovereign infrastructure.\n\nRegards,\nSovereign Domains`);
    return `mailto:${o.contact_email || ''}?subject=${subject}&body=${body}`;
  };

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <div className="kicker text-cyan-300/70 mb-2 flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Domain orders</div>
          <h2 className="font-display text-xl font-bold tracking-cinematic">Registration & invoicing</h2>
        </div>
        <button onClick={refresh} aria-label="Refresh" className="text-[11px] font-mono uppercase tracking-wider glass px-3 py-1.5 rounded text-white/60 hover:text-white inline-flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Refresh</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {([
          ['all', 'All'], ['open', 'Open'], ['invoice', 'Invoice'], ['stripe', 'Stripe'], ['registered', 'Registered'], ['failed', 'Failed'],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} aria-pressed={filter === k}
            className={`text-[11px] font-mono uppercase px-3 py-1.5 rounded transition ${filter === k ? 'bg-cyan-400/15 text-cyan-200' : 'bg-white/5 text-white/45 hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="glass-strong rounded-2xl overflow-hidden divide-y divide-white/5">
        {!loaded && <div className="px-5 py-12 flex justify-center text-white/40"><Loader2 className="w-4 h-4 animate-spin" /></div>}
        {loaded && visible.length === 0 && <div className="px-5 py-12 text-center text-white/40">No orders match this filter.</div>}
        {visible.map((o) => (
          <div key={o.id} className="px-5 py-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-white text-sm truncate">{o.domain}</span>
                  {methodChip(o.payment_method)}
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded shrink-0 ${statusChip(o.status)}`}>{o.status}</span>
                </div>
                <div className="text-[11px] text-white/40 font-mono mt-1 truncate">
                  {o.contact_email || '—'}{o.company_name ? ` · ${o.company_name}` : ''} · {o.years}y · #{o.id.slice(0, 8)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-white text-sm">{fmt(o.retail_amount, o.currency)}</div>
                <div className="text-[10px] font-mono text-white/35">cost {fmt(o.cost_amount, o.currency)}</div>
              </div>
            </div>

            {/* Action row */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {/* Invoice path actions */}
              {o.payment_method === 'invoice' && o.status === 'requested' && (
                <button onClick={() => guard(o.id, () => updateOrder(o.id, { status: 'quoted' }), 'Marked quoted')} disabled={busy === o.id} className="text-[11px] font-mono px-2.5 py-1 rounded border border-white/15 text-white/70 hover:text-white">Mark quoted</button>
              )}
              {o.payment_method === 'invoice' && ['requested', 'quoted'].includes(o.status) && (
                <>
                  <a href={mailtoInvoice(o)} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-amber-400/30 text-amber-300 hover:bg-amber-400/10"><Mail className="w-3 h-3" /> Email invoice draft</a>
                  <button onClick={() => guard(o.id, () => updateOrder(o.id, { status: 'invoiced' }), 'Marked invoiced')} disabled={busy === o.id} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-white/15 text-white/70 hover:text-white"><Receipt className="w-3 h-3" /> Mark invoiced</button>
                </>
              )}
              {o.payment_method === 'invoice' && o.status === 'invoiced' && (
                <button onClick={() => guard(o.id, () => updateOrder(o.id, { status: 'paid' }), 'Marked paid')} disabled={busy === o.id} className="text-[11px] font-mono px-2.5 py-1 rounded border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10">Mark paid</button>
              )}

              {/* Register — invoice (after paid) or stripe (after authorized) */}
              {(
                (o.payment_method === 'invoice' && ['paid', 'requested', 'quoted', 'invoiced'].includes(o.status)) ||
                (o.payment_method === 'stripe' && o.status === 'payment_authorized')
              ) && (
                <button onClick={() => guard(o.id, () => approveAndRegister(o.id), 'Registration kicked off')} disabled={busy === o.id} aria-busy={busy === o.id}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded bg-gradient-to-r from-cyan-500 to-purple-600 text-white">
                  {busy === o.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />} Approve & register
                </button>
              )}

              {/* Mark failed / void */}
              {!['registered', 'voided', 'refunded'].includes(o.status) && (
                <button onClick={() => guard(o.id, () => updateOrder(o.id, { status: 'voided' }), 'Marked voided')} disabled={busy === o.id} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-white/10 text-white/45 hover:text-rose-300"><XIcon className="w-3 h-3" /> Void</button>
              )}
              {['voided', 'failed'].includes(o.status) && (
                <button onClick={() => guard(o.id, () => updateOrder(o.id, { status: o.payment_method === 'invoice' ? 'requested' : 'awaiting_payment' }), 'Reopened')} disabled={busy === o.id} className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded border border-white/15 text-white/55 hover:text-white"><RotateCcw className="w-3 h-3" /> Reopen</button>
              )}
            </div>

            {(o.notes || o.error) && (
              <div className="mt-3 grid gap-1 text-[11px]">
                {o.notes && <div className="text-white/45"><span className="text-white/30 font-mono uppercase tracking-wider mr-1.5">notes</span>{o.notes}</div>}
                {o.error && <div className="text-rose-300/85"><span className="text-rose-300/50 font-mono uppercase tracking-wider mr-1.5">error</span>{o.error}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
