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
import { downloadPdf } from "../lib/documents/pdf";
import { CERTIFIABLE_TYPES, certifyVersion, loadCertificates, type Certificate } from "../lib/documents/certificate";
import { docToMarkdown, docFilename, downloadDeliverable } from "../lib/deliverables";
import { notify } from "../lib/ui";

const STATUS_LABEL: Record<string, string> = { draft: "Draft", in_review: "In review", counsel_review: "With counsel", approved: "Approved", superseded: "Superseded" };
const BTN = "rounded-sm border border-xo-line px-2.5 py-1 text-[12px] font-medium text-xo-text hover:bg-xo-raise disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xo-action";

/** Versions of the document on screen: save, download, review, and download each version as a PDF
 *  (ExitOS's own renderer, in the browser). */
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

  const [certs, setCerts] = useState<Map<string, Certificate>>(new Map());
  const certifiable = CERTIFIABLE_TYPES.has(typeId);
  const refresh = useCallback(() => {
    void listVersions(typeId, companyId, remote).then((vs) => {
      setVersions(vs);
      if (remote && certifiable) void loadCertificates(remote, vs.map((v) => v.version.id)).then(setCerts).catch(() => undefined);
    }).catch(() => setVersions([]));
  }, [typeId, companyId, remote, certifiable]);
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
    const demo = s.version.unconfirmedInputs.length;
    const cert = certs.get(s.version.id);
    downloadPdf(s.version.ddm, { review: STATUS_LABEL[s.status], ...(cert?.state === "certified" && cert.recordId ? { record: cert.recordId } : {}),
      ...(demo ? { notice: `${demo} of this version's inputs are the demo company's values, not this company's figures.` } : {}) });
    await logEvent(s.version.id, "rendered_pdf", remote, { renderer: "exitos" });
  });
  // certification by Sovereign Dispatch: the function checks and records everything; this only asks
  const certify = (s: StoredVersion, action: "certify" | "status"): Promise<void> => run(async () => {
    if (!remote) return;
    const r = await certifyVersion(remote, s.version.id, action);
    if (!r.ok) { notify(r.configured ? `Not certified: ${r.error}` : "Certification is not connected yet: nothing was sent."); return; }
    const c = r.certificate;
    if (c) setCerts((m) => new Map(m).set(s.version.id, c));
    notify(c?.state === "certified" ? `Certified · ${c.recordId}` : c?.state === "failed" ? `Certification failed: ${c.error ?? "Dispatch refused it"}` : `Certification requested${r.waitingFor ? ` · ${r.waitingFor}` : ""}`);
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
      {!remote && <p className="border-b border-xo-line px-4 py-2 text-[11px] text-xo-faint">Versions are kept in this browser. Review and approval need a signed-in account; they are checked on the server.</p>}
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
              {(() => {
                const c = certs.get(s.version.id);
                if (!c) return null;
                if (c.state === "certified") return (
                  <span className="inline-flex items-center gap-1.5 rounded-sm border border-xo-verified/40 px-1.5 py-0.5 text-[11px] font-semibold text-xo-verified" title={c.integritySha256 ? `integrity ${c.integritySha256}` : undefined}>
                    Certified · <span className="font-mono">{c.recordId}</span>
                    {c.verifyUrl && <a href={c.verifyUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">Verify ↗</a>}
                  </span>);
                return <span className={c.state === "failed" ? "text-xo-risk" : "text-xo-caution"}>{c.state === "failed" ? `Certification failed${c.error ? `: ${c.error}` : ""}` : "Certification requested"}</span>;
              })()}
              <span className="ml-auto flex flex-wrap gap-1.5">
                {s.status !== "superseded" && <button type="button" className={BTN} disabled={busy} onClick={() => void pdf(s)}>Download PDF</button>}
                {remote && certifiable && mine(s) && s.status === "approved" && (!certs.get(s.version.id) || certs.get(s.version.id)!.state === "failed") && <button type="button" className={BTN} disabled={busy} onClick={() => void certify(s, "certify")} title="Register this approved version with Sovereign Dispatch: a permanent record number, a public verification page and preservation">Certify</button>}
                {remote && certs.get(s.version.id)?.state === "requested" && <button type="button" className={BTN} disabled={busy} onClick={() => void certify(s, "status")}>Check certification</button>}
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
