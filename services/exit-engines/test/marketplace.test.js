import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMarketplace } from '../dist/marketplace/index.js';
import { SAMPLE_SAAS } from './sample.js';

test('runMarketplace composes all six engines into a single record', async () => {
  const run = await runMarketplace(SAMPLE_SAAS, { buyerLimit: 10 });

  // valuation
  assert.ok(run.valuation.standard);
  assert.ok(run.valuation.strategic);
  assert.ok(run.valuation.strategic.headline.mid > run.valuation.standard.headline.mid);

  // readiness
  assert.ok(run.readiness.overallScore >= 0);
  assert.ok(['not_ready','seed_acquisition','growth_acquisition','strategic_acquisition'].includes(run.readiness.band));

  // buyers
  assert.ok(run.buyers.candidates.length > 0);

  // diligence
  assert.equal(run.diligence.documents.length, 7);

  // memoranda — all five documents
  assert.ok(run.memoranda.cim.sections.length > 0);
  assert.ok(run.memoranda.executiveSummary.sections.length > 0);
  assert.ok(run.memoranda.investorDeck.sections.length === 10);
  assert.equal(run.memoranda.buyerTeaser.anonymized, true);
  assert.ok(run.memoranda.ddRoomIndex.sections.length > 0);

  // headline
  assert.ok(run.headlineProposition.includes(SAMPLE_SAAS.name));
  assert.ok(run.headlineProposition.includes('ARR'));
});

test('runMarketplace respects buyerLimit', async () => {
  const run = await runMarketplace(SAMPLE_SAAS, { buyerLimit: 3 });
  assert.ok(run.buyers.candidates.length <= 3);
});

test('runMarketplace uses strategic valuation as implied price by default', async () => {
  const run = await runMarketplace(SAMPLE_SAAS);
  // implied price should be close to strategic mid
  assert.ok(run.buyers.companyHeadlineUsd > 0);
  assert.ok(Math.abs(run.buyers.companyHeadlineUsd - run.valuation.strategic.headline.mid) < 1);
});
