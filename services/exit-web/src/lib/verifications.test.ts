import { describe, it, expect, vi } from "vitest";
import { fetchVerifications, recordVerification, revokeVerification, findReviewer } from "./verifications";

const remoteWith = (body: unknown, status = 200) => {
  const f = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  return { f, remote: { url: "https://x.supabase.co", anonKey: "anon", accessToken: "tok", fetchImpl: f as unknown as typeof fetch } };
};
const row = {
  id: "v1", claim: "figure:arrUsd", claim_value: 4_200_000, reviewer_name: "A. Reviewer", reviewer_role: "Chartered accountant", competence: "financial",
  evidence: [{ description: "Contract register at 30 Sep 2026" }], scope: "ARR at 30 September 2026", limitations: null, verified_at: "2026-10-01T00:00:00Z",
  expires_at: "2027-01-01T00:00:00Z", revalidate_when: "next month-end close", revoked_at: null, stale_at: null, owner_account_id: "o1", company_id: "co-1",
};

describe("verification client", () => {
  it("reads a company's verifications and maps every required field", async () => {
    const { f, remote } = remoteWith([row]);
    const [v] = await fetchVerifications("co-1", remote);
    expect(String(f.mock.calls[0]?.[0 as never])).toContain("exitos_verifications?company_id=eq.co-1");
    expect(v).toEqual({ id: "v1", claim: "figure:arrUsd", value: 4_200_000, reviewer: "A. Reviewer", role: "Chartered accountant", competence: "financial",
      evidence: row.evidence, scope: row.scope, verifiedAt: row.verified_at, expiresAt: row.expires_at, revalidateWhen: row.revalidate_when });
    expect(v).not.toHaveProperty("limitations");
  });
  it("records a verification only through the checked server function, with evidence, scope and expiry", async () => {
    const { f, remote } = remoteWith("uuid-1");
    const id = await recordVerification({ ownerId: "o1", companyId: "co-1", claim: "figure:arrUsd", competence: "financial", scope: "ARR",
      evidence: [{ description: "Register" }], expiresAt: "2027-01-01T00:00:00.000Z" }, remote);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(id).toBe("uuid-1");
    expect(url).toBe("https://x.supabase.co/rest/v1/rpc/exitos_record_verification");
    expect(JSON.parse(String(init.body))).toEqual({ p_owner: "o1", p_company: "co-1", p_claim: "figure:arrUsd", p_competence: "financial", p_scope: "ARR",
      p_evidence: [{ description: "Register" }], p_limitations: null, p_revalidate_when: null, p_expires: "2027-01-01T00:00:00.000Z" });
  });
  it("surfaces the server's refusal (self-verification, no engagement, no evidence)", async () => {
    const { remote } = remoteWith({ message: "a founder cannot verify their own claims" }, 400);
    await expect(recordVerification({ ownerId: "o1", companyId: "co-1", claim: "figure:arrUsd", competence: "financial", scope: "ARR", evidence: [] }, remote))
      .rejects.toThrow("a founder cannot verify their own claims");
  });
  it("withdraws a verification with a reason, and finds reviewers only by the authorised-reviewer lookup", async () => {
    const { f, remote } = remoteWith(null);
    await revokeVerification("v1", "withdrawn", remote);
    expect(String(f.mock.calls[0]?.[0 as never])).toContain("rpc/exitos_revoke_verification");
    const r2 = remoteWith([]);
    expect(await findReviewer("x@y.z", r2.remote)).toEqual([]);
    expect(String(r2.f.mock.calls[0]?.[0 as never])).toContain("rpc/exitos_reviewer_by_email");
  });
});
