import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hackerNewsConnector, rssConnector, gdeltDocConnector } from '../dist/index.js';

const ctx = (fetchImpl) => ({
  sourceId: 'src-1',
  tenantId: 'tenant-1',
  limit: 5,
  now: () => new Date('2026-05-30T12:00:00Z'),
  fetch: fetchImpl,
  logger: { debug() {}, info() {}, warn() {}, error() {} },
});

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), { status: init.status ?? 200, headers: { 'content-type': 'application/json' } });
}

function textResponse(body, init = {}) {
  return new Response(body, { status: init.status ?? 200, headers: { 'content-type': init.contentType ?? 'text/plain' } });
}

test('hackerNewsConnector normalizes items into signals', async () => {
  let callCount = 0;
  const fetchMock = async (url) => {
    callCount++;
    if (url.endsWith('/topstories.json')) return jsonResponse([1, 2, 3]);
    if (url.endsWith('/1.json')) return jsonResponse({ id: 1, type: 'story', title: 'Story A', url: 'https://a.example/x', time: 1748599200, by: 'alice', score: 42 });
    if (url.endsWith('/2.json')) return jsonResponse({ id: 2, type: 'story', title: 'Story B', url: 'https://b.example/y', time: 1748602800, by: 'bob', score: 7 });
    if (url.endsWith('/3.json')) return jsonResponse({ id: 3, type: 'comment' });   // should be filtered
    return jsonResponse({}, { status: 404 });
  };
  const result = await hackerNewsConnector.pull(ctx(fetchMock));
  assert.equal(result.signals.length, 2);
  assert.equal(result.raws.length, 2);
  assert.equal(result.signals[0].signalClass, 'social_post');
  assert.equal(result.signals[0].title, 'Story A');
  assert.ok(callCount >= 4);
});

test('rssConnector throws without feed_url config', async () => {
  await assert.rejects(
    () => rssConnector.pull(ctx(async () => textResponse(''))),
    /feed_url/,
  );
});

test('rssConnector parses a feed and emits signals', async () => {
  const xml = `<?xml version="1.0"?><rss version="2.0"><channel><title>x</title>
    <item><title>One</title><link>https://example.org/1</link><pubDate>Tue, 21 May 2026 10:30:00 +0000</pubDate></item>
    <item><title>Two</title><link>https://example.org/2</link><description>body</description></item>
  </channel></rss>`;
  const result = await rssConnector.pull(
    ctx(async () => textResponse(xml, { contentType: 'application/xml' })),
    { feed_url: 'https://example.org/feed.xml' },
  );
  assert.equal(result.signals.length, 2);
  assert.equal(result.signals[0].title, 'One');
  assert.equal(result.signals[0].canonicalUrl, 'https://example.org/1');
});

test('gdeltDocConnector parses ArtList JSON', async () => {
  const articles = {
    articles: [
      { url: 'https://news-a.example/story', title: 'News A', seendate: '20260530T120000Z', domain: 'news-a.example', language: 'English', sourcecountry: 'US' },
      { url: 'https://news-b.example/story', title: 'News B', seendate: '20260530T120500Z', domain: 'news-b.example', language: 'English', sourcecountry: 'UK' },
    ],
  };
  const result = await gdeltDocConnector.pull(
    ctx(async () => jsonResponse(articles)),
    { query: 'lang:eng', maxrecords: 50 },
  );
  assert.equal(result.signals.length, 2);
  assert.equal(result.signals[0].signalClass, 'news_article');
  assert.equal(result.signals[0].language, 'en');
  assert.equal(result.signals[0].publishedAt, '2026-05-30T12:00:00Z');
  assert.deepEqual(result.signals[0].geoFocus, { countries: ['US'] });
});

test('connectors produce deduplicating content hashes', async () => {
  const fetchMock = async (url) => {
    if (url.endsWith('/topstories.json')) return jsonResponse([1]);
    if (url.endsWith('/1.json')) return jsonResponse({ id: 1, type: 'story', title: 'X', url: 'https://a.example/y', time: 1748599200 });
    return jsonResponse({});
  };
  const first  = await hackerNewsConnector.pull(ctx(fetchMock));
  const second = await hackerNewsConnector.pull(ctx(fetchMock));
  assert.equal(first.signals[0].contentHash, second.signals[0].contentHash);
});
