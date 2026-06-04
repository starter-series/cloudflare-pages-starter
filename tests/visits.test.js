import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/visits.js';

// TODO(2nd-pass-audit-2026-05-21): import COUNTER_KEY from ../functions/api/visits.js
// instead of hardcoding 'count' here. Currently the test silently passes if the
// implementation renames the key — drift waiting to happen.
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

// A KV whose get and/or put reject, modelling a transient runtime failure
// (network blip / quota / backend error). Used to assert the 503 degradation
// path instead of a raw uncaught 500.
function makeThrowingKV({ throwOn = 'get', initial = null } = {}) {
  const store = new Map();
  if (initial !== null) store.set('count', initial);
  const boom = () => {
    throw new Error('KV backend exploded');
  };
  return {
    store,
    get: async (key) => {
      if (throwOn === 'get' || throwOn === 'both') boom();
      return store.get(key) ?? null;
    },
    put: async (key, value) => {
      if (throwOn === 'put' || throwOn === 'both') boom();
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

test('GET /api/visits success path carries the documented headers', async () => {
  // Contract the client depends on: the 200 path is uncacheable (no-store) and
  // advertises the eventual-consistency semantics. If either header is dropped
  // the client can no longer distinguish the contract and this test fails.
  const kv = makeMockKV('41');
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-counter-consistency'), 'eventual');
  // A clean increment must NOT claim recovery.
  assert.equal(response.headers.get('x-counter-recovered'), null);
});

test('GET /api/visits tolerates non-numeric KV value (treats as corruption, recovers to 1)', async () => {
  const kv = makeMockKV('not-a-number');
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  const body = await response.json();
  assert.deepEqual(body, { visits: 1 });
  assert.equal(response.headers.get('x-counter-recovered'), 'true');
});

test('GET /api/visits treats partial-numeric KV value as corruption (NOT 123)', async () => {
  // Pre-fix bug: parseInt('123abc',10) returned 123 silently, so the
  // response would say { visits: 124 } and no recovery header. After the
  // /^\d+$/ gate the value is rejected and the counter resets to 1.
  const kv = makeMockKV('123abc');
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  const body = await response.json();
  assert.deepEqual(body, { visits: 1 });
  assert.equal(response.headers.get('x-counter-recovered'), 'true');
});

test('GET /api/visits treats negative KV value as corruption (counter cannot decrease)', async () => {
  // Pre-fix bug: parseInt('-5',10) returned -5; recovered was false because
  // -5 is finite, so the response would be { visits: -4 }. After the gate
  // the negative value triggers recovery.
  const kv = makeMockKV('-5');
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  const body = await response.json();
  assert.deepEqual(body, { visits: 1 });
  assert.equal(response.headers.get('x-counter-recovered'), 'true');
});

test('GET /api/visits does NOT reset a valid number with incidental whitespace', async () => {
  // Regression for the recovery bug: a value written with a trailing newline
  // (e.g. some tooling pipes `echo 50000`) is still a valid count. Pre-fix the
  // raw `/^\d+$/` test failed on '50000\n' and reset the counter to 1, silently
  // wiping 50k views. Post-fix we trim first, so it increments to 50001 and
  // does NOT claim recovery.
  for (const padded of ['50000\n', ' 50000', '50000\t', '\r\n 50000 \n']) {
    const kv = makeMockKV(padded);
    const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
    assert.equal(response.status, 200, `status for ${JSON.stringify(padded)}`);
    const body = await response.json();
    assert.deepEqual(body, { visits: 50001 }, `body for ${JSON.stringify(padded)}`);
    assert.equal(
      response.headers.get('x-counter-recovered'),
      null,
      `whitespace value ${JSON.stringify(padded)} must not trigger recovery`,
    );
    assert.equal(kv.store.get('count'), '50001');
  }
});

test('GET /api/visits is exact above Number.MAX_SAFE_INTEGER (no lossy float)', async () => {
  // Pre-fix bug: `parseInt(...) + 1` runs through IEEE-754 doubles, so at
  // 2^53 the `+ 1` is silently dropped:
  //   Number('9007199254740992') + 1 === 9007199254740992  (unchanged!)
  // BigInt math increments exactly. Above MAX_SAFE_INTEGER the wire value is a
  // decimal string (a JSON number could not represent it without precision
  // loss), and the stored value is the exact successor.
  const huge = '9007199254740992'; // 2^53
  const kv = makeMockKV(huge);
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.visits, '9007199254740993'); // exact successor, not 9007199254740992
  assert.equal(kv.store.get('count'), '9007199254740993');
});

test('GET /api/visits at exactly MAX_SAFE_INTEGER still serializes as a JSON number', async () => {
  // Boundary: the largest value that round-trips as a JS number must stay a
  // number on the wire (the client checks `typeof data.visits === 'number'`).
  const kv = makeMockKV(String(Number.MAX_SAFE_INTEGER - 1)); // 9007199254740990
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  const body = await response.json();
  assert.equal(typeof body.visits, 'number');
  assert.equal(body.visits, Number.MAX_SAFE_INTEGER); // 9007199254740991
});

test('GET /api/visits returns 503 (not 500) when KV get throws', async () => {
  // A throwing KV.get must degrade to the documented 503, NOT bubble up as an
  // uncaught 500. Pre-fix the `await env.VISITS.get(...)` was unguarded, so the
  // exception escaped onRequest and the platform returned a raw 500.
  const kv = makeThrowingKV({ throwOn: 'get' });
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.ok(body.error, 'a 503 must carry an error message');
  // Same contract header as the success/ missing-binding paths.
  assert.equal(response.headers.get('x-counter-consistency'), 'eventual');
});

test('GET /api/visits returns 503 (not 500) when KV put throws', async () => {
  // The read succeeded but the write failed: the increment did not persist, so
  // a 200 would be a lie. Degrade to 503 instead of a 500 or a false success.
  const kv = makeThrowingKV({ throwOn: 'put', initial: '7' });
  const response = await onRequest({ request: getReq(), env: { VISITS: kv } });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.ok(body.error);
  assert.equal(response.headers.get('x-counter-consistency'), 'eventual');
  // The store must be unchanged (write threw before committing).
  assert.equal(kv.store.get('count'), '7');
});

test('missing-binding 503 carries the same consistency header as the success path', async () => {
  const response = await onRequest({ request: getReq(), env: {} });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('x-counter-consistency'), 'eventual');
  const body = await response.json();
  assert.ok(body.error);
});

test('GET /api/visits returns 503 when VISITS binding is missing', async () => {
  const response = await onRequest({ request: getReq(), env: {} });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.ok(body.error);
});

test('interleaved concurrent GETs exhibit the documented lost-update (last write wins)', async () => {
  // KV has no compare-and-swap. This test pins the *documented* best-effort
  // semantics: when two requests interleave read-before-either-writes, one
  // increment is lost (both read N, both write N+1). It is a behavioural
  // contract test, not an aspiration — if someone "fixes" the function to be
  // atomic (e.g. swaps in a Durable Object) this test should be updated
  // alongside that change, and the header contract revisited.
  //
  // We force a real interleave by making get/put await a controllable tick so
  // both handlers read the same starting value before either writes.
  let store = '10';
  const gate = { release: null };
  const pending = new Promise((r) => {
    gate.release = r;
  });
  let getsSeen = 0;

  const kv = {
    store: { get: () => store }, // for assertion convenience below
    get: async () => {
      getsSeen += 1;
      // Hold the first reader until the second reader has also read, so both
      // observe '10' before either writes.
      if (getsSeen < 2) await pending;
      else gate.release();
      return store;
    },
    put: async (_key, value) => {
      store = value;
    },
  };

  const a = onRequest({ request: getReq(), env: { VISITS: kv } });
  const b = onRequest({ request: getReq(), env: { VISITS: kv } });
  const [ra, rb] = await Promise.all([a, b]);
  const [ba, bb] = await Promise.all([ra.json(), rb.json()]);

  // Both requests read 10 and both wrote 11 → one increment lost.
  assert.deepEqual(
    [ba.visits, bb.visits].sort((x, y) => x - y),
    [11, 11],
    'both interleaved requests should compute 11 (lost update)',
  );
  // Final stored value reflects the lost update: 11, not 12.
  assert.equal(store, '11', 'last-write-wins leaves 11, proving one increment was lost');
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
