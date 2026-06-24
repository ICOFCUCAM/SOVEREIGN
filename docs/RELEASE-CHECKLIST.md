# Release Checklist — Launch Phase 1

Deployment is not the finish line. This checklist gates go-live. Each item names
**how** to verify it and records status in **this** environment; the right-hand
column is what must be re-verified against the **production** database and config
before real institutions touch it. Mindset for this phase: **Observe → Measure →
Learn → Refine**, not Build → Build → Build.

Legend: ✅ verified here · ⏳ re-verify in production · ⬜ not yet done

---

## 1. Database migration verification
- ✅ **Forward-only apply is clean.** `node db/migrate.mjs up` applies M1→M17 in
  the manifest order with no drift; M17 applied cleanly on top of M16.
- ✅ **Manifest is authoritative & ordered.** `db/migrations/manifest.json` lists
  M17 last; the runner applies by manifest, not lexical sort.
- ⏳ **Run against the production database** with `DISPATCH_MIGRATE_URL` pointed at
  prod, during a maintenance window. Confirm `migrate.mjs status` shows 0 pending
  after, and that RLS is FORCED on every new table (`analytics_events`).
- ⏳ **Drift check** post-deploy: `migrate.mjs status` must report no `DRIFT!`.

## 2. Backup verification
- ⬜ **A restore actually works.** Take a production snapshot, restore it to a
  scratch instance, run `migrate.mjs status` (expect all-applied), and confirm a
  known record + its governance/preservation certificate are intact. A backup you
  have never restored is not a backup.
- ⬜ **Point-in-time recovery window** is configured and documented (provider-side).
- ⬜ **Backups run on a schedule** and alert on failure.

## 3. Billing verification
- ✅ **Free → paid path works.** `billing.test.mjs` green (14/14): signup creates a
  free tenant at the document quota; `subscribe` flips to paid; downloads unlock;
  a subscribed tenant creates beyond the free cap; empty signup name → 400.
- ⏳ **Real payment provider** wiring (the current `subscribe` is a stub that flips
  `subscription_status`). Before charging anyone, connect the real processor and
  re-verify the unlock path end-to-end.
- ⏳ **Quota enforcement in production**: a fresh prod tenant hits `QUOTA_EXCEEDED`
  (402) at its cap, not before.

## 4. Governance enforcement verification
- ✅ **Engine + API enforced.** `governance.test.mjs` green (23/23): ordered chain,
  per-step quorum, separation of duties (a submitter cannot approve their own
  record; an approver cannot be the publisher), publication lock.
- ⏳ **Production smoke**: submit a record under an enforced policy; confirm publish
  is refused (`POLICY_INCOMPLETE` / `PUBLICATION_AUTHORITY_REQUIRED` / `SOD_VIOLATION`)
  until the chain is satisfied by the right authorities in order.
- ✅ **Refusals are instrumented**: a `governance.failed` beacon fires on enforcement
  refusal, so friction is measurable (Executive Overview).

## 5. Preservation certificate verification
- ✅ **Lifecycle is terminal.** Archive seals a record (preservation timestamp +
  SHA-256 integrity proof); `document_versions` are immutable (trigger blocks UPDATE
  even for a superuser inspector — confirmed in sprint1-e2e).
- ⏳ **Production smoke**: archive a published record, open its **Preservation
  Certificate**, confirm the issuer + certifying statement render and the SHA-256
  verifies against the canonical record; confirm no edit/withdraw/republish is possible.

## 6. Evaluation package verification
- ⏳ **Procurement dossier** (`/procurement`) renders, every section readable with no
  gate; the primary CTA is **Start a free evaluation** and the architecture link is
  honestly labelled (Launch Readiness Review H4).
- ⏳ **Executive Evaluation Workspace** (`/evaluate`) derives its assessment from the
  tenant's live posture (no fabricated numbers); the Board Brief downloads.
- ⏳ **In-console Evidence Package** (`/admin/evidence`) generates the live-posture bundle.

## 7. Signup → Publish → Archive journey verification
> This is the launch's real success metric (see bottom). Verify the WHOLE chain unaided.
- ⏳ **Signup**: create an institution at `/signup`; receive a credential once.
- ⏳ **Create**: author a first Official Record; it enters the approval chain.
- ⏳ **Govern**: satisfy the policy chain with the right authorities, in order.
- ⏳ **Publish**: the publication authority releases it; a **Governance Certificate**
  is sealed (COMPLIANT, required-vs-actual chain, integrity proof).
- ⏳ **Archive**: preserve it; a **Preservation Certificate** is issued; the record is terminal.
- ⏳ Do all of the above **without engineering assistance**, as a real evaluator would.

## 8. Adoption analytics live (Launch Phase 1)
- ✅ **Beacon ingest** (`POST /v1/analytics/events`) accepts allowlisted events,
  drops unknown ones, never fails a visitor (always 202), stores no PII.

## 8a. Platform Operator domain (`dispatch:platform`)
- ✅ **Separate product** at `/operator` (Platform Operations) with its own chrome
  — NOT an `/admin` screen. Gated solely on the `dispatch:platform` scope; any
  other credential (incl. tenant_admin) gets the locked state.
- ✅ **Content-blind by construction.** `GET /v1/platform/overview` and
  `/v1/platform/trends` return cross-tenant **counts / rates / distributions /
  trends** only, via SECURITY DEFINER aggregate functions. The functions refuse
  unless a `platform` claim is present; the table that backs the platform audit
  trail is locked (no app SELECT). Verified: operator hitting tenant content
  (`/v1/documents`) → **403** — it carries the platform scope alone and cannot
  pivot into content.
- ✅ **Non-issuable scope.** `dispatch:platform` is rejected by the provisioning
  API for both self-service **and** admin-override (`SCOPE_NOT_ISSUABLE`). No
  tenant can mint or escalate into the platform domain.
- ✅ **Every platform query is audited** (`platform_audit`, write-only via a
  definer function): `platform.overview.read` / `platform.trends.read` rows confirmed.
- ⏳ **Mint the operator credential in production**, out-of-band only:
  `DATABASE_URL=… node db/seed/make-platform-operator.mjs`. Store the secret once.
  Confirm a normal tenant_admin credential gets the locked `/operator` state.
- ⏳ **Confirm the funnel populates**: after a real visit + signup, the operator sees
  `page.home`, `signup.completed`, etc. increment.

## 9. Operational config & secrets (production)
- ⏳ `DISPATCH_TOKEN_SECRET`, `SUPABASE_JWT_SECRET`, `PGSSLMODE`, `DISPATCH_CORS_ORIGIN`
  set; **dev token shim OFF** (`DISPATCH_ALLOW_DEV_TOKENS=0` or `NODE_ENV=production`).
- ⏳ TLS verified end-to-end; no `*` CORS in production.
- ⏳ Worker is running (the render lane): sprint1-e2e's render assertions need it —
  they fail wherever the worker is not ticking, which is expected, not a code defect.

---

## The one metric that matters next
Not commits. Not features. **A first institution completes
Create → Govern → Publish → Preserve, unaided.** Everything above exists to make
that moment trustworthy and observable.
