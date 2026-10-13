import type { DocumentType } from "./registry";
import type { GateResult } from "./gate";
import type { ReviewStatus } from "./service";

// The one honest status shown for a document: what ExitOS can do with it right
// now, never what is planned. Derived from the registry (does it exist?), the
// gate (are the inputs real? may it be shared?) and the latest saved version.

export type Capability =
  | "not_built"          // ExitOS does not produce it (the registry says so)
  | "external"           // supplied by the company, a counterparty or counsel
  | "blocked"            // the gate withholds it (confidential content in a pre-NDA document)
  | "sample"             // the demo company's document, not the user's own
  | "needs_inputs"       // inputs still hold the demo company's values
  | "available"          // can be generated now
  | "draft"              // a saved draft exists
  | "awaiting_review"    // submitted, or with counsel
  | "approved";          // approved for use — not executed

export const CAPABILITY_LABEL: Record<Capability, string> = {
  not_built: "Not built in ExitOS",
  external: "Supplied externally",
  blocked: "Blocked — confidential content",
  sample: "Sample company — not your document",
  needs_inputs: "Needs your inputs",
  available: "Available",
  draft: "Draft saved",
  awaiting_review: "Awaiting review",
  approved: "Approved (not executed)",
};

export function capabilityOf(type: DocumentType, gate: GateResult | null, latest: ReviewStatus | null, sample = false): Capability {
  if (type.status === "not_built" || type.status === "dead_code") return "not_built";
  if (type.kind === "requested" || type.kind === "counsel") return "external";
  if (gate?.blocked) return "blocked";
  if (sample) return "sample";
  if (latest === "approved") return "approved";
  if (latest === "in_review" || latest === "counsel_review") return "awaiting_review";
  if (gate?.unconfirmed.length) return "needs_inputs";
  if (latest === "draft") return "draft";
  return "available";
}
