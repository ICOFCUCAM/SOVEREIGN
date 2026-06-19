// OAuth callback integration — self-contained: starts a stub IdP token endpoint,
// spawns the API as a child wired to it, seeds a member, then drives
// GET /v1/auth/config + POST /v1/auth/callback and asserts the returned
// principal is membership-authoritative. Mints Supabase-style user JWTs signed
// with SUPABASE_JWT_SECRET (shared with the spawned API).
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pgpkg from "pg";
import { signJwt } from "../shared/src/jwt.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SECRET = "supabase-test-secret-32-bytes-minimum";
const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const STUB_PORT = 9911;
const API_PORT = 8799;
const API = `http://127.0.0.1:${API_PORT}`;
const MEMBER_ID = crypto.randomUUID();

const admin = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432), user: "postgres", database: process.env.PGDATABASE || "dispatch", max: 3 });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Stub IdP token endpoint: 'good-code' → member token, 'stranger' → token for a
// non-member, anything else → invalid_grant.
function startStubIdp() {
  return http.createServer((req, res) => {
    let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
      const code = new URLSearchParams(b).get("code");
      const mint = (sub) => signJwt({ sub, tenant_id: TENANT_A }, SECRET, { expiresIn: 900, issuer: "sovereign-dispatch" });
      if (code === "good-code") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ access_token: mint(MEMBER_ID), token_type: "Bearer", expires_in: 900 })); }
      if (code === "stranger") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ access_token: mint(crypto.randomUUID()), token_type: "Bearer", expires_in: 900 })); }
      res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "invalid_grant", error_description: "bad code" }));
    });
  }).listen(STUB_PORT);
}

async function waitHealth(timeoutMs = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    try { const r = await fetch(API + "/v1/health"); if (r.ok) return true; } catch { /* not up */ }
    await sleep(200);
  }
  return false;
}

async function main() {
  console.log("== OAuth callback (live API + stub IdP) ==");
  await admin.query(`insert into dispatch.memberships (tenant_id, user_id, role, clearance, status)
     values ($1,$2,'publisher','secret','active') on conflict (tenant_id,user_id) do update set role=excluded.role, clearance=excluded.clearance, status=excluded.status`,
    [TENANT_A, MEMBER_ID]);

  const idp = startStubIdp();
  const api = spawn(process.execPath, [join(HERE, "..", "dispatch-api", "src", "server.mjs")], {
    env: { ...process.env,
      PGHOST: process.env.PGHOST || "/tmp", PGPORT: process.env.PGPORT || "55432", PGDATABASE: "dispatch", DISPATCH_DB_USER: "dispatch_app",
      DISPATCH_TOKEN_SECRET: "test-secret-32-bytes-minimum-aaaa", SUPABASE_JWT_SECRET: SECRET, DISPATCH_STORAGE_DIR: "/tmp/dispatch-artifacts",
      PORT: String(API_PORT),
      OAUTH_AUTHORIZE_URL: "https://idp.example/authorize", OAUTH_TOKEN_URL: `http://127.0.0.1:${STUB_PORT}/token`,
      OAUTH_CLIENT_ID: "dispatch-console", OAUTH_REDIRECT_URI: "http://127.0.0.1:9999/cb", OAUTH_SCOPES: "openid email" },
    stdio: "ignore",
  });

  try {
    if (!(await waitHealth())) { console.log("  FAIL api did not start"); fail++; throw new Error("no api"); }

    const cfg = await fetch(API + "/v1/auth/config").then((r) => r.json());
    ok(cfg.enabled === true && /idp.example/.test(cfg.authorizeUrl) && cfg.clientId === "dispatch-console", "GET /v1/auth/config → enabled + authorize URL + client_id");
    ok(!("clientSecret" in cfg) && !("client_secret" in cfg), "config carries no secret");

    const cb = await fetch(API + "/v1/auth/callback", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "good-code", codeVerifier: "verifier-x", redirectUri: "http://127.0.0.1:9999/cb" }) }).then(async (r) => ({ status: r.status, json: await r.json() }));
    ok(cb.status === 200 && cb.json.accessToken && cb.json.principal, "POST /v1/auth/callback → 200 + token + principal");
    ok(cb.json.principal.role === "publisher" && cb.json.principal.clearance === "secret" && cb.json.principal.scopes.includes("dispatch:publish"),
      "callback principal is membership-authoritative (publisher/secret)");

    const bad = await fetch(API + "/v1/auth/callback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: "nope", codeVerifier: "v" }) }).then(async (r) => ({ status: r.status, json: await r.json() }));
    ok(bad.status === 401 && bad.json.error.code === "OAUTH_EXCHANGE_FAILED", "rejected code → 401 OAUTH_EXCHANGE_FAILED");

    const stranger = await fetch(API + "/v1/auth/callback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: "stranger", codeVerifier: "v" }) }).then(async (r) => ({ status: r.status, json: await r.json() }));
    ok(stranger.status === 403 && stranger.json.error.code === "NO_MEMBERSHIP", "valid token but no membership → 403 NO_MEMBERSHIP");
  } finally {
    api.kill(); idp.close(); await admin.end();
  }

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
