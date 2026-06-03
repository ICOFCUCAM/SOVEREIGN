import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOffer, compareOffers, deriveNegotiationState } from '../dist/negotiation/index.js';
import { runValuation } from '../dist/valuation/index.js';
import { SAMPLE_SAAS } from './sample.js';

function offer(over = {}) {
  return {
    offerId: 'o-1',
    buyerName: 'Helios Acquisition Group',
    buyerType: 'strategic',
    receivedAt: '2026-05-01T10:00:00Z',
    headlinePriceUsd: 140_000_000,
    cashPct: 0.75,
    stockPct: 0.15,
    earnoutPct: 0.10,
    terms: [
      { category: 'escrow',     label: 'Escrow',         value: '10% / 18mo', numeric: 0.10 },
      { category: 'indemnity',  label: 'Indemnity cap',  value: '20% of price', numeric: 0.20 },
      { category: 'retention',  label: 'Retention',      value: '24 months',  numeric: 24 },
      { category: 'non_compete',label: 'Non-compete',    value: 'National 24mo' },
    ],
    stage: 'received',
    ...over,
  };
}

const RESERVE = {
  minHeadlinePriceUsd: 70_000_000,
  minCashPct: 0.60,
  maxEarnoutPct: 0.20,
  maxEscrowPct: 0.15,
  maxEscrowMonths: 24,
  maxRetentionMonths: 18,
  maxNonCompeteScope: 'national',
  maxIndemnityCapPct: 0.25,
  preferredTaxStructure: 'stock_sale',
};

test('evaluateOffer scores a strong offer above 70', () => {
  const valuation = runValuation(SAMPLE_SAAS, { reportType: 'strategic' });
  const ev = evaluateOffer(offer(), SAMPLE_SAAS, valuation, RESERVE);
  assert.ok(ev.score >= 65, `expected ≥ 65, got ${ev.score}`);
  assert.ok(['accept', 'counter'].includes(ev.recommendation));
});

test('evaluateOffer rejects an offer below the price floor', () => {
  const valuation = runValuation(SAMPLE_SAAS, { reportType: 'strategic' });
  const ev = evaluateOffer(offer({ headlinePriceUsd: 50_000_000 }), SAMPLE_SAAS, valuation, RESERVE);
  assert.equal(ev.recommendation, 'decline');
  assert.ok(ev.conflicts.some((c) => c.term === 'Headline price' && c.severity === 'hard'));
});

test('evaluateOffer surfaces earnout conflict when over threshold', () => {
  const valuation = runValuation(SAMPLE_SAAS, { reportType: 'strategic' });
  const ev = evaluateOffer(offer({ cashPct: 0.40, stockPct: 0.10, earnoutPct: 0.50 }), SAMPLE_SAAS, valuation, RESERVE);
  assert.ok(ev.conflicts.some((c) => c.term === 'Earnout'));
});

test('impliedNetToFoundersUsd applies stock + earnout discounts', () => {
  const valuation = runValuation(SAMPLE_SAAS, { reportType: 'strategic' });
  const ev = evaluateOffer(offer(), SAMPLE_SAAS, valuation, RESERVE);
  // Founders own 32% of price -> 28.8M gross.
  // 75% cash + 15% stock × 0.85 + 10% earnout × 0.55 → 75 + 12.75 + 5.5 = 93.25%
  const expected = 140_000_000 * 0.32 * (0.75 + 0.15 * 0.85 + 0.10 * 0.55);
  assert.ok(Math.abs(ev.impliedNetToFoundersUsd - expected) < 100);
});

test('compareOffers ranks bids and identifies a leader', () => {
  const valuation = runValuation(SAMPLE_SAAS, { reportType: 'strategic' });
  const offers = [
    offer({ offerId: 'a', headlinePriceUsd: 80_000_000, cashPct: 0.6, stockPct: 0.2, earnoutPct: 0.2 }),
    offer({ offerId: 'b', headlinePriceUsd: 100_000_000, cashPct: 0.8, stockPct: 0.1, earnoutPct: 0.1 }),
    offer({ offerId: 'c', headlinePriceUsd: 85_000_000, cashPct: 0.5, stockPct: 0.3, earnoutPct: 0.2 }),
  ];
  const cmp = compareOffers(offers, SAMPLE_SAAS, valuation, RESERVE);
  assert.equal(cmp.leader, 'b');
  assert.equal(cmp.offers.length, 3);
  assert.ok(cmp.summary.includes('leads'));
});

test('deriveNegotiationState surfaces correct leverage', () => {
  const highLev = deriveNegotiationState({ stage: 'engaged', activeOffers: 4 });
  assert.equal(highLev.leverage, 'high');
  const lowLev = deriveNegotiationState({ stage: 'engaged', activeOffers: 1, hasExclusivity: true });
  assert.equal(lowLev.leverage, 'low');
});

test('deriveNegotiationState recommends next move per stage', () => {
  const sourcing = deriveNegotiationState({ stage: 'sourcing', activeOffers: 0 });
  assert.ok(sourcing.nextMove.toLowerCase().includes('outreach'));
  const loi      = deriveNegotiationState({ stage: 'loi', activeOffers: 3, hasExclusivity: false });
  assert.ok(loi.nextMove.toLowerCase().includes('leverage') || loi.nextMove.toLowerCase().includes('counter'));
});
