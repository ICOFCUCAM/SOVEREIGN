// Refresh-token rotation + reuse detection — self-contained: spawns the API +
// a stub IdP, logs in via the OAuth callback to obtain the first session, then:
//   - the access token works as a Bearer (whoami).
//   - refresh rotates: returns a new access + new refresh; old refresh is dead.
//   - reusing a rotated refresh → 401 REFRESH_REUSE_DETECTED + the family is
//     revoked (the successor stops working too).
//   - logout revokes the current refresh.
//   - role change is picked up at refresh (membership-authoritative).
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
const STUB_PORT = 9931, API_PORT = 8801;
const API = `http://127.0.0.1:${API_PORT}`;
const MEMBER = crypto.randomUUID();

const admin = new pgpkg.Pool({ host: process.env.PGHOST || "/tmp", port: Number(process.env.PGPORT || 55432), user: "postgres", database: process.env.PGDATABASE || "dispatch", max: 3 });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (p, body, extra) => fetch(API + p, { method: "POST", headers: { "content-type": "application/json", ...(extra || {}) }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => null) }));

function startStubIdp() {
  return http.createServer((req, res) => {
    let b = ""; req.on("data", (d) => (b += d)); req.on("end", () => {
      const code = new URLSearchParams(b).get("code");
      if (code === "good-code") {
        const t = signJwt({ sub: MEMBER, tenant_id: TENANT_A }, SECRET, { expiresIn: 900, issuer: "sovereign-dispatch" });
        res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ access_token: t, token_type: "Bearer", expires_in: 900 }));
      }
      res.writeHead(400, { "content-type": "application/json" }); res.end(JSON.stringify({ error: "invalid_grant" }));
    });
  }).listen(STUB_PORT);
}
async function waitHealth(t = 8000) { const s = Date.now(); while (Date.now() - s < t) { try { if ((await fetch(API + "/v1/health")).ok) return true; } catch { /* */ } await sleep(200); } return false; }

async function main() {
  console.log("== refresh-token rotation + reuse detection ==");
  await admin.query(`insert into dispatch.memberships (tenant_id,user_id,role,clearance,status) values ($1,$2,'author','none','active')
    on conflict (tenant_id,user_id) do update set role=excluded.role, clearance=excluded.clearance, status='active'`, [TENANT_A, MEMBER]);

  const idp = startStubIdp();
  const api = spawn(process.execPath, [join(HERE, "..", "dispatch-api", "src", "server.mjs")], { env: { ...process.env,
    PGHOST: process.env.PGHOST || "/tmp", PGPORT: process.env.PGPORT || "55432", PGDATABASE: "dispatch", DISPATCH_DB_USER: "dispatch_app",
    DISPATCH_TOKEN_SECRET: "test-secret-32-bytes-minimum-aaaa", SUPABASE_JWT_SECRET: SECRET, DISPATCH_STORAGE_DIR: "/tmp/dispatch-artifacts", PORT: String(API_PORT),
    OAUTH_AUTHORIZE_URL: "https://idp.example/authorize", OAUTH_TOKEN_URL: `http://127.0.0.1:${STUB_PORT}/token`, OAUTH_CLIENT_ID: "dispatch-console", OAUTH_REDIRECT_URI: "http://127.0.0.1:9999/cb" }, stdio: "ignore" });

  try {
    if (!(await waitHealth())) { ok(false, "api started"); throw new Error("no api"); }

    // login via callback → first session
    const login = await post("/v1/auth/callback", { code: "good-code", codeVerifier: "v" });
    ok(login.status === 200 && login.json.accessToken && login.json.refreshToken, "login → access + refresh token");
    ok(login.json.principal.role === "author", "session principal is membership-authoritative");
    const access1 = login.json.accessToken, refresh1 = login.json.refreshToken;

    // access token works as Bearer
    const who = await fetch(API + "/v1/whoami", { headers: { authorization: "Bearer " + access1 } }).then(async (r) => ({ status: r.status, json: await r.json() }));
    ok(who.status === 200 && who.json.role === "author" && who.json.principalType === "user", "Dispatch access token authenticates (whoami)");

    // refresh rotates
    const r1 = await post("/v1/auth/refresh", { refreshToken: refresh1 });
    ok(r1.status === 200 && r1.json.accessToken && r1.json.refreshToken && r1.json.refreshToken !== refresh1, "refresh → new access + NEW refresh (rotated)");
    const refresh2 = r1.json.refreshToken;

    // new access token works
    const who2 = await fetch(API + "/v1/whoami", { headers: { authorization: "Bearer " + r1.json.accessToken } }).then((r) => r.status);
    ok(who2 === 200, "rotated access token authenticates");

    // role change picked up at next refresh
    await admin.query("update dispatch.memberships set role='publisher' where tenant_id=$1 and user_id=$2", [TENANT_A, MEMBER]);
    const r2 = await post("/v1/auth/refresh", { refreshToken: refresh2 });
    ok(r2.status === 200 && r2.json.principal.role === "publisher" && r2.json.principal.scopes.includes("dispatch:publish"), "role change reflected at refresh (membership-authoritative)");
    const refresh3 = r2.json.refreshToken;

    // REUSE: replay the already-rotated refresh2 → reuse detected, family revoked
    const reuse = await post("/v1/auth/refresh", { refreshToken: refresh2 });
    ok(reuse.status === 401 && reuse.json.error.code === "REFRESH_REUSE_DETECTED", "reusing a rotated refresh → 401 REFRESH_REUSE_DETECTED");

    // family revoked → even the latest good token (refresh3) is now dead
    const after = await post("/v1/auth/refresh", { refreshToken: refresh3 });
    ok(after.status === 401, "family revoked after reuse → latest refresh also rejected");

    // a fresh login, then logout revokes its refresh
    const login2 = await post("/v1/auth/callback", { code: "good-code", codeVerifier: "v" });
    const lr = login2.json.refreshToken;
    const out = await post("/v1/auth/logout", { refreshToken: lr });
    ok(out.status === 200, "logout → 200");
    const afterLogout = await post("/v1/auth/refresh", { refreshToken: lr });
    ok(afterLogout.status === 401, "refresh after logout → 401");

    // unknown refresh token → 401
    const unk = await post("/v1/auth/refresh", { refreshToken: "nope" });
    ok(unk.status === 401 && unk.json.error.code === "INVALID_REFRESH", "unknown refresh token → 401 INVALID_REFRESH");
  } finally {
    api.kill(); idp.close(); await admin.end();
  }
  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
