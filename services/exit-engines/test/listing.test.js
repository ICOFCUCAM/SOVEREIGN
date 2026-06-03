import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createListing, matchBuyersToListing } from '../dist/listing/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('createListing produces an anonymized listing by default', () => {
  const l = createListing(SAMPLE_SAAS);
  assert.equal(l.visibility, 'public_anonymized');
  assert.equal(l.jurisdiction, 'redacted');
  assert.equal(l.fullName, undefined);
  assert.equal(l.headline.arrUsd, undefined);
  assert.ok(l.askingPriceUsd.mid > 0);
  assert.ok(l.highlights.length > 0);
});

test('createListing in private_full mode reveals identity', () => {
  const l = createListing(SAMPLE_SAAS, { visibility: 'private_full' });
  assert.equal(l.visibility, 'private_full');
  assert.equal(l.fullName, SAMPLE_SAAS.name);
  assert.equal(l.jurisdiction, SAMPLE_SAAS.jurisdiction);
  assert.equal(l.headline.arrUsd, SAMPLE_SAAS.revenue.annualRecurringRevenueUsd);
});

test('matchBuyersToListing returns ranked buyer matches', () => {
  const l = createListing(SAMPLE_SAAS, { visibility: 'private_full' });
  const m = matchBuyersToListing(l, SAMPLE_SAAS);
  assert.ok(m.matches.length > 0);
  for (let i = 1; i < m.matches.length; i++) {
    assert.ok(m.matches[i - 1].matchScore >= m.matches[i].matchScore);
  }
});

test('matchBuyersToListing suggests outreach style by match strength', () => {
  const l = createListing(SAMPLE_SAAS, { visibility: 'private_full' });
  const m = matchBuyersToListing(l, SAMPLE_SAAS, { limit: 5 });
  for (const match of m.matches) {
    assert.ok(['cold_intro', 'banker_intro', 'warm_referral', 'direct'].includes(match.suggestedOutreach));
  }
});

test('VC type appears in the registry through the marketplace', () => {
  const l = createListing(SAMPLE_SAAS, { visibility: 'private_full' });
  const m = matchBuyersToListing(l, SAMPLE_SAAS, { limit: 30 });
  assert.ok(m.matches.some((mm) => mm.buyerType === 'vc'));
});
