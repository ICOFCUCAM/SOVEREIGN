import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveVersion, listVersions, reviewAction, logEvent, type Remote } from "./store";
import type { DocumentVersion } from "./service";

beforeEach(() => {
  const m = new Map<string, string>();
  (globalThis as { localStorage?: unknown }).localStorage = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
});

const v = (id: string): DocumentVersion => ({
  id, typeId: "exitos.cim", registrySchemaVersion: "1.0.0", templateVersion: "t", producedBy: "p", companyId: "co-1", transactionId: null,
  generatedAt: "2026-10-13T00:00:00Z", generatedBy: "a@b.co", status: "draft", sourceHash: "b".repeat(64), contentHash: "a".repeat(64),
  inputs: {}, unconfirmedInputs: [], disclosure: [], ddm: { ddmVersion: "1.0", docType: "proposal_package", sections: [] },
});

describe("document versions in this browser (no signed-in account)", () => {
  it("numbers versions and supersedes the previous one", async () => {
    await saveVersion(v("v1"));
    await saveVersion(v("v2"));
    const list = await listVersions("exitos.cim", "co-1");
    expect(list.map((s) => [s.version.id, s.version.versionNumber, s.status])).toEqual([["v2", 2, "draft"], ["v1", 1, "superseded"]]);
  });
  it("cannot be reviewed or approved: that needs the server's roles", async () => {
    await expect(reviewAction("v1", "approve")).rejects.toThrow(/signed-in account/);
  });
});

describe("document versions on the server", () => {
  const remote = (fetchImpl: typeof fetch): Remote => ({ url: "https://p.supabase.co", anonKey: "anon", accessToken: "tok", fetchImpl });

  it("saves a draft with the type's classification and counsel requirement, under the user's own token", async () => {
    const calls: Array<[string, RequestInit]> = [];
    const f = vi.fn(async (url: string, init: RequestInit = {}) => { calls.push([url, init]); return new Response(url.includes("select=") ? "[]" : "{}", { status: url.includes("select=") ? 200 : 201 }); });
    await saveVersion(v("v1"), remote(f as unknown as typeof fetch));
    const insert = calls.find(([u, i]) => u.endsWith("/exitos_document_versions") && i.method === "POST")!;
    const body = JSON.parse(String(insert[1].body));
    expect(body).toMatchObject({ id: "v1", type_id: "exitos.cim", version: 1, status: "draft", classification: "confidential_nda", requires_counsel: false });
    expect((insert[1].headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(calls.some(([u, i]) => u.endsWith("/exitos_document_events") && JSON.parse(String(i.body)).action === "generated")).toBe(true);
  });

  it("asks the server to take a review step and reports its refusal", async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ message: "approval needs an approver grant" }), { status: 400 }));
    await expect(reviewAction("v1", "approve", remote(f as unknown as typeof fetch))).rejects.toThrow(/approver grant/);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://p.supabase.co/rest/v1/rpc/exitos_document_action");
    expect(JSON.parse(String(init.body))).toEqual({ p_version_id: "v1", p_action: "approve", p_note: null });
  });

  it("logs only owner events through the API", async () => {
    const f = vi.fn(async () => new Response(null, { status: 201 }));
    await logEvent("v1", "downloaded", remote(f as unknown as typeof fetch));
    expect(JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body))).toMatchObject({ version_id: "v1", action: "downloaded" });
  });
});
