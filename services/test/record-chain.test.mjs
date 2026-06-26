// Verify the in-flight Chain of Authority on the record detail endpoint at each
// stage: who's cleared, whose turn it is, what's pending — including publication.
process.env.DISPATCH_TOKEN_SECRET ||= "dev-dispatch-token-secret";
process.env.DISPATCH_TOKEN_ISSUER = "sovereign-dispatch";
const { mintUserToken } = await import("../shared/src/auth.mjs");
const API = "http://127.0.0.1:8787";
let pass = 0; const gaps = [];
const ok = (n) => { pass++; console.log(`  ✓ ${n}`); };
const bad = (n, d) => { gaps.push(`${n} — ${d}`); console.log(`  ✗ ${n}  [${d}]`); };
async function call(method, path, { token, body, idem } = {}) {
  const h = {}; if (token) h.authorization = "Bearer " + token; if (body !== undefined) h["content-type"] = "application/json"; if (idem) h["idempotency-key"] = idem;
  const r = await fetch(API + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const stok = async (id, s) => (await call("POST", "/v1/token", { body: { client_id: id, secret: s } })).body.access_token;
const uuid = () => crypto.randomUUID();
const doc = (tenantId, title) => ({ schemaVersion: "1.0", idempotencyKey: uuid(), source: { system: "saas-ui", tenantId },
  document: { ddmVersion: "1.0", docType: "executive_briefing", metadata: { title, date: "2026-06-26", status: "final" }, classification: { scheme: "none", level: "UNCLASSIFIED" }, sections: [
    { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF.", style: "lead" }] },
    { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "One." }, { text: "Two." }] }] },
    { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
    { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Go." }] },
  ] }, outputs: ["pdf"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 } });
const chain = async (id, token) => (await call("GET", `/v1/documents/${id}`, { token })).body;
const fmt = (c) => (c.governanceChain || []).map((s) => `${s.label}:${s.state}${s.by?.length ? "(" + s.by.join("/") + ")" : ""}`).join(" → ");

(async () => {
  const su = (await call("POST", "/v1/signup", { body: { name: "Ministry of Justice" } })).body;
  const tenantId = su.tenantId; const admin = await stok(su.client_id, su.secret);
  await call("POST", "/v1/billing/subscribe", { token: admin });
  for (const [k, l, d, o] of [["director_policy", "Director of Policy", "policy", 20], ["permanent_secretary", "Permanent Secretary", "sec", 30], ["communications_office", "Communications Office", "comm", 40]])
    await call("POST", "/v1/governance/roles", { token: admin, body: { key: k, label: l, departmentKey: d, displayOrder: o } });
  const mk = async (full, email, office) => { const u = (await call("POST", "/v1/users", { token: admin, body: { email, fullName: full } })).body;
    await call("POST", "/v1/governance/grants", { token: admin, body: { subject: u.subject, roleKey: office } });
    return mintUserToken({ tenantId, userId: u.id, scopes: ["dispatch:read", "dispatch:render", "dispatch:approve", "dispatch:publish", "dispatch:audit"], clearance: "none", role: "author", email }).token; };
  const author = await mk("Sarah Ahmed", "s.ahmed@just.gov", "director_policy"); // author holds an office too, fine
  const david = await mk("David Okoro", "d.okoro@just.gov", "director_policy");
  const grace = await mk("Grace Bello", "g.bello@just.gov", "permanent_secretary");
  const cyrus = await mk("Cyrus Vale", "c.vale@just.gov", "communications_office");
  await call("POST", "/v1/governance/policies", { token: admin, body: { name: "Executive Briefing Policy", docType: "executive_briefing",
    reviewChain: [{ role: "director_policy", label: "Director of Policy", quorum: 1 }, { role: "permanent_secretary", label: "Permanent Secretary", quorum: 1 }],
    publicationAuthority: "communications_office", retentionDays: 3650, autoApproveService: false, sequential: true } });

  const id = (await call("POST", "/v1/documents", { token: author, idem: uuid(), body: doc(tenantId, "Sentencing Reform Brief") })).body.documentId;

  console.log("\n── IN REVIEW (just submitted) ──");
  let c = await chain(id, admin); console.log("   " + fmt(c));
  (c.submittedBy?.name === "Sarah Ahmed" && c.submittedBy?.office) ? ok(`Created by surfaced: ${c.submittedBy.name} · ${c.submittedBy.office}`) : bad("created-by", JSON.stringify(c.submittedBy));
  let st = c.governanceChain;
  (st[0].state === "current" && st[1].state === "pending" && st[2].publication && st[2].state === "pending") ? ok("Chain: Director=current, Perm Sec=pending, Publication=pending") : bad("chain in_review", fmt(c));

  console.log("\n── DIRECTOR APPROVES ──");
  await call("POST", `/v1/documents/${id}/decision`, { token: david, body: { decision: "approve" } });
  c = await chain(id, admin); console.log("   " + fmt(c)); st = c.governanceChain;
  (st[0].state === "done" && st[0].by.includes("David Okoro") && st[1].state === "current") ? ok("Chain: Director=done (by David Okoro), Perm Sec=current") : bad("chain after director", fmt(c));

  console.log("\n── PERM SEC APPROVES → render ──");
  await call("POST", `/v1/documents/${id}/decision`, { token: grace, body: { decision: "approve", outputs: ["pdf"] } });
  let lc = null; for (let i = 0; i < 25; i++) { await new Promise((r) => setTimeout(r, 800)); const g = await chain(id, admin); lc = g.lifecycle; if (lc === "rendered") { c = g; break; } }
  console.log("   " + fmt(c)); st = c.governanceChain;
  (lc === "rendered" && st[0].state === "done" && st[1].state === "done" && st[1].by.includes("Grace Bello") && st[2].state === "current") ? ok("Chain: both reviews done, Publication=current (awaiting Communications Office)") : bad("chain rendered", `${lc} ${fmt(c)}`);

  console.log("\n── PUBLISHED ──");
  await call("POST", `/v1/documents/${id}/publish`, { token: cyrus });
  c = await chain(id, admin); console.log("   " + fmt(c)); st = c.governanceChain;
  (st.every((s) => s.state === "done")) ? ok("Chain: every step done once published") : bad("chain published", fmt(c));

  console.log(`\n════ CHAIN VERIFY: ${pass} passed, ${gaps.length} gaps ════`);
  if (gaps.length) gaps.forEach((g) => console.log("  • " + g));
  process.exit(gaps.length ? 1 : 0);
})().catch((e) => { console.error("ERROR:", e); process.exit(2); });
