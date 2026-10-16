// ExitOS certification e2e — an approved ExitOS deal document registered with Dispatch through the same
// code the exit-dispatch-submit edge function runs (supabase/functions/exit-dispatch-submit/certify.mjs).
// Proves: the request envelope passes Dispatch's contract; re-submitting the same version is the same
// record; the document renders, is published and sealed for preservation; it gets an official SD- record
// number; the public verify page confirms it as preserved, withholds the classified title and returns no
// body; a still-rendering document is reported as waiting, not certified; the demo console client is refused.
// Assumes the API on :8787 started with DISPATCH_BILLING_STUB=1, and a superuser pool (as billing.test).
import { readFileSync } from "node:fs";
import pgpkg from "pg";
import { tick } from "../dispatch-worker/src/worker.mjs";
import { dispatchSession, submitForCertification, advanceCertification, CERTIFIABLE_TYPES } from "../../supabase/functions/exit-dispatch-submit/certify.mjs";

const API = "http://127.0.0.1:8787";
const admin = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432), user: "postgres",
  password: process.env.PGADMIN_PASSWORD || "postgres", database: process.env.PGDATABASE || "dispatch", max: 2 });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };
const post = async (path, body, token) => { const r = await fetch(API + path, { method: "POST", headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: JSON.stringify(body) }); return { status: r.status, json: await r.json().catch(() => null) }; };

async function main() {
  console.log("== ExitOS certification e2e ==");
  const fx = JSON.parse(readFileSync(new URL("./fixtures/exitos-loi.json", import.meta.url), "utf8"));
  ok(CERTIFIABLE_TYPES.has(fx.typeId) && !CERTIFIABLE_TYPES.has("exitos.cim"), "letters of intent are certifiable; marketing documents are not");

  // the ExitOS institution: a subscribed tenant and its dedicated client (render, read, publish)
  const su = (await post("/v1/signup", { name: "ExitOS (certification test)" })).json;
  const owner = (await post("/v1/token", { client_id: su.client_id, secret: su.secret })).json.access_token;
  await post("/v1/billing/subscribe", { tier: "institutional_plus" }, owner);
  const cl = (await post("/v1/admin/clients", { name: "svc-exitos", scopes: ["dispatch:render", "dispatch:read", "dispatch:publish"] }, owner)).json;
  ok(cl?.client_id && cl?.secret, "the dedicated ExitOS client is issued with render, read and publish");

  const conn = { base: API, clientId: cl.client_id, secret: cl.secret, fetch };
  const s = await dispatchSession(conn);
  ok(s.tenantId === su.tenantId, "the session is bound to the ExitOS institution");
  let refused = false; try { await dispatchSession({ ...conn, clientId: "svc-a" }); } catch { refused = true; }
  ok(refused, "the demo console client is refused");

  const sub = await submitForCertification(s, fx);
  ok(!!sub.documentId, `the request passes Dispatch's contract (document ${sub.documentId.slice(0, 8)}, ${sub.lifecycle})`);
  const again = await submitForCertification(s, fx);
  ok(again.documentId === sub.documentId, "certifying the same version again is the same record, not a second one");

  const early = await advanceCertification(s, sub.documentId);
  ok(early.state === "requested", `before rendering it is waiting, not certified (${early.state}: ${early.waitingFor ?? early.lifecycle})`);

  // the worker takes queued jobs oldest first: run it until this document is rendered and sealed
  let done = early;
  for (let i = 0; i < 60 && done.state === "requested"; i++) { await tick(); done = await advanceCertification(s, sub.documentId); }
  ok(done.state === "certified" && /^SD-\d{4}-\d{8}$/.test(done.recordId), `rendered, published and sealed: ${done.recordId}`);
  ok(/^[0-9a-f]{64}$/.test(done.integritySha256 ?? ""), "it carries a preservation integrity hash");
  const repeat = await advanceCertification(s, sub.documentId);
  ok(repeat.state === "certified" && repeat.recordId === done.recordId, "checking again changes nothing");

  const v = await (await fetch(`${API}/v1/verify/${done.recordId}`)).json();
  ok(v.verified === true && v.official === true && v.status === "PRESERVED", `the public verify page confirms it (${v.status})`);
  ok(v.titleWithheld === true && v.title === null, "the classified title is withheld from the public");
  ok(!JSON.stringify(v).includes("Heads of Terms") && !("document" in v) && !("sections" in v), "no part of the document body is public");
  ok(v.institution && v.integrityHash === done.integritySha256, `issued by "${v.institution}", with the same integrity hash`);

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  await admin.end();
  process.exit(fail ? 1 : 0);
}
main().catch(async (e) => { console.error("ERROR:", e); try { await admin.end(); } catch {} process.exit(1); });
