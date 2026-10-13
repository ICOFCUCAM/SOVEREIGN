import { useEffect, useState } from "react";
import type { ClaimKey, Competence, CompanyStory, Verification } from "@exit/engines";
import type { Remote } from "./documents/store";
import { useDocumentRemote } from "./documents/remote";

// ── INDEPENDENT VERIFICATION (client) ───────────────────────────────
// Reads and writes the verification model in exitos_company_stories' migration:
// an owner engages an authorised reviewer for a competence; the reviewer records
// verifications through exitos_record_verification(), which the server checks.
// Nothing here can make a figure verified on its own: without a signed-in
// account there are no verifications at all.

const h = (r: Remote): Record<string, string> => ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": "application/json" });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? fetch;
async function json<T>(res: Response, what: string): Promise<T> {
  const body = await res.json().catch(() => null) as unknown;
  if (!res.ok) throw new Error(`${what}: ${(body as { message?: string } | null)?.message ?? res.status}`);
  return body as T;
}
const rpc = async <T>(r: Remote, fn: string, args: Record<string, unknown>, what: string): Promise<T> =>
  json<T>(await f(r)(`${r.url}/rest/v1/rpc/${fn}`, { method: "POST", headers: h(r), body: JSON.stringify(args) }), what);

interface Row {
  id: string; claim: ClaimKey; claim_value: unknown; reviewer_name: string; reviewer_role: string; competence: Competence;
  evidence: Verification["evidence"]; scope: string; limitations: string | null; verified_at: string;
  expires_at: string | null; revalidate_when: string | null; revoked_at: string | null; stale_at: string | null;
  owner_account_id: string; company_id: string;
}
const toVerification = (x: Row): Verification => ({
  id: x.id, claim: x.claim, value: x.claim_value, reviewer: x.reviewer_name, role: x.reviewer_role, competence: x.competence,
  evidence: x.evidence, scope: x.scope, verifiedAt: x.verified_at,
  ...(x.limitations ? { limitations: x.limitations } : {}), ...(x.expires_at ? { expiresAt: x.expires_at } : {}),
  ...(x.revalidate_when ? { revalidateWhen: x.revalidate_when } : {}), ...(x.revoked_at ? { revokedAt: x.revoked_at } : {}),
  ...(x.stale_at ? { staleAt: x.stale_at } : {}),
});

/** The verifications recorded for a company (visible to its owner and to the reviewers who recorded them). */
export async function fetchVerifications(companyId: string, r: Remote): Promise<Verification[]> {
  const rows = await json<Row[]>(await f(r)(`${r.url}/rest/v1/exitos_verifications?company_id=eq.${encodeURIComponent(companyId)}&select=*&order=verified_at.desc`, { headers: h(r) }), "Reading verifications");
  return rows.map(toVerification);
}

/** The signed-in owner's verifications for a company, or none (signed out: nothing is verified). */
export function useVerifications(companyId: string | null): Verification[] {
  const remote = useDocumentRemote();
  const [v, setV] = useState<Verification[]>([]);
  useEffect(() => {
    if (!remote || !companyId) { setV([]); return; }
    let alive = true;
    void fetchVerifications(companyId, remote).then((x) => { if (alive) setV(x); }).catch(() => { if (alive) setV([]); });
    return () => { alive = false; };
  }, [remote, companyId]);
  return v;
}

export interface ReviewerMatch { account_id: string; competence: Competence; reviewer_name: string; reviewer_role: string }
/** Authorised reviewers registered under an e-mail address (nobody else is found). */
export const findReviewer = (email: string, r: Remote): Promise<ReviewerMatch[]> => rpc<ReviewerMatch[]>(r, "exitos_reviewer_by_email", { p_email: email }, "Finding the reviewer");

export interface Engagement { id: string; owner_account_id: string; company_id: string; reviewer_account_id: string; competence: Competence; granted_at: string; revoked_at: string | null }
export async function listEngagements(r: Remote): Promise<Engagement[]> {
  return json<Engagement[]>(await f(r)(`${r.url}/rest/v1/exitos_review_engagements?select=*&order=granted_at.desc`, { headers: h(r) }), "Reading engagements");
}
export async function engageReviewer(companyId: string, reviewerId: string, competence: Competence, r: Remote): Promise<void> {
  await json(await f(r)(`${r.url}/rest/v1/exitos_review_engagements`, { method: "POST", headers: { ...h(r), Prefer: "return=minimal" },
    body: JSON.stringify({ company_id: companyId, reviewer_account_id: reviewerId, competence }) }), "Engaging the reviewer").catch((e: Error) => { if (!/Unexpected end|JSON/.test(e.message)) throw e; });
}
export async function revokeEngagement(id: string, r: Remote): Promise<void> {
  const res = await f(r)(`${r.url}/rest/v1/exitos_review_engagements?id=eq.${id}`, { method: "PATCH", headers: { ...h(r), Prefer: "return=minimal" }, body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
  if (!res.ok) throw new Error(`Ending the engagement: ${res.status}`);
}

export interface Authorization { account_id: string; competence: Competence; reviewer_name: string; reviewer_role: string; expires_at: string | null; revoked_at: string | null }
/** The signed-in reviewer's own authorisations (empty for everyone else). */
export async function myAuthorizations(r: Remote): Promise<Authorization[]> {
  return json<Authorization[]>(await f(r)(`${r.url}/rest/v1/exitos_reviewer_authorizations?select=*&revoked_at=is.null`, { headers: h(r) }), "Reading authorisations");
}

/** A story the signed-in reviewer has been engaged to review. */
export async function storyForReview(ownerId: string, companyId: string, r: Remote): Promise<CompanyStory | null> {
  const rows = await json<Array<{ data: CompanyStory }>>(await f(r)(`${r.url}/rest/v1/exitos_company_stories?owner_account_id=eq.${ownerId}&company_id=eq.${encodeURIComponent(companyId)}&select=data`, { headers: h(r) }), "Reading the story");
  return rows[0]?.data ?? null;
}

export interface RecordArgs {
  ownerId: string; companyId: string; claim: ClaimKey; competence: Competence; scope: string;
  evidence: Array<{ description: string; sourceId?: string }>; limitations?: string; revalidateWhen?: string; expiresAt?: string;
}
/** Record a verification. The server refuses it unless the caller is authorised, engaged, not the owner, and gives evidence and scope. */
export const recordVerification = (a: RecordArgs, r: Remote): Promise<string> => rpc<string>(r, "exitos_record_verification", {
  p_owner: a.ownerId, p_company: a.companyId, p_claim: a.claim, p_competence: a.competence, p_scope: a.scope,
  p_evidence: a.evidence, p_limitations: a.limitations ?? null, p_revalidate_when: a.revalidateWhen ?? null, p_expires: a.expiresAt ?? null,
}, "Recording the verification");
export const revokeVerification = (id: string, reason: string, r: Remote): Promise<void> => rpc<void>(r, "exitos_revoke_verification", { p_id: id, p_reason: reason }, "Withdrawing the verification");
