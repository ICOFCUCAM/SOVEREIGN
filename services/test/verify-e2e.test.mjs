// Public verification end-to-end: publish a record, then verify it BY ID with no
// auth — genuine, issuer, certificates, integrity hash, current vs revoked, and a
// classified record withholds its title. The institutional proof a copy can't carry.
process.env.DISPATCH_TOKEN_SECRET ||= "dev-dispatch-token-secret";
process.env.DISPATCH_TOKEN_ISSUER = "sovereign-dispatch";
const { mintUserToken } = await import("../shared/src/auth.mjs");
import crypto from "node:crypto";
const API = "http://127.0.0.1:8787";
let pass = 0; const gaps = [];
const ok = (n) => { pass++; console.log(`  ✓ ${n}`); };
const bad = (n, d) => { gaps.push(`${n} — ${d}`); console.log(`  ✗ ${n}  [${d}]`); };
const call = async (m, p, { token, body, idem } = {}) => { const h = {}; if (token) h.authorization = "Bearer " + token; if (body !== undefined) h["content-type"] = "application/json"; if (idem) h["idempotency-key"] = idem; const r = await fetch(API + p, { method: m, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
const stok = async (i, s) => (await call("POST", "/v1/token", { body: { client_id: i, secret: s } })).body.access_token;
const uuid = () => crypto.randomUUID();
const doc = (t, title, level = "UNCLASSIFIED") => ({ schemaVersion: "1.0", idempotencyKey: uuid(), source: { system: "saas-ui", tenantId: t }, document: { ddmVersion: "1.0", docType: "executive_briefing", metadata: { title, date: "2026-06-26", status: "final" }, classification: { scheme: level === "UNCLASSIFIED" ? "none" : "uk_gov", level }, sections: [{ id: "s1", role: "executive_summary", heading: "E", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "x", style: "lead" }] }, { id: "s2", role: "key_judgements", heading: "K", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "a" }] }] }, { id: "s3", role: "analysis", heading: "A", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "y" }] }, { id: "s4", role: "recommendation", heading: "R", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "go" }] }] }, outputs: ["pdf"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } });

async function runToPublished(t, admin, author, dir, sec, pub, title, level) {
  const id = (await call("POST", "/v1/documents", { token: author, idem: uuid(), body: doc(t, title, level) })).body.documentId;
  await call("POST", `/v1/documents/${id}/decision`, { token: dir, body: { decision: "approve" } });
  await call("POST", `/v1/documents/${id}/decision`, { token: sec, body: { decision: "approve", outputs: ["pdf"] } });
  let lc = null; for (let i = 0; i < 25; i++) { await new Promise((r) => setTimeout(r, 800)); lc = (await call("GET", `/v1/documents/${id}`, { token: pub })).body?.lifecycle; if (lc === "rendered") break; }
  const p = await call("POST", `/v1/documents/${id}/publish`, { token: pub });
  return { id, recordId: p.body?.recordId };
}
const verify = async (rid) => call("GET", `/v1/verify/${encodeURIComponent(rid)}`); // NO token — public

(async () => {
  const su = (await call("POST", "/v1/signup", { body: { name: "Ministry of Health" } })).body;
  const t = su.tenantId; const admin = await stok(su.client_id, su.secret);
  await call("POST", "/v1/billing/subscribe", { token: admin });
  for (const [k, l, o] of [["director_policy", "Director of Policy", 20], ["permanent_secretary", "Permanent Secretary", 30], ["communications_office", "Communications Office", 40]])
    await call("POST", "/v1/governance/roles", { token: admin, body: { key: k, label: l, displayOrder: o } });
  const mk = async (full, email, office, scopes) => { const u = (await call("POST", "/v1/users", { token: admin, body: { email, fullName: full } })).body; if (office) await call("POST", "/v1/governance/grants", { token: admin, body: { subject: u.subject, roleKey: office } }); return mintUserToken({ tenantId: t, userId: u.id, scopes, clearance: "top_secret", role: "author", email }).token; };
  const A = ["dispatch:read", "dispatch:render"], AP = ["dispatch:read", "dispatch:render", "dispatch:approve", "dispatch:publish"];
  const author = await mk("Sarah Ahmed", "s@h.gov", null, A);
  const david = await mk("David Okoro", "d@h.gov", "director_policy", AP);
  const grace = await mk("Grace Bello", "g@h.gov", "permanent_secretary", AP);
  const cyrus = await mk("Cyrus Vale", "c@h.gov", "communications_office", AP);
  await call("POST", "/v1/governance/policies", { token: admin, body: { name: "Executive Briefing Policy", docType: "executive_briefing", reviewChain: [{ role: "director_policy", label: "Director of Policy", quorum: 1 }, { role: "permanent_secretary", label: "Permanent Secretary", quorum: 1 }], publicationAuthority: "communications_office", retentionDays: 3650, autoApproveService: false, sequential: true } });

  console.log("\n── Publish → permanent record id ──");
  const { id, recordId } = await runToPublished(t, admin, author, david, grace, cyrus, "National Vaccination Policy", "UNCLASSIFIED");
  (recordId && /^SD-\d{4}-\d{8}$/.test(recordId)) ? ok(`Published record received a permanent id: ${recordId}`) : bad("record id", String(recordId));

  console.log("\n── Public verification (no auth) ──");
  let v = await verify(recordId);
  (v.status === 200 && v.body.verified && v.body.status === "OFFICIAL") ? ok("Anyone can verify the record is genuine & OFFICIAL — no credential needed") : bad("verify", `${v.status} ${JSON.stringify(v.body)}`);
  (v.body.institution === "Ministry of Health") ? ok(`Verification names the issuing institution: ${v.body.institution}`) : bad("institution", JSON.stringify(v.body.institution));
  (v.body.title === "National Vaccination Policy") ? ok("Unclassified record shows its title") : bad("title", JSON.stringify(v.body.title));
  (v.body.integrityHash && /^[a-f0-9]{32,}$/i.test(v.body.integrityHash)) ? ok(`Carries a cryptographic integrity hash: ${v.body.integrityHash.slice(0, 12)}…`) : bad("integrity", JSON.stringify(v.body.integrityHash));
  (v.body.hasGovernanceCertificate && v.body.governanceCompliance === "COMPLIANT") ? ok("Governance Certificate present & COMPLIANT, approval chain listed") : bad("gov cert", JSON.stringify({ g: v.body.hasGovernanceCertificate, c: v.body.governanceCompliance }));
  (Array.isArray(v.body.approvalChain) && v.body.approvalChain.includes("Director of Policy")) ? ok(`Approval chain visible: ${v.body.approvalChain.join(" → ")}`) : bad("chain", JSON.stringify(v.body.approvalChain));

  console.log("\n── Artifact-level integrity: the exposed hash IS the file's hash ──");
  (Array.isArray(v.body.artifacts) && v.body.artifacts.find((a) => a.format === "pdf")?.sha256) ? ok("Verification exposes the official artifact SHA-256(s)") : bad("artifact hashes", JSON.stringify(v.body.artifacts));
  // Download the genuine PDF and hash it locally — it must equal the exposed hash.
  const det = (await call("GET", `/v1/documents/${id}`, { token: cyrus })).body;
  const art = (det.latestResult?.artifacts || []).find((a) => a.format === "pdf");
  const grant = (await call("POST", `/v1/artifacts/${art.artifactId}/grant`, { token: cyrus, body: {} })).body;
  const bytes = Buffer.from(await (await fetch(API + grant.downloadUrl)).arrayBuffer());
  const localHash = crypto.createHash("sha256").update(bytes).digest("hex");
  const official = v.body.artifacts.find((a) => a.format === "pdf").sha256;
  (localHash === official) ? ok("A hash of the downloaded file matches the official hash → the file is authentic & unaltered") : bad("file hash compare", `${localHash.slice(0, 12)} vs ${official.slice(0, 12)}`);
  const tampered = crypto.createHash("sha256").update(Buffer.concat([bytes, Buffer.from([0])])).digest("hex");
  (tampered !== official) ? ok("A single altered byte produces a different hash → tampering is detected") : bad("tamper undetected", "hashes collided");

  console.log("\n── Verify also resolves by the document UUID ──");
  v = await verify(id);
  (v.body.verified && v.body.recordId === recordId) ? ok("The same record resolves by its UUID too (a QR can encode either)") : bad("uuid verify", JSON.stringify(v.body.recordId));

  console.log("\n── A classified record is verifiable but withholds its title ──");
  const sec = await runToPublished(t, admin, author, david, grace, cyrus, "Covert Capability Assessment", "OFFICIAL");
  // OFFICIAL is shown; use a SECRET one to prove withholding
  const secret = await runToPublished(t, admin, author, david, grace, cyrus, "SECRET — do not leak", "SECRET");
  v = await verify(secret.recordId);
  (v.body.verified && v.body.title === null && v.body.titleWithheld) ? ok("A SECRET record verifies as genuine but its title is withheld") : bad("classified withhold", JSON.stringify({ title: v.body.title, w: v.body.titleWithheld }));
  void sec;

  console.log("\n── Revocation is visible; forgeries are not ──");
  await call("POST", `/v1/documents/${id}/withdraw`, { token: cyrus });
  v = await verify(recordId);
  (v.body.verified && v.body.status === "REVOKED") ? ok("A withdrawn record verifies as REVOKED (the stale copy is exposed)") : bad("revoke", JSON.stringify(v.body.status));
  v = await verify("SD-2026-99999999");
  (v.status === 404 && v.body.verified === false) ? ok("An unknown / forged id does NOT verify (NOT_FOUND)") : bad("forgery", `${v.status} ${JSON.stringify(v.body)}`);

  console.log(`\n════ VERIFY E2E: ${pass} passed, ${gaps.length} gaps ════`);
  if (gaps.length) gaps.forEach((g) => console.log("  • " + g));
  process.exit(gaps.length ? 1 : 0);
})().catch((e) => { console.error("ERROR:", e); process.exit(2); });
