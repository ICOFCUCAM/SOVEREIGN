import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { approvalsInbox, decide, type InboxItem , humanError} from "../lib/api";
import { Button, Card, ClassBadge, Field, inputCls, timeAgo } from "../lib/ui";

// The approver inbox + decision panel. Each item shows classification,
// submitter and age; the approver approves / returns / rejects with a comment.
// Separation of duties (submitter ≠ approver) and clearance are enforced by the
// API — the UI surfaces the resulting errors rather than re-implementing them.
const Review: React.FC = () => {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<InboxItem | null>(null);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setItems((await approvalsInbox()).items); }
    catch (e) { setErr(humanError(e, "load failed")); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const act = async (decision: "approve" | "reject" | "return") => {
    if (!sel) return;
    setBusy(true); setErr(null); setMsg(null);
    try {
      const r = await decide(sel.documentId, decision, comment || undefined, ["pdf"]);
      setMsg(`Decision recorded: ${decision} → ${r.lifecycle} (${r.approvals}/${r.required} approvals)`);
      setSel(null); setComment("");
      await load();
    } catch (e) { setErr(humanError(e, "decision failed")); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <header className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-seal-light">Governance</div>
        <h1 className="mt-1.5 font-serif text-[2rem] font-bold leading-tight tracking-tight text-white">Review &amp; Approve</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/50">Each decision is bound to the record's approval chain and sealed into its evidence. Separation of duties is enforced — you cannot approve a record you submitted, and an approver is never its publisher.</p>
      </header>

      {msg && <div className="mb-4 rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{msg}</div>}
      {err && <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          {loading ? <p className="px-4 py-6 text-sm text-white/40">Loading…</p>
            : items.length === 0 ? <p className="px-4 py-10 text-center text-sm text-white/30">The review queue is empty.</p>
            : (
              <ul className="divide-y divide-white/5">
                {items.map((d) => (
                  <li key={d.documentId}>
                    <button onClick={() => { setSel(d); setMsg(null); setErr(null); }}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/5 ${sel?.documentId === d.documentId ? "bg-seal/20" : ""}`}>
                      <ClassBadge level={d.classification?.level} scheme={d.classification?.scheme} />
                      <span className="flex-1 truncate text-sm font-medium text-white">{d.title || "(untitled)"}</span>
                      <span className="hidden text-xs text-white/40 sm:inline">{d.docType}</span>
                      <span className="w-16 text-right text-xs text-white/30">{timeAgo(d.submittedAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        </Card>

        <div>
          {!sel ? (
            <Card className="p-6 text-center text-sm text-white/30">Select a document to review.</Card>
          ) : (
            <Card className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <ClassBadge level={sel.classification?.level} scheme={sel.classification?.scheme} />
                <span className="text-xs text-white/40">v{sel.version}</span>
              </div>
              <h3 className="text-base font-bold text-white">{sel.title || "(untitled)"}</h3>
              <dl className="mt-3 space-y-1 text-xs text-white/50">
                <div className="flex justify-between"><dt>Type</dt><dd className="text-white/70">{sel.docType}</dd></div>
                <div className="flex justify-between"><dt>Submitted by</dt><dd className="text-white/70">{sel.submittedBy ?? "—"}</dd></div>
                <div className="flex justify-between"><dt>Submitted</dt><dd className="text-white/70">{timeAgo(sel.submittedAt)}</dd></div>
              </dl>
              <Link to={`/console/documents/${sel.documentId}`} className="mt-3 inline-block text-xs font-semibold text-seal-light hover:underline">Open full document →</Link>

              {/* where this decision sits in the governed lifecycle */}
              <div className="mt-4 rounded-lg border border-white/10 bg-ink-900/50 px-3 py-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Your decision advances</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {["In Review", "Approved", "Rendered", "Published", "Preserved"].map((s, i, a) => (
                    <React.Fragment key={s}>
                      <span className={i === 0 ? "rounded bg-amber-500/15 px-1.5 py-0.5 font-semibold text-amber-300" : "text-white/45"}>{s}</span>
                      {i < a.length - 1 && <span className="text-white/20" aria-hidden>→</span>}
                    </React.Fragment>
                  ))}
                </div>
                <div className="mt-1.5 text-[10.5px] leading-snug text-white/35">Recorded to the append-only evidence chain. Publication produces a Governance Certificate proving the chain was satisfied.</div>
              </div>

              <div className="mt-4">
                <Field label="Decision comment (optional)">
                  <textarea className={`${inputCls} h-20`} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Rationale for the record…" />
                </Field>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Button variant="ok" onClick={() => act("approve")} disabled={busy}>Approve</Button>
                <Button variant="ghost" onClick={() => act("return")} disabled={busy}>Return</Button>
                <Button variant="danger" onClick={() => act("reject")} disabled={busy}>Reject</Button>
              </div>
              <p className="mt-3 text-[11px] text-white/30">Approving releases the document into rendering. You cannot approve a document you submitted.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Review;
