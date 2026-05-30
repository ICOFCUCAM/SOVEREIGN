import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  newsApiConnector, edgarConnector, fredConnector, apifyConnector,
  rateLimitedFetch, _resetRateLimitState,
} from '../dist/index.js';

const baseCtx = (fetchImpl, extras = {}) => ({
  sourceId: 'src-1',
  tenantId: 'tenant-1',
  limit: 10,
  now: () => new Date('2026-05-30T12:00:00Z'),
  fetch: fetchImpl,
  logger: { debug() {}, info() {}, warn() {}, error() {} },
  ...extras,
});

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

// ───── newsapi ─────────────────────────────────────────────────────────

test('newsApiConnector requires query', async () => {
  await assert.rejects(() => newsApiConnector.pull(baseCtx(async () => jsonResponse({})), {}), /query/);
});

test('newsApiConnector reads key from env (default NEWSAPI_KEY)', async () => {
  process.env.NEWSAPI_KEY = 'test-key';
  const fetchImpl = async (url, init) => {
    assert.equal(init.headers['x-api-key'], 'test-key');
    assert.ok(url.includes('q=crisis'));
    return jsonResponse({ articles: [{ url: 'https://x/y', title: 'X', publishedAt: '2026-05-30T10:00:00Z', description: 'd', source: { name: 'Wire', id: 'wire' } }] });
  };
  const r = await newsApiConnector.pull(baseCtx(fetchImpl), { query: 'crisis' });
  delete process.env.NEWSAPI_KEY;
  assert.equal(r.signals.length, 1);
  assert.equal(r.signals[0].signalClass, 'news_article');
  assert.equal(r.metadata.provider, 'newsapi');
});

test('newsApiConnector reads key from source.auth_ref override', async () => {
  process.env.MY_NEWS_KEY = 'override-key';
  const fetchImpl = async (_url, init) => {
    assert.equal(init.headers['x-api-key'], 'override-key');
    return jsonResponse({ articles: [] });
  };
  await newsApiConnector.pull(baseCtx(fetchImpl, { authRef: 'MY_NEWS_KEY' }), { query: 'x' });
  delete process.env.MY_NEWS_KEY;
});

test('newsApiConnector reports cost in metadata', async () => {
  process.env.NEWSAPI_KEY = 'k';
  const fetchImpl = async () => jsonResponse({ articles: [] });
  const r = await newsApiConnector.pull(baseCtx(fetchImpl), { query: 'q', costPerRequestUsd: 0.001 });
  delete process.env.NEWSAPI_KEY;
  assert.equal(r.metadata.costEstimateUsd, 0.001);
});

// ───── edgar ───────────────────────────────────────────────────────────

test('edgarConnector pads CIK and emits regulatory_filing signals', async () => {
  let receivedUrl;
  const fetchImpl = async (url, init) => {
    receivedUrl = url;
    assert.ok(init.headers['user-agent'].includes('Sovereign'));
    return jsonResponse({
      name: 'Example Corp',
      cik: '0000320193',
      filings: { recent: {
        accessionNumber: ['0000320193-26-000001','0000320193-26-000002'],
        form:            ['10-K','8-K'],
        filingDate:      ['2026-01-15','2026-02-20'],
        primaryDocument: ['aapl-10k.htm','aapl-8k.htm'],
        primaryDocDescription: ['Annual report','Material event'],
        items: ['', '2.02'],
      }},
    });
  };
  const r = await edgarConnector.pull(baseCtx(fetchImpl), { cik: 320193, contactEmail: 'ops@example' });
  assert.ok(receivedUrl.includes('CIK0000320193.json'));
  assert.equal(r.signals.length, 2);
  assert.equal(r.signals[0].signalClass, 'regulatory_filing');
  assert.ok(r.signals[0].title.includes('Example Corp'));
  assert.deepEqual(r.signals[0].geoFocus, { countries: ['US'] });
});

test('edgarConnector filters by formTypes', async () => {
  const fetchImpl = async () => jsonResponse({
    name: 'X',
    filings: { recent: {
      accessionNumber: ['a','b','c'], form: ['10-K','8-K','10-Q'],
      filingDate: ['2026-01-01','2026-02-01','2026-03-01'],
    }},
  });
  const r = await edgarConnector.pull(baseCtx(fetchImpl), { cik: 1, formTypes: ['10-K','10-Q'] });
  assert.equal(r.signals.length, 2);
  assert.ok(r.signals.every((s) => /10-[KQ]/.test(s.title)));
});

// ───── fred ────────────────────────────────────────────────────────────

test('fredConnector emits one signal per observation', async () => {
  process.env.FRED_API_KEY = 'fred-k';
  const fetchImpl = async (url) => {
    assert.ok(url.includes('series_id=UNRATE'));
    assert.ok(url.includes('api_key=fred-k'));
    return jsonResponse({ observations: [
      { date: '2026-04-01', value: '3.8' },
      { date: '2026-03-01', value: '3.7' },
      { date: '2026-02-01', value: '.' },     // FRED 'no data' marker
    ]});
  };
  const r = await fredConnector.pull(baseCtx(fetchImpl), { seriesId: 'UNRATE' });
  delete process.env.FRED_API_KEY;
  assert.equal(r.signals.length, 2);
  assert.equal(r.signals[0].signalClass, 'financial_disclosure');
  assert.ok(r.signals[0].title.includes('UNRATE = 3.8'));
});

test('fredConnector surfaces FRED error_message', async () => {
  process.env.FRED_API_KEY = 'k';
  const fetchImpl = async () => jsonResponse({ error_message: 'Bad Request. The value for variable series_id is not registered.' });
  await assert.rejects(
    () => fredConnector.pull(baseCtx(fetchImpl), { seriesId: 'NOPE' }),
    /not registered/,
  );
  delete process.env.FRED_API_KEY;
});

// ───── apify ───────────────────────────────────────────────────────────

test('apifyConnector POSTs to actor and maps dataset items', async () => {
  process.env.APIFY_TOKEN = 'apify-k';
  let postedUrl;
  const fetchImpl = async (url, init) => {
    postedUrl = url;
    assert.equal(init.method, 'POST');
    assert.equal(JSON.parse(init.body).target, 'linkedin.com/in/foo');
    return jsonResponse([
      { profileUrl: 'https://linkedin.com/in/foo', name: 'Foo Bar', headline: 'Minister' },
      { profileUrl: 'https://linkedin.com/in/bar', name: 'Bar Baz', headline: 'CEO' },
    ]);
  };
  const r = await apifyConnector.pull(baseCtx(fetchImpl), {
    actorId: 'apify~linkedin-scraper',
    input: { target: 'linkedin.com/in/foo' },
    signalClass: 'social_post',
    mapping: { url: 'profileUrl', title: 'name', bodyExcerpt: 'headline' },
    costPerRunUsd: 0.025,
  });
  delete process.env.APIFY_TOKEN;
  assert.ok(postedUrl.includes('apify~linkedin-scraper'));
  assert.equal(r.signals.length, 2);
  assert.equal(r.signals[0].title, 'Foo Bar');
  assert.equal(r.signals[0].bodyExcerpt, 'Minister');
  assert.equal(r.metadata.costEstimateUsd, 0.025);
});

// ───── rate-limit middleware ────────────────────────────────────────────

test('rate-limit allows burst then refills', async () => {
  _resetRateLimitState();
  let now = 1_000_000;
  let calls = 0;
  const wrapped = rateLimitedFetch({
    key: 'test-burst',
    policy: { requestsPerMinute: 60, burst: 3 },
    fetchImpl: async () => { calls++; return new Response('ok'); },
    clock: () => now,
  });
  await wrapped('https://x');
  await wrapped('https://x');
  await wrapped('https://x');
  assert.equal(calls, 3);
});

test('rate-limit throws when bucket exhausted past deadline', async () => {
  _resetRateLimitState();
  let now = 1_000_000;
  // Sleeper advances the simulated clock; once clock crosses the
  // 30s deadline, the next retry throws.
  const sleep = async (ms) => { now += ms; };
  const wrapped = rateLimitedFetch({
    key: 'test-exhaust',
    policy: { requestsPerHour: 1, burst: 1 },
    fetchImpl: async () => new Response('ok'),
    clock: () => now,
    sleep,
  });
  await wrapped('https://x');     // burns the burst
  await assert.rejects(() => wrapped('https://x'), /exhausted/);
});
