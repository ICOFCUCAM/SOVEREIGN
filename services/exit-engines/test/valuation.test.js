import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  runValuation, strategicBuyerReport, assetReplacementReport, countryAdjustment, MULTIPLES,
} from '../dist/valuation/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('standard valuation produces a positive, ordered band', () => {
  const r = runValuation(SAMPLE_SAAS);
  assert.ok(r.headline.low > 0);
  assert.ok(r.headline.mid >= r.headline.low);
  assert.ok(r.headline.high >= r.headline.mid);
  assert.equal(r.headline.currency, 'USD');
  assert.equal(r.reportType, 'standard');
  assert.ok(r.methodologies.length > 0);
});

test('strategic valuation is materially higher than standard', () => {
  const std = runValuation(SAMPLE_SAAS, { reportType: 'standard' });
  const str = strategicBuyerReport(SAMPLE_SAAS);
  assert.ok(str.headline.mid > std.headline.mid, `strategic ${str.headline.mid} should exceed standard ${std.headline.mid}`);
});

test('asset-replacement valuation uses replacement cost methodology', () => {
  const r = assetReplacementReport(SAMPLE_SAAS);
  assert.equal(r.reportType, 'asset_replacement');
  const hasReplacement = r.methodologies.some((m) => m.name === 'Replacement cost');
  const hasOpportunity = r.methodologies.some((m) => m.name.startsWith('Opportunity cost'));
  assert.ok(hasReplacement);
  assert.ok(hasOpportunity);
});

test('country adjustment respects jurisdiction', () => {
  assert.equal(countryAdjustment('US'), 1);
  assert.ok(countryAdjustment('BR') < 1);
  assert.ok(countryAdjustment('CH') > 1);
  assert.ok(countryAdjustment('ZZ') < 1); // unknown country falls back
});

test('rule of 40 premium fires when threshold met', () => {
  const high = { ...SAMPLE_SAAS, growth: { ...SAMPLE_SAAS.growth, arrGrowthYoyPct: 0.6 }, revenue: { ...SAMPLE_SAAS.revenue, ebitdaMarginPct: 0.2 } };
  const r = runValuation(high);
  const premium = r.premiums.find((p) => p.name === 'Rule of 40');
  assert.ok(premium, `expected Rule of 40 premium; got ${JSON.stringify(r.premiums)}`);
});

test('customer concentration applies a discount', () => {
  const concentrated = { ...SAMPLE_SAAS, revenue: { ...SAMPLE_SAAS.revenue, customerConcentrationTop10Pct: 0.75 } };
  const r = runValuation(concentrated);
  const discount = r.premiums.find((p) => p.name === 'Concentration discount');
  assert.ok(discount);
  assert.ok((discount?.pct ?? 0) < 0);
});

test('MULTIPLES covers every declared sector', () => {
  for (const sector of ['enterprise_saas', 'vertical_saas', 'b2b_marketplace', 'consumer_marketplace', 'fintech_payments', 'logistics_freight', 'mobility', 'ai_infra', 'developer_tools', 'media_content', 'other']) {
    assert.ok(MULTIPLES[sector], `missing multiples for ${sector}`);
  }
});
