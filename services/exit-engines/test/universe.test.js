// Buyer universe + taxonomy + check-size bands. Fixtures mirror the
// exact Wikipedia table formats; the rows are real S&P constituents /
// Fortune-ranking entries. No synthetic buyers reach any registry —
// these parsers are pure and tested offline.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSp500Table, parseLargestUsTable, familyOfficesFromMembers, buyersFromCategoryMembers, parsePeListTable, PE_CATEGORY } from '../dist/scripts/ingest/universe.js';
import { sparqlBindingsToEvents } from '../dist/scripts/ingest/wikidata.js';
import { filingsToEvents } from '../dist/scripts/ingest/sec.js';
import { mapToExitOs, EXITOS_SECTORS, EXITOS_TAXONOMY } from '../dist/scripts/ingest/taxonomy.js';
import { checkSizeBand } from '../dist/scripts/dna/build.js';

// ── taxonomy ────────────────────────────────────────────────────────

test('ExitOS taxonomy covers the declared groups', () => {
  assert.ok(EXITOS_SECTORS.includes('Software'));
  assert.ok(EXITOS_SECTORS.includes('Payments'));
  assert.ok(EXITOS_SECTORS.includes('Supply Chain'));
  assert.ok(EXITOS_SECTORS.includes('GovTech'));
  assert.equal(Object.values(EXITOS_TAXONOMY).flat().length, EXITOS_SECTORS.length);
});

test('official GICS labels map to ExitOS sectors; both are kept, not replaced', () => {
  assert.deepEqual(mapToExitOs('Information Technology · Application Software'), ['Software']);
  assert.ok(mapToExitOs('Information Technology · Systems Software').includes('Software'));
  assert.ok(mapToExitOs('Health Care · Health Care Technology').includes('Health IT'));
  assert.equal(mapToExitOs('Health Care · Health Care Technology')[0], 'Health IT', 'the specific sector ranks first');
  assert.ok(mapToExitOs('Financials · Transaction & Payment Processing Services').includes('Payments'));
  assert.ok(mapToExitOs('Industrials · Air Freight & Logistics').includes('Logistics'));
  assert.ok(mapToExitOs('Cybersecurity software').includes('Cybersecurity'));
  assert.deepEqual(mapToExitOs('Totally Unclassifiable Widgets'), [], 'no match means no sector, never a guess');
  assert.deepEqual(mapToExitOs(undefined), []);
});

// ── S&P 500 constituents (GICS taxonomy source) ────────────────────

const SP500_FIXTURE = `
<table class="wikitable sortable">
<tbody>
<tr><th>Symbol</th><th>Security</th><th>GICS Sector</th><th>GICS Sub-Industry</th><th>Headquarters Location</th><th>Date added</th></tr>
<tr><td>MSFT</td><td>Microsoft</td><td>Information Technology</td><td>Systems Software</td><td>Redmond, Washington</td><td>1994-06-01</td></tr>
<tr><td>GOOGL</td><td>Alphabet Inc. (Class A)</td><td>Communication Services</td><td>Interactive Media &amp; Services</td><td>Mountain View, California</td><td>2014-04-03</td></tr>
<tr><td>UNH</td><td>UnitedHealth Group</td><td>Health Care</td><td>Managed Health Care</td><td>Minnetonka, Minnesota</td><td>1994-07-01</td></tr>
</tbody>
</table>`;

test('S&P 500 parser: constituents become corporate buyers with dual taxonomy', () => {
  const buyers = parseSp500Table(SP500_FIXTURE);
  assert.equal(buyers.length, 3);
  const [msft, goog, unh] = buyers;
  assert.equal(msft.name, 'Microsoft');
  assert.equal(msft.buyer_type, 'corporate');
  assert.equal(msft.industry_official, 'Information Technology · Systems Software');
  assert.ok(msft.sector_exitos.includes('Software'));
  assert.equal(goog.name, 'Alphabet Inc.', 'share-class noise stripped');
  assert.ok(unh.sector_exitos.includes('Healthcare'));
  for (const b of buyers) {
    assert.equal(b.source, 'wikipedia_universe');
    assert.match(b.source_url, /^https:\/\/en\.wikipedia\.org\/wiki\//);
    assert.ok(b.confidence && b.verification_status && b.last_updated);
  }
});

// ── largest US companies (Fortune ranking mirror) ───────────────────

const LARGEST_FIXTURE = `
<table class="wikitable sortable">
<tbody>
<tr><th>Rank</th><th>Name</th><th>Industry</th><th>Revenue (USD millions)</th><th>Employees</th></tr>
<tr><td>1</td><td>Walmart</td><td>Retail</td><td>648,125</td><td>2,100,000</td></tr>
<tr><td>2</td><td>Amazon</td><td>Retail and cloud computing</td><td>574,785</td><td>1,525,000</td></tr>
</tbody>
</table>`;

test('largest-US parser: revenue ranking becomes corporate buyers with industry', () => {
  const buyers = parseLargestUsTable(LARGEST_FIXTURE);
  assert.equal(buyers.length, 2);
  assert.equal(buyers[0].name, 'Walmart');
  assert.ok(buyers[0].sector_exitos.includes('Consumer'));
  assert.ok(buyers[1].sector_exitos.includes('Cloud Infrastructure'));
});

// ── family offices ──────────────────────────────────────────────────

test('family-office category members: articles only, meta pages excluded', () => {
  const buyers = familyOfficesFromMembers([
    { ns: 0, title: 'Family office' },                 // the concept page — excluded
    { ns: 0, title: 'Cascade Investment' },
    { ns: 0, title: 'Bezos Expeditions' },
    { ns: 14, title: 'Category:Family offices by country' }, // sub-category — excluded
  ]);
  assert.equal(buyers.length, 2);
  assert.ok(buyers.every((b) => b.buyer_type === 'family_office'));
  assert.ok(buyers.every((b) => /^https:\/\/en\.wikipedia\.org\/wiki\//.test(b.source_url)));
});

// ── private equity from category tree + ranked list ─────────────────

test('PE category members become private_equity buyers; meta pages excluded', () => {
  const buyers = buyersFromCategoryMembers([
    { ns: 0, title: 'Private equity firm' },              // concept — excluded
    { ns: 0, title: 'Thoma Bravo' },
    { ns: 0, title: 'Vista Equity Partners' },
    { ns: 0, title: 'Carlyle Group (company)' },          // parenthetical stripped
    { ns: 0, title: 'List of private equity firms' },     // list — excluded
    { ns: 14, title: 'Category:Private equity firms of the United States' },
  ], 'private_equity', PE_CATEGORY);
  assert.equal(buyers.length, 3);
  assert.ok(buyers.every((b) => b.buyer_type === 'private_equity'));
  assert.ok(buyers.some((b) => b.name === 'Carlyle Group'));
});

const PE_LIST_FIXTURE = `
<table class="wikitable sortable">
<tbody>
<tr><th>Rank</th><th>Firm</th><th>Headquarters</th><th>Capital raised ($bn)</th></tr>
<tr><td>1</td><td>Blackstone Inc.</td><td>New York City, United States</td><td>125.6</td></tr>
<tr><td>2</td><td>KKR</td><td>New York City, United States</td><td>103.7</td></tr>
</tbody>
</table>`;

test('ranked PE list parser: firms with headquarters country', () => {
  const buyers = parsePeListTable(PE_LIST_FIXTURE);
  assert.equal(buyers.length, 2);
  assert.equal(buyers[0].name, 'Blackstone Inc.');
  assert.equal(buyers[0].buyer_type, 'private_equity');
  assert.equal(buyers[0].country, 'United States');
});

// ── batched Wikidata mapper ─────────────────────────────────────────

test('sparql bindings map to events; unlabeled entities and bad dates dropped', () => {
  const nameByQid = new Map([['Q2283', 'Microsoft']]);
  const events = sparqlBindingsToEvents([
    { buyer: { value: 'http://www.wikidata.org/entity/Q2283' }, target: { value: 'http://www.wikidata.org/entity/Q10134' }, targetLabel: { value: 'GitHub' }, start: { value: '2018-10-26T00:00:00Z' } },
    { buyer: { value: 'http://www.wikidata.org/entity/Q2283' }, target: { value: 'http://www.wikidata.org/entity/Q99999' }, targetLabel: { value: 'Q99999' } },          // unlabeled — dropped
    { buyer: { value: 'http://www.wikidata.org/entity/Q404' },  target: { value: 'http://www.wikidata.org/entity/Q1' }, targetLabel: { value: 'Mystery Co' } },           // unknown buyer — dropped
    { buyer: { value: 'http://www.wikidata.org/entity/Q2283' }, target: { value: 'http://www.wikidata.org/entity/Q777' }, targetLabel: { value: 'Undated Co' }, start: { value: 'http://www' } }, // somevalue date — kept, undated
  ], nameByQid);
  assert.equal(events.length, 2);
  assert.equal(events[0].target_name, 'GitHub');
  assert.equal(events[0].announced_date, '2018-10-26');
  assert.equal(events[1].target_name, 'Undated Co');
  assert.equal(events[1].announced_date, undefined, 'a somevalue date is omitted, never mangled');
  assert.ok(events.every((e) => /^http:\/\/www\.wikidata\.org\/entity\//.test(e.source_url)));
});

// ── SEC events carry status (SOURCE 6 contract) ─────────────────────

test('8-K item 2.01 events are status closed — the filing IS the completion', () => {
  const [ev] = filingsToEvents('Microsoft', [{ accession: '0001564590-18-026876', filed: '2018-10-26', form: '8-K', items: '2.01,9.01', url: 'https://www.sec.gov/x' }]);
  assert.equal(ev.status, 'closed');
  assert.equal(ev.confidence, 'verified');
  assert.equal(ev.verification_status, 'verified');
});

// ── check-size bands ────────────────────────────────────────────────

test('checkSizeBand: p10–p90 of disclosed values, rounded to a quotable band', () => {
  // a Microsoft-shaped distribution: many sub-$1B deals, a few mega-deals
  const values = [
    50e6, 80e6, 120e6, 150e6, 200e6, 300e6, 450e6, 700e6,
    1.2e9, 2.5e9, 7.5e9, 19.7e9, 26.2e9, 68.7e9,
  ];
  const band = checkSizeBand(values);
  assert.ok(band);
  assert.ok(band.low_usd >= 50e6 && band.low_usd <= 120e6, `low is a nice number near p10, got ${band.low_usd}`);
  assert.ok(band.high_usd >= 26.2e9, `high covers p90, got ${band.high_usd}`);
  // 1-2-5 ladder: quotable numbers only
  for (const v of [band.low_usd, band.high_usd]) {
    const mantissa = v / 10 ** Math.floor(Math.log10(v));
    assert.ok([1, 2, 5].includes(mantissa), `${v} is on the 1-2-5 ladder`);
  }
});

test('checkSizeBand: refuses to band fewer than three data points', () => {
  assert.equal(checkSizeBand([]), undefined);
  assert.equal(checkSizeBand([1e9]), undefined);
  assert.equal(checkSizeBand([1e9, 2e9]), undefined);
});
