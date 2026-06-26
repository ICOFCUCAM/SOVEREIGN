# ADR-011 — Dispatch as a Platform: Three Interfaces, Three Identities, Two Products

- Status: Accepted (positioning + roadmap; most builds deferred with triggers)
- Date: 2026-06-26
- Supersedes: none (extends ADR-002 authentication, ADR-009 autonomy; complements ADR-010)
- Context: The architecture is frequently described as "a website and an API."
  That undersells what is built and mis-frames the commercial shape. Dispatch is
  one **institutional governance platform** exposed through three interfaces, and
  it is on its way to being two commercial **products** for two different buyers.

## Decision — how Dispatch is positioned

**One platform, three interfaces:**

1. **Public Website** (`dispatch.sovereigndo.com`, `/`) — evaluation, trust,
   procurement, pricing, signup. Brings institutions in.
2. **Operations Console** (`/console`, `/admin`) — where *people* perform governed
   institutional work. The daily application (think M365 / ServiceNow).
3. **Governance Engine / API** (`dispatch-api`, separate deployable) — where *people
   and systems* consume governance, publication, certification and preservation as
   services. The engine that powers the Console and external integrations alike.

**Three identities — already modelled, not aspirational.** Every request resolves
to a principal that is one of:

- **Human** — `principalType: "user"/"person"`, actor `user:<id>`; authority flows
  from the office they occupy (browser session, minted post-SSO).
- **Machine** — `principalType: "service"`, actor `svc:<clientId>`; an external
  system calling REST (client-credentials today).
- **Institution** — `tenantId` on every principal; owns departments, offices,
  policies, records. No tenant ever sees another.

This is the spine of `services/shared/src/auth.mjs`. Machine/human/institution is a
strength to market, not a gap to fill.

**Two products, two buyers** (the commercial reading, à la Stripe):

- **Product 1 — Operations.** Bought by institutions for their staff (a small
  municipality may use *only* the Console and never touch the API). Government
  staff, universities, hospitals.
- **Product 2 — Developer Platform.** Bought by large institutions with existing
  estates (Oracle ERP, SAP, SharePoint, M365, case management, an IdP) who make
  Dispatch *another service* their systems call. Software vendors, government IT,
  integrators, consultants. The API is for large institutions, not everyone.

**External naming.** Keep `dispatch-api` as the repository name; externally brand
the engine as the **Dispatch Governance Engine** / **Dispatch Platform API**. It is
the core institutional engine, not "a collection of endpoints."

## What changes now vs. what is deferred (with triggers)

Apply the ADR-010 discipline: do not build platform infrastructure speculatively.

**Now (cheap, non-speculative, compounding):**
- **Positioning + naming** — adopt the three-interface / two-product framing and the
  "Governance Engine" label in copy. (This ADR.)
- **API Access workflow** — already shipped: an admin issues one scoped API client
  per external system, with a complete credential handoff (id, secret, scopes,
  tenant, base URL, first-call example, usage envelope), rotation and revocation.

**Deferred until a real customer/scenario (then build the named thing):**

| Capability | Trigger to build |
|---|---|
| **Event webhooks** (Dispatch→Customer: `record.approved`, `record.published`, `record.preserved`) — the "reverse API". Render-job `callback_url` is the existing seed. | A named integrator needs their system to *react* to governance events. |
| **Machine/app IdP federation** (institution's IdP issues app tokens Dispatch trusts; no secrets held in Dispatch) — extends people-SSO (OIDC RP already built) to applications. | A national-scale customer mandates federated machine identity. |
| **Developer Platform surface** (`/developers`: OpenAPI spec, SDKs, examples, webhook docs, auth, rate-limit visibility, sandbox creds). | We commit to selling Product 2; first concrete step is an OpenAPI spec generated from the existing `/v1` endpoints. |
| **Per-client rate limiting** (beyond the institution's plan quota). | Abuse/load makes it real; until then the plan quota is the honest envelope. |

The split-documentation site (`/developers`) and SDKs are part of the Developer
Platform trigger — not built ahead of that decision.

## Evidence

Three identities: `services/shared/src/auth.mjs` (principalType service/user/person,
actor `svc:`/`user:`, tenantId on every principal). Reverse-API seed:
`dispatch.jobs.callback_url` via `delivery.callbackUrl`. API Access workflow:
`services/dispatch-web/src/pages/Access.tsx` + `/v1/admin/clients`. Interface
separation: `dispatch-web` (Vercel) vs `dispatch-api` (Render, `render.yaml`), with
`DISPATCH_CORS_ORIGIN` proving the cross-origin web↔engine boundary.

## Trigger to revisit

Revisit when we decide to actively sell the Developer Platform (Product 2), or when
a named customer needs event webhooks or federated machine identity. Until then this
ADR fixes the positioning and the engine naming; the builds wait for the trigger.
