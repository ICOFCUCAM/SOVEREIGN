import { randomBytes } from 'node:crypto';

// OAuth2 authorization-code helpers for connecting client social accounts. Provider
// configs + URL building are pure; the token exchange takes an injectable fetch so it
// is testable without hitting live endpoints.

export interface OAuthProvider {
  authorizeUrl: string;
  tokenUrl: string;
  defaultScopes: string[];
}

export const OAUTH_PROVIDERS: Record<string, OAuthProvider> = {
  x: {
    authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    defaultScopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
  },
  linkedin: {
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    defaultScopes: ['w_member_social', 'r_liteprofile'],
  },
  facebook: {
    authorizeUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
    defaultScopes: ['pages_manage_posts', 'pages_read_engagement'],
  },
  pinterest: {
    authorizeUrl: 'https://www.pinterest.com/oauth/',
    tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
    defaultScopes: ['pins:write', 'boards:read'],
  },
  threads: {
    authorizeUrl: 'https://threads.net/oauth/authorize',
    tokenUrl: 'https://graph.threads.net/oauth/access_token',
    defaultScopes: ['threads_basic', 'threads_content_publish'],
  },
};

export function randomState(): string {
  return randomBytes(16).toString('base64url');
}

export interface AuthorizeParams {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes?: string[];
}

export function buildAuthorizeUrl(provider: string, params: AuthorizeParams): string {
  const cfg = OAUTH_PROVIDERS[provider];
  if (!cfg) throw new Error(`unknown OAuth provider "${provider}"`);
  const qs = new URLSearchParams({
    response_type: 'code',
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    state: params.state,
    scope: (params.scopes ?? cfg.defaultScopes).join(' '),
  });
  return `${cfg.authorizeUrl}?${qs.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  raw: Record<string, unknown>;
}

export async function exchangeCodeForToken(
  provider: string,
  args: { code: string; clientId: string; clientSecret: string; redirectUri: string },
  fetchImpl: typeof fetch = fetch,
): Promise<TokenResponse> {
  const cfg = OAUTH_PROVIDERS[provider];
  if (!cfg) throw new Error(`unknown OAuth provider "${provider}"`);
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
  });
  const r = await fetchImpl(cfg.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  });
  const raw = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok || !raw.access_token) throw new Error(`token exchange failed (${r.status})`);
  return {
    access_token: String(raw.access_token),
    refresh_token: raw.refresh_token ? String(raw.refresh_token) : undefined,
    expires_in: typeof raw.expires_in === 'number' ? raw.expires_in : undefined,
    raw,
  };
}
