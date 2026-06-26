# Dispatch SDKs

Official, **dependency-free** clients for the Dispatch Platform API. They wrap the
credential flow (exchange `client_id`/`secret` for a short-lived bearer token,
cached and auto-refreshed), the governed record lifecycle, and webhook signature
verification. The full contract is [`../docs/api/openapi.yaml`](../docs/api/openapi.yaml).

| Language | Path | Runtime | Dependencies |
|----------|------|---------|--------------|
| TypeScript / JavaScript | [`typescript/`](./typescript) | Node ≥ 18 | none (global `fetch` + `node:crypto`) |
| Python | [`python/`](./python) | Python ≥ 3.8 | none (stdlib `urllib` + `hmac`) |

Get a `client_id` + `secret` from the console under **Administration → API Access**.

## TypeScript

```ts
import { DispatchClient, verifyWebhook } from "@dispatch/sdk";

const dispatch = new DispatchClient({ baseUrl, clientId, secret });
const { documentId } = await dispatch.createRecord(record, crypto.randomUUID());
const detail = await dispatch.getRecord(documentId);     // posture + chain of authority
await dispatch.decide(documentId, "approve");
await dispatch.publish(documentId);

// In your webhook receiver — verify before trusting:
if (!verifyWebhook(rawBody, req.header("x-dispatch-signature"), endpointSecret)) reject();
```

## Python

```python
from dispatch import DispatchClient, verify_webhook

d = DispatchClient(base_url, client_id, secret)
res = d.create_record(record, idempotency_key=str(uuid4()))
detail = d.get_record(res["documentId"])
d.decide(res["documentId"], "approve")
d.publish(res["documentId"])

# In your webhook receiver:
if not verify_webhook(raw_body, sig_header, endpoint_secret):
    reject()
```

## Methods (both clients)

- **Records** — `createRecord` / `getRecord` / `listRecords`
- **Lifecycle** — `decide(approve|reject|return)` / `publish` / `withdraw` / `archive`
- **Evidence** — `governanceCertificate` / `preservationCertificate` / `audit` / `job`
- **Webhooks (admin)** — `listWebhooks` / `createWebhook` / `deleteWebhook`
- **`verifyWebhook(rawBody, signatureHeader, secret)`** — constant-time HMAC-SHA256 check

Errors raise `DispatchApiError` carrying the API error `code` (e.g. `STEP_NOT_OPEN`,
`PUBLICATION_AUTHORITY_REQUIRED`), HTTP `status`, and `requestId`.

> These clients are hand-written against the OpenAPI spec and kept deliberately
> thin and dependency-free. The signature scheme is verified to match the server
> and across both languages.
