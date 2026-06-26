import React, { useCallback, useEffect, useState } from "react";
import { getWebhooks, createWebhook, deleteWebhook, testWebhook, type WebhookEndpoint, type CreatedWebhook, humanError } from "../lib/api";
import { Button, Card, inputCls } from "../lib/ui";

// EVENT WEBHOOKS — the reverse API. External systems normally call Dispatch; here
// the institution registers endpoints Dispatch calls back when a governed record
// crosses a lifecycle boundary (approved, published, preserved…), so their own
// systems can react without polling. Each delivery is signed (HMAC-SHA256) with the
// endpoint's secret, shown once at creation. Admin-only (dispatch:admin).

const EVENT_LABEL: Record<string, string> = {
  "record.submitted": "Submitted",
  "record.approved": "Approved",
  "record.rejected": "Rejected",
  "record.returned": "Returned",
  "record.published": "Published",
  "record.preserved": "Preserved",
};

const WebhooksCard: React.FC = () => {
  const [data, setData] = useState<{ endpoints: WebhookEndpoint[]; deliveries: Record<string, number>; availableEvents: string[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<CreatedWebhook | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try { setData(await getWebhooks()); } catch (e) { setErr(humanError(e, "failed to load webhooks")); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = (e: string) => setEvents((prev) => { const n = new Set(prev); n.has(e) ? n.delete(e) : n.add(e); return n; });

  const add = async () => {
    if (!/^https?:\/\/.+/i.test(url.trim())) { setErr("Enter a valid https:// endpoint URL."); return; }
    setBusy(true); setErr(null);
    try { setCreated(await createWebhook(url.trim(), [...events])); setUrl(""); setEvents(new Set()); await load(); }
    catch (e) { setErr(humanError(e, "failed to add endpoint")); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    setConfirmDel(null); setErr(null);
    try { await deleteWebhook(id); await load(); } catch (e) { setErr(humanError(e, "failed to remove endpoint")); }
  };
  const test = async (id: string) => {
    setTesting(id); setErr(null);
    try { await testWebhook(id); await load(); } catch (e) { setErr(humanError(e, "failed to send test")); }
    finally { setTesting(null); }
  };

  const eps = data?.endpoints ?? [];
  const available = data?.availableEvents ?? [];

  return (
    <Card className="mt-6 p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-white/50">Event webhooks</h2>
        {data && <span className="font-mono text-[11px] text-white/35">{(data.deliveries.delivered ?? 0)} delivered · {(data.deliveries.pending ?? 0) + (data.deliveries.failed ?? 0)} pending</span>}
      </div>
      <p className="mb-4 max-w-2xl text-[12.5px] leading-relaxed text-white/45">
        The reverse direction: when a record is approved, published or preserved, Dispatch <span className="text-white/70">POSTs a signed event</span> to your systems so they can react without polling. Each delivery carries an <code className="font-mono text-white/60">X-Dispatch-Signature</code> (HMAC-SHA256) you verify with the endpoint secret.
      </p>

      {err && <div className="mb-3 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">{err}</div>}

      {created && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] p-4">
          <div className="text-[13px] font-bold text-emerald-300">Endpoint added — signing secret (shown once)</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <code className="select-all break-all rounded bg-ink-900/70 px-2 py-1 font-mono text-[12.5px] text-emerald-200">{created.secret}</code>
            <Button variant="ghost" className="px-2.5 py-1 text-[12px]" onClick={() => { navigator.clipboard?.writeText(created.secret).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }}>{copied ? "Copied" : "Copy"}</Button>
            <button onClick={() => setCreated(null)} className="text-[12px] text-white/40 hover:text-white">Dismiss</button>
          </div>
          <div className="mt-1.5 text-[11px] text-white/45">Store it in the receiving system to verify <code className="font-mono">sha256=HMAC(secret, rawBody)</code>.</div>
        </div>
      )}

      {/* registered endpoints */}
      {eps.length === 0 ? (
        <div className="mb-4 text-[13px] text-white/40">No endpoints yet. Add one below to receive events.</div>
      ) : (
        <ul className="mb-4 divide-y divide-white/[0.06]">
          {eps.map((e) => (
            <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${e.last_status === "delivered" ? "bg-emerald-400" : e.last_status && e.last_status !== "delivered" ? "bg-amber-400" : "bg-white/25"}`} />
                  <code className="truncate font-mono text-[12.5px] text-white/80">{e.url}</code>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {(e.events.length ? e.events : ["all events"]).map((ev) => <span key={ev} className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/55">{EVENT_LABEL[ev] || ev}</span>)}
                </div>
                {e.last_status && <div className="mt-1 text-[11px] text-white/35">last delivery: <span className={e.last_status === "delivered" ? "text-emerald-300/80" : "text-amber-300/80"}>{e.last_status}</span></div>}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="ghost" className="px-2.5 py-1 text-[12px]" disabled={testing === e.id} onClick={() => test(e.id)}>{testing === e.id ? "Sending…" : "Send test"}</Button>
                {confirmDel === e.id ? (
                  <>
                    <Button variant="danger" className="px-2.5 py-1 text-[12px]" onClick={() => remove(e.id)}>Confirm</Button>
                    <button onClick={() => setConfirmDel(null)} className="text-[12px] text-white/40 hover:text-white/70">Cancel</button>
                  </>
                ) : (
                  <Button variant="ghost" className="px-2.5 py-1 text-[12px] text-red-300/80 hover:text-red-200" onClick={() => setConfirmDel(e.id)}>Remove</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* add an endpoint */}
      <div className="rounded-lg border border-white/10 bg-ink-900/40 p-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Add an endpoint</div>
        <input className={inputCls} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://erp.ministry.gov/hooks/dispatch" />
        <div className="mt-3">
          <div className="mb-1.5 text-[12px] text-white/50">Events <span className="text-white/30">(none selected = all events)</span></div>
          <div className="flex flex-wrap gap-2">
            {available.map((ev) => (
              <label key={ev} className={`cursor-pointer rounded-full px-2.5 py-1 text-[12px] ring-1 transition ${events.has(ev) ? "bg-seal/20 text-white ring-seal-light/40" : "bg-white/[0.04] text-white/55 ring-white/10 hover:text-white"}`}>
                <input type="checkbox" className="hidden" checked={events.has(ev)} onChange={() => toggle(ev)} />
                {EVENT_LABEL[ev] || ev}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-3"><Button variant="primary" disabled={busy || !url.trim()} onClick={add}>{busy ? "Adding…" : "Add endpoint"}</Button></div>
      </div>
    </Card>
  );
};

export default WebhooksCard;
