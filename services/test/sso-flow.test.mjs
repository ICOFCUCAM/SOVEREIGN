// Institutional SSO (item 2, stage 2) — OIDC relying-party flow, proven against a
// LOCAL mock identity provider. No DB, no network beyond localhost. Exercises the
// security-critical surface: discovery → authorize → code exchange → RS256/JWKS
// ID-token verification, the negative cases (tamper / wrong aud / wrong iss /
// expired / bad nonce), and the Dispatch human-session mint+resolve round-trip.
//
// Run: node services/test/sso-flow.test.mjs   (exit 0 = green)
import http from "node:http";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { discover, buildAuthUrl, exchangeCode, verifyIdToken, OidcError, _resetCaches } from "../shared/src/oidc.mjs";
import { mintUserToken, resolvePrincipal } from "../shared/src/auth.mjs";

const b64url = (b) => Buffer.from(b).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const jwtRS = (payload, kid, privateKey, { alg = "RS256" } = {}) => {
  const header = b64url(JSON.stringify({ alg, kid, typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const sig = b64url(crypto.sign("RSA-SHA256", Buffer.from(`${header}.${body}`), privateKey));
  return `${header}.${body}.${sig}`;
};

// ── A mock OpenID Provider ────────────────────────────────────────────────────
function startMockIdp() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const kid = "mock-key-1";
  const jwk = { ...publicKey.export({ format: "jwk" }), kid, use: "sig", alg: "RS256" };
  const codes = new Map(); // code → { nonce, email, sub }
  let issuer, CLIENT = "dispatch-client";

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, issuer);
    const json = (o) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
    if (url.pathname === "/.well-known/openid-configuration")
      return json({ issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, jwks_uri: `${issuer}/jwks` });
    if (url.pathname === "/jwks") return json({ keys: [jwk] });
    if (url.pathname === "/authorize") {
      // A real IdP shows a login screen; the mock immediately issues a code.
      const code = crypto.randomUUID();
      codes.set(code, { nonce: url.searchParams.get("nonce"), email: "m.haugen@kd.dep.no", sub: "idp|haugen" });
      const back = new URL(url.searchParams.get("redirect_uri"));
      back.searchParams.set("code", code); back.searchParams.set("state", url.searchParams.get("state"));
      res.writeHead(302, { location: back.toString() }); return res.end();
    }
    if (url.pathname === "/token") {
      let body = ""; req.on("data", (c) => (body += c)); req.on("end", () => {
        const code = new URLSearchParams(body).get("code");
        const rec = codes.get(code);
        if (!rec) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ error: "invalid_grant" })); }
        codes.delete(code);
        const now = Math.floor(Date.now() / 1000);
        const id_token = jwtRS({ iss: issuer, aud: CLIENT, sub: rec.sub, email: rec.email, nonce: rec.nonce, iat: now, exp: now + 300 }, kid, privateKey);
        json({ token_type: "Bearer", access_token: "mock-at", id_token, expires_in: 300 });
      });
      return;
    }
    res.writeHead(404); res.end();
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    issuer = `http://127.0.0.1:${server.address().port}`;
    resolve({ server, issuer, kid, privateKey, jwk, client: CLIENT });
  }));
}

let passed = 0;
const ok = (name) => { passed++; console.log(`  ✓ ${name}`); };

(async () => {
  process.env.DISPATCH_TOKEN_SECRET = process.env.DISPATCH_TOKEN_SECRET || "test-secret-for-sso-flow";
  const idp = await startMockIdp();
  const redirectUri = "http://127.0.0.1:8787/v1/auth/sso/callback";

  // 1 — discovery resolves real endpoints
  _resetCaches();
  const disco = await discover(idp.issuer);
  assert.equal(disco.token_endpoint, `${idp.issuer}/token`);
  ok("discovery resolves the provider endpoints");

  // 2 — full happy-path: authorize → code → exchange → verify
  const nonce = crypto.randomUUID();
  const authUrl = buildAuthUrl({ authorization_endpoint: disco.authorization_endpoint, clientId: idp.client, redirectUri, scope: "openid email profile", state: "st", nonce });
  const authResp = await fetch(authUrl, { redirect: "manual" });
  const cbUrl = new URL(authResp.headers.get("location"));
  const code = cbUrl.searchParams.get("code");
  assert.ok(code, "IdP returned an authorization code");
  const tokens = await exchangeCode({ token_endpoint: disco.token_endpoint, code, clientId: idp.client, clientSecret: "shh", redirectUri });
  const claims = await verifyIdToken(tokens.id_token, { jwks_uri: disco.jwks_uri, issuer: idp.issuer, audience: idp.client, nonce });
  assert.equal(claims.email, "m.haugen@kd.dep.no");
  ok("authorize → code → exchange → verified ID token (email extracted)");

  // 3 — a tampered ID token is rejected
  const tampered = tokens.id_token.slice(0, -4) + "AAAA";
  await assert.rejects(() => verifyIdToken(tampered, { jwks_uri: disco.jwks_uri, issuer: idp.issuer, audience: idp.client, nonce }), (e) => e instanceof OidcError);
  ok("tampered signature rejected");

  // 4 — wrong audience / issuer / nonce rejected
  await assert.rejects(() => verifyIdToken(tokens.id_token, { jwks_uri: disco.jwks_uri, issuer: idp.issuer, audience: "someone-else", nonce }), (e) => e.code === "AUDIENCE");
  await assert.rejects(() => verifyIdToken(tokens.id_token, { jwks_uri: disco.jwks_uri, issuer: "https://evil.example", audience: idp.client, nonce }), (e) => e.code === "ISSUER");
  await assert.rejects(() => verifyIdToken(tokens.id_token, { jwks_uri: disco.jwks_uri, issuer: idp.issuer, audience: idp.client, nonce: "not-the-nonce" }), (e) => e.code === "NONCE");
  ok("wrong audience / issuer / nonce each rejected");

  // 5 — an expired ID token is rejected
  const now = Math.floor(Date.now() / 1000);
  const expired = jwtRS({ iss: idp.issuer, aud: idp.client, sub: "x", email: "x@y", nonce, iat: now - 1000, exp: now - 500 }, idp.kid, idp.privateKey);
  await assert.rejects(() => verifyIdToken(expired, { jwks_uri: disco.jwks_uri, issuer: idp.issuer, audience: idp.client, nonce }), (e) => e.code === "EXPIRED");
  ok("expired ID token rejected");

  // 6 — an "alg: none" / non-RS256 token is rejected (no algorithm confusion)
  const noneTok = `${b64url(JSON.stringify({ alg: "none", kid: idp.kid, typ: "JWT" }))}.${b64url(JSON.stringify({ iss: idp.issuer, aud: idp.client, nonce }))}.`;
  await assert.rejects(() => verifyIdToken(noneTok, { jwks_uri: disco.jwks_uri, issuer: idp.issuer, audience: idp.client, nonce }), (e) => e.code === "ALG");
  ok("alg:none rejected (no downgrade)");

  // 7 — Dispatch human-session mint → resolvePrincipal round-trip
  const tenantId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const minted = mintUserToken({ tenantId, userId: "person-123", scopes: ["dispatch:read", "dispatch:approve"], clearance: "official", role: "approver" });
  assert.ok(minted.token, "minted a human session token");
  const resolved = await resolvePrincipal(null, `Bearer ${minted.token}`, async () => null);
  assert.ok(resolved.principal, "human token resolves to a principal");
  assert.equal(resolved.principal.principalType, "user");
  assert.equal(resolved.principal.tenantId, tenantId);
  assert.equal(resolved.principal.actor, "user:person-123", "actor is user:<id> — binds to office grants");
  assert.deepEqual(resolved.principal.scopes, ["dispatch:read", "dispatch:approve"]);
  ok("human session mints and resolves to user:<id> with its scopes");

  idp.server.close();
  console.log(`\nSSO flow: ${passed} checks passed ✓`);
})().catch((e) => { console.error("\nSSO flow FAILED:", e); process.exit(1); });
