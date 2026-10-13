import type { DocumentVersion, ReviewStatus } from "./service";
import { documentType } from "./registry";

// ── DOCUMENT VERSIONS STORE ─────────────────────────────────────────
// A signed-in account keeps its versions in exitos_document_versions, where
// they are immutable and their review status moves only through
// exitos_document_action() (which checks server-held roles). Without a
// verified session (a development build) versions stay in this browser, and
// review is unavailable: there is nobody the server could recognise as an
// approver or counsel.

export type ReviewAction = "submit" | "withdraw" | "send_to_counsel" | "counsel_reviewed" | "approve";
export interface StoredVersion { readonly version: DocumentVersion & { readonly versionNumber: number }; readonly status: ReviewStatus }

export interface Remote { readonly url: string; readonly anonKey: string; readonly accessToken: string; readonly fetchImpl?: typeof fetch }

const LOCAL = "exitos.documentVersions.v1";
const readLocal = (): Array<StoredVersion> => { try { return JSON.parse(localStorage.getItem(LOCAL) ?? "[]") as StoredVersion[]; } catch { return []; } };
const writeLocal = (v: StoredVersion[]): void => { try { localStorage.setItem(LOCAL, JSON.stringify(v.slice(-200))); } catch { /* storage full or unavailable */ } };

const headers = (r: Remote, extra: Record<string, string> = {}): Record<string, string> =>
  ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": "application/json", ...extra });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? globalThis.fetch;
async function ok(res: Response, what: string): Promise<unknown> {
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${what}: ${(body as { message?: string } | null)?.message ?? res.status}`);
  return body;
}

/** Versions of one type for one company, newest first. */
export async function listVersions(typeId: string, companyId: string | null, remote?: Remote): Promise<StoredVersion[]> {
  if (!remote) return readLocal().filter((s) => s.version.typeId === typeId && s.version.companyId === companyId).sort((a, b) => b.version.versionNumber - a.version.versionNumber);
  const q = `type_id=eq.${encodeURIComponent(typeId)}&${companyId ? `company_id=eq.${encodeURIComponent(companyId)}` : "company_id=is.null"}&select=data,status,version&order=version.desc`;
  const rows = (await ok(await f(remote)(`${remote.url}/rest/v1/exitos_document_versions?${q}`, { headers: headers(remote) }), "Reading versions")) as Array<{ data: DocumentVersion; status: ReviewStatus; version: number }>;
  return rows.map((r) => ({ version: { ...r.data, versionNumber: r.version, status: r.status }, status: r.status }));
}

/** Save a new version (always a draft). Its number follows the latest for the type and company. */
export async function saveVersion(v: DocumentVersion, remote?: Remote): Promise<StoredVersion> {
  const prior = await listVersions(v.typeId, v.companyId, remote);
  const versionNumber = (prior[0]?.version.versionNumber ?? 0) + 1;
  const stored: StoredVersion = { version: { ...v, versionNumber }, status: "draft" };
  if (!remote) {
    writeLocal([...readLocal().map((s) => (s.version.typeId === v.typeId && s.version.companyId === v.companyId && s.status !== "superseded" ? { ...s, status: "superseded" as const } : s)), stored]);
    return stored;
  }
  const t = documentType(v.typeId);
  await ok(await f(remote)(`${remote.url}/rest/v1/exitos_document_versions`, {
    method: "POST", headers: headers(remote, { Prefer: "return=representation" }),
    body: JSON.stringify({
      id: v.id, company_id: v.companyId, type_id: v.typeId, version: versionNumber, status: "draft",
      requires_counsel: t.reviewRequired === "counsel", classification: t.classification,
      content_hash: v.contentHash, source_hash: v.sourceHash, data: v,
    }),
  }), "Saving the version");
  await logEvent(v.id, "generated", remote);
  return stored;
}

/** Log what the owner did with their own version (download, PDF requested). */
export async function logEvent(versionId: string, action: "generated" | "downloaded" | "rendered_pdf", remote?: Remote, detail: Record<string, unknown> = {}): Promise<void> {
  if (!remote) return;
  await f(remote)(`${remote.url}/rest/v1/exitos_document_events`, {
    method: "POST", headers: headers(remote, { Prefer: "return=minimal" }),
    body: JSON.stringify({ version_id: versionId, action, detail }),
  }).catch(() => undefined);
}

/** A review step. The server decides whether this person may take it. */
export async function reviewAction(versionId: string, action: ReviewAction, remote?: Remote, note?: string): Promise<ReviewStatus> {
  if (!remote) throw new Error("Review needs a signed-in account: approvals and counsel review are checked on the server.");
  const res = await f(remote)(`${remote.url}/rest/v1/rpc/exitos_document_action`, {
    method: "POST", headers: headers(remote), body: JSON.stringify({ p_version_id: versionId, p_action: action, p_note: note ?? null }),
  });
  return (await ok(res, "Review step refused")) as ReviewStatus;
}
