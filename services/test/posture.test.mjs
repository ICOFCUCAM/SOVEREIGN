// Institutional posture pipeline (item: offices/authority). Proves the pure core
// that turns governance STATE into the institutional sentence an operator reads —
// chainOf (normalise a policy's review chain to ordered, role-bound steps),
// evaluateChain (which office is the OPEN step), and institutionalStatus (the
// "Awaiting Director of Policy" rendering). No DB, no network.
//
// Run: node services/test/posture.test.mjs   (exit 0 = green)
import assert from "node:assert/strict";
import { chainOf, evaluateChain, institutionalStatus } from "../shared/src/governance.mjs";

let passed = 0;
const ok = (n) => { passed++; console.log(`  ✓ ${n}`); };

// ── institutionalStatus — lifecycle → institutional language ──────────────────
assert.equal(institutionalStatus("in_review", { currentAuthority: "Director of Policy" }), "Awaiting Director of Policy");
assert.equal(institutionalStatus("submitted", { currentAuthority: "Permanent Secretary" }), "Awaiting Permanent Secretary");
assert.equal(institutionalStatus("in_review", {}), "Awaiting review");
assert.equal(institutionalStatus("rendered", { publicationAuthority: "Communications Office" }), "Awaiting Communications Office");
assert.equal(institutionalStatus("rendered", {}), "Awaiting publication");
assert.equal(institutionalStatus("approved", {}), "Approved · clearing render");
assert.equal(institutionalStatus("published", {}), "Published");
assert.equal(institutionalStatus("archived", {}), "Preserved");
assert.equal(institutionalStatus("rejected", {}), "Returned for revision");
ok("institutionalStatus speaks offices, never engine states");

// ── chainOf — only role-bearing steps are enforceable, ordered, re-indexed ────
const policy = { review_chain: [
  { index: 1, role: "director_policy", label: "Director of Policy", quorum: 1 },
  { index: 0, label: "A note step with no role" },            // dropped (not enforceable)
  { index: 2, role: "permanent_secretary", label: "Permanent Secretary" },
] };
const chain = chainOf(policy);
assert.equal(chain.length, 2, "non-role steps are dropped");
assert.deepEqual(chain.map((s) => s.role), ["director_policy", "permanent_secretary"], "ordered by original index, re-indexed");
assert.deepEqual(chain.map((s) => s.index), [0, 1]);
ok("chainOf keeps only enforceable offices, in order");

// ── evaluateChain — the OPEN step is the current authority ────────────────────
let ev = evaluateChain([], chain, { submitter: "user:author" });
assert.equal(ev.openStep, 0, "nothing decided → first office is open");
assert.equal(chain[ev.openStep].label, "Director of Policy");

// the Director acts → the open step advances to the Permanent Secretary
ev = evaluateChain([{ decision: "approve", actor: "user:berg", role_key: "director_policy" }], chain, { submitter: "user:author" });
assert.equal(ev.openStep, 1);
assert.equal(chain[ev.openStep].label, "Permanent Secretary");

// both offices act → satisfied, no open step
ev = evaluateChain([
  { decision: "approve", actor: "user:berg", role_key: "director_policy" },
  { decision: "approve", actor: "user:haugen", role_key: "permanent_secretary" },
], chain, { submitter: "user:author" });
assert.equal(ev.openStep, null);
assert.equal(ev.outcome, "satisfied");
ok("evaluateChain advances the open office and recognises satisfaction");

// the submitter's own approval never counts toward an office (separation of duties)
ev = evaluateChain([{ decision: "approve", actor: "user:author", role_key: "director_policy" }], chain, { submitter: "user:author" });
assert.equal(ev.openStep, 0, "submitter cannot satisfy their own record's step");
ok("separation of duties holds in the chain evaluation");

// a reject is terminal
ev = evaluateChain([{ decision: "reject", actor: "user:berg", role_key: "director_policy" }], chain, { submitter: "user:author" });
assert.equal(ev.outcome, "rejected");
assert.equal(ev.openStep, null);
ok("a rejection terminates the chain");

// an expired delegated approval does not count
ev = evaluateChain([{ decision: "approve", actor: "user:acting", role_key: "director_policy", expired: true }], chain, { submitter: "user:author" });
assert.equal(ev.openStep, 0, "expired acting approval is ignored");
ok("expired acting authority does not satisfy an office");

console.log(`\nPosture pipeline: ${passed} checks passed ✓`);
