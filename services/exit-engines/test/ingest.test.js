import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAcquisitionTables } from '../dist/scripts/ingest/wikipedia.js';
import { parseMoneyUsd, parseDateIso } from '../dist/scripts/ingest/util.js';
import { meta } from '../dist/scripts/ingest/types.js';
import { validateRegistries } from '../dist/scripts/ingest/validate.js';
import { join } from 'node:path';

// PARSER FIXTURE — structural excerpt in the exact wikitable format the
// "List of acquisitions by X" pages render. The two rows are REAL deals
// (Microsoft–GitHub 2018; the value/date are the publicly reported ones).
// This fixture exists only to unit-test the parser; it is never written
// to any registry file.
const FIXTURE = `
<table class="wikitable sortable">
<tbody>
<tr><th>Date</th><th>Company</th><th>Business</th><th>Country</th><th>Value (USD)</th><th>References</th></tr>
<tr><td>June 4, 2018</td><td><a href="/wiki/GitHub">GitHub</a></td><td>Software development platform</td><td>United States</td><td>$7,500,000,000</td><td>[1]</td></tr>
<tr><td>March 25, 2021</td><td><a href="/wiki/Nuance_Communications">Nuance Communications</a></td><td>Speech recognition, artificial intelligence</td><td>United States</td><td>$19,700,000,000</td><td>[2]</td></tr>
</tbody>
</table>`;

test('wikipedia parser: real-format table → fully-provenanced records', () => {
  const recs = parseAcquisitionTables(FIXTURE, 'List_of_mergers_and_acquisitions_by_Microsoft');
  assert.equal(recs.length, 2);
  const [github, nuance] = recs;

  assert.equal(github.buyer_name, 'Microsoft');
  assert.equal(github.target_name, 'GitHub');
  assert.equal(github.announced_date, '2018-06-04');
  assert.equal(github.value_usd, 7_500_000_000);
  assert.equal(github.industry, 'Software development platform');

  assert.equal(nuance.target_name, 'Nuance Communications');
  assert.equal(nuance.value_usd, 19_700_000_000);

  // the five mandatory provenance fields on every record
  for (const r of recs) {
    assert.equal(r.source, 'wikipedia');
    assert.match(r.source_url, /^https:\/\/en\.wikipedia\.org\/wiki\//);
    assert.equal(r.confidence, 'reported');
    assert.equal(r.verification_status, 'unverified');
    assert.ok(!Number.isNaN(Date.parse(r.last_updated)));
  }
});

test('value/date parsers handle the formats the lists actually use', () => {
  assert.equal(parseMoneyUsd('US$26.2 billion'), 26_200_000_000);
  assert.equal(parseMoneyUsd('$94.5 million'), 94_500_000);
  assert.equal(parseMoneyUsd('$1,200,000,000'), 1_200_000_000);
  assert.equal(parseMoneyUsd('€4.85 billion'), undefined, 'non-USD must not be guessed via FX');
  assert.equal(parseMoneyUsd('Undisclosed'), undefined);

  assert.equal(parseDateIso('September 21, 1993'), '1993-09-21');
  assert.equal(parseDateIso('4 June 2018'), '2018-06-04');
  assert.equal(parseDateIso('2024-09-13'), '2024-09-13');
  assert.equal(parseDateIso('March 2021'), '2021-03-01');
});

test('provenance is structurally enforced — no record without a real source_url', () => {
  assert.throws(() => meta('wikipedia', 'not-a-url', 'reported', 'unverified'), /refusing to create record/);
  assert.throws(() => meta('wikipedia', '', 'reported', 'unverified'), /refusing to create record/);
  const ok = meta('sec_edgar', 'https://www.sec.gov/Archives/edgar/data/789019/000119312518196641', 'verified', 'verified');
  assert.equal(ok.source, 'sec_edgar');
});

test('registry validation: datasets, when generated, satisfy the contract', () => {
  const r = validateRegistries(join(process.cwd(), 'data'));
  if (!r.present) {
    // Not generated yet — the ingest run requires network egress to the
    // source hosts. This is the documented, honest state: empty > fabricated.
    console.log('  (registries not generated yet — run `npm run ingest` with egress enabled)');
    return;
  }
  assert.equal(r.errors.length, 0, r.errors.join('\n'));
  assert.ok(r.counts['acquisition_events.json'] > 0);
  console.log('  counts:', JSON.stringify(r.counts));
});
