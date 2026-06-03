import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STANDARD_TEMPLATES, templateById, issueNda, recordSignature,
  evaluateNdaStatus, revokeNda, markBreached, generateBreachNotice,
  ndaCoverageFor, rosterFor,
} from '../dist/nda/index.js';

const FOUNDER = { id: 'founder-1', name: 'Apex Robotics, Inc.', representativeName: 'Ana Kovac', representativeEmail: 'ana@apex.example' };
const BUYER   = { id: 'buyer-1',   name: 'Helios Acquisition Group', representativeName: 'Jordan Park', representativeEmail: 'jp@helios.example' };

test('STANDARD_TEMPLATES expose three reference templates', () => {
  assert.equal(STANDARD_TEMPLATES.length, 3);
  assert.ok(templateById('tpl-bilateral-standard-v3'));
  assert.equal(templateById('tpl-does-not-exist'), undefined);
});

test('issueNda returns a pending_signature instance with merged terms', () => {
  const nda = issueNda({
    templateId: 'tpl-bilateral-standard-v3',
    listingId: 'lst-42',
    disclosing: FOUNDER,
    receiving: BUYER,
    termsOverride: { survivalMonths: 36 },
  });
  assert.equal(nda.state, 'pending_signature');
  assert.equal(nda.templateId, 'tpl-bilateral-standard-v3');
  assert.equal(nda.listingId, 'lst-42');
  assert.equal(nda.terms.survivalMonths, 36);
  assert.equal(nda.terms.governingLaw, 'Delaware');
  assert.equal(nda.signatureEvents.length, 0);
});

test('issueNda throws on unknown template', () => {
  assert.throws(() => issueNda({
    templateId: 'tpl-bogus',
    disclosing: FOUNDER,
    receiving: BUYER,
  }), /unknown template/);
});

test('recordSignature flips bilateral to active only after both parties sign', () => {
  let nda = issueNda({ templateId: 'tpl-bilateral-standard-v3', disclosing: FOUNDER, receiving: BUYER });
  nda = recordSignature(nda, 'disclosing', 'Ana Kovac', '203.0.113.10');
  assert.equal(nda.state, 'pending_signature');
  nda = recordSignature(nda, 'receiving', 'Jordan Park', '198.51.100.20');
  assert.equal(nda.state, 'active');
  assert.ok(nda.executedAt);
  assert.ok(nda.expiresAt);
  assert.ok(new Date(nda.expiresAt).getTime() > new Date(nda.executedAt).getTime());
  assert.equal(nda.signatureEvents.length, 2);
});

test('recordSignature flips one_way_receipt active on receiver alone', () => {
  let nda = issueNda({ templateId: 'tpl-oneway-buyer-receipt-v2', disclosing: FOUNDER, receiving: BUYER });
  nda = recordSignature(nda, 'receiving', 'Jordan Park');
  assert.equal(nda.state, 'active');
  assert.ok(nda.executedAt && nda.expiresAt);
});

test('evaluateNdaStatus returns expired once past expiry', () => {
  let nda = issueNda({ templateId: 'tpl-oneway-buyer-receipt-v2', disclosing: FOUNDER, receiving: BUYER });
  nda = recordSignature(nda, 'receiving', 'Jordan Park');
  // Far in the future
  const status = evaluateNdaStatus(nda, '2099-01-01T00:00:00Z');
  assert.equal(status, 'expired');
});

test('revokeNda and markBreached lock terminal state', () => {
  let nda = issueNda({ templateId: 'tpl-bilateral-standard-v3', disclosing: FOUNDER, receiving: BUYER });
  nda = recordSignature(nda, 'disclosing', 'Ana');
  nda = recordSignature(nda, 'receiving',  'Jordan');
  const revoked = revokeNda(nda, 'mutual termination');
  assert.equal(revoked.state, 'revoked');
  assert.ok(revoked.revokedAt);
  // Second revoke is idempotent
  assert.equal(revokeNda(revoked, 'again').state, 'revoked');

  const breached = markBreached(nda, 'leaked memo');
  assert.equal(breached.state, 'breached');
  assert.ok(breached.breachedAt);
});

test('generateBreachNotice produces a formal letter body', () => {
  let nda = issueNda({ templateId: 'tpl-oneway-buyer-receipt-v2', disclosing: FOUNDER, receiving: BUYER });
  nda = recordSignature(nda, 'receiving', 'Jordan Park');
  const notice = generateBreachNotice({
    nda,
    allegations: ['Disclosed CIM to a third party', 'Failed to return materials on request'],
    evidenceReferences: ['email/2026-05-20', 'audit log line 4421'],
    remedyRequested: 'injunctive_relief',
    responseDeadlineDays: 5,
  });
  assert.equal(notice.ndaId, nda.id);
  assert.equal(notice.allegations.length, 2);
  assert.equal(notice.responseDeadlineDays, 5);
  assert.equal(notice.governingLaw, 'Delaware');
  assert.ok(notice.body.includes(FOUNDER.name));
  assert.ok(notice.body.includes(BUYER.name));
  assert.ok(notice.body.includes('Notice of Breach'));
  assert.ok(notice.body.includes('USD 250,000'));
});

test('ndaCoverageFor flips visibility from public_anonymized to private_full', () => {
  let nda = issueNda({
    templateId: 'tpl-bilateral-standard-v3',
    listingId: 'lst-1',
    disclosing: FOUNDER, receiving: BUYER,
  });
  // Before signing
  const before = ndaCoverageFor(BUYER.id, 'lst-1', [nda]);
  assert.equal(before.visibility, 'public_anonymized');
  assert.equal(before.hasActiveNda, false);

  nda = recordSignature(nda, 'disclosing', 'Ana');
  nda = recordSignature(nda, 'receiving',  'Jordan');
  const after = ndaCoverageFor(BUYER.id, 'lst-1', [nda]);
  assert.equal(after.visibility, 'private_full');
  assert.equal(after.hasActiveNda, true);
  assert.equal(after.ndaId, nda.id);

  // Different buyer doesn't piggyback
  const otherBuyer = ndaCoverageFor('buyer-99', 'lst-1', [nda]);
  assert.equal(otherBuyer.visibility, 'public_anonymized');
});

test('rosterFor aggregates counts and upcoming expirations', () => {
  const a = recordSignature(
    recordSignature(
      issueNda({ templateId: 'tpl-bilateral-standard-v3', disclosing: FOUNDER, receiving: BUYER, listingId: 'lst-a' }),
      'disclosing', 'A'),
    'receiving', 'B');
  const b = issueNda({ templateId: 'tpl-bilateral-standard-v3', disclosing: FOUNDER, receiving: { id: 'b2', name: 'Acme' } });
  const c = markBreached(
    recordSignature(
      recordSignature(
        issueNda({ templateId: 'tpl-mutual-cure-v1', disclosing: FOUNDER, receiving: { id: 'b3', name: 'Beta' } }),
        'disclosing', 'A'),
      'receiving', 'B'),
    'leak');

  const roster = rosterFor([a, b, c]);
  assert.equal(roster.total, 3);
  assert.equal(roster.active, 1);
  assert.equal(roster.pending, 1);
  assert.equal(roster.breached, 1);
  assert.ok(roster.byShape.bilateral >= 2);
  assert.ok(roster.byShape.mutual_with_cure >= 1);
});
