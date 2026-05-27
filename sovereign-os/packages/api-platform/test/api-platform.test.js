import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateApiKey, hashKey, verifyKey, parseKeyEnv } from '../dist/keys.js';
import { issueToken, verifyToken } from '../dist/tokens.js';
import { hasScope } from '../dist/scopes.js';
import { evaluateRate } from '../dist/usage.js';
import { generateVaultKey, encryptSecret, decryptSecret } from '../dist/vault.js';
import { buildDelivery, verifyWebhookSignature, signWebhook } from '../dist/webhooks.js';
import { buildAuthorizeUrl, randomState, exchangeCodeForToken, OAUTH_PROVIDERS } from '../dist/oauth.js';

test('api keys: issue/hash/verify', () => {
  const k = generateApiKey('live');
  assert.ok(k.key.startsWith('sov_live_'));
  assert.equal(parseKeyEnv(k.key), 'live');
  assert.equal(hashKey(k.key).length, 64);
  assert.equal(verifyKey(k.key, k.hash), true);
  assert.equal(verifyKey('sov_live_wrong', k.hash), false);
});

test('tokens: sign/verify, reject tamper/wrong-secret/expired', () => {
  const t = issueToken({ sub: 'c1', scopes: ['publish'] }, 'secret', 3600);
  const p = verifyToken(t, 'secret');
  assert.equal(p.sub, 'c1');
  assert.equal(verifyToken(t.slice(0, -2) + 'zz', 'secret'), null);
  assert.equal(verifyToken(t, 'other'), null);
  assert.equal(verifyToken(issueToken({ sub: 'x' }, 'secret', -10), 'secret'), null);
});

test('scopes: wildcard + explicit', () => {
  assert.equal(hasScope(['publish'], 'publish'), true);
  assert.equal(hasScope(['*'], 'keys:manage'), true);
  assert.equal(hasScope(['publish'], 'keys:manage'), false);
});

test('usage: rate evaluation', () => {
  assert.equal(evaluateRate(18, { limit: 20, windowSeconds: 60 }).exceeded, false);
  assert.equal(evaluateRate(20, { limit: 20, windowSeconds: 60 }).exceeded, true);
  assert.equal(evaluateRate(5, { limit: 20, windowSeconds: 60 }).remaining, 15);
});

test('vault: roundtrip + wrong key rejected', () => {
  const key = generateVaultKey();
  const enc = encryptSecret('token-abc', key);
  assert.equal(enc.split('.').length, 3);
  assert.equal(decryptSecret(enc, key), 'token-abc');
  assert.throws(() => decryptSecret(enc, generateVaultKey()));
});

test('webhooks: sign/verify + tamper rejection', () => {
  const d = buildDelivery('post.published', { id: 'p1' }, 'whsec');
  assert.ok(d.headers['X-Sovereign-Signature'].startsWith('sha256='));
  assert.equal(verifyWebhookSignature(d.body, d.headers['X-Sovereign-Signature'], 'whsec'), true);
  assert.equal(verifyWebhookSignature(d.body + 'x', d.headers['X-Sovereign-Signature'], 'whsec'), false);
  assert.equal(signWebhook('a', 's'), signWebhook('a', 's'));
});

test('oauth: authorize url + code exchange (injected fetch)', async () => {
  const st = randomState();
  const url = buildAuthorizeUrl('linkedin', { clientId: 'id', redirectUri: 'https://cb', state: st });
  assert.ok(url.startsWith(OAUTH_PROVIDERS.linkedin.authorizeUrl));
  assert.ok(url.includes(`state=${st}`));
  assert.throws(() => buildAuthorizeUrl('nope', { clientId: 'a', redirectUri: 'b', state: 'c' }));

  const okFetch = async () => ({ ok: true, json: async () => ({ access_token: 'tok', expires_in: 60 }) });
  const t = await exchangeCodeForToken('x', { code: 'c', clientId: 'i', clientSecret: 's', redirectUri: 'r' }, okFetch);
  assert.equal(t.access_token, 'tok');
  const failFetch = async () => ({ ok: false, status: 400, json: async () => ({}) });
  await assert.rejects(() => exchangeCodeForToken('x', { code: 'c', clientId: 'i', clientSecret: 's', redirectUri: 'r' }, failFetch));
});
