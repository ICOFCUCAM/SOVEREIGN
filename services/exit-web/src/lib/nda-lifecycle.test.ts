import { describe, it, expect, vi } from "vitest";
import { effectiveState, outstanding, sha256Hex, recordSignature, verifySignature, buyerRoomFiles, buyerDownloadLink, type NdaSignature } from "./nda-lifecycle";

const remoteWith = (respond: (url: string, init?: RequestInit) => Response) => {
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => { calls.push({ url: String(url), method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : null }); return respond(String(url), init); });
  return { calls, remote: { url: "https://x.supabase.co", anonKey: "anon", accessToken: "tok", fetchImpl: fetchImpl as unknown as typeof fetch } };
};
const sig = (party: "seller" | "buyer", verification: NdaSignature["verification"]): NdaSignature => ({
  id: party, agreement_id: "a", party, signer_account_id: party, signatory_name: party, signatory_title: null, signatory_email: null, method: "in_app_typed",
  signed_document_sha256: "x", evidence: {}, signed_at: "t", recorded_at: "t", verification, verified_by: null, verified_at: null, verification_note: null,
});

describe("NDA lifecycle client", () => {
  it("treats an executed NDA past its access term as expired, and nothing else", () => {
    const now = new Date("2026-10-14T00:00:00Z");
    expect(effectiveState({ state: "executed", access_until: "2026-10-13T00:00:00Z" }, now)).toBe("expired");
    expect(effectiveState({ state: "executed", access_until: "2027-10-13T00:00:00Z" }, now)).toBe("executed");
    expect(effectiveState({ state: "revoked", access_until: "2027-10-13T00:00:00Z" }, now)).toBe("revoked");
  });
  it("execution needs a verified signature from every required party (pending or rejected do not count)", () => {
    const a = { required_signers: ["seller", "buyer"] as ("seller" | "buyer")[] };
    expect(outstanding(a, [])).toEqual(["seller", "buyer"]);
    expect(outstanding(a, [sig("buyer", "verified"), sig("seller", "pending")])).toEqual(["seller"]);
    expect(outstanding(a, [sig("buyer", "verified"), sig("seller", "rejected")])).toEqual(["seller"]);
    expect(outstanding(a, [sig("buyer", "verified"), sig("seller", "verified")])).toEqual([]);
  });
  it("hashes the document text as UTF-8 SHA-256, as the server does", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
  it("records a signature and a review through the checked server functions, and surfaces refusals", async () => {
    const { calls, remote } = remoteWith((url) => url.includes("verify") ? new Response(JSON.stringify("executed"), { status: 200 }) : new Response(JSON.stringify("sig-1"), { status: 200 }));
    expect(await recordSignature({ agreementId: "a", party: "buyer", name: "Bea", method: "in_app_typed", signedSha256: "h", evidence: { typedName: "Bea" }, signedAt: "2026-10-14T00:00:00Z" }, remote)).toBe("sig-1");
    expect(calls[0]).toMatchObject({ url: "https://x.supabase.co/rest/v1/rpc/exitos_nda_sign", body: { p_agreement: "a", p_party: "buyer", p_signed_sha256: "h", p_method: "in_app_typed" } });
    expect(await verifySignature("sig-1", "verified", "", remote)).toBe("executed");
    const refused = remoteWith(() => new Response(JSON.stringify({ message: "the signed document differs from the issued version" }), { status: 400 }));
    await expect(recordSignature({ agreementId: "a", party: "buyer", name: "Bea", method: "in_app_typed", signedSha256: "x", evidence: {}, signedAt: "t" }, refused.remote)).rejects.toThrow("differs from the issued version");
  });
  it("opens the buyer's room and downloads only through the server function, which may refuse", async () => {
    const ok = remoteWith((_u, init) => init?.method === "POST" ? new Response(JSON.stringify({ ok: true, url: "https://signed/1", expiresIn: 60 }), { status: 200 }) : new Response(JSON.stringify({ ok: true, items: [{ id: "f1" }] }), { status: 200 }));
    expect((await buyerRoomFiles("a", ok.remote)).map((x) => x.id)).toEqual(["f1"]);
    expect(await buyerDownloadLink("a", "f1", ok.remote)).toBe("https://signed/1");
    expect(ok.calls.map((c) => `${c.method} ${c.url}`)).toEqual(["GET https://x.supabase.co/functions/v1/exit-doc-buyer?agreement=a", "POST https://x.supabase.co/functions/v1/exit-doc-buyer"]);
    const denied = remoteWith(() => new Response(JSON.stringify({ ok: false, error: "access needs an executed NDA inside its access term" }), { status: 403 }));
    await expect(buyerRoomFiles("a", denied.remote)).rejects.toThrow("executed NDA");
  });
});
