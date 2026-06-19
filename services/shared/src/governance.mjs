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
            auto_approve_service, auto_approve_user
       from dispatch.approval_policies
      where (doc_type = $1 or doc_type is null)
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
    _source: "policy",
  };
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

// ---- Retention policy resolution --------------------------------------------
// Per-tenant retention varies by classification (e.g. SECRET kept longer than
// UNCLASSIFIED). Resolved most-specific-wins: exact level > wildcard (null) >
// the tenant default (tenants.retention_days, 30d grace). Returns days for both
// boundaries; the caller computes timestamps at publish time.
export const DEFAULT_RETENTION = Object.freeze({ retention_days: 365, purge_grace_days: 30, _source: "default" });

/**
 * Resolve the effective retention policy for a (tenant, classificationLevel).
 * Falls back to the tenant's retention_days, then DEFAULT_RETENTION.
 * @param client open pg client (within withClaims / tenant RLS)
 */
export async function resolveRetention(client, { tenantId, classificationLevel }) {
  const lvl = classificationLevel ? norm(classificationLevel) : null;
  const r = await client.query(
    `select classification_level, retention_days, purge_grace_days
       from dispatch.retention_policies
      where (classification_level = $1 or classification_level is null)`,
    [lvl]);
  if (r.rows.length) {
    const ranked = r.rows
      .map((row) => ({ row, score: row.classification_level ? 1 : 0 }))
      .sort((a, b) => b.score - a.score);
    const p = ranked[0].row;
    return { retention_days: p.retention_days, purge_grace_days: p.purge_grace_days, _source: "policy" };
  }
  // No policy row → fall back to the tenant default retention, default grace.
  const t = await client.query("select retention_days from dispatch.tenants where id=$1", [tenantId]);
  const days = t.rows[0]?.retention_days;
  return { retention_days: Number.isInteger(days) ? days : DEFAULT_RETENTION.retention_days,
    purge_grace_days: DEFAULT_RETENTION.purge_grace_days, _source: "tenant" };
}

// ---- Render gating ----------------------------------------------------------
/** A render job may only be created when the document is approved. */
export function renderAllowed(lifecycleState) {
  return lifecycleState === "approved";
}
