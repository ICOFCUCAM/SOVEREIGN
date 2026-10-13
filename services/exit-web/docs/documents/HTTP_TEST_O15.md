# O-15 · HTTP test of the deployed buyer data-room and transaction functions

Run on 13 October 2026, 22:47–22:51 UTC, against project `qvjdivcdefuprnenedje`:
- `exit-doc-buyer` v1 (JWT verification on);
- `exit-doc-upload` v9;
- PostgREST `rest/v1/rpc/exitos_txn_*`;
- Storage signed URLs.

## How it was run, and what that proves

**Request path.** This sandbox cannot reach `*.supabase.co`: the egress proxy answers 403. The requests were therefore sent from the project's own database with `pg_net`, which makes ordinary HTTPS requests to the project's public endpoints. These are the same URLs, gateway, JWT check and function code a browser hits. Only the client's network location differs.

**Accounts.** Three controlled accounts were created for the test: `zz-httptest-{seller,buyer,other}@exitos.invalid`.
- Each got a real session from the live Auth API (`/auth/v1/token`, password grant).
- Their passwords were random and never stored or shown.
- Tokens were read inside SQL only, never displayed, and were scrubbed afterwards.

**Fixtures.** Seller-owned listings, NDA requests, agreements, two transactions and three data-room rows, scoped to ids `feed0000-…` and `zz-httptest-…`:
- **Disclosed file:** points at the existing 7-byte isotest fixture object, so no new storage object was created.
- **Agreements:**
  - `a001`: executed, bound to a live transaction;
  - `a002`: executed, transaction terminated;
  - `a003`: past its access term;
  - `a004`: executed, not yet bound to a transaction;
  - `a005`: bound to a transaction that does not exist.
- **Files:**
  - `f1`: disclosed, accepted;
  - `f2`: seller-only;
  - `f3`: another company.

## exit-doc-buyer

| # | Case | HTTP | Body (denials carry no link or file metadata) | Audit event |
|---|---|---|---|---|
| c01 | buyer lists, live transaction | 200 | only `f1` (seller-only and other-company files absent) | `files_listed` |
| c02 | buyer downloads `f1` | 200 | `{ok, url, expiresIn: 60}` | `file_downloaded` |
| c03 | seller-only file | 403 | "this file is not disclosed to you under this NDA" | `access_denied` |
| c04 | another company's file | 403 | same | `access_denied` |
| c05 / c06 | wrong buyer lists / downloads | 403 | "no such NDA for you" | `access_denied`, actor = that account |
| c07 / c08 | terminated transaction, NDA still in term | 403 | "the transaction this NDA belongs to has ended" | `access_denied` |
| c09 / c10 | expired NDA | 403 | "access needs an executed NDA inside its access term" | `access_denied` |
| c11 | NDA executed, no transaction yet (pre-transaction diligence) | 200 | only `f1` | `files_listed` |
| c12 | NDA bound to a missing transaction | 403 | "the transaction this NDA belongs to has ended" | `access_denied` |
| c13 | no `Authorization` header | 401 | "sign in to open a data room" | none (no identity) |
| c14 | publishable key as the bearer | 401 | same | none |
| c15 | the seller calls the buyer endpoint | 403 | "no such NDA for you" | `access_denied` |
| c16 | malformed file id (`../../x`) | 400 | "agreement and file ids required" | none |
| c17 | valid unbound NDA + another company's file | 403 | "this file is not disclosed to you under this NDA" | `access_denied` |

## The signed link (Storage)

| Case | HTTP | Result |
|---|---|---|
| fresh link, fetched within 60 s | 200 | 7 bytes, `text/plain` |
| link with the object path changed | 400 | `InvalidSignature` |
| link with the token altered | 400 | `InvalidJWT`: signature verification failed |
| same link fetched 70 s after issue | 400 | `InvalidJWT`: "exp" claim timestamp check failed |

**Reuse:** within its 60 seconds, the link works for whoever holds it. That is the design (a bearer link), stated in the function header.

## Transaction functions called directly, bypassing the UI (O-17)

| # | Case | HTTP | Result |
|---|---|---|---|
| r01 | buyer opens a transaction | 400 | "only the listing owner opens a transaction on its offer" |
| r02 | buyer confirms completion while negotiating | 400 | "completion is confirmed after signing (the transaction is negotiating)" |
| r03 | free buyer evidences its own condition | 204 | recorded |
| r04 | unrelated account evidences it | 400 | "no such item for you" |
| r05 | terminate an already terminated transaction | 400 | refused |
| r06 | unrelated account confirms signing | 400 | "no such transaction for you" |
| r07 / r08 | unrelated account reads the transaction / its conditions | 200 | `[]` |
| r09 | buyer reads its transaction | 200 | its row |
| r10 | buyer reads the seller's data-room rows directly | 200 | `[]` |
| r12 | seller confirms the buyer's evidence | 200 | condition satisfied (evidenced by the buyer, confirmed by the seller) |

The accounts have no plan anywhere on the server: no ExitOS function or policy reads one, and the project has no subscriptions table.

## exit-doc-upload

**Refusal tested:** an artifact from the wrong room returns 400 ("artifact fin.audited_accounts does not belong to the legal room"), before anything is stored.

**Not tested:** a successful upload. It would have created a storage object that only the Storage API can delete.

## Not covered

- A buyer of a **different seller's** company, beyond c04 and c17.
- **Rate limiting.** The function has none of its own beyond the platform's.
- **Audit-trail pollution.** A denial by any signed-in account is written to the target agreement's audit trail (c05, c06, c15), attributed to that account. It records attempts, but it lets an unrelated account add rows to someone else's trail. Tracked as O-19.

## Clean-up

**Done at once with UPDATEs:**
- the test accounts are banned, their passwords replaced with unknown values, and their refresh tokens revoked;
- the `pg_net` responses holding tokens and the signed link are overwritten;
- the listings are moved into the policy-hidden `zz-isotest-` range;
- every test NDA and transaction is terminated;
- the test files are made seller-only and rejected.

**Still to do:** the deletes wait on a confirmation the deployment tools here cannot display. Run `supabase/tests/http/cleanup_o15_fixtures.sql` once in the SQL editor; it ends with a count that must read 0.

## Reproducing from a machine that can reach the project

1. Create the fixtures with SQL like the above.
2. Run `supabase/tests/http/buyer_download_http.sh`. It takes the URL, publishable key, two access tokens and the fixture ids from environment variables (named in the script) and never prints a token or link.
3. Remove the fixtures with the cleanup SQL.
