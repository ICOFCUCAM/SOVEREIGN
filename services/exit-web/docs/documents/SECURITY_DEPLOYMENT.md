# Security deployment — 13 October 2026

Deployment of the deliverable 2 isolation fixes to the live Supabase project, and how they were verified.
This record is kept separate from development progress.

## Target
| | |
|---|---|
| Project | `qvjdivcdefuprnenedje` ("SOVEREIGN", eu-west-1, Postgres 17), the project the web app's code points to |
| Prior schema | `exitos_backend_contract`, `exitos_ownership_hardening`, `exitos_network_deals_mandates` (= repo `0001`–`0003`); read policies `using (true)` on offers, NDA requests, deals, documents, deal events |
| Prior data | 0 listings, offers, NDA requests, deals, deal documents, deal events and data-room uploads; 1 tenant (the demo tenant) |
| Prior functions | `exit-doc-upload` v7, `exit-doc-list` v7, `exit-telemetry` v8, `exit-calibration` v7, `exit-buyer-stats` v7 (source matched the repo before these changes) |
| Credentials | Supabase management connector only; no service-role key or other secret entered the repo, the browser or this record |

## Applied
| Version | Migration | What |
|---|---|---|
| 20261013114038 | `exitos_isolation_read_policies` | `exitos_owns_listing()`; read policies on offers, NDA requests, deals, deal documents and deal events restricted to their parties (altered in place) |
| 20261013120536 | `exitos_isolation_listing_public_only` | bracket functions and a trigger that strips the private profile and exact figures from every listing written by any client; the one-time scrub was not needed (0 rows) |
| 20261013121524 | `exitos_hide_isolation_test_rows` | temporary: hides the verification test listing until its rows are deleted |
| 20261013122417 | `exitos_owns_listing_no_anon` | revokes `anon`'s execute right on the helper (security advisor) |

| Function | New version | JWT verification |
|---|---|---|
| `exit-doc-list` | v8 | on |
| `exit-doc-upload` | v8 | on |
| `exit-calibration` | v8 | on |
| `exit-buyer-stats` | v8 | on |
| `exit-telemetry` | v9 | on |

### Later the same day (deliverable 3)
| Version | Migration | What |
|---|---|---|
| 20261013130000 | `exitos_auth_roles` | `exitos_role_grants` (operator, counsel, approver): readable only by the grantee, no insert or update for `anon` or `authenticated`, so a role cannot be self-assigned; `exitos_has_role()`; an account may write its own row only as founder or buyer |
| 20261013140000 | `exitos_document_versions` | `exitos_document_versions` (immutable: no update or delete for clients; inserted only as a draft by its owner) and `exitos_document_events` (audit); a trigger supersedes the previous version; `exitos_document_action()` is the only way to change review status (submit, withdraw, send to counsel, counsel reviewed, approve) and checks the caller's grant, four-eyes approval and counsel review first when the type requires it |

| Function | Version | JWT verification | What |
|---|---|---|---|
| `exit-dispatch-submit` | v8 | on | requires a verified user; takes only a version id, loads it under the caller's own RLS, refuses a version whose stored document does not match its content hash, refuses the demo `svc-a` client; with no Dispatch secrets it answers `configured:false` and renders nothing |

The repo's migration files and function sources match what was applied.

## Verification on the live project
This sandbox cannot reach `*.supabase.co` (network policy), so the HTTP checks ran from inside the project through `pg_net`, against the deployed functions, with real Supabase Auth sessions of two test users created for the purpose (`isotest-owner-…`, `isotest-stranger-…`, now disabled).

| Check | Result |
|---|---|
| Listing written with a profile and exact figures | stored without them; revenue `$25–50M`, growth `25–50%` |
| Stranger reads offers / NDA requests / deals / events on another company's listing | 0 / 0 / 0 / 0; documents: only the `public` one |
| Buyer reads them | own offer, NDA request, deal, event; documents: `public` only |
| Buyer after the NDA request is signed | `public` + `post_nda` documents |
| Owner reads them | all, including the `founder` document |
| Unauthenticated (`anon`) reads | 0 rows from every exchange table and the data room |
| All five functions with the public anon key (and the old demo tenant id) | 401 each |
| A function with no Authorization header | 401 at the gateway |
| Owner uploads, sending the stranger's id as `tenantId` | stored under the owner's own tenant; tenant id in the body ignored |
| Owner sends telemetry with the demo tenant id | stored under the owner's tenant |
| Owner lists the data room | 1 file, with a signed download URL; the URL returns the file's exact content |
| Stranger lists, asking for the owner's tenant | 0 files |
| Stranger fetches the owner's storage object directly | not found (private bucket); no public URL exists |
| Stranger reads calibration / buyer statistics | 200 with the stranger's own (empty) figures only |
| Account tries to grant itself `approver` or write its role as `operator` | refused |
| Owner approves own version; approver without counsel review on a counsel type; buyer reads owner's version | refused / refused / 0 rows (in a rolled-back transaction) |
| `exit-dispatch-submit`: own version / tampered content / another user's version | `configured:false` / 409 / 404 |
| Security advisor | no ExitOS errors; the remaining `authenticated` execute warning on `exitos_owns_listing` is intended (the policies call it) |

Local equivalent: `supabase/tests/isolation/run.sh` (Postgres 16, same migration files) passes.

## Status
The isolation fixes are **deployed and verified** for the database policies, the listing trigger and the five functions.
The live system is **not** declared secure overall:

1. **Test data awaiting your confirmation to delete.** Deleting rows needs your confirmation in the Supabase connector, and it timed out unconfirmed. The rows left are the `zz-isotest-*` rows (including document versions `zz-isotest-dv-good` and `zz-isotest-dv-bad`, owned by the disabled test owner and used for the Dispatch bridge check), the two disabled test users, their `exit_tenants` and `user_roles` rows, one uploaded test file and the access-log and telemetry rows those calls wrote. The test listing is hidden meanwhile. Cleanup SQL is below.
2. **The web app is still the old build.** It sends the anon key to the data room and telemetry, which now return 401 (fail closed). The data room and server telemetry stay unavailable until the new frontend and email-link sign-in are deployed.
3. **Anonymous sign-ins are disabled on the project.** So the deployed app has never had a server identity; every visitor has run on browser storage.
4. **Email-link sign-in is built but not live.** It is in the new frontend (not deployed) and needs the project's Auth settings: Site URL and redirect allow-list for `/console`, custom SMTP for production mail, and a decision on `mailer_autoconfirm` (currently on: password sign-ups are confirmed without an e-mail). Until then no one can hold a verified session, so review actions and PDF rendering cannot be used live.
5. **No reviewer or counsel exists yet.** `exitos_role_grants` is empty; grants are made by you in SQL (`insert into public.exitos_role_grants (account_id, role, granted_by) values ('<auth user id>', 'approver', 'sql')`).
6. **PDF rendering is not connected.** The Dispatch API and worker are not deployed, and the function has no `DISPATCH_API_URL`, `DISPATCH_CLIENT_ID` (`svc-exitos`) or `DISPATCH_CLIENT_SECRET`. No real PDF has been produced in production.
7. **Outside ExitOS, on the same project.** `public._imggen` has RLS disabled (advisor ERROR); leaked-password protection is off. Not changed here.

### Cleanup SQL (run after confirming)
```sql
delete from public.exitos_deal_events  where id like 'zz-isotest%';
delete from public.exitos_documents    where id like 'zz-isotest%';
delete from public.exitos_deals        where id like 'zz-isotest%';
delete from public.exitos_nda_requests where id like 'zz-isotest%';
delete from public.exitos_offers       where id like 'zz-isotest%';
delete from public.exitos_listings     where id like 'zz-isotest%';
delete from public.exitos_document_events   where version_id like 'zz-isotest%';
delete from public.exitos_document_versions where id like 'zz-isotest%';
alter policy exitos_listings_read on public.exitos_listings using (true);
delete from public.exit_data_room_access_log where tenant_id in ('aaaa4b38-0000-4000-8000-00000000000a','cccc4b38-0000-4000-8000-00000000000c');
delete from public.exit_data_room_documents  where tenant_id = 'aaaa4b38-0000-4000-8000-00000000000a';
delete from public.exit_telemetry_events     where tenant_id = 'aaaa4b38-0000-4000-8000-00000000000a';
delete from public.exit_tenants              where id in ('aaaa4b38-0000-4000-8000-00000000000a','cccc4b38-0000-4000-8000-00000000000c');
delete from public.user_roles                where user_id in ('aaaa4b38-0000-4000-8000-00000000000a','cccc4b38-0000-4000-8000-00000000000c');
delete from auth.users                       where id in ('aaaa4b38-0000-4000-8000-00000000000a','cccc4b38-0000-4000-8000-00000000000c');
```
Also delete the storage object `exit-data-room/aaaa4b38-0000-4000-8000-00000000000a/legal/…_isotest.txt` (Storage dashboard or API).

## Deliverable 4: company stories and independent verification

Applied to the live project on 13 October 2026 (owner approval of 14 October decisions). Migration: `exitos_company_stories`, recorded as version `20261013171613`. Source: `supabase/migrations/20261014090000_exitos_company_stories.sql` at `af059769`.

### Preflight (before applying)
| Check | Result |
|---|---|
| Target project | `qvjdivcdefuprnenedje` (SOVEREIGN, eu-west-1, Postgres 17.6, ACTIVE_HEALTHY) |
| Migration state | last ExitOS migration `exitos_document_versions`; none of the four tables or nine functions existed; no name collisions |
| Dependencies | `exitos_has_role` present, reads `exitos_role_grants`; `auth.users` present |
| Access policies | RLS on for all 13 existing ExitOS tables; default privileges grant new public tables to `anon` and `authenticated`, so the migration now revokes and re-grants explicitly instead of relying on RLS alone |
| Backup and recovery | `archive_mode = on` (WAL archiving behind Supabase backups and point-in-time recovery). Plan, retention and PITR window are not visible to the deployment tools; **not yet confirmed (O-14)**. The change is additive: no existing object is altered or dropped |
| Rollback | the statements in the migration header drop only the objects it created; nothing else depends on them |
| Compatibility | local suites pass on Postgres 16; the live project runs 17.6. The features used (jsonpath `@?`, column-level grants, `gen_random_uuid`) exist in both |

### Applying it
- The first two attempts timed out in the deployment tool before reaching the database. Each time, the live state was checked: no tables, no migration record, no running query.
- The two `drop trigger if exists` lines were then removed (unnecessary on new tables, committed `af059769`), and the third attempt succeeded.

### Verification after deployment (read-only, live)
| Check | Result |
|---|---|
| RLS | on for all four tables |
| Policies | 9, all `to authenticated`: stories (owner select/insert/update/delete; engaged reviewer select), authorisations (own or operator select), engagements (owner and reviewer select; owner insert; owner update), verifications (owner and recording reviewer select) |
| `anon` table privileges | none |
| `authenticated` table privileges | stories: select, insert, update, delete. Engagements: select, insert, and update on `revoked_at` only. Authorisations and verifications: select only (written only through the checked functions) |
| Functions | the five RPCs are not executable by `anon`; trigger functions are not executable by `anon` or `authenticated`; every function has a fixed `search_path` |
| Triggers | `exitos_company_stories_guard` (refuses "verified" in a story, from anyone) and `exitos_company_stories_staleness` |
| Security advisors | no RLS, `anon`-access or search-path finding for the new objects. The only entries are the five RPCs being callable by signed-in users, which is intended: each checks operator role, competence, engagement and non-ownership itself |
| Data | all four tables empty after the checks |

Minor: `anon` can execute the two pure helpers `exitos_story_claim` and `exitos_claim_competence` through the default `PUBLIC` grant. They read no data; tidy up in the next migration.

### Live behavioural verification: **passed, 13 October 2026, 18:38 UTC**
Both self-tests were applied verbatim from the repository (`03c2b563`) and run on the live project through the connected Supabase account.

| Self-test | Migration version | Result |
|---|---|---|
| `exitos_selftest_company_stories()` | `20261013183831` | `SELFTEST PASS (0 failed of 25; all test rows rolled back)` |
| `exitos_selftest_exchange_state()` | `20261013183711` | `SELFTEST PASS (0 failed of 15; all test rows rolled back)` |

The checks cover:
- authorised access: owner; reviewer while engaged, for the engaged company only;
- cross-company and cross-user isolation: stranger, operator, unengaged reviewer, ended engagement, anon;
- refusal of self-verification and of operator verification;
- the fields of a verification record, and staleness when the evidence changes;
- refusal of buyer self-signing, self-acceptance and row moves, with owner-only resolution and a post-NDA document readable only after it.

**Rollback confirmed afterwards:**
- the company-story, verification, engagement and authorisation tables are all empty;
- there are no `selftest` role grants and no `zz-selftest-*` rows.

**Why the test was revised before applying:** the first version of the company-stories self-test had three `UPDATE` statements without a `WHERE` clause. The deployment tool held them for a confirmation it could not display, which caused the earlier timeouts. They are now scoped to the test's own companies. The checks and results are unchanged.

Re-run both self-tests after any change to these tables (`select public.exitos_selftest_company_stories();` and `select public.exitos_selftest_exchange_state();`).

**O-14, backup and recovery** (owner decision). WAL archiving alone does not establish which recovery options the project has. In the Dashboard (Database → Backups), record:
- the backup schedule;
- the retention period;
- whether point-in-time recovery is enabled, and its window.

**Until then, the live security status of company stories is "deployed, structurally verified, behaviour not yet verified on live". Do not report it as fully verified.**

## Deliverable 5 security fix: NDA requests and offers could be self-resolved by the buyer

Found during the deliverable 5 code survey (14 October). Applied live as `exitos_exchange_state_integrity`, version `20261013182404`. Source: `supabase/migrations/20261014100000_exitos_exchange_state_integrity.sql` at `8013f516`.

**The defect**
- The insert and update policies on `exitos_nda_requests` and `exitos_offers` checked only that the writer was the buyer, with no rule on the row's state.
- A buyer could therefore create or edit their own NDA request with status `signed`. That satisfies the `post_nda` branch of `exitos_docs_read` and unlocks every post-NDA document on the listing, with no founder action and no signature.
- A buyer could likewise mark their own offer `accepted`.

**Exposure**
- Live data at the time: one listing, one NDA request, one offer and three documents, all isolation-test fixtures (`zz-isotest-*`, O-1).
- No request was signed and no offer accepted, so no real company data was exposed in the current state.
- There is no audit log on these tables, so earlier misuse cannot be ruled out from the data alone.

**Fix**
- **NDA requests:** state guard triggers make a new request start as `requested`. Only the listing owner may move it to `signed` or `rejected`, and the result is final.
- **Offers:**
  - a new offer starts as `submitted`;
  - the owner may accept or reject it;
  - the buyer may withdraw it, or revise its amount and note while it is submitted;
  - a resolved offer is final.
- **Both tables:** the listing and buyer of a row never change, and the update policies gain `WITH CHECK`.
- **`anon`:** loses its (unused) privileges on `exitos_nda_requests`, `exitos_offers` and `exitos_documents`.
- **Client:** status changes are now PATCH updates rather than upserts. A refused update raises an error instead of passing silently.

**Preflight:** the vulnerable policies were confirmed live, there were no triggers on the tables, the only data was test fixtures, and the change is additive with rollback statements in the header.

**Verification**
- **Live structure (read-only):** both guard triggers are present; both update policies have `WITH CHECK`; `anon` has no privileges on the three tables; the guard functions cannot be executed by clients; existing data is unchanged.
- **Local:** the isolation suite gains the forged-signature, forged-acceptance, row-move and owner paths. Without the migration, nine of them flip to ALLOWED.
- **Live behaviour: passed 13 October, 18:38 UTC.** `exitos_selftest_exchange_state()` returned `SELFTEST PASS (0 failed of 15)`. Locally, without the fix, 10 of its checks fail.

**Still open:** "signed" still means the listing owner recorded it, not that signatures exist (C-2). The NDA lifecycle with signature evidence replaces it later in deliverable 5.

## Deliverable 5: data-room tagging and review (C-4)

Applied 13 October 2026.

| Change | Live version |
|---|---|
| Migration `exit_data_room_tagging` (`20261014110000`, commit `244ea1c6`) | `20261013184619` |
| Edge function `exit-doc-upload` | v9 (was v8) |
| Edge function `exit-doc-list` | v9 (was v8) |
| Self-test `exit_data_room_selftest` (`dc9a0f33`) | `20261013184801` |

**Preflight**
- Both live functions (v8) were identical to the repository's previous versions, so there was no drift.
- The live table had no artifact, company or review columns.
- `anon` and `authenticated` held every table privilege, including `TRUNCATE`, which row-level security does not cover. The REST API does not expose `TRUNCATE`.
- One existing row: the earlier isolation test file.

**Order of deployment:** the migration first (new nullable columns, with `review_state` defaulting to `submitted`), then the two functions, because the list function selects the new columns. The previous function versions keep working against the new table.

**Verification**
- **Live structure:** all six new columns are present. Grants are now `SELECT` only for `authenticated` and none for `anon`, on both data-room tables. The functions remain JWT-verified.
- **Live behaviour, 13 October 18:48 UTC:** `exit_selftest_data_room()` returned `SELFTEST PASS (0 failed of 11; all test rows rolled back)`. It covers:
  - the owner reads only their own file;
  - a file cannot be accepted until it is tagged;
  - the owner can tag and accept;
  - re-tagging returns the file to review;
  - no direct write to the review state;
  - no tagging, reviewing or reading of another tenant's file;
  - `anon` cannot read or tag.
- Rollback was confirmed: no `selftest/` rows remain.
- **Not tested live:** the upload function's new artifact validation through HTTP. The network policy here blocks direct calls to the project; the validation is covered by reading the code only.

**Rollback**
- the statements in the migration header;
- redeploy the v8 functions from git `dc9a0f33~3:supabase/functions/exit-doc-{upload,list}/index.ts`.

## Deliverable 5: NDA lifecycle and buyer data-room access (C-2, 8.1–8.3)

Applied 13 October 2026.

| Change | Live version |
|---|---|
| Migration `exitos_nda_lifecycle` (`20261014120000`, commit `32470d7f`) | `20261013190914` |
| Self-test `exitos_nda_lifecycle_selftest` | `20261013191020` |
| Revised exchange-state self-test (`8b1e118a`) | `20261013191137` |
| Edge function `exit-doc-buyer` (new) | v1, JWT required |
| Edge function `exit-doc-list` (returns `disclosure`) | v10 |

**Preflight**
- None of the new tables or functions existed.
- The request guard and the `exitos_docs_read` policy existed and were replaced or altered.
- No request was marked signed.
- The `exit-data-room` bucket is private and has no storage policies, so no client role can read its objects directly.
- No role grants exist.

**What it enforces**
- **Execution:**
  - an NDA executes only when every required party has signed from its own account, on the issued document hash, with method-specific evidence;
  - each signature must be verified by the counterparty;
  - the request is marked signed only by execution; the owner can only reject it.
- **Buyer access:** a buyer lists and downloads only through functions that check, on every call:
  - the buyer's identity;
  - an executed, unexpired agreement;
  - the seller and company;
  - the `post_nda` disclosure;
  - the review state;
  - the agreement's scope.

  Downloads are 60-second signed links. The post-NDA branch of `exitos_docs_read` follows the agreement.
- **Ending access:** expiry (computed), termination and revocation end access immediately.
- **Audit:** an append-only trail records issue, signatures, verifications, execution, listings, downloads, denials and endings. It is written only by the functions.

**Live verification, 13 October**
- `exitos_selftest_nda_lifecycle()` returned `SELFTEST PASS (0 failed of 32)`, covering:
  - incomplete signatures and an altered document;
  - the wrong party signing and self-verification;
  - an unrelated account and a buyer without an NDA;
  - wrong-company, wrong-seller, seller-only and rejected files;
  - direct reads of data-room rows and of storage objects (the bucket held one real object);
  - direct writes to state and to the audit trail;
  - expiry, revocation and termination;
  - the audit trail;
  - `anon`.
- The other three self-tests were re-run afterwards and pass: company stories 25/25, exchange state 15/15 (revised for the new rule), data room 11/11.
- Rollback was confirmed: no agreements, events or test rows remain.
- Security advisors show only the intended RPCs as callable by signed-in users.

**Not verified here:** HTTP calls to `exit-doc-buyer` and to the upload function's artifact check. The network policy blocks this sandbox from the project (proxy 403). Tracked as O-15.

## Deliverable 5: a bidder's offer terms are its own

Applied 13 October 2026:
- migration `exitos_offer_terms_guard` (`20261014130000`, commit `b17eb619`);
- the revised exchange-state self-test (`exitos_exchange_state_selftest_v3`, 16 checks).

**Change:** the offer guard now compares everything except the status. The listing owner can only accept or reject; the bidder can revise anything while the offer is submitted, or withdraw it. Before this, only the amount and note were protected, so an owner could have rewritten a bidder's new structured terms.

**Verification:**
- **Local:** check 16 ("owner cannot rewrite the terms a bidder stated") fails against the previous guard and passes against the new one.
- **Live:** `SELFTEST PASS (0 failed of 16)`, and the NDA lifecycle self-test is still 32/32.

**Rollback:** re-apply `exitos_offer_guard` from `20261014100000`.

## Deliverable 6: the transaction record and transaction-scoped access (C-5)

Applied 13 October 2026:

| Change | Live version |
|---|---|
| Migration `exitos_transactions` (`20261014140000`, commit `ce6af8bf`) | `20261013215241` |
| Self-test `exitos_transactions_selftest` (`20261014140100`) | `20261013215354` |

**Preflight**
- None of the four tables or the `exitos_txn_*` functions existed.
- `exitos_nda_agreements.transaction_id` existed and was null on every row.
- The two buyer data-room functions were replaced in place, keeping their signatures and grants.

**What it enforces**
- **Opening a transaction:** only the listing owner can open one, from an offer it accepted, with that buyer's executed NDA for the same listing that is inside its term. There can be one live transaction per listing. The NDA is bound to the transaction.
- **Items:** each condition belongs to a party, and the owning party records the evidence. Only the counterparty confirms it; a rejection reopens it. A waiver needs both parties.
- **Signing:** both parties confirm, naming the same agreement SHA-256, and every required signing condition must be satisfied or waived. A mismatch is logged and does not advance the transaction.
- **Closing:** both parties confirm the same amount, with a payment reference, and every required closing condition must be satisfied or waived. Closing creates the post-closing obligations from the terms snapshot. A closed transaction cannot be terminated.
- **Data-room access:** once an NDA is bound to a transaction, buyer listing and download also require that transaction to be negotiating, signed or closed for the same buyer. Termination ends access even while the NDA is in term. Every earlier check still applies.
- **No direct writes:** clients cannot write the tables or the audit trail directly; only the functions write them.

**What it is not:** the transaction is a record of what the two parties state, each statement confirmed by the other party. ExitOS does not hold or trace funds, compare a hash with a signed original it has never seen, or judge whether a condition is legally met.

**Live verification, 13 October 2026, about 22:05 UTC**
- **Source check before running:** the deployed self-test was compared with the repository version, as required. Its source was 274 characters shorter, because the apply tool strips comment-only lines. With those 8 comment lines removed, the repository source is identical to the live source: MD5 `aabfe839…`, 16,573 characters.
- **Transaction self-test:** `exitos_selftest_transaction_lifecycle()` returned `SELFTEST PASS (0 failed of 25)`. It covers:
  - buyer, unrelated-account and anon refusals;
  - an unaccepted offer and an NDA from another listing;
  - evidence by the wrong party, and self-confirmation;
  - a one-sided waiver;
  - signing with open conditions and with different agreement hashes;
  - closing with open conditions and with different amounts;
  - post-closing obligations from the terms;
  - termination after closing;
  - direct writes;
  - the audit trail;
  - termination ending data-room access.
- **The other four self-tests, re-run because the buyer functions changed:**

  | Self-test | Result |
  |---|---|
  | NDA lifecycle | 32/32 |
  | Exchange state | 16/16 |
  | Data room | 11/11 |
  | Company stories | 25/25 |

- **Rollback confirmed:** zero transactions, items, confirmations and events, and no `zz-selftest` listings or offers.
- **Live structure:**
  - RLS is on for all four tables, and clients have no write grants;
  - the eight `exitos_txn_*` RPCs can be executed by `authenticated` and not by `anon`;
  - `exitos_txn_try_advance` and `exitos_txn_log` cannot be called by any client role;
  - the self-test is owner-only.
- **Security advisors:** nothing new beyond the intended signed-in RPCs. `exitos_txn_party` is listed too; it returns only the caller's own role, and null for both "not a party" and "no such transaction".

**Not verified here:** HTTP calls through `exit-doc-buyer` against a transaction-bound NDA (O-15). The database function it calls is covered by checks 06 and 24.

## Deliverable 6: end-to-end self-test of one deal (D6-4)

Applied 13 October 2026 as `exitos_deal_end_to_end_selftest` (`20261014150000`), live version `20261013222831`. It adds one owner-only function and changes no schema. Signed-in users cannot execute it; that was confirmed.

**Before running:**
- **Source check:** the deployed source was compared with the reviewed repository file. With comment lines excluded (the apply tool drops them), they are identical: MD5 `259f0e3f…`, 15,436 characters.
- **Rollback behaviour:** the function always ends by raising, and every write is scoped to its own `zz-selftest` rows. The only owner-made rows are the test listing and two data-room files; every other step is taken as the seller, the buyer, an unrelated account or anon.

**Live result:** `SELFTEST PASS (0 failed of 20)`. The deal goes:
1. the buyer requests an NDA;
2. the seller issues it;
3. a typed signature and an e-signature are each verified by the other party, and the NDA executes;
4. the buyer sees only the disclosed file;
5. the buyer offers with terms; it cannot accept its own offer;
6. the seller accepts the offer and opens the transaction (an unrelated account and the buyer cannot);
7. each signing condition is evidenced by its owner and confirmed by the other party;
8. signing is recorded on matching hashes;
9. one completion condition is waived by both parties and the rest are confirmed;
10. completion is recorded on matching amounts;
11. post-closing obligations are created and one is discharged;
12. the completed deal cannot be terminated.

It also checks that both audit trails are complete, and that an unrelated account and anon see nothing.

**After:** zero transactions, items, events, NDAs, NDA events, requests, offers, listings or data-room files remain.

**Local mutation check:** with buyer downloads made to ignore disclosure, check 03 fails, and so does NDA check 19.

**Rollback:** `drop function public.exitos_selftest_deal_end_to_end();`

## Rollback
- **End-to-end self-test (deliverable 6):** `drop function public.exitos_selftest_deal_end_to_end();`
- **Transactions (deliverable 6):** the ordered statements in the header of `20261014140000_exitos_transactions.sql`. Restore the two buyer functions first, then drop the transaction objects. Any transaction data is lost; export it first if any exists.
- **NDA lifecycle (deliverable 5):** the statements in the header of `20261014120000_exitos_nda_lifecycle.sql`; delete the `exit-doc-buyer` function. Rolling back restores the founder flag as the post-NDA gate.
- **Exchange state integrity (deliverable 5):** the statements in the header of `20261014100000_exitos_exchange_state_integrity.sql`. Rolling back re-opens the self-signing defect.
- **Company stories (deliverable 4):** the drop statements in the header of `20261014090000_exitos_company_stories.sql`, and `drop function public.exitos_selftest_company_stories();` if the self-test was installed. Data in the four tables is lost on rollback; export it first if any exists.
- **Database:** the statements in each migration header. Restoring the read policies to `using (true)` re-opens the leak; don't, except to recover from a breaking incident.
- **Deliverable 3 migrations:** drop `exitos_document_action`, `exitos_document_events`, `exitos_document_versions`, `exitos_has_role`, `exitos_role_grants` and restore the account policies with the two `alter policy` statements in the `exitos_auth_roles` header. Nothing else depends on them.
- **Functions:** redeploy v7 (v8 for telemetry) from git `6c929573:supabase/functions/<name>/index.ts`. This restores the shared-tenant behaviour.
