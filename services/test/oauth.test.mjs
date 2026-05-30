// OAuth 2.0 Authorization Code + PKCE mediation.
//   - oauthConfig gating (disabled until env set; no secret leak).
//   - exchangeCode: success (injected IdP fetch), IdP error → 401, unreachable
//     → 502, missing code/verifier → 400, not-configured → 501.
//   - end-to-end PKCE shape: verifier/challenge (S256) is what the SPA sends.
import crypto from "node:crypto";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  PASS ${m}`); } else { fail++; console.log(`  FAIL ${m}`); } };

// fresh import after setting env (modules read env at call time, so we can flip)
const { oauthConfig, oauthEnabled, exchangeCode } = await import("../shared/src/oauth.mjs");

function s256(verifier) {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

async function main() {
  console.log("== OAuth PKCE mediation ==");

  // ---- config gating ----
  delete process.env.OAUTH_AUTHORIZE_URL; delete process.env.OAUTH_CLIENT_ID; delete process.env.OAUTH_TOKEN_URL;
  ok(oauthEnabled() === false && oauthConfig().enabled === false, "disabled when env not set");

  const ex0 = await exchangeCode({ code: "x", codeVerifier: "y" });
  ok(ex0.error?.status === 501 && ex0.error.code === "OAUTH_NOT_CONFIGURED", "exchange when unconfigured → 501");

  process.env.OAUTH_AUTHORIZE_URL = "https://idp.example/authorize";
  process.env.OAUTH_TOKEN_URL = "https://idp.example/token";
  process.env.OAUTH_CLIENT_ID = "dispatch-console";
  process.env.OAUTH_REDIRECT_URI = "https://dispatch.example/callback";
  process.env.OAUTH_SCOPES = "openid email";
  const cfg = oauthConfig();
  ok(cfg.enabled && cfg.authorizeUrl.includes("idp.example") && cfg.clientId === "dispatch-console" && cfg.scopes === "openid email", "config exposes authorize URL + client_id + scopes");
  ok(!("clientSecret" in cfg) && !("client_secret" in cfg), "config never exposes a client secret");

  // ---- PKCE shape (what the SPA generates) ----
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = s256(verifier);
  ok(verifier.length >= 43 && /^[A-Za-z0-9_-]+$/.test(challenge), "PKCE verifier/challenge are URL-safe (S256)");

  // ---- successful exchange (injected IdP fetch) ----
  let captured = null;
  const fakeIdp = async (urlArg, init) => {
    captured = { url: urlArg, body: init.body };
    return { ok: true, status: 200, json: async () => ({ access_token: "idp.jwt.token", token_type: "Bearer", expires_in: 3600, refresh_token: "r1", id_token: "id1" }) };
  };
  const good = await exchangeCode({ code: "auth-code-123", codeVerifier: verifier, redirectUri: "https://dispatch.example/callback" }, fakeIdp);
  ok(good.accessToken === "idp.jwt.token" && good.expiresIn === 3600, "successful exchange returns access_token");
  ok(captured.url === "https://idp.example/token", "posts to the configured token endpoint");
  const sent = new URLSearchParams(captured.body);
  ok(sent.get("grant_type") === "authorization_code" && sent.get("code") === "auth-code-123"
     && sent.get("code_verifier") === verifier && sent.get("client_id") === "dispatch-console"
     && sent.get("redirect_uri") === "https://dispatch.example/callback", "exchange body carries code + verifier + client_id + redirect_uri");

  // confidential client: secret included server-side when set, never otherwise
  ok(!sent.has("client_secret"), "no client_secret sent when none configured");
  process.env.OAUTH_CLIENT_SECRET = "shh";
  let cap2 = null;
  await exchangeCode({ code: "c", codeVerifier: verifier }, async (_u, init) => { cap2 = init.body; return { ok: true, status: 200, json: async () => ({ access_token: "t" }) }; });
  ok(new URLSearchParams(cap2).get("client_secret") === "shh", "confidential client secret included server-side when configured");
  delete process.env.OAUTH_CLIENT_SECRET;

  // ---- IdP rejects the code → 401 ----
  const bad = await exchangeCode({ code: "bad", codeVerifier: verifier }, async () => ({ ok: false, status: 400, json: async () => ({ error: "invalid_grant", error_description: "code expired" }) }));
  ok(bad.error?.status === 401 && bad.error.code === "OAUTH_EXCHANGE_FAILED" && /code expired/.test(bad.error.message), "IdP rejection → 401 with reason");

  // ---- IdP unreachable → 502 ----
  const down = await exchangeCode({ code: "c", codeVerifier: verifier }, async () => { throw new Error("ECONNREFUSED"); });
  ok(down.error?.status === 502 && down.error.code === "IDP_UNREACHABLE", "IdP unreachable → 502");

  // ---- missing inputs → 400 ----
  const miss = await exchangeCode({ code: "", codeVerifier: "" }, fakeIdp);
  ok(miss.error?.status === 400 && miss.error.code === "INVALID_REQUEST", "missing code/verifier → 400");

  // ---- token endpoint returns no access_token → 502 ----
  const empty = await exchangeCode({ code: "c", codeVerifier: verifier }, async () => ({ ok: true, status: 200, json: async () => ({ token_type: "Bearer" }) }));
  ok(empty.error?.status === 502 && empty.error.code === "OAUTH_NO_TOKEN", "no access_token in response → 502");

  console.log(`\nTOTAL: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
