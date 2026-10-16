import type { Remote } from "./store";

// ── CERTIFIED DOCUMENTS ─────────────────────────────────────────────
// An approved deal document can be certified by Sovereign Dispatch: a permanent record number, a public
// verification page (the title withheld, the body never shown), an integrity hash and preservation. The
// browser only asks; the exit-dispatch-submit function checks the version (the caller's own, approved,
// certifiable, matching its content hash), talks to Dispatch and writes ExitOS's record of it. Nothing
// here can mark a document certified.

/** The deal documents both parties rely on after the deal (the same list the function enforces). */
export const CERTIFIABLE_TYPES: ReadonlySet<string> = new Set([
  "exitos.nda", "exitos.loi", "exitos.exclusivity", "exitos.bring_down_certificate", "exitos.funds_flow", "exitos.post_closing_register",
]);

export interface Certificate {
  readonly state: "requested" | "certified" | "failed";
  readonly recordId: string | null;
  readonly verifyUrl: string | null;
  readonly integritySha256: string | null;
  readonly requestedAt: string;
  readonly certifiedAt: string | null;
  readonly error: string | null;
}
export type CertifyResult =
  | { readonly ok: true; readonly certificate: Certificate | null; readonly waitingFor: string | null }
  | { readonly ok: false; readonly configured: boolean; readonly error: string };

const headers = (r: Remote, extra: Record<string, string> = {}): Record<string, string> => ({ apikey: r.anonKey, Authorization: `Bearer ${r.accessToken}`, ...extra });
const f = (r: Remote): typeof fetch => r.fetchImpl ?? fetch;

/** Ask Dispatch to certify a version ("certify"), or move a requested certification on ("status"). */
export async function certifyVersion(r: Remote, versionId: string, action: "certify" | "status"): Promise<CertifyResult> {
  try {
    const res = await f(r)(`${r.url}/functions/v1/exit-dispatch-submit`, {
      method: "POST", headers: headers(r, { "Content-Type": "application/json" }), body: JSON.stringify({ versionId, action }),
    });
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; configured?: boolean; error?: string; certificate?: Certificate | null; waitingFor?: string | null };
    if (j.configured === false) return { ok: false, configured: false, error: j.error ?? "Certification is not connected yet" };
    if (!res.ok || !j.ok) return { ok: false, configured: true, error: j.error ?? `Certification refused (${res.status})` };
    return { ok: true, certificate: j.certificate ?? null, waitingFor: j.waitingFor ?? null };
  } catch (e) {
    return { ok: false, configured: false, error: e instanceof Error ? e.message : "Certification service unreachable" };
  }
}

/** The certificates of the caller's own versions, by version id. */
export async function loadCertificates(r: Remote, versionIds: readonly string[]): Promise<Map<string, Certificate>> {
  const out = new Map<string, Certificate>();
  if (!versionIds.length) return out;
  const ids = versionIds.map((v) => `"${v.replace(/"/g, "")}"`).join(",");
  const res = await f(r)(`${r.url}/rest/v1/exitos_document_certificates?version_id=in.(${encodeURIComponent(ids)})&select=version_id,state,record_id,verify_url,integrity_sha256,requested_at,certified_at,error`, { headers: headers(r) });
  if (!res.ok) return out;
  for (const c of (await res.json().catch(() => [])) as Array<Record<string, string | null>>) {
    out.set(String(c.version_id), {
      state: (c.state as Certificate["state"]) ?? "requested", recordId: c.record_id ?? null, verifyUrl: c.verify_url ?? null,
      integritySha256: c.integrity_sha256 ?? null, requestedAt: String(c.requested_at ?? ""), certifiedAt: c.certified_at ?? null, error: c.error ?? null,
    });
  }
  return out;
}
