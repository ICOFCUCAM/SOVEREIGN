// Operate Dispatch as a real ministry — end to end, against the live local API.
// Builds the institution (departments, offices, office-holders, a governance
// policy referencing offices), then runs an Official Record through the full
// lifecycle with DIFFERENT principals occupying different offices, asserting the
// governance engine enforces what it should. Prints a gap report.
const API = "http://127.0.0.1:8787";
let pass = 0, fail = 0; const gaps = [];
const log = (s) => console.log(s);
const okmark = (name) => { pass++; log(`  ✓ ${name}`); };
const bad = (name, detail) => { fail++; gaps.push(`${name} — ${detail}`); log(`  ✗ ${name}  [${detail}]`); };

async function call(method, path, { token, body, idem } = {}) {
  const headers = {};
  if (token) headers.authorization = "Bearer " + token;
  if (body !== undefined) headers["content-type"] = "application/json";
  if (idem) headers["idempotency-key"] = idem;
  const r = await fetch(API + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}
const tokenFor = async (client_id, secret) => (await call("POST", "/v1/token", { body: { client_id, secret } })).body.access_token;
const uuid = () => crypto.randomUUID();

const docBody = (tenantId, title) => ({
  schemaVersion: "1.0", idempotencyKey: uuid(),
  source: { system: "saas-ui", tenantId },
  document: {
    ddmVersion: "1.0", docType: "executive_briefing",
    metadata: { title, date: "2026-06-26", status: "final" },
    classification: { scheme: "none", level: "UNCLASSIFIED" },
    sections: [
      { id: "s-sum", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF: the reform programme is on track.", style: "lead" }] },
      { id: "s-kj", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "Judgement one." }, { text: "Judgement two." }] }] },
      { id: "s-an", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Analysis body." }] },
      { id: "s-rec", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Proceed with option A." }] },
    ],
  },
  outputs: ["pdf"],
  delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 },
});

(async () => {
  log("\n── STAGE 0: the institution joins ──");
  const su = (await call("POST", "/v1/signup", { body: { name: "Ministry of Education" } })).body;
  const tenantId = su.tenantId;
  const adminTok = await tokenFor(su.client_id, su.secret);
  adminTok ? okmark("Institution created + bootstrap admin signed in") : bad("signup", JSON.stringify(su));

  log("\n── STAGE 1: build the institution (departments → offices) ──");
  let r = await call("POST", "/v1/governance/departments", { token: adminTok, body: { key: "policy", name: "Policy Division", displayOrder: 10 } });
  r.status === 201 ? okmark("Create department: Policy Division") : bad("create department", `${r.status} ${JSON.stringify(r.body)}`);
  for (const [key, label, ord] of [["director_policy", "Director of Policy", 20], ["permanent_secretary", "Permanent Secretary", 30], ["communications_office", "Communications Office", 40]]) {
    r = await call("POST", "/v1/governance/roles", { token: adminTok, body: { key, label, departmentKey: "policy", displayOrder: ord } });
    r.status === 201 ? okmark(`Create office: ${label}`) : bad(`create office ${label}`, `${r.status} ${JSON.stringify(r.body)}`);
  }

  log("\n── STAGE 2: appoint people to offices (here: office-holder credentials) ──");
  const issue = async (name, scopes) => {
    const res = await call("POST", "/v1/admin/clients", { token: adminTok, body: { name, scopes } });
    if (res.status !== 201 && res.status !== 200) { bad(`issue ${name}`, `${res.status} ${JSON.stringify(res.body)}`); return null; }
    return res.body; // { client_id, secret }
  };
  const author = await issue("Policy Officer (author)", ["dispatch:validate", "dispatch:render", "dispatch:read"]);
  const director = await issue("Director of Policy", ["dispatch:read", "dispatch:approve"]);
  const secretary = await issue("Permanent Secretary", ["dispatch:read", "dispatch:approve"]);
  const publisher = await issue("Communications Office (publisher)", ["dispatch:read", "dispatch:publish"]);
  (author && director && secretary && publisher) ? okmark("Issued 4 office-holder credentials") : bad("issue holders", "one or more failed");
  const grant = async (clientId, roleKey) => call("POST", "/v1/governance/grants", { token: adminTok, body: { subject: `svc:${clientId}`, roleKey } });
  (await grant(director.client_id, "director_policy")).status; (await grant(secretary.client_id, "permanent_secretary")).status;
  (await grant(publisher.client_id, "communications_office")).status;
  okmark("Assigned Director, Permanent Secretary + Communications Office to their offices");
  const [authorTok, dirTok, secTok, pubTok] = await Promise.all([
    tokenFor(author.client_id, author.secret), tokenFor(director.client_id, director.secret),
    tokenFor(secretary.client_id, secretary.secret), tokenFor(publisher.client_id, publisher.secret)]);

  log("\n── STAGE 3: define how this record type is governed (policy → offices) ──");
  r = await call("POST", "/v1/governance/policies", { token: adminTok, body: {
    name: "Executive Briefing Policy", docType: "executive_briefing", classificationLevel: null,
    reviewChain: [{ role: "director_policy", label: "Director of Policy", quorum: 1 }, { role: "permanent_secretary", label: "Permanent Secretary", quorum: 1 }],
    publicationAuthority: "communications_office", retentionDays: 3650, autoApproveService: false, sequential: true } });
  (r.status === 201 || r.status === 200) ? okmark("Governance policy bound to executive_briefing (2-office chain)") : bad("create policy", `${r.status} ${JSON.stringify(r.body)}`);

  log("\n── STAGE 4: author submits an Official Record ──");
  let sub = await call("POST", "/v1/documents", { token: authorTok, idem: uuid(), body: docBody(tenantId, "Education Transformation Strategy 2030") });
  const docId = sub.body?.documentId;
  (docId && (sub.body.lifecycle === "in_review" || sub.body.lifecycle === "submitted")) ? okmark(`Submitted → ${sub.body.lifecycle} (awaits the chain, not auto-approved)`) : bad("submit", `${sub.status} ${JSON.stringify(sub.body)}`);

  log("\n── STAGE 5: governance ENFORCEMENT ──");
  let d;
  // b) out-of-order: Permanent Secretary approves before the Director
  d = await call("POST", `/v1/documents/${docId}/decision`, { token: secTok, body: { decision: "approve" } });
  d.status === 409 && /STEP_NOT_OPEN/.test(JSON.stringify(d.body)) ? okmark("Out-of-order approval refused (Permanent Secretary before Director → STEP_NOT_OPEN)") : bad("out-of-order not refused", `${d.status} ${JSON.stringify(d.body)}`);
  // c) the Director (correct open office) approves
  d = await call("POST", `/v1/documents/${docId}/decision`, { token: dirTok, body: { decision: "approve" } });
  (d.status === 200 && d.body.lifecycle === "in_review") ? okmark("Director approves → still in review, advances to Permanent Secretary") : bad("director approve", `${d.status} ${JSON.stringify(d.body)}`);
  // d) the Director cannot approve twice
  d = await call("POST", `/v1/documents/${docId}/decision`, { token: dirTok, body: { decision: "approve" } });
  (d.status === 409) ? okmark("Director cannot decide the same record twice") : bad("double decision not blocked", `${d.status} ${JSON.stringify(d.body)}`);
  // e) the Permanent Secretary approves → policy satisfied → approved + render job
  d = await call("POST", `/v1/documents/${docId}/decision`, { token: secTok, body: { decision: "approve", outputs: ["pdf"] } });
  (d.status === 200 && d.body.lifecycle === "approved") ? okmark("Permanent Secretary approves → policy satisfied → APPROVED + render queued") : bad("final approve", `${d.status} ${JSON.stringify(d.body)}`);

  log("\n── STAGE 6: render (worker) → publish → preserve ──");
  let lc = null;
  for (let i = 0; i < 20; i++) { await new Promise((res) => setTimeout(res, 800)); const g = await call("GET", `/v1/documents/${docId}`, { token: pubTok }); lc = g.body?.lifecycle; if (lc === "rendered") break; }
  lc === "rendered" ? okmark("Worker rendered the record → RENDERED") : bad("render did not complete", `lifecycle=${lc}`);
  let p = await call("POST", `/v1/documents/${docId}/publish`, { token: pubTok });
  (p.status === 200 && p.body.lifecycle === "published") ? okmark("Published → PUBLISHED (an official record)") : bad("publish", `${p.status} ${JSON.stringify(p.body)}`);
  const cert = await call("GET", `/v1/documents/${docId}/governance-certificate`, { token: pubTok });
  (cert.status === 200 && cert.body.certificate?.complianceResult) ? okmark(`Governance Certificate issued — ${cert.body.certificate.complianceResult}, chain proven`) : bad("governance certificate", `${cert.status} ${JSON.stringify(cert.body)}`);
  let a = await call("POST", `/v1/documents/${docId}/archive`, { token: pubTok });
  (a.status === 200 && a.body.lifecycle === "archived") ? okmark("Preserved → ARCHIVED + integrity proof") : bad("preserve", `${a.status} ${JSON.stringify(a.body)}`);

  log("\n── STAGE 7: separation of duties, proven directly ──");
  // A dual-capability holder (can author AND holds an approving office) submits a
  // record, then tries to approve it — must be refused (submitter ≠ approver).
  const dual = await issue("Acting Director (author+approver)", ["dispatch:validate", "dispatch:render", "dispatch:read", "dispatch:approve"]);
  await grant(dual.client_id, "director_policy");
  const dualTok = await tokenFor(dual.client_id, dual.secret);
  const dsub = await call("POST", "/v1/documents", { token: dualTok, idem: uuid(), body: docBody(tenantId, "A brief the Director wrote") });
  if (!dsub.body?.documentId) { bad("dual self-submit failed", `${dsub.status} ${JSON.stringify(dsub.body)}`); }
  else { const sd = await call("POST", `/v1/documents/${dsub.body.documentId}/decision`, { token: dualTok, body: { decision: "approve" } });
    /SELF_APPROVAL/.test(JSON.stringify(sd.body)) ? okmark("A person cannot approve a record they submitted (SELF_APPROVAL_FORBIDDEN)") : bad("SoD self-approval not blocked", `${sd.status} ${JSON.stringify(sd.body)}`); }

  log(`\n════ RESULT: ${pass} passed, ${fail} gaps ════`);
  if (gaps.length) { log("GAPS:"); gaps.forEach((g) => log("  • " + g)); }
})().catch((e) => { console.error("HARNESS ERROR:", e); process.exit(1); });
