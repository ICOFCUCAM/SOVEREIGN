// NDA lifecycle engine — types.
//
// Issues bilateral or one-way NDAs against a template, tracks state
// per buyer, generates breach notices, and gates marketplace visibility
// (a listing's visibility flips public_anonymized → private_full for a
// specific buyer once an NDA is active between them).

export type NdaShape = 'bilateral' | 'one_way_disclosure' | 'one_way_receipt' | 'mutual_with_cure';

export type NdaState =
  | 'draft'
  | 'pending_signature'
  | 'active'
  | 'expired'
  | 'revoked'
  | 'breached';

export type NoticeScope = 'local' | 'national' | 'continental' | 'worldwide';

export interface NdaTerms {
  readonly survivalMonths: number;               // confidentiality lasts this long after termination
  readonly returnOrDestroyDays: number;          // on termination
  readonly scope: NoticeScope;
  readonly jurisdiction: string;                 // ISO country
  readonly governingLaw: string;                 // e.g. "Delaware"
  readonly carveOuts: readonly string[];         // public domain, already-known, etc.
  readonly liquidatedDamagesUsd?: number;
  readonly injunctiveRelief: boolean;
}

export interface NdaTemplate {
  readonly id: string;
  readonly name: string;
  readonly shape: NdaShape;
  readonly defaultTerms: NdaTerms;
  readonly clauseCount: number;
  readonly version: string;
}

export interface NdaParty {
  readonly id: string;
  readonly name: string;
  readonly representativeName?: string;
  readonly representativeEmail?: string;
  readonly signedAt?: string;
}

export interface NdaSignatureEvent {
  readonly party: 'disclosing' | 'receiving';
  readonly at: string;
  readonly representative: string;
  readonly ip?: string;
}

export interface NdaInstance {
  readonly id: string;
  readonly templateId: string;
  readonly listingId?: string;                   // marketplace listing this NDA gates
  readonly disclosing: NdaParty;                 // founder side
  readonly receiving: NdaParty;                  // buyer side
  readonly terms: NdaTerms;
  readonly state: NdaState;
  readonly issuedAt: string;
  readonly executedAt?: string;
  readonly expiresAt?: string;                   // executedAt + survivalMonths
  readonly revokedAt?: string;
  readonly breachedAt?: string;
  readonly signatureEvents: readonly NdaSignatureEvent[];
  readonly notes?: string;
}

export interface BreachNotice {
  readonly ndaId: string;
  readonly issuedAt: string;
  readonly disclosingParty: string;
  readonly receivingParty: string;
  readonly allegations: readonly string[];
  readonly evidenceReferences: readonly string[];
  readonly remedyRequested: 'cease_and_desist' | 'damages' | 'injunctive_relief' | 'all_remedies';
  readonly responseDeadlineDays: number;
  readonly governingLaw: string;
  readonly body: string;                         // formal letter text
}

export interface AccessCheck {
  readonly buyerId: string;
  readonly listingId: string;
  readonly hasActiveNda: boolean;
  readonly ndaId?: string;
  readonly visibility: 'public_anonymized' | 'private_full';
  readonly reason: string;
}
