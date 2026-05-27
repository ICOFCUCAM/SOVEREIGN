# API Gateway — Developer Platform

The self-owned equivalent of Ayrshare's developer surface: issue API keys/tokens to
users, authenticate requests, enforce scopes + monthly quotas, meter usage, and (next)
vault social tokens + deliver webhooks.

## Pieces

- **`@sovereign/api-platform`** (`packages/api-platform`) — pure, runtime-verified core:
  secure key generation (`sov_live_…`, SHA-256 hashed, plaintext shown once), HMAC-signed
  bearer tokens with expiry, scopes, and rate/usage metering helpers.
- **`db/migrations/0003_developer_platform.sql`** — `api_clients`, `api_keys`,
  `social_connections` (token vault), `api_usage`, `webhooks`.
- **`gateway/functions/`** (Deno edge):
  - `issue-key` — admin-gated (`ADMIN_SECRET`); creates a client + key, returns the
    plaintext key once.
  - `_shared/auth.ts` — `authenticate(req, admin, scope)` guards any function: validates the
    Bearer key by hash, checks status + scope, enforces the monthly quota, records usage,
    stamps `last_used_at`.
  - `_shared/keys.ts` — Web Crypto mirror of the Node key logic for the Deno runtime.

## Issue a key

```bash
curl -X POST "$SUPABASE_URL/functions/v1/issue-key" \
  -H "x-admin-secret: $ADMIN_SECRET" -H "content-type: application/json" \
  -d '{ "name": "Acme Media", "owner_email": "dev@acme.com", "scopes": ["publish","media:render"] }'
# -> { "key": "sov_live_…", "prefix": "sov_live_…", "client_id": "…", ... }  (key shown once)
```

## Guard a function

```ts
import { authenticate } from '../_shared/auth.ts';
const auth = await authenticate(req, admin, 'publish');
if (!auth.ok) return new Response(JSON.stringify({ error: auth.error }), { status: auth.status });
// auth.ctx => { clientId, keyId, scopes }
```

## Status / caveats

`@sovereign/api-platform` is built and its crypto is runtime-verified (hash/verify, token
sign/verify/expiry/tamper, scopes, rate eval). The Deno edge functions are written against
this contract but have **not** been executed here (no `deno` runtime in CI). Social-token
encryption-at-rest and webhook delivery are scaffolded in schema/types but not yet implemented.
