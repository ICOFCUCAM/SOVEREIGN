// Sovereign Dispatch — OAuth 2.0 Authorization Code + PKCE mediation.
//
// The console runs the standard public-client PKCE dance against the org's
// identity provider (Supabase / any OIDC): the SPA generates the verifier +
// challenge and redirects to the IdP's authorize URL; on callback it hands the
// `code` (+ verifier) to the API, which performs the token exchange server-side.
//
// Mediating the exchange (rather than the SPA calling the IdP token endpoint
// directly) keeps an optional confidential client_secret off the browser and
// sidesteps IdP CORS. The IdP endpoints are OPERATOR-configured via env (not
// user-supplied), so the outbound POST is trusted — no SSRF surface.
//
// The token the IdP returns is a normal user JWT; from there the existing
// membership-authoritative resolveJwt path (auth.mjs) decides role/clearance.

// Public OAuth config the SPA needs to build the authorize redirect. Returns
// { enabled:false } when not configured so the console hides the SSO button.
export function oauthConfig() {
  const authorizeUrl = process.env.OAUTH_AUTHORIZE_URL;
  const clientId = process.env.OAUTH_CLIENT_ID;
  const tokenUrl = process.env.OAUTH_TOKEN_URL;
  if (!authorizeUrl || !clientId || !tokenUrl) return { enabled: false };
  return {
    enabled: true,
    authorizeUrl,
    clientId,
    scopes: process.env.OAUTH_SCOPES || "openid email profile",
    // The redirect URI is fixed by the operator and must be registered with the
    // IdP; the SPA echoes it back on exchange so the IdP's check passes.
    redirectUri: process.env.OAUTH_REDIRECT_URI || "",
  };
}

export function oauthEnabled() {
  return oauthConfig().enabled === true;
}

const TOKEN_TIMEOUT_MS = Number(process.env.OAUTH_TOKEN_TIMEOUT_MS || 8000);

/**
 * Exchange an authorization code for tokens at the IdP token endpoint
 * (RFC 6749 §4.1.3 + PKCE §4.5). Returns { access_token, ... } or { error }.
 * Never throws.
 *
 * @param {{code:string, codeVerifier:string, redirectUri?:string}} p
 * @param {(url, init)=>Promise<Response>} [fetchImpl]  injectable for tests
 */
export async function exchangeCode({ code, codeVerifier, redirectUri }, fetchImpl = fetch) {
  const cfg = oauthConfig();
  if (!cfg.enabled) return { error: { status: 501, code: "OAUTH_NOT_CONFIGURED", message: "OAuth is not configured" } };
  if (!code || !codeVerifier) return { error: { status: 400, code: "INVALID_REQUEST", message: "code and code_verifier required" } };

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: codeVerifier,
    client_id: cfg.clientId,
    redirect_uri: redirectUri || cfg.redirectUri,
  });
  // Confidential client (optional): include the secret server-side only.
  if (process.env.OAUTH_CLIENT_SECRET) body.set("client_secret", process.env.OAUTH_CLIENT_SECRET);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TOKEN_TIMEOUT_MS);
  let resp;
  try {
    resp = await fetchImpl(process.env.OAUTH_TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: body.toString(),
      signal: ctrl.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    return { error: { status: 502, code: "IDP_UNREACHABLE", message: `token endpoint error: ${e.message}` } };
  }
  clearTimeout(timer);

  let json;
  try { json = await resp.json(); } catch { json = null; }
  if (!resp.ok) {
    const msg = json?.error_description || json?.error || `token endpoint returned ${resp.status}`;
    return { error: { status: 401, code: "OAUTH_EXCHANGE_FAILED", message: msg } };
  }
  if (!json?.access_token) {
    return { error: { status: 502, code: "OAUTH_NO_TOKEN", message: "token endpoint returned no access_token" } };
  }
  return {
    accessToken: json.access_token,
    tokenType: json.token_type || "Bearer",
    expiresIn: json.expires_in || null,
    refreshToken: json.refresh_token || null,
    idToken: json.id_token || null,
  };
}
