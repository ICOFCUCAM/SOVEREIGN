// Knowledge Graph query + region mapping. The query is a pure filter over
// the source-tagged event index — it only ever returns real indexed events,
// and the canonical example ("freight-tech in Europe, $10M–$500M, last 5y")
// resolves to the buyers that actually did those deals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAcquisitions, regionOf, ALL_REGIONS } from '../dist/market/index.js';

test('regionOf maps registry country text to coarse regions; unknown → Other', () => {
  assert.equal(regionOf('United States'), 'North America');
  assert.equal(regionOf('United Kingdom'), 'Europe');
  assert.equal(regionOf('Germany'), 'Europe');
  assert.equal(regionOf('Japan'), 'Asia');
  assert.equal(regionOf('Israel'), 'Middle East');
  assert.equal(regionOf('Redmond, United States'), 'North America'); // "City, Country" tail match
  assert.equal(regionOf('Atlantis'), 'Other');
  assert.equal(regionOf(undefined), 'Other');
  assert.equal(ALL_REGIONS.length, 8);
});

const INDEX = {
  as_of: '2026-06-17T00:00:00Z',
  count: 5,
  events: [
    { bid: 'maersk', b: 'Maersk', t: 'EuroFreight AI', d: '2023-04-01', v: 120_000_000, i: 'freight technology', c: 'Germany', r: 'Europe', s: 'wikipedia' },
    { bid: 'dsv',    b: 'DSV',    t: 'NordicHaul',     d: '2022-09-01', v: 300_000_000, i: 'freight logistics', c: 'Sweden',  r: 'Europe', s: 'wikidata' },
    { bid: 'dpworld',b: 'DP World', t: 'AsiaCargo',    d: '2024-01-01', v: 80_000_000,  i: 'freight technology', c: 'Singapore', r: 'Asia', s: 'wikipedia' },
    { bid: 'maersk', b: 'Maersk', t: 'OldBarge',       d: '2015-01-01', v: 50_000_000,  i: 'freight shipping', c: 'France',  r: 'Europe', s: 'wikipedia' },
    { bid: 'msft',   b: 'Microsoft', t: 'GitHub',      d: '2018-06-01', v: 7_500_000_000, i: 'software', c: 'United States', r: 'North America', s: 'sec_edgar' },
  ],
};

test('"freight-tech in Europe, $10M–$500M, last 5 years" returns only the real matching buyers', () => {
  const r = queryAcquisitions(INDEX, { sector: 'freight', region: 'Europe', minUsd: 10_000_000, maxUsd: 500_000_000, sinceYear: 2020 });
  // EuroFreight AI (Maersk, 2023, $120M) and NordicHaul (DSV, 2022, $300M) match.
  // OldBarge (2015) excluded by date; AsiaCargo excluded by region; GitHub by sector & price.
  assert.equal(r.totalMatched, 2);
  const names = r.events.map((e) => e.t).sort();
  assert.deepEqual(names, ['EuroFreight AI', 'NordicHaul']);
  const buyers = r.buyers.map((b) => b.buyer_id).sort();
  assert.deepEqual(buyers, ['dsv', 'maersk']);
  assert.match(r.note, /source-tagged registry event/);
});

test('the query never invents — an impossible filter returns zero, not a guess', () => {
  const r = queryAcquisitions(INDEX, { sector: 'biotech', region: 'Africa' });
  assert.equal(r.totalMatched, 0);
  assert.equal(r.events.length, 0);
  assert.equal(r.buyers.length, 0);
});

test('buyer rollup ranks distinct buyers by matching deal count', () => {
  const r = queryAcquisitions(INDEX, { sector: 'freight' });
  // Maersk has 2 freight deals, DSV 1, DP World 1
  assert.equal(r.buyers[0].buyer_id, 'maersk');
  assert.equal(r.buyers[0].deals, 2);
});
