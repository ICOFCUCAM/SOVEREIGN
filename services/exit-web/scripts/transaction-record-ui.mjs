// Browser check of the transaction record UI (Closing page), as the seller and as the buyer.
// The Supabase API is replaced by a stand-in that applies the transaction rules, so this tests
// the page — what each party is offered, what it shows — not the database, whose rules are
// tested by exitos_selftest_transaction_lifecycle() (supabase/tests/nda/run.sh).
//
//   VITE_EXITOS_AUTH=email_link VITE_SUPABASE_URL=http://fake.supabase.test VITE_SUPABASE_ANON_KEY=anon-test npx vite --port 5181
//   PLAYWRIGHT=<path to playwright/index.mjs> CHROMIUM=<chromium binary> node scripts/transaction-record-ui.mjs <screenshot dir>
const { chromium } = await import(process.env.PLAYWRIGHT ?? "playwright");
const BASE = process.env.BASE ?? "http://localhost:5181", API = "http://fake.supabase.test", OUT = process.argv[2] ?? ".";
const S = "11111111-1111-4111-8111-111111111111", B = "22222222-2222-4222-8222-222222222222", CO = "co-33333333-3333-4333-8333-333333333333";
const users = { seller: { id: S, email: "seller@test.dev", role: "founder" }, buyer: { id: B, email: "buyer@test.dev", role: "buyer" } };
const terms = { cashPct: 0.85, escrowPct: 0.08, escrowMonths: 18, earnoutPct: 0.1, earnoutMonths: 24, rolloverPct: 0.05, indemnityCapPct: 0.15 };
const db = { txns: [], items: [], confs: [], events: [], nda: { id: "aaaaaaaa-0000-4000-8000-000000000001", listing_id: "L1", company_id: CO, transaction_id: null, owner_account_id: S, buyer_account_id: B,
  state: "executed", executed_at: "2026-10-10T00:00:00Z", access_until: "2027-10-10T00:00:00Z", required_signers: ["seller", "buyer"], issued_at: "2026-10-09T00:00:00Z", title: "NDA",
  // the rest of a real exitos_nda_agreements row
  nda_request_id: "R1", document_version: "v1", document_origin: "seller_supplied", document_text: "Mutual NDA (UI test).", document_sha256: "1".repeat(64), shape: "mutual",
  access_term_months: 12, survival_months: 24, scope_room_kinds: null, ended_at: null, ended_by: null, end_reason: null } };
const now = () => new Date().toISOString();
let n = 0; const id = () => `bbbbbbbb-0000-4000-8000-${String(++n).padStart(12, "0")}`;
const party = (t, uid) => t.seller_account_id === uid ? "seller" : t.buyer_account_id === uid ? "buyer" : null;
const log = (t, uid, action) => db.events.push({ id: db.events.length + 1, transaction_id: t, at: now(), actor: uid, action, details: {} });
const fail = (m) => { throw Object.assign(new Error(m), { status: 400 }); };
function advance(t) {
  const ms = t.state === "negotiating" ? "signing" : t.state === "signed" ? "closing" : null; if (!ms) return t.state;
  const s = db.confs.find((c) => c.transaction_id === t.id && c.milestone === ms && c.party === "seller"), b = db.confs.find((c) => c.transaction_id === t.id && c.milestone === ms && c.party === "buyer");
  if (!s || !b) return t.state;
  if (db.items.some((i) => i.transaction_id === t.id && i.gate === ms && i.required && !["satisfied", "waived"].includes(i.status))) return t.state;
  if (ms === "signing") { if (s.evidence.documentSha256 !== b.evidence.documentSha256) { log(t.id, null, "signing_mismatch"); return t.state; } t.state = "signed"; t.signed_at = now(); return "signed"; }
  if (Number(s.evidence.amountUsd) !== Number(b.evidence.amountUsd)) { log(t.id, null, "closing_mismatch"); return t.state; }
  t.state = "closed"; t.closed_at = now();
  db.items.push(mk(t.id, "post_closing", "Release of the escrow (8.0% of the price) unless claims are notified", "both", "from_terms", "2028-04-14"));
  return "closed";
}
const mk = (txn, gate, title, owner, source = "standard", due = null) => ({ id: id(), transaction_id: txn, gate, title, owner_party: owner, required: true, due_date: due, source, status: "open", evidence: null,
  evidenced_by: null, evidenced_at: null, confirmed_by: null, confirmed_at: null, waiver_requested_by: null, note: null, created_by: S, created_at: now() });
const rpc = {
  exitos_txn_create(uid, a) {
    if (uid !== S) fail("only the listing owner opens a transaction on its offer");
    const t = { id: id(), listing_id: "L1", company_id: CO, seller_account_id: S, buyer_account_id: B, offer_id: a.p_offer, nda_agreement_id: a.p_nda, price_usd: "112000000", terms, state: "negotiating",
      created_at: now(), signed_at: null, closed_at: null, ended_at: null, ended_by: null, end_reason: null };
    db.txns.push(t); db.nda.transaction_id = t.id;
    db.items.push(mk(t.id, "signing", "Definitive agreement in agreed form, approved by both parties' counsel", "both"), mk(t.id, "signing", "Disclosure letter or schedules delivered against the warranties", "seller"),
      mk(t.id, "signing", "Buyer board or investment committee approval", "buyer"), mk(t.id, "closing", "Funds flow agreed, including escrow and any holdback", "both"));
    log(t.id, uid, "created"); return t.id;
  },
  exitos_txn_evidence_item(uid, a) {
    const i = db.items.find((x) => x.id === a.p_item); const t = db.txns.find((x) => x.id === i.transaction_id); const p = party(t, uid);
    if (i.owner_party !== "both" && i.owner_party !== p) fail(`this item is the ${i.owner_party}'s to evidence`);
    Object.assign(i, { status: "evidenced", evidence: { ...a.p_evidence, party: p }, evidenced_by: uid, evidenced_at: now(), confirmed_by: null }); log(t.id, uid, "item_evidenced"); return null;
  },
  exitos_txn_confirm_item(uid, a) {
    const i = db.items.find((x) => x.id === a.p_item); if (i.evidenced_by === uid) fail("the counterparty confirms evidence, never the party that recorded it");
    if (a.p_decision === "confirm") Object.assign(i, { status: "satisfied", confirmed_by: uid, confirmed_at: now(), note: a.p_note }); else Object.assign(i, { status: "open", note: a.p_note });
    log(i.transaction_id, uid, `item_${a.p_decision}ed`); advance(db.txns.find((x) => x.id === i.transaction_id)); return a.p_decision;
  },
  exitos_txn_waive_item(uid, a) {
    const i = db.items.find((x) => x.id === a.p_item);
    if (!i.waiver_requested_by) { i.waiver_requested_by = uid; i.note = a.p_note; return "requested"; }
    if (i.waiver_requested_by === uid) fail("a waiver needs the other party's agreement");
    Object.assign(i, { status: "waived", confirmed_by: uid, note: `${i.note} / ${a.p_note}` }); advance(db.txns.find((x) => x.id === i.transaction_id)); return "waived";
  },
  exitos_txn_confirm_milestone(uid, a) {
    const t = db.txns.find((x) => x.id === a.p_txn); const p = party(t, uid);
    db.confs = db.confs.filter((c) => !(c.transaction_id === t.id && c.milestone === a.p_milestone && c.party === p));
    db.confs.push({ transaction_id: t.id, milestone: a.p_milestone, party: p, account_id: uid, evidence: a.p_evidence, confirmed_at: now() });
    log(t.id, uid, `${a.p_milestone}_confirmed`); return advance(t);
  },
};
const userOf = (h) => Object.values(users).find((u) => (h.authorization ?? "").endsWith(u.id));
async function serve(route) {
  const req = route.request(); const url = new URL(req.url()); const p = url.pathname; const u = userOf(await req.allHeaders());
  const cors = { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS" };
  if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
  const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: cors, body: body === null ? "null" : JSON.stringify(body) });
  try {
    if (p === "/auth/v1/token") { const who = users[JSON.parse(req.postData()).refresh_token]; return json({ access_token: `tok-${who.id}`, refresh_token: who === users.seller ? "seller" : "buyer", expires_in: 3600 }); }
    if (p === "/auth/v1/user") return json({ id: u.id, email: u.email, email_confirmed_at: "2026-10-01T00:00:00Z" });
    if (p.startsWith("/rest/v1/rpc/")) { const fn = p.slice(13); if (!rpc[fn]) return json({}); return json(rpc[fn](u.id, JSON.parse(req.postData() ?? "{}"))); }
    const mine = (t) => party(t, u?.id);
    const ids = (url.searchParams.get("transaction_id") ?? "").replace(/^in\.\(|\)$/g, "").split(",");
    switch (p) {
      case "/rest/v1/exitos_accounts": return json([{ role: u.role }]);
      // SELLER_PLAN=pro gives the seller the operator grant (the only way the app reaches the Pro plan today); otherwise both parties are on the free plan
      case "/rest/v1/exitos_role_grants": return json(u.id === S && process.env.SELLER_PLAN === "pro" ? [{ role: "operator" }] : []);
      case "/rest/v1/exitos_listings": return json(u.id === S ? [{ id: "L1" }] : []);
      case "/rest/v1/exitos_offers": return json(u.id === S ? [{ id: "O1", listing_id: "L1", buyer_account_id: B, data: { amountUsd: 112000000, status: "accepted", terms } }] : []);
      case "/rest/v1/exitos_nda_agreements": return json([db.nda]);
      case "/rest/v1/exitos_transactions": return json(db.txns.filter(mine));
      case "/rest/v1/exitos_transaction_items": return json(db.items.filter((i) => ids.includes(i.transaction_id)));
      case "/rest/v1/exitos_transaction_confirmations": return json(db.confs.filter((i) => ids.includes(i.transaction_id)));
      case "/rest/v1/exitos_transaction_events": return json(db.events.filter((i) => ids.includes(i.transaction_id)));
    }
    return json(req.method() === "GET" ? [] : {});
  } catch (e) { return json({ message: e.message }, e.status ?? 500); }
}
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
async function as(who) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1800 } });
  await ctx.route(`${API}/**`, serve);
  await ctx.addInitScript(([tok, co]) => { localStorage.setItem("exitos.auth.v1", tok); localStorage.setItem("exitos.intake.v2", JSON.stringify({ id: co, inputs: { name: "Northwind Analytics" }, provided: ["name"] })); }, [who, CO]);
  const page = await ctx.newPage(); page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  page.on("requestfailed", (r) => console.log("FAILED", r.url(), r.failure()?.errorText));
  await page.goto(`${BASE}/console/deals`); await page.getByText("Transaction record").first().waitFor({ timeout: 15000 });
  return page;
}
const status = async (pg) => (await pg.locator('[role=status]').first().textContent().catch(() => "")) ?? "";
const reload = async (pg) => { await pg.reload(); await pg.getByText("Transaction record").first().waitFor(); await pg.waitForTimeout(600); };
let failed = 0;
const check = (label, ok) => { if (!ok) failed++; console.log(`${ok ? "PASS" : "FAIL"} ${label}`); };

// O-17: a free account is still sent to the upgrade page for the premium tools, but not for its own deals
async function gated(who, path) {
  const ctx = await browser.newContext(); await ctx.route(`${API}/**`, serve);
  await ctx.addInitScript((tok) => localStorage.setItem("exitos.auth.v1", tok), who);
  const pg = await ctx.newPage(); await pg.goto(`${BASE}${path}`); await pg.waitForTimeout(2500);
  const up = await pg.locator('[data-page="upgrade"]').count(); await ctx.close(); return up > 0;
}
check("free buyer: the Deal Room (premium) still asks for an upgrade", await gated("buyer", "/console/deal-room"));
if (process.env.SELLER_PLAN !== "pro") check("free seller: the Closing Center (premium) still asks for an upgrade", await gated("seller", "/console/closing"));
check("free buyer: Your NDAs and Transactions opens without an upgrade", !(await gated("buyer", "/console/deals")));
const seller = await as("seller");
await seller.waitForTimeout(800);
check("seller is offered to open the transaction from the accepted offer and executed NDA", await seller.getByRole("button", { name: "Open the transaction" }).isVisible());
await seller.getByRole("button", { name: "Open the transaction" }).click(); await seller.waitForTimeout(800);
check("transaction opened, waiting on signing conditions", (await seller.textContent("body")).includes("required signing conditions still open"));
// seller evidences its own item; it cannot evidence the buyer's
const row = (pg, t) => pg.locator("li", { hasText: t }).first();
check("seller has no evidence action on the buyer's condition", !(await row(seller, "Buyer board").getByRole("button", { name: "Record evidence" }).isVisible()));
await row(seller, "Disclosure letter").getByRole("button", { name: "Record evidence" }).click();
await seller.getByLabel(/What was done/).fill("Disclosure letter delivered by Hale & Co on 20 October");
await row(seller, "Disclosure letter").locator("form").getByRole("button", { name: "Record evidence" }).click(); await seller.waitForTimeout(600);
check("evidence recorded, now awaiting the other party", (await row(seller, "Disclosure letter").textContent()).includes("Evidence recorded"));
check("the seller cannot review its own evidence", !(await row(seller, "Disclosure letter").getByRole("button", { name: "Review evidence" }).isVisible()));
const buyer = await as("buyer"); await buyer.waitForTimeout(800);
check("buyer is not offered to open a transaction", !(await buyer.getByRole("button", { name: "Open the transaction" }).isVisible()));
check("buyer sees no closing documents (seller's company intake)", !(await buyer.getByText("Closing documents from this record").isVisible()));
await row(buyer, "Disclosure letter").getByRole("button", { name: "Review evidence" }).click();
await buyer.getByRole("button", { name: "Confirm the evidence" }).click(); await buyer.waitForTimeout(600);
check("buyer confirms: satisfied", (await row(buyer, "Disclosure letter").textContent()).includes("Satisfied"));
// buyer evidences its board approval; agreed form evidenced by buyer; seller confirms both
for (const t of ["Buyer board", "Definitive agreement"]) {
  await row(buyer, t).getByRole("button", { name: "Record evidence" }).click(); await buyer.getByLabel(/What was done/).fill("Board minutes of 22 October approving the purchase");
  await row(buyer, t).locator("form").getByRole("button", { name: "Record evidence" }).click(); await buyer.waitForTimeout(500);
}
await reload(seller);
for (const t of ["Buyer board", "Definitive agreement"]) { await row(seller, t).getByRole("button", { name: "Review evidence" }).click(); await seller.getByRole("button", { name: "Confirm the evidence" }).click(); await seller.waitForTimeout(500); }
check("all signing conditions met → asked to confirm signing", (await seller.textContent("body")).includes("Every signing condition is met. Confirm signing"));
// signing with different hashes → mismatch shown, still negotiating
await seller.getByLabel("Signatory for your side").fill("Ada Park"); await seller.getByLabel("…or its SHA-256").fill("a".repeat(64));
await seller.getByRole("button", { name: "Confirm signing" }).click(); await seller.waitForTimeout(500);
await reload(buyer);
await buyer.getByLabel("Signatory for your side").fill("Jonas Weir"); await buyer.getByLabel("…or its SHA-256").fill("b".repeat(64));
await buyer.getByRole("button", { name: "Confirm signing" }).click(); await buyer.waitForTimeout(600);
check("different agreement hashes: mismatch shown, not signed", (await buyer.getByRole("alert").textContent()).includes("different agreement documents") && (await buyer.textContent("body")).includes("Negotiating"));
await buyer.screenshot({ path: `${OUT}/txn-mismatch.png`, fullPage: true });
await buyer.getByLabel("…or its SHA-256").fill("a".repeat(64)); await buyer.getByRole("button", { name: /Replace your signing confirmation/ }).click(); await buyer.waitForTimeout(600);
check("same hash: signed", (await buyer.textContent("body")).includes("Signed · working to completion"));
// closing: funds flow condition, then amounts
await row(buyer, "Funds flow agreed").getByRole("button", { name: "Record evidence" }).click(); await buyer.getByLabel(/What was done/).fill("Funds flow v3 agreed by both");
await row(buyer, "Funds flow agreed").locator("form").getByRole("button", { name: "Record evidence" }).click(); await buyer.waitForTimeout(400);
await reload(seller); await row(seller, "Funds flow agreed").getByRole("button", { name: "Review evidence" }).click(); await seller.getByRole("button", { name: "Confirm the evidence" }).click(); await seller.waitForTimeout(500);
await seller.getByLabel("Amount paid at completion (USD)").fill("86,240,000"); await seller.getByLabel("Payment reference").fill("CHAPS 7731");
await seller.getByRole("button", { name: "Confirm completion" }).click(); await seller.waitForTimeout(400);
await reload(buyer); await buyer.getByLabel("Amount paid at completion (USD)").fill("86240000"); await buyer.getByLabel("Payment reference").fill("Wire KH-55");
await buyer.getByRole("button", { name: "Confirm completion" }).click(); await buyer.waitForTimeout(600);
check("same amount: completed, post-closing obligation created", (await buyer.textContent("body")).includes("Completed") && (await buyer.textContent("body")).includes("Release of the escrow"));
await reload(seller);
await seller.getByText("Closing documents from this record").click();
await seller.getByRole("tab", { name: "Funds flow and closing statement" }).click(); await seller.waitForTimeout(300);
const pv = await seller.getByLabel("Preview").textContent();
check("funds flow built from the record (both payment references)", pv.includes("CHAPS 7731") && pv.includes("Wire KH-55"));
await seller.getByRole("tab", { name: "Completion announcement (draft)" }).click();
check("announcement needs the buyer's name", (await seller.textContent("body")).includes("Name the buyer"));
await seller.getByLabel("The buyer's name, as the documents should state it").fill("Kestrel Health Systems");
check("announcement drafted with the name", (await seller.getByLabel("Preview").textContent()).includes("acquired by Kestrel Health Systems"));
await seller.screenshot({ path: `${OUT}/txn-closed-seller.png`, fullPage: true });
await browser.close();
process.exitCode = failed ? 1 : 0;
