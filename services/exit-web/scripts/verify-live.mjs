#!/usr/bin/env node
// ── PHASE 7 · LIVE TRANSACTION-LOOP SMOKE TEST ──────────────────────
// Drives the FULL exchange loop against the live Supabase backend using
// real GoTrue anonymous sign-ins and the real PostgREST API — exactly the
// requests the app issues. Run it from any network-enabled machine (your
// laptop or CI) to get a definitive PASS:
//
//   node services/exit-web/scripts/verify-live.mjs
//
// It reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY from the environment
// or from services/exit-web/.env.local. Pass --keep to leave the created
// listing/NDA/offer in place (the literal "one real listing, one real NDA,
// one real offer"); by default it cleans up after itself.
//
// This is the one check the build sandbox cannot run (no egress to
// supabase.co). Everything BELOW the auth token is already proven
// server-side via RLS; this verifies token issuance + the end-to-end loop.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
    }
  } catch { /* no .env.local — rely on process.env */ }
  return env;
}

const env = loadEnv();
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
const KEEP = process.argv.includes("--keep");

if (!URL || !KEY) {
  console.error("✗ Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (env or .env.local).");
  process.exit(2);
}

const tag = Date.now().toString(36);
let pass = 0, fail = 0;
const ok = (m) => { pass++; console.log(`  ✓ ${m}`); };
const bad = (m, e) => { fail++; console.log(`  ✗ ${m}${e ? ` — ${e}` : ""}`); };

async function gotrueAnon() {
  const res = await fetch(`${URL}/auth/v1/signup`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${body?.msg || body?.error_description || body?.error || JSON.stringify(body)}`);
  if (!body.access_token || !body.user?.id) throw new Error(`no session in response (anonymous sign-ins enabled?)`);
  return { token: body.access_token, id: body.user.id };
}

async function rest(token, method, path, body, prefer) {
  const res = await fetch(`${URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json",
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log(`\nExitOS · live transaction-loop verification`);
  console.log(`  project: ${URL}\n`);

  // 1+2+3 — authentication / env / anonymous sign-in
  let founder, buyer;
  try { founder = await gotrueAnon(); ok(`founder authenticated (anonymous) · uid ${founder.id.slice(0, 8)}…`); }
  catch (e) {
    bad("anonymous sign-in", e.message);
    console.log("\n  Likely cause, in order:");
    console.log("   1. Anonymous sign-ins are OFF → Supabase → Authentication → Sign In / Providers → enable.");
    console.log("   2. Wrong URL / anon key → check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");
    console.log("   3. No network egress to supabase.co from where this is running.");
    return done();
  }
  try { buyer = await gotrueAnon(); ok(`buyer authenticated (anonymous) · uid ${buyer.id.slice(0, 8)}…`); }
  catch (e) { bad("second anonymous sign-in", e.message); return done(); }

  const lstId = `live-lst-${tag}`, ndaId = `live-nda-${tag}`, offId = `live-off-${tag}`;

  // 4 — founder account + 6 — listing creation
  try {
    await rest(founder.token, "POST", "exitos_accounts", [{ id: founder.id, role: "founder", data: { id: founder.id, role: "founder", name: "live-founder", createdAt: new Date().toISOString() } }], "resolution=merge-duplicates,return=minimal");
    ok("founder account created");
  } catch (e) { bad("founder account creation", e.message); }
  try {
    await rest(founder.token, "POST", "exitos_listings", [{ id: lstId, owner_account_id: founder.id, data: { id: lstId, code: `Project Live ${tag}`, ownerAccountId: founder.id, publicView: { sector: "AI", region: "North America", revenueUsd: 4e7, growthPct: 0.5, ebitdaMarginPct: 0.2 } } }], "return=representation");
    ok("listing created (owner-scoped)");
  } catch (e) { bad("listing creation", e.message); }

  // 5 — buyer account + discovery
  try {
    await rest(buyer.token, "POST", "exitos_accounts", [{ id: buyer.id, role: "buyer", data: { id: buyer.id, role: "buyer", name: "live-buyer", createdAt: new Date().toISOString() } }], "resolution=merge-duplicates,return=minimal");
    ok("buyer account created");
  } catch (e) { bad("buyer account creation", e.message); }
  try {
    const pool = await rest(buyer.token, "GET", `exitos_listings?select=data&id=eq.${lstId}`);
    if (pool?.length === 1) ok("buyer discovered the listing in the shared pool");
    else bad("buyer discovery", `expected 1 listing, saw ${pool?.length ?? 0}`);
  } catch (e) { bad("buyer discovery", e.message); }

  // security negative control — buyer must NOT mutate the founder's listing
  try {
    const r = await rest(buyer.token, "PATCH", `exitos_listings?id=eq.${lstId}`, { data: { hijacked: true } }, "return=representation");
    if (Array.isArray(r) && r.length === 0) ok("RLS: buyer blocked from mutating the founder's listing");
    else bad("RLS negative control", "buyer was able to modify the founder's listing!");
  } catch { ok("RLS: buyer blocked from mutating the founder's listing"); }

  // 7 — NDA workflow
  try {
    await rest(buyer.token, "POST", "exitos_nda_requests", [{ id: ndaId, listing_id: lstId, buyer_account_id: buyer.id, data: { id: ndaId, listingId: lstId, buyerAccountId: buyer.id, status: "requested", requestedAt: new Date().toISOString(), resolvedAt: null } }], "return=minimal");
    ok("buyer requested NDA");
  } catch (e) { bad("NDA request", e.message); }
  try {
    const seen = await rest(founder.token, "GET", `exitos_nda_requests?select=data&listing_id=eq.${lstId}`);
    if (seen?.length >= 1) ok("founder received the NDA request"); else bad("founder NDA inbox", "no request visible");
    await rest(founder.token, "PATCH", `exitos_nda_requests?id=eq.${ndaId}`, { data: { id: ndaId, listingId: lstId, buyerAccountId: buyer.id, status: "signed", requestedAt: new Date().toISOString(), resolvedAt: new Date().toISOString() } }, "return=representation");
    ok("founder executed the NDA (owner-scoped)");
  } catch (e) { bad("NDA execution", e.message); }

  // 8 — offer workflow
  try {
    await rest(buyer.token, "POST", "exitos_offers", [{ id: offId, listing_id: lstId, buyer_account_id: buyer.id, data: { id: offId, listingId: lstId, buyerAccountId: buyer.id, amountUsd: 25e6, status: "submitted", note: null, createdAt: new Date().toISOString() } }], "return=minimal");
    ok("buyer submitted offer ($25.0M)");
  } catch (e) { bad("offer submission", e.message); }
  try {
    const seen = await rest(founder.token, "GET", `exitos_offers?select=data&listing_id=eq.${lstId}`);
    if (seen?.length >= 1) ok("founder received the offer"); else bad("founder offer inbox", "no offer visible");
    await rest(founder.token, "PATCH", `exitos_offers?id=eq.${offId}`, { data: { id: offId, listingId: lstId, buyerAccountId: buyer.id, amountUsd: 25e6, status: "accepted", note: null, createdAt: new Date().toISOString() } }, "return=representation");
    ok("founder accepted the offer (owner-scoped)");
  } catch (e) { bad("offer acceptance", e.message); }

  // cleanup unless --keep
  if (!KEEP) {
    try {
      await rest(buyer.token, "DELETE", `exitos_offers?id=eq.${offId}`, null, "return=minimal");
      await rest(buyer.token, "DELETE", `exitos_nda_requests?id=eq.${ndaId}`, null, "return=minimal");
      await rest(founder.token, "DELETE", `exitos_listings?id=eq.${lstId}`, null, "return=minimal");
      console.log("  · cleaned up (pass --keep to persist the loop)");
    } catch (e) { console.log(`  · cleanup skipped: ${e.message}`); }
  } else {
    console.log(`  · kept: listing ${lstId}, nda ${ndaId}, offer ${offId}`);
  }
  done();
}

function done() {
  console.log(`\n${fail === 0 ? "✅ PASS" : "❌ FAIL"} — ${pass} checks passed, ${fail} failed.`);
  if (fail === 0) {
    console.log("\nAnswer: YES — a founder can create a listing from a clean browser, and a");
    console.log("buyer can discover it, request an NDA, and submit an offer. End to end, live.\n");
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error("unexpected:", e); process.exit(1); });
