import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adapters, liveAdapters } from '../dist/registry.js';
import { publishCampaign } from '../dist/dispatcher.js';
import { dueCampaigns, isDue } from '../dist/scheduler.js';
import { credentialEnv } from '../dist/credentials.js';
import { processDueCampaigns } from '../dist/worker.js';

test('registry: 11 platforms, 8 implemented / 3 seams', async () => {
  assert.equal(Object.keys(adapters).length, 11);
  const seams = [];
  for (const p of Object.keys(adapters)) {
    const r = await adapters[p].publish({ id: '1', channel: p, title: 't', body: 'b' }, {});
    if (r.error && r.error.includes('not yet implemented')) seams.push(p);
  }
  assert.deepEqual(seams.sort(), ['tiktok', 'whatsapp', 'youtube']);
});

test('registry: liveAdapters gated by env', () => {
  assert.deepEqual(liveAdapters({}), []);
  assert.deepEqual(liveAdapters({ TELEGRAM_BOT_TOKEN: 'a', TELEGRAM_CHAT_ID: 'b' }), ['telegram']);
});

test('dispatcher: dormant + unknown channel', async () => {
  const dormant = await publishCampaign({ id: '1', channel: 'telegram', title: 't' }, {});
  assert.equal(dormant.dormant, true);
  const unknown = await publishCampaign({ id: '2', channel: 'mastodon', title: 't' }, {});
  assert.equal(unknown.ok, false);
  assert.match(unknown.error, /unknown channel/);
});

test('scheduler: dueCampaigns by time + status', () => {
  const now = new Date('2026-05-27T12:00:00Z');
  assert.equal(isDue({ id: 'a', channel: 'x', status: 'scheduled', scheduled_at: '2026-05-27T10:00:00Z' }, now), true);
  assert.equal(isDue({ id: 'b', channel: 'x', status: 'scheduled', scheduled_at: '2026-05-27T14:00:00Z' }, now), false);
  assert.equal(isDue({ id: 'c', channel: 'x', status: 'published' }, now), false);
  const due = dueCampaigns(
    [
      { id: 'a', channel: 'x', status: 'scheduled', scheduled_at: '2026-05-27T10:00:00Z' },
      { id: 'b', channel: 'x', status: 'scheduled', scheduled_at: '2026-05-27T14:00:00Z' },
    ],
    now,
  );
  assert.deepEqual(due.map((c) => c.id), ['a']);
});

test('credentials: maps decrypted connections to adapter env', () => {
  const env = credentialEnv([
    { platform: 'telegram', access_token: 'BOT', meta: { chat_id: '@c' } },
    { platform: 'linkedin', access_token: 'LI', meta: { author_urn: 'urn:li:person:1' } },
    { platform: 'unknownnet', access_token: 'x' },
  ]);
  assert.equal(env.TELEGRAM_BOT_TOKEN, 'BOT');
  assert.equal(env.TELEGRAM_CHAT_ID, '@c');
  assert.equal(env.LINKEDIN_AUTHOR_URN, 'urn:li:person:1');
});

test('worker: processDueCampaigns tallies + catches errors', async () => {
  const saved = [];
  const summary = await processDueCampaigns({
    loadDue: async () => [
      { id: 'a', channel: 'telegram', title: 'A' },
      { id: 'b', channel: 'x', title: 'B' },
    ],
    publish: async (c) =>
      c.channel === 'telegram' ? { ok: true, platform: 'telegram', externalId: '1' } : { ok: false, platform: 'x', dormant: true },
    onResult: async (c, r) => saved.push([c.id, r.ok]),
  });
  assert.deepEqual(summary, { processed: 2, published: 1, failed: 0, dormant: 1, results: summary.results });
  assert.equal(saved.length, 2);

  const errSummary = await processDueCampaigns({
    loadDue: async () => [{ id: 'c', channel: 'bluesky' }],
    publish: async () => { throw new Error('boom'); },
    onResult: async () => {},
  });
  assert.equal(errSummary.failed, 1);
});
