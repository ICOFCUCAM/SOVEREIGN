// Sovereign Dispatch — publication governance (Sprint 3).
//
// The lifecycle that sits ABOVE the render job:
//   draft → submitted → in_review → approved → rendered → published → archived
//                              │
//                          (rejected)            (withdrawn from published)
//
// Dispatch is institutional publication infrastructure, not a word processor:
// the value is Submit → Govern → Approve → Render → Publish → Retrieve, with
// provenance and clearance enforced at each gate. This module owns the state
// machine, the approval policy resolution (N-eyes / clearance / auto-approve
// lane), and the quorum evaluation. It is intentionally storage-agnostic: it
// takes an open pg client (already inside withClaims) where it must read/write.

// ---- Lifecycle states + legal transitions -----------------------------------
export const STATES = Object.freeze([
  "draft", "submitted", "in_review", "approved", "rejected",
  "rendered", "published", "withdrawn", "archived",
]);

// Adjacency: state → states it may legally move to. Render is gated on
// `approved`; `rendered` is reached by the worker after a successful render.
const TRANSITIONS = Object.freeze({
  draft:      ["submitted"],
  submitted:  ["in_review", "approved", "rejected"], // auto-approve lane skips in_review
  in_review:  ["approved", "rejected", "draft"],     // "return" sends back to draft
  approved:   ["rendered", "rejected"],               // rejected only before render starts
  rejected:   ["draft"],                              // re-work creates a new version
  rendered:   ["published", "withdrawn"],
  published:  ["withdrawn", "archived"],
  withdrawn:  ["archived"],
  archived:   [],
});

export function canTransition(from, to) {
  return Array.isArray(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
}

export function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const e = new Error(`illegal lifecycle transition ${from} → ${to}`);
    e.code = "ILLEGAL_TRANSITION";
    e.status = 409;
    throw e;
  }
}

// ---- Approval policy resolution ---------------------------------------------
// Application defaults when no DB policy row matches: machine (service) lane
// auto-approves so existing integrations (e.g. Emergency AI) are unchanged;
// human lane requires one approval. A matching dispatch.approval_policies row
// (most-specific wins) overrides these.
export const DEFAULT_POLICY = Object.freeze({
  required_approvals: 1,
  min_approver_clearance: null,
  auto_approve_service: true,
  auto_approve_user: false,
});

function norm(s) { return String(s ?? "").trim().toLowerCase(); }

/**
 * Resolve the effective approval policy for a (docType, classificationLevel).
 * Most-specific match wins: exact (doc_type, level) > (doc_type, null) >
 * (null, level) > (null, null) > application DEFAULT_POLICY.
 * @param client open pg client (within withClaims / tenant RLS)
 */
export async function resolvePolicy(client, { docType, classificationLevel }) {
  const lvl = classificationLevel ? norm(classificationLevel) : null;
  const r = await client.query(
    `select doc_type, classification_level, required_approvals, min_approver_clearance,
            auto_approve_service, auto_approve_user,
            name, review_chain, approval_authority, publication_authority, retention_days,
            policy_version, sequential, approval_ttl_days
       from dispatch.approval_policies
      where active is not false
        and (doc_type = $1 or doc_type is null)
        and (classification_level = $2 or classification_level is null)`,
    [docType ?? null, lvl]);
  if (!r.rows.length) return { ...DEFAULT_POLICY, _source: "default" };
  // Rank specificity: doc_type match (2) + level match (1).
  const ranked = r.rows
    .map((row) => ({ row, score: (row.doc_type ? 2 : 0) + (row.classification_level ? 1 : 0) }))
    .sort((a, b) => b.score - a.score);
  const p = ranked[0].row;
  return {
    required_approvals: p.required_approvals,
    min_approver_clearance: p.min_approver_clearance,
    auto_approve_service: p.auto_approve_service,
    auto_approve_user: p.auto_approve_user,
    name: p.name,
    review_chain: p.review_chain ?? [],
    approval_authority: p.approval_authority,
    publication_authority: p.publication_authority,
    retention_days: p.retention_days,
    policy_version: p.policy_version ?? 1,
    sequential: p.sequential !== false,
    approval_ttl_days: p.approval_ttl_days ?? null,
    _source: "policy",
  };
}

// ---- Policy administration (first-class governance objects) -----------------
// Both run inside withClaims (tenant RLS). Writes additionally require the
// caller's claims to carry dispatch_role='tenant_admin' (see M12 RLS).

/** List this tenant's governance policies, most-specific first. */
export async function listPolicies(client) {
  const r = await client.query(
    `select id, name, doc_type, classification_level, required_approvals,
            min_approver_clearance, auto_approve_service, auto_approve_user,
            review_chain, approval_authority, publication_authority, retention_days, active,
            created_at, updated_at
       from dispatch.approval_policies
      order by (doc_type is not null) desc, doc_type nulls last, classification_level nulls last`);
  return r.rows;
}

/**
 * Upsert a governance policy keyed by (tenant, doc_type, classification_level).
 * The binding (type+level) is how a record inherits it; name/chain/authorities
 * are the governance it carries. Requires tenant_admin claims (RLS-enforced).
 */
export async function upsertPolicy(client, tenantId, p) {
  const lvl = p.classificationLevel ? norm(p.classificationLevel) : null;
  const r = await client.query(
    `insert into dispatch.approval_policies
       (tenant_id, doc_type, classification_level, required_approvals, min_approver_clearance,
        auto_approve_service, auto_approve_user, name, review_chain, approval_authority,
        publication_authority, retention_days, active, sequential, approval_ttl_days, policy_version, updated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13,$14,$15,1, now())
     on conflict (tenant_id, doc_type, classification_level) do update set
       required_approvals = excluded.required_approvals,
       min_approver_clearance = excluded.min_approver_clearance,
       auto_approve_service = excluded.auto_approve_service,
       auto_approve_user = excluded.auto_approve_user,
       name = excluded.name,
       review_chain = excluded.review_chain,
       approval_authority = excluded.approval_authority,
       publication_authority = excluded.publication_authority,
       retention_days = excluded.retention_days,
       active = excluded.active,
       sequential = excluded.sequential,
       approval_ttl_days = excluded.approval_ttl_days,
       policy_version = dispatch.approval_policies.policy_version + 1,
       updated_at = now()
     returning id`,
    [tenantId, p.docType ?? null, lvl,
     Number.isInteger(p.requiredApprovals) ? p.requiredApprovals : 1,
     p.minApproverClearance ?? null,
     p.autoApproveService ?? true, p.autoApproveUser ?? false,
     p.name ?? null, JSON.stringify(p.reviewChain ?? []),
     p.approvalAuthority ?? null, p.publicationAuthority ?? null,
     Number.isInteger(p.retentionDays) ? p.retentionDays : null,
     p.active ?? true,
     p.sequential ?? true,
     Number.isInteger(p.approvalTtlDays) ? p.approvalTtlDays : null]);
  return r.rows[0].id;
}

/** Does this principal's submission auto-approve under the policy? */
export function autoApproves(policy, principalType) {
  if (policy.required_approvals === 0) return true;
  return principalType === "service" ? !!policy.auto_approve_service : !!policy.auto_approve_user;
}

// ---- Approval quorum (N-eyes + separation of duties) ------------------------
/**
 * Evaluate recorded approvals for a (document, version) against the policy.
 * Rules:
 *   - any `reject` decision → rejected (terminal for this version)
 *   - any `return` decision → returned (back to draft)
 *   - distinct `approve` actors ≥ required_approvals → approved
 *   - the submitter may not be a deciding approver (enforced at write time;
 *     re-checked here defensively by excluding the submitter actor)
 * @returns {{ outcome: 'approved'|'rejected'|'returned'|'pending', approvals:number, required:number }}
 */
export function evaluateQuorum(decisions, policy, { submitter } = {}) {
  const required = policy.required_approvals ?? 1;
  if (decisions.some((d) => d.decision === "reject")) {
    return { outcome: "rejected", approvals: 0, required };
  }
  if (decisions.some((d) => d.decision === "return")) {
    return { outcome: "returned", approvals: 0, required };
  }
  const approvers = new Set(
    decisions.filter((d) => d.decision === "approve" && d.actor !== submitter).map((d) => d.actor));
  if (approvers.size >= required) return { outcome: "approved", approvals: approvers.size, required };
  return { outcome: "pending", approvals: approvers.size, required };
}

// ---- Executable governance chain (CIRCLE 2) ---------------------------------
// The policy's review_chain becomes an ordered, role-bound, quorate control. A
// step is enforceable only if it names a governance `role`; a chain with no
// role-bearing steps means "no enforcement" and the legacy count-quorum applies.
export function chainOf(policy) {
  const raw = Array.isArray(policy?.review_chain) ? policy.review_chain : [];
  return raw
    .map((s, i) => ({ index: typeof s.index === "number" ? s.index : i, role: s.role || null,
      label: s.label || s.role || `Step ${i + 1}`, quorum: Math.max(1, Number(s.quorum) || 1) }))
    .filter((s) => s.role)
    .sort((a, b) => a.index - b.index)
    .map((s, i) => ({ ...s, index: i }));
}

/**
 * Evaluate ordered, role-bound, quorate approvals against a chain.
 * @param decisions [{ decision, actor, role_key, expired? }] for the version
 * @param chain     from chainOf(policy)
 * @returns { outcome:'satisfied'|'pending'|'rejected'|'returned', steps[], openStep|null }
 *
 * Terminal signals win. Each step tallies DISTINCT, non-expired `approve`
 * decisions whose role matches the step (the submitter never counts). Sequential
 * chains expose the first unsatisfied step as `openStep` — out-of-order approvals
 * are refused at write time, so evaluation is a straight per-step tally.
 */
export function evaluateChain(decisions, chain, { submitter, sequential = true } = {}) {
  const live = decisions.filter((d) => !d.expired);
  if (live.some((d) => d.decision === "reject")) return { outcome: "rejected", steps: [], openStep: null };
  if (live.some((d) => d.decision === "return")) return { outcome: "returned", steps: [], openStep: null };
  const approves = live.filter((d) => d.decision === "approve" && d.actor !== submitter);
  const steps = chain.map((s) => {
    const by = [...new Set(approves.filter((a) => a.role_key === s.role).map((a) => a.actor))];
    return { index: s.index, role: s.role, label: s.label, quorum: s.quorum,
      satisfiedBy: by, satisfied: by.length >= s.quorum, remaining: Math.max(0, s.quorum - by.length) };
  });
  let openStep = null;
  for (const st of steps) { if (!st.satisfied) { openStep = st.index; break; } }
  const satisfied = steps.every((s) => s.satisfied);
  return { outcome: satisfied ? "satisfied" : "pending", steps, openStep };
}

// ---- Render gating ----------------------------------------------------------
/** A render job may only be created when the document is approved. */
export function renderAllowed(lifecycleState) {
  return lifecycleState === "approved";
}
