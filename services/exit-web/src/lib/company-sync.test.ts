import { describe, it, expect } from "vitest";
import { mergeCompanies, saveRemoteCompany, deleteRemoteCompany, type RemoteCompany } from "./company-sync.js";
import { SAMPLE_INTAKE } from "./company-intake.js";
import type { IntakeRecord } from "./active-company.js";

const rec = (id: string, name: string, updatedAt?: string): IntakeRecord => ({ id, inputs: { ...SAMPLE_INTAKE, name }, provided: ["name"], ...(updatedAt ? { updatedAt } : {}) });
const row = (id: string, name: string, updated_at: string): RemoteCompany => ({ company_id: id, inputs: { ...SAMPLE_INTAKE, name }, provided: ["name"], updated_at });

describe("a founder's companies across devices", () => {
  it("adds the account's companies this browser lacks, and uploads the ones it never synced", () => {
    const m = mergeCompanies([rec("co-local-00001", "Local Co", "2026-10-15T10:00:00Z")], [], [row("co-remote-0001", "Remote Co", "2026-10-15T09:00:00Z")]);
    expect(m.records.map((r) => r.inputs.name)).toEqual(["Local Co", "Remote Co"]);
    expect(m.upload.map((r) => r.id)).toEqual(["co-local-00001"]);
    expect(m.synced).toEqual(["co-local-00001", "co-remote-0001"]);
  });
  it("where both have a company, the newer copy wins", () => {
    const older = mergeCompanies([rec("co-same-000001", "Old name", "2026-10-15T08:00:00Z")], ["co-same-000001"], [row("co-same-000001", "New name", "2026-10-15T09:00:00Z")]);
    expect(older.records[0]!.inputs.name).toBe("New name");
    expect(older.upload).toHaveLength(0);
    const newer = mergeCompanies([rec("co-same-000001", "Edited here", "2026-10-15T10:00:00Z")], ["co-same-000001"], [row("co-same-000001", "On account", "2026-10-15T09:00:00Z")]);
    expect(newer.records[0]!.inputs.name).toBe("Edited here");
    expect(newer.upload.map((r) => r.id)).toEqual(["co-same-000001"]);
  });
  it("a company removed on another device is removed here, not uploaded again", () => {
    const m = mergeCompanies([rec("co-gone-000001", "Removed elsewhere", "2026-10-15T10:00:00Z")], ["co-gone-000001"], []);
    expect(m.records).toHaveLength(0);
    expect(m.upload).toHaveLength(0);
  });
  it("saves with an upsert on the owner and company, and deletes by company id", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const remote = { url: "https://db.example", anonKey: "k", accessToken: "t", fetchImpl: (async (url: string, init: RequestInit) => { calls.push({ url, init }); return new Response(null, { status: 201 }); }) as typeof fetch };
    await saveRemoteCompany(remote, rec("co-save-000001", "Saved"));
    await deleteRemoteCompany(remote, "co-save-000001");
    expect(calls[0]!.url).toBe("https://db.example/rest/v1/exitos_company_intakes?on_conflict=owner_account_id,company_id");
    expect((calls[0]!.init.headers as Record<string, string>).Prefer).toContain("merge-duplicates");
    expect(JSON.parse(String(calls[0]!.init.body))).toMatchObject({ company_id: "co-save-000001", provided: ["name"] });
    expect(JSON.parse(String(calls[0]!.init.body))).not.toHaveProperty("owner_account_id");
    expect(calls[1]!.url).toBe("https://db.example/rest/v1/exitos_company_intakes?company_id=eq.co-save-000001");
    expect(calls[1]!.init.method).toBe("DELETE");
  });
});
