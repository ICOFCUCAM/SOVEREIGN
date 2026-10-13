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

### Behavioural test of access and isolation: **not yet run on the live project**
- The full behavioural test of authorised access and cross-company isolation is a function: `exitos_selftest_company_stories()`, migration `20261014090100_exitos_company_stories_selftest.sql`. It covers 25 checks across owner, stranger, operator, engaged and unengaged reviewers, two companies, and anon.
- It always ends by raising, so every test row is rolled back, and only the database owner can run it.
- Locally it passes 25 of 25 (`supabase/tests/stories/selftest.sh`). A deliberately opened read policy makes six isolation checks fail, so the test does catch leaks.
- The deployment tool would not run it on the live project: SQL containing write statements times out waiting for a confirmation that this session cannot give.

**Owner action O-12** (owner decision, 14 October). In the Supabase Dashboard:
1. Open the SQL Editor for project `qvjdivcdefuprnenedje` (SOVEREIGN).
2. Open `supabase/migrations/20261014090100_exitos_company_stories_selftest.sql` from the repository at `62a57204` or later, and review the complete script. Do not run it if it differs from the reviewed repository version.
3. Run that script. It only creates the function, and revokes execution from everyone but the database owner.
4. Run `select public.exitos_selftest_company_stories();` and confirm the result is an error beginning `SELFTEST PASS (0 failed of 25 …)`.
5. Repeat steps 2 to 4 for `supabase/migrations/20261014100100_exitos_exchange_state_selftest.sql` and `select public.exitos_selftest_exchange_state();`, expecting `SELFTEST PASS (0 failed of 15 …)`.
6. Record both full messages as evidence.

How the test rolls back:
- The whole test runs inside one function call that ends with `raise exception`.
- Postgres undoes every write of a statement that fails, so the test operator grant, stories, engagements, authorisations and verifications are all removed. This holds whatever the SQL editor's transaction mode.
- The checks it runs never commit.
- Only the function definition from step 3 persists. Remove it afterwards, if wanted, with `drop function public.exitos_selftest_company_stories();`.

Checked live in advance (read-only): `exitos_role_grants` has no triggers, and live `auth.uid()` reads `request.jwt.claim.sub`, then `request.jwt.claims`; the test sets both.

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
- **Live behaviour: not yet run.** `exitos_selftest_exchange_state()` (`20261014100100_exitos_exchange_state_selftest.sql`) runs 15 checks and passes locally, 15 of 15. Without the fix, 10 fail, including "buyer reads the post-NDA document before the owner signs". It is part of **O-12** below.

**Still open:** "signed" still means the listing owner recorded it, not that signatures exist (C-2). The NDA lifecycle with signature evidence replaces it later in deliverable 5.

## Rollback
- **Exchange state integrity (deliverable 5):** the statements in the header of `20261014100000_exitos_exchange_state_integrity.sql`. Rolling back re-opens the self-signing defect.
- **Company stories (deliverable 4):** the drop statements in the header of `20261014090000_exitos_company_stories.sql`, and `drop function public.exitos_selftest_company_stories();` if the self-test was installed. Data in the four tables is lost on rollback; export it first if any exists.
- **Database:** the statements in each migration header. Restoring the read policies to `using (true)` re-opens the leak; don't, except to recover from a breaking incident.
- **Deliverable 3 migrations:** drop `exitos_document_action`, `exitos_document_events`, `exitos_document_versions`, `exitos_has_role`, `exitos_role_grants` and restore the account policies with the two `alter policy` statements in the `exitos_auth_roles` header. Nothing else depends on them.
- **Functions:** redeploy v7 (v8 for telemetry) from git `6c929573:supabase/functions/<name>/index.ts`. This restores the shared-tenant behaviour.
