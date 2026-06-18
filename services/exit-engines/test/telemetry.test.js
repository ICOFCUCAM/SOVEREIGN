// Mandate telemetry — the buyer-response moat. Derives a typed event stream
// from the platform's NDA + offer artifacts and aggregates the funnel and
// timings. Every figure is observed from real process events, never invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mandateEventsFrom, aggregateBuyerResponse, processFunnel } from '../dist/exchange/index.js';

const nda = (name, issued, signedAt, state = 'active') => ({
  ndaId: `nda-${name}`, listingId: 'lst-1',
  disclosing: { id: 'f', name: 'Founder', representativeName: 'F' },
  receiving: { id: 'b', name, representativeName: 'B' },
  templateId: 't', state, issuedAt: issued, terms: {},
  signatureEvents: signedAt ? [{ party: 'receiving', signerName: 'B', at: signedAt }] : [],
});
const offer = (buyerName, receivedAt, stage = 'received') => ({
  offerId: `o-${buyerName}`, buyerName, buyerType: 'strategic', receivedAt, headlinePriceUsd: 100e6, stage, terms: [],
});

test('events are derived from real artifacts — matched, NDA, LOI, close, walk', () => {
  const events = mandateEventsFrom({
    listingId: 'lst-1',
    matchedBuyers: [{ name: 'Alpha Corp' }, { name: 'Beta Capital' }, { name: 'Gamma Holdings' }],
    ndas: [nda('Alpha Corp', '2026-01-01', '2026-01-05'), nda('Beta Capital', '2026-01-02', undefined)],
    offers: [offer('Alpha Corp', '2026-01-20', 'accepted'), offer('Gamma Holdings', '2026-01-15', 'declined')],
  });
  const kinds = events.map((e) => e.kind);
  assert.ok(kinds.includes('matched'));
  assert.ok(kinds.includes('nda_requested'));
  assert.ok(kinds.includes('nda_signed'));
  assert.ok(kinds.includes('loi_issued'));
  assert.ok(kinds.includes('closed'));
  assert.ok(kinds.includes('walked_away'));
});

test('per-buyer response captures the funnel position and real timings', () => {
  const events = mandateEventsFrom({
    listingId: 'lst-1',
    matchedBuyers: [{ name: 'Alpha Corp' }],
    ndas: [nda('Alpha Corp', '2026-01-01', '2026-01-05')],
    offers: [offer('Alpha Corp', '2026-01-20', 'accepted')],
  });
  const [alpha] = aggregateBuyerResponse(events);
  assert.equal(alpha.ndaSigned, true);
  assert.equal(alpha.loiIssued, true);
  assert.equal(alpha.closed, true);
  // time-to-NDA = 2026-01-01 → 2026-01-05 = 4 days
  assert.equal(alpha.timeToNdaDays, 4);
  // time-to-LOI = first touch (01-01) → 01-20 = 19 days
  assert.equal(alpha.timeToLoiDays, 19);
});

test('the population funnel converts matched → NDA → LOI and medians the timings', () => {
  const events = mandateEventsFrom({
    listingId: 'lst-1',
    matchedBuyers: [{ name: 'Alpha Corp' }, { name: 'Beta Capital' }, { name: 'Gamma Holdings' }, { name: 'Delta Partners' }],
    ndas: [nda('Alpha Corp', '2026-01-01', '2026-01-05'), nda('Beta Capital', '2026-01-02', '2026-01-08')],
    offers: [offer('Alpha Corp', '2026-01-20', 'received')],
  });
  const f = processFunnel(aggregateBuyerResponse(events));
  assert.equal(f.matched, 4);
  assert.equal(f.ndaSigned, 2);
  assert.equal(f.loiIssued, 1);
  assert.equal(f.ndaConversionPct, 50);   // 2 of 4
  assert.equal(f.loiConversionPct, 50);   // 1 of 2
  assert.equal(f.medianTimeToNdaDays, 5); // median(4, 6)
});

test('an empty process yields an empty, honest funnel — no fabricated stats', () => {
  const f = processFunnel(aggregateBuyerResponse([]));
  assert.equal(f.matched, 0);
  assert.equal(f.ndaConversionPct, null);
  assert.equal(f.medianTimeToNdaDays, null);
});
