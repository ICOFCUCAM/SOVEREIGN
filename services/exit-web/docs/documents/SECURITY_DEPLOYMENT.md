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
| Security advisor | no ExitOS errors; the remaining `authenticated` execute warning on `exitos_owns_listing` is intended (the policies call it) |

Local equivalent: `supabase/tests/isolation/run.sh` (Postgres 16, same migration files) passes.

## Status
The isolation fixes are **deployed and verified** for the database policies, the listing trigger and the five functions.
The live system is **not** declared secure overall:

1. **Test data awaiting your confirmation to delete.** Deleting rows needs your confirmation in the Supabase connector, and it timed out unconfirmed. The rows left are the `zz-isotest-*` rows, the two disabled test users, their `exit_tenants` and `user_roles` rows, one uploaded test file and the access-log and telemetry rows those calls wrote. The test listing is hidden meanwhile. Cleanup SQL is below.
2. **The web app is still the old build.** It sends the anon key to the data room and telemetry, which now return 401 (fail closed). The data room and server telemetry stay unavailable until the new frontend and email-link sign-in are deployed.
3. **Anonymous sign-ins are disabled on the project.** So the current app has never had a server identity; every visitor has run on browser storage. Email-link sign-in (deliverable 3 work) is what gives users a server identity.
4. **Sign-in is still browser-only** until email-link authentication ships (in progress).
5. **Outside ExitOS, on the same project.** `public._imggen` has RLS disabled (advisor ERROR); leaked-password protection is off. Not changed here.

### Cleanup SQL (run after confirming)
```sql
delete from public.exitos_deal_events  where id like 'zz-isotest%';
delete from public.exitos_documents    where id like 'zz-isotest%';
delete from public.exitos_deals        where id like 'zz-isotest%';
delete from public.exitos_nda_requests where id like 'zz-isotest%';
delete from public.exitos_offers       where id like 'zz-isotest%';
delete from public.exitos_listings     where id like 'zz-isotest%';
alter policy exitos_listings_read on public.exitos_listings using (true);
delete from public.exit_data_room_access_log where tenant_id in ('aaaa4b38-0000-4000-8000-00000000000a','cccc4b38-0000-4000-8000-00000000000c');
delete from public.exit_data_room_documents  where tenant_id = 'aaaa4b38-0000-4000-8000-00000000000a';
delete from public.exit_telemetry_events     where tenant_id = 'aaaa4b38-0000-4000-8000-00000000000a';
delete from public.exit_tenants              where id in ('aaaa4b38-0000-4000-8000-00000000000a','cccc4b38-0000-4000-8000-00000000000c');
delete from public.user_roles                where user_id in ('aaaa4b38-0000-4000-8000-00000000000a','cccc4b38-0000-4000-8000-00000000000c');
delete from auth.users                       where id in ('aaaa4b38-0000-4000-8000-00000000000a','cccc4b38-0000-4000-8000-00000000000c');
```
Also delete the storage object `exit-data-room/aaaa4b38-0000-4000-8000-00000000000a/legal/…_isotest.txt` (Storage dashboard or API).

## Rollback
- **Database:** the statements in each migration header. Restoring the read policies to `using (true)` re-opens the leak; don't, except to recover from a breaking incident.
- **Functions:** redeploy v7 (v8 for telemetry) from git `6c929573:supabase/functions/<name>/index.ts`. This restores the shared-tenant behaviour.
