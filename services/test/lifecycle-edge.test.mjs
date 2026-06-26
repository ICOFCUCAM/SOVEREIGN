// Extended dogfood — harder institutional paths: rejection, return-for-revision,
// quorum > 1 (two distinct office-holders), and an ACTING appointment approving
// on behalf of an office. Against the live local engine.
const API = "http://127.0.0.1:8787";
let pass = 0; const gaps = [];
const okmark = (n) => { pass++; console.log(`  ✓ ${n}`); };
const bad = (n, d) => { gaps.push(`${n} — ${d}`); console.log(`  ✗ ${n}  [${d}]`); };
async function call(method, path, { token, body, idem } = {}) {
  const headers = {}; if (token) headers.authorization = "Bearer " + token;
  if (body !== undefined) headers["content-type"] = "application/json"; if (idem) headers["idempotency-key"] = idem;
  const r = await fetch(API + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  return { status: r.status, body: await r.json().catch(() => null) };
}
const tok = async (id, s) => (await call("POST", "/v1/token", { body: { client_id: id, secret: s } })).body.access_token;
const uuid = () => crypto.randomUUID();
const doc = (tenantId, title, docType = "executive_briefing", level = "UNCLASSIFIED") => ({
  schemaVersion: "1.0", idempotencyKey: uuid(), source: { system: "saas-ui", tenantId },
  document: { ddmVersion: "1.0", docType, metadata: { title, date: "2026-06-26", status: "final" },
    classification: { scheme: level === "UNCLASSIFIED" ? "none" : "uk_gov", level }, sections: [
      { id: "s1", role: "executive_summary", heading: "Executive Summary", level: 1, blocks: [{ id: "b1", type: "paragraph", text: "BLUF.", style: "lead" }] },
      { id: "s2", role: "key_judgements", heading: "Key Judgements", level: 1, blocks: [{ id: "b2", type: "bullets", ordered: true, items: [{ text: "One." }, { text: "Two." }] }] },
      { id: "s3", role: "analysis", heading: "Analysis", level: 1, blocks: [{ id: "b3", type: "paragraph", text: "Body." }] },
      { id: "s4", role: "recommendation", heading: "Recommendation", level: 1, blocks: [{ id: "b4", type: "callout", style: "recommendation", text: "Proceed." }] },
    ] }, outputs: ["pdf"], delivery: { mode: "async", storage: "signed_url", ttlSeconds: 604800 },
});

(async () => {
  const su = (await call("POST", "/v1/signup", { body: { name: "Ministry of Health" } })).body;
  const tenantId = su.tenantId; const admin = await tok(su.client_id, su.secret);
  await call("POST", "/v1/billing/subscribe", { token: admin }); // lift the free 3-record quota for the exercise
  for (const [k, l] of [["director_policy", "Director"], ["permanent_secretary", "Permanent Secretary"]])
    await call("POST", "/v1/governance/roles", { token: admin, body: { key: k, label: l } });
  const issue = async (name, scopes) => (await call("POST", "/v1/admin/clients", { token: admin, body: { name, scopes } })).body;
  const grant = (cid, rk) => call("POST", "/v1/governance/grants", { token: admin, body: { subject: `svc:${cid}`, roleKey: rk } });
  const A = ["dispatch:validate", "dispatch:render", "dispatch:read"], AP = ["dispatch:read", "dispatch:approve"];
  const author = await issue("Author", A), dir1 = await issue("Director 1", AP), dir2 = await issue("Director 2", AP), sec = await issue("Secretary", AP), acting = await issue("Acting Director", AP);
  await grant(dir1.client_id, "director_policy"); await grant(dir2.client_id, "director_policy"); await grant(sec.client_id, "permanent_secretary");
  const [authorT, dir1T, dir2T, secT, actingT] = await Promise.all([tok(author.client_id, author.secret), tok(dir1.client_id, dir1.secret), tok(dir2.client_id, dir2.secret), tok(sec.client_id, sec.secret), tok(acting.client_id, acting.secret)]);

  console.log("\n── A. REJECTION ──");
  await call("POST", "/v1/governance/policies", { token: admin, body: { name: "Exec Briefing", docType: "executive_briefing", reviewChain: [{ role: "director_policy", label: "Director", quorum: 1 }, { role: "permanent_secretary", label: "Permanent Secretary", quorum: 1 }], autoApproveService: false, sequential: true } });
  let id = (await call("POST", "/v1/documents", { token: authorT, idem: uuid(), body: doc(tenantId, "To be rejected") })).body.documentId;
  let d = await call("POST", `/v1/documents/${id}/decision`, { token: dir1T, body: { decision: "reject", comment: "not ready" } });
  (d.status === 200 && d.body.lifecycle === "rejected") ? okmark("Director rejects → REJECTED (off the publication path)") : bad("reject", `${d.status} ${JSON.stringify(d.body)}`);
  d = await call("POST", `/v1/documents/${id}/decision`, { token: secT, body: { decision: "approve" } });
  (d.status >= 400) ? okmark("A rejected record cannot then be approved") : bad("approve-after-reject not blocked", `${d.status} ${JSON.stringify(d.body)}`);

  console.log("\n── B. RETURN FOR REVISION ──");
  id = (await call("POST", "/v1/documents", { token: authorT, idem: uuid(), body: doc(tenantId, "To be returned") })).body.documentId;
  d = await call("POST", `/v1/documents/${id}/decision`, { token: dir1T, body: { decision: "return", comment: "tighten the BLUF" } });
  (d.status === 200 && (d.body.lifecycle === "draft" || d.body.lifecycle === "rejected")) ? okmark(`Director returns → ${d.body.lifecycle} (back for revision)`) : bad("return", `${d.status} ${JSON.stringify(d.body)}`);

  console.log("\n── C. QUORUM > 1 (two distinct Directors) ──");
  // A more-specific policy: OFFICIAL executive briefings need TWO Directors.
  await call("POST", "/v1/governance/policies", { token: admin, body: { name: "Exec Briefing (OFFICIAL)", docType: "executive_briefing", classificationLevel: "OFFICIAL", reviewChain: [{ role: "director_policy", label: "Director", quorum: 2 }], autoApproveService: false, sequential: true } });
  id = (await call("POST", "/v1/documents", { token: authorT, idem: uuid(), body: doc(tenantId, "Two-director sign-off", "executive_briefing", "OFFICIAL") })).body.documentId;
  d = await call("POST", `/v1/documents/${id}/decision`, { token: dir1T, body: { decision: "approve" } });
  (d.status === 200 && d.body.lifecycle === "in_review") ? okmark("First Director approves → still in review (1 of 2)") : bad("quorum first", `${d.status} ${JSON.stringify(d.body)}`);
  d = await call("POST", `/v1/documents/${id}/decision`, { token: dir1T, body: { decision: "approve" } });
  (d.status === 409) ? okmark("Same Director cannot supply the second approval") : bad("quorum dup not blocked", `${d.status} ${JSON.stringify(d.body)}`);
  d = await call("POST", `/v1/documents/${id}/decision`, { token: dir2T, body: { decision: "approve" } });
  (d.status === 200 && d.body.lifecycle === "approved") ? okmark("Second distinct Director approves → quorum met → APPROVED") : bad("quorum met", `${d.status} ${JSON.stringify(d.body)}`);

  console.log("\n── D. ACTING APPOINTMENT approves on behalf of the office ──");
  // The substantive Director is unavailable; appoint an acting Director for a window.
  const del = await call("POST", "/v1/governance/delegations", { token: admin, body: { roleKey: "director_policy", delegateSubject: `svc:${acting.client_id}`, reason: "Director on leave", endsAt: new Date(Date.now() + 7 * 864e5).toISOString() } });
  (del.status === 201) ? okmark("Acting Director appointed (delegation)") : bad("appoint acting", `${del.status} ${JSON.stringify(del.body)}`);
  id = (await call("POST", "/v1/documents", { token: authorT, idem: uuid(), body: doc(tenantId, "Acting approves this") })).body.documentId;
  d = await call("POST", `/v1/documents/${id}/decision`, { token: actingT, body: { decision: "approve" } });
  (d.status === 200 && d.body.lifecycle === "in_review") ? okmark("Acting Director approves the Director step (on behalf of the office) → advances") : bad("acting approve", `${d.status} ${JSON.stringify(d.body)}`);
  d = await call("POST", `/v1/documents/${id}/decision`, { token: secT, body: { decision: "approve" } });
  (d.status === 200 && d.body.lifecycle === "approved") ? okmark("Permanent Secretary approves → APPROVED (acting authority counted)") : bad("after acting", `${d.status} ${JSON.stringify(d.body)}`);

  console.log("\n── E. A principal with no office cannot approve ──");
  id = (await call("POST", "/v1/documents", { token: authorT, idem: uuid(), body: doc(tenantId, "Stranger cannot approve") })).body.documentId;
  d = await call("POST", `/v1/documents/${id}/decision`, { token: actingT, body: { decision: "approve" } }); // acting still holds via delegation → should advance; use sec then a no-office holder
  // Use the author? author has no approve scope. Issue a no-office approver:
  const stranger = await issue("No-office approver", AP); const strangerT = await tok(stranger.client_id, stranger.secret);
  const id2 = (await call("POST", "/v1/documents", { token: authorT, idem: uuid(), body: doc(tenantId, "No-office try") })).body.documentId;
  d = await call("POST", `/v1/documents/${id2}/decision`, { token: strangerT, body: { decision: "approve" } });
  (d.status >= 400 && /ROLE_NOT_GRANTED|STEP_NOT_OPEN/.test(JSON.stringify(d.body))) ? okmark("A principal holding no office in the chain is refused (ROLE_NOT_GRANTED)") : bad("no-office not refused", `${d.status} ${JSON.stringify(d.body)}`);

  console.log(`\n════ EXTENDED DOGFOOD: ${pass} passed, ${gaps.length} gaps ════`);
  if (gaps.length) gaps.forEach((g) => console.log("  • " + g));
})().catch((e) => { console.error("ERROR:", e); process.exit(1); });
