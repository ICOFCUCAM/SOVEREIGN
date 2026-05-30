// Console-side OAuth 2.0 Authorization Code + PKCE.
//
// Public-client flow: we generate a code verifier + S256 challenge, stash the
// verifier + a CSRF state in sessionStorage, and redirect to the IdP authorize
// URL. On return the IdP sends ?code&state to our /console/callback; we verify
// state, then POST {code, codeVerifier} to the API which performs the token
// exchange server-side and returns the access token + resolved principal.
import { whoami } from "./api";

const BASE = import.meta.env.VITE_DISPATCH_API_URL ?? "";
const STORE_VERIFIER = "dispatch_pkce_verifier";
const STORE_STATE = "dispatch_oauth_state";

export interface AuthConfig { enabled: boolean; authorizeUrl?: string; clientId?: string; scopes?: string; redirectUri?: string }

export async function fetchAuthConfig(): Promise<AuthConfig> {
  try {
    const r = await fetch(BASE + "/v1/auth/config");
    if (!r.ok) return { enabled: false };
    return await r.json();
  } catch { return { enabled: false }; }
}

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(input: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(digest);
}

// Build the authorize URL, persist verifier+state, and redirect the browser.
export async function beginLogin(cfg: AuthConfig): Promise<void> {
  if (!cfg.enabled || !cfg.authorizeUrl || !cfg.clientId) throw new Error("OAuth is not configured");
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const state = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const challenge = b64url(await sha256(verifier));
  sessionStorage.setItem(STORE_VERIFIER, verifier);
  sessionStorage.setItem(STORE_STATE, state);
  const redirectUri = cfg.redirectUri || `${window.location.origin}/console/callback`;
  const u = new URL(cfg.authorizeUrl);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("scope", cfg.scopes || "openid email profile");
  u.searchParams.set("state", state);
  u.searchParams.set("code_challenge", challenge);
  u.searchParams.set("code_challenge_method", "S256");
  window.location.assign(u.toString());
}

export interface CallbackResult { accessToken: string; expiresIn: number | null; principal: { tenantId: string; role: string; scopes: string[]; clearance: string; actor: string; principalType: "user" | "service" } }

// Handle the IdP redirect back: verify state, exchange code via the API.
export async function completeLogin(search: string): Promise<CallbackResult> {
  const params = new URLSearchParams(search);
  const err = params.get("error");
  if (err) throw new Error(params.get("error_description") || err);
  const code = params.get("code");
  const state = params.get("state");
  const expectedState = sessionStorage.getItem(STORE_STATE);
  const verifier = sessionStorage.getItem(STORE_VERIFIER);
  sessionStorage.removeItem(STORE_STATE);
  sessionStorage.removeItem(STORE_VERIFIER);
  if (!code) throw new Error("missing authorization code");
  if (!state || state !== expectedState) throw new Error("state mismatch (possible CSRF) — please retry");
  if (!verifier) throw new Error("missing PKCE verifier — please retry");

  const redirectUri = `${window.location.origin}/console/callback`;
  const r = await fetch(BASE + "/v1/auth/callback", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code, codeVerifier: verifier, redirectUri }),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json?.error?.message || "sign-in failed");
  return json as CallbackResult;
}

// After completeLogin we hold a token; whoami confirms the principal (defensive).
export async function confirmPrincipal(token: string) {
  return whoami(token);
}
