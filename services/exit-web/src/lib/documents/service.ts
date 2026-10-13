import type { CompanyProfile } from "@exit/engines";
import type { IntakeField } from "../active-company";
import { documentType, REGISTRY_SCHEMA_VERSION } from "./registry";
import { gateDocument, type DisclosureFinding } from "./gate";
import { toDdm, CLASSIFICATION_LEVEL, CLASSIFICATION_HANDLING, type ContentSection, type DdmDocument, type Family } from "./ddm";

// ── DOCUMENT GENERATION SERVICE ─────────────────────────────────────
// Every export goes through here: the registry says what the document is, the
// gate checks its inputs and disclosure, and the result is an immutable version
// that records what it was made from. The same DDM model is what Dispatch
// renders to PDF, so a version's Markdown, preview and PDF are one document.

export type ReviewStatus = "draft" | "in_review" | "counsel_review" | "approved" | "superseded";
/** Template version of the ExitOS → DDM mapping; bump when ddm.ts changes what a document contains. */
export const TEMPLATE_VERSION = "ddm-map@1.1.0";

export interface DocumentVersion {
  readonly id: string;
  readonly typeId: string;
  readonly registrySchemaVersion: string;
  readonly templateVersion: string;
  /** The engine or builder that produced the content, e.g. "TemplateMemorandumGenerator@1.2.0". */
  readonly producedBy: string;
  readonly companyId: string | null;
  readonly transactionId: string | null;
  readonly generatedAt: string;
  readonly generatedBy: string;
  readonly status: ReviewStatus;
  /** sha-256 of the input snapshot */
  readonly sourceHash: string;
  /** sha-256 of the DDM document */
  readonly contentHash: string;
  readonly inputs: Record<string, unknown>;
  readonly unconfirmedInputs: readonly IntakeField[];
  readonly disclosure: readonly DisclosureFinding[];
  readonly ddm: DdmDocument;
}

/** JSON with sorted keys, so equal content always hashes equally. */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(canonicalJson).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(",")}}`;
}

export async function sha256(text: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const FAMILY: Record<string, Family> = {
  "exitos.cim": "memorandum", "exitos.executive_summary": "memorandum", "exitos.investor_deck": "memorandum",
  "exitos.teaser": "memorandum", "exitos.data_room_index": "memorandum",
  "exitos.closing_checklist": "checklist",
  "exitos.diligence_findings": "diligence", "exitos.seller_diligence_report": "diligence",
};
// types whose DDM is built by their own mapper (passed in as `ddm`)
const BESPOKE = new Set(["exitos.board_memo_process"]);
/** Whether a type can be rendered through Dispatch yet (has a DDM mapping). */
export const hasLayout = (typeId: string): boolean => typeId in FAMILY || BESPOKE.has(typeId);

export interface GenerateInput {
  readonly typeId: string;
  readonly title: string;
  readonly subtitle?: string;
  readonly sections: readonly ContentSection[];
  readonly producedBy: string;
  readonly company: CompanyProfile;
  readonly companyId: string | null;
  readonly unconfirmed: readonly IntakeField[];
  /** Everything the content was computed from (intake inputs, timeline, statuses …). */
  readonly inputs: Record<string, unknown>;
  readonly generatedBy: string;
  readonly ownerName: string;          // code name for pre-NDA documents, else the company name
  readonly valuationMidUsd?: number;
  readonly notices?: readonly string[];
  readonly version?: number;           // 1-based number among this company's versions of the type
  readonly now?: Date;
  /** For a type with its own mapper (the board memorandum): the DDM it built. */
  readonly ddm?: DdmDocument;
}

/** Build an immutable version. Throws when the gate withholds a pre-NDA or public document. */
export async function generateVersion(g: GenerateInput): Promise<DocumentVersion> {
  const type = documentType(g.typeId);
  const family = FAMILY[g.typeId];
  if (!family && !(BESPOKE.has(g.typeId) && g.ddm)) throw new Error(`${g.typeId} has no document layout yet`);
  const text = g.sections.map((s) => [s.heading, s.body ?? "", ...(s.bullets ?? []), ...(s.table?.rows.flat() ?? []), ...(s.tables ?? []).flatMap((t) => t.rows.flat())].join("\n")).join("\n") + `\n${g.title}\n${g.subtitle ?? ""}`;
  const gate = gateDocument(g.typeId, text, { company: g.company, unconfirmed: g.unconfirmed, ...(g.valuationMidUsd ? { valuationMidUsd: g.valuationMidUsd } : {}) });
  if (gate.blocked) throw new Error(`Withheld: ${gate.disclosure.map((d) => d.what).join(", ")} in a ${type.classification} document`);
  const now = g.now ?? new Date();
  const sourceHash = await sha256(canonicalJson(g.inputs));
  const notices = [
    ...(g.notices ?? []),
    ...(gate.unconfirmed.length ? [`Draft: ${gate.unconfirmed.length} input(s) are still the demo company's values (${gate.unconfirmed.join(", ")}).`] : []),
    ...(type.reviewRequired === "counsel" ? ["Requires review by qualified counsel; not a legal instrument."] : []),
  ];
  const version = g.version ?? 1;
  const stamp = { version: String(version), status: "draft" as const, referenceCode: `${g.typeId} · ${sourceHash.slice(0, 12)}`, date: now.toISOString().slice(0, 10) };
  const draftDdm: DdmDocument = !family ? {
    ...g.ddm!,
    metadata: { ...((g.ddm!.metadata as Record<string, unknown>) ?? {}), ...stamp, owningBody: g.ownerName, audience: type.audience },
    classification: { scheme: "corporate", level: CLASSIFICATION_LEVEL[type.classification], handling: CLASSIFICATION_HANDLING[type.classification] },
  } : toDdm({
    family, typeId: g.typeId, title: g.title, ...(g.subtitle ? { subtitle: g.subtitle } : {}),
    classification: type.classification, date: now.toISOString().slice(0, 10),
    version: String(version), status: "draft", owningBody: g.ownerName, audience: type.audience,
    referenceCode: `${g.typeId} · ${sourceHash.slice(0, 12)}`, sections: g.sections, notices,
  });
  const contentHash = await sha256(canonicalJson(draftDdm));
  return {
    id: `dv-${contentHash.slice(0, 16)}-${now.getTime().toString(36)}`,
    typeId: g.typeId, registrySchemaVersion: REGISTRY_SCHEMA_VERSION, templateVersion: TEMPLATE_VERSION, producedBy: g.producedBy,
    companyId: g.companyId, transactionId: null, generatedAt: now.toISOString(), generatedBy: g.generatedBy,
    status: "draft", sourceHash, contentHash, inputs: g.inputs,
    unconfirmedInputs: gate.unconfirmed, disclosure: gate.disclosure, ddm: draftDdm,
  };
}
