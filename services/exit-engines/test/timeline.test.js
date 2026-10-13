import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PROCESS_TIMELINE, milestone, weeksPhrase, weeksLabel, validateTimeline } from '../dist/process/index.js';
import { TemplateMemorandumGenerator } from '../dist/memorandum/index.js';
import { runValuation } from '../dist/valuation/index.js';
import { runReadiness } from '../dist/readiness/index.js';
import { runBuyerDiscovery } from '../dist/buyers/index.js';
import { runDueDiligence } from '../dist/diligence/index.js';
import { SAMPLE_SAAS } from './sample.js';

const inputs = () => ({
  company: SAMPLE_SAAS, valuation: runValuation(SAMPLE_SAAS, { reportType: 'strategic' }),
  readiness: runReadiness(SAMPLE_SAAS), buyers: runBuyerDiscovery(SAMPLE_SAAS), diligence: runDueDiligence(SAMPLE_SAAS),
});
const text = (doc) => doc.sections.map((s) => `${s.heading}\n${s.body}\n${(s.bullets ?? []).join('\n')}`).join('\n');

test('the default timeline is well formed', () => {
  assert.deepEqual(validateTimeline(DEFAULT_PROCESS_TIMELINE), []);
  assert.equal(weeksLabel(milestone(DEFAULT_PROCESS_TIMELINE, 'ioi')), 'Week 4');
  assert.equal(weeksPhrase(milestone(DEFAULT_PROCESS_TIMELINE, 'loi')), 'weeks 5–6');
});

test('every memorandum quotes the same milestones, from the timeline', async () => {
  const gen = new TemplateMemorandumGenerator();
  const loi = weeksPhrase(milestone(DEFAULT_PROCESS_TIMELINE, 'loi'));
  const ioi = weeksPhrase(milestone(DEFAULT_PROCESS_TIMELINE, 'ioi'));
  const cim = text(await gen.generate('cim', inputs()));
  const es = text(await gen.generate('executive_summary', inputs()));
  const deck = text(await gen.generate('investor_deck', inputs()));
  const teaser = text(await gen.generate('buyer_teaser', { ...inputs(), anonymize: true }));
  assert.ok(cim.toLowerCase().includes(loi), 'CIM');
  for (const [name, t] of [['summary', es], ['deck', deck]]) { assert.ok(t.includes(loi), name); assert.ok(t.includes(ioi), name); }
  assert.ok(teaser.includes(ioi), 'teaser');
  // none of the old, contradictory schedules survive
  for (const t of [cim, es, deck, teaser]) {
    assert.ok(!/ten business days|four to six weeks|LOI in 4–6 weeks|Weeks 7–10/.test(t));
  }
});

test('a transaction timeline replaces the default in every document', async () => {
  const custom = { ...DEFAULT_PROCESS_TIMELINE, basis: 'the transaction plan agreed with the adviser',
    milestones: DEFAULT_PROCESS_TIMELINE.milestones.map((m) => (m.id === 'loi' ? { ...m, startWeek: 7, endWeek: 8 } : m)) };
  const es = text(await new TemplateMemorandumGenerator().generate('executive_summary', { ...inputs(), timeline: custom }));
  assert.ok(es.includes('weeks 7–8'));
});

test('word counts are measured from the text, not estimated', async () => {
  const gen = new TemplateMemorandumGenerator();
  for (const kind of ['cim', 'executive_summary', 'investor_deck', 'buyer_teaser', 'dd_room_index']) {
    const doc = await gen.generate(kind, { ...inputs(), anonymize: kind === 'buyer_teaser' });
    const manual = doc.sections.reduce((n, s) => n + [s.heading, s.body, ...(s.bullets ?? [])].join(' ').split(/\s+/).filter(Boolean).length, 0);
    assert.equal(doc.wordCount, manual, kind);
  }
});

test('named memoranda disclose customer concentration; the teaser does not quote it', async () => {
  const company = { ...SAMPLE_SAAS, revenue: { ...SAMPLE_SAAS.revenue, customerConcentrationTop10Pct: 0.41 } };
  const gen = new TemplateMemorandumGenerator();
  const base = { company, valuation: runValuation(company), readiness: runReadiness(company), buyers: runBuyerDiscovery(company), diligence: runDueDiligence(company) };
  for (const kind of ['cim', 'executive_summary']) {
    const d = await gen.generate(kind, base);
    assert.match(d.sections.map((s) => s.body).join(' '), /ten largest customers account for 41% of revenue — a concentration buyers will test/);
  }
  const t = await gen.generate('buyer_teaser', base);
  assert.doesNotMatch(t.sections.map((s) => s.body).join(' '), /largest customers/);
});
