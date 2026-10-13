import type { Remote } from "./documents/store";

// ── NDA LIFECYCLE (client) ──────────────────────────────────────────
// Thin wrappers over the server functions in 20261014120000_exitos_nda_lifecycle.sql.
// Nothing here decides a state: issuing, signing, verifying, execution, termination,
// revocation and every buyer file access are checked by the database, as the signed-in
// account. Without a signed-in account there is no NDA lifecycle at all.

export type NdaAgreementState = "issued" | "executed" | "withdrawn" | "terminated" | "revoked";
export type NdaEffectiveState = NdaAgreementState | "expired";
export type SigningMethod = "external_esign" | "wet_ink_scan" | "in_app_typed";
export type Party = "seller" | "buyer";

export interface NdaAgreement {
  id: string; listing_id: string; company_id: string; transaction_id: string | null;
  owner_account_id: string; buyer_account_id: string; nda_request_id: string;
  title: string; document_version: string; document_origin: "exitos_template" | "seller_supplied";
  document_text: string; document_sha256: string; shape: "mutual" | "one_way_seller_discloses"; required_signers: Party[];
  access_term_months: number; survival_months: number; scope_room_kinds: string[] | null;
  state: NdaAgreementState; issued_at: string; executed_at: string | null; access_until: string | null;
  ended_at: string | null; ended_by: string | null; end_reason: string | null;
}
export interface NdaSignature {
  id: string; agreement_id: string; party: Party; signer_account_id: string; signatory_name: string;
  signatory_title: string | null; signatory_email: string | null; method: SigningMethod; signed_document_sha256: string;
  evidence: Record<string, unknown>; signed_at: string; recorded_at: string;
  verification: "pending" | "verified" | "rejected"; verified_by: string | null; verified_at: string | null; verification_note: string | null;
}
export interface NdaEvent { id: number; agreement_id: string; at: string; actor: string | null; action: string; details: Record<string, unknown> }
export interface BuyerRoomFile { id: string; room_kind: string; filename: string; mime: string; bytes: number; artifact_id: string | null; classification: string; uploaded_at: string }

/** The state that governs access now: an executed NDA whose access term has passed is expired. */
export function effectiveState(a: Pick<NdaAgreement, "state" | "access_until">, now = new Date()): NdaEffectiveState {
  return a.state === "executed" && a.access_until && new Date(a.access_until) <= now ? "expired" : a.state;
}

/** Signatures still needed before the NDA executes: required parties without a verified signature. */
export function outstanding(a: Pick<NdaAgreement, "required_signers">, sigs: readonly NdaSignature[]): Party[] {
  return a.required_signers.filter((p) => !sigs.some((s) => s.party === p && s.verification === "verified"));
}

/** SHA-256 of the exact document text, hex, as the server computes it (UTF-8). */
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const h = (r: Remote): Record<string, string> => ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": "application/json" });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? fetch;
async function json<T>(res: Response, what: string): Promise<T> {
  const body = await res.json().catch(() => null) as unknown;
  if (!res.ok) throw new Error(`${what}: ${(body as { message?: string; error?: string } | null)?.message ?? (body as { error?: string } | null)?.error ?? res.status}`);
  return body as T;
}
const rpc = async <T>(r: Remote, fn: string, args: Record<string, unknown>, what: string): Promise<T> =>
  json<T>(await f(r)(`${r.url}/rest/v1/rpc/${fn}`, { method: "POST", headers: h(r), body: JSON.stringify(args) }), what);
const rows = async <T>(r: Remote, path: string, what: string): Promise<T[]> => json<T[]>(await f(r)(`${r.url}/rest/v1/${path}`, { headers: h(r) }), what);

/** The NDAs the signed-in account is a party to, with their signatures and audit events. */
export async function loadNdas(r: Remote): Promise<{ agreements: NdaAgreement[]; signatures: NdaSignature[]; events: NdaEvent[] }> {
  const agreements = await rows<NdaAgreement>(r, "exitos_nda_agreements?select=*&order=issued_at.desc", "Reading NDAs");
  if (!agreements.length) return { agreements, signatures: [], events: [] };
  const ids = `(${agreements.map((a) => a.id).join(",")})`;
  const [signatures, events] = await Promise.all([
    rows<NdaSignature>(r, `exitos_nda_signatures?agreement_id=in.${ids}&select=*&order=recorded_at.asc`, "Reading signatures"),
    rows<NdaEvent>(r, `exitos_nda_events?agreement_id=in.${ids}&select=*&order=at.asc`, "Reading the audit trail"),
  ]);
  return { agreements, signatures, events };
}

export interface IssueArgs {
  listingId: string; companyId: string; buyerAccountId: string; requestId: string; title: string; version: string;
  origin: NdaAgreement["document_origin"]; shape: NdaAgreement["shape"]; text: string; accessTermMonths: number; survivalMonths: number; scope: string[] | null;
}
export const issueNda = (a: IssueArgs, r: Remote): Promise<string> => rpc<string>(r, "exitos_nda_issue", {
  p_listing: a.listingId, p_company: a.companyId, p_buyer: a.buyerAccountId, p_request: a.requestId, p_title: a.title, p_version: a.version,
  p_origin: a.origin, p_shape: a.shape, p_text: a.text, p_access_term_months: a.accessTermMonths, p_survival_months: a.survivalMonths, p_scope: a.scope,
}, "Issuing the NDA");

export interface SignArgs {
  agreementId: string; party: Party; name: string; title?: string; email?: string; method: SigningMethod;
  /** The SHA-256 of the document the signatory signed; the server refuses anything but the issued version. */
  signedSha256: string; evidence: Record<string, unknown>; signedAt: string;
}
export const recordSignature = (a: SignArgs, r: Remote): Promise<string> => rpc<string>(r, "exitos_nda_sign", {
  p_agreement: a.agreementId, p_party: a.party, p_name: a.name, p_title: a.title ?? null, p_email: a.email ?? null, p_method: a.method,
  p_signed_sha256: a.signedSha256, p_evidence: a.evidence, p_signed_at: a.signedAt,
}, "Recording the signature");
export const verifySignature = (signatureId: string, decision: "verified" | "rejected", note: string, r: Remote): Promise<"issued" | "executed"> =>
  rpc(r, "exitos_nda_verify_signature", { p_signature: signatureId, p_decision: decision, p_note: note || null }, "Reviewing the signature");
export const withdrawNda = (id: string, reason: string, r: Remote): Promise<void> => rpc(r, "exitos_nda_withdraw", { p_agreement: id, p_reason: reason }, "Withdrawing the NDA");
export const terminateNda = (id: string, reason: string, r: Remote): Promise<void> => rpc(r, "exitos_nda_terminate", { p_agreement: id, p_reason: reason }, "Terminating the NDA");
export const revokeNdaAccess = (id: string, reason: string, r: Remote): Promise<void> => rpc(r, "exitos_nda_revoke_access", { p_agreement: id, p_reason: reason }, "Revoking access");
/** The seller marks one of its data-room files as visible to buyers under an executed NDA (or not). */
export const setDisclosure = (documentId: string, disclosure: "seller_only" | "post_nda", r: Remote): Promise<void> =>
  rpc(r, "exit_data_room_set_disclosure", { p_document: documentId, p_disclosure: disclosure }, "Changing what buyers may see");

/** The seller's files disclosed to the signed-in buyer under this NDA (re-checked by the server on every call). */
export async function buyerRoomFiles(agreementId: string, r: Remote): Promise<BuyerRoomFile[]> {
  const body = await json<{ ok: boolean; items?: BuyerRoomFile[] }>(await f(r)(`${r.url}/functions/v1/exit-doc-buyer?agreement=${encodeURIComponent(agreementId)}`, { headers: h(r) }), "Opening the data room");
  return body.items ?? [];
}
/** A 60-second download link for one disclosed file (re-checked by the server). */
export async function buyerDownloadLink(agreementId: string, fileId: string, r: Remote): Promise<string> {
  const body = await json<{ ok: boolean; url?: string }>(await f(r)(`${r.url}/functions/v1/exit-doc-buyer`, { method: "POST", headers: h(r), body: JSON.stringify({ agreement: agreementId, file: fileId }) }), "Downloading the file");
  if (!body.url) throw new Error("Downloading the file: no link");
  return body.url;
}
