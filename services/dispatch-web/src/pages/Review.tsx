import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { approvalsInbox, decide, getDocument, getMyAuthority, type DocumentDetail, type InboxItem, humanError } from "../lib/api";
import { timeAgo } from "../lib/ui";
import { useAuth } from "../lib/auth";
import { recordTypeLabel } from "../lib/recordTypes";
import { actorName, fmtDateTime, recordNo, waited } from "../lib/format";
import { Alert, Badge, Button, ClassificationMark, ConfirmDialog, EmptyState, Fact, FormField, Kbd, PageHeader, Panel, Skeleton, SkeletonRows, controlCls, cx, lifecycleMeta, useHotkeys } from "../components/console/ds";
import { ChainOfAuthority } from "../components/console/governance";
import { Icon } from "../components/console/icons";

type Decision = "approve" | "reject" | "return";

const applyFilter = (items: InboxItem[], filter: string): InboxItem[] => {
  const f = filter.trim().toLowerCase();
  if (!f) return items;
  return items.filter((d) => [d.title, d.docType, recordTypeLabel(d.docType), d.currentAuthority, d.submittedByName, d.submittedBy, d.classification?.level].some((v) => v?.toLowerCase().includes(f)));
};

// The consequence of each decision, stated before it is taken. These restate the
// engine's actual behaviour (dispatch-api decision handler + shared/governance):
// approve satisfies this step; return sends the record back to draft; reject
// moves it to "rejected", off the publication path.
const CONSEQUENCE: Record<Decision, string> = {
  approve: "Satisfies your step in the approval chain. When the final step is satisfied the record is rendered; it is not published until the publication authority releases it.",
  return: "Sends the record back to draft for revision by its author. It leaves the governance queue until re-submitted.",
  reject: "Moves the record to Rejected — off the publication path. Re-work requires a new version.",
};

// The approver inbox + decision panel. Separation of duties (submitter ≠
// approver), step order and clearance are enforced by the API — the UI explains
// them and surfaces the resulting refusals rather than re-implementing them.
const Review: React.FC = () => {
  const { session } = useAuth();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<InboxItem | null>(null);
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [confirm, setConfirm] = useState<Decision | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  // The inbox lists every record in review; the engine only accepts a decision at
  // the open step. Records whose open step is held by one of the caller's offices
  // (from /v1/governance/my-authority) are marked and can be isolated.
  const [mine, setMine] = useState<Set<string> | null>(null);
  const [onlyMine, setOnlyMine] = useState(false);
  useEffect(() => {
    getMyAuthority().then((a) => setMine(new Set(a.underYourAuthority.filter((r) => r.action !== "publish").map((r) => r.documentId)))).catch(() => setMine(null));
  }, [items]);
  const filterRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = async (): Promise<InboxItem[] | null> => {
    setLoading(true);
    try { const r = (await approvalsInbox()).items; setItems(r); return r; }
    catch (e) { setErr(humanError(e, "The governance queue could not be loaded.")); return null; }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Pull the record's governance context (policy, chain, posture) for the reviewer.
  useEffect(() => {
    if (!sel) { setDetail(null); return; }
    let live = true; setDetailLoading(true); setDetail(null);
    getDocument(sel.documentId).then((d) => live && setDetail(d)).catch(() => {}).finally(() => live && setDetailLoading(false));
    return () => { live = false; };
  }, [sel]);

  const visible = useMemo(() => applyFilter(items, filter).filter((d) => !onlyMine || !mine || mine.has(d.documentId)), [items, filter, onlyMine, mine]);

  const choose = (d: InboxItem) => { setSel(d); setMsg(null); setErr(null); setComment(""); };
  const move = (delta: number) => {
    if (!visible.length) return;
    const i = sel ? visible.findIndex((v) => v.documentId === sel.documentId) : -1;
    const next = visible[Math.max(0, Math.min(visible.length - 1, i + delta))];
    if (next) { choose(next); document.getElementById(`rv-${next.documentId}`)?.scrollIntoView({ block: "nearest" }); }
  };
  useHotkeys({ j: () => move(1), k: () => move(-1), "/": () => filterRef.current?.focus() });

  const act = async (decision: Decision) => {
    if (!sel) return;
    setBusy(decision); setErr(null); setMsg(null);
    const title = sel.title || "(untitled)";
    try {
      const r = await decide(sel.documentId, decision, comment || undefined, ["pdf"]);
      const verb = decision === "approve" ? "Approval" : decision === "return" ? "Return for revision" : "Rejection";
      const quorum = r.required > 0 ? ` · ${r.approvals}/${r.required} approvals` : "";
      setMsg(`${verb} recorded for “${title}”. Record is now ${lifecycleMeta(r.lifecycle).label}${quorum}.`);
      const at = visible.findIndex((v) => v.documentId === sel.documentId);
      setSel(null); setComment(""); setConfirm(null);
      // Move on to the record that now occupies the same place in the queue —
      // selection only; every decision still needs its own explicit action.
      const fresh = await load();
      const next = fresh ? applyFilter(fresh, filter).filter((d) => !onlyMine || !mine || mine.has(d.documentId)) : [];
      if (next.length) setSel(next[Math.min(Math.max(at, 0), next.length - 1)]);
    } catch (e) { setErr(humanError(e, "The decision could not be recorded.")); setConfirm(null); }
    finally { setBusy(null); }
  };

  // Informational only — the API is the authority on separation of duties.
  const ownSubmission = !!(sel && session && sel.submittedBy && actorName(sel.submittedBy) === actorName(session.subject));

  return (
    <div>
      <PageHeader
        eyebrow="Governance proceedings"
        title="Governance review"
        description="Each decision is bound to the record's approval chain and recorded to its evidence. Separation of duties is enforced — you cannot approve a record you submitted, and an approver is never its publisher."
        meta={<><span>Review · authority control</span>{!loading && <span className="text-sd-text2">{items.length} pending</span>}</>}
        actions={<Button variant="ghost" icon={<Icon.refresh />} onClick={() => { load(); }} loading={loading}>Refresh queue</Button>}
      />

      {msg && <Alert tone="ok" className="mb-4" onDismiss={() => setMsg(null)}>{msg}</Alert>}
      {err && <Alert tone="bad" title="Decision not recorded" className="mb-4" onDismiss={() => setErr(null)}>{err}</Alert>}

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* the queue */}
        <Panel headingLevel={2} padded={false} title={<span className="flex items-center gap-2">Governance queue <span className="rounded bg-sd-sunken px-1.5 py-0.5 font-mono text-[11px] text-sd-text2">{loading ? "…" : visible.length}</span></span>}
          aside={<span className="hidden items-center gap-1 sm:flex"><Kbd>j</Kbd><Kbd>k</Kbd> move</span>}>
          <div className="border-b border-sd-soft p-2.5">
            <label htmlFor="rv-filter" className="sr-only">Filter the queue</label>
            <div className="relative">
              <Icon.search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sd-text3" />
              <input id="rv-filter" ref={filterRef} className={cx(controlCls, "h-8 pl-8")} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by title, type, authority or submitter…" />
            </div>
            {mine && (
              <label className="mt-2 flex cursor-pointer items-center gap-2 text-[12px] text-sd-text2">
                <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="accent-[#8dbbff]" />
                Only records at my office's step <span className="font-mono text-sd-text3">({items.filter((d) => mine.has(d.documentId)).length})</span>
              </label>
            )}
          </div>
          {loading ? <SkeletonRows rows={5} label="Loading the governance queue" />
            : items.length === 0 ? <EmptyState icon={<Icon.check />} title="The review queue is empty">No records are awaiting a governance decision.</EmptyState>
            : visible.length === 0 ? <EmptyState compact icon={<Icon.search />} title="No records match this filter" action={<Button size="sm" onClick={() => setFilter("")}>Clear filter</Button>} />
            : (
              <ul aria-label="Records awaiting a decision" className="max-h-[calc(100vh-280px)] min-h-[200px] divide-y divide-sd-soft overflow-auto">
                {visible.map((d) => {
                  const on = sel?.documentId === d.documentId;
                  return (
                    <li key={d.documentId} id={`rv-${d.documentId}`}>
                      <button aria-pressed={on} onClick={() => { choose(d); panelRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }}
                        className={cx("grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 text-left transition-colors", on ? "bg-sd-hover shadow-[inset_2px_0_0_#8dbbff]" : "hover:bg-sd-raised")}>
                        <ClassificationMark level={d.classification?.level} scheme={d.classification?.scheme} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[13.5px] font-semibold text-sd-text">{d.title || "(untitled)"}</span>
                            {mine?.has(d.documentId) && <Badge tone="info" className="shrink-0">Your step</Badge>}
                          </span>
                          <span className="block truncate text-[12px] text-sd-text3">
                            {recordTypeLabel(d.docType)}
                            {d.currentAuthority && <> · awaiting <span className="text-sd-text2">{d.currentAuthority}</span></>}
                            {(d.submittedByName || d.submittedBy) && <> · by {d.submittedByName ?? actorName(d.submittedBy)}</>}
                          </span>
                        </span>
                        <span className="text-right">
                          <span className="block font-mono text-[12px] tabular-nums text-sd-warn" title={d.submittedAt ? `Submitted ${fmtDateTime(d.submittedAt)}` : undefined}>{waited(d.submittedAt)}</span>
                          <span className="block text-[10.5px] uppercase tracking-[0.06em] text-sd-text3">since submission</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </Panel>

        {/* the decision */}
        <div ref={panelRef} className="lg:sticky lg:top-2">
          {!sel ? (
            <Panel>
              <EmptyState compact icon={<Icon.review />} title="Select a record to review">Choose a record from the queue to see its governing policy, chain of authority and the consequence of each decision. <span className="hidden lg:inline">Press <Kbd>j</Kbd> to start.</span></EmptyState>
            </Panel>
          ) : (
            <Panel padded={false} tone="accent" as="section" title="Decision" headingLevel={2}>
              <div className="border-b border-sd-soft p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <ClassificationMark level={sel.classification?.level} scheme={sel.classification?.scheme} />
                  <span className="font-mono text-[11.5px] text-sd-text2">{recordNo(sel.documentId, detail?.createdAt)}</span>
                  <span className="font-mono text-[11.5px] text-sd-text3">v{sel.version}</span>
                </div>
                <h3 className="mt-2 font-serif text-[18px] font-semibold leading-snug text-sd-text">{sel.title || "(untitled)"}</h3>
                {sel.currentAuthority && <div className="mt-2"><Badge tone="info" glyph="●">Deciding as {sel.currentAuthority}</Badge></div>}
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5">
                  <Fact label="Record type" value={recordTypeLabel(sel.docType)} />
                  <Fact label="Submitted by" value={sel.submittedByName ?? actorName(sel.submittedBy)} />
                  <Fact label="Submitted" value={sel.submittedAt ? <span title={fmtDateTime(sel.submittedAt)}>{timeAgo(sel.submittedAt)}</span> : undefined} />
                  <Fact label="Governing policy" value={detailLoading ? <Skeleton className="mt-1 h-3.5 w-24" /> : detail?.posture?.policyName ? <>{detail.posture.policyName}{detail.posture.policyVersion ? <span className="font-mono text-sd-text3"> v{detail.posture.policyVersion}</span> : null}</> : "Platform default"} />
                  {detail?.posture?.nextAuthority && <Fact label="Next authority" value={detail.posture.nextAuthority} />}
                  {detail?.posture?.publicationAuthority && <Fact label="Publication authority" value={detail.posture.publicationAuthority} />}
                </dl>
                <Link to={`/console/documents/${sel.documentId}`} className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-sd-accent hover:underline">Open the full record file <Icon.arrowRight className="h-3.5 w-3.5" /></Link>
              </div>

              {detail?.governanceChain && detail.governanceChain.length > 0 && (
                <div className="border-b border-sd-soft p-4">
                  <div className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-sd-text3">Chain of authority</div>
                  <ChainOfAuthority steps={detail.governanceChain} compact />
                </div>
              )}

              <div className="p-4">
                {ownSubmission && (
                  <Alert tone="warn" className="mb-3" title="This appears to be your own submission">Separation of duties: the engine refuses an approval by the record's submitter.</Alert>
                )}
                <FormField id="rv-comment" label="Decision rationale" hint="Optional. Recorded with your decision on the approval record.">
                  <textarea id="rv-comment" className={cx(controlCls, "h-20 resize-y")} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="The reasons for this decision…" />
                </FormField>

                <div className="mt-4 space-y-2">
                  <Button variant="approve" className="w-full" onClick={() => act("approve")} loading={busy === "approve"} disabled={!!busy} icon={<Icon.check />}>
                    {sel.currentAuthority ? `Approve as ${sel.currentAuthority}` : "Approve"}
                  </Button>
                  <p className="text-[11.5px] leading-snug text-sd-text3">{CONSEQUENCE.approve}</p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button variant="warn" onClick={() => setConfirm("return")} disabled={!!busy}>Return for revision</Button>
                    <Button variant="danger" onClick={() => setConfirm("reject")} disabled={!!busy}>Reject</Button>
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <ConfirmDialog open={confirm === "return"} title="Return this record for revision?" confirmLabel="Return for revision" variant="warn"
        busy={busy === "return"} onCancel={() => setConfirm(null)} onConfirm={() => act("return")}>
        <p><span className="font-semibold text-sd-text">{sel?.title || "(untitled)"}</span> — {CONSEQUENCE.return}</p>
        {comment ? <p className="mt-2 text-sd-text3">Rationale: “{comment}”</p> : <p className="mt-2 text-sd-text3">No rationale entered. Consider telling the author what to revise.</p>}
      </ConfirmDialog>
      <ConfirmDialog open={confirm === "reject"} title="Reject this record?" confirmLabel="Reject record" variant="danger" irreversible="Decisions are recorded permanently. A rejected record can only re-enter governance as a new version."
        busy={busy === "reject"} onCancel={() => setConfirm(null)} onConfirm={() => act("reject")}>
        <p><span className="font-semibold text-sd-text">{sel?.title || "(untitled)"}</span> — {CONSEQUENCE.reject}</p>
        {comment ? <p className="mt-2 text-sd-text3">Rationale: “{comment}”</p> : <p className="mt-2 text-sd-text3">No rationale entered.</p>}
      </ConfirmDialog>
    </div>
  );
};

export default Review;
