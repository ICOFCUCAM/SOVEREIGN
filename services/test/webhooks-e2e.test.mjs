// Event webhooks end-to-end: register an endpoint, run a record through its
// lifecycle, and assert Dispatch POSTs SIGNED events to the receiver — the reverse
// API working. Verifies HMAC signatures and that the right events fire in order.
process.env.DISPATCH_TOKEN_SECRET ||= "dev-dispatch-token-secret";
process.env.DISPATCH_TOKEN_ISSUER = "sovereign-dispatch";
import http from "node:http";
import crypto from "node:crypto";
const { mintUserToken } = await import("../shared/src/auth.mjs");
const API = "http://127.0.0.1:8787";
let pass = 0; const gaps = [];
const ok = (n) => { pass++; console.log(`  ✓ ${n}`); };
const bad = (n, d) => { gaps.push(`${n} — ${d}`); console.log(`  ✗ ${n}  [${d}]`); };
const call = async (m, p, { token, body, idem } = {}) => { const h = {}; if (token) h.authorization = "Bearer " + token; if (body !== undefined) h["content-type"] = "application/json"; if (idem) h["idempotency-key"] = idem; const r = await fetch(API + p, { method: m, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined }); return { status: r.status, body: await r.json().catch(() => null) }; };
const stok = async (i, s) => (await call("POST", "/v1/token", { body: { client_id: i, secret: s } })).body.access_token;
const uuid = () => crypto.randomUUID();
const doc = (t, title) => ({ schemaVersion: "1.0", idempotencyKey: uuid(), source: { system: "saas-ui", tenantId: t }, document: { ddmVersion: "1.0", docType: "executive_briefing", metadata: { title, date: "2026-06-26", status: "final" }, classification: { scheme: "none", level: "UNCLASSIFIED" }, sections: [{ id: "s1", role: "executive_summary", heading: "E", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "x", style: "lead" }] }, { id: "s2", role: "key_judgements", heading: "K", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "a" }] }] }, { id: "s3", role: "analysis", heading: "A", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "y" }] }, { id: "s4", role: "recommendation", heading: "R", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "go" }] }] }, outputs: ["pdf"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } });

// A local receiver capturing every delivery (raw body + signature header).
const received = [];
const receiver = http.createServer((req, res) => {
  let raw = ""; req.on("data", (c) => raw += c); req.on("end", () => {
    received.push({ event: req.headers["x-dispatch-event"], sig: req.headers["x-dispatch-signature"], delivery: req.headers["x-dispatch-delivery"], raw });
    res.writeHead(200); res.end("ok");
  });
});
await new Promise((r) => receiver.listen(9099, "127.0.0.1", r));
const RECEIVER = "http://127.0.0.1:9099/hook";
const waitFor = async (event, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (received.find((x) => x.event === event)) return true; await new Promise((r) => setTimeout(r, 200)); } return false; };

(async () => {
  const su = (await call("POST", "/v1/signup", { body: { name: "Ministry of Interior" } })).body;
  const t = su.tenantId; const admin = await stok(su.client_id, su.secret);
  await call("POST", "/v1/billing/subscribe", { token: admin });
  for (const [k, l, o] of [["director_policy", "Director of Policy", 20], ["permanent_secretary", "Permanent Secretary", 30], ["communications_office", "Communications Office", 40]])
    await call("POST", "/v1/governance/roles", { token: admin, body: { key: k, label: l, displayOrder: o } });
  const mk = async (full, email, office) => { const u = (await call("POST", "/v1/users", { token: admin, body: { email, fullName: full } })).body; if (office) await call("POST", "/v1/governance/grants", { token: admin, body: { subject: u.subject, roleKey: office } }); return mintUserToken({ tenantId: t, userId: u.id, scopes: ["dispatch:read", "dispatch:render", "dispatch:approve", "dispatch:publish", "dispatch:audit"], clearance: "none", role: "author", email }).token; };
  const sarah = await mk("Sarah Ahmed", "s@int.gov", null);
  const david = await mk("David Okoro", "d@int.gov", "director_policy");
  const grace = await mk("Grace Bello", "g@int.gov", "permanent_secretary");
  const cyrus = await mk("Cyrus Vale", "c@int.gov", "communications_office");
  await call("POST", "/v1/governance/policies", { token: admin, body: { name: "P", docType: "executive_briefing", reviewChain: [{ role: "director_policy", label: "Director of Policy", quorum: 1 }, { role: "permanent_secretary", label: "Permanent Secretary", quorum: 1 }], publicationAuthority: "communications_office", retentionDays: 3650, autoApproveService: false, sequential: true } });

  // Register a webhook endpoint for all events.
  console.log("\n── Register webhook endpoint ──");
  const reg = await call("POST", "/v1/admin/webhooks", { token: admin, body: { url: RECEIVER, description: "Ministry ERP" } });
  const secret = reg.body?.secret;
  (reg.status === 201 && secret?.startsWith("whsec_")) ? ok("Endpoint registered; signing secret returned once") : bad("register", `${reg.status} ${JSON.stringify(reg.body)}`);

  console.log("\n── Run the lifecycle; events should arrive ──");
  const id = (await call("POST", "/v1/documents", { token: sarah, idem: uuid(), body: doc(t, "Border Security Brief") })).body.documentId;
  (await waitFor("record.submitted")) ? ok("record.submitted delivered") : bad("submitted", "not received");
  await call("POST", `/v1/documents/${id}/decision`, { token: david, body: { decision: "approve" } });
  await call("POST", `/v1/documents/${id}/decision`, { token: grace, body: { decision: "approve", outputs: ["pdf"] } });
  (await waitFor("record.approved")) ? ok("record.approved delivered") : bad("approved", "not received");
  // wait for render then publish
  let lc = null; for (let i = 0; i < 25; i++) { await new Promise((r) => setTimeout(r, 800)); lc = (await call("GET", `/v1/documents/${id}`, { token: cyrus })).body?.lifecycle; if (lc === "rendered") break; }
  await call("POST", `/v1/documents/${id}/publish`, { token: cyrus });
  (await waitFor("record.published")) ? ok("record.published delivered") : bad("published", "not received");
  await call("POST", `/v1/documents/${id}/archive`, { token: cyrus });
  (await waitFor("record.preserved")) ? ok("record.preserved delivered") : bad("preserved", "not received");

  console.log("\n── Signatures verify ──");
  let allSigned = true, sample = null;
  for (const r of received) {
    const expect = "sha256=" + crypto.createHmac("sha256", secret).update(r.raw).digest("hex");
    if (r.sig !== expect) { allSigned = false; sample = `${r.event}: sig mismatch`; }
  }
  allSigned ? ok(`Every delivery (${received.length}) carries a valid HMAC-SHA256 signature`) : bad("signatures", sample);
  const body0 = JSON.parse(received[0].raw);
  (body0.event && body0.occurredAt && body0.data?.documentId === id) ? ok("Payload shape: { event, occurredAt, tenantId, data{documentId,…} }") : bad("payload", received[0].raw.slice(0, 120));

  console.log("\n── Endpoint shows delivery stats ──");
  const list = await call("GET", "/v1/admin/webhooks", { token: admin });
  const ep = list.body?.endpoints?.[0];
  (ep && ep.last_status === "delivered" && (list.body.deliveries.delivered >= 4)) ? ok(`GET /v1/admin/webhooks: ${list.body.deliveries.delivered} delivered, secret elided`) : bad("stats", JSON.stringify(list.body?.deliveries));
  (ep && ep.secret === undefined) ? ok("Secret never returned on list") : bad("secret leak", JSON.stringify(ep));

  console.log(`\n════ WEBHOOKS E2E: ${pass} passed, ${gaps.length} gaps ════`);
  if (gaps.length) gaps.forEach((g) => console.log("  • " + g));
  receiver.close();
  process.exit(gaps.length ? 1 : 0);
})().catch((e) => { console.error("ERROR:", e); receiver.close(); process.exit(2); });
