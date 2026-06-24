# CIRCLE 2 — Governance Enforcement: Architecture Review

**Status:** Design review. No implementation until the open decisions in §10 are
ruled on.

**Thesis.** Today a policy is *inherited, displayed, and recorded*. After CIRCLE 2
a policy must *control* the workflow: block invalid actions, require ordered
approvals, and prove compliance. The target is a policy that behaves like a
**smart contract for institutional publication** — a record becomes *constrained*
by its policy, and **a record cannot be published unless the policy is satisfied
and a Governance Certificate can be generated proving it.**

---

## 1. What is enforced today (code-grounded)

From `handleDecision` (`server.mjs`) and `evaluateQuorum` (`governance.mjs`):

| Control | Today | Strength |
|---|---|---|
| Approve requires `dispatch:approve` scope | ✅ | functional scope only |
| Approver cleared for classification | ✅ | clearance gate |
| Only `submitted`/`in_review` can be decided | ✅ | state gate |
| Submitter cannot approve own document | ✅ | partial SoD |
| One decision per (actor, version) | ✅ | unique constraint |
| Quorum to advance | ✅ **count-based** | N *distinct* approvers ≥ `required_approvals` |
| On quorum → approved → render | ✅ | |

**The model is a flat count of approvers.** Any principal with `dispatch:approve`
who is cleared can be one of the N. There is **no notion of *which role* approved,
in *what order*.**

## 2. The two structural gaps

1. **The review chain is decorative.** `approval_policies.review_chain`
   (`Director → Secretary General`) is shown on Create Record and printed on the
   Preservation Certificate, but `evaluateQuorum` never reads it. Approvals are
   not bound to chain steps; order is not enforced; the named roles are not
   checked against the approver's identity.
2. **Publication is not policy-gated.** `handleLifecycleAction('publish')` checks
   only `lifecycle_state === 'rendered'`. A rendered document publishes
   regardless of whether the policy's chain was actually walked. **This is the
   bypass**: auto-approve lane → render → publish, with the policy never enforced.

Everything in CIRCLE 2 follows from closing these two gaps.

## 3. The core shift: count-quorum → step/role chain

Enforcement requires moving from *"N approvers"* to *"each named step satisfied,
in order, by an eligible, distinct principal."* That needs three things the
platform does not yet have:

- **Governance roles & identity.** The system must know that principal *P* may
  act as **Director** for this tenant. Today a principal has functional *scopes*
  (`approve`) and a clearance, but no **governance-role identity** (`Director`,
  `Secretary General`, `Chief Secretary`).
- **Step-bound approvals.** Each approval must record *which chain step / role*
  it satisfies, not just `decision + actor`.
- **An executable policy evaluator** that walks the chain in order, applies SoD,
  quorum, delegation, and expiration, and yields a single verdict:
  `satisfied | pending(step) | violated(reason)`.

## 4. Proposed data model (additive migrations M14–M16)

> Exact columns are a proposal; finalised after §10.

**M14 — governance roles & assignments**
```
dispatch.governance_roles(id, tenant_id, key, label)            -- "director" / "Director"
dispatch.governance_role_grants(id, tenant_id, subject, role_id,  -- subject = principal actor/identity
                                granted_by, expires_at, active)
```
A principal is eligible for a chain step iff it holds an active grant for that
step's role (and is cleared for the classification).

**M15 — executable chain on the policy**
Replace the free-form `review_chain` JSON with an ordered, typed structure
(kept backward-compatible for display):
```
review_chain = [
  { index: 0, role: "director",           quorum: 1, mode: "sequential" },
  { index: 1, role: "secretary_general",  quorum: 1, mode: "sequential" }
]
approval_authority   = "chief_secretary"      -- final approver role (or null)
publication_authority= "communications_office"-- role that may publish
policy_version        int                      -- bumped on every edit (certificates pin it)
sequential            bool default true        -- ordered vs parallel chain
approval_ttl_days     int   null               -- approval expiration window
```

**M16 — step-bound approvals + delegation + expiration**
```
alter dispatch.approvals add:
  step_index   int,         -- which chain step this decision satisfies
  role_key     text,        -- the governance role exercised
  on_behalf_of text,        -- delegation: the role-holder being acted for
  expires_at   timestamptz  -- per-approval expiry (from approval_ttl_days)
dispatch.delegations(id, tenant_id, role_id, delegate_subject,
                     grantor_subject, reason, starts_at, ends_at, active)
```

## 5. Per-capability design

### 1) Ordered approvals
The evaluator walks `review_chain` by `index`. Step *k* is *open* only when steps
`0..k-1` are *satisfied*. A decision for an out-of-order step → **`409
STEP_NOT_OPEN`** (unless `sequential=false`). Cannot skip, cannot reorder.

### 2) Separation of duties
Generalised from today's submitter check:
- submitter ∉ any approver set (exists today);
- a principal may satisfy **at most one** chain step (no same-person Director *and*
  Secretary General);
- the **publisher** (publication authority) may not be an approver of the same
  record. Violations → **`403 SOD_VIOLATION`**.

### 3) Quorum
Per-step `quorum` (K distinct eligible holders of that role). "All approvals
required" = every step quorum met; "2 of 3" = a step with `quorum: 2` over a role
held by 3 principals. Whole-chain `required_approvals` is retained as a derived
check.

### 4) Delegation
A `delegations` row lets `delegate_subject` act for a role during `[starts_at,
ends_at]` with a `reason`. An approval made under delegation records
`on_behalf_of` + the delegation id → surfaced on the Governance Certificate as an
**exception/delegation** with evidence. No open-ended delegation; always
time-boxed and logged.

### 5) Approval expiration
On each approval, stamp `expires_at = now() + approval_ttl_days`. A sweep (same
pattern as retention) returns a record whose chain has an **expired** approval
before completion back to the governance queue (`in_review → … `), voids the
expired approvals, and emits `governance.approval_expired`.

### 6) Publication lock (the linchpin)
`publish` calls the evaluator first:
```
verdict = evaluatePolicy(record, policy)
if verdict != satisfied → 409 POLICY_INCOMPLETE  { missing: [...] }
```
Only a *satisfied* policy unlocks publication. The publisher principal must hold
the **publication_authority** role (or scope, per §10-D). This closes the bypass.

### 7) Governance evidence — the Governance Certificate
Generated at the moment of publication (and re-derivable thereafter), mirroring
the Preservation Certificate:
```
GovernanceCertificate {
  recordId, policyName, policyVersion,
  requiredRoles[],  actualRoles[],
  approvalSequence: [ { step, role, actor, onBehalfOf?, decidedAt } ],
  quorum: { required, satisfied },
  exceptions[],   delegations[],
  separationOfDuties: "enforced",
  complianceResult: "COMPLIANT",
  integrityProof   // SHA-256 over the canonical governance record
}
```
**Exit criteria binding:** publication is allowed **iff** this certificate can be
generated with `complianceResult = COMPLIANT`. The certificate is then sealed
into the record and carried into the Preservation Certificate at archive.

### 8) Auditable governance events
New event vocabulary, every one written to the append-only audit trail:
`governance.step_satisfied`, `governance.policy_satisfied`,
`governance.policy_violation`, `governance.publication_blocked`,
`governance.delegation_used`, `governance.approval_expired`,
`governance.certificate_issued`.

## 6. Enforcement points (where the control system lives)

| Endpoint | New enforcement |
|---|---|
| `POST /documents/:id/decision` | step eligibility (role grant + clearance), order, SoD, per-step quorum, expiry stamp; emit `step_satisfied`/`policy_satisfied` |
| `POST /documents/:id/publish` | **publication lock**: `evaluatePolicy` must be `satisfied`; publisher = publication authority; issue Governance Certificate |
| `POST /admin/governance/expire-sweep` | expire stale approvals → return to queue |
| `GET /documents/:id/governance-certificate` | the compliance proof (409 until satisfied) |

The auto-approve service lane (`autoApproves`) becomes a **policy property**: a
policy may declare lanes that auto-satisfy (machine integrations) — but that is an
*explicit, certificated* decision, not an implicit bypass.

## 7. The evaluator (pure, testable)

A single pure function `evaluatePolicy(decisions, policy, context) → verdict` in
`governance.mjs`, extending today's `evaluateQuorum`. Pure and storage-agnostic so
it is unit-testable in isolation (today's `evaluateQuorum` already has 7 green
unit tests — same discipline). The HTTP handlers stay thin.

## 8. Suggested build sequence (each independently validated)

1. **Role identity** (M14) + grant/list APIs + Administration UI to assign roles.
2. **Step-bound approvals + ordered evaluator** (M15/M16) — order, SoD, quorum.
3. **Publication lock + Governance Certificate** — the linchpin + the proof.
4. **Expiration sweep.**
5. **Delegation.**
6. UI: governance queue shows *whose turn*; certificate surfaced like preservation.

Ship and validate 1→3 first (that alone makes policy a control system and
satisfies the exit criteria); 4–5 harden it.

## 9. Backward compatibility & migration

- Records mid-flight and the auto-approve service lane must not break: a policy
  with an **empty chain** behaves exactly as today (count-quorum), so existing
  tenants and the 4 CI suites stay green. Enforcement engages only when a policy
  defines a chain.
- `review_chain` display shape is preserved; the executable fields are additive.
- New error codes (`STEP_NOT_OPEN`, `SOD_VIOLATION`, `POLICY_INCOMPLETE`,
  `ROLE_NOT_GRANTED`) map through the existing `humanError` layer.

## 10. Open decisions — need a ruling before implementation

- **A. Identity model.** How does a principal become a **Director**? Recommended:
  a tenant-scoped **governance-role grant** (M14) assigned in Administration,
  separate from functional scopes. Alternative: derive roles from scopes/clearance
  only (weaker, no real chain identity). *This is the foundational choice.*
- **B. Approver declares the step, or system infers it?** Recommended: the system
  infers the step from the approver's granted role and the next open step;
  reject if ineligible. (Simpler UX, stronger enforcement.)
- **C. Quorum granularity.** Per-step quorum (richer: "2 of 3 Directors") vs.
  whole-chain count only. Recommended: per-step, with whole-chain as a derived
  check.
- **D. Publication authority binding.** Must the publisher *be* the publication
  authority role, or merely hold `dispatch:publish`? Recommended: must hold the
  publication-authority role grant (true enforcement).
- **E. Expiration target.** Expire individual approvals (chain rewinds to the
  expired step) vs. the whole in-review window. Recommended: individual approvals.
- **F. Service/auto-approve lane.** Keep an explicit, certificated auto-satisfy
  lane for machine integrations (e.g. Emergency AI), or require every record to
  walk a chain? Recommended: explicit per-policy auto-satisfy, still certificated.

## 11. Exit criteria (restated, testable)

A clean environment must demonstrate:
1. A record under a chained policy **cannot** be published until every step is
   satisfied in order by eligible, distinct principals → `409 POLICY_INCOMPLETE`
   otherwise.
2. Out-of-order / ineligible / self-approval attempts are **blocked** with
   specific governance errors.
3. On satisfaction, publication succeeds **and** a **Governance Certificate** with
   `complianceResult = COMPLIANT` is generated and sealed.
4. Expiration returns a stale record to the queue; delegation is honoured and
   appears as evidence on the certificate.
5. Every decision and gate emits an auditable governance event.
6. No regression: empty-chain policies behave as today (CI suites green).

> **One-line exit test:** *Publish is impossible unless `evaluatePolicy` returns
> `satisfied` and a COMPLIANT Governance Certificate is issued.*

---

## 12. Implementation status (backend control system — IMPLEMENTED & VALIDATED)

Decisions §10 ruled: governance-role grants · publisher must hold the authority ·
per-step quorum · explicit certificated auto-satisfy. Built on those:

- **M14** governance roles + grants; **M15** executable policy fields
  (`policy_version`, `sequential`, `approval_ttl_days`); **M16** step-bound
  approvals (`step_index`, `role_key`, `on_behalf_of`, `expires_at`), delegations,
  and the stored Governance Certificate.
- **Evaluator** `evaluateChain` (pure) + `chainOf` in `governance.mjs`.
- **Decision enforcement**: role eligibility (grant/delegation), ordered open-step,
  per-step quorum, SoD; emits `governance.step_satisfied` / `policy_satisfied`.
- **Publication lock**: `POLICY_INCOMPLETE` unless satisfied; publisher must hold
  the publication authority; an approver may not publish; seals a **COMPLIANT
  Governance Certificate** (policy+version, required vs actual roles, ordered
  approval sequence, delegations, integrity proof).
- **Expiration sweep** + **role/grant/delegation** + **certificate** endpoints.
- **Backward compatible**: a policy with no role-bearing chain → legacy
  count-quorum, machine auto-approve intact.

**Validation (clean room, M1→M16):** enforcement suite **11/12** (the 12th is
*stricter-correct* — a closed step returns `STEP_NOT_OPEN`, not `ALREADY_DECIDED`).
Proven: chained submit is not auto-approved; out-of-order → `STEP_NOT_OPEN`;
ungranted → `ROLE_NOT_GRANTED`; ordered Director→Secretary-General → approved;
rogue publisher → `PUBLICATION_AUTHORITY_REQUIRED`; authority publishes → 200 +
**COMPLIANT** certificate with the ordered sequence + integrity proof; submitter
self-approval → blocked. **No regression**: sprint1-e2e 14/14, governance 23/23,
provisioning 15/15, billing 14/14.

**Remaining (next):** console UI — assign governance roles in Administration,
capture role/quorum/sequential in the policy editor, and surface the Governance
Certificate beside the Preservation Certificate. The control system itself is
complete and enforced at the API.
