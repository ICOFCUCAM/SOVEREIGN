import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runAcquisitionIntelligence, assessIntent, buildAcquisitionGraph, discoverAdjacentBuyers,
  rollupBuyerHistory, BUYER_REGISTRY,
} from '../dist/buyers/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('intent: measurable signals produce a bounded, tiered score', () => {
  for (const buyer of BUYER_REGISTRY) {
    const intent = assessIntent(buyer, rollupBuyerHistory(buyer.name));
    assert.ok(intent.score >= 0 && intent.score <= 100, `${buyer.name} score ${intent.score}`);
    assert.ok(['high', 'medium', 'low'].includes(intent.tier));
    assert.equal(intent.signals.length, 7);
    // unwired feeds must be explicit, never silently scored
    const unobserved = intent.signals.filter((s) => !s.observed && s.contribution !== 0);
    assert.equal(unobserved.length, 0, 'unobserved signals must contribute 0');
  }
});

test('intent: an active serial acquirer outranks a dormant mandate', () => {
  const dsv = BUYER_REGISTRY.find((b) => b.name === 'DSV Corporate Development');
  const amazon = BUYER_REGISTRY.find((b) => b.name === 'Amazon Strategic'); // dormant appetite
  assert.ok(dsv && amazon);
  const iDsv = assessIntent(dsv, rollupBuyerHistory(dsv.name));
  const iAmz = assessIntent(amazon, rollupBuyerHistory(amazon.name));
  assert.ok(iDsv.score > iAmz.score, `DSV ${iDsv.score} should exceed dormant Amazon ${iAmz.score}`);
});

test('graph: co-acquisition edges exist and adjacency finds off-mandate buyers', () => {
  const edges = buildAcquisitionGraph();
  assert.ok(edges.length > 0, 'graph has edges');
  for (const e of edges) assert.ok(e.weight > 0 && e.sharedSectors.length > 0);

  const hidden = discoverAdjacentBuyers('logistics_freight', 5);
  for (const h of hidden) {
    assert.ok(!h.buyer.sectorsActive.includes('logistics_freight'), `${h.buyer.name} must be off-mandate`);
    assert.ok(h.via.length > 0 && h.reason.length > 10);
  }
});

test('pipeline: layers narrow monotonically and ranking is by expected realized value', () => {
  const report = runAcquisitionIntelligence(SAMPLE_SAAS, { limit: 6 });

  // funnel: registry → fit → … → expected never grows
  assert.equal(report.layers[0].pool, BUYER_REGISTRY.length);
  assert.ok(report.layers[0].pool >= report.layers[1].pool);
  assert.ok(report.layers[3].pool <= report.layers[1].pool, 'intent screen narrows the pool');
  assert.equal(report.layers[5].pool, report.ranked.length);

  // ranking: fit-adjusted expected value descending — best expected result
  // for THIS company, not best match and not deepest pockets
  const vals = report.ranked.map((r) => r.fitAdjustedUsd);
  for (let i = 1; i < vals.length; i++) assert.ok(vals[i] <= vals[i - 1], 'sorted by fit-adjusted expected value');
  for (const r of report.ranked) {
    const expect = Math.round(r.candidate.probability * r.candidate.expectedOutcome.expectedClosingUsd);
    assert.equal(r.fitAdjustedUsd, expect, 'fitAdjustedUsd = probability × expectedClosing');
  }

  for (const r of report.ranked) {
    assert.ok(r.whyRanked.length >= 1 && r.whyRanked.length <= 6);
    assert.ok(r.intent.score >= 20, 'screened candidates carry the minimum intent');
    assert.ok(r.candidate.expectedOutcome.expectedDaysToCash > 0);
  }
  assert.ok(report.summary.includes('expected'), 'summary speaks in expected value');
});

test('registry expansion: the real logistics acquirers are wired with history', () => {
  for (const name of ['DP World Logistics M&A', 'DSV Corporate Development', 'A.P. Moller–Maersk Integrator M&A', 'CMA CGM / CEVA Acquisitions', 'Flexport Strategic']) {
    assert.ok(BUYER_REGISTRY.some((b) => b.name === name), `${name} in registry`);
    const roll = rollupBuyerHistory(name);
    assert.ok(roll.totalDeals >= 1, `${name} has deals on record`);
  }
});
