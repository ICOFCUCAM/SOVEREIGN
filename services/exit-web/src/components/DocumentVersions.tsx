import React, { useCallback, useEffect, useState } from "react";
import type { CompanyProfile, MemorandumDocument } from "@exit/engines";
import { INTAKE_FIELDS, type IntakeField } from "../lib/active-company";
import { useAuth } from "../lib/auth";
import { documentType } from "../lib/documents/registry";
import type { GateResult } from "../lib/documents/gate";
import { generateVersion, canonicalJson } from "../lib/documents/service";
import { listVersions, saveVersion, reviewAction, logEvent, type StoredVersion, type ReviewAction } from "../lib/documents/store";
import { useDocumentRemote } from "../lib/documents/remote";
import { capabilityOf, CAPABILITY_LABEL } from "../lib/documents/capability";
import { renderVersionPdf } from "../lib/dispatch-client";
import { docToMarkdown, docFilename, downloadDeliverable } from "../lib/deliverables";
import { notify } from "../lib/ui";

const STATUS_LABEL: Record<string, string> = { draft: "Draft", in_review: "In review", counsel_review: "With counsel", approved: "Approved", superseded: "Superseded" };
const BTN = "rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";

/** Versions of the document on screen: save, download, review, render to PDF. */
export const DocumentVersions: React.FC<{
  typeId: string;
  doc: MemorandumDocument | null;
  gate: GateResult | null;
  company: CompanyProfile;
  companyId: string | null;
  unconfirmed: readonly IntakeField[];
  inputs: Record<string, unknown>;
  ownerName: string;
  codeName: string;
  valuationMidUsd?: number;
  /** The demo company is shown: every input is sample data. */
  sample?: boolean;
  /** The downloaded Markdown, when the memorandum layout does not fit (transaction documents). */
  markdown?: string;
  /** The document's stated basis, for its basis-and-limitations callout. */
  notices?: readonly string[];
}> = ({ typeId, doc, gate, company, companyId, unconfirmed, inputs, ownerName, codeName, valuationMidUsd, sample = false, markdown, notices }) => {
  const { session } = useAuth();
  const remote = useDocumentRemote();
  const [versions, setVersions] = useState<StoredVersion[]>([]);
  const [busy, setBusy] = useState(false);
  const type = documentType(typeId);

  const refresh = useCallback(() => {
    void listVersions(typeId, companyId, remote).then(setVersions).catch(() => setVersions([]));
  }, [typeId, companyId, remote]);
  useEffect(refresh, [refresh]);

  const latest = versions[0] ?? null;
  const capability = capabilityOf(type, gate, latest?.status ?? null, sample);

  const save = async (): Promise<StoredVersion | null> => {
    if (!doc) return null;
    const v = await generateVersion({
      typeId, title: doc.title, sections: doc.sections, producedBy: doc.producedBy, company, companyId,
      unconfirmed: sample ? INTAKE_FIELDS : unconfirmed, inputs, generatedBy: session?.email ?? "this browser", ownerName,
      ...(valuationMidUsd ? { valuationMidUsd } : {}), ...(notices ? { notices } : {}), version: (latest?.version.versionNumber ?? 0) + 1,
    });
    // the same content from the same inputs is not saved twice (the version
    // number and date in the stamp differ, so compare inputs and sections)
    if (latest && latest.status !== "superseded" && latest.version.sourceHash === v.sourceHash
      && latest.version.templateVersion === v.templateVersion
      && canonicalJson(latest.version.ddm.sections) === canonicalJson(v.ddm.sections)) return latest;
    const s = await saveVersion(v, remote);
    refresh();
    return s;
  };
  const run = async (f: () => Promise<void>): Promise<void> => {
    setBusy(true);
    try { await f(); } catch (e) { notify(e instanceof Error ? e.message : "That did not work"); } finally { setBusy(false); }
  };

  const download = (): Promise<void> => run(async () => {
    const s = await save();
    if (!s || !doc) return;
    downloadDeliverable(docFilename(doc, codeName), markdown ?? docToMarkdown(doc));
    await logEvent(s.version.id, "downloaded", remote);
  });
  const pdf = (s: StoredVersion): Promise<void> => run(async () => {
    if (!remote) { notify("PDF rendering needs a signed-in account (e-mail sign-in)."); return; }
    const r = await renderVersionPdf(s.version.id, remote.accessToken);
    notify(r.ok ? `PDF requested from Dispatch${r.jobId ? ` · job ${r.jobId.slice(0, 8)}` : ""}` : r.configured ? `Dispatch error: ${r.error}` : "PDF rendering is not connected yet: no PDF was produced.");
  });
  const act = (s: StoredVersion, a: ReviewAction): Promise<void> => run(async () => {
    const status = await reviewAction(s.version.id, a, remote);
    notify(`Now ${STATUS_LABEL[status] ?? status}`);
    refresh();
  });

  const mine = (s: StoredVersion): boolean => !remote || s.version.generatedBy === session?.email;
  const grants = session?.grants ?? [];

  return (
    <section aria-label="Versions" className="border border-xo-line bg-xo-panel">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-xo-line px-4 py-2.5">
        <div className="text-[12px]">
          <span className="font-semibold text-xo-text">{type.title}</span>
          <span className="text-xo-muted"> · {CAPABILITY_LABEL[capability]}</span>
          <span className="text-xo-faint"> · {type.classification.replace(/_/g, " ")}{type.reviewRequired === "counsel" ? " · needs counsel review" : ""}</span>
        </div>
        <div className="flex gap-2">
          <button type="button" className={BTN} disabled={!doc || busy || !!gate?.blocked} onClick={() => void run(async () => { await save(); notify("Version saved"); })}>Save version</button>
          <button type="button" className={BTN} disabled={!doc || busy || !!gate?.blocked} onClick={() => void download()}>Download draft (.md)</button>
        </div>
      </div>
      {!remote && <p className="border-b border-xo-line px-4 py-2 text-[11px] text-xo-faint">Versions are kept in this browser. Review, approval and PDF rendering need a signed-in account; they are checked on the server.</p>}
      {versions.length === 0 ? (
        <p className="px-4 py-3 text-[12px] text-xo-muted">No saved version yet. Saving one records what it was made from (an input hash) and its exact content (a content hash).</p>
      ) : (
        <ol className="divide-y divide-xo-line">
          {versions.slice(0, 6).map((s) => (
            <li key={s.version.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-[12px]">
              <span className="font-mono font-semibold">v{s.version.versionNumber}</span>
              <span className="text-xo-muted">{new Date(s.version.generatedAt).toLocaleString()}</span>
              <span className={s.status === "approved" ? "text-xo-verified" : s.status === "superseded" ? "text-xo-faint" : "text-xo-caution"}>{STATUS_LABEL[s.status]}</span>
              <span className="font-mono text-[11px] text-xo-faint" title={`content ${s.version.contentHash}\nsource ${s.version.sourceHash}`}>#{s.version.contentHash.slice(0, 10)}</span>
              {s.version.unconfirmedInputs.length > 0 && <span className="text-xo-caution">{s.version.unconfirmedInputs.length} demo input{s.version.unconfirmedInputs.length === 1 ? "" : "s"}</span>}
              <span className="ml-auto flex flex-wrap gap-1.5">
                {remote && s.status !== "superseded" && <button type="button" className={BTN} disabled={busy} onClick={() => void pdf(s)}>Render PDF</button>}
                {remote && mine(s) && s.status === "draft" && <button type="button" className={BTN} disabled={busy} onClick={() => void act(s, "submit")}>Submit for review</button>}
                {remote && mine(s) && s.status === "in_review" && type.reviewRequired === "counsel" && <button type="button" className={BTN} disabled={busy} onClick={() => void act(s, "send_to_counsel")}>Send to counsel</button>}
                {remote && mine(s) && (s.status === "in_review" || s.status === "counsel_review") && <button type="button" className={BTN} disabled={busy} onClick={() => void act(s, "withdraw")}>Withdraw</button>}
                {remote && grants.includes("counsel") && s.status === "counsel_review" && <button type="button" className={BTN} disabled={busy} onClick={() => void act(s, "counsel_reviewed")}>Record counsel review</button>}
                {remote && grants.includes("approver") && !mine(s) && s.status === "in_review" && <button type="button" className={BTN} disabled={busy} onClick={() => void act(s, "approve")}>Approve</button>}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
