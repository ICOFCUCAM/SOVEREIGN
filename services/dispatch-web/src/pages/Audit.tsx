import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { audit, type AuditEvent, humanError } from "../lib/api";
import { actorName, fmtDateTime } from "../lib/format";
import { Alert, Badge, Button, CopyButton, EmptyState, EvidenceValue, Fact, PageHeader, Panel, Segmented, SkeletonRows, controlCls, cx, useDensity } from "../components/console/ds";
import { Icon } from "../components/console/icons";

const LIMIT = 300;

// Append-only evidence chain (auditor scope). Filter by action or target; the
// trail is tenant-scoped and read-only — the database blocks UPDATE/DELETE on
// audit_events (M4 trigger) and the API exposes no mutation. Filters live in the
// URL so a record file can link straight to its own evidence.
//
// Integrity wording: an event's `sha256` is a digest the engine RECORDED with
// that event (e.g. a preservation or certificate proof). The console does not
// recompute or verify it, so it is labelled "Digest recorded" — never "Verified".
const Audit: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const [action, setAction] = useState(params.get("action") ?? "");
  const [target, setTarget] = useState(params.get("target") ?? "");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [density, setDensity] = useDensity("evidence", "compact");

  const qAction = params.get("action") ?? "", qTarget = params.get("target") ?? "";
  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try { setEvents((await audit({ action: qAction || undefined, target: qTarget || undefined, limit: LIMIT })).events); }
    catch (e) { setErr(humanError(e, "The evidence chain could not be loaded.")); }
    finally { setLoading(false); }
  }, [qAction, qTarget]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setAction(qAction); setTarget(qTarget); }, [qAction, qTarget]);

  const apply = (e?: React.FormEvent) => {
    e?.preventDefault();
    const next = new URLSearchParams();
    if (action.trim()) next.set("action", action.trim());
    if (target.trim()) next.set("target", target.trim());
    setParams(next, { replace: true });
  };
  const clear = () => { setAction(""); setTarget(""); setParams(new URLSearchParams(), { replace: true }); };
  // Narrow the loaded page instantly (actor, action, target, event id) without a
  // round-trip; the exact server filters above still define what is loaded.
  const [quick, setQuick] = useState("");
  const shown = useMemo(() => {
    const f = quick.trim().toLowerCase();
    if (!f) return events;
    return events.filter((e) => [e.actor, e.actorType, e.action, e.targetType, e.targetId, e.eventId, e.classification].some((v) => v?.toLowerCase().includes(f)));
  }, [events, quick]);
  const knownActions = useMemo(() => Array.from(new Set(events.map((e) => e.action))).sort(), [events]);
  const digests = events.filter((e) => e.sha256).length;
  const filtered = !!(qAction || qTarget);

  return (
    <div>
      <PageHeader
        eyebrow="Evidence chain"
        title="Evidence chain"
        description="An append-only chain of proceedings — read-only, tenant-scoped, evidentiary by design. Every governance act is recorded here; events that carry a cryptographic digest show it in full."
        meta={<><span>Append-only · read-only</span>{!loading && <span className="text-sd-text2">{events.length}{events.length >= LIMIT ? "+" : ""} proceedings · {digests} with digest</span>}</>}
      />

      <form onSubmit={apply} className="mb-3 flex flex-wrap items-end gap-2" aria-label="Filter the evidence chain">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="ev-action" className="mb-1 block text-[12px] font-semibold text-sd-text2">Action</label>
          <input id="ev-action" list="ev-actions" className={cx(controlCls, "h-9 font-mono")} value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. document.published" />
          <datalist id="ev-actions">{knownActions.map((a) => <option key={a} value={a} />)}</datalist>
        </div>
        <div className="min-w-[240px] flex-[1.4]">
          <label htmlFor="ev-target" className="mb-1 block text-[12px] font-semibold text-sd-text2">Target ID</label>
          <input id="ev-target" className={cx(controlCls, "h-9 font-mono")} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Exact target UUID" />
        </div>
        <Button type="submit" variant="primary" icon={<Icon.search />}>Apply filters</Button>
        {filtered && <Button variant="ghost" onClick={clear} icon={<Icon.close />}>Clear</Button>}
        <Segmented label="Row density" value={density} onChange={setDensity} options={[{ value: "comfortable", label: "Comfortable" }, { value: "compact", label: "Compact" }]} />
      </form>

      {!loading && events.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label htmlFor="ev-quick" className="sr-only">Narrow the loaded events</label>
          <div className="relative w-full sm:w-80">
            <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-sd-text3" />
            <input id="ev-quick" className={cx(controlCls, "h-8 pl-8 text-[12.5px]")} value={quick} onChange={(e) => setQuick(e.target.value)} placeholder="Narrow loaded events by actor, action or ID…" />
          </div>
          {quick && <span className="font-mono text-[12px] text-sd-text3">{shown.length} of {events.length} loaded</span>}
        </div>
      )}

      {err && <Alert tone="bad" title="Evidence unavailable" className="mb-3" action={<Button size="sm" onClick={load}>Try again</Button>}>{err}</Alert>}

      <Panel padded={false} className="overflow-hidden">
        {loading ? <SkeletonRows rows={8} label="Loading the evidence chain" />
          : events.length === 0 ? (
            filtered
              ? <EmptyState icon={<Icon.search />} title="No events match these filters" action={<Button onClick={clear}>Clear filters</Button>}>Action and target filters are exact matches.</EmptyState>
              : <EmptyState icon={<Icon.evidence />} title="No events recorded yet">Events are appended as records move through governance.</EmptyState>
          ) : (
            <>
              <div className="max-h-[calc(100vh-300px)] min-h-[240px] overflow-auto">
                <table className="sd-table min-w-[860px]" data-density={density}>
                  <caption className="sr-only">Evidence chain — {events.length} events, newest first. Expand a row for every recorded field.</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="w-8"><span className="sr-only">Details</span></th>
                      <th scope="col">Timestamp</th>
                      <th scope="col">Actor</th>
                      <th scope="col">Action</th>
                      <th scope="col">Target</th>
                      <th scope="col">Event ID</th>
                      <th scope="col">Integrity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.length === 0 && <tr><td colSpan={7} className="!py-8 text-center text-sd-text3">No loaded event matches “{quick}”.</td></tr>}
                    {shown.map((e) => {
                      const isOpen = open === e.eventId;
                      return (
                        <React.Fragment key={e.eventId}>
                          <tr>
                            <td>
                              <button onClick={() => setOpen(isOpen ? null : e.eventId)} aria-expanded={isOpen} aria-controls={`ev-${e.eventId}`} aria-label={`${isOpen ? "Hide" : "Show"} details for ${e.action}`}
                                className="grid h-6 w-6 place-items-center rounded-md text-sd-text3 hover:bg-sd-hover hover:text-sd-text">
                                <Icon.chevronRight className={cx("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
                              </button>
                            </td>
                            <td className="whitespace-nowrap font-mono text-[12px] text-sd-text2"><time dateTime={e.ts}>{fmtDateTime(e.ts)}</time></td>
                            <td className="max-w-[220px]"><div className="truncate text-sd-text" title={e.actor}>{actorName(e.actor)}</div><div className="text-[11px] text-sd-text3">{e.actorType}</div></td>
                            <td><span className="rounded bg-sd-sunken px-1.5 py-0.5 font-mono text-[12px] text-sd-text">{e.action}</span></td>
                            <td className="font-mono text-[11.5px]">
                              {e.targetId ? (
                                e.targetType === "document"
                                  ? <Link to={`/console/documents/${e.targetId}`} className="text-sd-accent hover:underline" title={e.targetId}>document/{e.targetId.slice(0, 8)}…</Link>
                                  : <span className="text-sd-text2" title={e.targetId}>{e.targetType ?? "target"}/{e.targetId.slice(0, 8)}…</span>
                              ) : <span className="text-sd-text3">—</span>}
                            </td>
                            <td className="whitespace-nowrap font-mono text-[11.5px] text-sd-text2"><span title={e.eventId}>{e.eventId.slice(0, 8)}…</span><CopyButton value={e.eventId} label="event ID" className="ml-1" /></td>
                            <td>{e.sha256 ? <Badge tone="gold" glyph="#" title={`SHA-256 recorded with this event: ${e.sha256}`}>Digest recorded</Badge> : <span className="text-[12px] text-sd-text3">—</span>}</td>
                          </tr>
                          {isOpen && (
                            <tr id={`ev-${e.eventId}`} className="!bg-sd-sunken">
                              <td />
                              <td colSpan={6} className="!py-3">
                                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                                  <Fact label="Event ID" value={e.eventId} mono />
                                  <Fact label="Timestamp (ISO 8601)" value={e.ts} mono />
                                  <Fact label="Actor" value={e.actor} mono />
                                  <Fact label="Actor type" value={e.actorType} />
                                  <Fact label="Target type" value={e.targetType} />
                                  <Fact label="Target ID" value={e.targetId} mono />
                                  <Fact label="Classification" value={e.classification} />
                                  <Fact label="Request ID" value={e.requestId} mono />
                                  <Fact label="Correlation ID" value={e.correlationId} mono />
                                  {e.sha256 && <div className="sm:col-span-2 xl:col-span-4"><EvidenceValue label="SHA-256 digest recorded with this event" value={e.sha256} tone="gold"
                                    note="A digest identifies exact content: recomputing it from the same bytes yields the same value. It does not by itself establish authorship, and the console does not recompute it." /></div>}
                                </dl>
                                {e.targetId && <Link to={`/console/audit?target=${e.targetId}`} className="mt-3 inline-block text-[12px] font-semibold text-sd-accent hover:underline">All events for this target →</Link>}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {events.length >= LIMIT && <div className="border-t border-sd-soft px-4 py-2 text-[12px] text-sd-text3">Showing the newest {LIMIT} events. Filter by action or target to reach older proceedings.</div>}
            </>
          )}
      </Panel>
    </div>
  );
};

export default Audit;
