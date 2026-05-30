import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFeed } from '../dist/parse/rss.js';
import { stripHtml } from '../dist/parse/strip-html.js';

const RSS_SAMPLE = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Demo Feed</title>
    <link>https://example.org</link>
    <item>
      <title>Ministry briefs cabinet</title>
      <link>https://example.org/news/1</link>
      <description><![CDATA[<p>Full briefing held Tuesday.</p>]]></description>
      <pubDate>Tue, 21 May 2026 10:30:00 +0000</pubDate>
      <guid>https://example.org/news/1</guid>
      <category>government</category>
      <category>cabinet</category>
    </item>
    <item>
      <title>Markets close higher</title>
      <link>https://example.org/news/2</link>
      <description>Markets gained 1.2%</description>
      <pubDate>Tue, 21 May 2026 16:00:00 +0000</pubDate>
    </item>
  </channel>
</rss>`;

const ATOM_SAMPLE = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Demo Atom</title>
  <entry>
    <title>Treaty signed in Geneva</title>
    <link href="https://example.org/atom/1"/>
    <id>atom-1</id>
    <updated>2026-05-21T09:00:00Z</updated>
    <summary>Five parties signed the treaty this morning.</summary>
  </entry>
</feed>`;

test('parseFeed handles RSS 2.0 with CDATA and pubDate', () => {
  const feed = parseFeed(RSS_SAMPLE);
  assert.equal(feed.format, 'rss');
  assert.equal(feed.title, 'Demo Feed');
  assert.equal(feed.items.length, 2);
  assert.equal(feed.items[0].title, 'Ministry briefs cabinet');
  assert.equal(feed.items[0].link, 'https://example.org/news/1');
  assert.ok(feed.items[0].description?.includes('Full briefing'));
  assert.ok(feed.items[0].publishedAt?.startsWith('2026-05-21'));
  assert.deepEqual(feed.items[0].categories, ['government', 'cabinet']);
});

test('parseFeed handles Atom with link href', () => {
  const feed = parseFeed(ATOM_SAMPLE);
  assert.equal(feed.format, 'atom');
  assert.equal(feed.items.length, 1);
  assert.equal(feed.items[0].title, 'Treaty signed in Geneva');
  assert.equal(feed.items[0].link, 'https://example.org/atom/1');
  assert.ok(feed.items[0].publishedAt?.startsWith('2026-05-21'));
});

test('parseFeed surfaces unknown format gracefully', () => {
  const feed = parseFeed('<html><body>not a feed</body></html>');
  assert.equal(feed.format, 'unknown');
  assert.equal(feed.items.length, 0);
});

test('stripHtml decodes common entities and strips tags', () => {
  const s = stripHtml('<p>Five &amp; six &#8211; done.</p>');
  assert.equal(s, 'Five & six – done.');
});
