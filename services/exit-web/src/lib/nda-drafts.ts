import { recordSignature, type CompanyProfile, type NdaInstance, type NdaParty } from "@exit/engines";

// NDAs the founder drafts on the NDA desk: kept in this browser so they
// survive a reload, and signed by recording each party's signature — the
// only way an NDA becomes active. ExitOS records a signature made outside
// it (on paper or an e-signature service); it does not collect one.

const KEY = "exitos.ndas.issued.v1";

export function loadIssuedNdas(): NdaInstance[] {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? (v as NdaInstance[]) : []; } catch { return []; }
}
export function saveIssuedNdas(ndas: readonly NdaInstance[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(ndas)); } catch { /* storage unavailable: kept for this session only */ }
}

/** The disclosing party: the founder's own company, never the demo company's name. */
export const founderParty = (company: CompanyProfile): NdaParty => ({ id: `founder-${company.id}`, name: company.name });

/** The parties whose signature is still needed (a one-way NDA needs only the receiving party's). */
export function partiesToSign(nda: NdaInstance): Array<"disclosing" | "receiving"> {
  if (nda.state !== "pending_signature") return [];
  const signed = new Set(nda.signatureEvents.map((e) => e.party));
  const needed: Array<"disclosing" | "receiving"> = nda.templateId.includes("oneway") ? ["receiving"] : ["disclosing", "receiving"];
  return needed.filter((p) => !signed.has(p));
}

/** Record one party's signature by its named signatory; the NDA turns active once every party has signed. */
export function signNda(nda: NdaInstance, party: "disclosing" | "receiving", signatory: string): NdaInstance {
  const name = signatory.trim();
  if (!name) throw new Error("Name the person who signed.");
  if (!partiesToSign(nda).includes(party)) throw new Error(`The ${party} party has already signed, or the NDA is not awaiting signature.`);
  return recordSignature(nda, party, name);
}
