import { describe, it, expect } from "vitest";
import { CERTIFIABLE_TYPES, certifyVersion, loadCertificates } from "./certificate";
import { CERTIFIABLE_TYPES as SERVER_TYPES } from "../../../../../supabase/functions/exit-dispatch-submit/certify.mjs";
import { documentType } from "./registry";

const remote = (respond: (url: string, init: RequestInit) => Response) => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  return { calls, r: { url: "https://x.supabase.co", anonKey: "anon", accessToken: "tok", fetchImpl: (async (url: string, init: RequestInit) => { calls.push({ url, init }); return respond(url, init); }) as typeof fetch } };
};

describe("certified documents", () => {
  it("the browser offers exactly the types the function certifies, all of them deal documents for the parties", () => {
    expect([...CERTIFIABLE_TYPES].sort()).toEqual([...(SERVER_TYPES as Set<string>)].sort());
    for (const t of CERTIFIABLE_TYPES) expect(documentType(t).audience, t).toBe("parties");
    expect(CERTIFIABLE_TYPES.has("exitos.cim")).toBe(false);
  });
  it("asks the function with the caller's token and the version, and reads its answer", async () => {
    const { calls, r } = remote(() => new Response(JSON.stringify({ configured: true, ok: true, certificate: { state: "certified", recordId: "SD-2026-00000013", verifyUrl: "https://d.example/verify/SD-2026-00000013" }, waitingFor: null }), { status: 200 }));
    const res = await certifyVersion(r, "v-1", "certify");
    expect(calls[0]!.url).toBe("https://x.supabase.co/functions/v1/exit-dispatch-submit");
    expect(JSON.parse(String(calls[0]!.init.body))).toEqual({ versionId: "v-1", action: "certify" });
    expect((calls[0]!.init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(res.ok && res.certificate?.recordId).toBe("SD-2026-00000013");
  });
  it("says so when certification is not connected, and never reports success it did not get", async () => {
    const off = await certifyVersion(remote(() => new Response(JSON.stringify({ configured: false, error: "not connected" }))).r, "v", "certify");
    expect(off).toEqual({ ok: false, configured: false, error: "not connected" });
    const refused = await certifyVersion(remote(() => new Response(JSON.stringify({ error: "only an approved version can be certified" }), { status: 409 })).r, "v", "certify");
    expect(refused.ok).toBe(false);
  });
  it("reads the caller's certificates by version id", async () => {
    const { calls, r } = remote(() => new Response(JSON.stringify([{ version_id: "v-1", state: "requested", record_id: null, requested_at: "2026-10-16T00:00:00Z" }])));
    const m = await loadCertificates(r, ["v-1", "v-2"]);
    expect(decodeURIComponent(calls[0]!.url)).toContain('version_id=in.("v-1","v-2")');
    expect(m.get("v-1")?.state).toBe("requested");
    expect(m.has("v-2")).toBe(false);
  });
});
