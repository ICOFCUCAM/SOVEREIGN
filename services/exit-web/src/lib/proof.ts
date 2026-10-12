// Client proof (HOMEPAGE.md CC4, pre-launch gate G2). Empty on purpose: the
// homepage shows no proof until real proof exists. Each entry must record the
// permission it was published under — who agreed, and when — so nothing goes
// on the page without consent. Add entries here; the section appears by itself.

export interface ProofClient { readonly name: string; readonly sector?: string; readonly permission: string }
export interface ProofQuote { readonly quote: string; readonly name: string; readonly role: string; readonly company?: string; readonly permission: string }
export interface ProofPress { readonly outlet: string; readonly title: string; readonly url: string; readonly date: string }
export interface Proof { readonly clients: readonly ProofClient[]; readonly quotes: readonly ProofQuote[]; readonly press: readonly ProofPress[] }

export const PROOF: Proof = { clients: [], quotes: [], press: [] };

export const hasProof = (p: Proof): boolean => p.clients.length + p.quotes.length + p.press.length > 0;
