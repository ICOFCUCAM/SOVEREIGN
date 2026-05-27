# Sovereign vs. Ayrshare — and the Developer Platform

Ayrshare is a hosted social-publishing API (one key, all platforms, analytics, webhooks,
multi-profile). We are building the **self-owned** equivalent so we issue our own keys and
own every integration, while also doing what Ayrshare does not (AI media generation +
strategic intelligence).

## Feature comparison

| Capability | Ayrshare | Sovereign (now) | Sovereign (planned) |
|---|---|---|---|
| Multi-platform publish | all | all 11 native adapters (untested live) | live-verified adapters |
| Issue API keys to users | ✅ | ✅ `issue-key` + `@sovereign/api-platform` | key rotation UI |
| Bearer tokens (signed, expiring) | ✅ | ✅ HMAC tokens w/ scopes + exp | refresh flow |
| Scopes / permissions | ✅ | ✅ scope enforcement in `authenticate` | granular per-route |
| Usage metering + quotas | ✅ monthly/daily | ✅ `api_usage` + monthly quota enforcement + `/usage` dashboard | per-key analytics |
| Plans / billing | ✅ | ✅ plan catalog + entitlements (quota/scope/connection caps) + Stripe webhook | live Stripe wiring |
| User profiles / multi-tenant | ✅ | ✅ `api_clients` + inherited RBAC/hostname tenancy | white-label theming |
| Connected social accounts (token vault) | ✅ | ✅ OAuth connect → AES-256-GCM encrypted `social_connections` | more providers |
| Webhooks | ✅ | ✅ HMAC-signed sign/verify/deliver | delivery retries/UI |
| Messages / Ads / Feeds | ✅ | ❌ | later |
| Owned AI media pipeline (Layer 1) | ❌ | ✅ | — |
| Strategic intelligence (Layer 3) | ❌ | ✅ 7-agent registry + Claude runner | agent tools/data |

## How a client uses it

1. Admin mints a key: `POST gateway/issue-key` → `sov_live_…` (shown once, stored as SHA-256).
2. Client calls our API with `Authorization: Bearer sov_live_…`.
3. `authenticate()` validates by hash, checks scope, enforces the monthly quota, records
   usage, stamps `last_used_at`.
4. The request is routed (e.g. to Layer 1 render or Layer 2 publish) on the client's behalf.

## Where we already exceed Ayrshare

Owned media generation (cinematic/operational/strategic/crisis film orchestration) and the
strategic intelligence layer are part of the same key/quota/usage fabric — a single API can
render media, distribute it, and run intelligence, which a pure distribution API cannot do.
