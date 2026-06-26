# Dispatch Platform API — Integrator Guide

The **Dispatch Governance Engine** lets your existing systems — an ERP, a
parliament or case-management system, SharePoint, a hospital platform — turn
documents into **governed, certified, preserved Official Records** without anyone
opening the Dispatch console. Submit a document, and Dispatch runs it through the
institution's review chain of offices, renders it, publishes it, issues a
Governance Certificate, and preserves it.

The full contract is the OpenAPI spec in this directory:

- [`openapi.yaml`](./openapi.yaml) — OpenAPI 3.1, describing the API as implemented.

Render it with any OpenAPI tool (Swagger UI, Redoc, Stoplight) or import it into
Postman/Insomnia. SDKs can be generated from it (e.g. `openapi-generator`).

## How an institution grants API access

1. A **System Administrator** opens the console → **Administration → API Access**.
2. They **create an API client** for the integrating system (e.g. "Parliament
   System"), choosing scopes — exactly what that system may do.
3. Dispatch returns a **`client_id`** and a one-time **`secret`** (plus the tenant
   id and API base). The admin hands these to the integrating team over a secure
   channel. One client per system → its own permissions, audit trail, revocation.

## The integration flow

```
Your system ──(client_id + secret)──▶ POST /v1/token ──▶ access_token (1h)
            ──(Bearer access_token)──▶ POST /v1/documents ──▶ documentId
                                       GET  /v1/documents/{id} ──▶ posture / chain
                                       POST /v1/documents/{id}/decision  (approve…)
                                       POST /v1/documents/{id}/publish
                                       GET  /v1/documents/{id}/governance-certificate
```

### 1 — Exchange the credential for a token

```bash
curl -s "$BASE/v1/token" \
  -H 'content-type: application/json' \
  -d '{"client_id":"svc_parliament-system_a1b2c3","secret":"<secret>"}'
# → { "access_token": "…", "expiresIn": 3600, "tenantId": "…", "scopes": [...] }
```

### 2 — Submit a document as an Official Record

```bash
curl -s "$BASE/v1/documents" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -H "idempotency-key: $(uuidgen)" \
  -d @record.json
# → { "documentId": "…", "lifecycle": "in_review" }
```

`record.json` is a DDM submission (see `DocumentRequest` in the spec; the full
block/section schema is the `ddm-schema` package). A `delivery` block is required;
set `delivery.callbackUrl` to have Dispatch call **your** system when the artifact
is ready.

### 3 — Follow and govern the record

- `GET /v1/documents/{id}` returns the institutional posture and the **chain of
  authority** (which office holds it now, who has cleared it).
- `POST /v1/documents/{id}/decision` (approve / reject / return) — allowed only for
  the office whose step is open; order, separation-of-duties and quorum are enforced.
- `POST /v1/documents/{id}/publish` — only by the publication-authority office.
- `GET /v1/documents/{id}/governance-certificate` — proof the chain was satisfied.

## Webhooks — the reverse direction (Dispatch → your system)

So your systems can **react** instead of poll, an admin registers endpoints under
**Administration → API Access → Event webhooks** (or `POST /v1/admin/webhooks`).
When a record crosses a lifecycle boundary, Dispatch POSTs a signed event.

- **Events:** `record.submitted`, `record.approved`, `record.rejected`,
  `record.returned`, `record.published`, `record.preserved` (empty subscription = all).
- **Payload:** `{ "event", "occurredAt", "tenantId", "data": { "documentId", "docType", "title", "lifecycle", … } }`
- **Signature:** every delivery carries `X-Dispatch-Signature: sha256=<hmac>` — verify it:

```js
const expected = "sha256=" + crypto.createHmac("sha256", endpointSecret).update(rawBody).digest("hex");
if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) reject();
```

- **Delivery** is durable and **at-least-once** (failed deliveries are retried), so
  make your handler **idempotent** on `X-Dispatch-Delivery`. Respond `2xx` to ack.

## Authority vs. capability

A token's **scopes** are *system capability* (read / create / approve / publish).
*Institutional authority* — whether a decision is actually allowed — comes from the
**office** the credential holds in the governance chain, checked at request time.
Governance depends on offices, never on the credential itself.

## Errors

Every error is one envelope: `{ "error": { "code", "message", "field", "requestId" } }`.
Common governance refusals: `STEP_NOT_OPEN`, `SELF_APPROVAL_FORBIDDEN`,
`ROLE_NOT_GRANTED`, `PUBLICATION_AUTHORITY_REQUIRED`, `UNKNOWN_OFFICE`,
`INSUFFICIENT_CLEARANCE`, `PAYMENT_REQUIRED`.

## Status

This spec documents the **current** surface. On the roadmap for the Developer
Platform (see `docs/adr/ADR-011`): event **webhooks** (record.approved /
published / preserved as subscriptions, beyond the per-render `callbackUrl`),
generated **SDKs**, a hosted **developer portal**, and machine/app **IdP
federation**. Those are built when a customer triggers them; this document and the
credential flow above are real today.
