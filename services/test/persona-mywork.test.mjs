// HUMAN WORKFLOW SIMULATION — not "do the components work" but "does each PERSON,
// occupying an office, log in and immediately see their own work?" Real people are
// created and appointed to offices; each gets a person token exactly as the SSO
// callback mints one; we then read each persona's "My Work" (/my-authority) at every
// lifecycle stage and assert whose turn it is. The headline test is the PUBLISHER:
// before the fix a Communications Officer saw an empty My Work while records sat
// rendered awaiting them.
process.env.DISPATCH_TOKEN_SECRET ||= "dev-dispatch-token-secret"; // must match the API under test
process.env.DISPATCH_TOKEN_ISSUER = "sovereign-dispatch";
const { mintUserToken } = await import("../shared/src/auth.mjs");

const API = "http://127.0.0.1:8787";
let pass = 0; const gaps = [];
const ok = (n) => { pass++; console.log(`  ✓ ${n}`); };
const bad = (n, d) => { gaps.push(`${n} — ${d}`); console.log(`  ✗ ${n}  [${d}]`); };
async function call(method, path, { token, body, idem } = {}) {
  const headers = {}; if (token) headers.authorization = "Bearer " + token;
  if (body !== undefined) headers["content-type"] = "application/json"; if (idem) headers["idempotency-key"] = idem;
  const r = await fetch(API + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const stok = async (id, s) => (await call("POST", "/v1/token", { body: { client_id: id, secret: s } })).body.access_token;
const uuid = () => crypto.randomUUID();
const doc = (tenantId, title) => ({
  schemaVersion: "1.0", idempotencyKey: uuid(), source: { system: "saas-ui", tenantId },
  document: { ddmVersion: "1.0", docType: "executive_briefing", metadata: { title, date: "2026-06-26", status: "final" },
    classification: { scheme: "none", level: "UNCLASSIFIED" }, sections: [
      { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF.", style: "lead" }] },
      { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "One." }, { text: "Two." }] }] },
      { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
      { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Proceed." }] },
    ] }, outputs: ["pdf"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 },
});

// Read a persona's "My Work" the way the console would on their login.
async function myWork(token) { return (await call("GET", "/v1/governance/my-authority", { token })).body; }
const titles = (mw) => (mw?.underYourAuthority || []).map((r) => `${r.title} [${r.action}:${r.currentAuthority}]`);

(async () => {
  console.log("\n── The institution: Ministry of Health ──");
  const su = (await call("POST", "/v1/signup", { body: { name: "Ministry of Health" } })).body;
  const tenantId = su.tenantId; const admin = await stok(su.client_id, su.secret);
  await call("POST", "/v1/billing/subscribe", { token: admin });

  for (const [k, n, o] of [["policy", "Policy Division", 10], ["secretariat", "Office of the Permanent Secretary", 20], ["communications", "Communications", 30], ["records", "Records & Preservation", 40]])
    await call("POST", "/v1/governance/departments", { token: admin, body: { key: k, name: n, displayOrder: o } });
  for (const [k, l, d, o] of [["policy_officer", "Policy Officer", "policy", 10], ["director_policy", "Director of Policy", "policy", 20], ["permanent_secretary", "Permanent Secretary", "secretariat", 10], ["communications_office", "Communications Office", "communications", 10], ["archivist", "Departmental Archivist", "records", 10]])
    await call("POST", "/v1/governance/roles", { token: admin, body: { key: k, label: l, departmentKey: d, displayOrder: o } });

  // The people. Each will OCCUPY an office.
  const people = {
    sarah: { email: "s.ahmed@health.gov", fullName: "Sarah Ahmed", dept: "policy", office: "policy_officer" },
    david: { email: "d.okoro@health.gov", fullName: "David Okoro", dept: "policy", office: "director_policy" },
    grace: { email: "g.bello@health.gov", fullName: "Grace Bello", dept: "secretariat", office: "permanent_secretary" },
    cyrus: { email: "c.vale@health.gov", fullName: "Cyrus Vale", dept: "communications", office: "communications_office" },
    ada:   { email: "a.stone@health.gov", fullName: "Ada Stone", dept: "records", office: "archivist" },
  };
  for (const p of Object.values(people)) {
    const r = await call("POST", "/v1/users", { token: admin, body: { email: p.email, fullName: p.fullName, departmentKey: p.dept } });
    p.id = r.body.id; p.subject = r.body.subject;
    await call("POST", "/v1/governance/grants", { token: admin, body: { subject: p.subject, roleKey: p.office } });
    // Mint the person token EXACTLY as the SSO callback does: read+render always,
    // office-holders also get approve/publish/audit.
    p.token = mintUserToken({ tenantId, userId: p.id, scopes: ["dispatch:read", "dispatch:render", "dispatch:approve", "dispatch:publish", "dispatch:audit"], clearance: "none", role: "author", email: p.email }).token;
  }
  ok(`5 people created and appointed to offices (${Object.values(people).map((p) => p.fullName.split(" ")[0]).join(", ")})`);

  await call("POST", "/v1/governance/policies", { token: admin, body: {
    name: "Executive Briefing Policy", docType: "executive_briefing",
    reviewChain: [{ role: "director_policy", label: "Director of Policy", quorum: 1 }, { role: "permanent_secretary", label: "Permanent Secretary", quorum: 1 }],
    publicationAuthority: "communications_office", retentionDays: 3650, autoApproveService: false, sequential: true } });

  // Each persona logs in. Does "My Work" read in office language (labels, not keys)?
  // The institutional crest: my-authority returns WHO the operator is + their institution.
  {
    const mw = await myWork(people.grace.token);
    (mw.identity && mw.identity.name === "Grace Bello" && mw.identity.institution === "Ministry of Health")
      ? ok(`Identity crest: ${mw.identity.name} · ${mw.offices[0].label} · ${mw.identity.institution}`)
      : bad("identity crest", JSON.stringify(mw.identity));
  }
  console.log("\n── Each persona arrives at their office ──");
  for (const [k, p] of Object.entries(people)) {
    const mw = await myWork(p.token);
    const off = mw?.offices?.[0]?.label;
    (off && !/_/.test(off)) ? ok(`${p.fullName} arrives at "Office of the ${off}" (office name, not a key)`) : bad(`${k} office label`, JSON.stringify(mw?.offices));
  }

  console.log("\n── Sarah (Policy Officer) authors and submits ──");
  const sub = await call("POST", "/v1/documents", { token: people.sarah.token, idem: uuid(), body: doc(tenantId, "Regional Stability Brief") });
  const id = sub.body?.documentId;
  id ? ok(`Sarah submits → ${sub.body.lifecycle}`) : bad("sarah submit", `${sub.status} ${JSON.stringify(sub.body)}`);

  console.log("\n── Whose turn is it? (in review) ──");
  let mw = await myWork(people.david.token);
  (mw.counts.awaitingYou === 1 && /decide:Director of Policy/.test(titles(mw).join())) ? ok("David (Director) sees exactly 1 record awaiting HIS decision, as 'Director of Policy'") : bad("david sees his work", titles(mw).join() || "empty");
  mw = await myWork(people.grace.token);
  (mw.counts.awaitingYou === 0) ? ok("Grace (Permanent Secretary) sees nothing yet — her step is not open") : bad("grace premature", titles(mw).join());
  mw = await myWork(people.cyrus.token);
  (mw.counts.awaitingYou === 0) ? ok("Cyrus (Communications) sees nothing yet — not rendered") : bad("cyrus premature", titles(mw).join());
  mw = await myWork(people.sarah.token);
  (mw.counts.awaitingYou === 0) ? ok("Sarah (author) sees nothing to decide — separation of duties") : bad("sarah has work", titles(mw).join());

  console.log("\n── David decides; turn passes to Grace ──");
  let d = await call("POST", `/v1/documents/${id}/decision`, { token: people.david.token, body: { decision: "approve" } });
  (d.status === 200 && d.body.lifecycle === "in_review") ? ok("David approves → advances to Permanent Secretary") : bad("david approve", `${d.status} ${JSON.stringify(d.body)}`);
  mw = await myWork(people.grace.token);
  (mw.counts.awaitingYou === 1 && /decide:Permanent Secretary/.test(titles(mw).join())) ? ok("Now Grace sees 1 awaiting HER as 'Permanent Secretary'") : bad("grace turn", titles(mw).join() || "empty");
  mw = await myWork(people.david.token);
  (mw.counts.awaitingYou === 0) ? ok("David's My Work is clear — he has done his part") : bad("david still has work", titles(mw).join());

  console.log("\n── Grace approves; the record is rendered ──");
  d = await call("POST", `/v1/documents/${id}/decision`, { token: people.grace.token, body: { decision: "approve", outputs: ["pdf"] } });
  (d.status === 200 && d.body.lifecycle === "approved") ? ok("Grace approves → APPROVED + render queued") : bad("grace approve", `${d.status} ${JSON.stringify(d.body)}`);
  let lc = null;
  for (let i = 0; i < 25; i++) { await new Promise((r) => setTimeout(r, 800)); const g = await call("GET", `/v1/documents/${id}`, { token: people.cyrus.token }); lc = g.body?.lifecycle; if (lc === "rendered") break; }
  lc === "rendered" ? ok("Worker rendered the record → RENDERED") : bad("render", `lifecycle=${lc}`);

  console.log("\n── THE PUBLISHER TEST — does Cyrus now see his work? ──");
  mw = await myWork(people.cyrus.token);
  (mw.counts.awaitingYou === 1 && /publish:Communications Office/.test(titles(mw).join())) ? ok("Cyrus (Communications) NOW sees 1 record ready for HIS publication — the publisher gap is closed") : bad("PUBLISHER GAP", titles(mw).join() || "EMPTY — publisher still blind");
  // And nobody else thinks it's their turn.
  mw = await myWork(people.david.token); (mw.counts.awaitingYou === 0) ? ok("David sees nothing — not his to publish") : bad("david false-positive", titles(mw).join());

  console.log("\n── Cyrus publishes; his work clears ──");
  let pub = await call("POST", `/v1/documents/${id}/publish`, { token: people.cyrus.token });
  (pub.status === 200 && pub.body.lifecycle === "published") ? ok("Cyrus publishes → PUBLISHED") : bad("publish", `${pub.status} ${JSON.stringify(pub.body)}`);
  mw = await myWork(people.cyrus.token);
  (mw.counts.awaitingYou === 0) ? ok("Cyrus's My Work is clear once published") : bad("cyrus not cleared", titles(mw).join());

  console.log(`\n════ PERSONA SIMULATION: ${pass} passed, ${gaps.length} gaps ════`);
  if (gaps.length) gaps.forEach((g) => console.log("  • " + g));
  process.exit(gaps.length ? 1 : 0);
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(2); });
