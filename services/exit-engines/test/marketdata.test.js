// Market Data engine — the fourth data source. market_cycle is derived
// live from the acquisition registry (real, traceable, available now); the
// external feeds populate from injected data or render honestly absent.
// Nothing is invented.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assessMarketConditions, marketCycle } from '../dist/marketdata/index.js';
import { runValuationConstitution } from '../dist/valuation/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('market_cycle is derived live from the registry, with provenance', () => {
  const mc = marketCycle();
  assert.equal(mc.name, 'market_cycle');
  assert.equal(mc.present, true, 'the registry has enough dated events to assess a cycle');
  assert.match(mc.value, /Expansion|Neutral|Contraction/);
  assert.match(mc.value, /trailing deal volume/);
  assert.ok(mc.source.includes('Registry'));
  assert.match(mc.source_url, /^https?:\/\//);
  assert.ok(mc.methodology.includes('24-month'));
  assert.ok(mc.last_updated.length >= 7);
});

test('external feeds are honestly absent with no input — never invented', () => {
  const m = assessMarketConditions({});
  for (const key of ['comparable_public_companies', 'interest_rate_environment', 'retrade_risk']) {
    assert.equal(m[key].present, false, `${key} absent`);
    assert.equal(m[key].source, 'not_provided');
    assert.equal(m[key].value, '— absent');
  }
});

test('an injected feed populates the variable with its real source', () => {
  const m = assessMarketConditions({
    interest_rate: { label: '10Y UST 4.2%, restrictive', source: 'US Treasury', source_url: 'https://home.treasury.gov/x', as_of: '2026-06-01' },
    public_companies: { count: 9, medianEvToRevenue: 4.3, source: 'Capital IQ export', source_url: 'https://example.com/comps', as_of: '2026-06-01' },
  });
  assert.equal(m.interest_rate_environment.present, true);
  assert.ok(m.interest_rate_environment.value.includes('restrictive'));
  assert.match(m.interest_rate_environment.source_url, /treasury/);
  assert.equal(m.comparable_public_companies.present, true);
  assert.ok(m.comparable_public_companies.value.includes('9 peers'));
  assert.equal(m.retrade_risk.present, false, 'unsupplied feed stays absent');
});

test('the constitution inherits live market_cycle and injected feeds', () => {
  const base = runValuationConstitution(SAMPLE_SAAS);
  const cycle = base.variables.market.find((v) => v.name === 'market_cycle');
  assert.equal(cycle.present, true, 'market_cycle now populates the constitution');
  assert.ok(cycle.source.includes('Registry'));

  const fed = runValuationConstitution(SAMPLE_SAAS, {
    marketFeed: { interest_rate: { label: 'restrictive', source: 'Fed', source_url: 'https://federalreserve.gov/x', as_of: '2026-06-01' } },
  });
  const rate = fed.variables.market.find((v) => v.name === 'interest_rate_environment');
  assert.equal(rate.present, true, 'injected feed flows into the constitution');
});
