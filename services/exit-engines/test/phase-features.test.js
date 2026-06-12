// Phase 1–7 feature contract: buyer graph, connector layer, similar
// transactions, mandate state machine. Every assertion runs against the
// curated source-referenced history — no synthetic buyers, no mock deals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { buildBuyerGraph, runSimilarTransactions } from '../dist/buyers/index.js';
import { deriveMandateState, MANDATE_STATES } from '../dist/exchange/index.js';
import { createListing } from '../dist/listing/index.js';
import { issueNda, recordSignature } from '../dist/nda/index.js';
import { loadConnector, CONNECTORS } from '../dist/scripts/ingest/connectors.js';
import { SAMPLE_SAAS } from './sample.js';

// ── Phase 1 · property graph ────────────────────────────────────────

test('graph entities carry the full Phase-1 property schema with explicit nulls', () => {
  const g = buildBuyerGraph();
  const buyer = g.entities.find((e) => e.kind === 'buyer' && e.props);
  assert.ok(buyer, 'registry buyers become graph entities');
  const p = buyer.props;
  for (const key of [
    'buyer_type', 'headquarters', 'countries', 'sectors', 'sub_sectors',
    'acquisition_count', 'check_size_low_usd', 'check_size_high_usd',
    'acquisition_frequency_per_year', 'appetite_score',
    'historical_premium_pct', 'historical_close_days', 'historical_close_rate',
    'public_market_cap_usd', 'cash_position_usd', 'pe_fund_size_usd',
    'fund_vintage', 'acquisition_team', 'corp_dev_contacts',
    'portfolio_companies', 'expansion_targets', 'strategic_priorities',
  ]) {
    assert.ok(key in p, `props expose ${key}`);
  }
  // unfed fields are explicit nulls, never fabricated values
  assert.equal(p.public_market_cap_usd, null);
  assert.equal(p.cash_position_usd, null);
  assert.equal(p.acquisition_team, null);
});

test('acquisitions become typed relations: acquired / owns / attempted', () => {
  const g = buildBuyerGraph();
  const kinds = new Set(g.relations.map((r) => r.kind));
  assert.ok(kinds.has('acquired'));
  assert.ok(kinds.has('owns'));
  assert.ok(kinds.has('attempted'));
  assert.ok(kinds.has('competes_with'));
  // every relation carries provenance back to its source ref
  assert.ok(g.relations.every((r) => typeof r.provenance.source === 'string'));
});

test('lost bid produces a competes_with edge to the winning buyer', () => {
  const g = buildBuyerGraph();
  const rivals = g.competitorsOf('Salesforce Acquisition Office');
  const ms = rivals.find((r) => r.name === 'Microsoft Industry Solutions');
  assert.ok(ms, 'Salesforce lost LinkedIn to Microsoft — the graph knows');
  assert.equal(ms.basis, 'lost_bid');
});

test('portfolioOf returns owned targets; attemptsOf returns failed bids', () => {
  const g = buildBuyerGraph();
  assert.ok(g.portfolioOf('Uber Acquisitions').includes('Postmates'));
  const attempts = g.attemptsOf('Amazon Strategic');
  assert.ok(attempts.some((r) => r.props.status === 'terminated'), 'iRobot termination is an attempted edge');
});

// ── Phase 2 · connector layer ───────────────────────────────────────

test('connectors with no drop file report no_file and zero records', () => {
  const empty = mkdtempSync(join(tmpdir(), 'exitos-conn-'));
  try {
    for (const spec of CONNECTORS) {
      const r = loadConnector(spec, empty);
      assert.equal(r.status, 'no_file');
      assert.equal(r.records.length, 0);
    }
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

test('connector rows without a real source URL never enter the registry', () => {
  const dir = mkdtempSync(join(tmpdir(), 'exitos-conn-'));
  try {
    mkdirSync(join(dir, 'imports'), { recursive: true });
    writeFileSync(join(dir, 'imports', 'crunchbase_acquisitions.json'), JSON.stringify([
      { acquirer_name: 'Acme Corp', acquiree_name: 'Widget Co', announced_on: '2024-03-01', cb_url: 'https://www.crunchbase.com/acquisition/acme-widget' },
      { acquirer_name: 'Ghost Inc', acquiree_name: 'Phantom Ltd', announced_on: '2024-04-01', cb_url: '' },
    ]));
    const spec = CONNECTORS.find((c) => c.name === 'crunchbase');
    const r = loadConnector(spec, dir);
    assert.equal(r.status, 'loaded');
    assert.equal(r.records.length, 1, 'the unsourced row is dropped, not defaulted');
    const rec = r.records[0];
    assert.equal(rec.buyer_name, 'Acme Corp');
    assert.match(rec.source_url, /^https:\/\//);
    // Phase-2 provenance contract: every record fully stamped
    for (const k of ['source_url', 'confidence', 'verification_status', 'last_updated', 'date_collected', 'last_refreshed']) {
      assert.ok(rec[k], `record carries ${k}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('connector rejects a drop file missing its required columns', () => {
  const dir = mkdtempSync(join(tmpdir(), 'exitos-conn-'));
  try {
    mkdirSync(join(dir, 'imports'), { recursive: true });
    writeFileSync(join(dir, 'imports', 'pitchbook_deals.json'), JSON.stringify([{ foo: 'bar' }]));
    const spec = CONNECTORS.find((c) => c.name === 'pitchbook');
    const r = loadConnector(spec, dir);
    assert.equal(r.status, 'rejected');
    assert.equal(r.records.length, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── Phase 5 · similar transaction engine ────────────────────────────

test('runSimilarTransactions returns sourced comparables, likely buyers and derived confidence', () => {
  const report = runSimilarTransactions(SAMPLE_SAAS);
  assert.equal(report.sector, SAMPLE_SAAS.sector);
  assert.ok(report.similarExits.length > 0, 'vertical_saas comparables exist in the curated history');
  for (const x of report.similarExits) {
    assert.ok(x.target && x.buyer);
    assert.ok(x.sourceRef.length > 0, 'every comparable cites its source');
    assert.notEqual(x.status, 'lost_bid', 'lost bids are not exits');
    assert.match(x.rationale, /Same sector/);
  }
  assert.ok(report.likelyBuyers.length > 0);
  assert.ok(report.likelyBuyers.every((b) => b.probabilityPct >= 0 && b.probabilityPct <= 100));
  assert.ok(report.confidence.sample === report.similarExits.length);
  assert.ok(report.summary.length > 0);
});

// ── Phase 7 · sovereign exchange state machine ──────────────────────

const FOUNDER = { id: 'f1', name: 'Apex Robotics, Inc.', representativeName: 'Ana Kovac', representativeEmail: 'ana@apex.example' };
const BUYER   = { id: 'b1', name: 'Helios Acquisition Group', representativeName: 'Jordan Park', representativeEmail: 'jp@helios.example' };

function executedNda(listingId) {
  let nda = issueNda({ templateId: 'tpl-bilateral-standard-v3', listingId, disclosing: FOUNDER, receiving: BUYER });
  nda = recordSignature(nda, 'disclosing', 'Ana Kovac');
  nda = recordSignature(nda, 'receiving', 'Jordan Park');
  return nda;
}

test('MANDATE_STATES is the 10-state lifecycle in order', () => {
  assert.deepEqual([...MANDATE_STATES], [
    'anonymous_mandate', 'buyer_pool', 'qualified_buyers', 'interest_signals',
    'nda_state', 'cim_state', 'loi_state', 'bid_room', 'diligence_room', 'close_room',
  ]);
});

test('no listing ⇒ mandate has not entered the exchange', () => {
  const r = deriveMandateState({});
  assert.equal(r.current, 'anonymous_mandate');
  assert.equal(r.index, 0);
  assert.match(r.blockedBy, /no listing/);
});

test('guards are cumulative — an executed NDA without matches cannot skip ahead', () => {
  const listing = createListing(SAMPLE_SAAS);
  const r = deriveMandateState({ listing, ndas: [executedNda(listing.listingId)] });
  // buyer_pool was never reached, so nda_state is unreachable despite the NDA
  assert.equal(r.current, 'anonymous_mandate');
  assert.ok(r.trail.find((t) => t.state === 'nda_state' && t.reached === false));
});

test('the full trail: listing → matches → NDA → bids → diligence → close', () => {
  const listing = createListing(SAMPLE_SAAS);
  const matches = { matches: [{ matchScore: 0.82 }, { matchScore: 0.41 }] };
  const ndas = [executedNda(listing.listingId)];
  const offers = [
    { stage: 'loi', headlinePriceUsd: 24_000_000 },
    { stage: 'received', headlinePriceUsd: 21_500_000 },
  ];

  let r = deriveMandateState({ listing, matches });
  assert.equal(r.current, 'qualified_buyers');
  assert.match(r.blockedBy, /NDA/);

  r = deriveMandateState({ listing, matches, ndas });
  assert.equal(r.current, 'cim_state', 'an executed NDA unlocks both nda_state and cim_state');

  r = deriveMandateState({ listing, matches, ndas, offers: [offers[0]] });
  assert.equal(r.current, 'loi_state');
  assert.match(r.blockedBy, /second bid/);

  r = deriveMandateState({ listing, matches, ndas, offers });
  assert.equal(r.current, 'bid_room');

  r = deriveMandateState({ listing, matches, ndas, offers, diligenceOpen: true });
  assert.equal(r.current, 'diligence_room');

  r = deriveMandateState({ listing, matches, ndas, offers, diligenceOpen: true, closingStarted: true });
  assert.equal(r.current, 'close_room');
  assert.equal(r.index, MANDATE_STATES.length - 1);
  assert.equal(r.blockedBy, undefined, 'nothing blocks a closed mandate');
  assert.equal(r.trail.length, MANDATE_STATES.length);
  assert.ok(r.trail.every((t) => t.reached));
});
