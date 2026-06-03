import type { EngineMeta } from '../types.js';
import type {
  NdaTemplate, NdaInstance, NdaState, NdaTerms, NdaParty,
  NdaSignatureEvent, BreachNotice, AccessCheck, NdaShape,
} from './types.js';

const ENGINE = 'nda';
const VERSION = '0.1.0';

// ── Reference templates ─────────────────────────────────────────────

export const STANDARD_TEMPLATES: readonly NdaTemplate[] = [
  {
    id: 'tpl-bilateral-standard-v3',
    name: 'Bilateral NDA — institutional standard v3',
    shape: 'bilateral',
    version: '3.1',
    clauseCount: 14,
    defaultTerms: {
      survivalMonths: 24,
      returnOrDestroyDays: 30,
      scope: 'worldwide',
      jurisdiction: 'US',
      governingLaw: 'Delaware',
      carveOuts: ['Public domain', 'Already known to recipient', 'Independently developed', 'Required by law'],
      injunctiveRelief: true,
    },
  },
  {
    id: 'tpl-oneway-buyer-receipt-v2',
    name: 'One-way NDA — buyer receiving founder disclosures v2',
    shape: 'one_way_receipt',
    version: '2.0',
    clauseCount: 11,
    defaultTerms: {
      survivalMonths: 36,
      returnOrDestroyDays: 14,
      scope: 'worldwide',
      jurisdiction: 'US',
      governingLaw: 'Delaware',
      carveOuts: ['Public domain', 'Required by law'],
      injunctiveRelief: true,
      liquidatedDamagesUsd: 250_000,
    },
  },
  {
    id: 'tpl-mutual-cure-v1',
    name: 'Mutual NDA with cure period v1',
    shape: 'mutual_with_cure',
    version: '1.2',
    clauseCount: 12,
    defaultTerms: {
      survivalMonths: 18,
      returnOrDestroyDays: 30,
      scope: 'continental',
      jurisdiction: 'US',
      governingLaw: 'Delaware',
      carveOuts: ['Public domain', 'Already known to recipient', 'Required by law'],
      injunctiveRelief: false,
    },
  },
];

export function templateById(id: string): NdaTemplate | undefined {
  return STANDARD_TEMPLATES.find((t) => t.id === id);
}

// ── Issuance ────────────────────────────────────────────────────────

let counter = 0;
function newId(prefix = 'nda'): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export interface IssueNdaInput {
  readonly templateId: string;
  readonly listingId?: string;
  readonly disclosing: NdaParty;
  readonly receiving: NdaParty;
  readonly termsOverride?: Partial<NdaTerms>;
  readonly notes?: string;
}

export function issueNda(input: IssueNdaInput): NdaInstance {
  const tpl = templateById(input.templateId);
  if (!tpl) throw new Error(`unknown template ${input.templateId}`);
  const terms: NdaTerms = { ...tpl.defaultTerms, ...input.termsOverride };
  return {
    id: newId(),
    templateId: tpl.id,
    ...(input.listingId ? { listingId: input.listingId } : {}),
    disclosing: input.disclosing,
    receiving: input.receiving,
    terms,
    state: 'pending_signature',
    issuedAt: new Date().toISOString(),
    signatureEvents: [],
    ...(input.notes ? { notes: input.notes } : {}),
  };
}

// ── Signature lifecycle ─────────────────────────────────────────────

export function recordSignature(
  nda: NdaInstance,
  party: 'disclosing' | 'receiving',
  representative: string,
  ip?: string,
): NdaInstance {
  if (nda.state !== 'pending_signature' && nda.state !== 'active') {
    throw new Error(`cannot record signature in state ${nda.state}`);
  }
  const at = new Date().toISOString();
  const events: NdaSignatureEvent[] = [
    ...nda.signatureEvents,
    { party, at, representative, ...(ip ? { ip } : {}) },
  ];

  const bothSigned = nda.terms.scope !== undefined && (
    nda.templateId.includes('oneway')
      ? events.some((e) => e.party === 'receiving')
      : events.some((e) => e.party === 'disclosing') && events.some((e) => e.party === 'receiving')
  );

  if (bothSigned) {
    const executedAt = at;
    const expiresAt = new Date(new Date(executedAt).getTime() + nda.terms.survivalMonths * 30.4375 * 86400_000).toISOString();
    const partyUpdate = party === 'disclosing'
      ? { disclosing: { ...nda.disclosing, signedAt: at } }
      : { receiving: { ...nda.receiving, signedAt: at } };
    return {
      ...nda,
      ...partyUpdate,
      state: 'active',
      executedAt,
      expiresAt,
      signatureEvents: events,
    };
  }

  const partyUpdate = party === 'disclosing'
    ? { disclosing: { ...nda.disclosing, signedAt: at } }
    : { receiving: { ...nda.receiving, signedAt: at } };
  return { ...nda, ...partyUpdate, signatureEvents: events };
}

// ── State evaluation ────────────────────────────────────────────────

export function evaluateNdaStatus(nda: NdaInstance, asOfIso?: string): NdaState {
  if (nda.state === 'revoked' || nda.state === 'breached' || nda.state === 'draft' || nda.state === 'pending_signature') {
    return nda.state;
  }
  const as = new Date(asOfIso ?? new Date().toISOString()).getTime();
  if (nda.expiresAt && as > new Date(nda.expiresAt).getTime()) return 'expired';
  return 'active';
}

export function revokeNda(nda: NdaInstance, reason: string): NdaInstance {
  if (nda.state === 'revoked' || nda.state === 'breached') return nda;
  return { ...nda, state: 'revoked', revokedAt: new Date().toISOString(), notes: [nda.notes, `Revoked: ${reason}`].filter(Boolean).join(' · ') };
}

export function markBreached(nda: NdaInstance, reason: string): NdaInstance {
  return { ...nda, state: 'breached', breachedAt: new Date().toISOString(), notes: [nda.notes, `Breach: ${reason}`].filter(Boolean).join(' · ') };
}

// ── Breach notice ───────────────────────────────────────────────────

export interface BreachNoticeInput {
  readonly nda: NdaInstance;
  readonly allegations: readonly string[];
  readonly evidenceReferences?: readonly string[];
  readonly remedyRequested?: BreachNotice['remedyRequested'];
  readonly responseDeadlineDays?: number;
}

export function generateBreachNotice(input: BreachNoticeInput): BreachNotice {
  const { nda, allegations } = input;
  const remedy = input.remedyRequested ?? 'cease_and_desist';
  const deadline = input.responseDeadlineDays ?? 7;
  const evidence = input.evidenceReferences ?? [];
  const issuedAt = new Date().toISOString();

  const body = [
    `${new Date(issuedAt).toUTCString()}`,
    ``,
    `To: ${nda.receiving.name}${nda.receiving.representativeName ? ` — Attn: ${nda.receiving.representativeName}` : ''}`,
    `From: ${nda.disclosing.name}${nda.disclosing.representativeName ? ` — ${nda.disclosing.representativeName}` : ''}`,
    `Re: Notice of Breach — NDA ${nda.id} (executed ${nda.executedAt ?? '[pending]'})`,
    ``,
    `This notice is provided pursuant to the Non-Disclosure Agreement dated ${nda.executedAt ?? '[date]'} between the above parties, governed by the laws of ${nda.terms.governingLaw}.`,
    ``,
    `We have determined that the following provisions of the Agreement have been breached:`,
    ...allegations.map((a, i) => `  ${i + 1}. ${a}`),
    ``,
    evidence.length > 0
      ? `The following evidence has been preserved and is referenced herein:\n${evidence.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}\n`
      : '',
    `Demand: ${remedy.replace(/_/g, ' ')}. We request a written response within ${deadline} days of receipt of this notice.`,
    ``,
    nda.terms.injunctiveRelief
      ? `The Agreement provides for injunctive relief at the disclosing party's election. We reserve the right to seek such relief immediately upon the expiration of the response period.`
      : `We reserve all rights and remedies available at law or in equity.`,
    nda.terms.liquidatedDamagesUsd
      ? `Liquidated damages under the Agreement: USD ${nda.terms.liquidatedDamagesUsd.toLocaleString()}.`
      : '',
    ``,
    `This notice is issued without prejudice to any other rights, remedies, or claims.`,
    ``,
    `${nda.disclosing.name}`,
  ].filter(Boolean).join('\n');

  return {
    ndaId: nda.id,
    issuedAt,
    disclosingParty: nda.disclosing.name,
    receivingParty: nda.receiving.name,
    allegations,
    evidenceReferences: evidence,
    remedyRequested: remedy,
    responseDeadlineDays: deadline,
    governingLaw: nda.terms.governingLaw,
    body,
  };
}

// ── Marketplace visibility gate ─────────────────────────────────────

export function ndaCoverageFor(
  buyerId: string,
  listingId: string,
  ndas: readonly NdaInstance[],
  asOfIso?: string,
): AccessCheck {
  const candidate = ndas.find((n) =>
    n.listingId === listingId &&
    n.receiving.id === buyerId &&
    evaluateNdaStatus(n, asOfIso) === 'active',
  );
  if (candidate) {
    return {
      buyerId,
      listingId,
      hasActiveNda: true,
      ndaId: candidate.id,
      visibility: 'private_full',
      reason: `Active NDA ${candidate.id} executed ${candidate.executedAt} — expires ${candidate.expiresAt}.`,
    };
  }
  const pending = ndas.find((n) =>
    n.listingId === listingId && n.receiving.id === buyerId && n.state === 'pending_signature',
  );
  return {
    buyerId,
    listingId,
    hasActiveNda: false,
    visibility: 'public_anonymized',
    reason: pending
      ? `NDA ${pending.id} issued ${pending.issuedAt} but not yet executed by the buyer.`
      : 'No NDA on file between this buyer and this listing.',
  };
}

// ── Roster ──────────────────────────────────────────────────────────

export interface NdaRoster {
  readonly meta: EngineMeta;
  readonly total: number;
  readonly active: number;
  readonly pending: number;
  readonly expired: number;
  readonly breached: number;
  readonly revoked: number;
  readonly byShape: Readonly<Record<NdaShape, number>>;
  readonly upcomingExpirations: readonly { ndaId: string; receiving: string; expiresAt: string; daysLeft: number }[];
}

export function rosterFor(ndas: readonly NdaInstance[], asOfIso?: string): NdaRoster {
  const now = new Date(asOfIso ?? new Date().toISOString()).getTime();
  const byShape: Record<NdaShape, number> = {
    bilateral: 0, one_way_disclosure: 0, one_way_receipt: 0, mutual_with_cure: 0,
  };
  let active = 0, pending = 0, expired = 0, breached = 0, revoked = 0;
  const upcoming: NdaRoster['upcomingExpirations'][number][] = [];

  for (const n of ndas) {
    const state = evaluateNdaStatus(n, asOfIso);
    if (state === 'active')          active++;
    if (state === 'pending_signature') pending++;
    if (state === 'expired')         expired++;
    if (state === 'breached')        breached++;
    if (state === 'revoked')         revoked++;

    const tpl = templateById(n.templateId);
    if (tpl) byShape[tpl.shape] = (byShape[tpl.shape] ?? 0) + 1;

    if (state === 'active' && n.expiresAt) {
      const days = Math.ceil((new Date(n.expiresAt).getTime() - now) / 86400_000);
      if (days <= 90) upcoming.push({ ndaId: n.id, receiving: n.receiving.name, expiresAt: n.expiresAt, daysLeft: days });
    }
  }
  upcoming.sort((a, b) => a.daysLeft - b.daysLeft);

  return {
    meta: { engine: ENGINE, version: VERSION, runAt: new Date().toISOString() },
    total: ndas.length,
    active, pending, expired, breached, revoked,
    byShape,
    upcomingExpirations: upcoming,
  };
}
