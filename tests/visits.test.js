import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/visits.js';

function makeMockKV(initial = null) {
  const store = new Map();
  if (initial !== null) store.set('count', initial);
  return {
    store,
    get: async (key) => store.get(key) ?? null,
    put: async (key, value) => {
      store.set(key, value);
    },
  };
}

function getReq() {
  return new Request('https://example.com/api/visits');
}

test('GET /api/visits returns 1 on first call (empty KV)', async () => {
  const kv = makeMockKV();
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  const body = await response.json();
  assert.deepEqual(body, { visits: 1 });
  assert.equal(kv.store.get('count'), '1');
});

test('GET /api/visits increments existing count', async () => {
  const kv = makeMockKV('5');
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body, { visits: 6 });
  assert.equal(kv.store.get('count'), '6');
});

test('GET /api/visits tolerates non-numeric KV value (treats as 0)', async () => {
  const kv = makeMockKV('not-a-number');
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  const body = await response.json();
  assert.deepEqual(body, { visits: 1 });
});

test('GET /api/visits returns 503 when VISITS binding is missing', async () => {
  const response = await onRequest({ request: getReq(), env: {} });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.ok(body.error);
});

test('POST /api/visits returns 405 with Allow: GET', async () => {
  const kv = makeMockKV('5');
  const response = await onRequest({
    request: new Request('https://example.com/api/visits', { method: 'POST' }),
    env: { VISITS: kv },
  });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('Allow'), 'GET');
  // Counter must not have been incremented.
  assert.equal(kv.store.get('count'), '5');
});
