# Developer Portal

The developer-facing console for the Sovereign API. Next.js (App Router) + Tailwind.

## Features

- **Key management** (`/`) — issue API keys with selected scopes; the plaintext key is shown
  once. Lists existing keys (masked `prefix…last4`, scopes, status).
- **Connect accounts** (`/connect`) — start OAuth to link a platform to a client; lists
  connected accounts (no tokens). Proxies to the `oauth-start` edge function.
- **Usage** (`/usage`) — 30-day API consumption by metric, from `api_usage`.
- **API reference** (`/docs`) — auth example + scoped endpoint catalog.
- **Server routes** (`app/api/keys`, `app/api/connect`) — proxy to the admin-gated
  edge functions; `ADMIN_SECRET` stays server-side.

## Run

```bash
cd sovereign-os
npm install
# server env (key minting): SUPABASE_URL, ADMIN_SECRET
# browser env (key listing): NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run portal:dev      # http://localhost:3001
```

## Status

Scaffold; `next build` passes (type-checked). Not browser-verified in CI. In production the
"create key" action should sit behind developer authentication (session/SSO) rather than
relying solely on the server `ADMIN_SECRET` proxy.
