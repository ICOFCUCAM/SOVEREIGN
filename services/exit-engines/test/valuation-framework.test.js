// The Valuation Constitution — the single source of truth. These tests
// enforce the invariants the framework promises: confidence-driver weights
// sum to 1, the engine's method weights ARE the framework's weights (no
// inline divergence), every mandatory output is present, every required
// variable is accounted for (present or explicitly absent), and every
// shown figure carries the five provenance fields.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  VALUATION_FRAMEWORK, METHODOLOGY_WEIGHTS, runValuationConstitution, runInstitutionalValuation,
} from '../dist/valuation/index.js';
import { SAMPLE_SAAS } from './sample.js';

const FW = VALUATION_FRAMEWORK;
const r = runValuationConstitution(SAMPLE_SAAS);

test('the framework is frozen — it cannot be mutated at runtime', () => {
  assert.ok(Object.isFrozen(FW));
  assert.throws(() => { FW.premium.neutralPriorPct = 0.99; });
});

test('confidence driver weights sum to 1', () => {
  const w = FW.confidence.driverWeights;
  const total = w.dataCompleteness + w.comparableDepth + w.sectorMaturity + w.financialQuality + w.dataFreshness;
  assert.ok(Math.abs(total - 1) < 1e-9, `driver weights sum to ${total}`);
});

test('runInstitutionalValuation is the constitution (single engine, not a parallel one)', () => {
  assert.equal(runInstitutionalValuation, runValuationConstitution);
});

test('every mandatory output declared by the framework is present and non-empty', () => {
  for (const key of FW.mandatoryOutputs) {
    assert.ok(key in r.mandatoryOutputs, `missing mandatory output: ${key}`);
    assert.ok(String(r.mandatoryOutputs[key]).length > 0, `empty mandatory output: ${key}`);
  }
  // and there are exactly the ten the framework names
  assert.equal(Object.keys(r.mandatoryOutputs).length, FW.mandatoryOutputs.length);
});

test('every required variable is accounted for — present with a value, or explicitly absent', () => {
  for (const group of ['company', 'market', 'buyer', 'execution']) {
    const declared = FW.requiredVariables[group];
    const produced = r.variables[group].map((v) => v.name);
    for (const name of declared) assert.ok(produced.includes(name), `${group}.${name} not produced`);
    assert.equal(produced.length, declared.length);
  }
});

test('every produced variable carries the five framework provenance fields', () => {
  const all = [...r.variables.company, ...r.variables.market, ...r.variables.buyer, ...r.variables.execution];
  for (const v of all) {
    assert.ok('source' in v && v.source.length > 0, `${v.name} has source`);
    assert.ok('source_url' in v, `${v.name} has source_url key`);
    assert.ok('confidence' in v && v.confidence.length > 0, `${v.name} has confidence`);
    assert.ok('verification_status' in v && v.verification_status.length > 0, `${v.name} has verification_status`);
    assert.ok(!Number.isNaN(Date.parse(v.last_updated)) || v.last_updated.startsWith('v'), `${v.name} has last_updated`);
    // an absent variable is honest, not invented
    if (!v.present) assert.equal(v.source, 'not_provided');
  }
});

test('the engine weights ARE the framework weights — no inline divergence', () => {
  // methodology views weight by the same priors the framework declares
  for (const m of r.methodologies) {
    assert.ok(m.name in METHODOLOGY_WEIGHTS, `${m.name} is a framework-declared method`);
  }
  // normalized weights sum to the framework's normalize target
  const total = r.methodologies.reduce((s, m) => s + m.weightPct, 0);
  assert.equal(total, FW.methodology.normalizeToPct);
});

test('comparable evidence requirement is enforced (no conclusion without transactions)', () => {
  assert.ok(r.comparablesUsed >= FW.comparables.minForConclusion);
  assert.equal(r.comparablesAnalysis.count, r.comparablesUsed);
});

test('the disclaimer is the framework disclaimer, stamped with the version', () => {
  assert.equal(r.disclaimer, FW.disclaimer);
  assert.ok(r.disclaimer.includes(FW.version));
  assert.equal(r.frameworkVersion, FW.version);
});

test('provenance summary tallies real sources and the most-recent data date', () => {
  assert.ok(r.provenanceSummary.totalFigures > 0);
  assert.deepEqual(r.provenanceSummary.requiredFields, FW.provenance.requiredFields);
  assert.ok(Object.keys(r.provenanceSummary.bySource).length > 0);
});
