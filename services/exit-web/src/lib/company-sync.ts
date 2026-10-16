import type { Remote } from "./documents/store";
import type { IntakeRecord } from "./active-company";

// ── A FOUNDER'S COMPANIES ON THEIR ACCOUNT ──────────────────────────
// Each company's intake kept on the founder's account (exitos_company_intakes), so their companies follow
// them across devices. The server makes the caller the owner of every row and lets nobody else read it.
// Without a server account the companies stay in this browser.

export interface RemoteCompany { readonly company_id: string; readonly inputs: Record<string, unknown>; readonly provided: string[]; readonly updated_at: string }

const TABLE = "exitos_company_intakes";
const h = (r: Remote, extra: Record<string, string> = {}): Record<string, string> => ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, "content-type": "application/json", ...extra });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? fetch;
async function ok(res: Response, what: string): Promise<void> {
  if (res.ok) return;
  const body = await res.json().catch(() => null) as { message?: string } | null;
  throw new Error(`${what}: ${body?.message ?? res.status}`);
}

export async function loadRemoteCompanies(r: Remote): Promise<RemoteCompany[]> {
  const res = await f(r)(`${r.url}/rest/v1/${TABLE}?select=company_id,inputs,provided,updated_at&order=created_at.asc`, { headers: h(r) });
  await ok(res, "Reading your companies");
  return await res.json() as RemoteCompany[];
}

export async function saveRemoteCompany(r: Remote, rec: IntakeRecord): Promise<void> {
  await ok(await f(r)(`${r.url}/rest/v1/${TABLE}?on_conflict=owner_account_id,company_id`, {
    method: "POST", headers: h(r, { Prefer: "resolution=merge-duplicates,return=minimal" }),
    body: JSON.stringify({ company_id: rec.id, inputs: rec.inputs, provided: rec.provided }),
  }), "Saving the company");
}

export async function deleteRemoteCompany(r: Remote, id: string): Promise<void> {
  await ok(await f(r)(`${r.url}/rest/v1/${TABLE}?company_id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: h(r) }), "Removing the company");
}

/** How this browser's companies and the account's combine. A company the account has and this browser
 *  does not is added; where both have it, the newer copy wins; one this browser has that the account
 *  once had (it was synced) but no longer has was removed on another device, so it goes here too; one
 *  never synced is uploaded. */
export function mergeCompanies(local: readonly IntakeRecord[], synced: readonly string[], remote: readonly RemoteCompany[]):
  { records: IntakeRecord[]; upload: IntakeRecord[]; synced: string[] } {
  const byId = new Map(remote.map((x) => [x.company_id, x]));
  const records: IntakeRecord[] = [];
  const upload: IntakeRecord[] = [];
  for (const l of local) {
    const r = byId.get(l.id);
    if (!r) { if (!synced.includes(l.id)) { records.push(l); upload.push(l); } continue; }
    const remoteNewer = !l.updatedAt || Date.parse(r.updated_at) > Date.parse(l.updatedAt);
    records.push(remoteNewer ? { id: l.id, inputs: { ...l.inputs, ...(r.inputs as Partial<IntakeRecord["inputs"]>) }, provided: r.provided as IntakeRecord["provided"], updatedAt: r.updated_at } : l);
    if (!remoteNewer) upload.push(l);
    byId.delete(l.id);
  }
  for (const r of byId.values()) records.push({ id: r.company_id, inputs: r.inputs as unknown as IntakeRecord["inputs"], provided: r.provided as IntakeRecord["provided"], updatedAt: r.updated_at });
  return { records, upload, synced: records.map((x) => x.id) };
}
